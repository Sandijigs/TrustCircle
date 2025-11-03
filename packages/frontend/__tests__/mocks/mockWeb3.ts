import { vi } from 'vitest';

export const mockAccount = '0x1234567890123456789012345678901234567890';
export const mockChainId = 44787; // Celo Alfajores

export const mockWagmiHooks = {
  useAccount: vi.fn(() => ({
    address: mockAccount,
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
  })),
  
  useConnect: vi.fn(() => ({
    connect: vi.fn(),
    connectors: [],
    isPending: false,
    error: null,
  })),
  
  useDisconnect: vi.fn(() => ({
    disconnect: vi.fn(),
  })),
  
  useChainId: vi.fn(() => mockChainId),
  
  useReadContract: vi.fn((config) => ({
    data: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  })),
  
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    data: undefined,
    error: null,
    isPending: false,
  })),
  
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
  
  useBalance: vi.fn(() => ({
    data: { formatted: '1000.0', value: BigInt('1000000000000000000000') },
    isLoading: false,
  })),
};

export const mockContractData = {
  lendingPool: {
    address: '0xLendingPoolAddress' as `0x${string}`,
    poolData: {
      totalDeposits: BigInt('1000000000000000000000'),
      totalBorrowed: BigInt('500000000000000000000'),
      isActive: true,
    },
    userDeposits: {
      shares: BigInt('1000000000000000000'),
      depositTime: BigInt(Date.now() / 1000),
    },
  },
  
  loanManager: {
    address: '0xLoanManagerAddress' as `0x${string}`,
    loans: [{
      id: 1n,
      borrower: mockAccount as `0x${string}`,
      principal: BigInt('500000000000000000000'),
      interestRate: 1200,
      status: 2, // Active
      totalAmountDue: BigInt('550000000000000000000'),
      amountPaid: BigInt('100000000000000000000'),
      paidInstallments: 1,
      numInstallments: 3,
    }],
  },
  
  creditScore: {
    address: '0xCreditScoreAddress' as `0x${string}`,
    score: 720,
  },
};

export function setupWeb3Mocks() {
  vi.mock('wagmi', () => mockWagmiHooks);
  vi.mock('viem', () => ({
    parseEther: (value: string) => BigInt(value) * BigInt('1000000000000000000'),
    formatEther: (value: bigint) => (Number(value) / 1e18).toString(),
  }));
}
