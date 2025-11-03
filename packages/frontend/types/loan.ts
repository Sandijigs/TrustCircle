/**
 * Loan Type Definitions
 * 
 * TypeScript types for loan management system
 */

export enum LoanStatus {
  Pending = 0,
  Approved = 1,
  Active = 2,
  Completed = 3,
  Defaulted = 4,
  Cancelled = 5,
}

export enum PaymentFrequency {
  Weekly = 0,
  BiWeekly = 1,
  Monthly = 2,
}

export interface Loan {
  id: bigint;
  borrower: string;
  asset: string;
  principalAmount: bigint;
  interestRate: bigint;
  duration: bigint;
  frequency: PaymentFrequency;
  installmentAmount: bigint;
  totalInstallments: bigint;
  paidInstallments: bigint;
  totalRepaid: bigint;
  interestPaid: bigint;
  startTime: bigint;
  nextPaymentDue: bigint;
  status: LoanStatus;
  hasCollateral: boolean;
  latePaymentCount: bigint;
  circleId: bigint;
}

export interface LoanDisplay {
  id: string;
  borrower: string;
  asset: string;
  assetSymbol: string;
  principalAmount: number;
  interestRate: number;
  duration: number;
  durationInMonths: number;
  frequency: PaymentFrequency;
  frequencyLabel: string;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  totalRepaid: number;
  interestPaid: number;
  startTime: Date;
  nextPaymentDue: Date;
  status: LoanStatus;
  statusLabel: string;
  hasCollateral: boolean;
  latePaymentCount: number;
  circleId: string;
  remainingAmount: number;
  progressPercentage: number;
  isLate: boolean;
  daysLate: number;
  totalInterest: number;
  apr: number;
}

export interface LoanRequestParams {
  asset: string;
  amount: string;
  duration: number; // in days
  frequency: PaymentFrequency;
  circleId: bigint;
}

export interface PaymentScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingBalance: number;
  isPaid: boolean;
  isUpcoming: boolean;
  isOverdue: boolean;
}

export interface LoanStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalBorrowed: number;
  totalRepaid: number;
  totalInterestPaid: number;
  averageLoanAmount: number;
  averageInterestRate: number;
  onTimePaymentRate: number;
}

export interface InterestBreakdown {
  principal: number;
  totalInterest: number;
  totalPayment: number;
  apr: number;
  effectiveAPR: number;
  monthlyPayment: number;
}

export interface CreditAssessment {
  creditScore: number;
  interestRate: number;
  maxLoanAmount: number;
  recommendedAmount: number;
  riskTier: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  reasons: string[];
}

export interface CollateralInfo {
  hasCollateral: boolean;
  collateralType?: 'ERC20' | 'ERC721';
  collateralAsset?: string;
  collateralAmount?: number;
  collateralValue?: number;
  collateralizationRatio?: number;
}

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  [LoanStatus.Pending]: 'Pending Approval',
  [LoanStatus.Approved]: 'Approved',
  [LoanStatus.Active]: 'Active',
  [LoanStatus.Completed]: 'Completed',
  [LoanStatus.Defaulted]: 'Defaulted',
  [LoanStatus.Cancelled]: 'Cancelled',
};

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  [PaymentFrequency.Weekly]: 'Weekly',
  [PaymentFrequency.BiWeekly]: 'Bi-Weekly',
  [PaymentFrequency.Monthly]: 'Monthly',
};

export const MIN_LOAN_AMOUNT = 50;
export const MAX_LOAN_AMOUNT = 5000;
export const MIN_DURATION_DAYS = 30;
export const MAX_DURATION_DAYS = 365;
export const MIN_CREDIT_SCORE = 300;
export const AUTO_APPROVE_SCORE = 800;
export const GRACE_PERIOD_DAYS = 7;
export const DEFAULT_THRESHOLD_DAYS = 30;
export const LATE_PAYMENT_PENALTY_BPS = 200; // 2%
