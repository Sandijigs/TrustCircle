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
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
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
  const { data: loanData, refetch: refetchLoan } = useContractRead({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'getLoan',
    args: loanId ? [loanId] : undefined,
    enabled: !!loanId,
    watch: true,
  }) as { data: Loan | undefined; refetch: () => void };

  // Read all borrower's loans
  const { data: borrowerLoanIds, refetch: refetchBorrowerLoans } = useContractRead({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'getBorrowerLoans',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  }) as { data: bigint[] | undefined; refetch: () => void };

  // Read active loan count
  const { data: activeLoanCount } = useContractRead({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'activeLoanCount',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Read payment late status
  const { data: lateStatus } = useContractRead({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'isPaymentLate',
    args: loanId ? [loanId] : undefined,
    enabled: !!loanId,
    watch: true,
  }) as { data: { isLate: boolean; daysLate: bigint } | undefined };

  // Contract write functions
  const { writeAsync: requestLoanWrite } = useContractWrite({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'requestLoan',
  });

  const { writeAsync: makePaymentWrite } = useContractWrite({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'makePayment',
  });

  const { writeAsync: cancelLoanWrite } = useContractWrite({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'cancelLoan',
  });

  const { writeAsync: declarDefaultWrite } = useContractWrite({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'declarDefault',
  });

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
        const tx = await requestLoanWrite({
          args: [
            params.asset as `0x${string}`,
            amountBN,
            durationSeconds,
            params.frequency,
            params.circleId,
          ],
        });

        // Wait for transaction
        await tx.wait();

        // Refetch data
        await refetchBorrowerLoans();

        return tx;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Loan request failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, requestLoanWrite, refetchBorrowerLoans]
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
        const tx = await makePaymentWrite({
          args: [loanId, amountBN],
        });

        await tx.wait();

        // Refetch data
        await Promise.all([refetchLoan(), refetchBorrowerLoans()]);

        return tx;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, LOAN_MANAGER_ADDRESS, makePaymentWrite, refetchLoan, refetchBorrowerLoans]
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
        const tx = await cancelLoanWrite({
          args: [loanId],
        });

        await tx.wait();
        await refetchBorrowerLoans();

        return tx;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cancellation failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, cancelLoanWrite, refetchBorrowerLoans]
  );

  /**
   * Declare loan default (can be called by anyone after threshold)
   */
  const declarDefault = useCallback(
    async (loanId: bigint) => {
      setIsLoading(true);
      setError(null);

      try {
        const tx = await declarDefaultWrite({
          args: [loanId],
        });

        await tx.wait();
        await refetchLoan();

        return tx;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Default declaration failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [declarDefaultWrite, refetchLoan]
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
 * Hook to fetch multiple loans
 */
export function useLoans(loanIds: bigint[]) {
  const [loans, setLoans] = useState<LoanDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const LOAN_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_LOAN_MANAGER_ADDRESS as `0x${string}`;

  useEffect(() => {
    const fetchLoans = async () => {
      if (loanIds.length === 0) {
        setLoans([]);
        return;
      }

      setIsLoading(true);

      try {
        const loanPromises = loanIds.map(async (loanId) => {
          const data = await window.ethereum?.request({
            method: 'eth_call',
            params: [{
              to: LOAN_MANAGER_ADDRESS,
              data: `0xc92aecc4${loanId.toString(16).padStart(64, '0')}`, // getLoan(uint256)
            }, 'latest'],
          });

          // Parse loan data (simplified - would need proper ABI decoding)
          // In production, use viem's decodeFunctionResult
          return data;
        });

        await Promise.all(loanPromises);
        // Would decode and set loans here
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching loans:', err);
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [loanIds, LOAN_MANAGER_ADDRESS]);

  return { loans, isLoading };
}
