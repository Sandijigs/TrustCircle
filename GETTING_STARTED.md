# TrustCircle - Getting Started Guide

## 🚀 Complete Setup from Scratch

This guide will walk you through setting up TrustCircle, testing all features, and deploying to Celo.

---

## 📋 Prerequisites

### Required Software

1. **Node.js & npm** (v18 or later)
   ```bash
   node --version  # Should be v18.0.0 or higher
   npm --version   # Should be v9.0.0 or higher
   ```
   
   If not installed: Download from [nodejs.org](https://nodejs.org/)

2. **Git**
   ```bash
   git --version
   ```

3. **A Web3 Wallet**
   - MetaMask (recommended)
   - Coinbase Wallet
   - Or any WalletConnect-compatible wallet

4. **Test Funds** (for Alfajores testnet)
   - Get free Celo tokens from [Celo Faucet](https://faucet.celo.org/)
   - You'll need cUSD, cEUR, or cREAL

### Optional (For Development)

- **PostgreSQL** (for analytics database)
- **Redis** (for caching)
- **VS Code** (recommended IDE)

---

## 🏗️ Project Structure

```
trustcircle/
├── packages/
│   ├── contracts/              # Smart contracts (Solidity)
│   │   ├── contracts/          # Contract source files
│   │   ├── test/               # 600+ test cases
│   │   ├── scripts/            # Deployment scripts
│   │   └── hardhat.config.ts   # Hardhat configuration
│   │
│   ├── frontend/               # Next.js 15 application
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks (wagmi, etc.)
│   │   ├── lib/                # Utilities (analytics, AI, security)
│   │   ├── providers/          # Web3Provider (Wagmi)
│   │   └── config/             # Wagmi & token configs
│   │
│   └── shared/                 # Shared types & utilities
│
├── docs/                       # Documentation
├── scripts/                    # Helper scripts
└── package.json                # Monorepo root
```

---

## 📦 Step 1: Installation

### 1.1 Clone or Navigate to Project

```bash
cd /Users/idjighereoghenerukevwesandra/Desktop/trustcircle
```

### 1.2 Install Dependencies

```bash
# Install all dependencies for monorepo
npm install

# This installs:
# - Root dependencies
# - packages/contracts dependencies (Hardhat, OpenZeppelin, etc.)
# - packages/frontend dependencies (Next.js, Wagmi, Viem, etc.)
```

**Expected Output:**
```
added 1234 packages in 45s
```

### 1.3 Verify Installation

```bash
# Check contracts
npm run compile

# Check frontend
npm run dev:frontend
# Should start on http://localhost:3000
```

---

## 🔑 Step 2: Environment Setup

### 2.1 Get Required API Keys

#### WalletConnect Project ID (REQUIRED)

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up / Log in
3. Create a new project named "TrustCircle"
4. Copy your **Project ID**

#### Anthropic API Key (Optional - for AI credit scoring)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account
3. Generate an API key
4. Copy your key

#### Farcaster Integration (Optional)

1. Create a Farcaster account
2. Get FID from [Warpcast](https://warpcast.com/)
3. Get Neynar API key from [Neynar](https://neynar.com/)

### 2.2 Create Environment Files

#### For Contracts (packages/contracts/.env.local)

```bash
# Navigate to contracts
cd packages/contracts

# Copy example
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Fill in:**
```bash
# Your wallet private key (for deployment)
PRIVATE_KEY=your_private_key_here
# ⚠️ NEVER commit this to git!

# Your wallet address
DEPLOYER_ADDRESS=0xYourAddressHere

# Celo Alfajores RPC (testnet)
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org

# Celo Mainnet RPC (for production)
CELO_RPC_URL=https://forno.celo.org

# CeloScan API Key (optional - for contract verification)
CELOSCAN_API_KEY=your_celoscan_api_key
```

**How to get Private Key from MetaMask:**
1. Open MetaMask
2. Click on 3 dots → Account Details
3. Click "Show Private Key"
4. Enter password
5. Copy key (NEVER share this!)

#### For Frontend (packages/frontend/.env.local)

```bash
# Navigate to frontend
cd ../frontend

# Copy example
cp .env.example .env.local

# Edit .env.local
nano .env.local
```

**Fill in:**
```bash
# === REQUIRED ===

# WalletConnect Project ID (from Step 2.1)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Celo Network RPC URLs
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Default Network (use alfajores for testing)
NEXT_PUBLIC_DEFAULT_NETWORK=alfajores

# === OPTIONAL ===

# AI Credit Scoring (server-side only)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Farcaster Integration
NEXT_PUBLIC_FARCASTER_APP_FID=your_farcaster_app_fid
FARCASTER_APP_MNEMONIC=your_farcaster_app_mnemonic
NEYNAR_API_KEY=your_neynar_api_key_here

# Analytics (for tracking - see ANALYTICS_IMPLEMENTATION_SUMMARY.md)
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
NEXT_PUBLIC_POSTHOG_TOKEN=your_posthog_token
NEXT_PUBLIC_ANALYTICS_SALT=random_string_for_hashing

# Database (for analytics)
DATABASE_URL=postgresql://user:password@localhost:5432/trustcircle

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Feature Flags
NEXT_PUBLIC_ENABLE_FARCASTER=false
NEXT_PUBLIC_ENABLE_AI_SCORING=true
```

### 2.3 Verify Environment Setup

```bash
# Go back to root
cd ../..

# Check if env files exist
ls -la packages/contracts/.env.local
ls -la packages/frontend/.env.local
```

---

## 🧪 Step 3: Test Smart Contracts (IMPORTANT!)

Before deploying, let's test everything works!

### 3.1 Compile Contracts

```bash
# From root directory
npm run compile

# Or from contracts directory
cd packages/contracts
npm run compile
```

**Expected Output:**
```
Compiled 15 Solidity files successfully
```

### 3.2 Run Unit Tests

```bash
# Run all tests
npm test

# Or specific test suites
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:security     # Security tests
```

**Expected Output:**
```
  CreditScore Tests
    ✓ Should initialize with correct admin
    ✓ Should update credit score (AI agent)
    ...

  LendingPool Tests
    ✓ Should create pool for whitelisted token
    ✓ Should allow deposits
    ...

  LoanManager Tests
    ✓ Should request loan
    ✓ Should approve and disburse loan
    ...

  600+ tests passing
```

### 3.3 Run Test Coverage

```bash
npm run test:coverage
```

**Expected Output:**
```
--------------------|---------|----------|---------|---------|
File                |  % Stmts | % Branch |  % Funcs |  % Lines |
--------------------|---------|----------|---------|---------|
CreditScore.sol     |     100 |    93.75 |     100 |     100 |
LendingPool.sol     |   98.41 |    90.62 |     100 |   98.41 |
LoanManager.sol     |   96.92 |    88.46 |     100 |   96.92 |
...
--------------------|---------|----------|---------|---------|
All files           |   95.83 |    89.54 |   98.46 |   95.83 |
```

### 3.4 Check Gas Usage

```bash
REPORT_GAS=true npm test
```

---

## 🚀 Step 4: Deploy to Celo Alfajores (Testnet)

### 4.1 Get Test Funds

1. Go to [Celo Faucet](https://faucet.celo.org/)
2. Enter your wallet address
3. Get free Celo, cUSD, cEUR, and cREAL

**Verify Balance:**
```bash
# Check your balance on CeloScan
open https://alfajores.celoscan.io/address/YOUR_ADDRESS
```

### 4.2 Deploy Contracts

```bash
# From root directory
npm run deploy:alfajores

# This will:
# 1. Deploy all 6 contracts
# 2. Set up roles and permissions
# 3. Whitelist Mento stablecoins (cUSD, cEUR, cREAL)
# 4. Save addresses to deployments.json
```

**Expected Output:**
```
🚀 Starting TrustCircle deployment...

Deploying contracts with account: 0xYourAddress
Account balance: 5.0 CELO

📊 Deploying CreditScore...
✅ CreditScore deployed to: 0x...

🎫 Deploying VerificationSBT...
✅ VerificationSBT deployed to: 0x...

💰 Deploying LendingPool...
✅ LendingPool deployed to: 0x...
   ✓ Whitelisted cUSD
   ✓ Whitelisted cEUR
   ✓ Whitelisted cREAL

🔐 Deploying CollateralManager...
✅ CollateralManager deployed to: 0x...

📋 Deploying LoanManager...
✅ LoanManager deployed to: 0x...

🤝 Deploying LendingCircle...
✅ LendingCircle deployed to: 0x...

🔑 Setting up role permissions...
   ✓ Granted LOAN_MANAGER_ROLE to LoanManager
   ✓ Granted SCORE_UPDATER_ROLE to LoanManager
   ✓ Granted APPROVER_ROLE to LendingCircle

============================================================
🎉 DEPLOYMENT COMPLETE!
============================================================

📝 Contract Addresses:
------------------------------------------------------------
CreditScore:         0x...
VerificationSBT:     0x...
LendingPool:         0x...
CollateralManager:   0x...
LoanManager:         0x...
LendingCircle:       0x...
------------------------------------------------------------

💾 Deployment addresses saved to deployments.json
```

### 4.3 Verify Contracts (Optional but Recommended)

```bash
cd packages/contracts

# Verify each contract on CeloScan
npx hardhat verify --network alfajores CONTRACT_ADDRESS

# Example:
npx hardhat verify --network alfajores 0xYourCreditScoreAddress
```

### 4.4 Update Frontend Config

The deployment script automatically saves addresses to `packages/contracts/deployments.json`.

**Check the file:**
```bash
cat packages/contracts/deployments.json
```

**Create frontend config file:**
```bash
cd packages/frontend
nano config/contracts.ts
```

**Add:**
```typescript
// Import deployment addresses
import deployments from '../../contracts/deployments.json';

const network = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'alfajores';
const contracts = deployments[network]?.contracts;

if (!contracts) {
  throw new Error(`No deployment found for network: ${network}`);
}

export const CONTRACT_ADDRESSES = {
  CreditScore: contracts.creditScore,
  VerificationSBT: contracts.verificationSBT,
  LendingPool: contracts.lendingPool,
  CollateralManager: contracts.collateralManager,
  LoanManager: contracts.loanManager,
  LendingCircle: contracts.lendingCircle,
} as const;

export const MENTO_TOKENS = deployments[network]?.tokens || {};
```

---

## 💻 Step 5: Run Frontend Locally

### 5.1 Start Development Server

```bash
# From root directory
npm run dev

# Or from frontend directory
cd packages/frontend
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 15.1.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

### 5.2 Open in Browser

```bash
open http://localhost:3000
```

### 5.3 Connect Your Wallet

1. Click "Connect Wallet" button
2. Choose your wallet (MetaMask, Coinbase, WalletConnect)
3. Switch to **Celo Alfajores** network
4. Approve connection

**Troubleshooting:**
- If you don't see Alfajores, add it manually:
  - Network Name: Celo Alfajores
  - RPC URL: https://alfajores-forno.celo-testnet.org
  - Chain ID: 44787
  - Currency: CELO
  - Block Explorer: https://alfajores.celoscan.io

---

## 🧪 Step 6: Test All Features

### 6.1 Test Verification

1. Navigate to **Dashboard**
2. Click "Complete Verification"
3. Choose verification method:
   - Farcaster (if enabled)
   - Manual verification (test mode)
4. Complete verification flow
5. Check that you received an SBT badge

### 6.2 Test Lending (Deposit Funds)

1. Navigate to **Lend** page
2. Click "Deposit" on a pool (cUSD, cEUR, or cREAL)
3. Enter amount (e.g., 10 cUSD)
4. Approve token spending
5. Confirm deposit transaction
6. Verify your deposit appears in "My Deposits"

### 6.3 Test Borrowing (Request Loan)

1. Navigate to **Borrow** page
2. Click "Request Loan"
3. Fill in loan details:
   - Amount: 5 cUSD
   - Duration: 30 days
   - Purpose: "Test loan"
4. Submit request
5. Wait for AI credit scoring (if enabled)
6. Check loan status in "My Loans"

### 6.4 Test Lending Circles

1. Navigate to **Circles** page
2. Click "Create Circle"
3. Fill in circle details:
   - Name: "Test Circle"
   - Max members: 5
   - Min credit score: 300
4. Create circle
5. Invite friends (or test with multiple wallets)
6. Test vouching and voting

### 6.5 Test Loan Repayment

1. Go to **My Loans**
2. Find your active loan
3. Click "Make Payment"
4. Enter payment amount
5. Confirm transaction
6. Verify payment recorded and credit score updated

---

## 🔍 Step 7: Testing Checklist

Use this checklist to ensure everything works:

### Smart Contracts
- [ ] All 600+ tests passing
- [ ] Test coverage > 90%
- [ ] No security warnings from Slither/Mythril
- [ ] Contracts deployed to Alfajores
- [ ] Contracts verified on CeloScan

### Wallet Connection
- [ ] Connect with MetaMask
- [ ] Connect with Coinbase Wallet
- [ ] Connect with WalletConnect
- [ ] Switch networks (Alfajores ↔ Celo)
- [ ] Disconnect and reconnect

### Verification
- [ ] Complete verification flow
- [ ] Receive SBT badge
- [ ] View verification status

### Lending Pool
- [ ] Deposit cUSD
- [ ] Deposit cEUR
- [ ] Deposit cREAL
- [ ] Withdraw funds
- [ ] View pool statistics

### Borrowing
- [ ] Request loan
- [ ] AI credit scoring works
- [ ] Loan approval/rejection
- [ ] Loan disbursement
- [ ] Make repayment
- [ ] Complete loan
- [ ] Credit score updates

### Lending Circles
- [ ] Create circle
- [ ] Join circle
- [ ] Vouch for member
- [ ] Vote on loan request
- [ ] Circle loan approval

### UI/UX
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states
- [ ] Error handling
- [ ] Transaction confirmations
- [ ] Toast notifications

---

## 📊 Step 8: Monitor & Debug

### 8.1 View Logs

**Frontend logs:**
```bash
# In terminal running npm run dev
# Check for errors or warnings
```

**Contract events:**
```bash
# View on CeloScan
open https://alfajores.celoscan.io/address/YOUR_CONTRACT_ADDRESS#events
```

### 8.2 Debug Tools

**Browser Console:**
- Press F12 or Cmd+Option+I
- Check Console tab for errors
- Check Network tab for API calls

**Wagmi Devtools (optional):**
```bash
npm install @tanstack/react-query-devtools
```

Add to `app/layout.tsx`:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In component:
<ReactQueryDevtools initialIsOpen={false} />
```

### 8.3 Common Issues

**Issue: Wallet won't connect**
- Check WalletConnect Project ID is set
- Verify network is Alfajores
- Try refreshing page
- Clear browser cache

**Issue: Transaction fails**
- Check you have enough CELO for gas
- Verify contract addresses are correct
- Check token allowance

**Issue: Credit score not updating**
- Check ANTHROPIC_API_KEY is set
- Verify AI agent role is granted
- Check API route logs

---

## 🚀 Step 9: Deploy to Production (Celo Mainnet)

⚠️ **STOP! Before deploying to mainnet:**

### Pre-deployment Checklist

- [ ] All tests passing (600+)
- [ ] Security audit completed (see SECURITY_AUDIT_REPORT.md)
- [ ] Tested extensively on Alfajores testnet
- [ ] Multi-sig wallet set up (3-of-5 admin, 2-of-3 pauser)
- [ ] Timelock contract deployed (48-hour delay)
- [ ] Emergency procedures documented
- [ ] Insurance fund allocated
- [ ] Professional audit (if budget allows: $30k-$100k)
- [ ] Legal review completed
- [ ] Terms of service finalized

### Deploy to Mainnet

```bash
# ONLY when ready!
npm run deploy:celo
```

Follow the same process as Alfajores, but:
1. Use mainnet RPC
2. Verify all addresses
3. Start with small liquidity
4. Monitor closely for first 24-48 hours

---

## 📚 Additional Resources

### Documentation
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Detailed testing instructions
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Advanced deployment options
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Security assessment
- [ANALYTICS_IMPLEMENTATION_SUMMARY.md](./ANALYTICS_IMPLEMENTATION_SUMMARY.md) - Analytics setup

### External Links
- [Celo Docs](https://docs.celo.org/)
- [Wagmi Docs](https://wagmi.sh/)
- [Next.js Docs](https://nextjs.org/docs)
- [Hardhat Docs](https://hardhat.org/)

### Support
- GitHub Issues: [Create Issue](#)
- Discord: [Join Discord](#)
- Email: support@trustcircle.finance

---

## ✅ Quick Start (TL;DR)

```bash
# 1. Install
npm install

# 2. Setup environment
cp packages/contracts/.env.example packages/contracts/.env.local
cp packages/frontend/.env.example packages/frontend/.env.local
# Edit both .env.local files with your keys

# 3. Test contracts
npm run test

# 4. Deploy to testnet
npm run deploy:alfajores

# 5. Start frontend
npm run dev

# 6. Open browser
open http://localhost:3000

# 7. Connect wallet and test!
```

---

**Next**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for advanced deployment options and CI/CD setup.

**Questions?** Check [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md) for detailed testing procedures.

---

**Last Updated**: November 2, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Testing
