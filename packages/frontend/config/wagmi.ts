import { http, createConfig, cookieStorage, createStorage } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "6b87a3c69cbd8b52055d7aef763148d6";

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set");
}

// Metadata for WalletConnect
export const metadata = {
  name: "TrustCircle",
  description: "Web3 Micro-Lending Platform on Celo",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://trustcircle.finance",
  icons: ["https://trustcircle.finance/icon.png"],
};

// Create wagmi config
export const config = createConfig({
  chains: [celoAlfajores, celo],
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
    [celoAlfajores.id]: http(process.env.NEXT_PUBLIC_ALFAJORES_RPC_URL),
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
