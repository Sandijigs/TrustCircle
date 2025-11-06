/**
 * Connected Navbar Component
 * 
 * Navbar wrapper that integrates with wagmi and AppKit
 * Automatically detects wallet connection and displays user info
 */

'use client';

import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Navbar } from './Navbar';
import { NavbarUser, NetworkInfo } from '@/types/components';
import { useEffect, useState } from 'react';
import { celoSepolia } from '@/config/wagmi';

interface ConnectedNavbarProps {
  onMenuToggle?: () => void;
  className?: string;
}

export function ConnectedNavbar({ onMenuToggle, className }: ConnectedNavbarProps) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const [user, setUser] = useState<NavbarUser | undefined>();
  const [network, setNetwork] = useState<NetworkInfo | undefined>();

  // Get balance
  const { data: balanceData } = useBalance({
    address: address,
  });

  // Update user state when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      setUser({
        address: address,
        balance: balanceData ? `${parseFloat(balanceData.formatted).toFixed(2)}` : '0.00',
        verified: false, // TODO: Check verification status from contract
        creditScore: undefined, // TODO: Fetch from credit score contract
      });
    } else {
      setUser(undefined);
    }
  }, [isConnected, address, balanceData]);

  // Update network state
  useEffect(() => {
    if (chain) {
      setNetwork({
        chainId: chain.id,
        name: chain.name,
        isTestnet: chain.testnet || false,
      });
    } else {
      setNetwork(undefined);
    }
  }, [chain]);

  // Handle connect - opens AppKit modal
  const handleConnect = async () => {
    await open();
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <Navbar
      user={user}
      network={network}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onMenuToggle={onMenuToggle}
      className={className}
    />
  );
}
