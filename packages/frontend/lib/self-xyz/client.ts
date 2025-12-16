/**
 * Self.xyz Client
 *
 * Service layer for Self.xyz identity verification
 * Handles QR code generation, verification polling, and result processing
 */

import { SelfAppBuilder, countries } from '@selfxyz/qrcode';
import type {
  VerificationStatus,
  UserVerificationState,
  SelfVerificationResult,
  VerificationEvent,
} from './config';
import {
  SELF_API_CONFIG,
  VERIFICATION_REQUIREMENTS,
  SELF_XYZ_SCORE_BOOSTS,
  POLLING_CONFIG,
} from './config';

/**
 * Self.xyz Client for managing identity verification
 */
export class SelfXyzClient {
  private verificationState: UserVerificationState | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<VerificationEvent, Set<(data?: any) => void>> = new Map();

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Initialize from local storage if available
   */
  private initializeFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('self-xyz-verification');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.verificationState = {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }
    } catch (error) {
      console.error('Error loading Self.xyz verification state:', error);
      localStorage.removeItem('self-xyz-verification');
    }
  }

  /**
   * Save verification state to local storage
   */
  private saveState(): void {
    if (typeof window === 'undefined' || !this.verificationState) return;

    try {
      localStorage.setItem('self-xyz-verification', JSON.stringify(this.verificationState));
    } catch (error) {
      console.error('Error saving Self.xyz verification state:', error);
    }
  }

  /**
   * Generate QR code for verification
   * @param address User's wallet address
   * @returns QR code data string
   */
  async generateQRCode(address: string): Promise<string> {
    try {
      console.log('🔐 Generating Self.xyz verification QR code...');

      // Create verification ID (unique per attempt)
      const verificationId = `${address}-${Date.now()}`;

      // Build Self app configuration using the real SDK
      const selfApp = new SelfAppBuilder({
        version: 2,
        appName: SELF_API_CONFIG.appName,
        scope: SELF_API_CONFIG.scope,
        endpoint: SELF_API_CONFIG.backendUrl,
        endpointType: process.env.NODE_ENV === 'production' ? 'celo' : 'staging_celo',
        userIdType: 'hex', // For Ethereum addresses
        disclosures: [
          {
            key: 'humanity',
            required: VERIFICATION_REQUIREMENTS.requiredDisclosures.humanity,
          },
          {
            key: 'age',
            required: VERIFICATION_REQUIREMENTS.requiredDisclosures.age,
            minimumAge: VERIFICATION_REQUIREMENTS.minimumAge,
          },
          {
            key: 'nationality',
            required: VERIFICATION_REQUIREMENTS.requiredDisclosures.nationality,
            allowedCountries: VERIFICATION_REQUIREMENTS.allowedCountries,
            blockedCountries: VERIFICATION_REQUIREMENTS.blockedCountries,
          }
        ],
        // Additional context for the verification
        context: {
          address,
          verificationId,
          timestamp: Date.now(),
        }
      });

      // Build the app and get QR data
      const app = selfApp.build();
      const qrData = app.generateQRCode();

      // Update state
      this.verificationState = {
        status: 'qr_generated',
        verificationId,
        qrData,
        lastUpdated: new Date(),
      };

      this.saveState();
      this.emit(VerificationEvent.QR_GENERATED, { verificationId, qrData });

      console.log('✅ QR code generated successfully');
      return qrData;
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate QR code'
      );
    }
  }

  /**
   * Start polling for verification status
   * @param address User's wallet address
   */
  startVerificationPolling(address: string): void {
    if (this.pollingInterval) {
      this.stopVerificationPolling();
    }

    let attempts = 0;

    this.pollingInterval = setInterval(async () => {
      attempts++;

      try {
        const status = await this.checkVerificationStatus(address);

        if (status.verified) {
          this.handleVerificationSuccess(status);
          this.stopVerificationPolling();
        } else if (attempts >= POLLING_CONFIG.maxAttempts) {
          this.handleVerificationTimeout();
          this.stopVerificationPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);

        if (attempts >= POLLING_CONFIG.maxAttempts) {
          this.handleVerificationTimeout();
          this.stopVerificationPolling();
        }
      }
    }, POLLING_CONFIG.interval);

    // Update status to scanning
    if (this.verificationState) {
      this.verificationState.status = 'scanning';
      this.saveState();
      this.emit(VerificationEvent.SCAN_STARTED);
    }

    console.log('🔄 Started polling for verification status');
  }

  /**
   * Stop polling for verification status
   */
  stopVerificationPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏸️ Stopped polling for verification status');
    }
  }

  /**
   * Check verification status from backend
   * @param address User's wallet address
   */
  private async checkVerificationStatus(address: string): Promise<any> {
    const response = await fetch(
      `/api/self-xyz/status?address=${address}&verificationId=${this.verificationState?.verificationId}`
    );

    if (!response.ok) {
      throw new Error('Failed to check verification status');
    }

    return response.json();
  }

  /**
   * Handle successful verification
   */
  private handleVerificationSuccess(result: SelfVerificationResult): void {
    console.log('✅ Verification successful!', result);

    this.verificationState = {
      status: 'verified',
      verificationId: this.verificationState?.verificationId,
      result,
      lastUpdated: new Date(),
    };

    this.saveState();
    this.emit(VerificationEvent.VERIFICATION_SUCCESS, result);
  }

  /**
   * Handle verification timeout
   */
  private handleVerificationTimeout(): void {
    console.log('⏱️ Verification timeout');

    if (this.verificationState) {
      this.verificationState.status = 'expired';
      this.verificationState.error = 'Verification timeout - please try again';
      this.saveState();
    }

    this.emit(VerificationEvent.TIMEOUT);
  }

  /**
   * Get current verification state
   */
  getVerificationState(): UserVerificationState | null {
    return this.verificationState;
  }

  /**
   * Calculate score boost based on verification level
   */
  calculateScoreBoost(result: SelfVerificationResult): number {
    let boost = 0;

    // Basic humanity verification
    if (result.disclosures.isHuman) {
      boost = SELF_XYZ_SCORE_BOOSTS.HUMANITY_VERIFIED;
    }

    // Full verification (age + nationality)
    if (result.disclosures.age && result.disclosures.nationality) {
      boost = SELF_XYZ_SCORE_BOOSTS.FULL_VERIFICATION;
    }

    // Premium verification (all fields)
    if (
      result.disclosures.name &&
      result.disclosures.birthDate &&
      result.disclosures.age &&
      result.disclosures.nationality
    ) {
      boost = SELF_XYZ_SCORE_BOOSTS.PREMIUM_VERIFICATION;
    }

    return boost;
  }

  /**
   * Event listener management
   */
  on(event: VerificationEvent, callback: (data?: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: VerificationEvent, callback: (data?: any) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: VerificationEvent, data?: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Reset verification state
   */
  reset(): void {
    this.stopVerificationPolling();
    this.verificationState = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('self-xyz-verification');
    }

    console.log('🔄 Verification state reset');
  }
}

// Singleton instance
let clientInstance: SelfXyzClient | null = null;

/**
 * Get Self.xyz client instance
 */
export function getSelfXyzClient(): SelfXyzClient {
  if (!clientInstance) {
    clientInstance = new SelfXyzClient();
  }
  return clientInstance;
}