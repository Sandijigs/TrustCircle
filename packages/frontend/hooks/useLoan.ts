/**
 * useLoan Hook
 * 
 * React hook for loan operations including:
 * - Request loan
 * - Make payments
 * - View loan details
 * - Track payment schedule
 * - Handle defaults
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import {
  Loan,
  LoanDisplay,
  LoanStatus,
  PaymentFrequency,
  LoanRequestParams,
  PaymentScheduleItem,
  LOAN_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
} from '@/types/loan';
import {
  calculateTotalInterest,
  calculateAPR,
  generatePaymentSchedule,
  calculateLatePaymentPenalty,
  getPaymentIntervalDays,
  daysToMonths,
  formatBPS,
} from '@/lib/calculations/loanCalculator';
import { LOAN_MANAGER, getContract } from '@/config/contracts';
import { ERC20_ABI } from '@/config/tokens';

// Get contract configuration
const { address: LOAN_MANAGER_ADDRESS, abi: LOAN_MANAGER_ABI } = LOAN_MANAGER;

// Simplified ERC20 ABI for approvals
const ERC20_APPROVE_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

export function useLoan(loanId?: bigint) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read specific loan data
  const { data: loanData, refetch: refetchLoan } = useReadContract({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'getLoan',
    args: loanId ? [loanId] : undefined,
    query: {
      enabled: !!loanId,
    },
  }) as { data: Loan | undefined; refetch: () => void };

  // Read all borrower's loans
  const { data: borrowerLoanIds, refetch: refetchBorrowerLoans } = useReadContract({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'getBorrowerLoans',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  }) as { data: bigint[] | undefined; refetch: () => void };

  // Read active loan count
  const { data: activeLoanCount } = useReadContract({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'activeLoanCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read payment late status
  const { data: lateStatus } = useReadContract({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'isPaymentLate',
    args: loanId ? [loanId] : undefined,
    query: {
      enabled: !!loanId,
    },
  }) as { data: { isLate: boolean; daysLate: bigint } | undefined };

  // Contract write functions
  const { writeContractAsync } = useWriteContract();

  /**
   * Convert raw loan data to display format
   */
  const formatLoanData = useCallback(async (loan: Loan): Promise<LoanDisplay> => {
    // Get asset info
    const assetContract = {
      address: loan.asset as `0x${string}`,
      abi: ERC20_ABI,
    };

    let decimals = 18;
    let assetSymbol = 'Unknown';

    try {
      // Read decimals and symbol
      const [dec, sym] = await Promise.all([
        window.ethereum?.request({
          method: 'eth_call',
          params: [{
            to: loan.asset,
            data: '0x313ce567', // decimals()
          }, 'latest'],
        }),
        window.ethereum?.request({
          method: 'eth_call',
          params: [{
            to: loan.asset,
            data: '0x95d89b41', // symbol()
          }, 'latest'],
        }),
      ]);

      if (dec) decimals = parseInt(dec, 16);
      if (sym) {
        // Decode symbol from hex
        const symbolHex = sym.slice(2);
        assetSymbol = Buffer.from(symbolHex, 'hex').toString('utf8').replace(/\0/g, '');
      }
    } catch (err) {
      console.error('Error fetching asset info:', err);
    }

    const principalAmount = Number(formatUnits(loan.principalAmount, decimals));
    const installmentAmount = Number(formatUnits(loan.installmentAmount, decimals));
    const totalRepaid = Number(formatUnits(loan.totalRepaid, decimals));
    const interestPaid = Number(formatUnits(loan.interestPaid, decimals));
    const interestRate = Number(loan.interestRate) / 100; // Convert BPS to percentage
    const duration = Number(loan.duration) / 86400; // Convert seconds to days
    const totalInstallments = Number(loan.totalInstallments);
    const paidInstallments = Number(loan.paidInstallments);

    const totalInterest = calculateTotalInterest(
      principalAmount,
      installmentAmount,
      totalInstallments
    );

    const apr = calculateAPR(principalAmount, totalInterest, duration);

    const remainingAmount = principalAmount - totalRepaid;
    const progressPercentage = (paidInstallments / totalInstallments) * 100;

    const startTime = new Date(Number(loan.startTime) * 1000);
    const nextPaymentDue = new Date(Number(loan.nextPaymentDue) * 1000);

    const isLate = lateStatus?.isLate || false;
    const daysLate = lateStatus ? Number(lateStatus.daysLate) : 0;

    return {
      id: loan.id.toString(),
      borrower: loan.borrower,
      asset: loan.asset,
      assetSymbol,
      principalAmount,
      interestRate,
      duration,
      durationInMonths: daysToMonths(duration),
      frequency: loan.frequency,
      frequencyLabel: PAYMENT_FREQUENCY_LABELS[loan.frequency],
      installmentAmount,
      totalInstallments,
      paidInstallments,
      totalRepaid,
      interestPaid,
      startTime,
      nextPaymentDue,
      status: loan.status,
      statusLabel: LOAN_STATUS_LABELS[loan.status],
      hasCollateral: loan.hasCollateral,
      latePaymentCount: Number(loan.latePaymentCount),
      circleId: loan.circleId.toString(),
      remainingAmount,
      progressPercentage,
      isLate,
      daysLate,
      totalInterest,
      apr,
    };
  }, [lateStatus]);

  /**
   * Current loan display data
   */
  const loanDisplay = useMemo(async () => {
    if (!loanData) return null;
    return await formatLoanData(loanData);
  }, [loanData, formatLoanData]);

  /**
   * Generate payment schedule
   */
  const paymentSchedule = useMemo((): PaymentScheduleItem[] => {
    if (!loanData) return [];

    const decimals = 18; // Default, should get from token
    const principal = Number(formatUnits(loanData.principalAmount, decimals));
    const annualRateBPS = Number(loanData.interestRate);
    const duration = Number(loanData.duration) / 86400; // to days
    const startTime = new Date(Number(loanData.startTime) * 1000);
    const paidInstallments = Number(loanData.paidInstallments);

    const schedule = generatePaymentSchedule(
      principal,
      annualRateBPS,
      duration,
      loanData.frequency,
      startTime
    );

    const now = new Date();

    return schedule.map((item, index) => {
      const installmentNumber = index + 1;
      const isPaid = installmentNumber <= paidInstallments;
      const isUpcoming = !isPaid && installmentNumber === paidInstallments + 1;
      const isOverdue = !isPaid && item.dueDate < now;

      return {
        installmentNumber,
        dueDate: item.dueDate,
        principalAmount: item.principalAmount,
        interestAmount: item.interestAmount,
        totalAmount: item.totalAmount,
        remainingBalance: item.remainingBalance,
        isPaid,
        isUpcoming,
        isOverdue,
      };
    });
  }, [loanData]);

  /**
   * Request a new loan
   */
  const requestLoan = useCallback(
    async (params: LoanRequestParams) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get token decimals
        const decimalsData = await window.ethereum?.request({
          method: 'eth_call',
          params: [{
            to: params.asset,
            data: '0x313ce567', // decimals()
          }, 'latest'],
        });

        const decimals = decimalsData ? parseInt(decimalsData, 16) : 18;
        const amountBN = parseUnits(params.amount, decimals);
        const durationSeconds = BigInt(params.duration * 86400); // days to seconds

        // Request loan
        const hash = await writeContractAsync({
          address: LOAN_MANAGER_ADDRESS,
          abi: LOAN_MANAGER_ABI,
          functionName: 'requestLoan',
          args: [
            params.asset as `0x${string}`,
            amountBN,
            durationSeconds,
            params.frequency,
            params.circleId,
          ],
        });

        console.log('Loan request transaction hash:', hash);

        // Refetch data
        await refetchBorrowerLoans();

        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Loan request failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContractAsync, refetchBorrowerLoans]
  );

  /**
   * Make a loan payment
   */
  const makePayment = useCallback(
    async (loanId: bigint, amount: string, assetAddress: string) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get token decimals
        const decimalsData = await window.ethereum?.request({
          method: 'eth_call',
          params: [{
            to: assetAddress,
            data: '0x313ce567',
          }, 'latest'],
        });

        const decimals = decimalsData ? parseInt(decimalsData, 16) : 18;
        const amountBN = parseUnits(amount, decimals);

        // 1. Check allowance
        const allowanceData = await window.ethereum?.request({
          method: 'eth_call',
          params: [{
            to: assetAddress,
            data: `0xdd62ed3e${address.slice(2).padStart(64, '0')}${LOAN_MANAGER_ADDRESS.slice(2).padStart(64, '0')}`,
          }, 'latest'],
        });

        const allowance = allowanceData ? BigInt(allowanceData) : BigInt(0);

        // 2. Approve if needed
        if (allowance < amountBN) {
          const approveTx = await window.ethereum?.request({
            method: 'eth_sendTransaction',
            params: [{
              from: address,
              to: assetAddress,
              data: `0x095ea7b3${LOAN_MANAGER_ADDRESS.slice(2).padStart(64, '0')}${amountBN.toString(16).padStart(64, '0')}`,
            }],
          });

          // Wait for approval
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // 3. Make payment
        const hash = await writeContractAsync({
          address: LOAN_MANAGER_ADDRESS,
          abi: LOAN_MANAGER_ABI,
          functionName: 'makePayment',
          args: [loanId, amountBN],
        });

        console.log('Payment transaction hash:', hash);

        // Refetch data
        await Promise.all([refetchLoan(), refetchBorrowerLoans()]);

        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContractAsync, refetchLoan, refetchBorrowerLoans]
  );

  /**
   * Cancel a pending loan
   */
  const cancelLoan = useCallback(
    async (loanId: bigint) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          address: LOAN_MANAGER_ADDRESS,
          abi: LOAN_MANAGER_ABI,
          functionName: 'cancelLoan',
          args: [loanId],
        });

        await refetchBorrowerLoans();

        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cancellation failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, writeContractAsync, refetchBorrowerLoans]
  );

  /**
   * Declare loan default (can be called by anyone after threshold)
   */
  const declarDefault = useCallback(
    async (loanId: bigint) => {
      setIsLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          address: LOAN_MANAGER_ADDRESS,
          abi: LOAN_MANAGER_ABI,
          functionName: 'declarDefault',
          args: [loanId],
        });

        await refetchLoan();

        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Default declaration failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [writeContractAsync, refetchLoan]
  );

  /**
   * Refresh all loan data
   */
  const refresh = useCallback(async () => {
    await Promise.all([refetchLoan(), refetchBorrowerLoans()]);
  }, [refetchLoan, refetchBorrowerLoans]);

  return {
    // Data
    loan: loanDisplay,
    loanData,
    borrowerLoanIds: borrowerLoanIds || [],
    activeLoanCount: activeLoanCount ? Number(activeLoanCount) : 0,
    paymentSchedule,
    isLate: lateStatus?.isLate || false,
    daysLate: lateStatus ? Number(lateStatus.daysLate) : 0,
    isLoading,
    error,

    // Actions
    requestLoan,
    makePayment,
    cancelLoan,
    declarDefault,
    refresh,
  };
}

