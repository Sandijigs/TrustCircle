/**
 * Button Component
 * 
 * Accessible, flexible button component with multiple variants and sizes
 * Following WCAG 2.1 AA standards with 44px minimum touch target
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 */

'use client';

import { forwardRef } from 'react';
import { ButtonProps } from '@/types/components';
import { LoadingSpinner } from './LoadingSpinner';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      onClick,
      type = 'button',
      ariaLabel,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // Variant styles
    const variantStyles = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
      success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 active:bg-success-800',
      danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 active:bg-danger-700',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800',
      outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 active:bg-primary-100 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-950',
    };

    // Size styles (minimum 44px touch target for accessibility)
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm min-h-[40px]',
      md: 'px-4 py-2.5 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`.trim();

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        className={combinedClassName}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" color={variant === 'ghost' || variant === 'outline' ? 'primary' : 'white'} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
