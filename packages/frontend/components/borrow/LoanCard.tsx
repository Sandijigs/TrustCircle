/**
 * LoanCard Component
 * 
 * Displays a summary card for a loan
 */

'use client';

import { LoanDisplay, LoanStatus } from '@/types/loan';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercentage } from '@/lib/calculations/loanCalculator';

interface LoanCardProps {
  loan: LoanDisplay;
  onViewDetails?: () => void;
  onMakePayment?: () => void;
}

export function LoanCard({ loan, onViewDetails, onMakePayment }: LoanCardProps) {
  const getStatusColor = (status: LoanStatus): string => {
    switch (status) {
      case LoanStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case LoanStatus.Approved:
        return 'bg-blue-100 text-blue-800';
      case LoanStatus.Active:
        return 'bg-green-100 text-green-800';
      case LoanStatus.Completed:
        return 'bg-gray-100 text-gray-800';
      case LoanStatus.Defaulted:
        return 'bg-red-100 text-red-800';
      case LoanStatus.Cancelled:
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isActive = loan.status === LoanStatus.Active;
  const showPaymentButton = isActive && loan.paidInstallments < loan.totalInstallments;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">
            {formatCurrency(loan.principalAmount)} {loan.assetSymbol}
          </h3>
          <p className="text-sm text-gray-500">Loan #{loan.id}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            loan.status
          )}`}
        >
          {loan.statusLabel}
        </span>
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Repayment Progress</span>
            <span className="font-semibold">{formatPercentage(loan.progressPercentage, 0)}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
              style={{ width: `${loan.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>
              {loan.paidInstallments}/{loan.totalInstallments} payments made
            </span>
            <span>{formatCurrency(loan.remainingAmount)} remaining</span>
          </div>
        </div>
      )}

      {/* Loan Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Interest Rate</p>
          <p className="font-semibold">{formatPercentage(loan.interestRate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Duration</p>
          <p className="font-semibold">{loan.durationInMonths} months</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Payment Frequency</p>
          <p className="font-semibold">{loan.frequencyLabel}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Installment</p>
          <p className="font-semibold">{formatCurrency(loan.installmentAmount)}</p>
        </div>
      </div>

      {/* Next Payment Due (Active Loans) */}
      {isActive && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            loan.isLate ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Next Payment Due</p>
              <p className="font-semibold">
                {loan.nextPaymentDue.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {loan.isLate && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  {loan.daysLate} days overdue
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Amount Due</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(loan.installmentAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Late Payment Warning */}
      {loan.isLate && loan.latePaymentCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
          <p className="text-xs text-yellow-800">
            ⚠️ You have {loan.latePaymentCount} late payment(s). This affects your credit score.
          </p>
        </div>
      )}

      {/* Collateral Badge */}
      {loan.hasCollateral && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            🔒 Secured Loan
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {showPaymentButton && (
          <Button onClick={onMakePayment} className="flex-1" variant="primary">
            Make Payment
          </Button>
        )}
        <Button onClick={onViewDetails} variant="secondary" className={showPaymentButton ? '' : 'flex-1'}>
          View Details
        </Button>
      </div>

      {/* Completed Loan Summary */}
      {loan.status === LoanStatus.Completed && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Repaid:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(loan.totalRepaid)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Total Interest Paid:</span>
            <span className="font-semibold">{formatCurrency(loan.interestPaid)}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