/**
 * Hook to fetch multiple loans using wagmi's useReadContract
 * This approach uses proper ABI encoding/decoding and better error handling
 */
export function useLoans(loanIds: bigint[]) {
  const [loans, setLoans] = useState<LoanDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 useLoans - loan IDs:', loanIds);

    if (!loanIds || loanIds.length === 0) {
      console.log('📭 No loan IDs provided');
      setLoans([]);
      setIsLoading(false);
      return;
    }

    const fetchAllLoans = async () => {
      setIsLoading(true);
      setError(null);

      console.log(`📊 Fetching ${loanIds.length} loans from contract at ${LOAN_MANAGER_ADDRESS}`);

      try {
        // Use Promise.allSettled to handle individual loan failures gracefully
        const loanPromises = loanIds.map(async (loanId) => {
          console.log(`🔄 Fetching loan ID: ${loanId.toString()}`);

          try {
            // Use viem's readContract for proper ABI handling
            const { createPublicClient, http } = await import('viem');
            const { celoSepolia } = await import('@/config/wagmi');

            const publicClient = createPublicClient({
              chain: celoSepolia,
              transport: http('https://forno.celo-sepolia.celo-testnet.org'),
            });

            const loanData = await publicClient.readContract({
              address: LOAN_MANAGER_ADDRESS,
              abi: LOAN_MANAGER_ABI,
              functionName: 'getLoan',
              args: [loanId],
            }) as Loan;

            console.log(`📥 Raw loan data for loan ${loanId}:`, loanData);

            // Check if loan exists (id should not be 0)
            if (!loanData || loanData.id === 0n) {
              console.warn(`⚠️ Loan ${loanId} does not exist (returned id is 0)`);
              return null;
            }

            console.log(`📄 Valid loan ${loanId}:`, {
              id: loanData.id.toString(),
              borrower: loanData.borrower,
              asset: loanData.asset,
              principal: loanData.principalAmount.toString(),
              status: loanData.status,
            });

            // Format the loan data inline
            const assetAddress = loanData.asset.toLowerCase();
            let assetSymbol = 'cUSD';
            if (assetAddress === '0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f') {
              assetSymbol = 'cEUR';
            } else if (assetAddress === '0xe4d517785d091d3c54818832db6094bcc2744545') {
              assetSymbol = 'cREAL';
            }

            const decimals = 18;
            const principalAmount = Number(formatUnits(loanData.principalAmount, decimals));
            const installmentAmount = Number(formatUnits(loanData.installmentAmount, decimals));
            const totalRepaid = Number(formatUnits(loanData.totalRepaid, decimals));
            const interestPaid = Number(formatUnits(loanData.interestPaid, decimals));
            const interestRate = Number(loanData.interestRate) / 100; // Convert BPS to percentage
            const duration = Number(loanData.duration) / 86400; // Convert seconds to days
            const totalInstallments = Number(loanData.totalInstallments);
            const paidInstallments = Number(loanData.paidInstallments);

            const totalInterest = calculateTotalInterest(
              principalAmount,
              installmentAmount,
              totalInstallments
            );

            const apr = calculateAPR(principalAmount, totalInterest, duration);
            const remainingAmount = principalAmount - totalRepaid;
            const progressPercentage = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;

            const startTime = new Date(Number(loanData.startTime) * 1000);
            const nextPaymentDue = new Date(Number(loanData.nextPaymentDue) * 1000);

            const formattedLoan: LoanDisplay = {
              id: loanData.id.toString(),
              borrower: loanData.borrower,
              asset: loanData.asset,
              assetSymbol,
              principalAmount,
              interestRate,
              duration,
              durationInMonths: daysToMonths(duration),
              frequency: loanData.frequency,
              frequencyLabel: PAYMENT_FREQUENCY_LABELS[loanData.frequency],
              installmentAmount,
              totalInstallments,
              paidInstallments,
              totalRepaid,
              interestPaid,
              startTime,
              nextPaymentDue,
              status: loanData.status,
              statusLabel: LOAN_STATUS_LABELS[loanData.status],
              hasCollateral: loanData.hasCollateral,
              latePaymentCount: Number(loanData.latePaymentCount),
              circleId: loanData.circleId.toString(),
              remainingAmount,
              progressPercentage,
              isLate: false,
              daysLate: 0,
              totalInterest,
              apr,
            };

            console.log(`✅ Successfully formatted loan ${loanId}:`, formattedLoan);

            return formattedLoan;
          } catch (error) {
            console.error(`❌ Error fetching loan ${loanId}:`, error);
            if (error && typeof error === 'object') {
              console.error(`   Error details:`, JSON.stringify(error, null, 2));
            }
            return null;
          }
        });

        const results = await Promise.allSettled(loanPromises);

        const validLoans = results
          .filter((result): result is PromiseFulfilledResult<LoanDisplay | null> =>
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value as LoanDisplay);

        console.log(`📊 Successfully fetched ${validLoans.length} out of ${loanIds.length} loans`);
        if (validLoans.length > 0) {
          console.log('✅ Valid loans:', validLoans);
        }

        // Log any rejections
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`❌ Loan ${loanIds[index]} completely failed:`, result.reason);
          }
        });

        setLoans(validLoans);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Critical error fetching all loans:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch loans';
        setError(errorMessage);
        setLoans([]);
        setIsLoading(false);
      }
    };

    fetchAllLoans();
  }, [loanIds]);

  return { loans, isLoading, error };
}
