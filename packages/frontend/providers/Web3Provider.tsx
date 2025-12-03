"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { celoSepolia } from "@/config/wagmi";
import { celo, celoAlfajores } from "wagmi/chains";

// Get WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "6b87a3c69cbd8b52055d7aef763148d6";

if (!projectId) {
  console.warn("WalletConnect Project ID is not configured, using default");
}

// Metadata for WalletConnect
const metadata = {
  name: "TrustCircle",
  description: "Web3 Micro-Lending Platform on Celo",
  url: typeof window !== 'undefined' ? window.location.origin : "https://trustcircle.finance",
  icons: ["https://trustcircle.finance/icon.png"],
};

// Define chains for AppKit
const chains = [celoSepolia, celoAlfajores, celo] as const;

// Create Wagmi adapter for AppKit (singleton)
let wagmiAdapter: WagmiAdapter | null = null;

function getWagmiAdapter() {
  if (!wagmiAdapter) {
    wagmiAdapter = new WagmiAdapter({
      networks: chains,
      projectId,
      ssr: true,
    });

    // Create AppKit instance (Web3Modal v3) - only once
    if (typeof window !== 'undefined') {
      createAppKit({
        adapters: [wagmiAdapter],
        networks: chains,
        projectId,
        metadata,
        features: {
          analytics: true,
          email: false,
          socials: false,
        },
        themeMode: 'light',
        themeVariables: {
          '--w3m-accent': '#6366f1', // Primary indigo color
          '--w3m-border-radius-master': '8px',
        },
      });
    }
  }
  return wagmiAdapter;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  // Create QueryClient inside component to avoid SSR issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  const adapter = getWagmiAdapter();

  return (
    <WagmiProvider config={adapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
