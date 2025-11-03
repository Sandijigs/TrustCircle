/**
 * DepositModal Component
 * 
 * Modal for depositing stablecoins into lending pool
 * Shows projected earnings and APY
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { CurrencyInput } from '@/components/forms';
import { useLendingPool } from '@/hooks/useLendingPool';
import { calculateProjectedEarnings, formatAPY, formatCurrency } from '@/lib/calculations/interestRates';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetAddress: string;
  assetSymbol: string;
  onSuccess?: () => void;
}

export function DepositModal({
  isOpen,
  onClose,
  assetAddress,
  assetSymbol,
  onSuccess,
}: DepositModalProps) {
  const { poolStats, userBalance, deposit, isLoading } = useLendingPool(assetAddress);
  
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [projectedEarnings, setProjectedEarnings] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  } | null>(null);

  // Calculate projected earnings when amount changes
  useEffect(() => {
    if (amount && poolStats) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum) && amountNum > 0) {
        const earnings = calculateProjectedEarnings(amountNum, poolStats.lenderAPY);
        setProjectedEarnings(earnings);
      } else {
        setProjectedEarnings(null);
      }
    } else {
      setProjectedEarnings(null);
    }
  }, [amount, poolStats]);

  const handleDeposit = async () => {
    setError(null);

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amountNum < 1) {
      setError('Minimum deposit is 1 token');
      return;
    }

    if (amountNum > userBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      await deposit(amount);
      
      // Success
      setAmount('');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Deposit error:', err);
      setError(err instanceof Error ? err.message : 'Deposit failed');
    }
  };

  const handleMaxClick = () => {
    setAmount(userBalance.toString());
  };

  const handleReset = () => {
    setAmount('');
    setError(null);
    setProjectedEarnings(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Deposit ${assetSymbol}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Current APY Banner */}
        {poolStats && (
          <div className="p-4 bg-gradient-to-r from-success-50 to-blue-50 dark:from-success-900/10 dark:to-blue-900/10 rounded-lg border border-success-200 dark:border-success-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current APY</p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                  {formatAPY(poolStats.lenderAPY)}
                </p>
              </div>
              <svg className="w-12 h-12 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        )}

        {/* Deposit Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deposit Amount
          </label>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            currency={assetSymbol}
            placeholder="0.00"
            helperText={`Available: ${formatCurrency(userBalance, 'USD')} ${assetSymbol}`}
          />
          
          {/* Max Button */}
          <button
            onClick={handleMaxClick}
            className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Use Max
          </button>
        </div>

        {/* Projected Earnings */}
        {projectedEarnings && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Projected Earnings
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Daily</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  +{formatCurrency(projectedEarnings.daily, 'USD')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Weekly</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  +{formatCurrency(projectedEarnings.weekly, 'USD')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Monthly</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  +{formatCurrency(projectedEarnings.monthly, 'USD')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Yearly</p>
                <p className="text-lg font-semibold text-success-600 dark:text-success-400">
                  +{formatCurrency(projectedEarnings.yearly, 'USD')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pool Info */}
        {poolStats && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Pool Utilization</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {poolStats.utilization.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Available Liquidity</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(poolStats.availableLiquidity, 'USD')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-2 text-sm">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold mb-1">Important</p>
              <ul className="space-y-1 text-xs">
                <li>• APY varies based on pool utilization</li>
                <li>• Interest compounds automatically</li>
                <li>• Withdrawals subject to available liquidity</li>
                <li>• You'll receive LP tokens representing your share</li>
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
            onClick={handleDeposit}
            loading={isLoading}
            disabled={!amount || parseFloat(amount) <= 0}
            fullWidth
          >
            {isLoading ? 'Depositing...' : 'Deposit'}
          </Button>
        </div>

        {/* Transaction Info */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          This transaction requires two signatures: one to approve tokens, one to deposit
        </p>
      </div>
    </Modal>
  );
}
