# TrustCircle - Complete Setup & Testing Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Initialize Git Repository](#step-1-initialize-git-repository)
4. [Step 2: Environment Configuration](#step-2-environment-configuration)
5. [Step 3: Test Smart Contracts](#step-3-test-smart-contracts)
6. [Step 4: Deploy to Celo Alfajores](#step-4-deploy-to-celo-alfajores)
7. [Step 5: Configure Frontend](#step-5-configure-frontend)
8. [Step 6: Test Frontend](#step-6-test-frontend)
9. [Step 7: End-to-End Testing Checklist](#step-7-end-to-end-testing-checklist)
10. [Step 8: Deploy to Celo Mainnet](#step-8-deploy-to-celo-mainnet)

---

## Project Overview

### What's Already Built

**Smart Contracts (100% Complete):**
- ✅ 9 Solidity contracts
- ✅ Deployment script ready
- ✅ Test infrastructure
- ✅ UUPS upgradeable pattern
- ✅ Role-based access control

**Frontend (70% Complete):**
- ✅ Next.js 15 + React 19
- ✅ Wagmi + WalletConnect integration
- ✅ Celo network configs
- ✅ AI credit scoring API
- ⚠️ UI components need building
- ⚠️ Contract integration pending

**What This Guide Covers:**
1. Setting up your development environment
2. Testing all smart contracts
3. Deploying to Celo testnet
4. Connecting wallet and testing features
5. Full end-to-end testing

---

## Prerequisites

### Required Software
- ✅ Node.js 18+ (you have v24.10.0)
- ✅ npm (installed)
- ✅ Git (installed)

### Accounts & API Keys Needed

#### 1. **Celo Wallet (REQUIRED)**
   - MetaMask or any Celo-compatible wallet
   - **You'll need the private key** for deployment

#### 2. **WalletConnect Project ID (ALREADY CONFIGURED ✅)**
   - Current ID: `6b87a3c69cbd8b52055d7aef763148d6`
   - Get your own at: https://cloud.walletconnect.com/

#### 3. **Testnet Tokens (REQUIRED)**
   - Get free CELO, cUSD, cEUR, cREAL from: https://faucet.celo.org/

#### 4. **Optional APIs:**
   - Anthropic API (for AI credit scoring): https://console.anthropic.com/
   - Neynar API (for Farcaster): https://neynar.com/
   - CeloScan API (for contract verification): https://celoscan.io/

---

## Step 1: Initialize Git Repository

Your project isn't version controlled yet. Let's fix that:

```bash
# From project root
cd /Users/idjighereoghenerukevwesandra/Desktop/trustcircle

# Initialize git
git init

# Create .gitignore if not exists
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables (NEVER commit these!)
.env
.env.local
.env*.local
*.env

# Build outputs
.next/
out/
dist/
build/
*.tsbuildinfo

# Contract artifacts
artifacts/
cache/
typechain-types/
deployments.json
gas-report.txt
coverage/
coverage.json

# Hardhat
artifacts-zk/
cache-zk/

# Testing
.coverage_artifacts/
.coverage_cache/
.coverage_contracts/
test-results/
playwright-report/
playwright/.cache

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.qodo/
EOF

# Initial commit
git add .
git commit -m "Initial commit: TrustCircle monorepo with contracts and frontend"
```

---

## Step 2: Environment Configuration

### 2.1 Get Your Wallet Private Key

**⚠️ SECURITY WARNING: Only use testnet wallets! Never use mainnet keys!**

#### From MetaMask:
1. Open MetaMask
2. Click three dots → Account Details
3. Click "Show Private Key"
4. Enter password
5. Copy the key (64 hex characters)

#### Create a New Testnet Wallet (Recommended):
```bash
# Install eth-crypto tool
npm install -g eth-crypto

# Generate new wallet
eth-crypto createIdentity

# Save the privateKey value
```

### 2.2 Configure Contracts Environment

```bash
cd packages/contracts

# Edit .env.local
nano .env.local
```

**Update these values:**
```bash
# Your testnet wallet private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_64_character_private_key_here

# Your wallet address
DEPLOYER_ADDRESS=0xYourWalletAddressHere

# Celo RPCs (already set)
NEXT_PUBLIC_ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org

# Optional: CeloScan API for verification
CELOSCAN_API_KEY=your_celoscan_api_key
```

### 2.3 Configure Frontend Environment

```bash
cd ../frontend

# Edit .env.local
nano .env.local
```

**Update these values:**
```bash
# WalletConnect (already set)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=6b87a3c69cbd8b52055d7aef763148d6

# Network config (already set)
NEXT_PUBLIC_ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_DEFAULT_NETWORK=alfajores

# Optional: AI Credit Scoring
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: Farcaster
NEYNAR_API_KEY=your_neynar_key
```

### 2.4 Verify Configuration

```bash
# Go back to root
cd ../..

# Check env files exist and are configured
echo "Checking configuration..."
grep "PRIVATE_KEY=" packages/contracts/.env.local
grep "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=" packages/frontend/.env.local
```

---

## Step 3: Test Smart Contracts

### 3.1 Install Dependencies

```bash
# From root directory
npm install

# This installs all packages in the monorepo
```

### 3.2 Compile Contracts

```bash
npm run compile

# Expected output:
# Compiled 9 Solidity files successfully
```

### 3.3 Run All Tests

```bash
# From root
npm run test:contracts

# Or with detailed output
cd packages/contracts
npm test

# Expected output:
# ✓ 600+ passing tests
# ✓ All contracts tested
```

### 3.4 Run Test Coverage

```bash
cd packages/contracts
npm run test:coverage

# Expected coverage:
# - Statements: > 95%
# - Branches: > 89%
# - Functions: > 98%
# - Lines: > 95%
```

### 3.5 Check Gas Usage

```bash
REPORT_GAS=true npm test

# This shows gas costs for each function
# Useful for optimization
```

### 3.6 Run Security Tests

```bash
npm run test:security

# Tests for:
# - Reentrancy attacks
# - Access control
# - Integer overflow/underflow
# - Front-running vulnerabilities
```

**✅ If all tests pass, you're ready to deploy!**

---

## Step 4: Deploy to Celo Alfajores

### 4.1 Get Testnet Tokens

1. Visit: https://faucet.celo.org/
2. Connect your wallet (the one with PRIVATE_KEY in .env)
3. Request tokens:
   - ✅ **CELO** (for gas fees) - Get 5 CELO
   - ✅ **cUSD** (for testing) - Get 100 cUSD
   - ✅ **cEUR** (optional) - Get 100 cEUR
   - ✅ **cREAL** (optional) - Get 100 cREAL

4. Wait ~30 seconds for tokens to arrive

5. Verify balance:
```bash
# Check on CeloScan
open https://alfajores.celoscan.io/address/YOUR_WALLET_ADDRESS
```

### 4.2 Deploy Contracts

```bash
# From root directory
npm run deploy:alfajores

# This will:
# 1. Deploy all 6 contracts
# 2. Set up roles and permissions
# 3. Create pools for cUSD, cEUR, cREAL
# 4. Save addresses to deployments.json
```

**Expected Output:**
```
🚀 Starting TrustCircle deployment...

Deploying contracts with account: 0xYour...Address
Account balance: 5.0 CELO

📊 Deploying CreditScore...
✅ CreditScore deployed to: 0x123...

🎫 Deploying VerificationSBT...
✅ VerificationSBT deployed to: 0x456...

💰 Deploying LendingPool...
✅ LendingPool deployed to: 0x789...
   ✓ Whitelisted cUSD
   ✓ Whitelisted cEUR
   ✓ Whitelisted cREAL
   ✓ Created pools

🔐 Deploying CollateralManager...
✅ CollateralManager deployed to: 0xabc...

📋 Deploying LoanManager...
✅ LoanManager deployed to: 0xdef...

🤝 Deploying LendingCircle...
✅ LendingCircle deployed to: 0xghi...

🔑 Setting up role permissions...
   ✓ All roles configured

============================================================
🎉 DEPLOYMENT COMPLETE!
============================================================

📝 Contract Addresses saved to deployments.json
```

### 4.3 Verify Deployment

```bash
# Check deployments.json was created
cat packages/contracts/deployments.json

# Should show:
# {
#   "alfajores": {
#     "contracts": {
#       "creditScore": "0x...",
#       "verificationSBT": "0x...",
#       ...
#     }
#   }
# }
```

### 4.4 Verify Contracts on CeloScan (Optional but Recommended)

```bash
cd packages/contracts

# Get contract addresses from deployments.json
CREDIT_SCORE=$(cat deployments.json | grep -A 20 '"alfajores"' | grep '"creditScore"' | cut -d'"' -f4)

# Verify each contract
npx hardhat verify --network alfajores $CREDIT_SCORE

# Repeat for all contracts
```

### 4.5 View Deployed Contracts

```bash
# Open CeloScan to view your contracts
open https://alfajores.celoscan.io/address/YOUR_CONTRACT_ADDRESS

# You can:
# - View contract code
# - Read contract state
# - Write contract functions
# - See all transactions
```

---

## Step 5: Configure Frontend

### 5.1 Update Contract Addresses

```bash
cd packages/frontend

# Create contract config
mkdir -p config
nano config/contracts.ts
```

**Add this code:**
```typescript
// config/contracts.ts
import { Address } from 'viem';
import deployments from '../../contracts/deployments.json';

const network = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'alfajores';
const deployment = deployments[network];

if (!deployment) {
  throw new Error(`No deployment found for network: ${network}`);
}

export const CONTRACTS = {
  CreditScore: deployment.contracts.creditScore as Address,
  VerificationSBT: deployment.contracts.verificationSBT as Address,
  LendingPool: deployment.contracts.lendingPool as Address,
  CollateralManager: deployment.contracts.collateralManager as Address,
  LoanManager: deployment.contracts.loanManager as Address,
  LendingCircle: deployment.contracts.lendingCircle as Address,
} as const;

export const TOKENS = {
  cUSD: deployment.tokens.cUSD as Address,
  cEUR: deployment.tokens.cEUR as Address,
  cREAL: deployment.tokens.cREAL as Address,
} as const;

export const NETWORK = network;
```

### 5.2 Create Contract ABIs Export

```bash
# Copy ABIs from artifacts
cd packages/frontend
mkdir -p lib/abis

# Create ABI exports
cat > lib/abis/index.ts << 'EOF'
// Import ABIs from compiled contracts
import CreditScoreABI from '../../../contracts/artifacts/contracts/CreditScore.sol/CreditScore.json';
import LendingPoolABI from '../../../contracts/artifacts/contracts/LendingPool.sol/LendingPool.json';
import LoanManagerABI from '../../../contracts/artifacts/contracts/LoanManager.sol/LoanManager.json';
import LendingCircleABI from '../../../contracts/artifacts/contracts/LendingCircle.sol/LendingCircle.json';
import CollateralManagerABI from '../../../contracts/artifacts/contracts/CollateralManager.sol/CollateralManager.json';
import VerificationSBTABI from '../../../contracts/artifacts/contracts/VerificationSBT.sol/VerificationSBT.json';

export const ABIS = {
  CreditScore: CreditScoreABI.abi,
  LendingPool: LendingPoolABI.abi,
  LoanManager: LoanManagerABI.abi,
  LendingCircle: LendingCircleABI.abi,
  CollateralManager: CollateralManagerABI.abi,
  VerificationSBT: VerificationSBTABI.abi,
} as const;
EOF
```

---

## Step 6: Test Frontend

### 6.1 Start Development Server

```bash
# From root directory
npm run dev

# Or from frontend directory
cd packages/frontend
npm run dev

# Server starts at http://localhost:3000
```

### 6.2 Test Wallet Connection

1. Open browser: http://localhost:3000
2. Click "Connect Wallet" (you'll need to build this button)
3. Select your wallet (MetaMask, Coinbase, WalletConnect)
4. Switch to **Celo Alfajores** network
5. Approve connection

**If Alfajores network not in MetaMask:**
- Network Name: Celo Alfajores Testnet
- RPC URL: https://alfajores-forno.celo-testnet.org
- Chain ID: 44787
- Currency Symbol: CELO
- Block Explorer: https://alfajores.celoscan.io

### 6.3 Build Basic UI Components

Here's a minimal UI to test wallet connection:

```bash
cd packages/frontend
nano app/page.tsx
```

**Update with:**
```typescript
"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { CONTRACTS, TOKENS } from "@/config/contracts";

export default function HomePage() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const { data: celoBalance } = useBalance({ address });
  const { data: cUSDBalance } = useBalance({ 
    address, 
    token: TOKENS.cUSD 
  });

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-8">TrustCircle</h1>
        <p className="text-lg mb-8">Web3 Micro-Lending Platform on Celo</p>
        
        <div className="flex flex-col gap-4">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect {connector.name}
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">TrustCircle Dashboard</h1>
        <p className="text-gray-600">Connected to {chain?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Info</h2>
          <p className="text-sm text-gray-600 mb-2">Address:</p>
          <p className="font-mono text-sm mb-4">{address}</p>
          
          <p className="text-sm text-gray-600 mb-2">CELO Balance:</p>
          <p className="text-2xl font-bold mb-2">
            {celoBalance?.formatted} CELO
          </p>
          
          <p className="text-sm text-gray-600 mb-2">cUSD Balance:</p>
          <p className="text-2xl font-bold">
            {cUSDBalance?.formatted} cUSD
          </p>
          
          <button
            onClick={() => disconnect()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Smart Contracts</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">LendingPool:</span>
              <p className="font-mono break-all">{CONTRACTS.LendingPool}</p>
            </div>
            <div>
              <span className="text-gray-600">LoanManager:</span>
              <p className="font-mono break-all">{CONTRACTS.LoanManager}</p>
            </div>
            <div>
              <span className="text-gray-600">CreditScore:</span>
              <p className="font-mono break-all">{CONTRACTS.CreditScore}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Borrow</h3>
          <p className="text-gray-600 mb-4">Request a micro-loan</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Coming Soon
          </button>
        </div>

        <div className="border rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Lend</h3>
          <p className="text-gray-600 mb-4">Deposit to earn interest</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Coming Soon
          </button>
        </div>

        <div className="border rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Circles</h3>
          <p className="text-gray-600 mb-4">Join lending circles</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Coming Soon
          </button>
        </div>
      </div>
    </main>
  );
}
```

### 6.4 Test the UI

```bash
# Server should auto-reload
# Open http://localhost:3000

# Test:
# 1. ✅ Connect wallet
# 2. ✅ See wallet address
# 3. ✅ See CELO and cUSD balances
# 4. ✅ See contract addresses
# 5. ✅ Disconnect wallet
```

---

## Step 7: End-to-End Testing Checklist

### 7.1 Smart Contract Tests

Run from `packages/contracts/`:

```bash
# Unit tests
npm run test:unit
# Expected: ✅ 400+ tests passing

# Integration tests
npm run test:integration
# Expected: ✅ 100+ tests passing

# Security tests
npm run test:security
# Expected: ✅ 100+ tests passing

# Coverage
npm run test:coverage
# Expected: ✅ > 95% coverage
```

### 7.2 Frontend Tests

Run from `packages/frontend/`:

```bash
# Unit tests
npm test
# Expected: ✅ Component tests pass

# E2E tests
npm run test:e2e
# Expected: ✅ Wallet connection works
```

### 7.3 Manual Testing Checklist

#### Wallet Connection
- [ ] Connect with MetaMask
- [ ] Connect with WalletConnect
- [ ] Connect with Coinbase Wallet
- [ ] Switch between networks
- [ ] Disconnect wallet
- [ ] Reconnect after refresh

#### Smart Contract Interactions (via CeloScan)
- [ ] View LendingPool contract
- [ ] Read pool info for cUSD
- [ ] Check your credit score (should be 300 default)
- [ ] View verification SBT contract

#### Test Lending (Manual via CeloScan)
1. Go to LendingPool contract on CeloScan
2. Connect wallet
3. Click "Write Contract"
4. Call `deposit(tokenAddress, amount)`
5. Verify deposit increased pool liquidity

#### Test Borrowing (Manual via CeloScan)
1. Go to LoanManager contract
2. Call `requestLoan()` with parameters
3. Check loan created
4. Approve loan (as admin)
5. Verify loan disbursed

---

## Step 8: Deploy to Celo Mainnet

⚠️ **ONLY DO THIS WHEN FULLY TESTED ON TESTNET!**

### Pre-Deployment Checklist

- [ ] All 600+ tests passing
- [ ] Tested extensively on Alfajores for 1+ week
- [ ] Security audit completed
- [ ] Smart contracts verified on CeloScan
- [ ] Multi-sig wallet set up for admin
- [ ] Emergency pause tested
- [ ] Real users tested on testnet
- [ ] Legal compliance checked
- [ ] Insurance fund allocated

### Deployment Steps

```bash
# 1. Get mainnet CELO for gas
# Buy CELO on exchange, send to deployer wallet

# 2. Update .env for mainnet
# Set PRIVATE_KEY to mainnet wallet (BE CAREFUL!)

# 3. Deploy
npm run deploy:celo

# 4. Verify contracts
cd packages/contracts
npx hardhat verify --network celo CONTRACT_ADDRESS

# 5. Transfer admin to multi-sig
# Use CeloScan to call grantRole() and renounceRole()

# 6. Update frontend to mainnet
# Set NEXT_PUBLIC_DEFAULT_NETWORK=celo
```

---

## 🆘 Troubleshooting

### Issue: Tests failing
**Solution:** 
```bash
npm run clean
npm install
npm run compile
npm test
```

### Issue: Deployment fails with "insufficient funds"
**Solution:** Get more testnet CELO from faucet

### Issue: Wallet won't connect
**Solution:** 
- Check WalletConnect Project ID is set
- Refresh page
- Try different wallet
- Check network is Alfajores

### Issue: Contract interactions fail
**Solution:**
- Verify you're on correct network
- Check you have enough CELO for gas
- Verify contract is deployed (check CeloScan)

---

## 📚 Next Steps After Testing

1. **Build Full UI:**
   - Loan request form
   - Deposit interface
   - Credit score display
   - Lending circles UI

2. **Add Features:**
   - Notifications
   - Transaction history
   - Analytics dashboard
   - Social features

3. **Optimize:**
   - Gas optimization
   - UI/UX improvements
   - Mobile responsiveness

4. **Launch:**
   - Beta testing with real users
   - Marketing campaign
   - Community building

---

## 📞 Support Resources

- **Celo Docs:** https://docs.celo.org/
- **Wagmi Docs:** https://wagmi.sh/
- **Hardhat Docs:** https://hardhat.org/
- **WalletConnect Docs:** https://docs.walletconnect.com/

---

**Last Updated:** November 3, 2024  
**Version:** 1.0.0  
**Status:** Ready for Testing ✅
