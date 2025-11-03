/**
 * Credit Score Calculator
 * 
 * Combines on-chain, social, and verification data
 * Uses Claude AI for intelligent analysis
 * Calculates final credit score (0-1000)
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  CreditScoreInput,
  CreditScore,
  FactorScores,
  AIAnalysis,
  GamingDetection,
  VerificationData,
} from './types';
import { calculateOnChainScores } from './onChainAnalyzer';
import { calculateSocialScores } from './socialAnalyzer';
import { analyzeFarcasterProfile } from '@/lib/farcaster/socialGraph';
import { getVouchStats, calculateVouchTrustScore } from '@/lib/farcaster/vouchSystem';

// Initialize Claude AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Algorithm version
const ALGORITHM_VERSION = '1.0.0';

// Weights for final score calculation
const WEIGHTS = {
  onChain: 0.60, // 60%
  social: 0.30, // 30%
  verification: 0.10, // 10%
};

/**
 * Calculate complete credit score
 */
export async function calculateCreditScore(
  input: CreditScoreInput
): Promise<CreditScore> {
  const startTime = Date.now();

  try {
    // Calculate individual factor scores
    const onChainScores = calculateOnChainScores(input.onChainData);
    
    // Enhanced social scoring with Farcaster analysis and vouches
    let socialScores = calculateSocialScores(input.socialData);
    
    // If Farcaster FID provided, enhance with advanced social analysis
    if (input.farcasterFID) {
      socialScores = await enhancedSocialScoring(
        input.farcasterFID,
        input.walletAddress,
        socialScores
      );
    }
    
    const verificationScore = calculateVerificationScore(input.verificationData);

    // Create factor scores object
    const factorScores: FactorScores = {
      onChain: onChainScores,
      social: socialScores,
      verification: {
        level: input.verificationData.verificationLevel,
        overall: verificationScore,
      },
    };

    // Calculate base score (0-1000)
    const baseScore = calculateBaseScore(factorScores);

    // Detect gaming attempts
    const gamingDetection = detectGaming(input, factorScores);
    if (gamingDetection.recommendedAction === 'reject') {
      throw new Error('Gaming detected: Score calculation rejected');
    }

    // Get AI analysis from Claude
    const aiAnalysis = await getAIAnalysis(input, factorScores, gamingDetection);

    // Apply AI adjustment
    const adjustedScore = applyAIAdjustment(baseScore, aiAnalysis.adjustmentFactor);
    const finalScore = Math.max(0, Math.min(1000, adjustedScore));

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const calculationTimeMs = Date.now() - startTime;

    return {
      score: Math.round(finalScore),
      timestamp: new Date(),
      expiresAt,
      breakdown: {
        baseScore: Math.round(baseScore),
        aiAdjustment: Math.round(adjustedScore - baseScore),
        finalScore: Math.round(finalScore),
        factors: factorScores,
      },
      aiAnalysis,
      metadata: {
        walletAddress: input.walletAddress,
        farcasterFID: input.farcasterFID,
        version: ALGORITHM_VERSION,
        calculationTimeMs,
      },
    };
  } catch (error) {
    console.error('Error calculating credit score:', error);
    throw error;
  }
}

/**
 * Enhanced social scoring with Farcaster profile analysis and vouches
 * Augments existing social scores with deep Farcaster insights
 */
