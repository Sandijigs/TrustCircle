/**
 * MyDeposits Component
 * 
 * Displays user's deposits across all pools
 * Shows current value, earnings, and actions
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button } from '@/components/ui';
import { useLendingPool } from '@/hooks/useLendingPool';
import { formatCurrency, formatAPY } from '@/lib/calculations/interestRates';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';

interface Pool {
  address: string;
  symbol: string;
  name: string;
}

interface MyDepositsProps {
  pools?: Pool[];
}

export function MyDeposits({ pools = [] }: MyDepositsProps) {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [poolsWithDeposits, setPoolsWithDeposits] = useState<Set<string>>(new Set());

  const handleDeposit = (pool: Pool) => {
    setSelectedPool(pool);
    setIsDepositModalOpen(true);
  };

  const handleWithdraw = (pool: Pool) => {
    setSelectedPool(pool);
    setIsWithdrawModalOpen(true);
  };

  const handleDepositStatusChange = useCallback((poolSymbol: string, hasDeposit: boolean) => {
    setPoolsWithDeposits(prev => {
      const newSet = new Set(prev);
      if (hasDeposit) {
        newSet.add(poolSymbol);
      } else {
        newSet.delete(poolSymbol);
      }
      return newSet;
    });
  }, []);

  return (
    <>
      <div className="space-y-4">
        {pools.map((pool) => (
          <PoolDepositCard
            key={pool.symbol}
            pool={pool}
            onDeposit={() => handleDeposit(pool)}
            onWithdraw={() => handleWithdraw(pool)}
            onHasDepositChange={(hasDeposit) => handleDepositStatusChange(pool.symbol, hasDeposit)}
          />
        ))}

        {poolsWithDeposits.size === 0 && (
          <Card padding="lg">
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Deposits Yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start earning interest by depositing stablecoins into lending pools
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {selectedPool && (
        <>
          <DepositModal
            isOpen={isDepositModalOpen}
            onClose={() => setIsDepositModalOpen(false)}
            assetAddress={selectedPool.address}
            assetSymbol={selectedPool.symbol as "cUSD" | "cEUR" | "cREAL"}
          />
          <WithdrawModal
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            assetAddress={selectedPool.address}
            assetSymbol={selectedPool.symbol as "cUSD" | "cEUR" | "cREAL"}
          />
        </>
      )}
    </>
  );
}

// Individual pool deposit card
function PoolDepositCard({
  pool,
  onDeposit,
  onWithdraw,
  onHasDepositChange,
}: {
  pool: Pool;
  onDeposit: () => void;
  onWithdraw: () => void;
  onHasDepositChange?: (hasDeposit: boolean) => void;
}) {
  const { poolStats, userStats, isLoading } = useLendingPool(pool.address);
  const prevHasDepositRef = useRef<boolean | null>(null);

  const hasDeposit = !isLoading && userStats && userStats.shares > 0;

  // Notify parent when deposit status changes (only when it actually changes)
  useEffect(() => {
    if (!isLoading) {
      const currentHasDeposit = userStats && userStats.shares > 0;

      // Only notify if status changed from previous render
      if (prevHasDepositRef.current !== currentHasDeposit) {
        onHasDepositChange?.(currentHasDeposit);
        prevHasDepositRef.current = currentHasDeposit;
      }
    }
  }, [isLoading, userStats, onHasDepositChange]);

  if (isLoading) {
    return null; // Don't show loading state in My Deposits section
  }

  // Only render if user has a deposit
  if (!hasDeposit) {
    return null;
  }

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {pool.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pool.symbol} Pool
          </p>
        </div>

        {poolStats && (
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current APY</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">
              {formatAPY(poolStats.lenderAPY)}
            </p>
          </div>
        )}
      </div>

      {/* User's Position */}
      <div className="space-y-4">
        {/* Position Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Deposit</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(userStats?.deposited || 0, 'USD')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Value</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(userStats?.value || 0, 'USD')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Earnings</p>
              <p className={`text-lg font-semibold ${
                (userStats?.earnings || 0) >= 0
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(userStats?.earnings || 0) >= 0 ? '+' : ''}{formatCurrency(userStats?.earnings || 0, 'USD')}
              </p>
            </div>
          </div>
        </div>

        {/* LP Shares Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">LP Shares</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {userStats?.shares.toFixed(4) || '0.0000'} shares
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onDeposit}
            fullWidth
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Deposit More
          </Button>
          <Button
            variant="primary"
            onClick={onWithdraw}
            fullWidth
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          >
            Withdraw
          </Button>
        </div>
      </div>
    </Card>
  );
}
