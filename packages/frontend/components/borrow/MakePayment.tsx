/**
 * MakePayment Component
 * 
 * Interface for making loan payments
 * Supports partial payments, full payments, and early payoff
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/forms/CurrencyInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoanDisplay } from '@/types/loan';
import { useLoan } from '@/hooks/useLoan';
import {
  formatCurrency,
  calculateLatePaymentPenalty,
  calculateEarlyPayoffAmount,
} from '@/lib/calculations/loanCalculator';

interface MakePaymentProps {
  loan: LoanDisplay;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MakePayment({ loan, onSuccess, onCancel }: MakePaymentProps) {
  const { address } = useAccount();
  const { makePayment, isLoading } = useLoan();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'installment' | 'full' | 'custom'>('installment');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate amounts
  const latePaymentPenalty = loan.isLate
    ? calculateLatePaymentPenalty(loan.installmentAmount, loan.daysLate)
    : 0;

  const installmentDue = loan.installmentAmount + latePaymentPenalty;

  const remainingPayments = loan.totalInstallments - loan.paidInstallments;
  const earlyPayoffAmount = calculateEarlyPayoffAmount(
    loan.principalAmount,
    loan.paidInstallments,
    loan.totalInstallments,
    loan.installmentAmount,
    0.5 // 50% interest discount
  );

  // Set payment amount based on type
  useEffect(() => {
    switch (paymentType) {
      case 'installment':
        setPaymentAmount(installmentDue.toFixed(2));
        break;
      case 'full':
        setPaymentAmount(earlyPayoffAmount.toFixed(2));
        break;
      case 'custom':
        setPaymentAmount('');
        break;
    }
  }, [paymentType, installmentDue, earlyPayoffAmount]);

  const handlePayment = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    const amount = Number(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (amount < installmentDue && paymentType === 'installment') {
      setError(`Minimum payment is ${formatCurrency(installmentDue)}`);
      return;
    }

    setError(null);

    try {
      await makePayment(BigInt(loan.id), paymentAmount, loan.asset);
      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  if (success) {
    return (
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">
          Your payment of {formatCurrency(Number(paymentAmount))} {loan.assetSymbol} has been
          processed.
        </p>
        {paymentType === 'full' && (
          <p className="text-green-600 font-semibold mt-2">
            🎉 Congratulations! Your loan has been fully repaid.
          </p>
        )}
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Loan Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-semibold mb-4">Loan #{loan.id}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Original Amount</p>
            <p className="font-semibold">{formatCurrency(loan.principalAmount)}</p>
          </div>
          <div>
            <p className="text-gray-600">Remaining Balance</p>
            <p className="font-semibold">{formatCurrency(loan.remainingAmount)}</p>
          </div>
          <div>
            <p className="text-gray-600">Payments Made</p>
            <p className="font-semibold">
              {loan.paidInstallments}/{loan.totalInstallments}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Repaid</p>
            <p className="font-semibold">{formatCurrency(loan.totalRepaid)}</p>
          </div>
        </div>
      </Card>

      {/* Late Payment Warning */}
      {loan.isLate && (
        <Card className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="font-semibold text-red-800">Payment Overdue</h4>
              <p className="text-sm text-red-700">
                Your payment is {loan.daysLate} days late. A late fee of{' '}
                <strong>{formatCurrency(latePaymentPenalty)}</strong> has been applied.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Options */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Select Payment Option</h3>

        <div className="space-y-3">
          {/* Regular Installment */}
          <button
            type="button"
            onClick={() => setPaymentType('installment')}
            className={`w-full p-4 border-2 rounded-lg text-left transition ${
              paymentType === 'installment'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={paymentType === 'installment'}
                    onChange={() => setPaymentType('installment')}
                    className="mr-3"
                  />
                  <div>
                    <h4 className="font-semibold">Regular Installment</h4>
                    <p className="text-sm text-gray-600">
                      Pay your scheduled {loan.frequencyLabel.toLowerCase()} payment
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(installmentDue)}
                </p>
                {loan.isLate && (
                  <p className="text-xs text-red-600">Includes late fee</p>
                )}
              </div>
            </div>
          </button>

          {/* Full Payoff */}
          <button
            type="button"
            onClick={() => setPaymentType('full')}
            className={`w-full p-4 border-2 rounded-lg text-left transition ${
              paymentType === 'full'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={paymentType === 'full'}
                    onChange={() => setPaymentType('full')}
                    className="mr-3"
                  />
                  <div>
                    <h4 className="font-semibold">Pay Off Early</h4>
                    <p className="text-sm text-gray-600">
                      Pay remaining balance with 50% interest discount
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(earlyPayoffAmount)}
                </p>
                <p className="text-xs text-green-600">Save on interest</p>
              </div>
            </div>
          </button>

          {/* Custom Amount */}
          <button
            type="button"
            onClick={() => setPaymentType('custom')}
            className={`w-full p-4 border-2 rounded-lg text-left transition ${
              paymentType === 'custom'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center">
              <input
                type="radio"
                checked={paymentType === 'custom'}
                onChange={() => setPaymentType('custom')}
                className="mr-3"
              />
              <div>
                <h4 className="font-semibold">Custom Amount</h4>
                <p className="text-sm text-gray-600">Pay a different amount (min: installment due)</p>
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* Payment Amount */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Payment Amount</h3>

        <CurrencyInput
          value={paymentAmount}
          onChange={setPaymentAmount}
          symbol={loan.assetSymbol}
          disabled={paymentType !== 'custom'}
          error={error}
        />

        {paymentType === 'custom' && (
          <p className="mt-2 text-sm text-gray-600">
            Minimum payment: {formatCurrency(installmentDue)}
          </p>
        )}

        {/* Payment Breakdown */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
          <h4 className="font-semibold mb-3">Payment Breakdown</h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Amount:</span>
            <span className="font-semibold">
              {formatCurrency(Number(paymentAmount) || 0)}
            </span>
          </div>
          {loan.isLate && (
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Late Payment Fee:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(latePaymentPenalty)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining After Payment:</span>
            <span className="font-semibold">
              {formatCurrency(Math.max(0, loan.remainingAmount - (Number(paymentAmount) || 0)))}
            </span>
          </div>
          {paymentType === 'full' && (
            <div className="flex justify-between text-sm text-green-600 pt-2 border-t">
              <span className="font-semibold">Interest Saved:</span>
              <span className="font-semibold">
                {formatCurrency(
                  loan.installmentAmount * remainingPayments - earlyPayoffAmount
                )}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button onClick={handlePayment} className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Processing...</span>
            </>
          ) : (
            `Pay ${formatCurrency(Number(paymentAmount) || 0)}`
          )}
        </Button>
      </div>

      {/* Important Notes */}
      <Card className="p-4 bg-blue-50">
        <h4 className="font-semibold mb-2 text-sm">💡 Payment Notes</h4>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          <li>Payments are processed immediately on the blockchain</li>
          <li>Your credit score will be updated after payment confirmation</li>
          <li>On-time payments boost your credit score by +5 points</li>
          <li>Early payoff saves you 50% of remaining interest</li>
          <li>You can make multiple payments before the due date</li>
        </ul>
      </Card>
    </div>
  );
}
