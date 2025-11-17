/**
 * useLendingPool Hook (Simplified)
 * 
 * Simplified version that actually works
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { formatUnits } from 'viem';
import { LENDING_POOL } from '@/config/contracts';

const { address: LENDING_POOL_ADDRESS, abi: LENDING_POOL_ABI } = LENDING_POOL;

export function useLendingPool(assetAddress: string) {
  const { address } = useAccount();
  const [poolStats, setPoolStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read pool data
  const { data: poolData, isError, isLoading: isContractLoading } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: 'pools',
    args: [assetAddress as `0x${string}`],
  }) as { data: any; isError: boolean; isLoading: boolean };

  useEffect(() => {
    console.log('🔍 Pool hook update:', {
      assetAddress,
      poolData,
      isError,
      isContractLoading
    });

    if (isContractLoading) {
      setIsLoading(true);
      return;
    }

    if (isError) {
      console.error('❌ Error reading pool');
      setIsLoading(false);
      setPoolStats({
        totalDeposits: 0,
        totalBorrowed: 0,
        totalReserves: 0,
        totalShares: 0,
        lenderAPY: 5,
        borrowAPY: 8,
        utilization: 0,
        availableLiquidity: 0,
        shareValue: 1,
      });
      return;
    }

    if (!poolData) {
      console.log('⚠️  No pool data yet');
      setIsLoading(false);
      return;
    }

    // Pool data received!
    // Data comes as array: [asset, totalDeposits, totalBorrowed, totalReserves, totalShares, lastUpdateTimestamp, accumulatedInterest, isActive]
    const pool = poolData as any;
    console.log('✅ Pool data received:', pool);

    try {
      // Access by array index
      const totalDeposits = Number(formatUnits(pool[1] || 0n, 18));
      const totalBorrowed = Number(formatUnits(pool[2] || 0n, 18));
      const totalReserves = Number(formatUnits(pool[3] || 0n, 18));
      const totalShares = Number(formatUnits(pool[4] || 0n, 18));
      const isActive = pool[7] || false;

      const utilization = totalDeposits > 0 
        ? (totalBorrowed / totalDeposits) * 100 
        : 0;

      const lenderAPY = utilization < 80 
        ? 5 + (utilization / 80) * 10
        : 15 + ((utilization - 80) / 20) * 40;

      const borrowAPY = lenderAPY * 1.1; // 10% spread
      const availableLiquidity = totalDeposits - totalBorrowed;

      const stats = {
        totalDeposits,
        totalBorrowed,
        totalReserves,
        totalShares,
        lenderAPY,
        borrowAPY,
        utilization,
        availableLiquidity,
        shareValue: 1,
        isActive,
      };

      console.log('📊 Calculated stats:', stats);
      setPoolStats(stats);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error calculating stats:', error);
      setIsLoading(false);
    }
  }, [poolData, isError, isContractLoading, assetAddress]);

  return {
    poolStats,
    isLoading,
    error: isError ? 'Failed to load pool' : null,
  };
}
