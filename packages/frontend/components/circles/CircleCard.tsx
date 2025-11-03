/**
 * CircleCard Component
 * 
 * Displays a summary card for a lending circle
 * Shows key metrics and join/view buttons
 */

'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import type { Circle } from '@/hooks/useLendingCircle';

interface CircleCardProps {
  circle: Circle;
  onJoinClick?: () => void;
  showActions?: boolean;
}

export function CircleCard({ circle, onJoinClick, showActions = true }: CircleCardProps) {
  const membersFilled = (circle.memberCount / circle.maxMembers) * 100;
  const isOpen = circle.memberCount < circle.maxMembers && circle.status === 'Active';

  return (
    <Card padding="lg" shadow="md" hover>
      <Link href={`/circles/${circle.id}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {circle.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {circle.description}
              </p>
            </div>
            
            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              circle.status === 'Active'
                ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
            }`}>
              {circle.status}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {circle.memberCount}/{circle.maxMembers}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Min Score</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {circle.minCreditScore}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Active Loans</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {circle.activeLoans}
              </p>
            </div>
          </div>

          {/* Members Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Member Capacity</span>
              <span>{membersFilled.toFixed(0)}% filled</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  membersFilled >= 90
                    ? 'bg-yellow-500'
                    : membersFilled >= 50
                    ? 'bg-primary-500'
                    : 'bg-success-500'
                }`}
                style={{ width: `${membersFilled}%` }}
              />
            </div>
          </div>

          {/* Performance Metrics */}
          {(circle.completedLoans > 0 || circle.defaultedLoans > 0) && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {circle.completedLoans} repaid
                </span>
              </div>
              
              {circle.defaultRate > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    {circle.defaultRate.toFixed(1)}% default rate
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              <Link href={`/circles/${circle.id}`} className="flex-1">
                <Button variant="outline" fullWidth>
                  View Details
                </Button>
              </Link>
              
              {isOpen && (
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    onJoinClick?.();
                  }}
                  fullWidth
                >
                  Request to Join
                </Button>
              )}
              
              {!isOpen && circle.status === 'Active' && (
                <div className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-sm text-gray-600 dark:text-gray-400">
                  Circle Full
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
