/**
 * On-Chain Data Analyzer
 * 
 * Fetches and analyzes blockchain data from Celo
 * Calculates on-chain credit factors
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';
import type { OnChainData } from './types';

// Celo RPC client
const getCeloClient = () => {
  const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet';
  return createPublicClient({
    chain: isMainnet ? celo : celoAlfajores,
    transport: http(process.env.CELO_RPC_URL || 'https://forno.celo.org'),
  });
};

// Contract addresses (update with actual deployed addresses)
const CONTRACTS = {
  loanManager: process.env.NEXT_PUBLIC_LOAN_MANAGER_ADDRESS || '',
  creditScore: process.env.NEXT_PUBLIC_CREDIT_SCORE_ADDRESS || '',
  lendingPool: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '',
};

// Stablecoin addresses on Celo
const STABLECOINS = {
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
};

// Popular DeFi protocols on Celo
const DEFI_PROTOCOLS = {
  ubeswap: '0x',
  moola: '0x',
  sushiswap: '0x',
  curve: '0x',
};

/**
 * Fetch on-chain data for a wallet address
 */
export async function fetchOnChainData(walletAddress: string): Promise<OnChainData> {
  const client = getCeloClient();
  
  try {
    // Fetch data in parallel for better performance
    const [
      balance,
      transactionHistory,
      tokenBalances,
      loanHistory,
      defiInteractions,
    ] = await Promise.all([
      getBalance(client, walletAddress),
      getTransactionHistory(walletAddress),
      getTokenBalances(walletAddress),
      getLoanHistory(walletAddress),
      getDeFiInteractions(walletAddress),
    ]);

    // Calculate wallet age
    const walletAge = calculateWalletAge(transactionHistory);
    
    // Calculate transaction frequency
    const transactionFrequency = calculateTransactionFrequency(transactionHistory, walletAge);
    
    // Calculate token holdings metrics
    const tokenHoldings = analyzeTokenHoldings(tokenBalances, balance);
    
    // Calculate gas payment metrics
    const gasPayments = analyzeGasPayments(transactionHistory);

    return {
      walletAddress,
      walletAge,
      transactionCount: transactionHistory.length,
      transactionFrequency,
      totalVolume: calculateTotalVolume(transactionHistory),
      tokenHoldings,
      defiInteractions,
      loanHistory,
      gasPayments,
      smartContractInteractions: {
        uniqueContracts: countUniqueContracts(transactionHistory),
        totalInteractions: countContractInteractions(transactionHistory),
      },
    };
  } catch (error) {
    console.error('Error fetching on-chain data:', error);
    
    // Return minimal data structure on error
    return {
      walletAddress,
      walletAge: 0,
      transactionCount: 0,
      transactionFrequency: 0,
      totalVolume: 0,
      tokenHoldings: {
        tokens: [],
        totalValueUSD: 0,
        diversity: 0,
      },
      defiInteractions: {
        protocols: [],
        totalInteractions: 0,
        uniqueProtocols: 0,
      },
      loanHistory: {
        totalLoans: 0,
        activeLoans: 0,
        completedLoans: 0,
        defaultedLoans: 0,
        totalBorrowed: 0,
        totalRepaid: 0,
        averageRepaymentTime: 0,
        onTimePayments: 0,
        latePayments: 0,
      },
      gasPayments: {
        totalPaid: 0,
        averageGasPrice: 0,
        consistency: 0,
      },
      smartContractInteractions: {
        uniqueContracts: 0,
        totalInteractions: 0,
      },
    };
  }
}

/**
 * Get wallet balance
 */
async function getBalance(client: any, address: string): Promise<bigint> {
  try {
    return await client.getBalance({ address: address as `0x${string}` });
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0n;
  }
}

/**
 * Get transaction history from Celo Explorer API
 * Note: In production, use Celo Explorer API or Blockscout
 */
