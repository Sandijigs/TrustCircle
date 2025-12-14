/**
 * Self.xyz Provider
 *
 * React context provider for Self.xyz identity verification
 * Manages verification state across the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { getSelfXyzClient } from '@/lib/self-xyz';
import type { UserVerificationState, SelfVerificationResult } from '@/lib/self-xyz/config';
import { VerificationEvent } from '@/lib/self-xyz/config';

interface SelfXyzContextValue {
  // Verification state
  verificationState: UserVerificationState | null;
  isVerified: boolean;
  scoreBoost: number;

  // Actions
  startVerification: () => Promise<void>;
  resetVerification: () => void;
  refreshState: () => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const SelfXyzContext = createContext<SelfXyzContextValue | undefined>(undefined);

interface SelfXyzProviderProps {
  children: ReactNode;
}

export function SelfXyzProvider({ children }: SelfXyzProviderProps) {
  const { address, isConnected } = useAccount();
  const [verificationState, setVerificationState] = useState<UserVerificationState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = getSelfXyzClient();

  /**
   * Load verification state
   */
  const loadVerificationState = useCallback(() => {
    const state = client.getVerificationState();
    setVerificationState(state);

    // Check if verified from backend
    if (address && isConnected) {
      fetchBackendVerificationStatus(address);
    }
  }, [client, address, isConnected]);

  /**
   * Fetch verification status from backend
   */
  const fetchBackendVerificationStatus = async (userAddress: string) => {
    try {
      const response = await fetch(`/api/self-xyz/user-status?address=${userAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.verified && data.result) {
          setVerificationState(prev => ({
            ...prev!,
            status: 'verified',
            result: data.result,
            lastUpdated: new Date(),
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch backend verification status:', err);
    }
  };

  /**
   * Start verification process
   */
  const startVerification = useCallback(async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await client.generateQRCode(address);
      client.startVerificationPolling(address);
      loadVerificationState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification');
    } finally {
      setIsLoading(false);
    }
  }, [address, client, loadVerificationState]);

  /**
   * Reset verification
   */
  const resetVerification = useCallback(() => {
    client.reset();
    setVerificationState(null);
    setError(null);
  }, [client]);

  /**
   * Refresh state
   */
  const refreshState = useCallback(() => {
    loadVerificationState();
  }, [loadVerificationState]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    const handleSuccess = (result: SelfVerificationResult) => {
      setVerificationState(prev => ({
        ...prev!,
        status: 'verified',
        result,
        lastUpdated: new Date(),
      }));
    };

    const handleTimeout = () => {
      setError('Verification timeout');
    };

    client.on(VerificationEvent.VERIFICATION_SUCCESS, handleSuccess);
    client.on(VerificationEvent.TIMEOUT, handleTimeout);

    return () => {
      client.off(VerificationEvent.VERIFICATION_SUCCESS, handleSuccess);
      client.off(VerificationEvent.TIMEOUT, handleTimeout);
    };
  }, [client]);

  /**
   * Load state when wallet connects
   */
  useEffect(() => {
    if (isConnected && address) {
      loadVerificationState();
    } else {
      setVerificationState(null);
    }
  }, [isConnected, address, loadVerificationState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      client.stopVerificationPolling();
    };
  }, [client]);

  const value: SelfXyzContextValue = {
    verificationState,
    isVerified: verificationState?.status === 'verified',
    scoreBoost: verificationState?.result?.scoreBoost || 0,
    startVerification,
    resetVerification,
    refreshState,
    isLoading,
    error,
  };

  return (
    <SelfXyzContext.Provider value={value}>
      {children}
    </SelfXyzContext.Provider>
  );
}

/**
 * Hook to use Self.xyz context
 */
export function useSelfXyz(): SelfXyzContextValue {
  const context = useContext(SelfXyzContext);

  if (context === undefined) {
    throw new Error('useSelfXyz must be used within a SelfXyzProvider');
  }

  return context;
}
