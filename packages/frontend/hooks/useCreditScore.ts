/**
 * useCreditScore Hook
 * 
 * React hook for fetching and managing credit scores
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { CreditScore, CalculateCreditScoreResponse } from '@/lib/creditScore/types';
import { getCreditTier, getNextTier, getScoreImprovementNeeded } from '@/lib/creditScore/config';

interface UseCreditScoreOptions {
  autoFetch?: boolean; // Automatically fetch on mount
  farcasterFID?: number;
}

export function useCreditScore(options: UseCreditScoreOptions = {}) {
  const { autoFetch = false, farcasterFID } = options;
  const { address } = useAccount();

  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const [isCached, setIsCached] = useState(false);

  /**
   * Fetch credit score from API
   */
  const fetchCreditScore = useCallback(async (forceRefresh = false) => {
    if (!address) {
      setError('No wallet connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/calculate-credit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          farcasterFID,
          forceRefresh,
        }),
      });

      const data: CalculateCreditScoreResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.success && data.creditScore) {
        setCreditScore(data.creditScore);
        setIsCached(data.cached);
        setRateLimitRemaining(data.rateLimitRemaining ?? null);
        return data.creditScore;
      } else {
        throw new Error(data.error || 'Failed to calculate credit score');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credit score';
      setError(errorMessage);
      console.error('Error fetching credit score:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, farcasterFID]);

  /**
   * Refresh credit score (bypass cache)
   */
  const refreshCreditScore = useCallback(async () => {
    return fetchCreditScore(true);
  }, [fetchCreditScore]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && address && !creditScore && !isLoading) {
      fetchCreditScore();
    }
  }, [autoFetch, address, creditScore, isLoading, fetchCreditScore]);

  /**
   * Get score range info using unified tier system
   */
  const getScoreRangeInfo = useCallback(() => {
    if (!creditScore) return null;

    const tier = getCreditTier(creditScore.score);
    const nextTier = getNextTier(creditScore.score);
    const improvementNeeded = getScoreImprovementNeeded(creditScore.score);

    return {
      range: `${tier.minScore}-${tier.maxScore}`,
      label: tier.label,
      color: tier.color,
      bgColor: tier.bgColor,
      description: tier.description,
      borrowingLimit: tier.borrowingLimit,
      emoji: tier.emoji,
      nextTier: nextTier ? {
        label: nextTier.label,
        borrowingLimit: nextTier.borrowingLimit,
        improvementNeeded,
      } : null,
    };
  }, [creditScore]);

  /**
   * Check if score needs refresh (expires in less than 1 hour)
   */
  const needsRefresh = useCallback(() => {
    if (!creditScore) return true;
    
    const expiresAt = new Date(creditScore.expiresAt);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    
    return expiresAt.getTime() - now.getTime() < oneHour;
  }, [creditScore]);

  /**
   * Get time until expiration
   */
  const getTimeUntilExpiration = useCallback(() => {
    if (!creditScore) return null;
    
    const expiresAt = new Date(creditScore.expiresAt);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Expired';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [creditScore]);

  return {
    // Data
    creditScore,
    isLoading,
    error,
    rateLimitRemaining,
    isCached,
    
    // Actions
    fetchCreditScore,
    refreshCreditScore,
    
    // Utilities
    getScoreRangeInfo,
    needsRefresh,
    getTimeUntilExpiration,
  };
}
