/**
 * Select Component
 * 
 * Accessible dropdown select with label and error handling
 * Native select for better mobile experience
 * 
 * Design Decisions:
 * - Native select for accessibility and mobile UX
 * - Consistent styling with Input component
 * - Option grouping support
 * - Placeholder as first disabled option
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Loan Currency"
 *   options={[
 *     { value: 'cusd', label: 'cUSD' },
 *     { value: 'ceur', label: 'cEUR' },
 *   ]}
 *   placeholder="Select currency"
 *   error={errors.currency}
 * />
 * ```
 */

'use client';

import { forwardRef } from 'react';
import { SelectProps } from '@/types/components';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      fullWidth = false,
      selectSize = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-5 py-3 text-lg',
    };

    // Base styles
    const baseStyles = `
      w-${fullWidth ? 'full' : 'auto'}
      rounded-lg
      border
      transition-colors
      focus:outline-none
      focus:ring-2
      focus:ring-offset-2
      disabled:opacity-50
      disabled:cursor-not-allowed
      appearance-none
      bg-white
      dark:bg-gray-800
      dark:text-white
      pr-10
    `;

    // State styles
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          {/* Select */}
          <select
            ref={ref}
            id={selectId}
            className={`
              ${baseStyles}
              ${sizeStyles[selectSize]}
              ${stateStyles}
            `.trim().replace(/\s+/g, ' ')}
            aria-invalid={!!error}
            aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown Arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-gray-600 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
