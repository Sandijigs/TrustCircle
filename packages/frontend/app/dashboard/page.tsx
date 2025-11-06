/**
 * Dashboard Page
 * 
 * Main dashboard showing:
 * - Credit score
 * - Active loans
 * - Deposits
 * - Lending circles
 * - Activity feed
 */

'use client';

import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/dashboard';
import { MainLayout } from '@/components/layout';

export default function DashboardPage() {
  const router = useRouter();

  // Navigation handlers for quick action buttons
  const handleRequestLoan = () => {
    router.push('/borrow');
  };

  const handleJoinCircle = () => {
    router.push('/circles');
  };

  const handleDeposit = () => {
    router.push('/lend');
  };

  return (
    <MainLayout>
      <Dashboard 
        onRequestLoan={handleRequestLoan}
        onJoinCircle={handleJoinCircle}
        onDeposit={handleDeposit}
      />
    </MainLayout>
  );
}
