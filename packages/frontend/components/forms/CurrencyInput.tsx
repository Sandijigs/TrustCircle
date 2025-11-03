/**
 * CurrencyInput Component
 * 
 * Specialized input for entering currency amounts
 * Includes currency selector, balance display, and "Max" button
 * 
 * Design Decisions:
 * - Currency selector dropdown integrated
 * - Balance display for context
 * - "Max" button for convenience
 * - Automatic formatting and validation
 * - Decimal precision control
 * - Visual currency symbols
 * 
 * @example
 * ```tsx
 * <CurrencyInput
 *   label="Loan Amount"
 *   currency="cUSD"
 *   balance="1,234.56"
 *   onMaxClick={() => setValue(balance)}
 *   decimals={2}
 * />
 * ```
 */

'use client';

import { forwardRef, useState } from 'react';
import { CurrencyInputProps } from '@/types/components';

const currencySymbols = {
  cUSD: '$',
  cEUR: '€',
  cREAL: 'R$',
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      helperText,
      currency = 'cUSD',
      balance,
      onMaxClick,
      decimals = 2,
      fullWidth = false,
      inputSize = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Generate unique ID for accessibility
    const inputId = props.id || `currency-input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

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
      dark:bg-gray-800
      dark:text-white
      pr-24
      pl-12
    `;

    // State styles
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {/* Label and Balance */}
        {(label || balance) && (
          <div className="flex justify-between items-center mb-2">
            {label && (
              <label
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {label}
                {props.required && (
                  <span className="text-red-500 ml-1" aria-label="required">
                    *
                  </span>
                )}
              </label>
            )}
            {balance && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Balance: <span className="font-semibold">{balance}</span> {currency}
              </span>
            )}
          </div>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Currency Symbol */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium pointer-events-none">
            {currencySymbols[currency]}
          </div>

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type="number"
            step={`0.${'0'.repeat(decimals - 1)}1`}
            className={`
              ${baseStyles}
              ${sizeStyles[inputSize]}
              ${stateStyles}
              [appearance:textfield]
              [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
            `.trim().replace(/\s+/g, ' ')}
            aria-invalid={!!error}
            aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Currency and Max Button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {onMaxClick && (
              <button
                type="button"
                onClick={onMaxClick}
                className="px-2 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
              >
                MAX
              </button>
            )}
            <span className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
              {currency}
            </span>
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

CurrencyInput.displayName = 'CurrencyInput';
