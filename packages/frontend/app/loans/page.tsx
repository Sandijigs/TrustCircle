/**
 * Loans Page
 *
 * Dedicated page for viewing and managing all user loans
 * Shows active loans, pending loans, and loan history
 */

'use client';

export const dynamic = 'force-dynamic';

import { MainLayout } from '@/components/layout';
import { MyLoans } from '@/components/borrow/MyLoans';
import { ConnectWalletPrompt } from '@/components/wallet/ConnectWalletPrompt';
import { useAccount } from 'wagmi';

export default function LoansPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <MainLayout>
        <ConnectWalletPrompt />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Loans
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your active loans, repayment schedule, and loan history
          </p>
        </div>

        {/* Loans Content */}
        <MyLoans />
      </div>
    </MainLayout>
  );
}
