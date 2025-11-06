"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { celoSepolia } from "@/config/wagmi";
import { celo, celoAlfajores } from "wagmi/chains";

// Get WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "6b87a3c69cbd8b52055d7aef763148d6";

if (!projectId) {
  console.error("WalletConnect Project ID is not configured!");
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

// Create Wagmi adapter for AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: chains,
  projectId,
  ssr: true,
});

// Create AppKit instance (Web3Modal v3)
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

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
