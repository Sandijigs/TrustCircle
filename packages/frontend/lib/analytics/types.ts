/**
 * Analytics Type Definitions
 * Comprehensive types for platform analytics and metrics
 */

// Time Range Filters
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

// User Role Types
export type UserRole = 'borrower' | 'lender' | 'both';

// ============================================================================
// BORROWER ANALYTICS
// ============================================================================

export interface BorrowerAnalytics {
  totalBorrowed: {
    lifetime: string; // In cUSD
    current: string; // Active loans
  };
  totalRepaid: {
    lifetime: string;
    thisMonth: string;
  };
  creditScore: {
    current: number;
    history: CreditScoreHistoryEntry[];
    trend: 'improving' | 'stable' | 'declining';
    percentile: number; // User's percentile ranking
  };
  activeLoans: LoanSummary[];
  upcomingPayments: PaymentSchedule[];
  repaymentHistory: RepaymentRecord[];
  savings: {
    earlyPaymentSavings: string; // Interest saved from early payments
    totalInterestPaid: string;
  };
  performance: {
    onTimePaymentRate: number; // 0-100
    averageLoanDuration: number; // Days
    totalLoansCompleted: number;
    defaultCount: number;
  };
}

export interface CreditScoreHistoryEntry {
  timestamp: Date;
  score: number;
  change: number; // Change from previous
  reason?: string; // Why it changed
}

export interface LoanSummary {
  loanId: string;
  amount: string;
  amountPaid: string;
  amountRemaining: string;
  progress: number; // 0-100
  dueDate: Date;
  daysRemaining: number;
  status: 'current' | 'late' | 'defaulted';
  nextPayment: {
    amount: string;
    date: Date;
  };
}

export interface PaymentSchedule {
  loanId: string;
  paymentId: string;
  amount: string;
  dueDate: Date;
  status: 'upcoming' | 'due_soon' | 'overdue';
  daysUntilDue: number;
}

export interface RepaymentRecord {
  loanId: string;
  paymentId: string;
  amount: string;
  paidDate: Date;
  wasEarly: boolean;
  wasLate: boolean;
  daysEarly?: number;
  daysLate?: number;
  interestSaved?: string;
  lateFee?: string;
}

// ============================================================================
// LENDER ANALYTICS
// ============================================================================

export interface LenderAnalytics {
  totalDeposited: {
    total: string;
    byToken: TokenBreakdown[];
  };
  interestEarned: {
    lifetime: string;
    thisMonth: string;
    thisWeek: string;
    byToken: TokenBreakdown[];
  };
  currentAPY: {
    weighted: number; // Weighted average across pools
    byToken: APYBreakdown[];
  };
  portfolioAllocation: PortfolioAllocation[];
  riskExposure: {
    utilization: number; // Overall utilization rate
    byPool: UtilizationBreakdown[];
    loansAtRisk: number; // Count of late loans
    exposureToRisk: string; // Amount in at-risk loans
  };
  earningsProjections: {
    nextMonth: string;
    nextYear: string;
    assumptions: string; // Description of assumptions
  };
  performance: {
    totalReturns: string; // Total earned
    returnsRate: number; // % return on investment
    averageAPY: number;
    depositsCount: number;
    withdrawalsCount: number;
  };
}

export interface TokenBreakdown {
  token: 'cUSD' | 'cEUR' | 'cREAL';
  amount: string;
  percentage: number;
}

export interface APYBreakdown {
  token: 'cUSD' | 'cEUR' | 'cREAL';
  poolAddress: string;
  currentAPY: number;
  averageAPY: number;
  highestAPY: number;
  lowestAPY: number;
}

export interface PortfolioAllocation {
  token: 'cUSD' | 'cEUR' | 'cREAL';
  poolAddress: string;
  amount: string;
  percentage: number;
  earnedInterest: string;
  currentAPY: number;
}

export interface UtilizationBreakdown {
  token: 'cUSD' | 'cEUR' | 'cREAL';
  poolAddress: string;
  totalLiquidity: string;
  utilized: string;
  available: string;
  utilizationRate: number; // 0-100
  status: 'healthy' | 'high' | 'critical';
}

// ============================================================================
// CIRCLE ANALYTICS
// ============================================================================

export interface CircleAnalytics {
  circleId: string;
  circleName: string;
  healthScore: {
    overall: number; // 0-100
    trend: 'improving' | 'stable' | 'declining';
    factors: HealthFactor[];
  };
  memberPerformance: {
    totalMembers: number;
    activeMembers: number;
    defaultedMembers: number;
    averageCreditScore: number;
    creditScoreDistribution: ScoreDistribution[];
  };
  defaultRate: {
    current: number; // % of loans in default
    historical: number; // Historical default rate
    trend: 'improving' | 'worsening' | 'stable';
  };
  earnings: {
    totalEarned: string;
    distributedToMembers: string;
    averagePerMember: string;
    topEarners: MemberEarnings[];
  };
  activeLoans: {
    count: number;
    totalValue: string;
    averageLoanSize: string;
    largestLoan: string;
  };
}

export interface HealthFactor {
  name: string;
  score: number; // 0-100
  weight: number; // Weight in overall score
  description: string;
}

export interface ScoreDistribution {
  range: string; // "0-200", "201-400", etc.
  count: number;
  percentage: number;
}

export interface MemberEarnings {
  address: string;
  name?: string;
  earned: string;
  share: number; // Percentage of total
}

// ============================================================================
// ADMIN ANALYTICS
// ============================================================================

