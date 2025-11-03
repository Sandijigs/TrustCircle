/**
 * StatCard Component
 * 
 * Displays a key metric with icon, label, value, and optional change indicator
 * Used on dashboards to show financial data at a glance
 * 
 * Design Decisions:
 * - Large, scannable numbers for quick comprehension
 * - Color-coded change indicators (green = positive, red = negative)
 * - Icons for visual anchoring
 * - Loading state with skeleton
 * - Hover effect for interactivity hint
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Borrowed"
 *   value="1,234.56"
 *   icon={<IconMoney />}
 *   change={{ value: 12.5, type: 'increase' }}
 *   colorScheme="primary"
 * />
 * ```
 */

'use client';

import { StatCardProps } from '@/types/components';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function StatCard({
  label,
  value,
  icon,
  change,
  loading = false,
  colorScheme = 'primary',
  className = '',
  ...props
}: StatCardProps) {
  const colorStyles = {
    primary: 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20',
    success: 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20',
    warning: 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/20',
    danger: 'text-danger-500 dark:text-danger-400 bg-red-100 dark:bg-red-900/20',
  };

  if (loading) {
    return (
      <Card padding="lg" shadow="md" className={className}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton width="40%" height="14px" className="mb-3" />
            <Skeleton width="70%" height="32px" className="mb-2" />
            <Skeleton width="30%" height="12px" />
          </div>
          <Skeleton width="48px" height="48px" rounded />
        </div>
      </Card>
    );
  }

  return (
    <Card
      padding="lg"
      shadow="md"
      hover
      className={`transition-all duration-200 ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>

          {/* Value */}
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2 truncate">
            {value}
          </p>

          {/* Change Indicator */}
          {change && (
            <div className={`inline-flex items-center gap-1 text-sm font-medium ${
              change.type === 'increase' ? 'text-success-600 dark:text-success-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {change.type === 'increase' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={`flex-shrink-0 p-3 rounded-lg ${colorStyles[colorScheme]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
