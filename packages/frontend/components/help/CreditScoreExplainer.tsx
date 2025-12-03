/**
 * Credit Score Explainer Component
 *
 * Educational modal/panel explaining how credit scores work
 * and how they affect borrowing capacity
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { CREDIT_TIERS } from '@/lib/creditScore/config';

interface CreditScoreExplainerProps {
  currentScore?: number;
  isModal?: boolean;
  onClose?: () => void;
}

export function CreditScoreExplainer({
  currentScore,
  isModal = false,
  onClose
}: CreditScoreExplainerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tiers' | 'improve' | 'calculate'>('overview');

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            How Credit Scores Work
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Understanding your borrowing capacity and interest rates
          </p>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'tiers', label: 'Score Tiers', icon: '🎯' },
            { id: 'improve', label: 'Improve Score', icon: '📈' },
            { id: 'calculate', label: 'How It\'s Calculated', icon: '🔍' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                What is a Credit Score?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your credit score (0-1000) determines how much you can borrow and at what interest rate.
                It's calculated using AI analysis of your on-chain activity, social reputation, and verification status.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  💡 Key Points
                </h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li>• <strong>New users start at 500 points</strong> ("Fair" rating)</li>
                  <li>• <strong>Default borrowing limit: $1,500</strong> at 18% interest</li>
                  <li>• <strong>Complete loans on time</strong> to improve your score</li>
                  <li>• <strong>Higher scores = Lower rates</strong> (8% to 30%)</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Why Credit Scores Matter
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-2xl mb-2">💰</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Borrowing Capacity
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Higher scores unlock larger loan amounts, from $250 to $10,000
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="text-2xl mb-2">📉</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Lower Interest
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Better scores mean lower rates, saving you money on interest
                  </p>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your credit score determines your tier, which sets your borrowing limit and interest rate:
            </p>

            {CREDIT_TIERS.map((tier) => {
              const isCurrentTier = currentScore && currentScore >= tier.minScore && currentScore <= tier.maxScore;

              return (
                <Card
                  key={tier.tier}
                  className={`p-4 ${isCurrentTier ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{tier.emoji}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {tier.label}
                            {isCurrentTier && (
                              <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">
                                Your Tier
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Score: {tier.minScore}-{tier.maxScore}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {tier.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Borrow up to:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                            ${tier.borrowingLimit.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Interest Rate:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                            {(tier.interestRateBPS / 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === 'improve' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Quick Wins 🚀
              </h3>
              <div className="space-y-3">
                {[
                  { action: 'Take a small loan and repay it on time', points: '+50-100 points', difficulty: 'Easy' },
                  { action: 'Make all payments on schedule', points: '+10-20 per payment', difficulty: 'Easy' },
                  { action: 'Maintain regular wallet activity', points: '+20-40 points', difficulty: 'Easy' },
                  { action: 'Hold stablecoins (cUSD, cEUR, cREAL)', points: '+15-30 points', difficulty: 'Easy' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.points} • {item.difficulty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Long-Term Strategy 📈
              </h3>
              <div className="space-y-3">
                {[
                  { action: 'Complete 5+ loans successfully', points: '+100-200 points', time: '3-6 months' },
                  { action: 'Join lending circles and get vouched', points: '+50-75 points', time: '1-3 months' },
                  { action: 'Build 6+ months of payment history', points: '+150-250 points', time: '6+ months' },
                  { action: 'Increase transaction volume and DeFi activity', points: '+50-100 points', time: 'Ongoing' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.points} • {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                ⚠️ What Hurts Your Score
              </h4>
              <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
                <li>• Late payments: <strong>-20 to -50 points each</strong></li>
                <li>• Defaulting on a loan: <strong>-200 to -500 points</strong></li>
                <li>• Inactive wallet: <strong>Score may stagnate</strong></li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'calculate' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Score Components
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your credit score is calculated using AI analysis of multiple data sources:
              </p>

              <div className="space-y-4">
                <Card className="p-4 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      On-Chain Data
                    </h4>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">60% weight</span>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• <strong>Loan History:</strong> Repayment rate, completed loans, on-time payments</li>
                    <li>• <strong>Wallet Metrics:</strong> Age, transaction count, balance</li>
                    <li>• <strong>DeFi Activity:</strong> Smart contract interactions, transaction volume</li>
                    <li>• <strong>Token Holdings:</strong> Stablecoin balances, portfolio diversity</li>
                  </ul>
                </Card>

                <Card className="p-4 border-l-4 border-green-500">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Social Reputation
                    </h4>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">25% weight</span>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• <strong>Farcaster:</strong> Followers, engagement, account age</li>
                    <li>• <strong>Lending Circles:</strong> Membership, vouches from others</li>
                    <li>• <strong>Community:</strong> Participation and reputation</li>
                  </ul>
                </Card>

                <Card className="p-4 border-l-4 border-purple-500">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Verification
                    </h4>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">15% weight</span>
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• <strong>KYC Status:</strong> Identity verification level</li>
                    <li>• <strong>Badges:</strong> Additional verification achievements</li>
                  </ul>
                </Card>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span>🤖</span>
                AI-Powered Analysis
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                TrustCircle uses Claude AI to analyze your blockchain activity patterns, detect risk factors,
                and calculate your creditworthiness. The AI looks for consistent behavior, transaction patterns,
                and genuine economic activity to provide fair, transparent credit scoring.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
          {/* Backdrop */}
          <div
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-2xl">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return <Card className="p-6">{content}</Card>;
}
