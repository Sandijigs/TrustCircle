/**
 * Vouch System for Farcaster Users
 * Manages on-chain and off-chain vouches for lending circles
 */

import { parseEther, formatEther } from 'viem';
import type { Vouch, VouchStats } from './types';
import { farcasterClient } from './farcasterClient';

// In-memory vouch storage (replace with database in production)
const vouchesStore = new Map<string, Vouch[]>();

/**
 * Create a vouch for another user
 */
export async function createVouch(params: {
  voucherFid: number;
  voucherUsername: string;
  voucherAddress: string;
  voucheeFid: number;
  voucheeAddress: string;
  message?: string;
  isVerified: boolean;
  isCircleMember: boolean;
}): Promise<{ success: boolean; vouchId?: string; error?: string }> {
  try {
    // Validate inputs
    if (params.voucherFid === params.voucheeFid) {
      return { success: false, error: 'Cannot vouch for yourself' };
    }

    // Check if vouch already exists
    const existing = await getVouchBetweenUsers(
      params.voucherAddress,
      params.voucheeAddress
    );
    
    if (existing) {
      return { success: false, error: 'You have already vouched for this user' };
    }

    // Create vouch
    const vouch: Vouch = {
      id: generateVouchId(params.voucherAddress, params.voucheeAddress),
      voucherFid: params.voucherFid,
      voucherUsername: params.voucherUsername,
      voucherAddress: params.voucherAddress.toLowerCase(),
      voucheeFid: params.voucheeFid,
      voucheeAddress: params.voucheeAddress.toLowerCase(),
      timestamp: new Date(),
      message: params.message,
      isVerified: params.isVerified,
      isCircleMember: params.isCircleMember,
    };

    // Store vouch
    const voucheeKey = vouch.voucheeAddress;
    const existingVouches = vouchesStore.get(voucheeKey) || [];
    vouchesStore.set(voucheeKey, [...existingVouches, vouch]);

    // TODO: Store on-chain via LendingCircle contract
    // const tx = await lendingCircleContract.vouchFor(voucheeAddress);
    // vouch.onChainTxHash = tx.hash;

    return { success: true, vouchId: vouch.id };
  } catch (error: any) {
    console.error('Error creating vouch:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all vouches for a user
 */
export async function getVouchesForUser(address: string): Promise<Vouch[]> {
  try {
    const normalizedAddress = address.toLowerCase();
    return vouchesStore.get(normalizedAddress) || [];
  } catch (error) {
    console.error('Error fetching vouches:', error);
    return [];
  }
}

/**
 * Get vouch statistics for a user
 */
export async function getVouchStats(address: string, fid?: number): Promise<VouchStats> {
  try {
    const vouches = await getVouchesForUser(address);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentVouches = vouches.filter(v => v.timestamp > thirtyDaysAgo).length;

    const verifiedVouches = vouches.filter(v => v.isVerified).length;
    const circleVouches = vouches.filter(v => v.isCircleMember).length;
    const uniqueVouchers = new Set(vouches.map(v => v.voucherAddress)).size;

    // Calculate vouch strength (0-100)
    let vouchStrength = 0;
    
    if (vouches.length > 0) {
      // Base score from total vouches (max 5 vouches = 50 points)
      const baseScore = Math.min(50, vouches.length * 10);
      
      // Bonus for verified vouchers (30 points max)
      const verifiedRatio = verifiedVouches / vouches.length;
      const verifiedBonus = verifiedRatio * 30;
      
      // Bonus for circle member vouches (20 points max)
      const circleRatio = circleVouches / vouches.length;
      const circleBonus = circleRatio * 20;
      
      vouchStrength = baseScore + verifiedBonus + circleBonus;
    }

    return {
      totalVouches: vouches.length,
      verifiedVouches,
      circleVouches,
      uniqueVouchers,
      recentVouches,
      vouchStrength: Math.round(vouchStrength),
    };
  } catch (error) {
    console.error('Error calculating vouch stats:', error);
    return {
      totalVouches: 0,
      verifiedVouches: 0,
      circleVouches: 0,
      uniqueVouchers: 0,
      recentVouches: 0,
      vouchStrength: 0,
    };
  }
}

/**
 * Check if user1 has vouched for user2
 */
export async function hasVouchedFor(
  voucherAddress: string,
  voucheeAddress: string
): Promise<boolean> {
  try {
    const vouch = await getVouchBetweenUsers(voucherAddress, voucheeAddress);
    return vouch !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get vouch between two users
 */
export async function getVouchBetweenUsers(
  voucherAddress: string,
  voucheeAddress: string
): Promise<Vouch | null> {
  try {
    const vouches = await getVouchesForUser(voucheeAddress);
    return vouches.find(
      v => v.voucherAddress.toLowerCase() === voucherAddress.toLowerCase()
    ) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Remove a vouch
 */
export async function removeVouch(
  voucherAddress: string,
  voucheeAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedVouchee = voucheeAddress.toLowerCase();
    const vouches = vouchesStore.get(normalizedVouchee) || [];
    
    const filtered = vouches.filter(
      v => v.voucherAddress.toLowerCase() !== voucherAddress.toLowerCase()
    );

    if (filtered.length === vouches.length) {
      return { success: false, error: 'Vouch not found' };
    }

    vouchesStore.set(normalizedVouchee, filtered);

    // TODO: Remove from blockchain
    // await lendingCircleContract.removeVouch(voucheeAddress);

    return { success: true };
  } catch (error: any) {
    console.error('Error removing vouch:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get mutual vouches between two users
 */
export async function getMutualVouches(
  address1: string,
  address2: string
): Promise<{
  user1VouchesUser2: boolean;
  user2VouchesUser1: boolean;
  bidirectional: boolean;
}> {
  try {
    const [vouch1to2, vouch2to1] = await Promise.all([
      hasVouchedFor(address1, address2),
      hasVouchedFor(address2, address1),
    ]);

    return {
      user1VouchesUser2: vouch1to2,
      user2VouchesUser1: vouch2to1,
      bidirectional: vouch1to2 && vouch2to1,
    };
  } catch (error) {
    return {
      user1VouchesUser2: false,
      user2VouchesUser1: false,
      bidirectional: false,
    };
  }
}

/**
 * Get top vouchers by reputation
 */
export async function getTopVouchers(address: string, limit = 10): Promise<Vouch[]> {
  try {
    const vouches = await getVouchesForUser(address);

    // Sort by reputation score
    const scored = await Promise.all(
      vouches.map(async (vouch) => {
        let score = 0;
        
        // Verified users get +50 points
        if (vouch.isVerified) score += 50;
        
        // Circle members get +30 points
        if (vouch.isCircleMember) score += 30;
        
        // Get voucher's social score from Farcaster
        try {
          const voucherProfile = await farcasterClient.getUserByFID(vouch.voucherFid);
          if (voucherProfile) {
            // Add points based on follower count (max +20)
            score += Math.min(20, Math.sqrt(voucherProfile.followerCount / 10));
          }
        } catch (error) {
          // Ignore errors
        }

        return { vouch, score };
      })
    );

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.vouch);
  } catch (error) {
    console.error('Error getting top vouchers:', error);
    return [];
  }
}

/**
 * Calculate vouch trust score for credit scoring
 */
export async function calculateVouchTrustScore(address: string): Promise<number> {
  try {
    const stats = await getVouchStats(address);
    
    // Base score from vouch strength (0-100)
    let trustScore = stats.vouchStrength;

    // Penalty if no vouches
    if (stats.totalVouches === 0) {
      return 0;
    }

    // Bonus for having multiple unique vouchers
    if (stats.uniqueVouchers >= 3) {
      trustScore += 10;
    }
    if (stats.uniqueVouchers >= 5) {
      trustScore += 10;
    }

    // Bonus for recent vouches (shows ongoing trust)
    if (stats.recentVouches > 0) {
      trustScore += Math.min(10, stats.recentVouches * 3);
    }

    return Math.min(100, Math.round(trustScore));
  } catch (error) {
    console.error('Error calculating vouch trust score:', error);
    return 0;
  }
}

/**
 * Get vouch recommendations (users you might want to vouch for)
 */
export async function getVouchRecommendations(
  address: string,
  fid: number
): Promise<Array<{ fid: number; username: string; reason: string; confidence: number }>> {
  try {
    // Get user's Farcaster connections
    const following = await farcasterClient.getFollowing(fid);
    const verifiedAddresses = new Map<number, string[]>();

    // Check which connections have verified addresses and are TrustCircle users
    const recommendations: Array<{
      fid: number;
      username: string;
      reason: string;
      confidence: number;
    }> = [];

    // Sample first 20 connections
    for (const followingFid of following.slice(0, 20)) {
      try {
        const profile = await farcasterClient.getUserByFID(followingFid);
        if (!profile) continue;

        const addresses = await farcasterClient.getVerifiedAddresses(followingFid);
        if (addresses.length === 0) continue;

        // Check if already vouched
        const alreadyVouched = await hasVouchedFor(address, addresses[0]);
        if (alreadyVouched) continue;

        // Calculate confidence based on connection strength
        let confidence = 50; // Base confidence

        // Mutual follower adds confidence
        const isMutual = await farcasterClient.checkFollow(followingFid, fid);
        if (isMutual) confidence += 30;

        // High follower count adds credibility
        if (profile.followerCount > 1000) confidence += 20;

        recommendations.push({
          fid: followingFid,
          username: profile.username,
          reason: isMutual
            ? 'Mutual connection on Farcaster'
            : 'You follow this user on Farcaster',
          confidence: Math.min(100, confidence),
        });
      } catch (error) {
        continue;
      }
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  } catch (error) {
    console.error('Error getting vouch recommendations:', error);
    return [];
  }
}

// Helper functions
function generateVouchId(voucherAddress: string, voucheeAddress: string): string {
  return `vouch_${voucherAddress}_${voucheeAddress}_${Date.now()}`;
}

/**
 * Export vouch data for integration with credit scoring
 */
export async function getVouchDataForCreditScore(address: string, fid?: number) {
  const [stats, vouches] = await Promise.all([
    getVouchStats(address, fid),
    getVouchesForUser(address),
  ]);

  const trustScore = await calculateVouchTrustScore(address);

  return {
    stats,
    vouches: vouches.slice(0, 10), // Top 10 most recent
    trustScore,
  };
}
