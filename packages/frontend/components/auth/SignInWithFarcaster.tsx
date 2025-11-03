'use client';

/**
 * Sign In With Farcaster Component
 * Allows users to link their Farcaster account to their wallet
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { User, Check, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { farcasterClient } from '@/lib/farcaster/farcasterClient';
import type { FarcasterAuthState } from '@/lib/farcaster/types';

interface SignInWithFarcasterProps {
  onSuccess?: (fid: number, username: string) => void;
  onError?: (error: string) => void;
}

export function SignInWithFarcaster({ onSuccess, onError }: SignInWithFarcasterProps) {
  const { address, isConnected } = useAccount();
  const [authState, setAuthState] = useState<FarcasterAuthState>({
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already linked to Farcaster on mount
  useEffect(() => {
    if (address && isConnected) {
      checkExistingLink();
    }
  }, [address, isConnected]);

  async function checkExistingLink() {
    if (!address) return;

    setIsLoading(true);
    try {
      const fid = await farcasterClient.getFIDFromAddress(address);
      
      if (fid) {
        const user = await farcasterClient.getUserByFID(fid);
        if (user) {
          const verifiedAddresses = await farcasterClient.getVerifiedAddresses(fid);
          
          setAuthState({
            isAuthenticated: true,
            fid: user.fid,
            username: user.username,
            custodyAddress: user.custodyAddress,
            verifiedAddresses,
          });

          onSuccess?.(user.fid, user.username);
        }
      }
    } catch (err: any) {
      console.error('Error checking Farcaster link:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignIn() {
    if (!address) {
      setError('Please connect your wallet first');
      onError?.('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would:
      // 1. Generate a SIWF (Sign In With Farcaster) challenge
      // 2. Open Warpcast or use @farcaster/auth-kit
      // 3. User signs the challenge in their Farcaster app
      // 4. Verify the signature
      // 5. Link the wallet address to the FID

      // For now, we'll check if the wallet is already verified on Farcaster
      const fid = await farcasterClient.getFIDFromAddress(address);

      if (!fid) {
        setError(
          'No Farcaster account found for this wallet. Please verify your wallet address on Warpcast first.'
        );
        onError?.('No Farcaster account found');
        setIsLoading(false);
        return;
      }

      const user = await farcasterClient.getUserByFID(fid);
      if (!user) {
        setError('Failed to fetch Farcaster profile');
        onError?.('Failed to fetch profile');
        setIsLoading(false);
        return;
      }

      const verifiedAddresses = await farcasterClient.getVerifiedAddresses(fid);

      setAuthState({
        isAuthenticated: true,
        fid: user.fid,
        username: user.username,
        custodyAddress: user.custodyAddress,
        verifiedAddresses,
      });

      onSuccess?.(user.fid, user.username);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sign in with Farcaster';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDisconnect() {
    setAuthState({ isAuthenticated: false });
    setError(null);
  }

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <p>Connect your wallet to link Farcaster</p>
        </div>
      </Card>
    );
  }

  if (authState.isAuthenticated) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 rounded-full p-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  @{authState.username}
                </p>
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                FID: {authState.fid}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>

        {authState.verifiedAddresses && authState.verifiedAddresses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Verified Addresses:
            </p>
            <div className="space-y-1">
              {authState.verifiedAddresses.slice(0, 3).map((addr) => (
                <p
                  key={addr}
                  className="text-xs font-mono text-gray-500 dark:text-gray-500"
                >
                  {addr.slice(0, 6)}...{addr.slice(-4)}
                </p>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Farcaster
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Link your Farcaster account to improve your credit score with social reputation
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Benefits of linking Farcaster:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Boost credit score with social reputation</li>
            <li>• Get vouches from connections</li>
            <li>• Create circles from Farcaster channels</li>
            <li>• Share loan milestones to your feed</li>
          </ul>
        </div>

        <Button
          onClick={handleSignIn}
          isLoading={isLoading}
          className="w-full"
        >
          <User className="w-4 h-4 mr-2" />
          {isLoading ? 'Connecting...' : 'Connect Farcaster'}
        </Button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Make sure your wallet is verified on Warpcast first
        </p>
      </div>
    </Card>
  );
}
