/**
 * AvailablePools Component
 * 
 * Shows all available lending pools with their stats and deposit buttons
 */

'use client';

import { Card, Button } from '@/components/ui';
import { useLendingPool } from '@/hooks/useLendingPoolSimple';
import { getTokenAddresses } from '@/config/contracts';
import { formatCurrency, formatAPY } from '@/lib/calculations/interestRates';

interface AvailablePoolsProps {
  onDeposit: (tokenAddress: string, tokenSymbol: string) => void;
}

const TOKEN_SYMBOLS = {
  cUSD: 'cUSD',
  cEUR: 'cEUR',
  cREAL: 'cREAL',
};

export function AvailablePools({ onDeposit }: AvailablePoolsProps) {
  const tokens = getTokenAddresses();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Object.entries(tokens).map(([symbol, address]) => (
        <PoolCard
          key={address}
          assetAddress={address}
          assetSymbol={symbol}
          onDeposit={onDeposit}
        />
      ))}
    </div>
  );
}

function PoolCard({
  assetAddress,
  assetSymbol,
  onDeposit,
}: {
  assetAddress: string;
  assetSymbol: string;
  onDeposit: (tokenAddress: string, tokenSymbol: string) => void;
}) {
  const { poolStats, isLoading } = useLendingPool(assetAddress);

  if (isLoading || !poolStats) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{assetSymbol}</h3>
        <div className="text-2xl">💰</div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-6">
        <div>
          <p className="text-sm text-gray-600">Lender APY</p>
          <p className="text-2xl font-bold text-green-600">
            {formatAPY(poolStats.lenderAPY)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Total Deposits</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(poolStats.totalDeposits, 'USD', 0)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(poolStats.availableLiquidity, 'USD', 0)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Utilization</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${poolStats.utilization}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {poolStats.utilization.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Deposit Button */}
      <button
        onClick={() => {
          console.log('🔘 Deposit button clicked:', assetSymbol, assetAddress);
          onDeposit(assetAddress, assetSymbol);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        Deposit {assetSymbol}
      </button>
    </Card>
  );
}
