/**
 * useCreditScore Hook
 * 
 * React hook for fetching and managing credit scores
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import type { CreditScore, CalculateCreditScoreResponse } from '@/lib/creditScore/types';

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
   * Get score range info
   */
  const getScoreRangeInfo = useCallback(() => {
    if (!creditScore) return null;

    const score = creditScore.score;

    if (score >= 800) {
      return {
        range: '800-1000',
        label: 'Excellent',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        description: 'Outstanding credit profile',
        borrowingLimit: 10000,
      };
    } else if (score >= 650) {
      return {
        range: '650-799',
        label: 'Good',
        color: 'text-success-600 dark:text-success-400',
        bgColor: 'bg-success-100 dark:bg-success-900/20',
        description: 'Strong credit profile',
        borrowingLimit: 5000,
      };
    } else if (score >= 500) {
      return {
        range: '500-649',
        label: 'Fair',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        description: 'Acceptable credit profile',
        borrowingLimit: 2000,
      };
    } else if (score >= 350) {
      return {
        range: '350-499',
        label: 'Poor',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        description: 'Limited credit history',
        borrowingLimit: 500,
      };
    } else {
      return {
        range: '0-349',
        label: 'Very Poor',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        description: 'Insufficient history',
        borrowingLimit: 100,
      };
    }
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
