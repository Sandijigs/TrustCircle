/**
 * Shared TypeScript types for TrustCircle
 * Used across frontend and contracts packages
 */

// ==================== LOAN TYPES ====================

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
  id: string;
  borrower: string;
  asset: string;
  principalAmount: bigint;
  interestRate: number; // in basis points
  duration: number; // in seconds
  frequency: PaymentFrequency;
  installmentAmount: bigint;
  totalInstallments: number;
  paidInstallments: number;
  totalRepaid: bigint;
  interestPaid: bigint;
  startTime: number;
  nextPaymentDue: number;
  status: LoanStatus;
  hasCollateral: boolean;
  latePaymentCount: number;
  circleId: string;
}

// ==================== POOL TYPES ====================

export interface PoolData {
  asset: string;
  totalDeposits: bigint;
  totalBorrowed: bigint;
  totalReserves: bigint;
  totalShares: bigint;
  lastUpdateTimestamp: number;
  accumulatedInterest: bigint;
  isActive: boolean;
}

export interface UserDeposit {
  shares: bigint;
  lastDepositTime: number;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
}

// ==================== CIRCLE TYPES ====================

export enum CircleStatus {
  Active = 0,
  Paused = 1,
  Closed = 2,
}

export interface LendingCircle {
  id: string;
  name: string;
  creator: string;
  memberCount: number;
  maxMembers: number;
  totalTreasury: bigint;
  activeLoans: number;
  defaultRate: number; // in basis points
  minCreditScore: number;
  status: CircleStatus;
  createdAt: number;
}

export interface CircleMember {
  address: string;
  joinedAt: number;
  reputation: number;
  loansReceived: number;
  vouchesGiven: number;
  vouchesReceived: number;
  isActive: boolean;
}

// ==================== CREDIT SCORE TYPES ====================

export interface CreditScore {
  score: number; // 0-1000
  lastUpdated: number;
  onChainHistory: {
    totalLoans: number;
    completedLoans: number;
    defaultedLoans: number;
    totalBorrowed: bigint;
    totalRepaid: bigint;
    averageRepaymentTime: number;
  };
  socialReputation: {
    farcasterFollowers: number;
    vouchesReceived: number;
    circlesMemberOf: number;
  };
}

// ==================== TOKEN TYPES ====================

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

export type SupportedStablecoin = "cUSD" | "cEUR" | "cREAL";

// ==================== TRANSACTION TYPES ====================

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  timestamp: number;
  status: "pending" | "success" | "failed";
  type: "deposit" | "withdrawal" | "loan" | "repayment";
}

// ==================== USER TYPES ====================

export interface User {
  address: string;
  creditScore: number;
  isVerified: boolean;
  verificationLevel: "none" | "basic" | "verified" | "trusted";
  farcasterFid?: string;
  activeLoans: number;
  totalBorrowed: bigint;
  totalRepaid: bigint;
  circlesMemberOf: string[];
  joinedAt: number;
}

// ==================== VERIFICATION TYPES ====================

export interface VerificationData {
  address: string;
  level: "basic" | "verified" | "trusted";
  timestamp: number;
  provider: string;
  tokenId: string; // SBT token ID
}

// ==================== ANALYTICS TYPES ====================

export interface PlatformMetrics {
  totalValueLocked: bigint;
  totalLoansActive: number;
  totalLoansDisbursed: number;
  totalRepaid: bigint;
  defaultRate: number; // in basis points
  averageLoanSize: bigint;
  averageCreditScore: number;
  totalUsers: number;
  verifiedUsers: number;
  totalCircles: number;
}

// ==================== API TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreditScoreRequest {
  address: string;
  farcasterFid?: string;
}

export interface CreditScoreResponse {
  score: number;
  breakdown: {
    onChainScore: number;
    socialScore: number;
    verificationScore: number;
  };
  factors: {
    name: string;
    value: number;
    weight: number;
  }[];
}

// ==================== UTILITY TYPES ====================

export type Address = `0x${string}`;

export interface ContractAddresses {
  lendingPool: Address;
  loanManager: Address;
  lendingCircle: Address;
  creditScore: Address;
  collateralManager: Address;
  verificationSBT: Address;
}