async function getTransactionHistory(address: string): Promise<any[]> {
  try {
    // Use Celo Explorer API (Blockscout)
    const explorerApiUrl = process.env.CELO_EXPLORER_API_URL || 
      'https://explorer.celo.org/api';
    
    const response = await fetch(
      `${explorerApiUrl}?module=account&action=txlist&address=${address}&sort=desc`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * Get token balances
 */
async function getTokenBalances(address: string): Promise<any[]> {
  try {
    const explorerApiUrl = process.env.CELO_EXPLORER_API_URL || 
      'https://explorer.celo.org/api';
    
    const response = await fetch(
      `${explorerApiUrl}?module=account&action=tokenlist&address=${address}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch token balances');
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
}

/**
 * Get loan history from LoanManager contract
 */
async function getLoanHistory(address: string): Promise<OnChainData['loanHistory']> {
  // TODO: Implement contract call to LoanManager
  // For now, return mock data
  
  // In production:
  // 1. Call LoanManager.getUserLoans(address)
  // 2. For each loan, get status, amount, repayment info
  // 3. Calculate metrics
  
  return {
    totalLoans: 0,
    activeLoans: 0,
    completedLoans: 0,
    defaultedLoans: 0,
    totalBorrowed: 0,
    totalRepaid: 0,
    averageRepaymentTime: 0,
    onTimePayments: 0,
    latePayments: 0,
  };
}

/**
 * Get DeFi protocol interactions
 */
async function getDeFiInteractions(address: string): Promise<OnChainData['defiInteractions']> {
  try {
    const transactions = await getTransactionHistory(address);
    
    // Filter transactions to DeFi protocols
    const defiTxs = transactions.filter((tx: any) => {
      const to = tx.to?.toLowerCase();
      return Object.values(DEFI_PROTOCOLS).some(protocol => 
        protocol && to?.includes(protocol.toLowerCase())
      );
    });

    // Extract unique protocols
    const protocols = [...new Set(defiTxs.map((tx: any) => {
      const to = tx.to?.toLowerCase();
      return Object.entries(DEFI_PROTOCOLS).find(([_, address]) => 
        to?.includes(address.toLowerCase())
      )?.[0] || 'unknown';
    }))];

    return {
      protocols,
      totalInteractions: defiTxs.length,
      uniqueProtocols: protocols.length,
    };
  } catch (error) {
    console.error('Error analyzing DeFi interactions:', error);
    return {
      protocols: [],
      totalInteractions: 0,
      uniqueProtocols: 0,
    };
  }
}

/**
 * Calculate wallet age in days
 */
function calculateWalletAge(transactions: any[]): number {
  if (transactions.length === 0) return 0;
  
  // Get oldest transaction
  const oldestTx = transactions[transactions.length - 1];
  const firstTxDate = new Date(parseInt(oldestTx.timeStamp) * 1000);
  const now = new Date();
  
  const ageInDays = Math.floor((now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, ageInDays);
}

/**
 * Calculate transaction frequency (transactions per month)
 */
function calculateTransactionFrequency(transactions: any[], walletAgeInDays: number): number {
  if (walletAgeInDays === 0 || transactions.length === 0) return 0;
  
  const months = walletAgeInDays / 30;
  return transactions.length / months;
}

/**
 * Calculate total transaction volume in USD
 */
function calculateTotalVolume(transactions: any[]): number {
  // Sum all transaction values
  const totalWei = transactions.reduce((sum, tx) => {
    return sum + BigInt(tx.value || 0);
  }, 0n);
  
  // Convert to CELO (assuming 1 CELO ≈ $0.50 USD)
  const celoAmount = parseFloat(formatUnits(totalWei, 18));
  const usdValue = celoAmount * 0.5; // Approximate USD value
  
  return usdValue;
}

/**
 * Analyze token holdings
 */
function analyzeTokenHoldings(tokens: any[], nativeBalance: bigint) {
  if (tokens.length === 0) {
    return {
      tokens: [],
      totalValueUSD: 0,
      diversity: 0,
    };
  }

  // Calculate total value (simplified)
  const nativeValueUSD = parseFloat(formatUnits(nativeBalance, 18)) * 0.5;
  const tokenValueUSD = tokens.reduce((sum, token) => {
    // Simplified: assume stablecoins are 1:1 with USD
    if (token.contractAddress === STABLECOINS.cUSD ||
        token.contractAddress === STABLECOINS.cEUR ||
        token.contractAddress === STABLECOINS.cREAL) {
      return sum + parseFloat(formatUnits(BigInt(token.balance || 0), parseInt(token.decimals || 18)));
    }
    return sum;
  }, 0);

  const totalValueUSD = nativeValueUSD + tokenValueUSD;

  // Calculate diversity (Shannon entropy)
  const totalBalance = nativeValueUSD + tokenValueUSD;
  const proportions = [
    nativeValueUSD / totalBalance,
    ...tokens.map((token: any) => {
      const value = parseFloat(formatUnits(BigInt(token.balance || 0), parseInt(token.decimals || 18)));
      return value / totalBalance;
    }),
  ].filter(p => p > 0);

  const diversity = proportions.reduce((entropy, p) => {
    return entropy - p * Math.log2(p);
  }, 0) / Math.log2(proportions.length || 1);

  return {
    tokens: tokens.map((t: any) => t.symbol || t.contractAddress),
    totalValueUSD,
    diversity: Math.min(1, diversity), // Normalize to 0-1
  };
}

/**
 * Analyze gas payments
 */
function analyzeGasPayments(transactions: any[]) {
  if (transactions.length === 0) {
    return {
      totalPaid: 0,
      averageGasPrice: 0,
      consistency: 0,
    };
  }

  const gasData = transactions.map((tx: any) => ({
    gasUsed: BigInt(tx.gasUsed || 0),
    gasPrice: BigInt(tx.gasPrice || 0),
    timestamp: parseInt(tx.timeStamp),
  }));

  // Calculate total gas paid
  const totalGasWei = gasData.reduce((sum, { gasUsed, gasPrice }) => {
    return sum + (gasUsed * gasPrice);
  }, 0n);
  const totalGasCELO = parseFloat(formatUnits(totalGasWei, 18));

  // Calculate average gas price
  const avgGasPrice = gasData.reduce((sum, { gasPrice }) => {
    return sum + gasPrice;
  }, 0n) / BigInt(gasData.length);

  // Calculate consistency (inverse of coefficient of variation)
  const gasPrices = gasData.map(({ gasPrice }) => Number(gasPrice));
  const mean = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
  const variance = gasPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / gasPrices.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 1;
  const consistency = Math.max(0, 1 - cv); // Higher consistency = lower variation

  return {
    totalPaid: totalGasCELO,
    averageGasPrice: Number(avgGasPrice),
    consistency: Math.min(1, consistency),
  };
}

/**
 * Count unique smart contracts interacted with
 */
function countUniqueContracts(transactions: any[]): number {
  const contracts = new Set(
    transactions
      .filter((tx: any) => tx.to && tx.input && tx.input !== '0x')
      .map((tx: any) => tx.to.toLowerCase())
  );
  return contracts.size;
}

/**
 * Count total smart contract interactions
 */
function countContractInteractions(transactions: any[]): number {
  return transactions.filter((tx: any) => 
    tx.to && tx.input && tx.input !== '0x'
  ).length;
}

/**
 * Calculate on-chain factor scores (0-100 each)
 */
export function calculateOnChainScores(data: OnChainData): {
  walletAge: number;
  transactionFrequency: number;
  loanRepaymentHistory: number;
  tokenHoldings: number;
  defiInteractions: number;
  gasConsistency: number;
  overall: number;
} {
  // Wallet age score (max at 365 days)
  const walletAgeScore = Math.min(100, (data.walletAge / 365) * 100);

  // Transaction frequency score (max at 10 tx/month)
  const txFrequencyScore = Math.min(100, (data.transactionFrequency / 10) * 100);

  // Loan repayment history score
  let loanScore = 50; // Default if no history
  if (data.loanHistory.totalLoans > 0) {
    const repaymentRate = data.loanHistory.completedLoans / data.loanHistory.totalLoans;
    const onTimeRate = data.loanHistory.onTimePayments / 
      (data.loanHistory.onTimePayments + data.loanHistory.latePayments || 1);
    const defaultRate = data.loanHistory.defaultedLoans / data.loanHistory.totalLoans;
    
    loanScore = (repaymentRate * 50 + onTimeRate * 40 - defaultRate * 50) * 100;
    loanScore = Math.max(0, Math.min(100, loanScore));
  }

  // Token holdings score (based on value and diversity)
  const valueScore = Math.min(50, (data.tokenHoldings.totalValueUSD / 1000) * 50);
  const diversityScore = data.tokenHoldings.diversity * 50;
  const tokenScore = valueScore + diversityScore;

  // DeFi interactions score (max at 5 protocols)
  const defiScore = Math.min(100, (data.defiInteractions.uniqueProtocols / 5) * 100);

  // Gas consistency score
  const gasScore = data.gasPayments.consistency * 100;

  // Weighted overall score
  const weights = {
    walletAge: 0.10,
    transactionFrequency: 0.10,
    loanRepaymentHistory: 0.40, // Most important
    tokenHoldings: 0.15,
    defiInteractions: 0.15,
    gasConsistency: 0.10,
  };

  const overall = 
    walletAgeScore * weights.walletAge +
    txFrequencyScore * weights.transactionFrequency +
    loanScore * weights.loanRepaymentHistory +
    tokenScore * weights.tokenHoldings +
    defiScore * weights.defiInteractions +
    gasScore * weights.gasConsistency;

  return {
    walletAge: Math.round(walletAgeScore),
    transactionFrequency: Math.round(txFrequencyScore),
    loanRepaymentHistory: Math.round(loanScore),
    tokenHoldings: Math.round(tokenScore),
    defiInteractions: Math.round(defiScore),
    gasConsistency: Math.round(gasScore),
    overall: Math.round(overall),
  };
}
