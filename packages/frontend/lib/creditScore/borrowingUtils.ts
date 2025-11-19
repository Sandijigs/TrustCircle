/**
 * Borrowing Utilities
 * 
 * Centralized utilities for calculating borrowing capacity
 * Ensures consistent behavior across all components
 */

import { getBorrowingLimit, DEFAULT_CREDIT_SCORE } from './config';

/**
 * Safely get borrowing limit with proper fallbacks
 * 
 * @param creditScore - Credit score (may be undefined/null)
 * @returns Borrowing limit in dollars
 */
export function getSafeBorrowingLimit(creditScore: number | undefined | null): number {
  // Handle undefined, null, or invalid scores
  if (creditScore === undefined || creditScore === null || isNaN(creditScore)) {
    console.log('[borrowingUtils] Invalid credit score, using default:', DEFAULT_CREDIT_SCORE);
    return getBorrowingLimit(DEFAULT_CREDIT_SCORE);
  }
  
  // Handle negative scores
  if (creditScore < 0) {
    console.log('[borrowingUtils] Negative credit score, using 0');
    return getBorrowingLimit(0);
  }
  
  // Handle scores above max
  if (creditScore > 1000) {
    console.log('[borrowingUtils] Score above 1000, capping at 1000');
    return getBorrowingLimit(1000);
  }
  
  const limit = getBorrowingLimit(creditScore);
  console.log('[borrowingUtils] Credit score:', creditScore, '→ Borrowing limit: $' + limit);
  return limit;
}

/**
 * Get safe credit score with fallback
 * 
 * @param creditScore - Credit score (may be undefined/null)
 * @returns Valid credit score
 */
export function getSafeCreditScore(creditScore: number | undefined | null): number {
  if (creditScore === undefined || creditScore === null || isNaN(creditScore)) {
    return DEFAULT_CREDIT_SCORE;
  }
  
  if (creditScore < 0) return 0;
  if (creditScore > 1000) return 1000;
  
  return creditScore;
}

/**
 * Format borrowing limit as currency
 * 
 * @param limit - Borrowing limit in dollars
 * @returns Formatted string
 */
export function formatBorrowingLimit(limit: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(limit);
}
