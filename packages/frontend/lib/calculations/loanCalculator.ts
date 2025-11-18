/**
 * Loan Calculation Utilities
 * 
 * Mathematical functions for loan calculations including:
 * - Amortization (equal installment calculation)
 * - Interest accrual
 * - Payment schedules
 * - APR/APY calculations
 * - Late payment penalties
 */

import { PaymentFrequency } from '@/types/loan';

const SECONDS_PER_DAY = 86400;
const DAYS_PER_YEAR = 365;
const BASIS_POINTS = 10000;

/**
 * Calculates loan installment amount using amortization formula
 * 
 * Formula: A = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 * - A = installment amount
 * - P = principal
 * - r = interest rate per period
 * - n = number of periods
 * 
 * @param principal - Loan principal amount
 * @param annualRateBPS - Annual interest rate in basis points (e.g., 1200 = 12%)
 * @param durationDays - Loan duration in days
 * @param frequency - Payment frequency
 * @returns Object with totalInstallments and installmentAmount
 */
export function calculateInstallments(
  principal: number,
  annualRateBPS: number,
  durationDays: number,
  frequency: PaymentFrequency
): {
  totalInstallments: number;
  installmentAmount: number;
} {
  const paymentIntervalDays = getPaymentIntervalDays(frequency);
  const totalInstallments = Math.floor(durationDays / paymentIntervalDays);

  if (totalInstallments === 0) {
    return { totalInstallments: 1, installmentAmount: principal };
  }

  // Convert annual rate to per-period rate
  const periodsPerYear = DAYS_PER_YEAR / paymentIntervalDays;
  const periodRateBPS = annualRateBPS / periodsPerYear;
  const periodRate = periodRateBPS / BASIS_POINTS;

  // Amortization formula
  // A = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const factor = Math.pow(1 + periodRate, totalInstallments);
  const installmentAmount = (principal * periodRate * factor) / (factor - 1);

  return {
    totalInstallments,
    installmentAmount: Number.isFinite(installmentAmount) ? installmentAmount : principal,
  };
}

/**
 * Calculates total interest for a loan
 * 
 * @param principal - Loan principal
 * @param installmentAmount - Amount per installment
 * @param totalInstallments - Number of installments
 * @returns Total interest amount
 */
export function calculateTotalInterest(
  principal: number,
  installmentAmount: number,
  totalInstallments: number
): number {
  const totalPayment = installmentAmount * totalInstallments;
  return totalPayment - principal;
}

/**
 * Calculates APR (Annual Percentage Rate)
 * 
 * @param principal - Loan principal
 * @param totalInterest - Total interest paid
 * @param durationDays - Loan duration in days
 * @returns APR as percentage (e.g., 12.5 for 12.5%)
 */
export function calculateAPR(
  principal: number,
  totalInterest: number,
  durationDays: number
): number {
  if (principal === 0 || durationDays === 0) return 0;
  
  const interestRate = totalInterest / principal;
  const durationYears = durationDays / DAYS_PER_YEAR;
  const apr = (interestRate / durationYears) * 100;
  
  return apr;
}

/**
 * Calculates effective APR considering compounding
 * 
 * @param apr - Annual Percentage Rate
 * @param frequency - Payment frequency
 * @returns Effective APR
 */
export function calculateEffectiveAPR(
  apr: number,
  frequency: PaymentFrequency
): number {
  const periodsPerYear = DAYS_PER_YEAR / getPaymentIntervalDays(frequency);
  const periodRate = apr / 100 / periodsPerYear;
  
  const effectiveAPR = (Math.pow(1 + periodRate, periodsPerYear) - 1) * 100;
  return effectiveAPR;
}

/**
 * Calculates interest portion of a payment
 * 
 * @param remainingPrincipal - Remaining loan principal
 * @param annualRateBPS - Annual interest rate in basis points
 * @param paymentIntervalDays - Days between payments
 * @returns Interest amount
 */
export function calculateInterestPortion(
  remainingPrincipal: number,
  annualRateBPS: number,
  paymentIntervalDays: number
): number {
  const annualRate = annualRateBPS / BASIS_POINTS;
  const interest = (remainingPrincipal * annualRate * paymentIntervalDays) / DAYS_PER_YEAR;
  return interest;
}

/**
 * Calculates principal portion of a payment
 * 
 * @param installmentAmount - Total installment amount
 * @param interestPortion - Interest portion of payment
 * @returns Principal portion
 */
export function calculatePrincipalPortion(
  installmentAmount: number,
  interestPortion: number
): number {
  return installmentAmount - interestPortion;
}

/**
 * Generates complete payment schedule for a loan
 * 
 * @param principal - Loan principal
 * @param annualRateBPS - Annual interest rate in basis points
 * @param durationDays - Loan duration in days
 * @param frequency - Payment frequency
 * @param startDate - Loan start date
 * @returns Array of payment schedule items
 */
