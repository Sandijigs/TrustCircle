/**
 * LoanSuccessModal Component
 *
 * Success modal displayed after successful loan request submission
 * Shows loan details and next steps for the user
 */

"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/calculations/loanCalculator";
import { PAYMENT_FREQUENCY_LABELS } from "@/types/loan";

interface LoanSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanDetails: {
    amount: string;
    asset: string;
    assetSymbol: string;
    durationMonths: number;
    frequency: number;
    installmentAmount: number;
    totalInstallments: number;
    interestRate: number;
    totalRepayment: number;
  };
  onViewLoans?: () => void;
}

export function LoanSuccessModal({
  isOpen,
  onClose,
  loanDetails,
  onViewLoans,
}: LoanSuccessModalProps) {
  const handleViewLoans = () => {
    onClose();
    onViewLoans?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnOverlayClick={false}
      closeOnEsc={false}
      showCloseButton={false}
    >
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in-50 duration-300">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Loan Request Submitted!
          </h2>
          <p className="text-gray-600">
            Your loan request has been successfully submitted and is now pending
            approval.
          </p>
        </div>

        {/* Loan Details Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 text-left">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            Loan Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Amount Requested:</span>
              <span className="font-bold text-lg text-blue-600">
                {formatCurrency(Number(loanDetails.amount))} {loanDetails.assetSymbol}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Duration:</span>
              <span className="font-semibold text-gray-900">
                {loanDetails.durationMonths} months
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Payment Frequency:</span>
              <span className="font-semibold text-gray-900">
                {PAYMENT_FREQUENCY_LABELS[loanDetails.frequency]}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Interest Rate:</span>
              <span className="font-semibold text-gray-900">
                {loanDetails.interestRate.toFixed(2)}%
              </span>
            </div>

            <div className="pt-3 border-t border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">
                  {PAYMENT_FREQUENCY_LABELS[loanDetails.frequency]} Payment:
                </span>
                <span className="font-bold text-lg text-gray-900">
                  {formatCurrency(loanDetails.installmentAmount)} {loanDetails.assetSymbol}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600 text-sm">Total Repayment:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(loanDetails.totalRepayment)} {loanDetails.assetSymbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            What Happens Next?
          </h4>
          <ul className="text-sm text-yellow-800 space-y-2 ml-7">
            <li className="flex items-start">
              <span className="font-semibold mr-1">1.</span>
              <span>Your loan request is being reviewed by the circle</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-1">2.</span>
              <span>
                If approved, funds will be disbursed to your wallet
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-1">3.</span>
              <span>
                You can track your loan status in the "My Loans" section
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-1">4.</span>
              <span>
                Make sure to make payments on time to maintain your credit score
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {onViewLoans && (
            <Button
              onClick={handleViewLoans}
              variant="primary"
              className="flex-1"
            >
              View My Loans
            </Button>
          )}
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
