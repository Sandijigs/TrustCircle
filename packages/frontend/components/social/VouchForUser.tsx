'use client';

/**
 * Vouch For User Component
 * Interface for vouching for Farcaster connections
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Shield, Check, AlertCircle, User } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { createVouch, hasVouchedFor } from '@/lib/farcaster/vouchSystem';
import type { FarcasterUser } from '@/lib/farcaster/types';

interface VouchForUserProps {
  targetUser: {
    fid: number;
    username: string;
    address: string;
  };
  currentUserFid?: number;
  currentUserUsername?: string;
  isVerified?: boolean;
  isCircleMember?: boolean;
  onVouchSuccess?: () => void;
}

export function VouchForUser({
  targetUser,
  currentUserFid,
  currentUserUsername,
  isVerified = false,
  isCircleMember = false,
  onVouchSuccess,
}: VouchForUserProps) {
  const { address } = useAccount();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVouched, setHasVouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if already vouched
  useState(() => {
    if (address && targetUser.address) {
      hasVouchedFor(address, targetUser.address).then(setHasVouched);
    }
  });

  async function handleVouch() {
    if (!address || !currentUserFid || !currentUserUsername) {
      setError('Please connect your wallet and Farcaster account');
      return;
    }

    if (hasVouched) {
      setError('You have already vouched for this user');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createVouch({
        voucherFid: currentUserFid,
        voucherUsername: currentUserUsername,
        voucherAddress: address,
        voucheeFid: targetUser.fid,
        voucheeAddress: targetUser.address,
        message: message.trim() || undefined,
        isVerified,
        isCircleMember,
      });

      if (!result.success) {
        setError(result.error || 'Failed to create vouch');
        return;
      }

      setSuccess(true);
      setHasVouched(true);
      onVouchSuccess?.();

      // Reset after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to vouch for user');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasVouched) {
    return (
      <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 rounded-full p-2">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100">
              You've vouched for @{targetUser.username}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your vouch is helping improve their credit score
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-purple-500 rounded-full p-2">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Vouch for @{targetUser.username}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your vouch will help improve their credit score and borrowing limit
            </p>
          </div>
        </div>

        {!currentUserFid ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Connect Farcaster to vouch
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  You need to link your Farcaster account to vouch for other users
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                What vouching means:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• You trust this person to repay loans</li>
                <li>• Your reputation backs their creditworthiness</li>
                <li>• Vouches from verified users carry more weight</li>
                {isCircleMember && (
                  <li>• Circle member vouches are highly valued</li>
                )}
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add a message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why do you trust this person?"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {message.length}/200 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Vouch created successfully!
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleVouch}
                isLoading={isSubmitting}
                disabled={!address || !currentUserFid}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating Vouch...' : 'Vouch for User'}
              </Button>
            </div>

            {isVerified && (
              <p className="text-xs text-center text-green-600 dark:text-green-400">
                ✓ Your vouch will have extra weight because you're verified
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
