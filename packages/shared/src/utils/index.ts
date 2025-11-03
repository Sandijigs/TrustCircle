/**
 * Shared utility functions
 */

import { BASIS_POINTS } from "../constants";

// ==================== FORMAT UTILITIES ====================

/**
 * Formats a bigint token amount to a readable string
 * @param amount Amount in wei
 * @param decimals Token decimals (default 18)
 * @param displayDecimals Number of decimals to display (default 2)
 * @returns Formatted string
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  displayDecimals: number = 2
): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (displayDecimals === 0) {
    return whole.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, "0");
  const decimalPart = remainderStr.slice(0, displayDecimals);

  return `${whole}.${decimalPart}`;
}

/**
 * Parses a token amount string to bigint
 * @param amount Amount as string
 * @param decimals Token decimals (default 18)
 * @returns Amount in wei
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [whole, decimal = ""] = amount.split(".");
  const decimalPadded = decimal.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + decimalPadded);
}

/**
 * Formats an address for display (truncated)
 * @param address Ethereum address
 * @param startChars Characters to show at start (default 6)
 * @param endChars Characters to show at end (default 4)
 * @returns Truncated address
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a basis points value to percentage
 * @param bps Basis points
 * @param decimals Decimal places (default 2)
 * @returns Percentage string with % sign
 */
export function formatBasisPoints(bps: number, decimals: number = 2): string {
  const percentage = (bps / BASIS_POINTS) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Formats a timestamp to readable date
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ==================== CALCULATION UTILITIES ====================

/**
 * Calculates utilization rate
 * @param totalBorrowed Total borrowed amount
 * @param totalDeposits Total deposits
 * @returns Utilization rate in basis points
 */
export function calculateUtilization(
  totalBorrowed: bigint,
  totalDeposits: bigint
): number {
  if (totalDeposits === BigInt(0)) return 0;
  return Number((totalBorrowed * BigInt(BASIS_POINTS)) / totalDeposits);
}

/**
 * Calculates APY from basis points
 * @param bps Interest rate in basis points
 * @returns APY as percentage
 */
export function bpsToAPY(bps: number): number {
  return (bps / BASIS_POINTS) * 100;
}

/**
 * Converts APY percentage to basis points
 * @param apy APY as percentage
 * @returns Basis points
 */
export function apyToBps(apy: number): number {
  return Math.round((apy / 100) * BASIS_POINTS);
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Validates an Ethereum address
 * @param address Address to validate
 * @returns True if valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates a credit score
 * @param score Credit score
 * @returns True if valid (0-1000)
 */
export function isValidCreditScore(score: number): boolean {
  return score >= 0 && score <= 1000;
}

/**
 * Validates a loan amount
 * @param amount Loan amount in wei
 * @param minAmount Minimum amount
 * @param maxAmount Maximum amount
 * @returns True if valid
 */
export function isValidLoanAmount(
  amount: bigint,
  minAmount: bigint,
  maxAmount: bigint
): boolean {
  return amount >= minAmount && amount <= maxAmount;
}

// ==================== TIME UTILITIES ====================

/**
 * Gets days remaining until a timestamp
 * @param timestamp Unix timestamp in seconds
 * @returns Days remaining (negative if past)
 */
export function getDaysRemaining(timestamp: number): number {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  return Math.floor(diff / 86400);
}

/**
 * Checks if a payment is late
 * @param dueDate Payment due date (unix timestamp)
 * @param gracePeriod Grace period in seconds
 * @returns True if late
 */
export function isPaymentLate(dueDate: number, gracePeriod: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now > dueDate + gracePeriod;
}

// ==================== CREDIT SCORE UTILITIES ====================

/**
 * Gets credit score tier
 * @param score Credit score
 * @returns Tier name
 */
export function getCreditScoreTier(score: number): string {
  if (score >= 800) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 600) return "Fair";
  if (score >= 500) return "Poor";
  return "Bad";
}

/**
 * Gets credit score color for UI
 * @param score Credit score
 * @returns Tailwind color class
 */
export function getCreditScoreColor(score: number): string {
  if (score >= 800) return "text-green-600";
  if (score >= 700) return "text-blue-600";
  if (score >= 600) return "text-yellow-600";
  if (score >= 500) return "text-orange-600";
  return "text-red-600";
}

// ==================== LOAN UTILITIES ====================

/**
 * Calculates total loan cost (principal + interest)
 * @param principal Loan principal
 * @param interestRate Interest rate in basis points
 * @param duration Loan duration in seconds
 * @returns Total cost
 */
export function calculateTotalLoanCost(
  principal: bigint,
  interestRate: number,
  duration: number
): bigint {
  const interest = (principal * BigInt(interestRate) * BigInt(duration)) /
                   (BigInt(BASIS_POINTS) * BigInt(31536000)); // seconds per year
  return principal + interest;
}

// ==================== ERROR HANDLING ====================

/**
 * Safely converts any value to string
 * @param value Value to convert
 * @returns String representation
 */
export function safeToString(value: unknown): string {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Gets error message from unknown error
 * @param error Error object
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return safeToString(error);
}
