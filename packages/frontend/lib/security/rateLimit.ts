/**
 * Rate Limiter
 * 
 * Client-side rate limiting to prevent abuse and reduce server load.
 * Server-side rate limiting should also be implemented.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();

  constructor(private config: RateLimitConfig) {
    // Clean up old records periodically
    setInterval(() => this.cleanup(), this.config.windowMs);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now >= record.resetTime) {
      // First request or window expired
      this.records.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const record = this.records.get(key);
    if (!record || Date.now() >= record.resetTime) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * Get time until reset (ms)
   */
  getTimeUntilReset(key: string): number {
    const record = this.records.get(key);
    if (!record) {
      return 0;
    }
    return Math.max(0, record.resetTime - Date.now());
  }

  /**
   * Reset a specific key
   */
  reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now >= record.resetTime) {
        this.records.delete(key);
      }
    }
  }
}

/**
 * Pre-configured rate limiters for different actions
 */
export const rateLimiters = {
  // API calls: 60 per minute
  api: new RateLimiter({
    maxRequests: 60,
    windowMs: 60 * 1000,
  }),

  // Form submissions: 5 per minute
  formSubmit: new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
  }),

  // Loan requests: 3 per hour
  loanRequest: new RateLimiter({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  }),

  // Wallet connections: 10 per minute
  walletConnect: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000,
  }),

  // Transactions: 20 per minute
  transaction: new RateLimiter({
    maxRequests: 20,
    windowMs: 60 * 1000,
  }),
};

/**
 * React hook for rate limiting
 */
export function useRateLimit(
  action: 'api' | 'formSubmit' | 'loanRequest' | 'walletConnect' | 'transaction'
) {
  const limiter = rateLimiters[action];

  const checkLimit = (key: string): boolean => {
    return limiter.isAllowed(key);
  };

  const getRemaining = (key: string): number => {
    return limiter.getRemaining(key);
  };

  const getTimeUntilReset = (key: string): number => {
    return limiter.getTimeUntilReset(key);
  };

  const formatTimeUntilReset = (key: string): string => {
    const ms = getTimeUntilReset(key);
    const seconds = Math.ceil(ms / 1000);
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return {
    checkLimit,
    getRemaining,
    getTimeUntilReset,
    formatTimeUntilReset,
  };
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Middleware-style rate limiter for API routes
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);

  return async (req: Request): Promise<Response | null> => {
    // Get identifier (IP or user ID)
    const identifier = req.headers.get('x-forwarded-for') || 'unknown';

    if (!limiter.isAllowed(identifier)) {
      const retryAfter = limiter.getTimeUntilReset(identifier);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(retryAfter / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(retryAfter / 1000).toString(),
          },
        }
      );
    }

    return null; // Allow request to proceed
  };
}

/**
 * Exponential backoff rate limiter
 */
export class ExponentialBackoffLimiter {
  private attempts: Map<string, number> = new Map();
  private lastAttempt: Map<string, number> = new Map();

  constructor(
    private baseDelayMs: number = 1000,
    private maxAttempts: number = 5
  ) {}

  /**
   * Check if action is allowed and get delay
   */
  canProceed(key: string): { allowed: boolean; delay: number } {
    const attempts = this.attempts.get(key) || 0;
    const lastAttempt = this.lastAttempt.get(key) || 0;
    const now = Date.now();

    if (attempts >= this.maxAttempts) {
      return {
        allowed: false,
        delay: Infinity,
      };
    }

    const delay = this.baseDelayMs * Math.pow(2, attempts);
    const timeSinceLastAttempt = now - lastAttempt;

    if (timeSinceLastAttempt < delay) {
      return {
        allowed: false,
        delay: delay - timeSinceLastAttempt,
      };
    }

    return {
      allowed: true,
      delay: 0,
    };
  }

  /**
   * Record an attempt
   */
  recordAttempt(key: string): void {
    const attempts = this.attempts.get(key) || 0;
    this.attempts.set(key, attempts + 1);
    this.lastAttempt.set(key, Date.now());
  }

  /**
   * Reset attempts for a key (e.g., after success)
   */
  reset(key: string): void {
    this.attempts.delete(key);
    this.lastAttempt.delete(key);
  }
}

/**
 * React hook for exponential backoff
 */
export function useExponentialBackoff(
  baseDelayMs: number = 1000,
  maxAttempts: number = 5
) {
  const limiter = new ExponentialBackoffLimiter(baseDelayMs, maxAttempts);

  const tryAction = async <T>(
    key: string,
    action: () => Promise<T>
  ): Promise<T> => {
    const { allowed, delay } = limiter.canProceed(key);

    if (!allowed) {
      if (delay === Infinity) {
        throw new Error('Maximum retry attempts exceeded');
      }
      throw new RateLimitError(
        `Please wait ${Math.ceil(delay / 1000)} seconds before retrying`,
        delay
      );
    }

    try {
      const result = await action();
      limiter.reset(key); // Success, reset attempts
      return result;
    } catch (error) {
      limiter.recordAttempt(key);
      throw error;
    }
  };

  return { tryAction };
}
