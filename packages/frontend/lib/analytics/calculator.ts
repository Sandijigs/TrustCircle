/**
 * Analytics Calculator
 * Functions to calculate metrics from raw data
 */

import { formatEther, parseEther } from 'viem';
import type {
  BorrowerAnalytics,
  LenderAnalytics,
  CircleAnalytics,
  PlatformOverview,
  RiskMonitoring,
  TimeRange,
} from './types';

/**
 * Calculate time range in milliseconds
 */
export function getTimeRangeMs(range: TimeRange): number {
  const now = Date.now();
  const ranges = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
    'all': now,
  };
  return ranges[range];
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate compound APY from APR
 */
export function calculateAPY(apr: number, compoundingPeriods = 365): number {
  return (Math.pow(1 + apr / compoundingPeriods, compoundingPeriods) - 1) * 100;
}

/**
 * Calculate weighted average
 */
export function calculateWeightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length) {
    throw new Error('Values and weights arrays must have same length');
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce(
    (sum, value, index) => sum + value * weights[index],
    0
  );

  return weightedSum / totalWeight;
}

/**
 * Calculate credit score trend
 */
export function calculateCreditScoreTrend(
  history: Array<{ timestamp: Date; score: number }>
): 'improving' | 'stable' | 'declining' {
  if (history.length < 2) return 'stable';

  // Get recent scores (last 3 data points)
  const recentScores = history.slice(-3);
  
  // Calculate average change
  let totalChange = 0;
  for (let i = 1; i < recentScores.length; i++) {
    totalChange += recentScores[i].score - recentScores[i - 1].score;
  }
  const avgChange = totalChange / (recentScores.length - 1);

  if (avgChange > 5) return 'improving';
  if (avgChange < -5) return 'declining';
  return 'stable';
}

/**
 * Calculate on-time payment rate
 */
export function calculateOnTimeRate(
  payments: Array<{ dueDate: Date; paidDate: Date }>
): number {
  if (payments.length === 0) return 100;

  const onTimePayments = payments.filter(
    (payment) => payment.paidDate <= payment.dueDate
  ).length;

  return (onTimePayments / payments.length) * 100;
}

/**
 * Calculate loan progress
 */
export function calculateLoanProgress(
  totalAmount: bigint,
  paidAmount: bigint
): number {
  if (totalAmount === 0n) return 0;
  return Number((paidAmount * 100n) / totalAmount);
}

/**
 * Calculate interest earned over time period
 */
export function calculateInterestEarned(
  principal: bigint,
  apy: number,
  daysElapsed: number
): string {
  const principalNum = Number(formatEther(principal));
  const interest = principalNum * (apy / 100) * (daysElapsed / 365);
  return parseEther(interest.toFixed(6)).toString();
}

/**
 * Calculate portfolio allocation percentages
 */
export function calculateAllocationPercentages(
  allocations: Array<{ token: string; amount: bigint }>
): Array<{ token: string; amount: string; percentage: number }> {
  const total = allocations.reduce((sum, alloc) => sum + alloc.amount, 0n);

  if (total === 0n) {
    return allocations.map((alloc) => ({
      token: alloc.token,
      amount: '0',
      percentage: 0,
    }));
  }

  return allocations.map((alloc) => ({
    token: alloc.token,
    amount: formatEther(alloc.amount),
    percentage: Number((alloc.amount * 10000n) / total) / 100,
  }));
}

/**
 * Calculate utilization rate for a pool
 */
export function calculateUtilizationRate(
  totalLiquidity: bigint,
  borrowed: bigint
): number {
  if (totalLiquidity === 0n) return 0;
  return Number((borrowed * 10000n) / totalLiquidity) / 100;
}

/**
 * Determine utilization status
 */
export function getUtilizationStatus(
  utilizationRate: number
): 'healthy' | 'high' | 'critical' {
  if (utilizationRate < 70) return 'healthy';
  if (utilizationRate < 85) return 'high';
  return 'critical';
}

/**
 * Calculate default rate
 */
