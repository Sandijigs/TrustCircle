/**
 * PoolStats Component
 * 
 * Displays comprehensive lending pool analytics
 * Shows TVL, utilization, APY, and interest rate curve
 */

'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui';
import { useLendingPool } from '@/hooks/useLendingPool';
import { 
  formatAPY, 
  formatCurrency, 
  generateInterestRateCurve,
  calculateHealthFactor,
} from '@/lib/calculations/interestRates';

interface PoolStatsProps {
  assetAddress: string;
  assetSymbol: string;
  compact?: boolean;
}

export function PoolStats({
  assetAddress,
  assetSymbol,
  compact = false,
}: PoolStatsProps) {
  const { poolStats, isLoading } = useLendingPool(assetAddress);

  // Generate interest rate curve data
  const curveData = useMemo(() => generateInterestRateCurve(50), []);

  // Calculate health metrics
  const healthFactor = poolStats 
    ? calculateHealthFactor(poolStats.totalDeposits, poolStats.totalBorrowed)
    : 0;

  if (isLoading || !poolStats) {
    return (
      <Card padding="lg" shadow="md">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card padding="md" shadow="sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">APY</p>
            <p className="text-lg font-bold text-success-600 dark:text-success-400">
              {formatAPY(poolStats.lenderAPY)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">TVL</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(poolStats.totalDeposits, 'USD', 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Utilization</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {poolStats.utilization.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Value Locked */}
        <Card padding="lg" shadow="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Value Locked
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(poolStats.totalDeposits, 'USD', 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {assetSymbol}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Lender APY */}
        <Card padding="lg" shadow="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Lender APY
              </p>
              <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                {formatAPY(poolStats.lenderAPY)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Variable rate
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Pool Utilization */}
        <Card padding="lg" shadow="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Utilization Rate
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {poolStats.utilization.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Optimal: 80%
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              poolStats.utilization >= 80 
                ? 'bg-yellow-100 dark:bg-yellow-900/20'
                : 'bg-purple-100 dark:bg-purple-900/20'
            }`}>
              <svg className={`w-6 h-6 ${
                poolStats.utilization >= 80
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-purple-600 dark:text-purple-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card padding="lg" shadow="md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Pool Metrics
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Borrowed</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(poolStats.totalBorrowed, 'USD', 0)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Liquidity</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(poolStats.availableLiquidity, 'USD', 0)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Borrow APY</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatAPY(poolStats.borrowAPY)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Health Factor</p>
            <p className={`text-xl font-semibold ${
              healthFactor >= 2 
                ? 'text-success-600 dark:text-success-400'
                : healthFactor >= 1.5
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Pool Composition</span>
            <span>{poolStats.utilization.toFixed(2)}% utilized</span>
          </div>
          <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Borrowed (red) */}
            <div
              className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-500"
              style={{ width: `${poolStats.utilization}%` }}
            />
            {/* Available (green) */}
            <div
              className="absolute right-0 top-0 h-full bg-success-500 transition-all duration-500"
              style={{ width: `${100 - poolStats.utilization}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span>🔴 Borrowed: {formatCurrency(poolStats.totalBorrowed, 'USD', 0)}</span>
            <span>🟢 Available: {formatCurrency(poolStats.availableLiquidity, 'USD', 0)}</span>
          </div>
        </div>
      </Card>

      {/* Interest Rate Curve */}
      <Card padding="lg" shadow="md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Interest Rate Model
        </h3>
        
        <div className="relative h-64">
          {/* Chart */}
          <svg className="w-full h-full" viewBox="0 0 500 250" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="50"
                y1={250 - y * 2 - 25}
                x2="500"
                y2={250 - y * 2 - 25}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-700"
              />
            ))}

            {/* Axes */}
            <line x1="50" y1="25" x2="50" y2="225" stroke="currentColor" strokeWidth="2" className="text-gray-400" />
            <line x1="50" y1="225" x2="500" y2="225" stroke="currentColor" strokeWidth="2" className="text-gray-400" />

            {/* Lender APY curve */}
            <polyline
              points={curveData.map((d, i) => {
                const x = 50 + (i / curveData.length) * 450;
                const y = 225 - (d.lenderAPY / 60) * 200;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-success-500"
            />

            {/* Borrow APY curve */}
            <polyline
              points={curveData.map((d, i) => {
                const x = 50 + (i / curveData.length) * 450;
                const y = 225 - (d.borrowAPY / 60) * 200;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="5,5"
              className="text-red-500"
            />

            {/* Optimal utilization marker */}
            <line
              x1={50 + 0.8 * 450}
              y1="25"
              x2={50 + 0.8 * 450}
              y2="225"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="text-yellow-500"
            />
            <text x={50 + 0.8 * 450 + 5} y="20" className="text-xs fill-yellow-600 dark:fill-yellow-400">
              Optimal (80%)
            </text>

            {/* Current utilization marker */}
            <circle
              cx={50 + (poolStats.utilization / 100) * 450}
              cy={225 - (poolStats.lenderAPY / 60) * 200}
              r="5"
              className="fill-success-600"
            />
            <text
              x={50 + (poolStats.utilization / 100) * 450}
              y={225 - (poolStats.lenderAPY / 60) * 200 - 10}
              className="text-xs fill-gray-900 dark:fill-white"
              textAnchor="middle"
            >
              Current
            </text>

            {/* Y-axis labels */}
            <text x="5" y="30" className="text-xs fill-gray-600 dark:fill-gray-400">60%</text>
            <text x="5" y="80" className="text-xs fill-gray-600 dark:fill-gray-400">45%</text>
            <text x="5" y="130" className="text-xs fill-gray-600 dark:fill-gray-400">30%</text>
            <text x="5" y="180" className="text-xs fill-gray-600 dark:fill-gray-400">15%</text>
            <text x="5" y="230" className="text-xs fill-gray-600 dark:fill-gray-400">0%</text>

            {/* X-axis labels */}
            <text x="50" y="245" className="text-xs fill-gray-600 dark:fill-gray-400">0%</text>
            <text x="162" y="245" className="text-xs fill-gray-600 dark:fill-gray-400">25%</text>
            <text x="275" y="245" className="text-xs fill-gray-600 dark:fill-gray-400">50%</text>
            <text x="387" y="245" className="text-xs fill-gray-600 dark:fill-gray-400">75%</text>
            <text x="490" y="245" className="text-xs fill-gray-600 dark:fill-gray-400">100%</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-success-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Lender APY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-red-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Borrow APY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-yellow-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Optimal Util.</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
          <p className="mb-2"><strong>How it works:</strong></p>
          <ul className="space-y-1 text-xs">
            <li>• Below 80% utilization: Interest rates increase gradually</li>
            <li>• Above 80% utilization: Interest rates increase steeply to attract more liquidity</li>
            <li>• Higher utilization → Higher APY for lenders, but less available liquidity</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
