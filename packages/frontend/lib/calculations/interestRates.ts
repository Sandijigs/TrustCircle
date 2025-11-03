/**
 * Interest Rate Calculations
 * 
 * Implements TrustCircle's kinked interest rate model
 * Matches the on-chain calculations in LendingPool.sol
 */

// Constants (matching smart contract)
const BASIS_POINTS = 10000; // 100% = 10000 basis points
const BASE_RATE = 500; // 5% in basis points
const OPTIMAL_UTILIZATION = 8000; // 80% in basis points
const SLOPE1 = 1000; // 10% in basis points (0-80% utilization)
const SLOPE2 = 4000; // 40% in basis points (80-100% utilization)
const RESERVE_FACTOR = 1000; // 10% reserve

/**
 * Calculate pool utilization rate
 */
export function calculateUtilization(totalBorrowed: number, totalDeposits: number): number {
  if (totalDeposits === 0) return 0;
  return (totalBorrowed / totalDeposits) * 100;
}

/**
 * Calculate borrow APY based on utilization
 * 
 * Formula:
 * If utilization < 80%:
 *   APY = 5% + (utilization / 80%) * 10%
 * 
 * If utilization >= 80%:
 *   APY = 15% + ((utilization - 80%) / 20%) * 40%
 */
export function calculateBorrowAPY(utilization: number): number {
  const utilizationBP = utilization * 100; // Convert to basis points

  if (utilizationBP <= OPTIMAL_UTILIZATION) {
    // Below optimal: gradual increase
    const borrowAPY = BASE_RATE + (utilizationBP * SLOPE1) / OPTIMAL_UTILIZATION;
    return borrowAPY / 100; // Convert back to percentage
  } else {
    // Above optimal: steep increase
    const excessUtilization = utilizationBP - OPTIMAL_UTILIZATION;
    const maxExcessUtilization = BASIS_POINTS - OPTIMAL_UTILIZATION;
    
    const borrowAPY = BASE_RATE + SLOPE1 + (excessUtilization * SLOPE2) / maxExcessUtilization;
    return borrowAPY / 100; // Convert back to percentage
  }
}

/**
 * Calculate lender APY (what depositors earn)
 * 
 * Formula:
 * Lender APY = Borrow APY × Utilization × (1 - Reserve Factor)
 */
export function calculateLenderAPY(utilization: number, borrowAPY: number): number {
  const lenderAPY = borrowAPY * (utilization / 100) * (1 - RESERVE_FACTOR / BASIS_POINTS);
  return lenderAPY;
}

/**
 * Calculate lender APY directly from pool data
 */
export function calculateLenderAPYFromPool(totalBorrowed: number, totalDeposits: number): number {
  const utilization = calculateUtilization(totalBorrowed, totalDeposits);
  const borrowAPY = calculateBorrowAPY(utilization);
  return calculateLenderAPY(utilization, borrowAPY);
}

/**
 * Calculate interest earned over a period
 * 
 * @param principal Amount deposited
 * @param apy Annual percentage yield (as percentage, e.g., 12.5)
 * @param days Number of days
 * @returns Interest earned
 */
export function calculateInterestEarned(principal: number, apy: number, days: number): number {
  const dailyRate = apy / 365 / 100;
  return principal * dailyRate * days;
}

/**
 * Calculate projected earnings
 * 
 * @param depositAmount Amount to deposit
 * @param currentAPY Current APY (percentage)
 * @param days Number of days to project
 * @returns Object with daily, weekly, monthly, yearly earnings
 */
export function calculateProjectedEarnings(depositAmount: number, currentAPY: number, days = 365) {
  return {
    daily: calculateInterestEarned(depositAmount, currentAPY, 1),
    weekly: calculateInterestEarned(depositAmount, currentAPY, 7),
    monthly: calculateInterestEarned(depositAmount, currentAPY, 30),
    yearly: calculateInterestEarned(depositAmount, currentAPY, 365),
    custom: calculateInterestEarned(depositAmount, currentAPY, days),
  };
}

/**
 * Generate interest rate curve data points
 * Used for visualization
 */
export function generateInterestRateCurve(points = 100): {
  utilization: number;
  borrowAPY: number;
  lenderAPY: number;
}[] {
  const data: { utilization: number; borrowAPY: number; lenderAPY: number }[] = [];

  for (let i = 0; i <= points; i++) {
    const utilization = (i / points) * 100;
    const borrowAPY = calculateBorrowAPY(utilization);
    const lenderAPY = calculateLenderAPY(utilization, borrowAPY);

    data.push({
      utilization,
      borrowAPY,
      lenderAPY,
    });
  }

  return data;
}

/**
 * Calculate available liquidity (after reserve ratio)
 */
export function calculateAvailableLiquidity(
  totalDeposits: number,
  totalBorrowed: number,
  reserveFactor = 0.1
): number {
  const poolBalance = totalDeposits - totalBorrowed;
  const requiredReserve = totalDeposits * reserveFactor;
  return Math.max(0, poolBalance - requiredReserve);
}

/**
 * Calculate LP token value
 * 
 * @param totalShares Total LP tokens issued
 * @param poolValue Total value in pool (deposits + interest - borrowed)
 * @returns Value per share
 */
export function calculateShareValue(totalShares: number, poolValue: number): number {
  if (totalShares === 0) return 1;
  return poolValue / totalShares;
}

/**
 * Calculate shares to mint for deposit
 * 
 * @param depositAmount Amount being deposited
 * @param totalShares Current total shares
 * @param poolValue Current pool value
 * @returns Shares to mint
 */
export function calculateSharesForDeposit(
  depositAmount: number,
  totalShares: number,
  poolValue: number
): number {
  if (totalShares === 0) {
    // First deposit: 1:1 ratio
    return depositAmount;
  }
  
  // Subsequent deposits: proportional to pool
  return (depositAmount * totalShares) / poolValue;
}

/**
 * Calculate amount to receive for shares
 * 
 * @param shares Shares being redeemed
 * @param totalShares Current total shares
 * @param poolValue Current pool value
 * @returns Amount to receive
 */
export function calculateAmountForShares(
  shares: number,
  totalShares: number,
  poolValue: number
): number {
  if (totalShares === 0) return 0;
  return (shares * poolValue) / totalShares;
}

/**
 * Calculate health factor (safety metric)
 * Higher is better, < 1.0 is dangerous
 */
export function calculateHealthFactor(totalDeposits: number, totalBorrowed: number): number {
  if (totalBorrowed === 0) return Infinity;
  return totalDeposits / totalBorrowed;
}

/**
 * Format APY for display
 */
export function formatAPY(apy: number, decimals = 2): string {
  return `${apy.toFixed(decimals)}%`;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Calculate compound interest
 * For more accurate long-term projections
 */
export function calculateCompoundInterest(
  principal: number,
  apy: number,
  days: number,
  compoundFrequency: 'daily' | 'weekly' | 'monthly' = 'daily'
): number {
  const rate = apy / 100;
  const periods = {
    daily: 365,
    weekly: 52,
    monthly: 12,
  }[compoundFrequency];

  const periodsInTimeframe = (days / 365) * periods;
  const amount = principal * Math.pow(1 + rate / periods, periodsInTimeframe);
  
  return amount - principal; // Return interest only
}
