/**
 * ConnectWalletPrompt Component
 * 
 * Shows a prompt to connect wallet when user is not connected
 * Uses AppKit's w3m-button component
 */

'use client';

import { Card } from '@/components/ui';

export function ConnectWalletPrompt() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-success-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-primary-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          
          <p className="text-gray-600 mb-6">
            Connect your wallet to access your dashboard, manage loans, and interact with lending circles
          </p>
        </div>

        {/* AppKit Connect Button */}
        <div className="flex justify-center">
          <w3m-button />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Supported networks: Celo Sepolia, Alfajores, Mainnet
          </p>
        </div>
      </Card>
    </div>
  );
}