export interface PlatformOverview {
  tvl: {
    total: string;
    byToken: TokenBreakdown[];
    change24h: number; // Percentage change
    change7d: number;
    chart: TVLChartData[];
  };
  loans: {
    totalDisbursed: string;
    activeCount: number;
    activeValue: string;
    completedCount: number;
    defaultedCount: number;
    defaultRate: number; // Percentage
  };
  users: {
    total: number;
    borrowers: number;
    lenders: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    growth: GrowthMetrics;
  };
  transactions: {
    total: number;
    volume24h: string;
    volume7d: string;
    volume30d: string;
    byType: TransactionBreakdown[];
  };
  circles: {
    total: number;
    active: number;
    averageHealthScore: number;
    totalMembers: number;
  };
}

export interface TVLChartData {
  timestamp: Date;
  total: number; // Numeric value for charting
  cUSD: number;
  cEUR: number;
  cREAL: number;
}

export interface GrowthMetrics {
  dailyGrowthRate: number; // Percentage
  weeklyGrowthRate: number;
  monthlyGrowthRate: number;
  chart: GrowthChartData[];
}

export interface GrowthChartData {
  date: Date;
  users: number;
  newUsers: number;
}

export interface TransactionBreakdown {
  type: 'deposit' | 'withdrawal' | 'borrow' | 'repay' | 'default';
  count: number;
  volume: string;
  percentage: number;
}

// ============================================================================
// RISK MONITORING
// ============================================================================

export interface RiskMonitoring {
  loansAtRisk: {
    count: number;
    totalValue: string;
    byCircle: RiskByCircle[];
    bySeverity: RiskBySeverity[];
  };
  poolUtilization: {
    overall: number;
    byToken: UtilizationBreakdown[];
    warnings: UtilizationWarning[];
  };
  liquidityCrisis: {
    isAtRisk: boolean;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    affectedPools: string[];
    recommendations: string[];
  };
  defaultPredictions: {
    next30Days: PredictedDefault[];
    confidence: number; // 0-100
    accuracyMetrics: AccuracyMetrics;
  };
  circleHealth: {
    atRiskCount: number;
    criticalCount: number;
    circles: CircleRiskSummary[];
  };
  fraudAlerts: FraudAlert[];
}

export interface RiskByCircle {
  circleId: string;
  circleName: string;
  loansAtRisk: number;
  value: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskBySeverity {
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  value: string;
  percentage: number;
}

export interface UtilizationWarning {
  poolAddress: string;
  token: 'cUSD' | 'cEUR' | 'cREAL';
  currentUtilization: number;
  threshold: number;
  severity: 'warning' | 'danger' | 'critical';
  message: string;
}

export interface PredictedDefault {
  loanId: string;
  borrower: string;
  amount: string;
  probability: number; // 0-100
  factors: string[];
  dueDate: Date;
}

export interface AccuracyMetrics {
  precision: number; // 0-1
  recall: number; // 0-1
  f1Score: number; // 0-1
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface CircleRiskSummary {
  circleId: string;
  circleName: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
}

export interface FraudAlert {
  id: string;
  type: 'gaming' | 'circular_lending' | 'identity_theft' | 'bot_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  description: string;
  detectedAt: Date;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export interface UserManagement {
  verificationQueue: VerificationRequest[];
  flaggedAccounts: FlaggedAccount[];
  userSearch: UserSearchResult[];
  creditScoreDistribution: ScoreDistribution[];
  activityLogs: ActivityLog[];
}

export interface VerificationRequest {
  userId: string;
  address: string;
  requestedAt: Date;
  verificationType: 'basic' | 'verified' | 'trusted';
  status: 'pending' | 'approved' | 'rejected';
  documents?: string[]; // Document IDs
  reviewer?: string;
}

export interface FlaggedAccount {
  address: string;
  reason: string;
  flaggedAt: Date;
  flaggedBy: 'system' | 'admin' | 'community';
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'reviewing' | 'resolved';
  actions: string[];
}

export interface UserSearchResult {
  address: string;
  farcasterUsername?: string;
  creditScore: number;
  totalBorrowed: string;
  totalRepaid: string;
  defaultCount: number;
  joinedAt: Date;
  lastActive: Date;
  circles: string[]; // Circle IDs
  flags: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string; // Address
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// AI MODEL PERFORMANCE
// ============================================================================

export interface AIModelPerformance {
  creditScoreAccuracy: {
    correlation: number; // Correlation with actual default rate
    meanAbsoluteError: number;
    rootMeanSquaredError: number;
    distributionChart: ScoreAccuracyData[];
  };
  defaultPrediction: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: ConfusionMatrix;
  };
  modelDrift: {
    isDrifting: boolean;
    driftScore: number; // 0-100, higher = more drift
    affectedFeatures: string[];
    lastRetrainedAt: Date;
    recommendation: string;
  };
  biasDetection: {
    hasBias: boolean;
    biasMetrics: BiasMetric[];
    fairnessScore: number; // 0-100
  };
}

export interface ScoreAccuracyData {
  scoreRange: string;
  predictedDefaultRate: number;
  actualDefaultRate: number;
  sampleSize: number;
}

export interface ConfusionMatrix {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface BiasMetric {
  feature: string; // e.g., "wallet_age", "circle_size"
  bias: number; // -1 to 1
  severity: 'none' | 'low' | 'medium' | 'high';
  description: string;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface MultiSeriesChartData {
  timestamp: Date;
  [key: string]: Date | number | string;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  timeRange: TimeRange;
  includeCharts: boolean;
}

export interface ExportData {
  filename: string;
  data: string; // CSV or JSON string
  mimeType: string;
}
