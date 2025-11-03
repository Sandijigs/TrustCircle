/**
 * CreditScoreDisplay Component
 * 
 * Displays credit score with visual gauge and detailed breakdown
 * 
 * @example
 * ```tsx
 * <CreditScoreDisplay />
 * ```
 */

'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { useCreditScore } from '@/hooks/useCreditScore';

interface CreditScoreDisplayProps {
  walletAddress?: string;
  farcasterFID?: number;
  showActions?: boolean;
  compact?: boolean;
}

export function CreditScoreDisplay({
  walletAddress,
  farcasterFID,
  showActions = true,
  compact = false,
}: CreditScoreDisplayProps) {
  const {
    creditScore,
    isLoading,
    error,
    isCached,
    rateLimitRemaining,
    fetchCreditScore,
    refreshCreditScore,
    getScoreRangeInfo,
    getTimeUntilExpiration,
  } = useCreditScore({ farcasterFID });

  const [showBreakdown, setShowBreakdown] = useState(!compact);

  const scoreRange = getScoreRangeInfo();
  const expiresIn = getTimeUntilExpiration();

  // Loading state
  if (isLoading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error && !creditScore) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Credit Score
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          {showActions && (
            <Button variant="primary" onClick={() => fetchCreditScore()}>
              Try Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // No score yet
  if (!creditScore) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Calculate Your Credit Score
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get an AI-powered credit score based on your on-chain activity and social reputation
          </p>
          {showActions && (
            <Button variant="primary" onClick={() => fetchCreditScore()}>
              Calculate Score
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Display score
  return (
    <Card padding="lg" shadow="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Credit Score
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isCached && '💾 Cached • '}Expires in {expiresIn}
          </p>
        </div>
        
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshCreditScore()}
            disabled={isLoading || (rateLimitRemaining !== null && rateLimitRemaining === 0)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Score Gauge */}
      <div className="relative mb-8">
        {/* Circular gauge */}
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Score arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                strokeDasharray={`${(creditScore.score / 1000) * 502.4} 502.4`}
                strokeLinecap="round"
                className={scoreRange?.color || 'text-gray-500'}
              />
            </svg>

            {/* Score number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${scoreRange?.color}`}>
                {creditScore.score}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                out of 1000
              </div>
              {scoreRange && (
                <div className={`text-lg font-semibold mt-2 ${scoreRange.color}`}>
                  {scoreRange.label}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score range bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span>0</span>
            <span>350</span>
            <span>500</span>
            <span>650</span>
            <span>800</span>
            <span>1000</span>
          </div>
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 via-green-500 to-purple-500"></div>
            
            {/* Score marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gray-900 dark:bg-white"
              style={{ left: `${(creditScore.score / 1000) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Score info */}
      {scoreRange && (
        <Card padding="md" className={scoreRange.bgColor + ' mb-6'}>
          <div className="flex items-start gap-3">
            <svg className={`w-6 h-6 ${scoreRange.color} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className={`font-semibold ${scoreRange.color} mb-1`}>
                {scoreRange.description}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Maximum borrowing limit: <strong>${scoreRange.borrowingLimit.toLocaleString()}</strong>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* AI Analysis Summary */}
      {creditScore.aiAnalysis && (
        <Card padding="md" className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-800 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                AI Analysis
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">
                Risk Level: <strong className="capitalize">{creditScore.aiAnalysis.riskLevel}</strong> 
                {' '}({Math.round(creditScore.aiAnalysis.confidence * 100)}% confidence)
              </p>
              {creditScore.aiAnalysis.recommendations.length > 0 && (
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  {creditScore.aiAnalysis.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Toggle breakdown */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4"
      >
        <span className="font-semibold text-gray-900 dark:text-white">
          Score Breakdown
        </span>
        <svg
          className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
            showBreakdown ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Detailed breakdown */}
      {showBreakdown && (
        <div className="space-y-4">
          {/* On-Chain factors */}
          <FactorBreakdown
            title="On-Chain Activity"
            weight={60}
            score={creditScore.breakdown.factors.onChain.overall}
            items={[
              { label: 'Wallet Age', score: creditScore.breakdown.factors.onChain.walletAge },
              { label: 'Transaction Frequency', score: creditScore.breakdown.factors.onChain.transactionFrequency },
              { label: 'Loan Repayment History', score: creditScore.breakdown.factors.onChain.loanRepaymentHistory, important: true },
              { label: 'Token Holdings', score: creditScore.breakdown.factors.onChain.tokenHoldings },
              { label: 'DeFi Interactions', score: creditScore.breakdown.factors.onChain.defiInteractions },
              { label: 'Gas Consistency', score: creditScore.breakdown.factors.onChain.gasConsistency },
            ]}
          />

          {/* Social factors */}
          <FactorBreakdown
            title="Social Reputation"
            weight={30}
            score={creditScore.breakdown.factors.social.overall}
            items={[
              { label: 'Followers', score: creditScore.breakdown.factors.social.followers },
              { label: 'Engagement', score: creditScore.breakdown.factors.social.engagement },
              { label: 'Vouches', score: creditScore.breakdown.factors.social.vouches, important: true },
              { label: 'Connection Quality', score: creditScore.breakdown.factors.social.connectionQuality },
            ]}
          />

          {/* Verification */}
          <FactorBreakdown
            title="Verification Status"
            weight={10}
            score={creditScore.breakdown.factors.verification.overall}
            items={[
              { 
                label: `Level ${creditScore.breakdown.factors.verification.level}`,
                score: creditScore.breakdown.factors.verification.overall 
              },
            ]}
          />
        </div>
      )}

      {/* Rate limit info */}
      {rateLimitRemaining !== null && (
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          {rateLimitRemaining} calculation{rateLimitRemaining !== 1 ? 's' : ''} remaining this hour
        </p>
      )}
    </Card>
  );
}

// Helper component for factor breakdown
function FactorBreakdown({
  title,
  weight,
  score,
  items,
}: {
  title: string;
  weight: number;
  score: number;
  items: { label: string; score: number; important?: boolean }[];
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">
          {title} <span className="text-gray-600 dark:text-gray-400 text-sm">({weight}% weight)</span>
        </h4>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {score}/100
        </span>
      </div>
      
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className={`text-sm flex-1 ${item.important ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {item.label}
            </span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  item.score >= 80
                    ? 'bg-success-500'
                    : item.score >= 60
                    ? 'bg-blue-500'
                    : item.score >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${item.score}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
