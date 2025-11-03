/**
 * Social Data Analyzer
 * 
 * Fetches and analyzes social reputation data from Farcaster
 * Calculates social credit factors
 */

import type { SocialData } from './types';

// Farcaster Hub API endpoint
const FARCASTER_HUB_URL = process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz';

/**
 * Fetch social data for a Farcaster user
 */
export async function fetchSocialData(
  fid?: number,
  walletAddress?: string
): Promise<SocialData> {
  if (!fid && !walletAddress) {
    return getEmptySocialData();
  }

  try {
    // If only wallet address provided, try to find FID
    if (!fid && walletAddress) {
      fid = await getFIDFromWallet(walletAddress);
      if (!fid) {
        return getEmptySocialData();
      }
    }

    // Fetch Farcaster data in parallel
    const [userProfile, userCasts, userConnections, userVouches] = await Promise.all([
      getUserProfile(fid!),
      getUserCasts(fid!),
      getUserConnections(fid!),
      getUserVouches(walletAddress || ''),
    ]);

    // Calculate metrics
    const engagement = calculateEngagement(userCasts);
    const activity = calculateActivity(userCasts, userProfile.createdAt);
    const connections = analyzeConnections(userConnections);

    return {
      fid,
      username: userProfile.username,
      followers: userProfile.followerCount,
      following: userProfile.followingCount,
      casts: userCasts.length,
      engagement,
      vouches: userVouches,
      connections,
      accountAge: calculateAccountAge(userProfile.createdAt),
      activity,
    };
  } catch (error) {
    console.error('Error fetching social data:', error);
    return getEmptySocialData();
  }
}

/**
 * Get empty social data structure
 */
function getEmptySocialData(): SocialData {
  return {
    followers: 0,
    following: 0,
    casts: 0,
    engagement: {
      averageLikes: 0,
      averageRecasts: 0,
      averageReplies: 0,
      engagementRate: 0,
    },
    vouches: {
      totalVouches: 0,
      verifiedVouchers: 0,
      circleVouches: 0,
    },
    connections: {
      totalConnections: 0,
      verifiedConnections: 0,
      mutualConnections: 0,
    },
    accountAge: 0,
    activity: {
      lastActiveDate: new Date(),
      activeDays: 0,
      consistencyScore: 0,
    },
  };
}

/**
 * Get FID from wallet address
 */
