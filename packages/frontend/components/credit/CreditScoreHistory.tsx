/**
 * CreditScoreHistory Component
 * 
 * Displays credit score history over time with chart
 * 
 * @example
 * ```tsx
 * <CreditScoreHistory walletAddress="0x..." />
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import type { CreditScoreHistory } from '@/lib/creditScore/types';

interface CreditScoreHistoryProps {
  walletAddress?: string;
  maxEntries?: number;
}

export function CreditScoreHistory({
  walletAddress,
  maxEntries = 10,
}: CreditScoreHistoryProps) {
  const [history, setHistory] = useState<CreditScoreHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchHistory();
    }
  }, [walletAddress]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API endpoint to fetch historical scores
      // For now, use mock data
      const mockHistory: CreditScoreHistory = {
        scores: [
          { score: 450, timestamp: new Date('2025-10-01'), factors: {} as any },
          { score: 500, timestamp: new Date('2025-10-08'), factors: {} as any },
          { score: 550, timestamp: new Date('2025-10-15'), factors: {} as any },
          { score: 580, timestamp: new Date('2025-10-22'), factors: {} as any },
          { score: 620, timestamp: new Date('2025-10-29'), factors: {} as any },
        ],
        trend: 'improving',
        change30d: +170,
        change90d: +170,
      };
      
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching credit score history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!history || history.scores.length === 0) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No History Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your credit score history will appear here as you build your reputation
          </p>
        </div>
      </Card>
    );
  }

  const scores = history.scores.slice(-maxEntries);
  const minScore = Math.min(...scores.map(s => s.score));
  const maxScore = Math.max(...scores.map(s => s.score));
  const scoreRange = maxScore - minScore || 100;

  return (
    <Card padding="lg" shadow="md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Credit Score History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your score over time
          </p>
        </div>

        {/* Trend indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
          history.trend === 'improving'
            ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
            : history.trend === 'declining'
            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
        }`}>
          {history.trend === 'improving' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ) : history.trend === 'declining' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          )}
          <span className="text-sm font-semibold capitalize">
            {history.trend}
          </span>
        </div>
      </div>

      {/* Changes */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">30-Day Change</p>
          <p className={`text-2xl font-bold ${
            history.change30d > 0
              ? 'text-success-600 dark:text-success-400'
              : history.change30d < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {history.change30d > 0 ? '+' : ''}{history.change30d}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">90-Day Change</p>
          <p className={`text-2xl font-bold ${
            history.change90d > 0
              ? 'text-success-600 dark:text-success-400'
              : history.change90d < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {history.change90d > 0 ? '+' : ''}{history.change90d}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 mb-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{maxScore + 50}</span>
          <span>{Math.round((maxScore + minScore) / 2)}</span>
          <span>{Math.max(0, minScore - 50)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full border-l border-b border-gray-200 dark:border-gray-700 relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            <div className="h-1/3 border-b border-gray-100 dark:border-gray-800"></div>
            <div className="h-1/3 border-b border-gray-100 dark:border-gray-800"></div>
          </div>

          {/* Score line */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <polyline
              points={scores.map((score, idx) => {
                const x = (idx / (scores.length - 1 || 1)) * 100;
                const y = 100 - ((score.score - (minScore - 50)) / (scoreRange + 100)) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-500"
            />
          </svg>

          {/* Score points */}
          {scores.map((score, idx) => {
            const x = (idx / (scores.length - 1 || 1)) * 100;
            const y = 100 - ((score.score - (minScore - 50)) / (scoreRange + 100)) * 100;
            
            return (
              <div
                key={idx}
                className="absolute w-3 h-3 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
                title={`${score.score} on ${score.timestamp.toLocaleDateString()}`}
              />
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-12 flex justify-between text-xs text-gray-600 dark:text-gray-400">
        {scores.map((score, idx) => (
          <span key={idx} className="text-center">
            {score.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>

      {/* Score list */}
      <div className="mt-6 space-y-2">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Recent Scores
        </h4>
        {scores.slice().reverse().map((score, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {score.timestamp.toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {score.score}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
