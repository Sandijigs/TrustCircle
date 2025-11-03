/**
 * Farcaster Integration Types
 * Complete type definitions for Farcaster social features
 */

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  verifiedAddresses: string[];
  custody Address: string;
  activeStatus: 'active' | 'inactive';
  registeredAt: Date;
}

export interface FarcasterCast {
  hash: string;
  text: string;
  author: {
    fid: number;
    username: string;
    pfpUrl?: string;
  };
  timestamp: Date;
  reactions: {
    likes: number;
    recasts: number;
    replies: number;
  };
  embeds?: {
    url?: string;
    castId?: {
      fid: number;
      hash: string;
    };
  }[];
  parentCastHash?: string;
  parentUrl?: string;
}

export interface FarcasterChannel {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  leadFid: number;
  followerCount: number;
  createdAt: Date;
}

export interface EngagementMetrics {
  averageLikes: number;
  averageRecasts: number;
  averageReplies: number;
  engagementRate: number;
  totalCasts: number;
  totalReactions: number;
  viralCasts: number; // Casts with >100 likes
  consistencyScore: number; // 0-1, based on regular posting
}

export interface SocialGraph {
  fid: number;
  followers: number[];
  following: number[];
  mutualConnections: number[];
  verifiedFollowers: number[];
  activeFollowers: number[]; // Followers active in last 30 days
  powerFollowers: number[]; // Followers with >1000 followers
}

export interface Vouch {
  id: string;
  voucherFid: number;
  voucherUsername: string;
  voucherAddress: string;
  voucheeFid: number;
  voucheeAddress: string;
  timestamp: Date;
  message?: string;
  isVerified: boolean; // Voucher has VerificationSBT
  isCircleMember: boolean; // Both in same lending circle
  onChainTxHash?: string;
}

export interface VouchStats {
  totalVouches: number;
  verifiedVouches: number;
  circleVouches: number;
  uniqueVouchers: number;
  recentVouches: number; // Last 30 days
  vouchStrength: number; // 0-100, weighted by voucher reputation
}

export interface FarcasterAuthState {
  isAuthenticated: boolean;
  fid?: number;
  username?: string;
  custody Address?: string;
  verifiedAddresses?: string[];
  expiresAt?: Date;
}

export interface FarcasterFrame {
  version: 'vNext';
  image: string;
  imageAspectRatio?: '1.91:1' | '1:1';
  buttons?: FarcasterFrameButton[];
  input?: {
    text: string;
  };
  postUrl?: string;
  state?: string;
}

export interface FarcasterFrameButton {
  index: number;
  action: 'post' | 'post_redirect' | 'link' | 'mint';
  label: string;
  target?: string;
}

export interface FarcasterFrameRequest {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    castId: {
      fid: number;
      hash: string;
    };
    inputText?: string;
    state?: string;
  };
  trustedData: {
    messageBytes: string;
  };
}

export interface LoanFrameData {
  loanId: string;
  borrower: string;
  amount: string;
  purpose: string;
  creditScore: number;
  status: 'requested' | 'active' | 'repaid';
  repaymentProgress?: number;
}

export interface CircleInviteFrameData {
  circleName: string;
  circleId: string;
  memberCount: number;
  totalPooled: string;
  description: string;
  inviterFid: number;
}

export interface SocialCreditSignals {
  followerScore: number; // 0-100
  engagementScore: number; // 0-100
  vouchScore: number; // 0-100
  connectionQualityScore: number; // 0-100
  accountAgeScore: number; // 0-100
  activityScore: number; // 0-100
  overallSocialScore: number; // 0-100
  trustRating: 'high' | 'medium' | 'low' | 'untrusted';
  riskFlags: string[];
}

export interface FarcasterAnalysis {
  user: FarcasterUser;
  engagement: EngagementMetrics;
  socialGraph: SocialGraph;
  vouches: VouchStats;
  creditSignals: SocialCreditSignals;
  lastAnalyzed: Date;
}

// API Response Types
export interface NeynarUserResponse {
  result: {
    user: {
      fid: number;
      username: string;
      display_name: string;
      pfp_url?: string;
      profile: {
        bio: {
          text: string;
        };
      };
      follower_count: number;
      following_count: number;
      verifications: string[];
      active_status: string;
    };
  };
}

export interface NeynarCastsResponse {
  result: {
    casts: Array<{
      hash: string;
      text: string;
      author: {
        fid: number;
        username: string;
        pfp_url?: string;
      };
      timestamp: string;
      reactions: {
        likes_count: number;
        recasts_count: number;
      };
      replies: {
        count: number;
      };
      embeds?: any[];
      parent_hash?: string;
      parent_url?: string;
    }>;
  };
}

export interface HubAPIResponse {
  messages: Array<{
    data: {
      fid: number;
      timestamp: number;
      type: string;
      body?: any;
    };
    hash: string;
  }>;
}
