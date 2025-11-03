/**
 * useAnalytics Hook
 * 
 * React hook for tracking analytics events in components.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { analytics } from '@/lib/analytics/tracker';
import type { AnalyticsEvent, EventProperties } from '@/lib/analytics/events';
import { hasAnalyticsConsent } from '@/lib/analytics/privacy';

export function useAnalytics() {
  const { address, isConnected } = useAccount();
  const hasIdentified = useRef(false);

  // Identify user when wallet connects
  useEffect(() => {
    if (isConnected && address && !hasIdentified.current && hasAnalyticsConsent()) {
      analytics.identify(address, {
        address,
        firstSeenAt: new Date().toISOString(),
      });
      hasIdentified.current = true;
    }
  }, [isConnected, address]);

  // Track event
  const track = useCallback(
    (event: AnalyticsEvent, properties?: EventProperties) => {
      if (!hasAnalyticsConsent()) return;
      
      analytics.track(event, {
        ...properties,
        userAddress: address,
      });
    },
    [address]
  );

  // Track page view
  const trackPage = useCallback(
    (pageName: string, properties?: EventProperties) => {
      if (!hasAnalyticsConsent()) return;
      
      analytics.page(pageName, {
        ...properties,
        userAddress: address,
      });
    },
    [address]
  );

  // Track timing
  const trackTime = useCallback(
    (event: AnalyticsEvent, durationMs: number, properties?: EventProperties) => {
      if (!hasAnalyticsConsent()) return;
      
      analytics.time(event, durationMs, {
        ...properties,
        userAddress: address,
      });
    },
    [address]
  );

  // Start timing an operation
  const startTimer = useCallback(() => {
    const startTime = Date.now();
    
    return {
      end: (event: AnalyticsEvent, properties?: EventProperties) => {
        const duration = Date.now() - startTime;
        trackTime(event, duration, properties);
      },
    };
  }, [trackTime]);

  return {
    track,
    trackPage,
    trackTime,
    startTimer,
    isEnabled: hasAnalyticsConsent(),
  };
}

/**
 * Hook to track page views automatically
 */
export function usePageTracking(pageName: string) {
  const { trackPage } = useAnalytics();

  useEffect(() => {
    trackPage(pageName);
  }, [pageName, trackPage]);
}

/**
 * Hook to track form submissions
 */
export function useFormTracking(formName: string) {
  const { track } = useAnalytics();

  const trackSubmit = useCallback(
    (success: boolean, error?: string) => {
      track('form_submitted', {
        formName,
        success,
        errorMessage: error,
      });
    },
    [track, formName]
  );

  return { trackSubmit };
}

/**
 * Hook to track button clicks
 */
export function useButtonTracking() {
  const { track } = useAnalytics();

  const trackClick = useCallback(
    (buttonLabel: string, properties?: EventProperties) => {
      track('button_clicked', {
        buttonLabel,
        ...properties,
      });
    },
    [track]
  );

  return { trackClick };
}

/**
 * Hook to track errors
 */
export function useErrorTracking() {
  const { track } = useAnalytics();

  const trackError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      track('error_occurred', {
        errorMessage: error.message,
        errorStack: error.stack,
        ...context,
      });
    },
    [track]
  );

  return { trackError };
}
