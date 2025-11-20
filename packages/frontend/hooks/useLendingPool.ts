/**
 * useLendingPool Hook
 * 
 * React hook for interacting with lending pools
 * Handles deposits, withdrawals, and pool data fetching
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import {
  calculateLenderAPYFromPool,
  calculateUtilization,
  calculateAvailableLiquidity,
  calculateShareValue,
} from '@/lib/calculations/interestRates';
import { LENDING_POOL } from '@/config/contracts';
import { ERC20_ABI } from '@/config/tokens';

// Get contract configuration
const { address: LENDING_POOL_ADDRESS, abi: LENDING_POOL_ABI } = LENDING_POOL;

// Simplified ERC20 ABI for approvals
const ERC20_APPROVE_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
] as const;

interface PoolData {
  asset: string;
  totalDeposits: bigint;
  totalBorrowed: bigint;
  totalReserves: bigint;
  totalShares: bigint;
  lastUpdateTimestamp: bigint;
  accumulatedInterest: bigint;
  isActive: boolean;
}

interface UserDeposit {
  shares: bigint;
  lastDepositTime: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
}

interface PoolStats {
  totalDeposits: number;
  totalBorrowed: number;
  totalReserves: number;
  totalShares: number;
  lenderAPY: number;
  borrowAPY: number;
  utilization: number;
  availableLiquidity: number;
  shareValue: number;
}

interface UserStats {
  shares: number;
  deposited: number;
  value: number;
  earnings: number;
}

export function useLendingPool(assetAddress: string) {
  const { address } = useAccount();
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poolAddress = LENDING_POOL_ADDRESS

  // Read pool data
  const { data: poolData, refetch: refetchPool } = useContractRead({
    address: poolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'pools',
    args: [assetAddress as `0x${string}`],
    watch: true,
  }) as { data: PoolData | undefined; refetch: () => void };

  // Read user deposit data
  const { data: userData, refetch: refetchUser } = useContractRead({
    address: poolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'userDeposits',
    args: address ? [address, assetAddress as `0x${string}`] : undefined,
    enabled: !!address,
    watch: true,
  }) as { data: UserDeposit | undefined; refetch: () => void };

  // Read user token balance
  const { data: userBalance } = useContractRead({
    address: assetAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Read token decimals
  const { data: decimals } = useContractRead({
    address: assetAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  // Calculate pool stats
  useEffect(() => {
    if (!poolData || !poolData.totalDeposits) return;

    try {
      const dec = Number(decimals || 18);
      const totalDeposits = Number(formatUnits(poolData.totalDeposits, dec));
      const totalBorrowed = Number(formatUnits(poolData.totalBorrowed || BigInt(0), dec));
      const totalReserves = Number(formatUnits(poolData.totalReserves || BigInt(0), dec));
      const totalShares = Number(formatUnits(poolData.totalShares || BigInt(0), dec));

      const utilization = calculateUtilization(totalBorrowed, totalDeposits);
      const lenderAPY = calculateLenderAPYFromPool(totalBorrowed, totalDeposits);
      const borrowAPY = lenderAPY / (utilization / 100) / 0.9; // Reverse calculation
      const availableLiquidity = calculateAvailableLiquidity(totalDeposits, totalBorrowed);
      const poolValue = totalDeposits - totalBorrowed + totalReserves;
      const shareValue = calculateShareValue(totalShares, poolValue);

      setPoolStats({
        totalDeposits,
        totalBorrowed,
        totalReserves,
        totalShares,
        lenderAPY,
        borrowAPY,
        utilization,
        availableLiquidity,
        shareValue,
      });
    } catch (error) {
      console.error('Error calculating pool stats:', error);
      setError('Failed to calculate pool statistics');
    }
  }, [poolData, decimals]);

  // Calculate user stats
  useEffect(() => {
    if (!userData || !poolStats) return;

    const dec = Number(decimals || 18);
    const shares = Number(formatUnits(userData.shares, dec));
    const deposited = Number(formatUnits(userData.totalDeposited, dec));
    const value = shares * poolStats.shareValue;
    const earnings = value - deposited;

    setUserStats({
      shares,
      deposited,
      value,
      earnings,
    });
  }, [userData, poolStats, decimals]);

  // Approve tokens
  const { writeAsync: approveToken } = useContractWrite({
    address: assetAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
  });

  // Deposit
  const { writeAsync: depositWrite } = useContractWrite({
    address: poolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'deposit',
  });

  // Withdraw
  const { writeAsync: withdrawWrite } = useContractWrite({
    address: poolAddress,
    abi: LENDING_POOL_ABI,
    functionName: 'withdraw',
  });

  /**
   * Deposit tokens into pool
   */
  const deposit = useCallback(async (amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const dec = Number(decimals || 18);
      const amountBN = parseUnits(amount, dec);

      // 1. Check allowance
      const allowance = await window.ethereum?.request({
        method: 'eth_call',
        params: [{
          to: assetAddress,
          data: `0xdd62ed3e${address.slice(2).padStart(64, '0')}${poolAddress.slice(2).padStart(64, '0')}`,
        }, 'latest'],
      });

      // 2. Approve if needed
      if (!allowance || BigInt(allowance) < amountBN) {
        const approveTx = await approveToken({
          args: [poolAddress, amountBN],
        });
        // Wait for approval
        await approveTx.wait();
      }

      // 3. Deposit
      const depositTx = await depositWrite({
        args: [assetAddress as `0x${string}`, amountBN],
      });

      // Wait for deposit
      await depositTx.wait();

      // 4. Refetch data
      await refetchPool();
      await refetchUser();

      return depositTx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, assetAddress, decimals, poolAddress, approveToken, depositWrite, refetchPool, refetchUser]);

  /**
   * Withdraw tokens from pool
   */
  const withdraw = useCallback(async (shares: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const dec = Number(decimals || 18);
      const sharesBN = parseUnits(shares, dec);

      // Withdraw
      const withdrawTx = await withdrawWrite({
        args: [assetAddress as `0x${string}`, sharesBN],
      });

      // Wait for withdrawal
      await withdrawTx.wait();

      // Refetch data
      await refetchPool();
      await refetchUser();

      return withdrawTx;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, assetAddress, decimals, withdrawWrite, refetchPool, refetchUser]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([refetchPool(), refetchUser()]);
  }, [refetchPool, refetchUser]);

  return {
    // Data
    poolStats,
    userStats,
    userBalance: userBalance ? Number(formatUnits(userBalance as bigint, Number(decimals || 18))) : 0,
    isLoading,
    error,

    // Actions
    deposit,
    withdraw,
    refresh,
  };
}
