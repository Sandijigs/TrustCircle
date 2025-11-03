/**
 * Shared constants across TrustCircle platform
 */

// ==================== CHAIN IDS ====================

export const CELO_ALFAJORES_CHAIN_ID = 44787;
export const CELO_MAINNET_CHAIN_ID = 42220;

// ==================== TOKEN ADDRESSES ====================

// Alfajores Testnet
export const ALFAJORES_TOKENS = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as const,
  cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F" as const,
  cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545" as const,
  CELO: "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9" as const,
};

// Celo Mainnet
export const CELO_MAINNET_TOKENS = {
  cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const,
  cEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73" as const,
  cREAL: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" as const,
  CELO: "0x471EcE3750Da237f93B8E339c536989b8978a438" as const,
};

// ==================== LOAN CONSTANTS ====================

export const BASIS_POINTS = 10000;
export const MIN_LOAN_AMOUNT = BigInt(50) * BigInt(10 ** 18); // $50
export const MAX_LOAN_AMOUNT = BigInt(5000) * BigInt(10 ** 18); // $5000
export const MIN_CREDIT_SCORE = 300;
export const AUTO_APPROVE_SCORE = 800;
export const MAX_CREDIT_SCORE = 1000;

// Interest rates (in basis points)
export const INTEREST_RATES = {
  EXCELLENT: 800, // 8% for score >= 800
  GOOD: 1200, // 12% for score 700-799
  FAIR: 1600, // 16% for score 600-699
  POOR: 2000, // 20% for score 500-599
  BAD: 2500, // 25% for score < 500
};

// ==================== POOL CONSTANTS ====================

export const BASE_RATE = 500; // 5% base rate
export const OPTIMAL_UTILIZATION = 8000; // 80%
export const RESERVE_FACTOR = 1000; // 10%
export const MIN_DEPOSIT = BigInt(1) * BigInt(10 ** 18); // 1 token

// ==================== TIME CONSTANTS ====================

export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_WEEK = 604800;
export const SECONDS_PER_MONTH = 2592000; // 30 days
export const SECONDS_PER_YEAR = 31536000;

export const GRACE_PERIOD = 7 * SECONDS_PER_DAY; // 7 days
export const DEFAULT_THRESHOLD = 30 * SECONDS_PER_DAY; // 30 days

// ==================== CIRCLE CONSTANTS ====================

export const MIN_CIRCLE_MEMBERS = 5;
export const MAX_CIRCLE_MEMBERS = 20;
export const VOUCH_WEIGHT = 10; // Reputation points per vouch

// ==================== VERIFICATION LEVELS ====================

export const VERIFICATION_LEVELS = {
  NONE: 0,
  BASIC: 1,
  VERIFIED: 2,
  TRUSTED: 3,
} as const;

// ==================== NETWORK NAMES ====================

export const NETWORK_NAMES = {
  [CELO_ALFAJORES_CHAIN_ID]: "Celo Alfajores Testnet",
  [CELO_MAINNET_CHAIN_ID]: "Celo Mainnet",
} as const;

// ==================== RPC URLS ====================

export const RPC_URLS = {
  [CELO_ALFAJORES_CHAIN_ID]: "https://alfajores-forno.celo-testnet.org",
  [CELO_MAINNET_CHAIN_ID]: "https://forno.celo.org",
} as const;

// ==================== EXPLORER URLS ====================

export const EXPLORER_URLS = {
  [CELO_ALFAJORES_CHAIN_ID]: "https://alfajores.celoscan.io",
  [CELO_MAINNET_CHAIN_ID]: "https://celoscan.io",
} as const;
