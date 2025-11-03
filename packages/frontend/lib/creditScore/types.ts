/**
 * Credit Score Types
 * 
 * Type definitions for credit scoring system
 */

// On-chain data types
export interface OnChainData {
  walletAddress: string;
  walletAge: number; // days since first transaction
  transactionCount: number;
  transactionFrequency: number; // transactions per month
  totalVolume: number; // in USD
  tokenHoldings: {
    tokens: string[];
    totalValueUSD: number;
    diversity: number; // 0-1, measure of portfolio diversity
  };
  defiInteractions: {
    protocols: string[];
    totalInteractions: number;
    uniqueProtocols: number;
  };
  loanHistory: {
    totalLoans: number;
    activeLoans: number;
    completedLoans: number;
    defaultedLoans: number;
    totalBorrowed: number;
    totalRepaid: number;
    averageRepaymentTime: number; // days
    onTimePayments: number;
    latePayments: number;
  };
  gasPayments: {
    totalPaid: number;
    averageGasPrice: number;
    consistency: number; // 0-1, regularity of payments
  };
  smartContractInteractions: {
    uniqueContracts: number;
    totalInteractions: number;
  };
}

// Social data types
export interface SocialData {
  fid?: number; // Farcaster ID
  username?: string;
  followers: number;
  following: number;
  casts: number; // posts
  engagement: {
    averageLikes: number;
    averageRecasts: number;
    averageReplies: number;
    engagementRate: number; // 0-1
  };
  vouches: {
    totalVouches: number;
    verifiedVouchers: number;
    circleVouches: number;
  };
  connections: {
    totalConnections: number;
    verifiedConnections: number;
    mutualConnections: number;
  };
  accountAge: number; // days
  activity: {
    lastActiveDate: Date;
    activeDays: number;
    consistencyScore: number; // 0-1
  };
}

// Verification data types
export interface VerificationData {
  isVerified: boolean;
  verificationLevel: 0 | 1 | 2 | 3;
  verifiedAt?: Date;
  expiresAt?: Date;
  isExpired: boolean;
}

// Combined input data
export interface CreditScoreInput {
  walletAddress: string;
  farcasterFID?: number;
  onChainData: OnChainData;
  socialData: SocialData;
  verificationData: VerificationData;
  requestedAt: Date;
}

// Factor scores (0-100 each)
export interface FactorScores {
  onChain: {
    walletAge: number;
    transactionFrequency: number;
    loanRepaymentHistory: number;
    tokenHoldings: number;
    defiInteractions: number;
    gasConsistency: number;
    overall: number; // weighted average
  };
  social: {
    followers: number;
    engagement: number;
    vouches: number;
    connectionQuality: number;
    overall: number; // weighted average
  };
  verification: {
    level: number;
    overall: number;
  };
}

// AI analysis result
export interface AIAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  patterns: {
    type: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  anomalies: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  recommendations: string[];
  adjustmentFactor: number; // -0.2 to +0.2, applied to base score
}

// Final credit score result
export interface CreditScore {
  score: number; // 0-1000
  timestamp: Date;
  expiresAt: Date; // 24 hours later
  breakdown: {
    baseScore: number; // before AI adjustments
    aiAdjustment: number;
    finalScore: number;
    factors: FactorScores;
  };
  aiAnalysis: AIAnalysis;
  metadata: {
    walletAddress: string;
    farcasterFID?: number;
    version: string; // algorithm version
    calculationTimeMs: number;
  };
}

// Credit score history
export interface CreditScoreHistory {
  scores: {
    score: number;
    timestamp: Date;
    factors: FactorScores;
  }[];
  trend: 'improving' | 'stable' | 'declining';
  change30d: number; // change over last 30 days
  change90d: number; // change over last 90 days
}

// Score ranges and risk levels
export enum ScoreRange {
  EXCELLENT = 800, // 800-1000
  GOOD = 650, // 650-799
  FAIR = 500, // 500-649
  POOR = 350, // 350-499
  VERY_POOR = 0, // 0-349
}

export interface ScoreRangeInfo {
  range: ScoreRange;
  label: string;
  color: string;
  description: string;
  borrowingLimit: number; // in USD
  interestRateAdjustment: number; // basis points, e.g., -50 = 0.5% reduction
}

// Gaming detection
export interface GamingDetection {
  isGaming: boolean;
  confidence: number; // 0-1
  indicators: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendedAction: 'allow' | 'flag' | 'reject';
}

// API request/response types
export interface CalculateCreditScoreRequest {
  walletAddress: string;
  farcasterFID?: number;
  forceRefresh?: boolean; // bypass cache
}

export interface CalculateCreditScoreResponse {
  success: boolean;
  creditScore?: CreditScore;
  cached: boolean;
  error?: string;
  rateLimitRemaining?: number;
}

// Cache entry
export interface CacheEntry {
  creditScore: CreditScore;
  cachedAt: Date;
  expiresAt: Date;
}

// Rate limit entry
export interface RateLimitEntry {
  requests: {
    timestamp: Date;
    walletAddress: string;
  }[];
  remainingRequests: number;
}
