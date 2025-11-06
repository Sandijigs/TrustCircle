/**
 * Lend Page
 * 
 * Allows users to:
 * - Deposit funds into lending pools
 * - Withdraw deposits
 * - View pool statistics
 * - Track earnings
 */

'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PoolStats } from '@/components/lend/PoolStats';
import { MyDeposits } from '@/components/lend/MyDeposits';
import { DepositModal } from '@/components/lend/DepositModal';
import { Card } from '@/components/ui';
import { ConnectWalletPrompt } from '@/components/wallet/ConnectWalletPrompt';
import { useAccount } from 'wagmi';

export default function LendPage() {
  const { address, isConnected } = useAccount();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const handleDeposit = (tokenAddress: string) => {
    setSelectedToken(tokenAddress);
    setShowDepositModal(true);
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Earn Interest
          </h1>
          <p className="text-gray-600">
            Deposit stablecoins and earn competitive APY from borrowers
          </p>
        </div>

        {/* Pool Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Pools</h2>
          <PoolStats onDeposit={handleDeposit} />
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center mb-3">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Dynamic APY</h3>
                <p className="text-sm text-gray-600">Rates adjust with demand</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Interest rates increase when pool utilization is high, maximizing your returns
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secured Loans</h3>
                <p className="text-sm text-gray-600">Collateral-backed</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              All loans require collateral or social backing through lending circles
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-3">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Instant Withdraw</h3>
                <p className="text-sm text-gray-600">Access anytime</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Withdraw your funds plus earned interest at any time (subject to liquidity)
            </p>
          </Card>
        </div>

        {/* My Deposits */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Deposits</h2>
          <MyDeposits />
        </div>

        {/* How It Works */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">How Lending Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Deposit</h4>
              <p className="text-sm text-gray-600">
                Choose a stablecoin and deposit into the lending pool
              </p>
            </div>
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">Earn</h4>
              <p className="text-sm text-gray-600">
                Start earning interest immediately as borrowers take loans
              </p>
            </div>
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Track</h4>
              <p className="text-sm text-gray-600">
                Monitor your earnings and APY in real-time
              </p>
            </div>
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                4
              </div>
              <h4 className="font-semibold mb-2">Withdraw</h4>
              <p className="text-sm text-gray-600">
                Withdraw your deposits plus interest anytime
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && selectedToken && (
        <DepositModal
          tokenAddress={selectedToken as `0x${string}`}
          isOpen={showDepositModal}
          onClose={() => {
            setShowDepositModal(false);
            setSelectedToken(null);
          }}
        />
      )}
    </MainLayout>
  );
}
