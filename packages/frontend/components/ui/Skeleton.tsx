/**
 * Skeleton Component
 * 
 * Loading placeholder that mimics the structure of content
 * Provides better perceived performance than spinner alone
 * 
 * @example
 * ```tsx
 * <Skeleton width="100%" height="20px" count={3} />
 * ```
 */

'use client';

import { SkeletonProps } from '@/types/components';

export function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = false,
  count = 1,
  className = '',
  ...props
}: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className={`
            bg-gray-200
            dark:bg-gray-700
            animate-pulse
            ${rounded ? 'rounded-full' : 'rounded'}
            ${count > 1 && i < count - 1 ? 'mb-2' : ''}
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          style={{ width, height }}
          aria-hidden="true"
          {...props}
        />
      ))}
    </>
  );
}

/**
 * Skeleton patterns for common UI elements
 */
export const SkeletonPatterns = {
  // Card skeleton
  Card: () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <Skeleton width="60%" height="24px" className="mb-4" />
      <Skeleton width="100%" height="16px" count={3} />
    </div>
  ),

  // Stat card skeleton
  StatCard: () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <Skeleton width="40%" height="14px" className="mb-2" />
      <Skeleton width="70%" height="32px" className="mb-2" />
      <Skeleton width="30%" height="12px" />
    </div>
  ),

  // List item skeleton
  ListItem: () => (
    <div className="flex items-center gap-4 p-4">
      <Skeleton width="48px" height="48px" rounded />
      <div className="flex-1">
        <Skeleton width="60%" height="16px" className="mb-2" />
        <Skeleton width="40%" height="14px" />
      </div>
    </div>
  ),

  // Table row skeleton
  TableRow: () => (
    <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton width="20%" height="16px" />
      <Skeleton width="30%" height="16px" />
      <Skeleton width="25%" height="16px" />
      <Skeleton width="25%" height="16px" />
    </div>
  ),
};