async function enhancedSocialScoring(
  fid: number,
  walletAddress: string,
  baseSocialScores: FactorScores['social']
): Promise<FactorScores['social']> {
  try {
    // Fetch comprehensive Farcaster analysis and vouch data in parallel
    const [farcasterAnalysis, vouchStats, vouchTrustScore] = await Promise.all([
      analyzeFarcasterProfile(fid),
      getVouchStats(walletAddress, fid),
      calculateVouchTrustScore(walletAddress),
    ]);

    // If Farcaster analysis failed, return base scores
    if (!farcasterAnalysis) {
      console.warn('Farcaster analysis failed, using base social scores');
      return baseSocialScores;
    }

    const { creditSignals } = farcasterAnalysis;

    // Enhanced vouch score incorporating new vouch system
    // Combines base vouches with new vouch trust score
    const enhancedVouchScore = Math.min(
      100,
      baseSocialScores.vouches * 0.5 + vouchTrustScore * 0.5
    );

    // Calculate enhanced social scores with more granular weighting
    const weights = {
      followers: 0.20, // Follower count and quality
      engagement: 0.20, // Engagement metrics
      vouches: 0.30, // Vouch strength (most important)
      connectionQuality: 0.15, // Connection quality
      accountAge: 0.10, // Account maturity
      activity: 0.05, // Recent activity
    };

    const enhancedOverall =
      creditSignals.followerScore * weights.followers +
      creditSignals.engagementScore * weights.engagement +
      enhancedVouchScore * weights.vouches +
      creditSignals.connectionQualityScore * weights.connectionQuality +
      creditSignals.accountAgeScore * weights.accountAge +
      creditSignals.activityScore * weights.activity;

    // Apply risk penalty if flags detected
    const riskPenalty = Math.min(20, creditSignals.riskFlags.length * 5);
    const finalOverall = Math.max(0, enhancedOverall - riskPenalty);

    return {
      overall: Math.round(finalOverall),
      followers: creditSignals.followerScore,
      engagement: creditSignals.engagementScore,
      vouches: Math.round(enhancedVouchScore),
      connectionQuality: creditSignals.connectionQualityScore,
      // Additional metrics from enhanced analysis
      accountAge: creditSignals.accountAgeScore,
      activity: creditSignals.activityScore,
      trustRating: creditSignals.trustRating,
      riskFlags: creditSignals.riskFlags,
      // Vouch breakdown
      vouchStats: {
        total: vouchStats.totalVouches,
        verified: vouchStats.verifiedVouches,
        circle: vouchStats.circleVouches,
        strength: vouchStats.vouchStrength,
        trustScore: vouchTrustScore,
      },
    };
  } catch (error) {
    console.error('Enhanced social scoring failed:', error);
    // Fallback to base social scores on error
    return baseSocialScores;
  }
}

/**
 * Calculate verification score (0-100)
 */
function calculateVerificationScore(verification: VerificationData): number {
  if (!verification.isVerified || verification.isExpired) {
    return 0;
  }

  // Score based on verification level
  const levelScores = {
    0: 0,
    1: 30, // Basic
    2: 60, // Verified
    3: 100, // Trusted
  };

  return levelScores[verification.verificationLevel];
}

/**
 * Calculate base score from factor scores
 */
function calculateBaseScore(factorScores: FactorScores): number {
  const onChainScore = factorScores.onChain.overall;
  const socialScore = factorScores.social.overall;
  const verificationScore = factorScores.verification.overall;

  // Weighted sum
  const weightedScore =
    onChainScore * WEIGHTS.onChain +
    socialScore * WEIGHTS.social +
    verificationScore * WEIGHTS.verification;

  // Convert from 0-100 to 0-1000
  return weightedScore * 10;
}

/**
 * Apply AI adjustment factor
 */
function applyAIAdjustment(baseScore: number, adjustmentFactor: number): number {
  // Adjustment factor ranges from -0.2 to +0.2
  // This can adjust the score by ±20%
  const adjustment = baseScore * adjustmentFactor;
  return baseScore + adjustment;
}

/**
 * Detect gaming attempts
 */
