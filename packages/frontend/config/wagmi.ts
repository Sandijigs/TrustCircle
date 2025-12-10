import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import { defineChain } from "viem";

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

// Create wagmi config
// Note: WalletConnect is handled by AppKit in Web3Provider, not here
export const config = createConfig({
  chains: [celoSepolia, celoAlfajores, celo],
  connectors: [
    injected({
      target: "metaMask",
    }),
    coinbaseWallet({
      appName: "TrustCircle",
      appLogoUrl: "https://trustcircle.finance/icon.png",
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
