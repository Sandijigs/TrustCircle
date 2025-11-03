/**
 * VerificationGate Component
 * 
 * Middleware component that checks verification requirements
 * Shows verification prompt if user doesn't meet requirements
 * 
 * @example
 * ```tsx
 * <VerificationGate requirements={VERIFICATION_REQUIREMENTS.BORROW_SMALL}>
 *   <LoanRequestForm />
 * </VerificationGate>
 * ```
 */

'use client';

import { ReactNode, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { useVerification, VerificationRequirements } from '@/hooks/useVerification';
import { VerificationWizard } from './VerificationWizard';

interface VerificationGateProps {
  children: ReactNode;
  requirements: VerificationRequirements;
  fallback?: ReactNode;
  showButton?: boolean;
}

export function VerificationGate({
  children,
  requirements,
  fallback,
  showButton = true,
}: VerificationGateProps) {
  const { meetsRequirements, verificationLevel, isVerified, getLevelName } = useVerification();
  const [wizardOpen, setWizardOpen] = useState(false);

  // Check if user meets requirements
  const meetsReqs = meetsRequirements(requirements);

  if (meetsReqs) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default gate UI
  return (
    <>
      <Card padding="lg" shadow="md" className="text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Verification Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          {requirements.reason}
        </p>

        {/* Current vs Required Level */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Level</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              isVerified
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
            }`}>
              {isVerified ? getLevelName(verificationLevel) : 'Not Verified'}
            </span>
          </div>

          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>

          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Required Level</p>
            <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400">
              {getLevelName(requirements.minLevel)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {showButton && (
          <Button
            variant="primary"
            onClick={() => setWizardOpen(true)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          >
            {isVerified ? 'Upgrade Verification' : 'Start Verification'}
          </Button>
        )}

        {/* Additional Info */}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          Verification typically takes 5-30 minutes using Holonym's zero-knowledge proof system
        </p>
      </Card>

      <VerificationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </>
  );
}
