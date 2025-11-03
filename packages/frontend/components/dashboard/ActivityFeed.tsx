/**
 * ActivityFeed Component
 * 
 * Chronological list of user activities (loans, payments, circles, etc.)
 * Real-time updates showing transaction history
 * 
 * Design Decisions:
 * - Reverse chronological order (newest first)
 * - Type-specific icons and colors
 * - Relative timestamps (e.g., "2 hours ago")
 * - Clickable items for details
 * - Loading and empty states
 * - Infinite scroll capability (optional)
 * 
 * Activity Types:
 * - loan: Loan request/approval/disbursement
 * - payment: Loan payment made
 * - deposit: Funds deposited to lending pool
 * - withdrawal: Funds withdrawn from pool
 * - circle: Circle joined/created
 * - verification: KYC verification completed
 * 
 * @example
 * ```tsx
 * <ActivityFeed
 *   items={activities}
 *   loading={false}
 *   onItemClick={(item) => console.log('Clicked:', item)}
 * />
 * ```
 */

'use client';

import { ActivityFeedProps, ActivityItem } from '@/types/components';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export function ActivityFeed({
  items,
  loading = false,
  onItemClick,
  emptyMessage = 'No activity yet',
  className = '',
  ...props
}: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconMap = {
      loan: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      payment: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      deposit: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      withdrawal: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      circle: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      verification: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    };

    return iconMap[type];
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    const colorMap = {
      loan: 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
      payment: 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400',
      deposit: 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400',
      withdrawal: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      circle: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      verification: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    };

    return colorMap[type];
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return timestamp.toLocaleDateString();
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <Card padding="none" shadow="md" className={className}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton width="48px" height="48px" rounded />
                <div className="flex-1">
                  <Skeleton width="60%" height="16px" className="mb-2" />
                  <Skeleton width="40%" height="14px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card padding="none" shadow="md" className={className}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title={emptyMessage}
          description="Your activity will appear here as you use the platform"
        />
      </Card>
    );
  }

  return (
    <Card padding="none" shadow="md" className={className} {...props}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${getActivityColor(item.type)}`}>
                {item.icon || getActivityIcon(item.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {item.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatTimestamp(item.timestamp)}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 self-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* View All Link */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <button className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
          View All Activity
        </button>
      </div>
    </Card>
  );
}