async function getFIDFromWallet(walletAddress: string): Promise<number | null> {
  try {
    // Use Farcaster Hub API to get verification
    const response = await fetch(
      `${FARCASTER_HUB_URL}/v1/verificationsByAddress?address=${walletAddress}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.messages && data.messages.length > 0) {
      return data.messages[0].data?.fid || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting FID from wallet:', error);
    return null;
  }
}

/**
 * Get user profile from Farcaster
 */
async function getUserProfile(fid: number): Promise<{
  username: string;
  followerCount: number;
  followingCount: number;
  createdAt: Date;
}> {
  try {
    // Use Farcaster Hub API or Warpcast API
    const response = await fetch(
      `${FARCASTER_HUB_URL}/v1/userDataByFid?fid=${fid}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const data = await response.json();
    
    // Parse user data messages
    const username = data.messages?.find((m: any) => m.data?.type === 'USER_DATA_TYPE_USERNAME')
      ?.data?.value || 'unknown';

    // Get follower/following counts
    const [followerCount, followingCount] = await Promise.all([
      getFollowerCount(fid),
      getFollowingCount(fid),
    ]);

    // Get account creation date from first cast
    const createdAt = await getAccountCreationDate(fid);

    return {
      username,
      followerCount,
      followingCount,
      createdAt,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      username: 'unknown',
      followerCount: 0,
      followingCount: 0,
      createdAt: new Date(),
    };
  }
}

/**
 * Get follower count
 */
async function getFollowerCount(fid: number): Promise<number> {
  try {
    const response = await fetch(
      `${FARCASTER_HUB_URL}/v1/linksByTargetFid?fid=${fid}&link_type=follow`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.messages?.length || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get following count
 */
async function getFollowingCount(fid: number): Promise<number> {
  try {
    const response = await fetch(
      `${FARCASTER_HUB_URL}/v1/linksByFid?fid=${fid}&link_type=follow`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.messages?.length || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get account creation date
 */
async function getAccountCreationDate(fid: number): Promise<Date> {
  try {
    // Get oldest cast
    const response = await fetch(
      `${FARCASTER_HUB_URL}/v1/castsByFid?fid=${fid}&reverse=true&pageSize=1`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      return new Date();
    }

    const data = await response.json();
    if (data.messages && data.messages.length > 0) {
      const timestamp = data.messages[0].data?.timestamp;
      return new Date(timestamp * 1000);
    }

    return new Date();
  } catch (error) {
    return new Date();
  }
}

/**
 * Get user casts (posts)
 */
async function getUserCasts(fid: number): Promise<any[]> {
  try {
    const response = await fetch(
      `${FARCASTER_HUB_URL}/v1/castsByFid?fid=${fid}&pageSize=100`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching user casts:', error);
    return [];
  }
}

/**
 * Get user connections (followers + following)
 */
async function getUserConnections(fid: number): Promise<{
  followers: number[];
  following: number[];
  verified: number[];
}> {
  try {
    const [followersData, followingData] = await Promise.all([
      fetch(`${FARCASTER_HUB_URL}/v1/linksByTargetFid?fid=${fid}&link_type=follow`, {
        next: { revalidate: 3600 },
      }).then(r => r.json()),
      fetch(`${FARCASTER_HUB_URL}/v1/linksByFid?fid=${fid}&link_type=follow`, {
        next: { revalidate: 3600 },
      }).then(r => r.json()),
    ]);

    const followers = followersData.messages?.map((m: any) => m.data?.fid) || [];
    const following = followingData.messages?.map((m: any) => m.data?.targetFid) || [];

    // For now, assume verified connections need additional API calls
    // In production, fetch verification status for connections
    const verified: number[] = [];

    return { followers, following, verified };
  } catch (error) {
    console.error('Error fetching user connections:', error);
    return { followers: [], following: [], verified: [] };
  }
}

/**
 * Get user vouches from lending circles
 */
async function getUserVouches(walletAddress: string): Promise<SocialData['vouches']> {
  // TODO: Implement on-chain vouches from LendingCircle contract
  // For now, return empty data
  
  // In production:
  // 1. Call LendingCircle.getVouches(walletAddress)
  // 2. Count total vouches
  // 3. Check if vouchers are verified (have VerificationSBT)
  // 4. Check if vouches are from circle members
  
  return {
    totalVouches: 0,
    verifiedVouchers: 0,
    circleVouches: 0,
  };
}

/**
 * Calculate engagement metrics
 */
function calculateEngagement(casts: any[]): SocialData['engagement'] {
  if (casts.length === 0) {
    return {
      averageLikes: 0,
      averageRecasts: 0,
      averageReplies: 0,
      engagementRate: 0,
    };
  }

  // Extract reaction counts from casts
  const reactions = casts.map((cast: any) => ({
    likes: cast.reactions?.likes?.length || 0,
    recasts: cast.reactions?.recasts?.length || 0,
    replies: cast.replies?.length || 0,
  }));

  const totalLikes = reactions.reduce((sum, r) => sum + r.likes, 0);
  const totalRecasts = reactions.reduce((sum, r) => sum + r.recasts, 0);
  const totalReplies = reactions.reduce((sum, r) => sum + r.replies, 0);

  const averageLikes = totalLikes / casts.length;
  const averageRecasts = totalRecasts / casts.length;
  const averageReplies = totalReplies / casts.length;

  // Engagement rate = (total interactions) / (total casts)
  const totalInteractions = totalLikes + totalRecasts + totalReplies;
  const engagementRate = Math.min(1, totalInteractions / (casts.length * 10)); // Normalize

  return {
    averageLikes,
    averageRecasts,
    averageReplies,
    engagementRate,
  };
}

/**
 * Calculate activity metrics
 */
function calculateActivity(casts: any[], accountCreatedAt: Date): SocialData['activity'] {
  if (casts.length === 0) {
    return {
      lastActiveDate: new Date(),
      activeDays: 0,
      consistencyScore: 0,
    };
  }

  // Get last active date
  const lastActiveDate = casts.length > 0
    ? new Date(casts[0].data?.timestamp * 1000)
    : new Date();

  // Calculate active days (days with at least 1 cast)
  const castDates = casts.map((cast: any) => {
    const date = new Date(cast.data?.timestamp * 1000);
    return date.toDateString();
  });
  const uniqueDays = new Set(castDates).size;

  // Calculate consistency score
  const accountAge = Math.floor((Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
  const expectedActiveDays = accountAge / 7; // Expect activity once per week
  const consistencyScore = Math.min(1, uniqueDays / Math.max(1, expectedActiveDays));

  return {
    lastActiveDate,
    activeDays: uniqueDays,
    consistencyScore,
  };
}

/**
 * Analyze connections
 */
function analyzeConnections(connections: {
  followers: number[];
  following: number[];
  verified: number[];
}): SocialData['connections'] {
  const totalConnections = new Set([...connections.followers, ...connections.following]).size;
  const verifiedConnections = connections.verified.length;
  
  // Find mutual connections
  const mutualConnections = connections.followers.filter(fid => 
    connections.following.includes(fid)
  ).length;

  return {
    totalConnections,
    verifiedConnections,
    mutualConnections,
  };
}

/**
 * Calculate account age in days
 */
function calculateAccountAge(createdAt: Date): number {
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, ageInDays);
}

/**
 * Calculate social factor scores (0-100 each)
 */
export function calculateSocialScores(data: SocialData): {
  followers: number;
  engagement: number;
  vouches: number;
  connectionQuality: number;
  overall: number;
} {
  // Follower score with diminishing returns (max at 1000 followers)
  const followerScore = Math.min(100, Math.sqrt(data.followers / 1000) * 100);

  // Engagement score
  const engagementScore = data.engagement.engagementRate * 100;

  // Vouch score
  let vouchScore = 0;
  if (data.vouches.totalVouches > 0) {
    const baseScore = Math.min(50, data.vouches.totalVouches * 10);
    const verifiedBonus = (data.vouches.verifiedVouchers / data.vouches.totalVouches) * 30;
    const circleBonus = (data.vouches.circleVouches / data.vouches.totalVouches) * 20;
    vouchScore = baseScore + verifiedBonus + circleBonus;
  }

  // Connection quality score
  let connectionScore = 0;
  if (data.connections.totalConnections > 0) {
    const sizeScore = Math.min(40, data.connections.totalConnections / 10);
    const verifiedRatio = data.connections.verifiedConnections / data.connections.totalConnections;
    const mutualRatio = data.connections.mutualConnections / data.connections.totalConnections;
    connectionScore = sizeScore + verifiedRatio * 30 + mutualRatio * 30;
  }

  // Weighted overall score
  const weights = {
    followers: 0.30,
    engagement: 0.20,
    vouches: 0.30, // Most important
    connectionQuality: 0.20,
  };

  const overall =
    followerScore * weights.followers +
    engagementScore * weights.engagement +
    vouchScore * weights.vouches +
    connectionScore * weights.connectionQuality;

  return {
    followers: Math.round(followerScore),
    engagement: Math.round(engagementScore),
    vouches: Math.round(vouchScore),
    connectionQuality: Math.round(connectionScore),
    overall: Math.round(overall),
  };
}
