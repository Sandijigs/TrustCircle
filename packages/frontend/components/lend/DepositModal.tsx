/**
 * DepositModal Component
 *
 * Modal for depositing stablecoins into lending pool
 * Shows projected earnings and APY
 */

"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/ui";
import { useLendingPool } from "@/hooks/useLendingPoolSimple";
import {
  useAccount,
  useContractRead,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import {
  calculateProjectedEarnings,
  formatAPY,
  formatCurrency,
} from "@/lib/calculations/interestRates";
import { ERC20_ABI } from "@/config/tokens";
import { LENDING_POOL } from "@/config/contracts";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetAddress: string;
  assetSymbol: "cUSD" | "cEUR" | "cREAL";
  onSuccess?: () => void;
}

export function DepositModal({
  isOpen,
  onClose,
  assetAddress,
  assetSymbol,
  onSuccess,
}: DepositModalProps) {
  const { address } = useAccount();
  const { poolStats, isLoading } = useLendingPool(assetAddress);

  // Query user's token balance
  const { data: balanceData } = useContractRead({
    address: assetAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  const userBalance = balanceData
    ? Number(formatUnits(balanceData as bigint, 18))
    : 0;

  console.log("💰 User balance in modal:", userBalance, assetSymbol);

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [depositedAmount, setDepositedAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [projectedEarnings, setProjectedEarnings] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  } | null>(null);

  // Write contract hook for transactions
  const { writeContractAsync } = useWriteContract();
  
  // Track transaction hashes for waiting
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}` | undefined>();
  
  // Wait for approve transaction
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });
  
  // Wait for deposit transaction
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  // Calculate projected earnings when amount changes
  useEffect(() => {
    if (amount && poolStats) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum) && amountNum > 0) {
        const earnings = calculateProjectedEarnings(
          amountNum,
          poolStats.lenderAPY
        );
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
      setError("Please enter a valid amount");
      return;
    }

    if (amountNum < 1) {
      setError("Minimum deposit is 1 token");
      return;
    }

    if (amountNum > userBalance) {
      setError("Insufficient balance");
      return;
    }

    try {
      const amountWei = parseUnits(amount, 18);
      console.log("🚀 Starting deposit:", amount, assetSymbol);

      // Step 1: Approve token spending
      setIsApproving(true);
      setError(null);
      console.log("📝 Approving token spend...");
      
      const approveHash = await writeContractAsync({
        address: assetAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [LENDING_POOL.address as `0x${string}`, amountWei],
      });
      
      console.log("✅ Approval transaction sent:", approveHash);
      console.log("⏳ Waiting for approval to be mined (this takes ~10-15 seconds)...");
      
      setApproveTxHash(approveHash);
      
      // Wait for approval to be mined (Celo testnet blocks are ~5 seconds)
      // We'll wait 15 seconds to be safe
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`⏳ Waiting... ${i + 1}/15 seconds`);
      }
      
      console.log("✅ Approval should be confirmed!");
      setIsApproving(false);

      // Step 2: Deposit to pool
      setIsDepositing(true);
      console.log("💰 Depositing to pool...");
      
      const depositHash = await writeContractAsync({
        address: LENDING_POOL.address as `0x${string}`,
        abi: LENDING_POOL.abi,
        functionName: "deposit",
        args: [assetAddress as `0x${string}`, amountWei],
      });
      
      console.log("✅ Deposit transaction sent:", depositHash);
      console.log("⏳ Waiting for deposit to be mined (this takes ~10-15 seconds)...");
      
      setDepositTxHash(depositHash);
      
      // Wait for deposit to be mined
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`⏳ Waiting... ${i + 1}/15 seconds`);
      }
      
      console.log("✅ Deposit should be confirmed!");
      setIsDepositing(false);

      // Success! Show success modal
      setDepositedAmount(amount);
      setTxHash(depositHash);
      setShowSuccess(true);
      setAmount("");
      setApproveTxHash(undefined);
      setDepositTxHash(undefined);
      onSuccess?.();
    } catch (err: any) {
      console.error("❌ Deposit error:", err);
      setIsApproving(false);
      setIsDepositing(false);

      // User-friendly error messages
      if (err.message?.includes("User rejected") || err.message?.includes("User denied")) {
        setError("Transaction cancelled");
      } else if (err.message?.includes("insufficient funds")) {
        setError("Insufficient gas funds");
      } else {
        setError(err.shortMessage || err.message || "Deposit failed");
      }
    }
  };

  const handleMaxClick = () => {
    setAmount(userBalance.toString());
  };

  const handleReset = () => {
    setAmount("");
    setError(null);
    setProjectedEarnings(null);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setDepositedAmount("");
    setTxHash("");
    onClose();
  };

  // Success Modal
  if (showSuccess) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleSuccessClose}
        title="Deposit Successful!"
        size="md"
      >
        <div className="space-y-6 p-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Deposit Successful!
            </h3>
            <p className="text-gray-600">
              You have successfully deposited <span className="font-semibold text-gray-900">{depositedAmount} {assetSymbol}</span> into the lending pool.
            </p>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">{depositedAmount} {assetSymbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transaction:</span>
              <a 
                href={`https://celo-testnet.blockscout.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View on Explorer →
              </a>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              🎉 Your deposit is now earning interest! You can view your earnings and withdraw anytime from the lending page.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleSuccessClose}
            variant="primary"
            fullWidth
          >
            Back to Lending
          </Button>
        </div>
      </Modal>
    );
  }

  // Deposit Form Modal
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
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current APY
                </p>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400">
                  {formatAPY(poolStats.lenderAPY)}
                </p>
              </div>
              <svg
                className="w-12 h-12 text-success-600 dark:text-success-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Deposit Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deposit Amount
          </label>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
              $
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500  text-gray-700 text-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleMaxClick}
                className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded"
              >
                MAX
              </button>
              <span className="px-2 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded">
                {assetSymbol}
              </span>
            </div>
          </div>

          <p className="mt-1.5 text-sm text-gray-600">
            Available: {formatCurrency(userBalance, "USD")} {assetSymbol}
          </p>
        </div>

        {/* Projected Earnings */}
        {projectedEarnings && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Projected Earnings
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Daily
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  +{formatCurrency(projectedEarnings.daily, "USD")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Weekly
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  +{formatCurrency(projectedEarnings.weekly, "USD")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Monthly
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  +{formatCurrency(projectedEarnings.monthly, "USD")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Yearly
                </p>
                <p className="text-lg font-semibold text-success-600 dark:text-success-400">
                  +{formatCurrency(projectedEarnings.yearly, "USD")}
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
                <p className="text-gray-600 dark:text-gray-400">
                  Pool Utilization
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {poolStats.utilization.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Available Liquidity
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(poolStats.availableLiquidity, "USD")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-2 text-sm">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
            loading={isApproving || isDepositing}
            disabled={
              !amount || parseFloat(amount) <= 0 || isApproving || isDepositing
            }
            fullWidth
          >
            {isApproving
              ? "Approving..."
              : isDepositing
              ? "Depositing..."
              : "Deposit"}
          </Button>
        </div>

        {/* Transaction Info */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
          This transaction requires two signatures: one to approve tokens, one
          to deposit
        </p>
      </div>
    </Modal>
  );
}
