/**
 * Smart Contract Configuration
 * 
 * This file contains all deployed contract addresses and ABIs
 * for the TrustCircle platform on Celo networks.
 */

import { Address } from 'viem';

// Import contract artifacts (ABIs) from lib directory
import CreditScoreArtifact from '@/lib/contracts/artifacts/CreditScore.sol/CreditScore.json';
import VerificationSBTArtifact from '@/lib/contracts/artifacts/VerificationSBT.sol/VerificationSBT.json';
import LendingPoolArtifact from '@/lib/contracts/artifacts/LendingPool.sol/LendingPool.json';
import CollateralManagerArtifact from '@/lib/contracts/artifacts/CollateralManager.sol/CollateralManager.json';
import LoanManagerArtifact from '@/lib/contracts/artifacts/LoanManager.sol/LoanManager.json';
import LendingCircleArtifact from '@/lib/contracts/artifacts/LendingCircle.sol/LendingCircle.json';

// Import deployment addresses
import deployments from '@/lib/contracts/deployments.json';

// Type for contract configuration
export interface ContractConfig {
  address: Address;
  abi: any;
}

// Type for all contracts
export interface Contracts {
  creditScore: ContractConfig;
  verificationSBT: ContractConfig;
  lendingPool: ContractConfig;
  collateralManager: ContractConfig;
  loanManager: ContractConfig;
  lendingCircle: ContractConfig;
}

// Network type
export type NetworkName = 'celoSepolia' | 'alfajores' | 'celo';

// Get network from environment or default to Celo Sepolia
export function getNetwork(): NetworkName {
  const network = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'sepolia';
  
  switch (network.toLowerCase()) {
    case 'sepolia':
    case 'celo-sepolia':
      return 'celoSepolia';
    case 'alfajores':
      return 'alfajores';
    case 'mainnet':
    case 'celo':
      return 'celo';
    default:
      return 'celoSepolia';
  }
}

// Get contract addresses for a specific network
export function getContractAddresses(network: NetworkName = getNetwork()) {
  const networkDeployment = deployments[network];
  
  if (!networkDeployment) {
    console.warn(`No deployment found for network: ${network}, falling back to celoSepolia`);
    return deployments.celoSepolia.contracts;
  }
  
  return networkDeployment.contracts;
}

// Get token addresses for a specific network
export function getTokenAddresses(network: NetworkName = getNetwork()) {
  const networkDeployment = deployments[network];
  
  if (!networkDeployment) {
    console.warn(`No deployment found for network: ${network}, falling back to celoSepolia`);
    return deployments.celoSepolia.tokens;
  }
  
  return networkDeployment.tokens;
}

// Create contract configuration for a specific network
export function createContractConfig(network: NetworkName = getNetwork()): Contracts {
  const addresses = getContractAddresses(network);
  
  return {
    creditScore: {
      address: addresses.creditScore as Address,
      abi: CreditScoreArtifact.abi,
    },
    verificationSBT: {
      address: addresses.verificationSBT as Address,
      abi: VerificationSBTArtifact.abi,
    },
    lendingPool: {
      address: addresses.lendingPool as Address,
      abi: LendingPoolArtifact.abi,
    },
    collateralManager: {
      address: addresses.collateralManager as Address,
      abi: CollateralManagerArtifact.abi,
    },
    loanManager: {
      address: addresses.loanManager as Address,
      abi: LoanManagerArtifact.abi,
    },
    lendingCircle: {
      address: addresses.lendingCircle as Address,
      abi: LendingCircleArtifact.abi,
    },
  };
}

// Export default contracts for current network
export const CONTRACTS = createContractConfig();

// Export individual contract configurations
export const CREDIT_SCORE = CONTRACTS.creditScore;
export const VERIFICATION_SBT = CONTRACTS.verificationSBT;
export const LENDING_POOL = CONTRACTS.lendingPool;
export const COLLATERAL_MANAGER = CONTRACTS.collateralManager;
export const LOAN_MANAGER = CONTRACTS.loanManager;
export const LENDING_CIRCLE = CONTRACTS.lendingCircle;

// Export contract addresses only (for display purposes)
export const CONTRACT_ADDRESSES = {
  creditScore: CREDIT_SCORE.address,
  verificationSBT: VERIFICATION_SBT.address,
  lendingPool: LENDING_POOL.address,
  collateralManager: COLLATERAL_MANAGER.address,
  loanManager: LOAN_MANAGER.address,
  lendingCircle: LENDING_CIRCLE.address,
} as const;

// Export ABIs only (for reference)
export const CONTRACT_ABIS = {
  creditScore: CREDIT_SCORE.abi,
  verificationSBT: VERIFICATION_SBT.abi,
  lendingPool: LENDING_POOL.abi,
  collateralManager: COLLATERAL_MANAGER.abi,
  loanManager: LOAN_MANAGER.abi,
  lendingCircle: LENDING_CIRCLE.abi,
} as const;

// Helper function to get a specific contract
export function getContract(name: keyof Contracts): ContractConfig {
  return CONTRACTS[name];
}

// Helper to check if contracts are deployed on current network
export function areContractsDeployed(network: NetworkName = getNetwork()): boolean {
  try {
    const addresses = getContractAddresses(network);
    return Boolean(
      addresses.creditScore &&
      addresses.verificationSBT &&
      addresses.lendingPool &&
      addresses.collateralManager &&
      addresses.loanManager &&
      addresses.lendingCircle
    );
  } catch (error) {
    return false;
  }
}

// Export network info
export const NETWORK_INFO = {
  celoSepolia: {
    name: 'Celo Sepolia Testnet',
    chainId: 11142220,
    explorer: 'https://celo-sepolia.blockscout.com',
    faucet: 'https://faucet.celo.org/celo-sepolia',
  },
  alfajores: {
    name: 'Celo Alfajores Testnet',
    chainId: 44787,
    explorer: 'https://alfajores.celoscan.io',
    faucet: 'https://faucet.celo.org/alfajores',
  },
  celo: {
    name: 'Celo Mainnet',
    chainId: 42220,
    explorer: 'https://celoscan.io',
    faucet: null,
  },
} as const;

// Get current network info
export function getCurrentNetworkInfo() {
  const network = getNetwork();
  return NETWORK_INFO[network];
}

// Export deployments data (for reference)
export { deployments };

// Type exports for TypeScript
export type { NetworkName, ContractConfig, Contracts };
