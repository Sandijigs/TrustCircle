/**
 * VerificationStatus Component
 * 
 * Displays user's current verification status with details
 * Shows level, expiration, and actions
 * 
 * @example
 * ```tsx
 * <VerificationStatus
 *   onStartVerification={() => setWizardOpen(true)}
 * />
 * ```
 */

'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { useVerification, VerificationLevel } from '@/hooks/useVerification';
import { VerificationWizard } from './VerificationWizard';

interface VerificationStatusProps {
  onStartVerification?: () => void;
  showActions?: boolean;
  className?: string;
}

export function VerificationStatus({
  onStartVerification,
  showActions = true,
  className = '',
}: VerificationStatusProps) {
  const {
    verificationStatus,
    isVerified,
    verificationLevel,
    isExpired,
    isLoading,
    getLevelName,
    getLevelColor,
    getDaysUntilExpiration,
  } = useVerification();

  const [wizardOpen, setWizardOpen] = useState(false);

  const daysUntilExpiration = getDaysUntilExpiration();

  // Get level progress
  const getLevelProgress = (level: VerificationLevel): number => {
    return (level / VerificationLevel.TRUSTED) * 100;
  };

  // Get next level info
  const getNextLevelInfo = (currentLevel: VerificationLevel) => {
    if (currentLevel >= VerificationLevel.TRUSTED) {
      return null;
    }

    const nextLevel = currentLevel + 1;
    const levelNames: Record<number, string> = {
      1: 'Basic',
      2: 'Verified',
      3: 'Trusted',
    };
    const requirements: Record<number, string> = {
      1: 'Connect social accounts',
      2: 'Complete ID verification',
      3: 'Upload proof of address',
    };

    return {
      level: nextLevel,
      name: levelNames[nextLevel],
      requirement: requirements[nextLevel],
    };
  };

  const handleStartVerification = () => {
    if (onStartVerification) {
      onStartVerification();
    } else {
      setWizardOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card padding="lg" shadow="md" className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card padding="lg" shadow="md" className={className}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Verification Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isVerified 
                ? 'Your identity has been verified' 
                : 'Complete verification to access all features'}
            </p>
          </div>
          
          {/* Status Badge */}
          <span className={`
            px-3 py-1.5 rounded-full text-sm font-semibold
            ${isVerified && !isExpired
              ? 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400'
              : isExpired
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
            }
          `}>
            {isExpired ? 'Expired' : isVerified ? 'Verified' : 'Not Verified'}
          </span>
        </div>

        {/* Verification Level */}
        {isVerified && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Level
              </span>
              <span className={`text-lg font-bold ${getLevelColor(verificationLevel)}`}>
                {getLevelName(verificationLevel)}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                  verificationLevel === VerificationLevel.TRUSTED
                    ? 'bg-purple-500'
                    : verificationLevel === VerificationLevel.VERIFIED
                    ? 'bg-success-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${getLevelProgress(verificationLevel)}%` }}
              />
            </div>
            
            {/* Level Labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Basic</span>
              <span>Verified</span>
              <span>Trusted</span>
            </div>
          </div>
        )}

        {/* Expiration Warning */}
        {isVerified && daysUntilExpiration !== null && daysUntilExpiration < 30 && (
          <Card padding="md" className="mb-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Verification Expiring Soon
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Your verification will expire in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}. 
                  Please renew to maintain access.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Benefits */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {isVerified ? 'Your Benefits' : 'Benefits of Verification'}
          </h4>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm ${
              verificationLevel >= VerificationLevel.BASIC
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              <svg className={`w-5 h-5 flex-shrink-0 ${
                verificationLevel >= VerificationLevel.BASIC
                  ? 'text-success-500'
                  : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Join lending circles</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${
              verificationLevel >= VerificationLevel.VERIFIED
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              <svg className={`w-5 h-5 flex-shrink-0 ${
                verificationLevel >= VerificationLevel.VERIFIED
                  ? 'text-success-500'
                  : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Borrow up to $1,000</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${
              verificationLevel >= VerificationLevel.VERIFIED
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              <svg className={`w-5 h-5 flex-shrink-0 ${
                verificationLevel >= VerificationLevel.VERIFIED
                  ? 'text-success-500'
                  : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Deposit to lending pools</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${
              verificationLevel >= VerificationLevel.TRUSTED
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-500'
            }`}>
              <svg className={`w-5 h-5 flex-shrink-0 ${
                verificationLevel >= VerificationLevel.TRUSTED
                  ? 'text-success-500'
                  : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Borrow up to $10,000</span>
            </div>
          </div>
        </div>

        {/* Next Level Info */}
        {isVerified && !isExpired && (() => {
          const nextLevel = getNextLevelInfo(verificationLevel);
          return nextLevel ? (
            <Card padding="md" className="mb-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Upgrade to {nextLevel.name}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {nextLevel.requirement}
                  </p>
                </div>
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </Card>
          ) : null;
        })()}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3">
            {!isVerified || isExpired ? (
              <Button
                variant="primary"
                onClick={handleStartVerification}
                fullWidth
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              >
                {isExpired ? 'Renew Verification' : 'Start Verification'}
              </Button>
            ) : verificationLevel < VerificationLevel.TRUSTED ? (
              <Button
                variant="outline"
                onClick={handleStartVerification}
                fullWidth
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              >
                Upgrade Verification
              </Button>
            ) : null}
          </div>
        )}
      </Card>

      {/* Verification Wizard */}
      {!onStartVerification && (
        <VerificationWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </>
  );
}
