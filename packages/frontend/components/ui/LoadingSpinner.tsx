/**
 * LoadingSpinner Component
 * 
 * Accessible loading indicator with size and color variants
 * Includes proper ARIA attributes for screen readers
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="md" text="Loading data..." />
 * ```
 */

'use client';

import { LoadingSpinnerProps } from '@/types/components';

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text,
  className = '',
  ...props
}: LoadingSpinnerProps) {
  // Size styles
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  // Color styles
  const colorStyles = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  };

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      <div
        className={`
          ${sizeStyles[size]}
          ${colorStyles[color]}
          rounded-full
          animate-spin
        `.trim().replace(/\s+/g, ' ')}
        aria-hidden="true"
      />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
}
