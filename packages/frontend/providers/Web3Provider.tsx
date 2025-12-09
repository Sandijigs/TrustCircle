"use client";

import { ReactNode, useState, useEffect } from "react";
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
// Use environment variable or window.location.origin for proper URL matching
const getMetadata = () => ({
  name: "TrustCircle",
  description: "Web3 Micro-Lending Platform on Celo",
  url: typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://frontend-seven-alpha-99.vercel.app",
  icons: [
    typeof window !== 'undefined'
      ? `${window.location.origin}/icon.png`
      : "https://frontend-seven-alpha-99.vercel.app/icon.png"
  ],
});

// Define chains for AppKit (use array, not const assertion to avoid readonly issues)
const chains = [celoSepolia, celoAlfajores, celo];

// Create Wagmi adapter for AppKit (singleton)
let wagmiAdapter: WagmiAdapter | null = null;
let appKitInitialized = false;

function getWagmiAdapter() {
  if (!wagmiAdapter) {
    wagmiAdapter = new WagmiAdapter({
      networks: chains as any,
      projectId,
      ssr: true,
    });
  }
  return wagmiAdapter;
}

function initializeAppKit() {
  if (!appKitInitialized && typeof window !== 'undefined') {
    const adapter = getWagmiAdapter();
    createAppKit({
      adapters: [adapter],
      networks: chains as any,
      projectId,
      metadata: getMetadata(),
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
    appKitInitialized = true;
    console.log('🔗 AppKit initialized with URL:', getMetadata().url);
  }
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Create QueryClient inside component to avoid SSR issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  // Initialize AppKit on client side only, before rendering children
  useEffect(() => {
    initializeAppKit();
    setMounted(true);
  }, []);

  const adapter = getWagmiAdapter();

  // Don't render children until AppKit is initialized on client
  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={adapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
