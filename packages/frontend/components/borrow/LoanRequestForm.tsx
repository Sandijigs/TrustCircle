/**
 * LoanRequestForm Component
 * 
 * Multi-step wizard for requesting a loan:
 * Step 1: Amount and Purpose
 * Step 2: Terms Selection  
 * Step 3: Collateral (Optional)
 * Step 4: Review and Submit
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/Input';
import { CurrencyInput } from '@/components/forms/CurrencyInput';
import { Select } from '@/components/forms/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLoan } from '@/hooks/useLoan';
import { useCreditScore } from '@/hooks/useCreditScore';
import {
  PaymentFrequency,
  PAYMENT_FREQUENCY_LABELS,
  MIN_LOAN_AMOUNT,
  MAX_LOAN_AMOUNT,
  MIN_DURATION_DAYS,
  MAX_DURATION_DAYS,
} from '@/types/loan';
import {
  calculateInstallments,
  calculateTotalInterest,
  calculateAPR,
  calculateInterestRate,
  calculateMaxLoanAmount,
  monthsToDays,
  daysToMonths,
  formatCurrency,
  formatBPS,
} from '@/lib/calculations/loanCalculator';

const STABLECOINS = [
  { value: process.env.NEXT_PUBLIC_CUSD_ADDRESS || '', label: 'cUSD', symbol: 'cUSD' },
  { value: process.env.NEXT_PUBLIC_CEUR_ADDRESS || '', label: 'cEUR', symbol: 'cEUR' },
  { value: process.env.NEXT_PUBLIC_CREAL_ADDRESS || '', label: 'cREAL', symbol: 'cREAL' },
];

const LOAN_PURPOSES = [
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'home', label: 'Home Improvement' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

interface LoanRequestFormProps {
  circleId?: bigint;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LoanRequestForm({ circleId = BigInt(0), onSuccess, onCancel }: LoanRequestFormProps) {
  const { address } = useAccount();
  const { requestLoan, isLoading } = useLoan();
  const { creditScore, isLoading: creditLoading } = useCreditScore(address);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    asset: STABLECOINS[0].value,
    amount: '',
    purpose: 'other',
    durationMonths: 6,
    frequency: PaymentFrequency.Monthly,
    hasCollateral: false,
    collateralType: '',
    collateralAmount: '',
  });

  const [calculatedTerms, setCalculatedTerms] = useState({
    interestRate: 0,
    installmentAmount: 0,
    totalInstallments: 0,
    totalInterest: 0,
    totalPayment: 0,
    apr: 0,
    maxLoanAmount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate loan terms whenever amount, duration, or frequency changes
  useEffect(() => {
    if (!formData.amount || isNaN(Number(formData.amount))) return;

    const amount = Number(formData.amount);
    const durationDays = monthsToDays(formData.durationMonths);
    const score = creditScore || 500;

    const interestRateBPS = calculateInterestRate(score, formData.hasCollateral);
    const maxAmount = calculateMaxLoanAmount(score);

    const { totalInstallments, installmentAmount } = calculateInstallments(
      amount,
      interestRateBPS,
      durationDays,
      formData.frequency
    );

    const totalInterest = calculateTotalInterest(amount, installmentAmount, totalInstallments);
    const totalPayment = amount + totalInterest;
    const apr = calculateAPR(amount, totalInterest, durationDays);

    setCalculatedTerms({
      interestRate: interestRateBPS / 100,
      installmentAmount,
      totalInstallments,
      totalInterest,
      totalPayment,
      apr,
      maxLoanAmount: maxAmount,
    });
  }, [formData.amount, formData.durationMonths, formData.frequency, formData.hasCollateral, creditScore]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      const amount = Number(formData.amount);
      if (!formData.amount || isNaN(amount)) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (amount < MIN_LOAN_AMOUNT) {
        newErrors.amount = `Minimum loan amount is ${formatCurrency(MIN_LOAN_AMOUNT)}`;
      } else if (amount > MAX_LOAN_AMOUNT) {
        newErrors.amount = `Maximum loan amount is ${formatCurrency(MAX_LOAN_AMOUNT)}`;
      } else if (amount > calculatedTerms.maxLoanAmount) {
        newErrors.amount = `Your credit score allows up to ${formatCurrency(calculatedTerms.maxLoanAmount)}`;
      }

      if (!formData.purpose) {
        newErrors.purpose = 'Please select a purpose';
      }
    }

    if (currentStep === 2) {
      if (formData.durationMonths < daysToMonths(MIN_DURATION_DAYS)) {
        newErrors.duration = `Minimum duration is ${daysToMonths(MIN_DURATION_DAYS)} months`;
      } else if (formData.durationMonths > daysToMonths(MAX_DURATION_DAYS)) {
        newErrors.duration = `Maximum duration is ${daysToMonths(MAX_DURATION_DAYS)} months`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    try {
      await requestLoan({
        asset: formData.asset,
        amount: formData.amount,
        duration: monthsToDays(formData.durationMonths),
        frequency: formData.frequency,
        circleId,
      });

      onSuccess?.();
    } catch (err) {
      console.error('Loan request failed:', err);
      setErrors({ submit: err instanceof Error ? err.message : 'Request failed' });
    }
  };

  const selectedStablecoin = STABLECOINS.find(s => s.value === formData.asset);

  if (creditLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading credit score...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Amount</span>
          <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Terms</span>
          <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Collateral</span>
          <span className={step >= 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Review</span>
        </div>
      </div>

      <Card className="p-6">
        {/* Step 1: Amount and Purpose */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Loan Amount & Purpose</h2>
              <p className="text-gray-600">How much do you need to borrow?</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Currency</label>
              <Select
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                options={STABLECOINS}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Loan Amount</label>
              <CurrencyInput
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                symbol={selectedStablecoin?.symbol || 'USD'}
                error={errors.amount}
              />
              <p className="mt-1 text-sm text-gray-500">
                Your credit score allows up to {formatCurrency(calculatedTerms.maxLoanAmount)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Loan Purpose</label>
              <Select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                options={LOAN_PURPOSES}
              />
              {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>}
            </div>

            {/* Credit Score Display */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Credit Score</p>
                  <p className="text-2xl font-bold text-blue-600">{creditScore || 500}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Interest Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatBPS(calculateInterestRate(creditScore || 500, formData.hasCollateral))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Terms Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Loan Terms</h2>
              <p className="text-gray-600">Choose your repayment schedule</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Loan Duration: {formData.durationMonths} months
              </label>
              <input
                type="range"
                min={daysToMonths(MIN_DURATION_DAYS)}
                max={daysToMonths(MAX_DURATION_DAYS)}
                value={formData.durationMonths}
                onChange={(e) =>
                  setFormData({ ...formData, durationMonths: Number(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 month</span>
                <span>12 months</span>
              </div>
              {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Frequency</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, frequency: Number(key) as PaymentFrequency })
                    }
                    className={`p-4 border-2 rounded-lg text-center transition ${
                      formData.frequency === Number(key)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold mb-3">Loan Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Principal Amount:</span>
                <span className="font-semibold">{formatCurrency(Number(formData.amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Interest:</span>
                <span className="font-semibold">{formatCurrency(calculatedTerms.totalInterest)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Repayment:</span>
                <span className="font-semibold">{formatCurrency(calculatedTerms.totalPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Number of Installments:</span>
                <span className="font-semibold">{calculatedTerms.totalInstallments}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Installment Amount:</span>
                <span className="font-bold text-lg text-blue-600">
                  {formatCurrency(calculatedTerms.installmentAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">APR:</span>
                <span className="font-semibold">{calculatedTerms.apr.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Collateral */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Collateral (Optional)</h2>
              <p className="text-gray-600">
                Adding collateral can reduce your interest rate by 2%
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasCollateral"
                  checked={formData.hasCollateral}
                  onChange={(e) =>
                    setFormData({ ...formData, hasCollateral: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600"
                />
                <label htmlFor="hasCollateral" className="ml-3">
                  <span className="font-semibold">Add collateral to my loan</span>
                  <p className="text-sm text-gray-600">
                    Reduce interest rate from {formatBPS(calculateInterestRate(creditScore || 500, false))} to{' '}
                    {formatBPS(calculateInterestRate(creditScore || 500, true))}
                  </p>
                </label>
              </div>
            </div>

            {formData.hasCollateral && (
              <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Collateral management will be available in the next step. You'll be able to
                  deposit ERC20 tokens or NFTs after loan approval.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review and Submit */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Review Your Loan</h2>
              <p className="text-gray-600">Please review all details before submitting</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="font-semibold">{formatCurrency(Number(formData.amount))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Currency</p>
                    <p className="font-semibold">{selectedStablecoin?.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{formData.durationMonths} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Frequency</p>
                    <p className="font-semibold">
                      {PAYMENT_FREQUENCY_LABELS[formData.frequency]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purpose</p>
                    <p className="font-semibold capitalize">{formData.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Collateral</p>
                    <p className="font-semibold">{formData.hasCollateral ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg mb-4">Repayment Terms</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interest Rate (APR):</span>
                    <span className="font-semibold">{calculatedTerms.interestRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-semibold">{formatCurrency(calculatedTerms.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Repayment:</span>
                    <span className="font-semibold">{formatCurrency(calculatedTerms.totalPayment)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600 font-semibold">
                      {PAYMENT_FREQUENCY_LABELS[formData.frequency]} Payment:
                    </span>
                    <span className="font-bold text-xl text-blue-600">
                      {formatCurrency(calculatedTerms.installmentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number of Payments:</span>
                    <span className="font-semibold">{calculatedTerms.totalInstallments}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Late payments incur a 2% penalty per week</li>
                <li>Grace period: 7 days after due date</li>
                <li>Default threshold: 30 days past due</li>
                <li>Your credit score will be affected by payment history</li>
                {creditScore && creditScore >= 800 && (
                  <li className="text-green-700 font-semibold">
                    ✓ Your loan will be auto-approved due to excellent credit score
                  </li>
                )}
              </ul>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <div>
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={handleNext} disabled={isLoading}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  'Submit Loan Request'
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
