/**
 * Lending Circle Types
 *
 * Type definitions for circles, members, proposals, and related data
 */

export enum CircleStatus {
  Active = 0,
  Paused = 1,
  Closed = 2,
}

export enum ProposalType {
  LoanApproval = 0,
  AddMember = 1,
  RemoveMember = 2,
  ChangeSettings = 3,
}

export enum ProposalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Executed = 3,
}

/**
 * Circle data from smart contract
 */
export interface Circle {
  id: bigint;
  name: string;
  description: string;
  creator: string;
  memberCount: bigint;
  maxMembers: bigint;
  minCreditScore: bigint;
  totalTreasury: bigint;
  activeLoans: bigint;
  completedLoans: bigint;
  defaultedLoans: bigint;
  createdAt: bigint;
  status: CircleStatus;
}

/**
 * Circle data formatted for display
 */
export interface CircleDisplay {
  id: string;
  name: string;
  description: string;
  creator: string;
  memberCount: number;
  maxMembers: number;
  minCreditScore: number;
  totalTreasury: string; // Formatted with decimals
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  createdAt: Date;
  status: CircleStatus;
  statusLabel: string;
  successRate: number; // Percentage
  isFull: boolean;
  canJoin: boolean; // Based on user's credit score
}

/**
 * Member data from smart contract
 */
export interface Member {
  memberAddress: string;
  joinedAt: bigint;
  reputation: bigint;
  loansReceived: bigint;
  loansVotedOn: bigint;
  vouchesGiven: bigint;
  contributedAmount: bigint;
  isActive: boolean;
}

/**
 * Member data formatted for display
 */
export interface MemberDisplay {
  address: string;
  joinedAt: Date;
  reputation: number;
  loansReceived: number;
  loansVotedOn: number;
  vouchesGiven: number;
  contributedAmount: string; // Formatted with decimals
  isActive: boolean;
  reputationTier: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'At Risk';
}

/**
 * Proposal data from smart contract
 */
export interface Proposal {
  id: bigint;
  circleId: bigint;
  proposalType: ProposalType;
  proposer: string;
  targetAddress: string;
  loanAmount: bigint;
  createdAt: bigint;
  votesFor: bigint;
  votesAgainst: bigint;
  totalVoters: bigint;
  status: ProposalStatus;
  description: string;
}

/**
 * Proposal data formatted for display
 */
export interface ProposalDisplay {
  id: string;
  circleId: string;
  proposalType: ProposalType;
  proposalTypeLabel: string;
  proposer: string;
  targetAddress: string;
  loanAmount: string; // Formatted with decimals
  createdAt: Date;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  status: ProposalStatus;
  statusLabel: string;
  description: string;
  expiresAt: Date;
  isExpired: boolean;
  quorumReached: boolean;
  quorumPercentage: number;
  approvalPercentage: number;
  timeRemaining: string;
}

/**
 * Circle statistics
 */
export interface CircleStats {
  totalCircles: number;
  activeCircles: number;
  totalMembers: number;
  averageSuccessRate: number;
  totalTreasury: string;
}

/**
 * Create circle form data
 */
export interface CreateCircleForm {
  name: string;
  description: string;
  maxMembers: number;
  minCreditScore: number;
}

/**
 * Circle filter options
 */
export type CircleFilter = 'all' | 'my-circles' | 'active' | 'full' | 'available';

/**
 * Vouch data
 */
export interface VouchData {
  circleId: string;
  voucher: string;
  vouchee: string;
  timestamp: Date;
  reputationStaked: number;
}
