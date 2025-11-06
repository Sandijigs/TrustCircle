/**
 * Mento Stablecoin Addresses on Celo
 * Mento is Celo's native stablecoin protocol
 */

export interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

// Celo Mainnet (42220) Mento Stablecoins
export const CELO_MAINNET_TOKENS: Record<string, Token> = {
  cUSD: {
    address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    symbol: "cUSD",
    name: "Celo Dollar",
    decimals: 18,
  },
  cEUR: {
    address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",
    symbol: "cEUR",
    name: "Celo Euro",
    decimals: 18,
  },
  cREAL: {
    address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787",
    symbol: "cREAL",
    name: "Celo Real",
    decimals: 18,
  },
  CELO: {
    address: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    symbol: "CELO",
    name: "Celo Native Asset",
    decimals: 18,
  },
};

// Celo Sepolia Testnet (11142220) Mento Stablecoins - NEW TESTNET
export const CELO_SEPOLIA_TOKENS: Record<string, Token> = {
  cUSD: {
    address: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b",
    symbol: "cUSD",
    name: "Celo Dollar (Sepolia)",
    decimals: 18,
  },
  cEUR: {
    address: "0xA99dC247d6b7B2E3ab48a1fEE101b83cD6aCd82a",
    symbol: "cEUR",
    name: "Celo Euro (Sepolia)",
    decimals: 18,
  },
  cREAL: {
    address: "0x2294298942fdc79417DE9E0D740A4957E0e7783a",
    symbol: "cREAL",
    name: "Celo Real (Sepolia)",
    decimals: 18,
  },
  CELO: {
    address: "0x471EcE3750Da237f93B8E339c536989b8978a438", // Using mainnet address for now
    symbol: "CELO",
    name: "Celo Native Asset (Sepolia)",
    decimals: 18,
  },
};

// Celo Alfajores Testnet (44787) Mento Stablecoins - LEGACY
export const ALFAJORES_TESTNET_TOKENS: Record<string, Token> = {
  cUSD: {
    address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    symbol: "cUSD",
    name: "Celo Dollar (Alfajores)",
    decimals: 18,
  },
  cEUR: {
    address: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
    symbol: "cEUR",
    name: "Celo Euro (Alfajores)",
    decimals: 18,
  },
  cREAL: {
    address: "0xE4D517785D091D3c54818832dB6094bcc2744545",
    symbol: "cREAL",
    name: "Celo Real (Alfajores)",
    decimals: 18,
  },
  CELO: {
    address: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9",
    symbol: "CELO",
    name: "Celo Native Asset (Alfajores)",
    decimals: 18,
  },
};

// ERC20 ABI (minimal - just what we need for balance and transfers)
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

// Helper function to get tokens for a specific chain
export function getTokensForChain(chainId: number): Record<string, Token> {
  switch (chainId) {
    case 42220: // Celo Mainnet
      return CELO_MAINNET_TOKENS;
    case 11142220: // Celo Sepolia Testnet (NEW)
      return CELO_SEPOLIA_TOKENS;
    case 44787: // Alfajores Testnet (LEGACY)
      return ALFAJORES_TESTNET_TOKENS;
    default:
      return CELO_SEPOLIA_TOKENS; // Default to new testnet
  }
}

// Get specific token address for a chain
export function getTokenAddress(
  chainId: number,
  symbol: "cUSD" | "cEUR" | "cREAL" | "CELO"
): `0x${string}` {
  const tokens = getTokensForChain(chainId);
  return tokens[symbol]?.address || tokens.cUSD.address;
}
