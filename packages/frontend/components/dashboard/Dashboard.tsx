/**
 * Dashboard Component
 * 
 * Main dashboard page showing user's financial overview
 * Displays stats, credit score, recent activity, and quick actions
 * 
 * Design Decisions:
 * - Grid layout for stats with responsive breakpoints
 * - Priority information above the fold
 * - Quick actions prominently displayed
 * - Visual hierarchy: stats → score → activity
 * - Mobile-optimized with single column on small screens
 * 
 * @example
 * ```tsx
 * <Dashboard user={user} loading={false} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { StatCard } from './StatCard';
import { CreditScoreGauge } from './CreditScoreGauge';
import { ActivityFeed } from './ActivityFeed';
import { Button } from '@/components/ui/Button';
import { ActivityItem } from '@/types/components';
import { useCreditScore } from '@/hooks/useCreditScore';
import { getSafeBorrowingLimit, getSafeCreditScore } from '@/lib/creditScore/borrowingUtils';

interface DashboardStats {
  totalBorrowed: string;
  availableToBorrow: string;
  activeLoans: number;
  totalEarned: string;
}

interface DashboardProps {
  stats?: DashboardStats;
  creditScore?: number;
  activities?: ActivityItem[];
  loading?: boolean;
  onRequestLoan?: () => void;
  onJoinCircle?: () => void;
  onDeposit?: () => void;
}

export function Dashboard({
  stats = {
    totalBorrowed: '0.00',
    availableToBorrow: '0.00',
    activeLoans: 0,
    totalEarned: '0.00',
  },
  creditScore = 500,
  activities = [],
  loading = false,
  onRequestLoan,
  onJoinCircle,
  onDeposit,
}: DashboardProps) {
  const { address } = useAccount();
  const { creditScore: fetchedScore, isLoading: creditLoading, fetchCreditScore } = useCreditScore({ autoFetch: false });
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Fetch credit score on mount
  useEffect(() => {
    if (address && !fetchedScore && !creditLoading) {
      fetchCreditScore();
    }
  }, [address, fetchedScore, creditLoading, fetchCreditScore]);

  // Calculate display values based on credit score with safe fallbacks
  console.log('[Dashboard] fetchedScore:', fetchedScore);
  console.log('[Dashboard] fetchedScore?.score:', fetchedScore?.score);
  console.log('[Dashboard] creditScore prop:', creditScore);
  
  const displayCreditScore = getSafeCreditScore(fetchedScore?.score ?? creditScore);
  const borrowingLimit = getSafeBorrowingLimit(fetchedScore?.score ?? creditScore);
  
  console.log('[Dashboard] Final displayCreditScore:', displayCreditScore);
  console.log('[Dashboard] Final borrowingLimit:', borrowingLimit);
  
  const displayStats = {
    ...stats,
    availableToBorrow: borrowingLimit.toFixed(2),
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-success-600 rounded-xl p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome to TrustCircle
        </h1>
        <p className="text-primary-100 mb-4">
          Your decentralized micro-lending platform on Celo
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onRequestLoan}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Request Loan
          </Button>
          
          <Button
            variant="ghost"
            size="md"
            onClick={onJoinCircle}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          >
            Join Circle
          </Button>
          
          <Button
            variant="ghost"
            size="md"
            onClick={onDeposit}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            }
          >
            Deposit
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Total Borrowed"
          value={`${stats.totalBorrowed} cUSD`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          colorScheme="primary"
          loading={loading}
        />

        <StatCard
          label="Available to Borrow"
          value={`$${displayStats.availableToBorrow}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          colorScheme="success"
          loading={loading}
        />

        <StatCard
          label="Active Loans"
          value={stats.activeLoans.toString()}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          colorScheme="warning"
          loading={loading}
        />

        <StatCard
          label="Total Earned"
          value={`${stats.totalEarned} cUSD`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          change={{ value: 12.5, type: 'increase' }}
          colorScheme="success"
          loading={loading}
        />
      </div>

      {/* Credit Score and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Score */}
        <div className="lg:col-span-1">
          <CreditScoreGauge
            score={displayCreditScore}
            size="md"
            showLabel
            animated
          />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <ActivityFeed
            items={activities}
            loading={loading}
            onItemClick={setSelectedActivity}
          />
        </div>
      </div>

      {/* Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              How to Borrow
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Request a loan, get approved by your circle, and receive funds instantly.
          </p>
          <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Learn More →
          </button>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Join a Circle
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Connect with like-minded people and vouch for each other to access better rates.
          </p>
          <button className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
            Learn More →
          </button>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Build Credit
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Improve your credit score by making on-time payments and being an active community member.
          </p>
          <button className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}
