/**
 * ConnectWalletPrompt Component
 * 
 * Shows a prompt to connect wallet when user is not connected
 * Uses AppKit hook to trigger wallet connection
 */

'use client';

import { Card } from '@/components/ui';
import { useAppKit } from '@reown/appkit/react';

export function ConnectWalletPrompt() {
  const { open } = useAppKit();

  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-blue-600" 
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

        {/* Custom Connect Button */}
        <div className="flex justify-center">
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Connect Wallet
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Supported networks: Celo Sepolia, Alfajores, Mainnet
          </p>
          <p className="text-xs text-gray-400 mt-2">
            MetaMask • WalletConnect • Coinbase Wallet
          </p>
        </div>
      </Card>
    </div>
  );
}
