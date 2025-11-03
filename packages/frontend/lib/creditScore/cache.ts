/**
 * Credit Score Cache
 * 
 * In-memory cache for credit scores (24-hour TTL)
 * For production, consider using Redis
 */

import type { CreditScore, CacheEntry } from './types';

// In-memory cache storage
const cache = new Map<string, CacheEntry>();

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Cleanup interval: 1 hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// Start periodic cleanup
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(cleanup, CLEANUP_INTERVAL_MS);
}

/**
 * Get cached credit score
 */
export function getCachedScore(walletAddress: string): CreditScore | null {
  const key = getCacheKey(walletAddress);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (new Date() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.creditScore;
}

/**
 * Set cached credit score
 */
export function setCachedScore(
  walletAddress: string,
  creditScore: CreditScore
): void {
  const key = getCacheKey(walletAddress);
  const cachedAt = new Date();
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

  cache.set(key, {
    creditScore,
    cachedAt,
    expiresAt,
  });
}

/**
 * Invalidate cached score for a wallet
 */
export function invalidateCache(walletAddress: string): void {
  const key = getCacheKey(walletAddress);
  cache.delete(key);
}

/**
 * Clear all cached scores
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  validEntries: number;
  expiredEntries: number;
} {
  const now = new Date();
  let validEntries = 0;
  let expiredEntries = 0;

  cache.forEach((entry) => {
    if (now <= entry.expiresAt) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    size: cache.size,
    validEntries,
    expiredEntries,
  };
}

/**
 * Cleanup expired entries
 */
function cleanup(): void {
  const now = new Date();
  const keysToDelete: string[] = [];

  cache.forEach((entry, key) => {
    if (now > entry.expiresAt) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => cache.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
  }
}

/**
 * Generate cache key
 */
function getCacheKey(walletAddress: string): string {
  return `credit_score:${walletAddress.toLowerCase()}`;
}

/**
 * Check if score needs refresh
 * Returns true if cache expired or will expire soon (within 1 hour)
 */
export function needsRefresh(walletAddress: string): boolean {
  const key = getCacheKey(walletAddress);
  const entry = cache.get(key);

  if (!entry) {
    return true;
  }

  const expiresIn = entry.expiresAt.getTime() - Date.now();
  const oneHour = 60 * 60 * 1000;

  return expiresIn < oneHour;
}