function detectGaming(
  input: CreditScoreInput,
  factorScores: FactorScores
): GamingDetection {
  const indicators: GamingDetection['indicators'] = [];

  // Check for suspiciously perfect scores
  if (
    factorScores.onChain.overall > 95 &&
    factorScores.social.overall > 95 &&
    input.onChainData.walletAge < 30
  ) {
    indicators.push({
      type: 'suspicious_perfection',
      description: 'Unusually high scores for a new account',
      severity: 'high',
    });
  }

  // Check for circular transactions (wash trading)
  if (
    input.onChainData.transactionCount > 100 &&
    input.onChainData.smartContractInteractions.uniqueContracts < 3
  ) {
    indicators.push({
      type: 'circular_transactions',
      description: 'High transaction count with low contract diversity',
      severity: 'medium',
    });
  }

  // Check for bot-like social activity
  if (
    input.socialData.casts > 100 &&
    input.socialData.engagement.engagementRate < 0.01
  ) {
    indicators.push({
      type: 'bot_like_social',
      description: 'High post volume with extremely low engagement',
      severity: 'medium',
    });
  }

  // Check for fake followers
  if (
    input.socialData.followers > 1000 &&
    input.socialData.engagement.averageLikes < 5
  ) {
    indicators.push({
      type: 'fake_followers',
      description: 'Large follower count with disproportionately low engagement',
      severity: 'medium',
    });
  }

  // Check for self-vouching patterns
  if (
    input.socialData.vouches.totalVouches > 0 &&
    input.socialData.vouches.verifiedVouchers === 0
  ) {
    indicators.push({
      type: 'unverified_vouches',
      description: 'All vouches are from unverified users',
      severity: 'low',
    });
  }

  // Determine if gaming is detected
  const highSeverityCount = indicators.filter(i => i.severity === 'high').length;
  const mediumSeverityCount = indicators.filter(i => i.severity === 'medium').length;

  const isGaming = highSeverityCount > 0 || mediumSeverityCount > 2;
  const confidence = Math.min(1, (highSeverityCount * 0.5 + mediumSeverityCount * 0.2));

  let recommendedAction: GamingDetection['recommendedAction'] = 'allow';
  if (highSeverityCount > 0) {
    recommendedAction = 'reject';
  } else if (mediumSeverityCount > 2) {
    recommendedAction = 'flag';
  }

  return {
    isGaming,
    confidence,
    indicators,
    recommendedAction,
  };
}

/**
 * Get AI analysis from Claude
 */
async function getAIAnalysis(
  input: CreditScoreInput,
  factorScores: FactorScores,
  gamingDetection: GamingDetection
): Promise<AIAnalysis> {
  try {
    const prompt = buildClaudePrompt(input, factorScores, gamingDetection);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent scoring
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    return parseAIResponse(responseText);
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    
    // Fallback to rule-based analysis if AI fails
    return getFallbackAnalysis(factorScores, gamingDetection);
  }
}

/**
 * Build prompt for Claude AI
 */