export function generatePaymentSchedule(
  principal: number,
  annualRateBPS: number,
  durationDays: number,
  frequency: PaymentFrequency,
  startDate: Date = new Date()
): Array<{
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
}> {
  const { totalInstallments, installmentAmount } = calculateInstallments(
    principal,
    annualRateBPS,
    durationDays,
    frequency
  );

  const paymentIntervalDays = getPaymentIntervalDays(frequency);
  const schedule = [];
  let remainingBalance = principal;

  for (let i = 1; i <= totalInstallments; i++) {
    const interestAmount = calculateInterestPortion(
      remainingBalance,
      annualRateBPS,
      paymentIntervalDays
    );

    const principalAmount = calculatePrincipalPortion(installmentAmount, interestAmount);

    remainingBalance -= principalAmount;

    // Ensure remaining balance doesn't go negative
    if (remainingBalance < 0) remainingBalance = 0;

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + paymentIntervalDays * i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      principalAmount,
      interestAmount,
      totalAmount: installmentAmount,
      remainingBalance,
    });
  }

  return schedule;
}

/**
 * Calculates late payment penalty
 * 
 * @param installmentAmount - Regular installment amount
 * @param daysLate - Number of days payment is late
 * @param penaltyRateBPS - Penalty rate in basis points (default 200 = 2% per week)
 * @returns Penalty amount
 */
export function calculateLatePaymentPenalty(
  installmentAmount: number,
  daysLate: number,
  penaltyRateBPS: number = 200
): number {
  const weeksLate = Math.floor(daysLate / 7);
  if (weeksLate === 0) return 0;
  
  const penaltyRate = penaltyRateBPS / BASIS_POINTS;
  const penalty = installmentAmount * penaltyRate * weeksLate;
  
  return penalty;
}

import { getInterestRate, getBorrowingLimit } from '@/lib/creditScore/config';

/**
 * Calculates interest rate based on credit score
 * Risk-based pricing model
 * 
 * @param creditScore - User's credit score (0-1000)
 * @param hasCollateral - Whether loan has collateral (reduces rate by 2%)
 * @returns Interest rate in basis points
 */
export function calculateInterestRate(
  creditScore: number,
  hasCollateral: boolean = false
): number {
  // Use unified credit tier system
  return getInterestRate(creditScore, hasCollateral);
}

/**
 * Calculates maximum loan amount based on credit score
 * 
 * @param creditScore - User's credit score (0-1000)
 * @returns Maximum loan amount
 */
export function calculateMaxLoanAmount(creditScore: number): number {
  // Use unified credit tier system
  return getBorrowingLimit(creditScore);
}

/**
 * Gets payment interval in days for a frequency
 * 
 * @param frequency - Payment frequency
 * @returns Number of days between payments
 */
export function getPaymentIntervalDays(frequency: PaymentFrequency): number {
  switch (frequency) {
    case PaymentFrequency.Weekly:
      return 7;
    case PaymentFrequency.BiWeekly:
      return 14;
    case PaymentFrequency.Monthly:
      return 30;
    default:
      return 30;
  }
}

/**
 * Converts days to months (approximate)
 * 
 * @param days - Number of days
 * @returns Approximate number of months
 */
export function daysToMonths(days: number): number {
  return Math.round(days / 30);
}

/**
 * Converts months to days (approximate)
 * 
 * @param months - Number of months
 * @returns Approximate number of days
 */
export function monthsToDays(months: number): number {
  return months * 30;
}

/**
 * Calculates total payment for early repayment
 * Includes interest discount for early payoff
 * 
 * @param principal - Original principal
 * @param paidInstallments - Installments already paid
 * @param totalInstallments - Total installments
 * @param installmentAmount - Amount per installment
 * @param discountRate - Discount rate for early payoff (default 0.5 = 50% interest discount)
 * @returns Early payoff amount
 */
export function calculateEarlyPayoffAmount(
  principal: number,
  paidInstallments: number,
  totalInstallments: number,
  installmentAmount: number,
  discountRate: number = 0.5
): number {
  const totalPaid = paidInstallments * installmentAmount;
  const totalInterest = calculateTotalInterest(principal, installmentAmount, totalInstallments);
  const interestPerInstallment = totalInterest / totalInstallments;
  
  const remainingInstallments = totalInstallments - paidInstallments;
  const remainingPrincipal = principal - (principal * paidInstallments / totalInstallments);
  const remainingInterest = interestPerInstallment * remainingInstallments;
  const discountedInterest = remainingInterest * discountRate;
  
  return remainingPrincipal + discountedInterest;
}

/**
 * Calculates debt-to-income ratio
 * 
 * @param monthlyPayment - Monthly loan payment
 * @param monthlyIncome - Estimated monthly income
 * @returns DTI ratio as percentage
 */
export function calculateDebtToIncome(
  monthlyPayment: number,
  monthlyIncome: number
): number {
  if (monthlyIncome === 0) return 0;
  return (monthlyPayment / monthlyIncome) * 100;
}

/**
 * Formats currency amount
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats percentage
 * 
 * @param value - Percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats basis points as percentage
 * 
 * @param bps - Basis points
 * @returns Percentage string
 */
export function formatBPS(bps: number): string {
  return formatPercentage(bps / 100, 2);
}
