/**
 * Credit Score Calculation API Route
 * 
 * POST /api/ai/calculate-credit-score
 * 
 * Calculates AI-powered credit score for a wallet address
 * Includes rate limiting and caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import type {
  CalculateCreditScoreRequest,
  CalculateCreditScoreResponse,
  CreditScoreInput,
} from '@/lib/creditScore/types';
import { fetchOnChainData } from '@/lib/creditScore/onChainAnalyzer';
import { fetchSocialData } from '@/lib/creditScore/socialAnalyzer';
import { calculateCreditScore } from '@/lib/creditScore/scoreCalculator';
import { getCachedScore, setCachedScore, needsRefresh } from '@/lib/creditScore/cache';
import { isRateLimited, recordRequest } from '@/lib/creditScore/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST handler for credit score calculation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CalculateCreditScoreRequest = await request.json();
    const { walletAddress, farcasterFID, forceRefresh } = body;

    // Validate wallet address
    if (!walletAddress || !isAddress(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address',
        } as CalculateCreditScoreResponse,
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = isRateLimited(walletAddress);
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again at ${rateLimit.resetAt.toISOString()}`,
          rateLimitRemaining: rateLimit.remainingRequests,
        } as CalculateCreditScoreResponse,
        { status: 429 }
      );
    }

    // Check cache (unless forceRefresh is true)
    if (!forceRefresh) {
      const cachedScore = getCachedScore(walletAddress);
      if (cachedScore) {
        return NextResponse.json(
          {
            success: true,
            creditScore: cachedScore,
            cached: true,
            rateLimitRemaining: rateLimit.remainingRequests,
          } as CalculateCreditScoreResponse,
          { status: 200 }
        );
      }
    }

    // Record request for rate limiting
    recordRequest(walletAddress);

    // Fetch data from multiple sources in parallel
    const [onChainData, socialData, verificationData] = await Promise.all([
      fetchOnChainData(walletAddress),
      fetchSocialData(farcasterFID, walletAddress),
      fetchVerificationData(walletAddress),
    ]);

    // Prepare input for credit score calculation
    const input: CreditScoreInput = {
      walletAddress,
      farcasterFID,
      onChainData,
      socialData,
      verificationData,
      requestedAt: new Date(),
    };

    // Calculate credit score with AI analysis
    const creditScore = await calculateCreditScore(input);

    // Cache the result
    setCachedScore(walletAddress, creditScore);

    // Store score on-chain (optional, async)
    // This can be done in the background without blocking the response
    storeCreditScoreOnChain(walletAddress, creditScore).catch((error) => {
      console.error('Failed to store credit score on-chain:', error);
    });

    // Return response
    return NextResponse.json(
      {
        success: true,
        creditScore,
        cached: false,
        rateLimitRemaining: rateLimit.remainingRequests - 1,
      } as CalculateCreditScoreResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating credit score:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      } as CalculateCreditScoreResponse,
      { status: 500 }
    );
  }
}

/**
 * GET handler - return API info
 */
export async function GET() {
  return NextResponse.json(
    {
      name: 'TrustCircle Credit Score API',
      version: '1.0.0',
      description: 'AI-powered credit scoring for decentralized lending',
      endpoints: {
        calculate: {
          method: 'POST',
          path: '/api/ai/calculate-credit-score',
          body: {
            walletAddress: 'string (required)',
            farcasterFID: 'number (optional)',
            forceRefresh: 'boolean (optional)',
          },
        },
      },
      rateLimit: {
        maxRequests: 10,
        windowMs: 3600000, // 1 hour
      },
      cache: {
        ttl: 86400000, // 24 hours
      },
    },
    { status: 200 }
  );
}

/**
 * Fetch verification data from VerificationSBT contract
 */
async function fetchVerificationData(walletAddress: string) {
  // TODO: Implement contract call to VerificationSBT
  // For now, return mock data
  
  // In production:
  // 1. Call VerificationSBT.getVerification(walletAddress)
  // 2. Parse verification level, dates, etc.
  // 3. Return structured data
  
  return {
    isVerified: false,
    verificationLevel: 0 as 0 | 1 | 2 | 3,
    isExpired: false,
  };
}

/**
 * Store credit score on-chain (async)
 */
async function storeCreditScoreOnChain(walletAddress: string, creditScore: any): Promise<void> {
  // TODO: Implement contract call to CreditScore.sol
  // For now, just log
  
  // In production:
  // 1. Prepare transaction to CreditScore.setScore()
  // 2. Sign with server wallet (hot wallet with limited funds)
  // 3. Send transaction
  // 4. Wait for confirmation
  // 5. Log transaction hash
  
  console.log(`[CreditScore] Would store score ${creditScore.score} for ${walletAddress}`);
}
