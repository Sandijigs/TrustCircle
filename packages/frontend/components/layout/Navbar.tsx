/**
 * Navbar Component
 * 
 * Top navigation bar with wallet connection, balance display, and network indicator
 * Responsive design with mobile menu toggle
 * 
 * Design Decisions:
 * - Sticky positioning for constant access to wallet controls
 * - High contrast for wallet address and balance for quick scanning
 * - Network indicator with visual warning for wrong network
 * - Mobile-first with hamburger menu
 * 
 * @example
 * ```tsx
 * <Navbar
 *   user={{ address: '0x...', balance: '100.50', creditScore: 750 }}
 *   network={{ chainId: 44787, name: 'Alfajores', isTestnet: true }}
 *   onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
 * />
 * ```
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { NavbarUser, NetworkInfo } from '@/types/components';

interface NavbarProps {
  user?: NavbarUser;
  network?: NetworkInfo;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMenuToggle?: () => void;
  className?: string;
}

export function Navbar({
  user,
  network,
  onConnect,
  onDisconnect,
  onMenuToggle,
  className = '',
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkBadgeColor = () => {
    if (!network) return 'bg-gray-500';
    if (network.isTestnet) return 'bg-yellow-500';
    return 'bg-success-500';
  };

  return (
    <nav
      className={`
        sticky top-0 z-[1200]
        bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-800
        shadow-sm
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-success-600 rounded-lg flex items-center justify-center text-white">
                <span className="text-lg">T</span>
              </div>
              <span className="hidden sm:inline text-gray-900 dark:text-white">
                TrustCircle
              </span>
            </Link>
          </div>

          {/* Right: Network + Wallet */}
          <div className="flex items-center gap-3">
            {/* Network Indicator */}
            {network && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                <div className={`w-2 h-2 rounded-full ${getNetworkBadgeColor()}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {network.name}
                </span>
              </div>
            )}

            {/* Wallet Connection */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                >
                  {/* Balance */}
                  {user.balance && (
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Balance
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.balance} cUSD
                      </span>
                    </div>
                  )}

                  {/* Address + Avatar */}
                  <div className="flex items-center gap-2">
                    {/* Verification Badge */}
                    {user.verified && (
                      <span className="text-success-500" title="Verified">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}

                    {/* Jazzicon placeholder */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-success-400" />

                    {/* Address */}
                    <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {formatAddress(user.address)}
                    </span>

                    {/* Dropdown arrow */}
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                      {/* User Info */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-success-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {user.address}
                            </p>
                            {user.creditScore !== undefined && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Credit Score: {user.creditScore}
                              </p>
                            )}
                          </div>
                        </div>

                        {user.balance && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Balances:</p>
                            
                            {/* CELO Balance */}
                            {user.celoBalance && parseFloat(user.celoBalance) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">CELO:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {user.celoBalance}
                                </span>
                              </div>
                            )}
                            
                            {/* cUSD Balance */}
                            {user.cusdBalance && parseFloat(user.cusdBalance) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">cUSD:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {user.cusdBalance}
                                </span>
                              </div>
                            )}
                            
                            {/* cEUR Balance */}
                            {user.ceurBalance && parseFloat(user.ceurBalance) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">cEUR:</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {user.ceurBalance}
                                </span>
                              </div>
                            )}
                            
                            {/* cREAL Balance */}
                            {user.crealBalance && parseFloat(user.crealBalance) > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">cREAL:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {user.crealBalance}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Settings
                        </Link>
                      </div>

                      {/* Disconnect */}
                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            onDisconnect?.();
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={onConnect}
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
