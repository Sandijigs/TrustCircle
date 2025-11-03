/**
 * Privacy-Preserving Analytics
 * 
 * Utilities for anonymizing and protecting user data in analytics.
 * GDPR-compliant data handling.
 */

import { createHash } from 'crypto';

/**
 * Hash an Ethereum address for anonymous tracking
 * Uses SHA-256 with salt for one-way hashing
 */
export function hashAddress(address: string): string {
  const salt = process.env.NEXT_PUBLIC_ANALYTICS_SALT || 'trustcircle-salt';
  return createHash('sha256')
    .update(`${salt}:${address.toLowerCase()}`)
    .digest('hex')
    .substring(0, 32); // Use first 32 chars
}

/**
 * Anonymize user data for analytics
 */
export function anonymizeUserData(data: Record<string, any>): Record<string, any> {
  const anonymized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Remove or hash sensitive fields
    if (key === 'address' || key === 'wallet') {
      anonymized[key] = hashAddress(value as string);
    } else if (key === 'email') {
      // Hash email for tracking without exposing
      anonymized[key] = hashEmail(value as string);
    } else if (key === 'name' || key === 'fullName') {
      // Don't track names
      continue;
    } else if (key === 'phoneNumber') {
      // Don't track phone numbers
      continue;
    } else {
      anonymized[key] = value;
    }
  }

  return anonymized;
}

/**
 * Hash email for anonymous tracking
 */
export function hashEmail(email: string): string {
  const salt = process.env.NEXT_PUBLIC_ANALYTICS_SALT || 'trustcircle-salt';
  return createHash('sha256')
    .update(`${salt}:${email.toLowerCase()}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Aggregate sensitive numerical data into ranges
 * Prevents exact tracking of loan amounts, balances, etc.
 */
export function aggregateAmount(amount: number): string {
  if (amount < 100) return '0-100';
  if (amount < 500) return '100-500';
  if (amount < 1000) return '500-1000';
  if (amount < 2000) return '1000-2000';
  if (amount < 5000) return '2000-5000';
  return '5000+';
}

/**
 * Aggregate credit scores into ranges
 */
export function aggregateCreditScore(score: number): string {
  if (score < 400) return 'poor';
  if (score < 600) return 'fair';
  if (score < 700) return 'good';
  if (score < 800) return 'very-good';
  return 'excellent';
}

/**
 * IP address anonymization (remove last octet)
 */
export function anonymizeIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    // IPv4: Replace last octet with 0
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  // IPv6: Remove last 64 bits
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length >= 4) {
    return ipv6Parts.slice(0, 4).join(':') + '::';
  }
  return ip;
}

/**
 * Generate anonymous user ID
 * Consistent for the same user but not reversible
 */
export function generateAnonymousId(address: string, salt?: string): string {
  const effectiveSalt = salt || process.env.NEXT_PUBLIC_ANALYTICS_SALT || 'trustcircle-salt';
  return createHash('sha256')
    .update(`${effectiveSalt}:${address.toLowerCase()}`)
    .digest('hex');
}

/**
 * Remove PII (Personally Identifiable Information) from event properties
 */
export function removePII(properties: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  const piiFields = [
    'email',
    'name',
    'fullName',
    'firstName',
    'lastName',
    'phoneNumber',
    'phone',
    'address', // Physical address, not wallet
    'ssn',
    'passport',
    'dob',
    'dateOfBirth',
  ];

  for (const [key, value] of Object.entries(properties)) {
    const lowerKey = key.toLowerCase();
    
    // Skip PII fields
    if (piiFields.some((field) => lowerKey.includes(field))) {
      continue;
    }
    
    cleaned[key] = value;
  }

  return cleaned;
}

/**
 * Data retention policy
 * Returns whether data should be retained based on age
 */
export function shouldRetainData(timestamp: Date, retentionDays: number = 365): boolean {
  const now = new Date();
  const ageInDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
  return ageInDays < retentionDays;
}

/**
 * GDPR: Check if user has consented to analytics
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for consent
  const consent = localStorage.getItem('analytics_consent');
  return consent === 'granted';
}

/**
 * GDPR: Set analytics consent
 */
export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied');
  
  // Track consent change
  if (granted) {
    // Initialize analytics
    import('./tracker').then(({ initAnalytics }) => {
      initAnalytics({
        enabled: true,
        anonymize: true,
        backends: ['custom'],
      });
    });
  }
}

/**
 * GDPR: Export all user data
 */
export async function exportUserData(address: string): Promise<Record<string, any>> {
  // In production, this would fetch from your database
  try {
    const response = await fetch('/api/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error exporting user data:', error);
    return {};
  }
}

/**
 * GDPR: Delete all user data
 */
export async function deleteUserData(address: string): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting user data:', error);
    return false;
  }
}

/**
 * Differential privacy: Add noise to aggregate statistics
 * Prevents re-identification through statistical analysis
 */
export function addLaplaceNoise(value: number, sensitivity: number, epsilon: number = 1.0): number {
  // Laplace mechanism for differential privacy
  const scale = sensitivity / epsilon;
  const u = Math.random() - 0.5;
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return value + noise;
}

/**
 * K-anonymity: Check if data meets minimum group size
 */
export function meetsKAnonymity(groupSize: number, k: number = 5): boolean {
  return groupSize >= k;
}

/**
 * Sanitize transaction data for analytics
 */
export function sanitizeTransactionData(tx: {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasUsed: bigint;
}): Record<string, any> {
  return {
    txHash: tx.hash,
    fromAnonymized: hashAddress(tx.from),
    toAnonymized: hashAddress(tx.to),
    valueRange: aggregateAmount(Number(tx.value) / 1e18),
    gasUsedRange: aggregateAmount(Number(tx.gasUsed)),
  };
}
