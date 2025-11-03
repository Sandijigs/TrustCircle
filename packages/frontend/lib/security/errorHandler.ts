/**
 * Error Handler
 * 
 * Safely handles errors without exposing sensitive information to users.
 * Logs detailed errors for developers while showing user-friendly messages.
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  WALLET = 'WALLET',
  CONTRACT = 'CONTRACT',
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: any;
  code?: string | number;
  context?: Record<string, any>;
}

export class ApplicationError extends Error {
  constructor(
    public type: ErrorType,
    public userMessage: string,
    message?: string,
    public code?: string | number,
    public context?: Record<string, any>
  ) {
    super(message || userMessage);
    this.name = 'ApplicationError';
  }
}

export class ErrorHandler {
  /**
   * Handle and classify errors
   */
  static handle(error: any): ErrorDetails {
    // Check if it's already an ApplicationError
    if (error instanceof ApplicationError) {
      return {
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        code: error.code,
        context: error.context,
      };
    }

    // Classify the error
    const classified = this.classifyError(error);

    // Log the error (in production, send to error tracking service)
    this.logError(classified);

    return classified;
  }

  /**
   * Classify error by type
   */
  private static classifyError(error: any): ErrorDetails {
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code;

    // Network errors
    if (
      errorCode === 'NETWORK_ERROR' ||
      errorMessage.includes('network') ||
      errorMessage.includes('fetch')
    ) {
      return {
        type: ErrorType.NETWORK,
        message: errorMessage,
        userMessage: 'Network error. Please check your connection and try again.',
        originalError: error,
        code: errorCode,
      };
    }

    // Wallet errors
    if (
      errorCode === 4001 || // User rejected
      errorMessage.includes('user rejected') ||
      errorMessage.includes('User denied')
    ) {
      return {
        type: ErrorType.WALLET,
        message: errorMessage,
        userMessage: 'Transaction was rejected',
        originalError: error,
        code: errorCode,
      };
    }

    if (
      errorMessage.includes('wallet') ||
      errorMessage.includes('metamask') ||
      errorMessage.includes('connect')
    ) {
      return {
        type: ErrorType.WALLET,
        message: errorMessage,
        userMessage: 'Wallet connection error. Please try reconnecting your wallet.',
        originalError: error,
        code: errorCode,
      };
    }

    // Contract errors
    if (
      errorMessage.includes('execution reverted') ||
      errorMessage.includes('contract') ||
      errorMessage.includes('revert')
    ) {
      // Try to extract revert reason
      const reason = this.extractRevertReason(error);
      
      return {
        type: ErrorType.CONTRACT,
        message: errorMessage,
        userMessage: reason || 'Transaction failed. Please check the requirements and try again.',
        originalError: error,
        code: errorCode,
      };
    }

    // Validation errors
    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('required') ||
      errorMessage.includes('must be')
    ) {
      return {
        type: ErrorType.VALIDATION,
        message: errorMessage,
        userMessage: errorMessage, // Validation messages are usually safe to show
        originalError: error,
        code: errorCode,
      };
    }

    // Unauthorized errors
    if (
      errorCode === 401 ||
      errorCode === 403 ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden')
    ) {
      return {
        type: ErrorType.UNAUTHORIZED,
        message: errorMessage,
        userMessage: 'You are not authorized to perform this action.',
        originalError: error,
        code: errorCode,
      };
    }

    // Rate limit errors
    if (
      errorCode === 429 ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests')
    ) {
      return {
        type: ErrorType.RATE_LIMIT,
        message: errorMessage,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        originalError: error,
        code: errorCode,
      };
    }

    // Unknown error
    return {
      type: ErrorType.UNKNOWN,
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Please try again later.',
      originalError: error,
      code: errorCode,
    };
  }

  /**
   * Extract revert reason from contract error
   */
  private static extractRevertReason(error: any): string | null {
    try {
      // Try to get custom error name
      if (error?.data?.errorName) {
        return this.formatErrorName(error.data.errorName);
      }

      // Try to get revert reason from message
      const match = error?.message?.match(/reason="([^"]*)"/);
      if (match && match[1]) {
        return match[1];
      }

      // Try to get custom error from data
      if (error?.data?.message) {
        return error.data.message;
      }
    } catch {
      // Failed to extract reason
    }

    return null;
  }

  /**
   * Format error name to be user-friendly
   */
  private static formatErrorName(errorName: string): string {
    // Convert PascalCase to spaces
    return errorName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase()
      .replace(/^./, (str) => str.toUpperCase());
  }

  /**
   * Log error (in production, send to error tracking service like Sentry)
   */
  private static logError(error: ErrorDetails): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error]', {
        type: error.type,
        message: error.message,
        code: error.code,
        originalError: error.originalError,
        context: error.context,
      });
    }

    // In production, send to error tracking service
    // Example: Sentry.captureException(error.originalError, { contexts: { error } });
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: any): string {
    const details = this.handle(error);
    return details.userMessage;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    const details = this.handle(error);
    return [
      ErrorType.NETWORK,
      ErrorType.RATE_LIMIT,
    ].includes(details.type);
  }
}

/**
 * React hook for error handling
 */
export function useErrorHandler() {
  const handleError = (error: any) => {
    return ErrorHandler.handle(error);
  };

  const getUserMessage = (error: any): string => {
    return ErrorHandler.getUserMessage(error);
  };

  const isRetryable = (error: any): boolean => {
    return ErrorHandler.isRetryable(error);
  };

  const showError = (error: any) => {
    const message = getUserMessage(error);
    // In a real app, this would show a toast/notification
    alert(message);
  };

  return {
    handleError,
    getUserMessage,
    isRetryable,
    showError,
  };
}

/**
 * Error boundary component helper
 */
export function createErrorBoundaryFallback(error: Error, resetError: () => void) {
  const details = ErrorHandler.handle(error);

  return {
    title: 'Something went wrong',
    message: details.userMessage,
    canRetry: ErrorHandler.isRetryable(error),
    onRetry: resetError,
  };
}

/**
 * Safe async error handler
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  fallback?: T
): Promise<[T | null, ErrorDetails | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const details = ErrorHandler.handle(error);
    return [fallback ?? null, details];
  }
}
