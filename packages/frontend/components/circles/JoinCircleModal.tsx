/**
 * JoinCircleModal Component
 * 
 * Modal for requesting to join a lending circle
 * Shows circle requirements and application form
 */

'use client';

import { useState } from 'react';
import { Modal, Button, Card } from '@/components/ui';
import { useLendingCircle } from '@/hooks/useLendingCircle';
import { useCreditScore } from '@/hooks/useCreditScore';
import { useVerification } from '@/hooks/useVerification';
import type { Circle } from '@/hooks/useLendingCircle';

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: Circle;
  onSuccess?: () => void;
}

export function JoinCircleModal({
  isOpen,
  onClose,
  circle,
  onSuccess,
}: JoinCircleModalProps) {
  const { requestToJoin, isLoading } = useLendingCircle();
  const { creditScore } = useCreditScore({ autoFetch: true });
  const { isVerified, verificationLevel } = useVerification();

  const [application, setApplication] = useState('');
  const [error, setError] = useState<string | null>(null);

  const meetsRequirements = creditScore && creditScore.score >= circle.minCreditScore;
  const canApply = meetsRequirements && isVerified;

  const handleSubmit = async () => {
    if (!canApply) return;

    setError(null);

    if (!application.trim()) {
      setError('Please write a brief introduction');
      return;
    }

    try {
      await requestToJoin(circle.id);
      
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error requesting to join:', err);
      setError(err instanceof Error ? err.message : 'Failed to request join');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Join ${circle.name}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Circle Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            About This Circle
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            {circle.description}
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Members</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {circle.memberCount}/{circle.maxMembers}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Active Loans</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {circle.activeLoans}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Default Rate</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {circle.defaultRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Membership Requirements
          </h4>
          <div className="space-y-2">
            {/* Verification */}
            <div className="flex items-center gap-2">
              {isVerified ? (
                <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={`text-sm ${
                isVerified 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                Identity verification required
              </span>
            </div>

            {/* Credit Score */}
            <div className="flex items-center gap-2">
              {meetsRequirements ? (
                <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={`text-sm ${
                meetsRequirements 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                Credit score ≥ {circle.minCreditScore} 
                {creditScore && ` (Your score: ${creditScore.score})`}
              </span>
            </div>

            {/* Approval */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Requires approval from existing members (60% quorum)
              </span>
            </div>
          </div>
        </div>

        {/* Application */}
        {canApply && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Why do you want to join this circle? *
            </label>
            <textarea
              value={application}
              onChange={(e) => setApplication(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Introduce yourself and explain why you'd be a good fit for this circle..."
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              This will be visible to existing circle members during the approval vote
            </p>
          </div>
        )}

        {/* Missing Requirements */}
        {!canApply && (
          <Card padding="md" className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Requirements Not Met</p>
                <ul className="space-y-1">
                  {!isVerified && (
                    <li>• Complete identity verification first</li>
                  )}
                  {!meetsRequirements && (
                    <li>• Improve your credit score to at least {circle.minCreditScore}</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* What Happens Next */}
        {canApply && (
          <Card padding="md" className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              What Happens Next?
            </h4>
            <ol className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>1. Your application is submitted to current members</li>
              <li>2. Members review your profile and vote (7-day period)</li>
              <li>3. If 60% approve, you'll be added to the circle</li>
              <li>4. You'll be notified of the result</li>
            </ol>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            fullWidth
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!canApply || !application.trim()}
            fullWidth
          >
            Submit Application
          </Button>
        </div>
      </div>
    </Modal>
  );
}
