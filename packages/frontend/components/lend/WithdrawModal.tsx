/**
 * WithdrawModal Component
 * 
 * Modal for withdrawing stablecoins from lending pool
 * Shows current value and earnings
 */

'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { CurrencyInput } from '@/components/forms';
import { useLendingPool } from '@/hooks/useLendingPool';
import { formatCurrency } from '@/lib/calculations/interestRates';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetAddress: string;
  assetSymbol: string;
  onSuccess?: () => void;
}

export function WithdrawModal({
  isOpen,
  onClose,
  assetAddress,
  assetSymbol,
  onSuccess,
}: WithdrawModalProps) {
  const { poolStats, userStats, withdraw, isLoading } = useLendingPool(assetAddress);
  
  const [shares, setShares] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  // Calculate withdrawal amount when shares change
  const handleSharesChange = (value: string) => {
    setShares(value);
    
    const sharesNum = parseFloat(value);
    if (!isNaN(sharesNum) && sharesNum > 0 && poolStats && userStats) {
      const amount = sharesNum * poolStats.shareValue;
      setWithdrawAmount(amount);
    } else {
      setWithdrawAmount(0);
    }
  };

  const handleWithdraw = async () => {
    setError(null);

    // Validate shares
    const sharesNum = parseFloat(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!userStats || sharesNum > userStats.shares) {
      setError('Insufficient shares');
      return;
    }

    if (!poolStats || withdrawAmount > poolStats.availableLiquidity) {
      setError('Insufficient liquidity in pool. Try a smaller amount.');
      return;
    }

    try {
      await withdraw(shares);
      
      // Success
      setShares('');
      setWithdrawAmount(0);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    }
  };

  const handleMaxClick = () => {
    if (userStats) {
      setShares(userStats.shares.toString());
      setWithdrawAmount(userStats.value);
    }
  };

  const handleReset = () => {
    setShares('');
    setError(null);
    setWithdrawAmount(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Withdraw ${assetSymbol}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Current Position Summary */}
        {userStats && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Your Position
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(userStats.value, 'USD')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Earnings</p>
                <p className={`text-xl font-bold ${
                  userStats.earnings >= 0 
                    ? 'text-success-600 dark:text-success-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {userStats.earnings >= 0 ? '+' : ''}{formatCurrency(userStats.earnings, 'USD')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            LP Shares to Withdraw
          </label>
          <CurrencyInput
            value={shares}
            onChange={handleSharesChange}
            currency="shares"
            placeholder="0.00"
            helperText={userStats ? `Available: ${userStats.shares.toFixed(4)} shares` : undefined}
          />
          
          {/* Max Button */}
          <button
            onClick={handleMaxClick}
            className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Withdraw All
          </button>
        </div>

        {/* Withdrawal Preview */}
        {withdrawAmount > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">You will receive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(withdrawAmount, 'USD')} {assetSymbol}
                </p>
              </div>
              <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Share Value Info */}
        {poolStats && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Current Share Value</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {poolStats.shareValue.toFixed(6)} {assetSymbol}
              </span>
            </div>
          </div>
        )}

        {/* Liquidity Warning */}
        {poolStats && poolStats.availableLiquidity < (userStats?.value || 0) && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex gap-2 text-sm">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Limited Liquidity</p>
                <p className="text-xs">
                  Available: {formatCurrency(poolStats.availableLiquidity, 'USD')} {assetSymbol}. 
                  You may not be able to withdraw your full amount immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex gap-2 text-sm">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-gray-700 dark:text-gray-300">
              <ul className="space-y-1 text-xs">
                <li>• Withdrawal amount includes principal + interest earned</li>
                <li>• LP shares will be burned</li>
                <li>• Withdrawals subject to pool liquidity</li>
              </ul>
            </div>
          </div>
        </div>

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
            onClick={() => {
              handleReset();
              onClose();
            }}
            fullWidth
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleWithdraw}
            loading={isLoading}
            disabled={!shares || parseFloat(shares) <= 0}
            fullWidth
          >
            {isLoading ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
