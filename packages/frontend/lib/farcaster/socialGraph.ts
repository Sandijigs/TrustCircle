/**
 * Social Graph Analyzer
 * Advanced Farcaster social graph analysis and metrics
 */

import {
  farcasterClient,
  getUserByFID,
  getFollowers,
  getFollowing,
  getUserCasts,
} from './farcasterClient';
import type {
  FarcasterUser,
  FarcasterAnalysis,
  EngagementMetrics,
  SocialGraph,
  SocialCreditSignals,
  FarcasterCast,
} from './types';

/**
 * Fetch complete user profile with all social data
 */
export async function fetchUserProfile(fid: number): Promise<FarcasterUser | null> {
  try {
    return await getUserByFID(fid);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Fetch and analyze engagement metrics
 */
export async function fetchEngagementScore(fid: number): Promise<EngagementMetrics> {
  try {
    const casts = await getUserCasts(fid, 100);
    
    if (casts.length === 0) {
      return {
        averageLikes: 0,
        averageRecasts: 0,
        averageReplies: 0,
        engagementRate: 0,
        totalCasts: 0,
        totalReactions: 0,
        viralCasts: 0,
        consistencyScore: 0,
      };
    }

    const totalLikes = casts.reduce((sum, cast) => sum + cast.reactions.likes, 0);
    const totalRecasts = casts.reduce((sum, cast) => sum + cast.reactions.recasts, 0);
    const totalReplies = casts.reduce((sum, cast) => sum + cast.reactions.replies, 0);
    const totalReactions = totalLikes + totalRecasts + totalReplies;

    const averageLikes = totalLikes / casts.length;
    const averageRecasts = totalRecasts / casts.length;
    const averageReplies = totalReplies / casts.length;

    // Engagement rate = average reactions per cast
    // Normalize to 0-1 scale (100 reactions = perfect engagement)
    const engagementRate = Math.min(1, (totalReactions / casts.length) / 100);

    // Count viral casts (>100 likes)
    const viralCasts = casts.filter(cast => cast.reactions.likes > 100).length;

    // Consistency score - posts in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCasts = casts.filter(cast => cast.timestamp > thirtyDaysAgo);
    const consistencyScore = Math.min(1, recentCasts.length / 30); // 1 post per day = perfect

    return {
      averageLikes,
      averageRecasts,
      averageReplies,
      engagementRate,
      totalCasts: casts.length,
      totalReactions,
      viralCasts,
      consistencyScore,
    };
  } catch (error) {
    console.error('Error calculating engagement score:', error);
    return {
      averageLikes: 0,
      averageRecasts: 0,
      averageReplies: 0,
      engagementRate: 0,
      totalCasts: 0,
      totalReactions: 0,
      viralCasts: 0,
      consistencyScore: 0,
    };
  }
}

/**
 * Build social graph with followers and following
 */
export async function buildSocialGraph(fid: number): Promise<SocialGraph> {
  try {
    const [followers, following] = await Promise.all([
      getFollowers(fid),
      getFollowing(fid),
    ]);

    // Find mutual connections
    const mutualConnections = followers.filter(followerFid =>
      following.includes(followerFid)
    );

    // Identify high-quality connections
    // TODO: In production, fetch follower counts for each connection
    // For now, we'll use a heuristic
    const verifiedFollowers = await identifyVerifiedFollowers(followers.slice(0, 50));
    const activeFollowers = await identifyActiveFollowers(followers.slice(0, 50));
    const powerFollowers = await identifyPowerFollowers(followers.slice(0, 50));

    return {
      fid,
      followers,
      following,
      mutualConnections,
      verifiedFollowers,
      activeFollowers,
      powerFollowers,
    };
  } catch (error) {
    console.error('Error building social graph:', error);
    return {
      fid,
      followers: [],
      following: [],
      mutualConnections: [],
      verifiedFollowers: [],
      activeFollowers: [],
      powerFollowers: [],
    };
  }
}

/**
 * Check mutual connections between two users
 */
export async function checkMutualConnections(
  fid1: number,
  fid2: number
): Promise<{
  hasMutual: boolean;
  mutualCount: number;
  mutualFids: number[];
  connectionStrength: number; // 0-1
}> {
  try {
    const [followers1, following1, followers2, following2] = await Promise.all([
      getFollowers(fid1),
      getFollowing(fid1),
      getFollowers(fid2),
      getFollowing(fid2),
    ]);

    // Find mutual followers (people who follow both users)
    const mutualFollowers = followers1.filter(fid => followers2.includes(fid));
    
    // Find mutual following (people both users follow)
    const mutualFollowing = following1.filter(fid => following2.includes(fid));
    
    // Combine for total mutual connections
    const mutualFids = [...new Set([...mutualFollowers, ...mutualFollowing])];
    const mutualCount = mutualFids.length;

    // Check if users directly follow each other
    const user1FollowsUser2 = following1.includes(fid2);
    const user2FollowsUser1 = following2.includes(fid1);
    const bidirectionalFollow = user1FollowsUser2 && user2FollowsUser1;

    // Calculate connection strength
    // - Bidirectional follow: +0.4
    // - Mutual connections: +0.6 (scaled by count)
    let connectionStrength = 0;
    if (bidirectionalFollow) connectionStrength += 0.4;
    
    const maxMutualForPerfect = 50;
    const mutualScore = Math.min(1, mutualCount / maxMutualForPerfect) * 0.6;
    connectionStrength += mutualScore;

    return {
      hasMutual: mutualCount > 0 || bidirectionalFollow,
      mutualCount,
      mutualFids: mutualFids.slice(0, 100), // Limit to 100
      connectionStrength: Math.min(1, connectionStrength),
    };
  } catch (error) {
    console.error('Error checking mutual connections:', error);
    return {
      hasMutual: false,
      mutualCount: 0,
      mutualFids: [],
      connectionStrength: 0,
    };
  }
}

/**
 * Analyze complete Farcaster profile for credit scoring
 */
export async function analyzeFarcasterProfile(fid: number): Promise<FarcasterAnalysis | null> {
  try {
    const [user, engagement, socialGraph] = await Promise.all([
      fetchUserProfile(fid),
      fetchEngagementScore(fid),
      buildSocialGraph(fid),
    ]);

    if (!user) {
      return null;
    }

    // Calculate credit signals
    const creditSignals = calculateSocialCreditSignals(user, engagement, socialGraph);

    // Note: Vouches need to be fetched from on-chain data
    // This will be integrated with vouchSystem.ts
    const vouches = {
      totalVouches: 0,
      verifiedVouches: 0,
      circleVouches: 0,
      uniqueVouchers: 0,
      recentVouches: 0,
      vouchStrength: 0,
    };

    return {
      user,
      engagement,
      socialGraph,
      vouches,
      creditSignals,
      lastAnalyzed: new Date(),
    };
  } catch (error) {
    console.error('Error analyzing Farcaster profile:', error);
    return null;
  }
}

/**
 * Calculate social credit signals for scoring
 */
function calculateSocialCreditSignals(
  user: FarcasterUser,
  engagement: EngagementMetrics,
  socialGraph: SocialGraph
): SocialCreditSignals {
  // Follower score (0-100) with diminishing returns
  // Using sqrt to prevent whale dominance
  const followerScore = Math.min(100, Math.sqrt(user.followerCount / 10) * 100);

  // Engagement score (0-100)
  const engagementScore = engagement.engagementRate * 100;

  // Connection quality score (0-100)
  const totalConnections = socialGraph.followers.length + socialGraph.following.length;
  const qualityMetrics = {
    mutualRatio: socialGraph.mutualConnections.length / Math.max(1, socialGraph.followers.length),
    verifiedRatio: socialGraph.verifiedFollowers.length / Math.max(1, socialGraph.followers.length),
    activeRatio: socialGraph.activeFollowers.length / Math.max(1, socialGraph.followers.length),
    powerRatio: socialGraph.powerFollowers.length / Math.max(1, socialGraph.followers.length),
  };

  const connectionQualityScore = (
    qualityMetrics.mutualRatio * 30 +
    qualityMetrics.verifiedRatio * 25 +
    qualityMetrics.activeRatio * 25 +
    qualityMetrics.powerRatio * 20
  ) * 100;

  // Account age score (0-100)
  const accountAgeDays = Math.floor(
    (Date.now() - user.registeredAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const accountAgeScore = Math.min(100, (accountAgeDays / 365) * 100); // 1 year = perfect

  // Activity score (0-100)
  const activityScore = engagement.consistencyScore * 100;

  // Vouch score - placeholder (will be calculated in vouchSystem.ts)
  const vouchScore = 0;

  // Calculate overall social score
  const weights = {
    follower: 0.20,
    engagement: 0.20,
    connectionQuality: 0.20,
    accountAge: 0.10,
    activity: 0.10,
    vouch: 0.20,
  };

  const overallSocialScore =
    followerScore * weights.follower +
    engagementScore * weights.engagement +
    connectionQualityScore * weights.connectionQuality +
    accountAgeScore * weights.accountAge +
    activityScore * weights.activity +
    vouchScore * weights.vouch;

  // Determine trust rating
  let trustRating: 'high' | 'medium' | 'low' | 'untrusted';
  if (overallSocialScore >= 75) trustRating = 'high';
  else if (overallSocialScore >= 50) trustRating = 'medium';
  else if (overallSocialScore >= 25) trustRating = 'low';
  else trustRating = 'untrusted';

  // Detect risk flags
  const riskFlags: string[] = [];
  
  if (user.followerCount > 1000 && engagement.averageLikes < 5) {
    riskFlags.push('Low engagement despite high followers (possible fake followers)');
  }
  
  if (engagement.totalCasts > 100 && engagement.engagementRate < 0.01) {
    riskFlags.push('High posting volume with minimal engagement (possible bot)');
  }
  
  if (accountAgeDays < 30 && user.followerCount > 500) {
    riskFlags.push('New account with suspicious follower growth');
  }
  
  if (socialGraph.mutualConnections.length === 0 && user.followerCount > 100) {
    riskFlags.push('No mutual connections (possible fake network)');
  }

  return {
    followerScore: Math.round(followerScore),
    engagementScore: Math.round(engagementScore),
    vouchScore: Math.round(vouchScore),
    connectionQualityScore: Math.round(connectionQualityScore),
    accountAgeScore: Math.round(accountAgeScore),
    activityScore: Math.round(activityScore),
    overallSocialScore: Math.round(overallSocialScore),
    trustRating,
    riskFlags,
  };
}

/**
 * Get influential followers (users with >1000 followers)
 */
export async function getInfluentialFollowers(fid: number): Promise<FarcasterUser[]> {
  try {
    const followers = await getFollowers(fid);
    const sampleSize = Math.min(50, followers.length);
    const sample = followers.slice(0, sampleSize);

    const followerProfiles = await Promise.all(
      sample.map(followerFid => getUserByFID(followerFid))
    );

    return followerProfiles
      .filter((profile): profile is FarcasterUser => profile !== null)
      .filter(profile => profile.followerCount > 1000)
      .sort((a, b) => b.followerCount - a.followerCount);
  } catch (error) {
    console.error('Error fetching influential followers:', error);
    return [];
  }
}

// Helper functions for social graph analysis
async function identifyVerifiedFollowers(fids: number[]): Promise<number[]> {
  // TODO: Check if followers have verified addresses
  // For now, return empty array
  return [];
}

async function identifyActiveFollowers(fids: number[]): Promise<number[]> {
  // TODO: Check if followers have recent casts (last 30 days)
  // For now, return a heuristic estimate (50% of sample)
  return fids.slice(0, Math.floor(fids.length * 0.5));
}

async function identifyPowerFollowers(fids: number[]): Promise<number[]> {
  try {
    // Fetch profiles for sample and check follower counts
    const profiles = await Promise.all(
      fids.slice(0, 20).map(fid => getUserByFID(fid))
    );

    return profiles
      .filter((profile): profile is FarcasterUser => profile !== null)
      .filter(profile => profile.followerCount > 1000)
      .map(profile => profile.fid);
  } catch (error) {
    return [];
  }
}

/**
 * Compare two Farcaster profiles
 */
export async function compareProfiles(fid1: number, fid2: number) {
  try {
    const [analysis1, analysis2, mutualData] = await Promise.all([
      analyzeFarcasterProfile(fid1),
      analyzeFarcasterProfile(fid2),
      checkMutualConnections(fid1, fid2),
    ]);

    if (!analysis1 || !analysis2) {
      return null;
    }

    return {
      user1: analysis1,
      user2: analysis2,
      mutual: mutualData,
      comparison: {
        followerDifference: analysis1.user.followerCount - analysis2.user.followerCount,
        engagementDifference: analysis1.engagement.engagementRate - analysis2.engagement.engagementRate,
        scoreDifference: analysis1.creditSignals.overallSocialScore - analysis2.creditSignals.overallSocialScore,
      },
    };
  } catch (error) {
    console.error('Error comparing profiles:', error);
    return null;
  }
}
