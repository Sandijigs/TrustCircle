/**
 * Analytics Tracker
 * 
 * Central analytics tracking system with privacy-first approach.
 * Supports multiple analytics backends (Mixpanel, PostHog, custom).
 */

import { hashAddress } from './privacy';
import type { AnalyticsEvent, UserProperties, EventProperties } from './events';

export interface AnalyticsConfig {
  enabled: boolean;
  anonymize: boolean;
  backends: ('mixpanel' | 'posthog' | 'custom')[];
  debug?: boolean;
}

class AnalyticsTracker {
  private config: AnalyticsConfig;
  private userId: string | null = null;
  private sessionId: string;
  private backends: Map<string, any> = new Map();

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.initializeBackends();
  }

  /**
   * Initialize analytics backends
   */
  private async initializeBackends() {
    if (!this.config.enabled) return;

    for (const backend of this.config.backends) {
      try {
        switch (backend) {
          case 'mixpanel':
            await this.initMixpanel();
            break;
          case 'posthog':
            await this.initPostHog();
            break;
          case 'custom':
            await this.initCustom();
            break;
        }
      } catch (error) {
        console.error(`Failed to initialize ${backend}:`, error);
      }
    }
  }

  /**
   * Initialize Mixpanel
   */
  private async initMixpanel() {
    if (typeof window === 'undefined') return;

    const mixpanel = await import('mixpanel-browser');
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

    if (!token) {
      console.warn('Mixpanel token not configured');
      return;
    }

    mixpanel.default.init(token, {
      debug: this.config.debug,
      track_pageview: true,
      persistence: 'localStorage',
      ignore_dnt: false, // Respect Do Not Track
    });

    this.backends.set('mixpanel', mixpanel.default);
  }

  /**
   * Initialize PostHog
   */
  private async initPostHog() {
    if (typeof window === 'undefined') return;

    const posthog = await import('posthog-js');
    const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!token) {
      console.warn('PostHog token not configured');
      return;
    }

    posthog.default.init(token, {
      api_host: host || 'https://app.posthog.com',
      capture_pageview: true,
      autocapture: false, // Manual tracking for privacy
    });

    this.backends.set('posthog', posthog.default);
  }

  /**
   * Initialize custom backend (your own API)
   */
  private async initCustom() {
    this.backends.set('custom', {
      track: async (event: string, properties: any) => {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event,
              properties,
              userId: this.userId,
              sessionId: this.sessionId,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          if (this.config.debug) {
            console.error('Custom analytics error:', error);
          }
        }
      },
    });
  }

  /**
   * Identify user
   */
  identify(address: string, properties?: UserProperties) {
    if (!this.config.enabled) return;

    // Hash address if anonymization enabled
    const userId = this.config.anonymize ? hashAddress(address) : address;
    this.userId = userId;

    // Remove sensitive data
    const safeProperties = this.sanitizeProperties(properties || {});

    // Track to all backends
    this.backends.forEach((backend, name) => {
      try {
        if (name === 'mixpanel') {
          backend.identify(userId);
          if (safeProperties) {
            backend.people.set(safeProperties);
          }
        } else if (name === 'posthog') {
          backend.identify(userId, safeProperties);
        } else if (name === 'custom') {
          backend.identify?.(userId, safeProperties);
        }
      } catch (error) {
        if (this.config.debug) {
          console.error(`Error identifying user in ${name}:`, error);
        }
      }
    });

    if (this.config.debug) {
      console.log('[Analytics] Identified user:', userId);
    }
  }

  /**
   * Track event
   */
  track(event: AnalyticsEvent, properties?: EventProperties) {
    if (!this.config.enabled) return;

    // Add metadata
    const enrichedProperties = {
      ...this.sanitizeProperties(properties || {}),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      platform: 'web',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    // Track to all backends
    this.backends.forEach((backend, name) => {
      try {
        if (name === 'mixpanel') {
          backend.track(event, enrichedProperties);
        } else if (name === 'posthog') {
          backend.capture(event, enrichedProperties);
        } else if (name === 'custom') {
          backend.track(event, enrichedProperties);
        }
      } catch (error) {
        if (this.config.debug) {
          console.error(`Error tracking event in ${name}:`, error);
        }
      }
    });

    if (this.config.debug) {
      console.log('[Analytics] Tracked event:', event, enrichedProperties);
    }
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: EventProperties) {
    this.track('page_viewed' as AnalyticsEvent, {
      ...properties,
      page: pageName,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }

  /**
   * Track timing (performance metrics)
   */
  time(event: AnalyticsEvent, durationMs: number, properties?: EventProperties) {
    this.track(event, {
      ...properties,
      duration_ms: durationMs,
      duration_seconds: Math.round(durationMs / 1000),
    });
  }

  /**
   * Reset user identity (logout)
   */
  reset() {
    this.userId = null;
    this.sessionId = this.generateSessionId();

    this.backends.forEach((backend, name) => {
      try {
        if (name === 'mixpanel') {
          backend.reset();
        } else if (name === 'posthog') {
          backend.reset();
        }
      } catch (error) {
        if (this.config.debug) {
          console.error(`Error resetting ${name}:`, error);
        }
      }
    });

    if (this.config.debug) {
      console.log('[Analytics] Reset user identity');
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties) {
    if (!this.config.enabled || !this.userId) return;

    const safeProperties = this.sanitizeProperties(properties);

    this.backends.forEach((backend, name) => {
      try {
        if (name === 'mixpanel') {
          backend.people.set(safeProperties);
        } else if (name === 'posthog') {
          backend.setPersonProperties(safeProperties);
        }
      } catch (error) {
        if (this.config.debug) {
          console.error(`Error setting properties in ${name}:`, error);
        }
      }
    });
  }

  /**
   * Increment user property
   */
  increment(property: string, amount: number = 1) {
    if (!this.config.enabled || !this.userId) return;

    this.backends.forEach((backend, name) => {
      try {
        if (name === 'mixpanel') {
          backend.people.increment(property, amount);
        }
      } catch (error) {
        if (this.config.debug) {
          console.error(`Error incrementing property in ${name}:`, error);
        }
      }
    });
  }

  /**
   * Sanitize properties to remove sensitive data
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Skip sensitive fields
      if (this.isSensitiveField(key)) {
        continue;
      }

      // Hash addresses if found
      if (this.config.anonymize && this.isAddress(value)) {
        sanitized[key] = hashAddress(value as string);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if field is sensitive
   */
  private isSensitiveField(key: string): boolean {
    const sensitiveFields = [
      'password',
      'privateKey',
      'mnemonic',
      'seed',
      'secret',
      'pin',
      'ssn',
      'creditCard',
    ];

    return sensitiveFields.some((field) =>
      key.toLowerCase().includes(field.toLowerCase())
    );
  }

  /**
   * Check if value looks like an Ethereum address
   */
  private isAddress(value: any): boolean {
    return (
      typeof value === 'string' &&
      value.startsWith('0x') &&
      value.length === 42
    );
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Singleton instance
let tracker: AnalyticsTracker | null = null;

/**
 * Initialize analytics
 */
export function initAnalytics(config: AnalyticsConfig): AnalyticsTracker {
  if (!tracker) {
    tracker = new AnalyticsTracker(config);
  }
  return tracker;
}

/**
 * Get analytics instance
 */
export function getAnalytics(): AnalyticsTracker {
  if (!tracker) {
    // Initialize with default config if not initialized
    tracker = new AnalyticsTracker({
      enabled: process.env.NODE_ENV === 'production',
      anonymize: true,
      backends: ['custom'],
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return tracker;
}

// Export for convenience
export const analytics = {
  identify: (address: string, properties?: UserProperties) =>
    getAnalytics().identify(address, properties),
  track: (event: AnalyticsEvent, properties?: EventProperties) =>
    getAnalytics().track(event, properties),
  page: (pageName: string, properties?: EventProperties) =>
    getAnalytics().page(pageName, properties),
  time: (event: AnalyticsEvent, durationMs: number, properties?: EventProperties) =>
    getAnalytics().time(event, durationMs, properties),
  reset: () => getAnalytics().reset(),
  setUserProperties: (properties: UserProperties) =>
    getAnalytics().setUserProperties(properties),
  increment: (property: string, amount?: number) =>
    getAnalytics().increment(property, amount),
};