function buildClaudePrompt(
  input: CreditScoreInput,
  factorScores: FactorScores,
  gamingDetection: GamingDetection
): string {
  return `You are a credit risk analyst for a decentralized micro-lending platform called TrustCircle. Analyze the following user data and provide a credit assessment.

## User Data

### Wallet Address
${input.walletAddress}

### On-Chain Activity (Score: ${factorScores.onChain.overall}/100)
- Wallet Age: ${input.onChainData.walletAge} days (Score: ${factorScores.onChain.walletAge}/100)
- Transaction Frequency: ${input.onChainData.transactionFrequency.toFixed(2)} tx/month (Score: ${factorScores.onChain.transactionFrequency}/100)
- Total Transactions: ${input.onChainData.transactionCount}
- Total Volume: $${input.onChainData.totalVolume.toFixed(2)}
- Token Holdings: $${input.onChainData.tokenHoldings.totalValueUSD.toFixed(2)} across ${input.onChainData.tokenHoldings.tokens.length} tokens (Score: ${factorScores.onChain.tokenHoldings}/100)
- DeFi Interactions: ${input.onChainData.defiInteractions.uniqueProtocols} protocols, ${input.onChainData.defiInteractions.totalInteractions} interactions (Score: ${factorScores.onChain.defiInteractions}/100)

### Loan History (Score: ${factorScores.onChain.loanRepaymentHistory}/100)
- Total Loans: ${input.onChainData.loanHistory.totalLoans}
- Completed: ${input.onChainData.loanHistory.completedLoans}
- Active: ${input.onChainData.loanHistory.activeLoans}
- Defaulted: ${input.onChainData.loanHistory.defaultedLoans}
- On-Time Payments: ${input.onChainData.loanHistory.onTimePayments}
- Late Payments: ${input.onChainData.loanHistory.latePayments}
- Total Borrowed: $${input.onChainData.loanHistory.totalBorrowed.toFixed(2)}
- Total Repaid: $${input.onChainData.loanHistory.totalRepaid.toFixed(2)}

### Social Reputation (Score: ${factorScores.social.overall}/100)
${input.farcasterFID ? `
- Farcaster Username: ${input.socialData.username}
- Followers: ${input.socialData.followers} (Score: ${factorScores.social.followers}/100)
- Following: ${input.socialData.following}
- Posts: ${input.socialData.casts}
- Engagement Rate: ${(input.socialData.engagement.engagementRate * 100).toFixed(2)}% (Score: ${factorScores.social.engagement}/100)
- Account Age: ${input.socialData.accountAge} days
- Active Days: ${input.socialData.activity.activeDays}
- Vouches: ${input.socialData.vouches.totalVouches} (${input.socialData.vouches.verifiedVouchers} verified) (Score: ${factorScores.social.vouches}/100)
- Connections: ${input.socialData.connections.totalConnections} (${input.socialData.connections.verifiedConnections} verified) (Score: ${factorScores.social.connectionQuality}/100)
` : 'No social data available'}

### Verification Status (Score: ${factorScores.verification.overall}/100)
- Verified: ${input.verificationData.isVerified ? 'Yes' : 'No'}
- Level: ${input.verificationData.verificationLevel} (${['None', 'Basic', 'Verified', 'Trusted'][input.verificationData.verificationLevel]})
${input.verificationData.isExpired ? '⚠️ Verification expired' : ''}

### Gaming Detection
${gamingDetection.isGaming ? `⚠️ Potential gaming detected (confidence: ${(gamingDetection.confidence * 100).toFixed(0)}%)` : '✓ No gaming detected'}
${gamingDetection.indicators.length > 0 ? gamingDetection.indicators.map(i => 
  `- [${i.severity.toUpperCase()}] ${i.type}: ${i.description}`
).join('\n') : ''}

## Your Task

Analyze this data and provide:

1. **Risk Level**: Classify as "low", "medium", "high", or "critical"
2. **Confidence**: Your confidence in this assessment (0.0 to 1.0)
3. **Patterns**: Identify 2-4 notable patterns (positive, negative, or neutral)
4. **Anomalies**: Flag any concerning anomalies (if any)
5. **Recommendations**: Provide 2-3 actionable recommendations
6. **Adjustment Factor**: A number between -0.2 and +0.2 to adjust the algorithmic score
   - Negative adjustments for concerning patterns
   - Positive adjustments for exceptional trustworthiness
   - Use sparingly; most users should be 0.0 to ±0.05

## Response Format

Respond in JSON format:

\`\`\`json
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "confidence": 0.85,
  "patterns": [
    {
      "type": "pattern_name",
      "description": "Brief description",
      "impact": "positive" | "negative" | "neutral"
    }
  ],
  "anomalies": [
    {
      "type": "anomaly_name",
      "severity": "low" | "medium" | "high",
      "description": "Brief description"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "adjustmentFactor": 0.0
}
\`\`\`

Focus on:
- Consistency between on-chain behavior and social presence
- Loan repayment history (most important factor)
- Evidence of responsible financial behavior
- Red flags or suspicious patterns
- Overall trustworthiness and creditworthiness`;
}