export function calculateDefaultRate(
  totalLoans: number,
  defaultedLoans: number
): number {
  if (totalLoans === 0) return 0;
  return (defaultedLoans / totalLoans) * 100;
}

/**
 * Calculate circle health score
 */
export function calculateCircleHealthScore(factors: {
  onTimePaymentRate: number; // 0-100
  defaultRate: number; // 0-100
  averageCreditScore: number; // 0-1000
  memberActivity: number; // 0-100
  liquidityRatio: number; // 0-100
}): number {
  // Weights for different factors
  const weights = {
    onTimePaymentRate: 0.30,
    defaultRate: 0.25,
    averageCreditScore: 0.20,
    memberActivity: 0.15,
    liquidityRatio: 0.10,
  };

  // Normalize credit score to 0-100
  const normalizedCreditScore = (factors.averageCreditScore / 1000) * 100;

  // Invert default rate (lower is better)
  const invertedDefaultRate = 100 - factors.defaultRate;

  const healthScore =
    factors.onTimePaymentRate * weights.onTimePaymentRate +
    invertedDefaultRate * weights.defaultRate +
    normalizedCreditScore * weights.averageCreditScore +
    factors.memberActivity * weights.memberActivity +
    factors.liquidityRatio * weights.liquidityRatio;

  return Math.round(Math.max(0, Math.min(100, healthScore)));
}

/**
 * Calculate risk level from various metrics
 */
export function calculateRiskLevel(metrics: {
  utilizationRate?: number;
  defaultRate?: number;
  healthScore?: number;
  daysOverdue?: number;
}): 'low' | 'medium' | 'high' | 'critical' {
  let riskScore = 0;

  // Utilization contributes to risk
  if (metrics.utilizationRate !== undefined) {
    if (metrics.utilizationRate > 90) riskScore += 40;
    else if (metrics.utilizationRate > 80) riskScore += 30;
    else if (metrics.utilizationRate > 70) riskScore += 20;
    else if (metrics.utilizationRate > 60) riskScore += 10;
  }

  // Default rate contributes to risk
  if (metrics.defaultRate !== undefined) {
    if (metrics.defaultRate > 15) riskScore += 40;
    else if (metrics.defaultRate > 10) riskScore += 30;
    else if (metrics.defaultRate > 5) riskScore += 20;
    else if (metrics.defaultRate > 2) riskScore += 10;
  }

  // Health score inversely contributes to risk
  if (metrics.healthScore !== undefined) {
    if (metrics.healthScore < 40) riskScore += 30;
    else if (metrics.healthScore < 60) riskScore += 20;
    else if (metrics.healthScore < 75) riskScore += 10;
  }

  // Days overdue contributes to risk
  if (metrics.daysOverdue !== undefined) {
    if (metrics.daysOverdue > 30) riskScore += 40;
    else if (metrics.daysOverdue > 14) riskScore += 30;
    else if (metrics.daysOverdue > 7) riskScore += 20;
    else if (metrics.daysOverdue > 0) riskScore += 10;
  }

  // Determine risk level
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 50) return 'high';
  if (riskScore >= 25) return 'medium';
  return 'low';
}

/**
 * Calculate earnings projection
 */
