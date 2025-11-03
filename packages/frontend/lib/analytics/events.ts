/**
 * Analytics Events
 * 
 * Typed definitions for all analytics events.
 * Ensures consistency across the application.
 */

// User Journey Events
export type AnalyticsEvent =
  // Authentication & Onboarding
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'verification_started'
  | 'verification_completed'
  | 'verification_failed'
  
  // Loan Events
  | 'loan_request_started'
  | 'loan_request_completed'
  | 'loan_request_failed'
  | 'loan_approved'
  | 'loan_rejected'
  | 'loan_disbursed'
  | 'payment_made'
  | 'payment_failed'
  | 'loan_completed'
  | 'loan_defaulted'
  
  // Lending Pool Events
  | 'deposit_started'
  | 'deposit_completed'
  | 'deposit_failed'
  | 'withdrawal_started'
  | 'withdrawal_completed'
  | 'withdrawal_failed'
  
  // Circle Events
  | 'circle_created'
  | 'circle_joined'
  | 'circle_left'
  | 'circle_proposal_created'
  | 'circle_proposal_voted'
  | 'circle_member_vouched'
  
  // Credit Score Events
  | 'credit_score_viewed'
  | 'credit_score_updated'
  
  // UI Interactions
  | 'page_viewed'
  | 'button_clicked'
  | 'form_submitted'
  | 'error_occurred'
  | 'modal_opened'
  | 'modal_closed'
  
  // Performance
  | 'transaction_confirmed'
  | 'transaction_failed';

// User Properties
export interface UserProperties {
  address?: string; // Will be hashed
  creditScore?: number;
  totalLoans?: number;
  activeLoans?: number;
  completedLoans?: number;
  defaultedLoans?: number;
  totalBorrowed?: string; // In token units
  totalRepaid?: string;
  isVerified?: boolean;
  verificationMethod?: string;
  circles?: number; // Number of circles joined
  firstSeenAt?: string;
  lastSeenAt?: string;
  userAgent?: string;
  locale?: string;
}

// Event Properties
export interface EventProperties {
  // Common
  timestamp?: string;
  sessionId?: string;
  platform?: 'web' | 'mobile';
  
  // Loan specific
  loanId?: string;
  loanAmount?: string;
  loanDuration?: number;
  interestRate?: number;
  paymentFrequency?: number;
  creditScore?: number;
  
  // Circle specific
  circleId?: string;
  circleName?: string;
  circleSize?: number;
  proposalId?: string;
  voteSupport?: boolean;
  
  // Transaction specific
  txHash?: string;
  gasUsed?: string;
  gasPrice?: string;
  network?: string;
  
  // UI specific
  page?: string;
  url?: string;
  referrer?: string;
  buttonLabel?: string;
  formName?: string;
  errorMessage?: string;
  modalName?: string;
  
  // Performance
  duration_ms?: number;
  duration_seconds?: number;
  
  // Additional context
  [key: string]: any;
}

// Funnel stages
export enum UserJourneyStage {
  LANDED = 'landed',
  CONNECTED_WALLET = 'connected_wallet',
  STARTED_VERIFICATION = 'started_verification',
  COMPLETED_VERIFICATION = 'completed_verification',
  REQUESTED_LOAN = 'requested_loan',
  LOAN_APPROVED = 'loan_approved',
  LOAN_DISBURSED = 'loan_disbursed',
  FIRST_PAYMENT = 'first_payment',
  LOAN_COMPLETED = 'loan_completed',
}

// Conversion goals
export enum ConversionGoal {
  WALLET_CONNECTION = 'wallet_connection',
  VERIFICATION = 'verification',
  LOAN_REQUEST = 'loan_request',
  LOAN_APPROVAL = 'loan_approval',
  FIRST_REPAYMENT = 'first_repayment',
  LOAN_COMPLETION = 'loan_completion',
}

// Error types for tracking
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  TRANSACTION_FAILED = 'transaction_failed',
  VALIDATION_ERROR = 'validation_error',
  SMART_CONTRACT_ERROR = 'smart_contract_error',
  WALLET_ERROR = 'wallet_error',
  API_ERROR = 'api_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Event tracking helpers
 */

// Track loan request flow
export const trackLoanRequest = {
  started: (amount: string, duration: number) => ({
    event: 'loan_request_started' as AnalyticsEvent,
    properties: { loanAmount: amount, loanDuration: duration },
  }),
  
  completed: (loanId: string, amount: string, creditScore: number) => ({
    event: 'loan_request_completed' as AnalyticsEvent,
    properties: { loanId, loanAmount: amount, creditScore },
  }),
  
  failed: (error: string, amount: string) => ({
    event: 'loan_request_failed' as AnalyticsEvent,
    properties: { errorMessage: error, loanAmount: amount },
  }),
};

// Track deposit flow
export const trackDeposit = {
  started: (amount: string, token: string) => ({
    event: 'deposit_started' as AnalyticsEvent,
    properties: { amount, token },
  }),
  
  completed: (txHash: string, amount: string) => ({
    event: 'deposit_completed' as AnalyticsEvent,
    properties: { txHash, amount },
  }),
  
  failed: (error: string, amount: string) => ({
    event: 'deposit_failed' as AnalyticsEvent,
    properties: { errorMessage: error, amount },
  }),
};

// Track repayment
export const trackRepayment = {
  made: (loanId: string, amount: string, remaining: string) => ({
    event: 'payment_made' as AnalyticsEvent,
    properties: { loanId, amount, remainingBalance: remaining },
  }),
  
  failed: (loanId: string, error: string) => ({
    event: 'payment_failed' as AnalyticsEvent,
    properties: { loanId, errorMessage: error },
  }),
};

// Track circle interactions
export const trackCircle = {
  created: (circleId: string, name: string, maxMembers: number) => ({
    event: 'circle_created' as AnalyticsEvent,
    properties: { circleId, circleName: name, maxMembers },
  }),
  
  joined: (circleId: string, name: string) => ({
    event: 'circle_joined' as AnalyticsEvent,
    properties: { circleId, circleName: name },
  }),
  
  voted: (proposalId: string, support: boolean) => ({
    event: 'circle_proposal_voted' as AnalyticsEvent,
    properties: { proposalId, voteSupport: support },
  }),
};

// Track errors
export const trackError = {
  occurred: (type: ErrorType, message: string, context?: Record<string, any>) => ({
    event: 'error_occurred' as AnalyticsEvent,
    properties: {
      errorType: type,
      errorMessage: message,
      ...context,
    },
  }),
};

// Track performance
export const trackPerformance = {
  transaction: (txHash: string, durationMs: number, gasUsed: string) => ({
    event: 'transaction_confirmed' as AnalyticsEvent,
    properties: {
      txHash,
      duration_ms: durationMs,
      gasUsed,
    },
  }),
};
