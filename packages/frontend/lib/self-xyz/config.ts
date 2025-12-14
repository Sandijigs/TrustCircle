/**
 * Self.xyz Configuration
 *
 * Configuration for Self.xyz identity verification integration
 * Self.xyz uses QR code scanning with mobile app for verification
 */

/**
 * Self.xyz API Configuration
 */
export const SELF_API_CONFIG = {
  // Backend verification endpoint (will be your API route)
  backendUrl:
    process.env.NEXT_PUBLIC_SELF_BACKEND_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api/self-xyz/verify`
      : 'http://localhost:3000/api/self-xyz/verify'),

  // Self.xyz app configuration
  appName: 'TrustCircle',
  appDescription: 'Web3 Micro-Lending Platform on Celo',

  // Verification scope
  scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'trustcircle-verification',

  // Development mode (uses mock passports for testing)
  devMode: process.env.NODE_ENV === 'development',
} as const;

/**
 * Verification requirements for TrustCircle
 */
export const VERIFICATION_REQUIREMENTS = {
  // Age verification
  minimumAge: 18,

  // Country restrictions (empty = allow all)
  allowedCountries: [] as string[], // e.g., ['US', 'GB', 'CA']
  blockedCountries: [] as string[], // e.g., ['KP', 'IR']

  // Required disclosures from user
  requiredDisclosures: {
    age: true,
    nationality: true,
    humanity: true, // Proves they're a real person
  },

  // Optional disclosures
  optionalDisclosures: {
    name: false,
    birthDate: false,
    documentNumber: false,
  },
} as const;

/**
 * Credit score boost for verification levels
 */
export const SELF_XYZ_SCORE_BOOSTS = {
  // Basic humanity proof (passed verification)
  HUMANITY_VERIFIED: 100,

  // Age + nationality verified
  FULL_VERIFICATION: 150,

  // Premium verification (all optional fields)
  PREMIUM_VERIFICATION: 225,
} as const;

/**
 * Verification status types
 */
export type VerificationStatus =
  | 'not_started'
  | 'qr_generated'
  | 'scanning'
  | 'verifying'
  | 'verified'
  | 'failed'
  | 'expired';

/**
 * Self.xyz verification result interface
 */
export interface SelfVerificationResult {
  verified: boolean;
  nullifier: string; // Unique identifier for the user (privacy-preserving)
  disclosures: {
    age?: number;
    nationality?: string;
    isHuman: boolean;
    name?: string;
    birthDate?: string;
  };
  timestamp: number;
  scoreBoost: number;
}

/**
 * User verification state
 */
export interface UserVerificationState {
  status: VerificationStatus;
  verificationId?: string;
  qrData?: string;
  result?: SelfVerificationResult;
  error?: string;
  lastUpdated: Date;
}

/**
 * QR code configuration
 */
export const QR_CODE_CONFIG = {
  size: 300,
  level: 'M' as 'L' | 'M' | 'Q' | 'H',
  includeMargin: true,
  fgColor: '#000000',
  bgColor: '#ffffff',
} as const;

/**
 * Polling configuration for verification status
 */
export const POLLING_CONFIG = {
  interval: 2000, // Poll every 2 seconds
  maxAttempts: 150, // Max 5 minutes (150 * 2s)
  timeout: 300000, // 5 minute timeout
} as const;

/**
 * Attestation types from Self.xyz
 */
export enum AttestationType {
  PASSPORT = 'passport',
  ID_CARD = 'id_card',
  AADHAAR = 'aadhaar',
}

/**
 * Verification event types
 */
export enum VerificationEvent {
  QR_GENERATED = 'qr_generated',
  SCAN_STARTED = 'scan_started',
  VERIFICATION_SUBMITTED = 'verification_submitted',
  VERIFICATION_SUCCESS = 'verification_success',
  VERIFICATION_FAILED = 'verification_failed',
  TIMEOUT = 'timeout',
}
