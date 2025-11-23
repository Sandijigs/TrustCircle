/**
 * MyLoans Component
 *
 * Displays all loans for the connected borrower
 * Includes filters for active, pending, completed, and defaulted loans
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { LoanCard } from "./LoanCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLoan, useLoans } from "@/hooks/useLoan";
import { LoanStatus, LoanDisplay } from "@/types/loan";
import { formatCurrency } from "@/lib/calculations/loanCalculator";

type LoanFilter = "all" | "active" | "pending" | "completed" | "defaulted";

interface MyLoansProps {
  onRequestLoan?: () => void;
}

export function MyLoans({ onRequestLoan }: MyLoansProps) {
  const router = useRouter();
  const { address } = useAccount();
  const { borrowerLoanIds, activeLoanCount, isLoading } = useLoan();
  const {
    loans,
    isLoading: loansLoading,
    error: loansError,
  } = useLoans(borrowerLoanIds);

  const [filter, setFilter] = useState<LoanFilter>("all");
  const [filteredLoans, setFilteredLoans] = useState<LoanDisplay[]>([]);

  // Apply filters
  useEffect(() => {
    if (!loans) return;

    let filtered = loans;

    switch (filter) {
      case "active":
        filtered = loans.filter((l) => l.status === LoanStatus.Active);
        break;
      case "pending":
        filtered = loans.filter((l) => l.status === LoanStatus.Pending);
        break;
      case "completed":
        filtered = loans.filter((l) => l.status === LoanStatus.Completed);
        break;
      case "defaulted":
        filtered = loans.filter((l) => l.status === LoanStatus.Defaulted);
        break;
      default:
        filtered = loans;
    }

    // Sort by newest first
    filtered.sort((a, b) => Number(b.id) - Number(a.id));

    setFilteredLoans(filtered);
  }, [loans, filter]);

  // Calculate statistics
  const stats = {
    total: loans?.length || 0,
    active: loans?.filter((l) => l.status === LoanStatus.Active).length || 0,
    pending: loans?.filter((l) => l.status === LoanStatus.Pending).length || 0,
    completed:
      loans?.filter((l) => l.status === LoanStatus.Completed).length || 0,
    defaulted:
      loans?.filter((l) => l.status === LoanStatus.Defaulted).length || 0,
    totalBorrowed:
      loans
        ?.filter((l) => l.status !== LoanStatus.Cancelled)
        .reduce((sum, l) => sum + l.principalAmount, 0) || 0,
    totalRepaid: loans?.reduce((sum, l) => sum + l.totalRepaid, 0) || 0,
  };

  const handleViewDetails = (loanId: string) => {
    router.push(`/borrow/${loanId}`);
  };

  const handleMakePayment = (loanId: string) => {
    router.push(`/borrow/${loanId}/pay`);
  };

  if (!address) {
    return (
      <Card className="p-8">
        <EmptyState
          title="Connect Your Wallet"
          description="Please connect your wallet to view your loans"
          icon="🔌"
        />
      </Card>
    );
  }

  if (isLoading || loansLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading your loans...</span>
        </div>
      </Card>
    );
  }

  // Show error if loan fetching failed
  if (loansError) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Loans
          </h3>
          <p className="text-sm text-gray-600 mb-4">{loansError}</p>
          <p className="text-xs text-gray-500">
            Please check the browser console for more details or try refreshing
            the page.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-600 ">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Loans</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Loans</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Borrowed</p>
          <p className="text-2xl font-bold">
            {formatCurrency(stats.totalBorrowed)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Repaid</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.totalRepaid)}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="p-1">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All", count: stats.total },
            { key: "active", label: "Active", count: stats.active },
            { key: "pending", label: "Pending", count: stats.pending },
            { key: "completed", label: "Completed", count: stats.completed },
            { key: "defaulted", label: "Defaulted", count: stats.defaulted },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as LoanFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    filter === key
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Loan List */}
      {filteredLoans.length === 0 ? (
        <EmptyState
          title={
            filter === "all"
              ? "No Loans Yet"
              : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Loans`
          }
          description={
            filter === "all"
              ? "Start your borrowing journey by requesting your first loan"
              : `You don't have any ${filter} loans at the moment`
          }
          icon="📋"
          action={
            filter === "all" && onRequestLoan ? (
              <Button onClick={onRequestLoan}>Request a Loan</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onViewDetails={() => handleViewDetails(loan.id)}
              onMakePayment={() => handleMakePayment(loan.id)}
            />
          ))}
        </div>
      )}

      {/* Request New Loan Button */}
      {stats.total > 0 && onRequestLoan && (
        <div className="flex justify-center pt-4">
          <Button onClick={onRequestLoan} size="lg">
            Request Another Loan
          </Button>
        </div>
      )}

      {/* Active Loan Limit Warning */}
      {activeLoanCount >= 3 && (
        <Card className="p-4 bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ You have reached the maximum of 3 active loans. Complete or pay
            off existing loans to request new ones.
          </p>
        </Card>
      )}
    </div>
  );
}
