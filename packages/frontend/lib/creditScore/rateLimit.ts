/**
 * Rate Limiter for Credit Score Calculations
 * 
 * Limits: 10 requests per hour per wallet address
 * For production, consider using Redis with sliding window
 */

import type { RateLimitEntry } from './types';

// In-memory rate limit storage
const rateLimits = new Map<string, RateLimitEntry>();

// Rate limit: 10 requests per hour
const MAX_REQUESTS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Cleanup interval: 15 minutes
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

// Start periodic cleanup
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(cleanup, CLEANUP_INTERVAL_MS);
}

/**
 * Check if request is rate limited
 */
export function isRateLimited(walletAddress: string): {
  limited: boolean;
  remainingRequests: number;
  resetAt: Date;
} {
  const key = getRateLimitKey(walletAddress);
  const now = new Date();

  // Get or create entry
  let entry = rateLimits.get(key);
  if (!entry) {
    entry = {
      requests: [],
      remainingRequests: MAX_REQUESTS_PER_HOUR,
    };
    rateLimits.set(key, entry);
  }

  // Remove old requests outside the window
  entry.requests = entry.requests.filter(
    (req) => now.getTime() - req.timestamp.getTime() < RATE_LIMIT_WINDOW_MS
  );

  // Calculate remaining requests
  const remainingRequests = MAX_REQUESTS_PER_HOUR - entry.requests.length;
  entry.remainingRequests = remainingRequests;

  // Check if rate limited
  const limited = remainingRequests <= 0;

  // Calculate reset time (1 hour from oldest request)
  const oldestRequest = entry.requests[0];
  const resetAt = oldestRequest
    ? new Date(oldestRequest.timestamp.getTime() + RATE_LIMIT_WINDOW_MS)
    : new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);

  return {
    limited,
    remainingRequests: Math.max(0, remainingRequests),
    resetAt,
  };
}

/**
 * Record a request
 */
export function recordRequest(walletAddress: string): void {
  const key = getRateLimitKey(walletAddress);
  const now = new Date();

  // Get or create entry
  let entry = rateLimits.get(key);
  if (!entry) {
    entry = {
      requests: [],
      remainingRequests: MAX_REQUESTS_PER_HOUR,
    };
    rateLimits.set(key, entry);
  }

  // Add new request
  entry.requests.push({
    timestamp: now,
    walletAddress,
  });

  // Update remaining requests
  entry.remainingRequests = MAX_REQUESTS_PER_HOUR - entry.requests.length;
}

/**
 * Reset rate limit for a wallet (admin use)
 */
export function resetRateLimit(walletAddress: string): void {
  const key = getRateLimitKey(walletAddress);
  rateLimits.delete(key);
}

/**
 * Get rate limit stats
 */
export function getRateLimitStats(): {
  totalUsers: number;
  limitedUsers: number;
  totalRequests: number;
} {
  const now = new Date();
  let totalRequests = 0;
  let limitedUsers = 0;

  rateLimits.forEach((entry) => {
    // Count only recent requests
    const recentRequests = entry.requests.filter(
      (req) => now.getTime() - req.timestamp.getTime() < RATE_LIMIT_WINDOW_MS
    );
    totalRequests += recentRequests.length;

    if (recentRequests.length >= MAX_REQUESTS_PER_HOUR) {
      limitedUsers++;
    }
  });

  return {
    totalUsers: rateLimits.size,
    limitedUsers,
    totalRequests,
  };
}

/**
 * Cleanup expired entries
 */
function cleanup(): void {
  const now = new Date();
  const keysToDelete: string[] = [];

  rateLimits.forEach((entry, key) => {
    // Remove old requests
    entry.requests = entry.requests.filter(
      (req) => now.getTime() - req.timestamp.getTime() < RATE_LIMIT_WINDOW_MS
    );

    // Delete entry if no recent requests
    if (entry.requests.length === 0) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimits.delete(key));

  if (keysToDelete.length > 0) {
    console.log(`[RateLimit] Cleaned up ${keysToDelete.length} expired entries`);
  }
}

/**
 * Generate rate limit key
 */
function getRateLimitKey(walletAddress: string): string {
  return `rate_limit:${walletAddress.toLowerCase()}`;
}
