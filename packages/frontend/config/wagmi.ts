import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";
import { defineChain } from "viem";

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "6b87a3c69cbd8b52055d7aef763148d6";

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set");
}

// Define Celo Sepolia Testnet (NEW)
export const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia Testnet",
  network: "celo-sepolia",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
    public: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Celo Sepolia Explorer",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
});

// Metadata for WalletConnect
export const metadata = {
  name: "TrustCircle",
  description: "Web3 Micro-Lending Platform on Celo",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://trustcircle.finance",
  icons: ["https://trustcircle.finance/icon.png"],
};

// Create wagmi config
export const config = createConfig({
  chains: [celoSepolia, celoAlfajores, celo],
  connectors: [
    walletConnect({
      projectId,
      metadata,
      showQrModal: true,
    }),
    injected({
      target: "metaMask",
    }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  transports: {
    [celoSepolia.id]: http(process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"),
    [celoAlfajores.id]: http(process.env.NEXT_PUBLIC_ALFAJORES_RPC_URL),
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
