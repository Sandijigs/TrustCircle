/**
 * Circles Page
 * 
 * Lending Circles functionality:
 * - Browse existing circles
 * - Create new circles
 * - Join circles
 * - Vote on loans
 * - Vouch for members
 */

'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { CircleList } from '@/components/circles/CircleList';
import { CreateCircle } from '@/components/circles/CreateCircle';
import { Card } from '@/components/ui';
import { ConnectWalletPrompt } from '@/components/wallet/ConnectWalletPrompt';
import { useAccount } from 'wagmi';

export default function CirclesPage() {
  const { address, isConnected } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my-circles'>('all');

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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lending Circles
            </h1>
            <p className="text-gray-600">
              Join communities, vouch for members, and access better loan terms
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Create Circle
          </button>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="font-semibold mb-2">Social Trust</h3>
            <p className="text-sm text-gray-600">
              Build reputation through vouches and successful loan repayments
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl mb-3">📉</div>
            <h3 className="font-semibold mb-2">Better Rates</h3>
            <p className="text-sm text-gray-600">
              Circle members can access loans with lower interest rates
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-3xl mb-3">🗳️</div>
            <h3 className="font-semibold mb-2">Democratic</h3>
            <p className="text-sm text-gray-600">
              Vote on loan approvals and circle decisions together
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              All Circles
            </button>
            <button
              onClick={() => setActiveTab('my-circles')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'my-circles'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              My Circles
            </button>
          </nav>
        </div>

        {/* Circle List */}
        <CircleList filter={activeTab} />

        {/* How It Works */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">How Lending Circles Work</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Create or Join</h4>
              <p className="text-sm text-gray-600">
                Start a new circle or join an existing one that matches your profile
              </p>
            </div>
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">Build Trust</h4>
              <p className="text-sm text-gray-600">
                Vouch for members you trust and build your reputation
              </p>
            </div>
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Vote Together</h4>
              <p className="text-sm text-gray-600">
                Participate in voting on loan requests from circle members
              </p>
            </div>
            <div>
              <div className="bg-primary-100 text-primary-600 rounded-full w-10 h-10 flex items-center justify-center font-bold mb-3">
                4
              </div>
              <h4 className="font-semibold mb-2">Access Benefits</h4>
              <p className="text-sm text-gray-600">
                Enjoy better rates and higher loan limits as you build trust
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Circle Modal */}
      {showCreateModal && (
        <CreateCircle
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </MainLayout>
  );
}
