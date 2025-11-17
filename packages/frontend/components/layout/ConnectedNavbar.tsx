/**
 * Connected Navbar Component
 * 
 * Navbar wrapper that integrates with wagmi and AppKit
 * Automatically detects wallet connection and displays user info
 */

'use client';

import { useAccount, useBalance, useDisconnect, useContractRead } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Navbar } from './Navbar';
import { NavbarUser, NetworkInfo } from '@/types/components';
import { useEffect, useState } from 'react';
import { celoSepolia } from '@/config/wagmi';
import { getTokenAddresses } from '@/config/contracts';
import { ERC20_ABI } from '@/config/tokens';
import { formatUnits } from 'viem';

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

  // Get native CELO balance
  const { data: celoBalance } = useBalance({
    address: address,
  });

  // Get stablecoin addresses
  const tokens = getTokenAddresses();

  // Get cUSD balance
  const { data: cusdBalance } = useContractRead({
    address: tokens.cUSD as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get cEUR balance
  const { data: ceurBalance } = useContractRead({
    address: tokens.cEUR as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get cREAL balance
  const { data: crealBalance } = useContractRead({
    address: tokens.cREAL as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Update user state when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      // Format stablecoin balances
      const cusd = cusdBalance ? Number(formatUnits(cusdBalance as bigint, 18)).toFixed(2) : '0.00';
      const ceur = ceurBalance ? Number(formatUnits(ceurBalance as bigint, 18)).toFixed(2) : '0.00';
      const creal = crealBalance ? Number(formatUnits(crealBalance as bigint, 18)).toFixed(2) : '0.00';
      const celo = celoBalance ? parseFloat(celoBalance.formatted).toFixed(2) : '0.00';

      // Show balance with highest value
      let displayBalance = `${cusd} cUSD`;
      if (parseFloat(ceur) > parseFloat(cusd)) {
        displayBalance = `${ceur} cEUR`;
      }
      if (parseFloat(creal) > Math.max(parseFloat(cusd), parseFloat(ceur))) {
        displayBalance = `${creal} cREAL`;
      }

      setUser({
        address: address,
        balance: displayBalance,
        celoBalance: celo,
        cusdBalance: cusd,
        ceurBalance: ceur,
        crealBalance: creal,
        verified: false,
        creditScore: undefined,
      });
    } else {
      setUser(undefined);
    }
  }, [isConnected, address, celoBalance, cusdBalance, ceurBalance, crealBalance]);

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
