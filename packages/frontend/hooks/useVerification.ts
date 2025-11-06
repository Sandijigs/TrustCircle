/**
 * useVerification Hook
 * 
 * Manages user verification state and actions
 * Integrates with Holonym SDK and VerificationSBT contract
 * 
 * @example
 * ```tsx
 * const { 
 *   isVerified, 
 *   verificationLevel, 
 *   startVerification,
 *   checkStatus 
 * } = useVerification();
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';

// Verification levels
export enum VerificationLevel {
  NONE = 0,
  BASIC = 1,
  VERIFIED = 2,
  TRUSTED = 3,
}

export interface VerificationStatus {
  isVerified: boolean;
  level: VerificationLevel;
  tokenId?: number;
  verifiedAt?: Date;
  expiresAt?: Date;
  provider?: string;
  isExpired: boolean;
}

export interface VerificationRequirements {
  minLevel: VerificationLevel;
  reason: string;
  action: string;
}

// Contract ABI (minimal for our needs)
const VERIFICATION_SBT_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isUserVerified',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getVerificationLevel',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getVerification',
    outputs: [{
      components: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'user', type: 'address' },
        { name: 'level', type: 'uint256' },
        { name: 'verifiedAt', type: 'uint256' },
        { name: 'expiresAt', type: 'uint256' },
        { name: 'provider', type: 'string' },
        { name: 'verificationHash', type: 'string' },
        { name: 'isActive', type: 'bool' },
      ],
      name: '',
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'isExpired',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Contract address (update with actual deployed address)
const VERIFICATION_SBT_ADDRESS = VERIFICATION_SBT_ADDRESS

export function useVerification() {
  const { address, isConnected } = useAccount();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    isVerified: false,
    level: VerificationLevel.NONE,
    isExpired: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is verified
  const { data: isVerified, refetch: refetchVerified } = useContractRead({
    address: VERIFICATION_SBT_ADDRESS,
    abi: VERIFICATION_SBT_ABI,
    functionName: 'isUserVerified',
    args: address ? [address] : undefined,
    enabled: !!address && isConnected,
  });

  // Get verification level
  const { data: verificationLevel, refetch: refetchLevel } = useContractRead({
    address: VERIFICATION_SBT_ADDRESS,
    abi: VERIFICATION_SBT_ABI,
    functionName: 'getVerificationLevel',
    args: address ? [address] : undefined,
    enabled: !!address && isConnected && isVerified === true,
  });

  // Get full verification data
  const { data: verificationData, refetch: refetchData } = useContractRead({
    address: VERIFICATION_SBT_ADDRESS,
    abi: VERIFICATION_SBT_ABI,
    functionName: 'getVerification',
    args: address ? [address] : undefined,
    enabled: !!address && isConnected && isVerified === true,
  });

  // Check if verification is expired
  const { data: isExpired, refetch: refetchExpired } = useContractRead({
    address: VERIFICATION_SBT_ADDRESS,
    abi: VERIFICATION_SBT_ABI,
    functionName: 'isExpired',
    args: address ? [address] : undefined,
    enabled: !!address && isConnected && isVerified === true,
  });

  // Update verification status when data changes
  useEffect(() => {
    if (!isConnected || !address) {
      setVerificationStatus({
        isVerified: false,
        level: VerificationLevel.NONE,
        isExpired: false,
      });
      return;
    }

    if (isVerified && verificationData) {
      setVerificationStatus({
        isVerified: true,
        level: (verificationLevel as number) || VerificationLevel.NONE,
        tokenId: Number(verificationData.tokenId),
        verifiedAt: new Date(Number(verificationData.verifiedAt) * 1000),
        expiresAt: verificationData.expiresAt > 0 
          ? new Date(Number(verificationData.expiresAt) * 1000) 
          : undefined,
        provider: verificationData.provider,
        isExpired: isExpired === true,
      });
    } else {
      setVerificationStatus({
        isVerified: false,
        level: VerificationLevel.NONE,
        isExpired: false,
      });
    }
  }, [isConnected, address, isVerified, verificationLevel, verificationData, isExpired]);

  // Refresh verification status
  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        refetchVerified(),
        refetchLevel(),
        refetchData(),
        refetchExpired(),
      ]);
    } catch (err) {
      console.error('Error refreshing verification status:', err);
      setError('Failed to refresh verification status');
    } finally {
      setIsLoading(false);
    }
  }, [refetchVerified, refetchLevel, refetchData, refetchExpired]);

  // Start verification process
  const startVerification = useCallback((provider: 'holonym' | 'manual' = 'holonym') => {
    // This will be handled by the VerificationWizard component
    // We just return the necessary data
    return {
      provider,
      address,
      currentLevel: verificationStatus.level,
    };
  }, [address, verificationStatus.level]);

  // Check if user meets verification requirements
  const meetsRequirements = useCallback((requirements: VerificationRequirements): boolean => {
    if (!verificationStatus.isVerified) return false;
    if (verificationStatus.isExpired) return false;
    return verificationStatus.level >= requirements.minLevel;
  }, [verificationStatus]);

  // Get verification level name
  const getLevelName = useCallback((level: VerificationLevel): string => {
    switch (level) {
      case VerificationLevel.NONE:
        return 'Unverified';
      case VerificationLevel.BASIC:
        return 'Basic';
      case VerificationLevel.VERIFIED:
        return 'Verified';
      case VerificationLevel.TRUSTED:
        return 'Trusted';
      default:
        return 'Unknown';
    }
  }, []);

  // Get verification level color
  const getLevelColor = useCallback((level: VerificationLevel): string => {
    switch (level) {
      case VerificationLevel.NONE:
        return 'text-gray-500';
      case VerificationLevel.BASIC:
        return 'text-blue-500';
      case VerificationLevel.VERIFIED:
        return 'text-success-500';
      case VerificationLevel.TRUSTED:
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  }, []);

  // Get days until expiration
  const getDaysUntilExpiration = useCallback((): number | null => {
    if (!verificationStatus.expiresAt) return null;
    const now = new Date();
    const diff = verificationStatus.expiresAt.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [verificationStatus.expiresAt]);

  return {
    // Status
    verificationStatus,
    isVerified: verificationStatus.isVerified && !verificationStatus.isExpired,
    verificationLevel: verificationStatus.level,
    isExpired: verificationStatus.isExpired,
    isLoading,
    error,
    
    // Actions
    refreshStatus,
    startVerification,
    meetsRequirements,
    
    // Utilities
    getLevelName,
    getLevelColor,
    getDaysUntilExpiration,
  };
}

// Verification requirements for different actions
export const VERIFICATION_REQUIREMENTS = {
  BROWSE: {
    minLevel: VerificationLevel.NONE,
    reason: 'No verification required to browse',
    action: 'browse',
  },
  JOIN_CIRCLE: {
    minLevel: VerificationLevel.BASIC,
    reason: 'Basic verification required to join lending circles',
    action: 'join a circle',
  },
  DEPOSIT: {
    minLevel: VerificationLevel.BASIC,
    reason: 'Basic verification required to deposit funds',
    action: 'deposit funds',
  },
  BORROW_SMALL: {
    minLevel: VerificationLevel.VERIFIED,
    reason: 'Verified identity required to borrow up to $1,000',
    action: 'borrow funds',
  },
  BORROW_LARGE: {
    minLevel: VerificationLevel.TRUSTED,
    reason: 'Trusted verification required to borrow over $1,000',
    action: 'borrow large amounts',
  },
  LEND: {
    minLevel: VerificationLevel.VERIFIED,
    reason: 'Verified identity required to lend funds',
    action: 'lend funds',
  },
} as const;
