/**
 * LoanDetails Component
 *
 * Comprehensive loan details page showing:
 * - Loan overview and status
 * - Repayment progress
 * - Payment schedule
 * - Payment history
 * - Quick actions
 */

"use client";

import { useState } from "react";
import { LoanDisplay, LoanStatus } from "@/types/loan";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RepaymentSchedule } from "./RepaymentSchedule";
import { MakePayment } from "./MakePayment";
import { useLoan } from "@/hooks/useLoan";
import {
  formatCurrency,
  formatPercentage,
} from "@/lib/calculations/loanCalculator";

interface LoanDetailsProps {
  loanId: string;
}

export function LoanDetails({ loanId }: LoanDetailsProps) {
  const { loan, paymentSchedule, isLate, daysLate, refresh } = useLoan(
    BigInt(loanId)
  );
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "schedule" | "history"
  >("overview");

  if (!loan) {
    return (
      <Card className="p-8">
        <p className="text-center text-gray-500">Loading loan details...</p>
      </Card>
    );
  }

  if (showPayment) {
    return (
      <div>
        <div className="mb-6">
          <Button variant="secondary" onClick={() => setShowPayment(false)}>
            ← Back to Loan Details
          </Button>
        </div>
        <MakePayment
          loan={loan}
          onSuccess={() => {
            setShowPayment(false);
            refresh();
          }}
          onCancel={() => setShowPayment(false)}
        />
      </div>
    );
  }

  const isActive = loan.status === LoanStatus.Active;
  const isCompleted = loan.status === LoanStatus.Completed;
  const isDefaulted = loan.status === LoanStatus.Defaulted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {formatCurrency(loan.principalAmount)} {loan.assetSymbol} Loan
          </h1>
          <p className="text-gray-600">Loan ID: #{loan.id}</p>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <Button onClick={() => setShowPayment(true)} size="lg">
              Make Payment
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {isLate && (
        <Card className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="font-semibold text-red-800">Payment Overdue</h4>
              <p className="text-sm text-red-700">
                Your payment is {daysLate} days late. Please make a payment as
                soon as possible to avoid default.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isCompleted && (
        <Card className="p-4 bg-green-50 border-2 border-green-200">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✓</span>
            <div>
              <h4 className="font-semibold text-green-800">Loan Completed</h4>
              <p className="text-sm text-green-700">
                Congratulations! You've successfully repaid this loan. Your
                credit score has been improved.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isDefaulted && (
        <Card className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex items-start">
            <span className="text-2xl mr-3">✕</span>
            <div>
              <h4 className="font-semibold text-red-800">Loan Defaulted</h4>
              <p className="text-sm text-red-700">
                This loan has been marked as defaulted. Your collateral (if any)
                has been liquidated, and your credit score has been
                significantly reduced.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Principal Amount</p>
          <p className="text-2xl font-bold">
            {formatCurrency(loan.principalAmount)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Repaid</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(loan.totalRepaid)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Remaining Balance</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(loan.remainingAmount)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Interest Paid</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(loan.interestPaid)}
          </p>
        </Card>
      </div>

      {/* Progress Bar */}
      {isActive && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Repayment Progress</h3>
            <span className="text-sm text-gray-600">
              {loan.paidInstallments}/{loan.totalInstallments} payments
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all"
              style={{ width: `${loan.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatPercentage(loan.progressPercentage, 0)} Complete</span>
            <span>{formatCurrency(loan.remainingAmount)} Remaining</span>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Card className="overflow-hidden">
        <div className="border-b">
          <div className="flex">
            {[
              { key: "overview", label: "Overview" },
              { key: "schedule", label: "Payment Schedule" },
              { key: "history", label: "Payment History" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Loan Terms */}
              <div className="text-gray-60">
                <h3 className="text-lg font-semibold mb-4">Loan Terms</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate (APR)</p>
                    <p className="font-semibold">
                      {formatPercentage(loan.interestRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loan Duration</p>
                    <p className="font-semibold">
                      {loan.durationInMonths} months
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Frequency</p>
                    <p className="font-semibold">{loan.frequencyLabel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Installment Amount</p>
                    <p className="font-semibold">
                      {formatCurrency(loan.installmentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Interest</p>
                    <p className="font-semibold">
                      {formatCurrency(loan.totalInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Effective APR</p>
                    <p className="font-semibold">
                      {formatPercentage(loan.apr)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Important Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Loan Start Date</p>
                    <p className="font-semibold">
                      {loan.startTime.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {isActive && (
                    <div>
                      <p className="text-sm text-gray-600">Next Payment Due</p>
                      <p className="font-semibold">
                        {loan.nextPaymentDue.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Additional Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Collateral Status</span>
                    <span className="font-semibold">
                      {loan.hasCollateral ? "🔒 Secured" : "📄 Unsecured"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Late Payments</span>
                    <span className="font-semibold">
                      {loan.latePaymentCount > 0 ? (
                        <span className="text-red-600">
                          {loan.latePaymentCount}
                        </span>
                      ) : (
                        <span className="text-green-600">None</span>
                      )}
                    </span>
                  </div>
                  {loan.circleId !== "0" && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Lending Circle</span>
                      <span className="font-semibold">
                        Circle #{loan.circleId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Loan Status</span>
                    <span className="font-semibold">{loan.statusLabel}</span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="text-lg font-semibold mb-4">
                  Financial Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Original Principal:</span>
                    <span className="font-semibold">
                      {formatCurrency(loan.principalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Interest:</span>
                    <span className="font-semibold">
                      {formatCurrency(loan.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600">Total to Repay:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        loan.principalAmount + loan.totalInterest
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="font-semibold">Amount Repaid:</span>
                    <span className="font-semibold">
                      {formatCurrency(loan.totalRepaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600 pt-2 border-t">
                    <span className="font-semibold">Amount Remaining:</span>
                    <span className="font-semibold">
                      {formatCurrency(loan.remainingAmount)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <RepaymentSchedule
              schedule={paymentSchedule}
              assetSymbol={loan.assetSymbol}
            />
          )}

          {/* Payment History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment History</h3>
              <div className="space-y-3">
                {paymentSchedule
                  .filter((item) => item.isPaid)
                  .map((item) => (
                    <Card
                      key={item.installmentNumber}
                      className="p-4 bg-green-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            Payment #{item.installmentNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.dueDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(item.totalAmount)}
                          </p>
                          <p className="text-xs text-gray-600">
                            Principal: {formatCurrency(item.principalAmount)} |
                            Interest: {formatCurrency(item.interestAmount)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}

                {paymentSchedule.filter((item) => item.isPaid).length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-gray-500">No payments made yet</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