export function calculateEarningsProjection(
  principal: bigint,
  currentAPY: number,
  daysAhead: number,
  assumptions?: string
): { projected: string; assumptions: string } {
  const principalNum = Number(formatEther(principal));
  const projectedEarnings = principalNum * (currentAPY / 100) * (daysAhead / 365);

  const assumptionsText =
    assumptions ||
    `Assumes constant APY of ${currentAPY.toFixed(2)}% and no principal changes. Actual earnings may vary based on pool utilization and market conditions.`;

  return {
    projected: projectedEarnings.toFixed(4),
    assumptions: assumptionsText,
  };
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(
  dataPoints: Array<{ date: Date; value: number }>
): { daily: number; weekly: number; monthly: number } {
  if (dataPoints.length < 2) {
    return { daily: 0, weekly: 0, monthly: 0 };
  }

  // Sort by date
  const sorted = [...dataPoints].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate daily growth rate (average over last 7 days)
  const last7Days = sorted.slice(-7);
  let dailyGrowth = 0;
  if (last7Days.length > 1) {
    for (let i = 1; i < last7Days.length; i++) {
      const growth = calculatePercentageChange(
        last7Days[i].value,
        last7Days[i - 1].value
      );
      dailyGrowth += growth;
    }
    dailyGrowth /= last7Days.length - 1;
  }

  // Calculate weekly growth rate
  const weekAgo = sorted.length >= 7 ? sorted[sorted.length - 7] : sorted[0];
  const weeklyGrowth = calculatePercentageChange(
    sorted[sorted.length - 1].value,
    weekAgo.value
  );

  // Calculate monthly growth rate
  const monthAgo = sorted.length >= 30 ? sorted[sorted.length - 30] : sorted[0];
  const monthlyGrowth = calculatePercentageChange(
    sorted[sorted.length - 1].value,
    monthAgo.value
  );

  return {
    daily: dailyGrowth,
    weekly: weeklyGrowth,
    monthly: monthlyGrowth,
  };
}

/**
 * Calculate percentile ranking
 */
export function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;

  const belowCount = allValues.filter((v) => v < value).length;
  return (belowCount / allValues.length) * 100;
}

/**
 * Detect liquidity crisis risk
 */
export function detectLiquidityCrisis(
  pools: Array<{
    totalLiquidity: bigint;
    utilized: bigint;
    pendingWithdrawals: bigint;
  }>
): {
  isAtRisk: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  affectedPools: number[];
  recommendations: string[];
} {
  const affectedPools: number[] = [];
  let maxSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
  const recommendations: string[] = [];

  pools.forEach((pool, index) => {
    const available = pool.totalLiquidity - pool.utilized;
    const utilizationRate = calculateUtilizationRate(pool.totalLiquidity, pool.utilized);

    // Check if pending withdrawals can't be fulfilled
    if (pool.pendingWithdrawals > available) {
      affectedPools.push(index);

      // Determine severity
      const shortfall = pool.pendingWithdrawals - available;
      const shortfallRatio = Number((shortfall * 100n) / pool.pendingWithdrawals);

      let poolSeverity: typeof maxSeverity = 'low';
      if (shortfallRatio > 75) poolSeverity = 'critical';
      else if (shortfallRatio > 50) poolSeverity = 'high';
      else if (shortfallRatio > 25) poolSeverity = 'medium';

      if (
        ['critical', 'high', 'medium', 'low', 'none'].indexOf(poolSeverity) >
        ['critical', 'high', 'medium', 'low', 'none'].indexOf(maxSeverity)
      ) {
        maxSeverity = poolSeverity;
      }

      recommendations.push(
        `Pool ${index}: Increase liquidity or pause new loans to fulfill pending withdrawals`
      );
    }

    // Check high utilization
    if (utilizationRate > 90) {
      if (!affectedPools.includes(index)) affectedPools.push(index);
      recommendations.push(
        `Pool ${index}: Utilization at ${utilizationRate.toFixed(1)}% - Consider incentivizing deposits`
      );
    }
  });

  return {
    isAtRisk: affectedPools.length > 0,
    severity: maxSeverity,
    affectedPools,
    recommendations,
  };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: string | bigint,
  decimals = 2,
  symbol = '$'
): string {
  const numValue =
    typeof amount === 'string' ? parseFloat(amount) : Number(formatEther(amount));

  if (numValue >= 1_000_000) {
    return `${symbol}${(numValue / 1_000_000).toFixed(decimals)}M`;
  }
  if (numValue >= 1_000) {
    return `${symbol}${(numValue / 1_000).toFixed(decimals)}K`;
  }
  return `${symbol}${numValue.toFixed(decimals)}`;
}

/**
 * Calculate confid matrix metrics
 */
export function calculateConfusionMatrixMetrics(
  truePositives: number,
  trueNegatives: number,
  falsePositives: number,
  falseNegatives: number
): {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
} {
  const total = truePositives + trueNegatives + falsePositives + falseNegatives;

  const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;

  const precision =
    truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;

  const recall =
    truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;

  const f1Score =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
  };
}
