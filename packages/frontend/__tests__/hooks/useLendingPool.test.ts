import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLendingPool } from '@/hooks/useLendingPool';
import { mockWagmiHooks, setupWeb3Mocks } from '../mocks/mockWeb3';

setupWeb3Mocks();

describe('useLendingPool', () => {
  const mockTokenAddress = '0xTokenAddress' as `0x${string}`;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches pool data', async () => {
    const mockPoolData = {
      totalDeposits: BigInt('1000000000000000000000'),
      totalBorrowed: BigInt('500000000000000000000'),
      totalReserves: BigInt('10000000000000000000'),
      accumulatedInterest: BigInt('5000000000000000000'),
      isActive: true,
    };
    
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: mockPoolData,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    expect(result.current.poolData).toEqual(mockPoolData);
    expect(result.current.isLoading).toBe(false);
  });

  it('calculates utilization rate', async () => {
    mockWagmiHooks.useReadContract.mockImplementation((config) => {
      if (config.functionName === 'getPoolData') {
        return {
          data: {
            totalDeposits: BigInt('1000000000000000000000'),
            totalBorrowed: BigInt('500000000000000000000'),
            isActive: true,
          },
          isError: false,
          isLoading: false,
          refetch: vi.fn(),
        };
      }
      return { data: undefined, isError: false, isLoading: false, refetch: vi.fn() };
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    await waitFor(() => {
      expect(result.current.utilizationRate).toBe(50); // 50%
    });
  });

  it('fetches user deposits', async () => {
    const mockUserDeposits = {
      shares: BigInt('1000000000000000000'),
      depositTime: BigInt(Date.now() / 1000),
    };
    
    mockWagmiHooks.useReadContract.mockImplementation((config) => {
      if (config.functionName === 'userDeposits') {
        return {
          data: mockUserDeposits,
          isError: false,
          isLoading: false,
          refetch: vi.fn(),
        };
      }
      return { data: undefined, isError: false, isLoading: false, refetch: vi.fn() };
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    expect(result.current.userDeposits).toEqual(mockUserDeposits);
  });

  it('handles deposit action', async () => {
    const mockWrite = vi.fn();
    mockWagmiHooks.useWriteContract.mockReturnValue({
      writeContract: mockWrite,
      isPending: false,
      data: undefined,
      error: null,
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    const amount = BigInt('1000000000000000000'); // 1 token
    result.current.deposit(amount);
    
    expect(mockWrite).toHaveBeenCalled();
  });

  it('handles withdraw action', async () => {
    const mockWrite = vi.fn();
    mockWagmiHooks.useWriteContract.mockReturnValue({
      writeContract: mockWrite,
      isPending: false,
      data: undefined,
      error: null,
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    const shares = BigInt('1000000000000000000');
    result.current.withdraw(shares);
    
    expect(mockWrite).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      refetch: vi.fn(),
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    expect(result.current.isError).toBe(true);
  });

  it('calculates APY correctly', async () => {
    mockWagmiHooks.useReadContract.mockImplementation((config) => {
      if (config.functionName === 'calculateLenderAPY') {
        return {
          data: 850n, // 8.5%
          isError: false,
          isLoading: false,
          refetch: vi.fn(),
        };
      }
      return { data: undefined, isError: false, isLoading: false, refetch: vi.fn() };
    });
    
    const { result } = renderHook(() => useLendingPool(mockTokenAddress));
    
    await waitFor(() => {
      expect(result.current.lenderAPY).toBe(850n);
    });
  });
});
