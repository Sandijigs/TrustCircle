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

import { Dashboard } from '@/components/dashboard';
import { MainLayout } from '@/components/layout';

export const metadata = {
  title: 'Dashboard | TrustCircle',
  description: 'View your lending activity, credit score, and manage your loans',
};

export default function DashboardPage() {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}
