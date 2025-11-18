/**
 * Credit Score Configuration
 * 
 * SINGLE SOURCE OF TRUTH for credit score tiers, borrowing limits, and interest rates
 * Used across all components and calculations
 */

export interface CreditTier {
  minScore: number;
  maxScore: number;
  tier: string;
  label: string;
  color: string;
  bgColor: string;
  description: string;
  borrowingLimit: number;
  interestRateBPS: number; // In basis points (e.g., 800 = 8%)
  emoji: string;
}

/**
 * Credit Score Tiers
 * Unified system for borrowing capacity and interest rates
 */
export const CREDIT_TIERS: CreditTier[] = [
  {
    minScore: 800,
    maxScore: 1000,
    tier: 'excellent',
    label: 'Excellent',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    description: 'Outstanding credit profile with excellent history',
    borrowingLimit: 10000, // $10,000
    interestRateBPS: 800, // 8%
    emoji: '🌟',
  },
  {
    minScore: 700,
    maxScore: 799,
    tier: 'very-good',
    label: 'Very Good',
    color: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-100 dark:bg-success-900/20',
    description: 'Strong credit profile with reliable payment history',
    borrowingLimit: 5000, // $5,000
    interestRateBPS: 1200, // 12%
    emoji: '✨',
  },
  {
    minScore: 600,
    maxScore: 699,
    tier: 'good',
    label: 'Good',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    description: 'Good credit profile showing consistent behavior',
    borrowingLimit: 3000, // $3,000
    interestRateBPS: 1500, // 15%
    emoji: '⭐',
  },
  {
    minScore: 500,
    maxScore: 599,
    tier: 'fair',
    label: 'Fair',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    description: 'Fair credit profile with room for improvement',
    borrowingLimit: 1500, // $1,500
    interestRateBPS: 1800, // 18%
    emoji: '💫',
  },
  {
    minScore: 400,
    maxScore: 499,
    tier: 'poor',
    label: 'Poor',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    description: 'Limited credit history or some negative marks',
    borrowingLimit: 750, // $750
    interestRateBPS: 2200, // 22%
    emoji: '⚡',
  },
  {
    minScore: 300,
    maxScore: 399,
    tier: 'very-poor',
    label: 'Very Poor',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    description: 'Minimal credit history with significant challenges',
    borrowingLimit: 300, // $300
    interestRateBPS: 2500, // 25%
    emoji: '📊',
  },
  {
    minScore: 0,
    maxScore: 299,
    tier: 'no-credit',
    label: 'No Credit',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    description: 'Insufficient credit history to assess',
    borrowingLimit: 0, // $0 - Cannot borrow
    interestRateBPS: 0, // N/A
    emoji: '🔒',
  },
];

/**
 * Get credit tier for a given score
 */
export function getCreditTier(score: number): CreditTier {
  const tier = CREDIT_TIERS.find(
    (t) => score >= t.minScore && score <= t.maxScore
  );
  
  // Default to lowest tier if not found
  return tier || CREDIT_TIERS[CREDIT_TIERS.length - 1];
}

/**
 * Get borrowing limit for a credit score
 */
export function getBorrowingLimit(score: number): number {
  return getCreditTier(score).borrowingLimit;
}

/**
 * Get interest rate for a credit score
 * 
 * @param score - Credit score (0-1000)
 * @param hasCollateral - Whether loan has collateral (reduces rate by 200 BPS / 2%)
 * @returns Interest rate in basis points
 */
export function getInterestRate(score: number, hasCollateral: boolean = false): number {
  let rate = getCreditTier(score).interestRateBPS;
  
  // Collateral reduces interest rate by 2%
  if (hasCollateral && rate > 0) {
    rate = Math.max(rate - 200, 500); // Min 5% even with collateral
  }
  
  return rate;
}

/**
 * Get next tier for score improvement motivation
 */
export function getNextTier(currentScore: number): CreditTier | null {
  const currentTier = getCreditTier(currentScore);
  const currentIndex = CREDIT_TIERS.findIndex((t) => t.tier === currentTier.tier);
  
  if (currentIndex > 0) {
    return CREDIT_TIERS[currentIndex - 1];
  }
  
  return null; // Already at top tier
}

/**
 * Get score improvement needed for next tier
 */
export function getScoreImprovementNeeded(currentScore: number): number | null {
  const nextTier = getNextTier(currentScore);
  if (!nextTier) return null;
  
  return nextTier.minScore - currentScore;
}

/**
 * Default credit score for new users
 */
export const DEFAULT_CREDIT_SCORE = 500;

/**
 * Minimum credit score to borrow
 */
export const MIN_CREDIT_SCORE_TO_BORROW = 300;
