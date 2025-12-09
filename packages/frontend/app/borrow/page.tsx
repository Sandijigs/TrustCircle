/**
 * Borrow Page
 * 
 * Allows users to:
 * - Request new loans
 * - View active loans
 * - Make payments
 * - View repayment schedule
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { LoanRequestForm } from '@/components/borrow/LoanRequestForm';
import { MyLoans } from '@/components/borrow/MyLoans';
import { Card } from '@/components/ui';
import { ConnectWalletPrompt } from '@/components/wallet/ConnectWalletPrompt';
import { useAccount } from 'wagmi';

export default function BorrowPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'request' | 'my-loans'>('request');

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
            Borrow Funds
          </h1>
          <p className="text-gray-600">
            Request loans with competitive rates based on your credit score
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('request')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'request'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Request Loan
            </button>
            <button
              onClick={() => setActiveTab('my-loans')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'my-loans'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              My Loans
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'request' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <LoanRequestForm />
              </div>
              <div>
                <Card className="p-6 sticky top-4">
                  <h3 className="font-semibold mb-4">Loan Features</h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Interest rates from 8-25% based on credit score</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Flexible terms: 1-52 weeks</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Weekly or bi-weekly payments</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>No early repayment penalties</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Multi-currency: cUSD, cEUR, cREAL</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'my-loans' && (
            <MyLoans />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
