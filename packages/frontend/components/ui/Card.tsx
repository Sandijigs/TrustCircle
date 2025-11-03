/**
 * Card Component
 * 
 * Flexible container component for grouping related content
 * Supports hover effects, various padding/shadow/radius options
 * 
 * @example
 * ```tsx
 * <Card padding="lg" hover shadow="md">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 * ```
 */

'use client';

import { forwardRef } from 'react';
import { CardProps } from '@/types/components';

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      hover = false,
      padding = 'md',
      rounded = 'lg',
      shadow = 'md',
      children,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'bg-white dark:bg-gray-800 transition-all duration-200';

    // Padding styles
    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4 md:p-6',
      lg: 'p-6 md:p-8',
    };

    // Rounded styles
    const roundedStyles = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
    };

    // Shadow styles
    const shadowStyles = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    };

    // Hover styles
    const hoverStyles = hover ? 'hover:shadow-xl hover:-translate-y-0.5 cursor-pointer' : '';

    // Interactive styles
    const interactiveStyles = onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2' : '';

    const combinedClassName = `
      ${baseStyles}
      ${paddingStyles[padding]}
      ${roundedStyles[rounded]}
      ${shadowStyles[shadow]}
      ${hoverStyles}
      ${interactiveStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={combinedClassName}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