/**
 * Parse AI response from Claude
 */
function parseAIResponse(responseText: string): AIAnalysis {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                      responseText.match(/{[\s\S]*}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonText);

    return {
      riskLevel: parsed.riskLevel || 'medium',
      confidence: parsed.confidence || 0.5,
      patterns: parsed.patterns || [],
      anomalies: parsed.anomalies || [],
      recommendations: parsed.recommendations || [],
      adjustmentFactor: Math.max(-0.2, Math.min(0.2, parsed.adjustmentFactor || 0)),
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw error;
  }
}

/**
 * Fallback analysis if AI is unavailable
 */
function getFallbackAnalysis(
  factorScores: FactorScores,
  gamingDetection: GamingDetection
): AIAnalysis {
  const overallScore = 
    factorScores.onChain.overall * WEIGHTS.onChain +
    factorScores.social.overall * WEIGHTS.social +
    factorScores.verification.overall * WEIGHTS.verification;

  let riskLevel: AIAnalysis['riskLevel'] = 'medium';
  if (overallScore >= 80) riskLevel = 'low';
  else if (overallScore >= 60) riskLevel = 'medium';
  else if (overallScore >= 40) riskLevel = 'high';
  else riskLevel = 'critical';

  const patterns: AIAnalysis['patterns'] = [];
  
  if (factorScores.onChain.loanRepaymentHistory >= 80) {
    patterns.push({
      type: 'strong_repayment_history',
      description: 'Excellent loan repayment track record',
      impact: 'positive',
    });
  }

  if (factorScores.onChain.overall < 40) {
    patterns.push({
      type: 'limited_on_chain_activity',
      description: 'Limited on-chain transaction history',
      impact: 'negative',
    });
  }

  const adjustmentFactor = gamingDetection.isGaming ? -0.1 : 0;

  return {
    riskLevel,
    confidence: 0.6,
    patterns,
    anomalies: gamingDetection.indicators.map(i => ({
      type: i.type,
      severity: i.severity,
      description: i.description,
    })),
    recommendations: [
      'Continue building on-chain history through regular transactions',
      'Maintain good loan repayment behavior',
    ],
    adjustmentFactor,
  };
}

/**
 * Get score range information
 */
export function getScoreRangeInfo(score: number): {
  range: string;
  label: string;
  color: string;
  description: string;
  borrowingLimit: number;
  interestRateAdjustment: number;
} {
  if (score >= 800) {
    return {
      range: '800-1000',
      label: 'Excellent',
      color: 'text-purple-600 dark:text-purple-400',
      description: 'Outstanding credit profile with proven trustworthiness',
      borrowingLimit: 10000,
      interestRateAdjustment: -50, // 0.5% rate reduction
    };
  } else if (score >= 650) {
    return {
      range: '650-799',
      label: 'Good',
      color: 'text-success-600 dark:text-success-400',
      description: 'Strong credit profile with good repayment history',
      borrowingLimit: 5000,
      interestRateAdjustment: -25, // 0.25% rate reduction
    };
  } else if (score >= 500) {
    return {
      range: '500-649',
      label: 'Fair',
      color: 'text-blue-600 dark:text-blue-400',
      description: 'Acceptable credit profile with some history',
      borrowingLimit: 2000,
      interestRateAdjustment: 0, // Standard rate
    };
  } else if (score >= 350) {
    return {
      range: '350-499',
      label: 'Poor',
      color: 'text-yellow-600 dark:text-yellow-400',
      description: 'Limited credit history or some concerning factors',
      borrowingLimit: 500,
      interestRateAdjustment: 50, // 0.5% rate increase
    };
  } else {
    return {
      range: '0-349',
      label: 'Very Poor',
      color: 'text-red-600 dark:text-red-400',
      description: 'Insufficient history or significant risk factors',
      borrowingLimit: 100,
      interestRateAdjustment: 100, // 1% rate increase
    };
  }
}
