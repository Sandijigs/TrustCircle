/**
 * EmptyState Component
 * 
 * Displays a friendly empty state with icon, message, and optional action
 * Used when lists, tables, or data sets have no content
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<IconCircle />}
 *   title="No circles found"
 *   description="Join or create your first lending circle"
 *   action={<Button>Create Circle</Button>}
 * />
 * ```
 */

'use client';

import { EmptyStateProps } from '@/types/components';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
