/**
 * Input Validator
 * 
 * Validates and sanitizes user inputs to prevent XSS, injection attacks,
 * and ensure data integrity.
 */

import { isAddress } from 'viem';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: any;
}

export class InputValidator {
  /**
   * Validate Ethereum address
   */
  static validateAddress(address: string): ValidationResult {
    if (!address) {
      return { isValid: false, error: 'Address is required' };
    }

    if (!isAddress(address)) {
      return { isValid: false, error: 'Invalid Ethereum address' };
    }

    return {
      isValid: true,
      sanitized: address.toLowerCase() as `0x${string}`,
    };
  }

  /**
   * Validate amount (for loan requests, deposits, etc.)
   */
  static validateAmount(
    amount: string | number,
    options: {
      min?: number;
      max?: number;
      decimals?: number;
    } = {}
  ): ValidationResult {
    const { min = 0, max = Infinity, decimals = 18 } = options;

    // Convert to number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return { isValid: false, error: 'Invalid amount' };
    }

    if (numAmount <= 0) {
      return { isValid: false, error: 'Amount must be greater than zero' };
    }

    if (numAmount < min) {
      return {
        isValid: false,
        error: `Amount must be at least ${min}`,
      };
    }

    if (numAmount > max) {
      return {
        isValid: false,
        error: `Amount cannot exceed ${max}`,
      };
    }

    // Check decimal places
    const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
    if (decimalPlaces > decimals) {
      return {
        isValid: false,
        error: `Amount cannot have more than ${decimals} decimal places`,
      };
    }

    return {
      isValid: true,
      sanitized: numAmount,
    };
  }

  /**
   * Validate and sanitize text input
   */
  static validateText(
    text: string,
    options: {
      minLength?: number;
      maxLength?: number;
      allowedChars?: RegExp;
      stripHtml?: boolean;
    } = {}
  ): ValidationResult {
    const {
      minLength = 0,
      maxLength = 1000,
      allowedChars,
      stripHtml = true,
    } = options;

    if (!text) {
      return { isValid: false, error: 'Text is required' };
    }

    // Strip HTML tags if requested
    let sanitized = stripHtml ? this.stripHtmlTags(text) : text;

    // Trim whitespace
    sanitized = sanitized.trim();

    if (sanitized.length < minLength) {
      return {
        isValid: false,
        error: `Text must be at least ${minLength} characters`,
      };
    }

    if (sanitized.length > maxLength) {
      return {
        isValid: false,
        error: `Text cannot exceed ${maxLength} characters`,
      };
    }

    if (allowedChars && !allowedChars.test(sanitized)) {
      return {
        isValid: false,
        error: 'Text contains invalid characters',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  }

  /**
   * Validate duration (in days)
   */
  static validateDuration(
    days: number,
    options: {
      min?: number;
      max?: number;
    } = {}
  ): ValidationResult {
    const { min = 30, max = 365 } = options;

    if (!Number.isInteger(days)) {
      return { isValid: false, error: 'Duration must be a whole number' };
    }

    if (days < min) {
      return {
        isValid: false,
        error: `Duration must be at least ${min} days`,
      };
    }

    if (days > max) {
      return {
        isValid: false,
        error: `Duration cannot exceed ${max} days`,
      };
    }

    return {
      isValid: true,
      sanitized: days,
    };
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string): ValidationResult {
    if (!url) {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      const parsed = new URL(url);
      
      // Only allow https
      if (parsed.protocol !== 'https:') {
        return {
          isValid: false,
          error: 'Only HTTPS URLs are allowed',
        };
      }

      return {
        isValid: true,
        sanitized: url,
      };
    } catch {
      return {
        isValid: false,
        error: 'Invalid URL',
      };
    }
  }

  /**
   * Validate email (basic)
   */
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Invalid email address',
      };
    }

    return {
      isValid: true,
      sanitized: email.toLowerCase().trim(),
    };
  }

  /**
   * Validate payment frequency
   */
  static validatePaymentFrequency(frequency: number): ValidationResult {
    const validFrequencies = [0, 1, 2]; // Weekly, BiWeekly, Monthly

    if (!validFrequencies.includes(frequency)) {
      return {
        isValid: false,
        error: 'Invalid payment frequency',
      };
    }

    return {
      isValid: true,
      sanitized: frequency,
    };
  }

  /**
   * Validate transaction hash
   */
  static validateTxHash(hash: string): ValidationResult {
    if (!hash) {
      return { isValid: false, error: 'Transaction hash is required' };
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return {
        isValid: false,
        error: 'Invalid transaction hash',
      };
    }

    return {
      isValid: true,
      sanitized: hash.toLowerCase(),
    };
  }

  /**
   * Strip HTML tags from text
   */
  private static stripHtmlTags(text: string): string {
    return text.replace(/<[^>]*>/g, '');
  }

  /**
   * Escape HTML special characters
   */
  static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Validate loan request form
   */
  static validateLoanRequest(data: {
    amount: string;
    duration: number;
    frequency: number;
    purpose?: string;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Validate amount
    const amountResult = this.validateAmount(data.amount, {
      min: 50,
      max: 5000,
    });
    if (!amountResult.isValid) {
      errors.amount = amountResult.error!;
    }

    // Validate duration
    const durationResult = this.validateDuration(data.duration);
    if (!durationResult.isValid) {
      errors.duration = durationResult.error!;
    }

    // Validate frequency
    const frequencyResult = this.validatePaymentFrequency(data.frequency);
    if (!frequencyResult.isValid) {
      errors.frequency = frequencyResult.error!;
    }

    // Validate purpose (if provided)
    if (data.purpose) {
      const purposeResult = this.validateText(data.purpose, {
        maxLength: 500,
      });
      if (!purposeResult.isValid) {
        errors.purpose = purposeResult.error!;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

/**
 * React hook for input validation
 */
export function useInputValidator() {
  const validateField = (
    field: string,
    value: any,
    options?: any
  ): ValidationResult => {
    switch (field) {
      case 'address':
        return InputValidator.validateAddress(value);
      case 'amount':
        return InputValidator.validateAmount(value, options);
      case 'duration':
        return InputValidator.validateDuration(value, options);
      case 'frequency':
        return InputValidator.validatePaymentFrequency(value);
      case 'text':
        return InputValidator.validateText(value, options);
      case 'email':
        return InputValidator.validateEmail(value);
      case 'url':
        return InputValidator.validateUrl(value);
      case 'txHash':
        return InputValidator.validateTxHash(value);
      default:
        return { isValid: true, sanitized: value };
    }
  };

  return { validateField, InputValidator };
}
