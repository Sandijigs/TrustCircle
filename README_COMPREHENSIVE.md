# 🌍 TrustCircle - Decentralized Micro-Lending Platform

<div align="center">

![TrustCircle Logo](https://via.placeholder.com/200x200/6366f1/ffffff?text=TrustCircle)

**Empowering Financial Inclusion Through Blockchain Technology**

[![Celo](https://img.shields.io/badge/Built%20on-Celo-35D07F?style=for-the-badge&logo=celo&logoColor=white)](https://celo.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[🚀 Live Demo](#) | [📖 Documentation](#documentation) | [🤝 Contributing](#contributing) | [💬 Community](#community)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**TrustCircle** is a next-generation decentralized micro-lending platform built on the Celo blockchain, designed to provide financial services to the unbanked and underbanked populations worldwide. By combining blockchain technology, AI-powered credit scoring, and social verification mechanisms, TrustCircle makes micro-loans accessible, transparent, and affordable.

### 🎯 Mission

To democratize access to financial services by leveraging blockchain technology, enabling anyone with a smartphone to access credit, build their financial reputation, and participate in the global economy.

### 💡 Why TrustCircle?

- **🌍 Global Access**: No traditional banking required
- **💸 Low Interest Rates**: 8-25% APY based on credit score (vs 100%+ traditional micro-loans)
- **🔐 Secure & Transparent**: All transactions on blockchain
- **🤖 AI-Powered**: Intelligent credit scoring using on-chain and social data
- **👥 Community-Driven**: Social lending circles and peer vouching
- **💰 Multi-Currency**: Support for cUSD, cEUR, and cREAL stablecoins

---

## ✨ Key Features

### 🏦 Core Lending Features

#### **Dynamic Lending Pools**
- Multi-currency support (cUSD, cEUR, cREAL)
- Dynamic interest rates based on utilization
- Liquidity provider rewards
- Automated rebalancing

#### **Smart Loan Management**
- Flexible loan terms (1-52 weeks)
- Credit score-based interest rates (8-25% APY)
- Automated installment calculations
- Grace periods and late fee management
- Early repayment options

#### **Collateral Management**
- Multiple collateral types (ERC20, ERC721)
- Automated liquidation mechanisms
- Health factor monitoring
- Real-time collateral valuation

### 👤 Identity & Reputation

#### **Verification System**
- Soul Bound Token (SBT) based identity
- Multi-level verification (Basic, Verified, Trusted)
- Integration with World ID, Holonym, and other providers
- Non-transferable identity tokens

#### **AI Credit Scoring**
- On-chain transaction history analysis
- Social reputation from Farcaster
- Loan repayment history
- Dynamic score updates (300-850 range)
- Transparent scoring algorithms

### 🤝 Social Features

#### **Lending Circles**
- Community-based lending groups
- Democratic loan approval voting
- Peer vouching system
- Shared responsibility model
- Circle reputation building

#### **Farcaster Integration**
- Social profile linking
- Reputation import from Farcaster
- Community engagement tracking
- Social vouching and endorsements

### 🔒 Security & Governance

#### **Security Features**
- Upgradeable contracts (UUPS proxy pattern)
- Role-based access control
- Emergency pause functionality
- Multi-signature admin operations
- Comprehensive audit trail

#### **Governance**
- Community voting on proposals
- Parameter adjustment mechanisms
- Treasury management
- Decentralized decision-making

---

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.0 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.6.0 | Type-safe development |
| **Tailwind CSS** | 3.4.15 | Utility-first styling |
| **Reown AppKit** | 1.7.8 | WalletConnect v3 integration |
| **Wagmi** | 2.12.0 | React Hooks for Ethereum |
| **Viem** | 2.21.0 | TypeScript Ethereum library |
| **TanStack Query** | 5.59.0 | Data fetching & caching |
| **Recharts** | 2.14.1 | Data visualization |
| **Lucide React** | 0.462.0 | Icon library |
| **Zod** | 3.23.8 | Schema validation |
| **Date-fns** | 4.1.0 | Date manipulation |

### Backend / Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.24 | Smart contract language |
| **Hardhat** | 2.22.17 | Development environment |
| **OpenZeppelin** | 5.1.0 | Security-audited contracts |
| **Ethers.js** | 6.x | Ethereum library |
| **TypeChain** | 8.3.2 | TypeScript bindings for contracts |
| **Hardhat Upgrades** | 3.9.1 | Proxy deployment tools |

### AI & APIs

| Service | Purpose |
|---------|---------|
| **Anthropic Claude** | AI credit scoring & risk assessment |
| **Neynar SDK** | Farcaster API integration |
| **WalletConnect Cloud** | Wallet connection service |
| **CeloScan API** | Blockchain data & verification |

### Blockchain

| Component | Details |
|-----------|---------|
| **Network** | Celo (Mainnet & Sepolia Testnet) |
| **Stablecoins** | cUSD, cEUR, cREAL (Mento Protocol) |
| **Tokens** | CELO native token |
| **Standards** | ERC20, ERC721, ERC1155, ERC4337 (planned) |

### Testing & Quality

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit testing |
| **Playwright** | End-to-end testing |
| **Hardhat Tests** | Smart contract testing |
| **Solidity Coverage** | Code coverage analysis |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |

### DevOps & Monitoring

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI/CD pipelines |
| **Vercel** | Frontend deployment |
| **Hardhat Deploy** | Contract deployment |
| **Sentry** | Error tracking (planned) |
| **Mixpanel** | Analytics (planned) |

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web App   │  │   Mobile    │  │    Admin    │         │
│  │  (Next.js)  │  │  (Planned)  │  │   Portal    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Integration Layer                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ WalletConnect│ │  Farcaster   │ │      AI      │        │
│  │  (Reown)     │ │   (Neynar)   │ │   (Claude)   │        │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘        │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────┐
│                  Blockchain Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Celo Blockchain                         │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │ CreditScore  │  │Verification  │  │ Lending  │  │    │
│  │  │              │  │     SBT      │  │   Pool   │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │     Loan     │  │ Collateral   │  │ Lending  │  │    │
│  │  │   Manager    │  │   Manager    │  │  Circle  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
trustcircle/
├── packages/
│   ├── frontend/                 # Next.js web application
│   │   ├── app/                  # App router pages
│   │   ├── components/           # React components
│   │   │   ├── ui/              # Base UI components
│   │   │   ├── lending/         # Lending-specific components
│   │   │   └── dashboard/       # Dashboard components
│   │   ├── config/              # Configuration files
│   │   │   └── wagmi.ts         # Wagmi & WalletConnect config
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   └── styles/              # Global styles
│   │
│   ├── contracts/                # Smart contracts
│   │   ├── contracts/           # Solidity contracts
│   │   │   ├── CreditScore.sol
│   │   │   ├── VerificationSBT.sol
│   │   │   ├── LendingPool.sol
│   │   │   ├── CollateralManager.sol
│   │   │   ├── LoanManager.sol
│   │   │   └── LendingCircle.sol
│   │   ├── scripts/             # Deployment scripts
│   │   ├── test/                # Contract tests
│   │   └── deployments.json     # Deployed addresses
│   │
│   └── shared/                   # Shared utilities
│       ├── types/               # TypeScript types
│       ├── constants/           # Constants
│       └── utils/               # Utility functions
│
├── docs/                         # Documentation
├── scripts/                      # Build & deployment scripts
└── .github/                      # GitHub Actions workflows
```

---

## 📜 Smart Contracts

### Deployed Contracts (Celo Sepolia Testnet)

All contracts are verified on Blockscout and use the UUPS upgradeable pattern.

| Contract | Address | Purpose | Status |
|----------|---------|---------|--------|
| **CreditScore** | `0x72Bf1C4C09448FF83674902ADe69929068138c84` | On-chain credit scoring | ✅ Verified |
| **VerificationSBT** | `0x57B54527C6d4847A08cf9Af74D1Aad933CA25A8F` | Soul-bound identity tokens | ✅ Verified |
| **LendingPool** | `0xFce2564f7085A26666410d9b173755fec7141333` | Liquidity pools | ✅ Verified |
| **CollateralManager** | `0x62B863Fe95D9Be0F39281419bD02A9D30d10FeF5` | Collateral management | ✅ Verified |
| **LoanManager** | `0x5C8D2d24f137C0488219BD528bD1bE0a05bcB5d0` | Loan lifecycle | ✅ Verified |
| **LendingCircle** | `0xa50dc2936694D0628d8D8158D712143e4cBBb0C2` | Social lending circles | ✅ Verified |

**View on Blockscout**: [All Contracts](https://celo-sepolia.blockscout.com/)

### Contract Features

#### 🎯 CreditScore Contract

**On-chain credit scoring system with AI integration**

- **Score Range**: 300-850 (similar to FICO)
- **Update Mechanism**: AI agent role-based updates
- **History Tracking**: Full score history stored on-chain
- **Factors Considered**:
  - Loan repayment history (40% weight)
  - Account age (15% weight)
  - Social reputation (25% weight)
  - Total loans completed (20% weight)

**Key Functions**:
```solidity
function getCreditScore(address user) external view returns (uint256)
function updateCreditScore(address user, uint256 newScore) external
function getScoreHistory(address user) external view returns (uint256[])
```

#### 🎫 VerificationSBT Contract

**Soul-bound identity tokens for KYC verification**

- **Non-transferable**: Tokens bound to wallet address
- **Verification Levels**:
  - Level 1: Basic (email/phone)
  - Level 2: Verified (KYC with ID)
  - Level 3: Trusted (Enhanced verification)
- **Expiration Support**: Time-limited verifications
- **Provider Integration**: World ID, Holonym, etc.

**Key Functions**:
```solidity
function issueVerification(address user, uint256 level) external returns (uint256)
function getVerificationLevel(address user) external view returns (uint256)
function revokeVerification(address user) external
```

#### 💰 LendingPool Contract

**Multi-currency liquidity pools with dynamic interest rates**

- **Supported Tokens**: cUSD, cEUR, cREAL
- **Interest Model**: Kinked rate model based on utilization
  - Base rate: 5% APY
  - Optimal utilization: 80%
  - Max rate: 25% APY
- **LP Tokens**: Minted for liquidity providers
- **Reserve Factor**: 10% of interest to treasury

**Key Functions**:
```solidity
function deposit(address token, uint256 amount) external returns (uint256 shares)
function withdraw(address token, uint256 shares) external returns (uint256 amount)
function borrow(address token, uint256 amount) external
function repay(address token, uint256 amount) external
function getCurrentRate(address token) external view returns (uint256)
```

#### 🔐 CollateralManager Contract

**Flexible collateral management with liquidation**

- **Collateral Types**: ERC20 tokens, ERC721 NFTs, ERC1155
- **Health Factor**: Monitored continuously
- **Liquidation Threshold**: 150% (configurable)
- **Liquidation Bonus**: 10% for liquidators
- **Oracle Integration**: Chainlink price feeds (planned)

**Key Functions**:
```solidity
function depositCollateral(address asset, uint256 amount) external
function withdrawCollateral(address asset, uint256 amount) external
function liquidate(address borrower) external
function getCollateralValue(address user) external view returns (uint256)
```

#### 📋 LoanManager Contract

**Complete loan lifecycle management**

- **Loan Terms**: 1-52 weeks flexible duration
- **Interest Calculation**: Credit score-based (8-25% APY)
- **Payment Schedule**: Weekly or bi-weekly installments
- **Grace Period**: 7 days late payment tolerance
- **Late Fees**: 2% per week after grace period
- **Status Tracking**: Pending → Active → Completed/Defaulted

**Key Functions**:
```solidity
function requestLoan(uint256 amount, address token, uint256 duration) external returns (uint256)
function approveLoan(uint256 loanId) external
function makePayment(uint256 loanId, uint256 amount) external
function getLoanDetails(uint256 loanId) external view returns (Loan memory)
```

#### 🤝 LendingCircle Contract

**Social lending circles with democratic approval**

- **Circle Creation**: Minimum 3 members
- **Voting Mechanism**: Democratic loan approval
- **Vouching System**: Members vouch for each other
- **Shared Limits**: Circle-based lending capacity
- **Reputation**: Circle-level credit building

**Key Functions**:
```solidity
function createCircle(string memory name) external returns (uint256)
function joinCircle(uint256 circleId) external
function vouchForMember(address member) external
function voteOnLoan(uint256 loanId, bool approve) external
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git**
- **MetaMask** or compatible Web3 wallet

### Quick Start (5 minutes)

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/trustcircle.git
cd trustcircle
```

2. **Install dependencies**

```bash
npm install
```

This will install dependencies for all workspace packages.

3. **Set up environment variables**

```bash
# Frontend environment
cp packages/frontend/.env.example packages/frontend/.env.local

# Contracts environment
cp packages/contracts/.env.example packages/contracts/.env.local
```

4. **Configure your environment variables**

Edit `packages/frontend/.env.local`:

```bash
# WalletConnect Project ID (Required)
# Get from: https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Celo RPC URLs (Default provided)
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org

# AI Credit Scoring (Server-side only)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Farcaster Integration (Optional)
NEXT_PUBLIC_FARCASTER_APP_FID=your_farcaster_app_fid
NEYNAR_API_KEY=your_neynar_api_key_here

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```

Edit `packages/contracts/.env.local`:

```bash
# Deployment private key (TESTNET ONLY!)
PRIVATE_KEY=your_testnet_private_key

# CeloScan API for contract verification
CELOSCAN_API_KEY=your_celoscan_api_key
```

5. **Start the development server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Getting Test Tokens

To test the application on Celo Sepolia testnet:

1. **Get CELO tokens** from the [Celo Faucet](https://faucet.celo.org/celo-sepolia)
2. **Swap for stablecoins** using [Ubeswap](https://app.ubeswap.org/) or [Mento](https://app.mento.org/)

---

## 💻 Development

### Project Structure Deep Dive

#### Frontend (`packages/frontend/`)

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── dashboard/               # Dashboard pages
│   │   ├── page.tsx
│   │   ├── loans/
│   │   ├── pools/
│   │   └── circles/
│   ├── api/                     # API routes
│   │   ├── credit-score/
│   │   └── farcaster/
│   └── providers.tsx            # Client-side providers
│
├── components/                   # React components
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── lending/                 # Lending features
│   │   ├── LoanForm.tsx
│   │   ├── LoanCard.tsx
│   │   ├── PoolStats.tsx
│   │   └── ...
│   ├── dashboard/               # Dashboard components
│   │   ├── Overview.tsx
│   │   ├── RecentActivity.tsx
│   │   └── ...
│   └── layout/                  # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
│
├── config/                      # Configuration
│   ├── wagmi.ts                # Wagmi & WalletConnect config
│   ├── chains.ts               # Chain configurations
│   └── contracts.ts            # Contract addresses & ABIs
│
├── hooks/                       # Custom React hooks
│   ├── useContracts.ts         # Contract interaction hooks
│   ├── useLoan.ts              # Loan operations
│   ├── usePool.ts              # Pool operations
│   └── ...
│
├── lib/                         # Utility functions
│   ├── utils.ts                # General utilities
│   ├── format.ts               # Formatting functions
│   └── validation.ts           # Validation functions
│
└── styles/                      # Styles
    └── globals.css             # Global CSS with Tailwind
```

#### Contracts (`packages/contracts/`)

```
contracts/
├── contracts/                   # Solidity smart contracts
│   ├── CreditScore.sol
│   ├── VerificationSBT.sol
│   ├── LendingPool.sol
│   ├── CollateralManager.sol
│   ├── LoanManager.sol
│   ├── LendingCircle.sol
│   ├── InterestCalculator.sol  # Utility contract
│   └── interfaces/             # Contract interfaces
│
├── scripts/                     # Deployment & utility scripts
│   ├── deploy.ts               # Main deployment script
│   ├── verify-contracts.ts     # Contract verification
│   └── ...
│
├── test/                        # Contract tests
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── security/               # Security tests
│
├── deployments.json            # Deployed contract addresses
├── hardhat.config.ts          # Hardhat configuration
└── tsconfig.json              # TypeScript config
```

### Development Workflow

#### 1. Frontend Development

```bash
# Start dev server with hot reload
cd packages/frontend
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Lint code
npm run lint
```

#### 2. Smart Contract Development

```bash
cd packages/contracts

# Compile contracts
npm run compile

# Run tests
npm run test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:security

# Check test coverage
npm run test:coverage

# Deploy to testnet
npm run deploy:sepolia

# Verify contracts
npm run verify
```

#### 3. Working with WalletConnect

**Setup WalletConnect Project**:

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Configure Wagmi** (`packages/frontend/config/wagmi.ts`):

```typescript
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { celo, celoAlfajores } from '@reown/appkit/networks'

// Project configuration
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!

// Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [celo, celoAlfajores],
  projectId,
})

// Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [celo, celoAlfajores],
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
})
```

#### 4. Integrating with Smart Contracts

**Using Contract Hooks**:

```typescript
// hooks/useContracts.ts
import { useContractRead, useContractWrite } from 'wagmi'
import { LOAN_MANAGER_ABI, LOAN_MANAGER_ADDRESS } from '@/config/contracts'

export function useLoanManager() {
  // Read contract data
  const { data: loans } = useContractRead({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'getUserLoans',
    args: [userAddress],
  })

  // Write to contract
  const { write: requestLoan } = useContractWrite({
    address: LOAN_MANAGER_ADDRESS,
    abi: LOAN_MANAGER_ABI,
    functionName: 'requestLoan',
  })

  return { loans, requestLoan }
}
```

**Component Usage**:

```typescript
// components/lending/LoanForm.tsx
'use client'

import { useLoanManager } from '@/hooks/useContracts'
import { parseUnits } from 'viem'

export function LoanForm() {
  const { requestLoan } = useLoanManager()

  const handleSubmit = async (data: LoanFormData) => {
    try {
      await requestLoan({
        args: [
          parseUnits(data.amount, 18),
          data.token,
          data.duration,
        ],
      })
      // Success handling
    } catch (error) {
      // Error handling
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### Code Quality & Standards

#### TypeScript Configuration

All packages use strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Linting & Formatting

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

#### Pre-commit Hooks

Configured with Husky:

- Lint staged files
- Run type checking
- Format code
- Run tests (unit only)

---

## 🚢 Deployment

### Frontend Deployment (Vercel)

**Automated Deployment**:

1. Push to `main` branch
2. Vercel automatically builds and deploys
3. Preview deployments for PRs

**Manual Deployment**:

```bash
cd packages/frontend

# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel
vercel --prod
```

**Environment Variables on Vercel**:

Set these in your Vercel project settings:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_DEFAULT_NETWORK`
- `ANTHROPIC_API_KEY`
- `NEYNAR_API_KEY`

### Smart Contract Deployment

**Prerequisites**:

1. Get testnet CELO from [faucet](https://faucet.celo.org/celo-sepolia)
2. Set `PRIVATE_KEY` in `.env.local`
3. Get CeloScan API key for verification

**Deploy to Celo Sepolia Testnet**:

```bash
cd packages/contracts

# Deploy all contracts
npm run deploy:sepolia

# Verify contracts
npx hardhat run scripts/verify-contracts.ts --network celoSepolia
```

**Deploy to Celo Mainnet**:

⚠️ **WARNING**: Only after thorough testing and security audit!

```bash
# Use multi-sig wallet for deployment
npm run deploy:celo
```

**Post-Deployment**:

1. Update contract addresses in `packages/frontend/config/contracts.ts`
2. Commit `deployments.json`
3. Update documentation
4. Announce on community channels

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd packages/contracts

# Run all tests
npm run test

# Run specific test suite
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:security      # Security tests

# Test with coverage
npm run test:coverage

# Test with gas reporting
npm run test:gas
```

**Test Coverage Goals**:
- ✅ Unit Tests: >80% coverage
- ✅ Integration Tests: All user flows
- ✅ Security Tests: All attack vectors

### Frontend Tests

```bash
cd packages/frontend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test with UI
npm run test:ui
npm run test:e2e:ui

# Coverage
npm run test:coverage
```

### Manual Testing Checklist

#### Wallet Connection
- [ ] MetaMask connection
- [ ] WalletConnect connection
- [ ] Network switching
- [ ] Account switching

#### Lending Features
- [ ] Deposit to pool
- [ ] Withdraw from pool
- [ ] Request loan
- [ ] Make payment
- [ ] View loan history

#### Verification
- [ ] Complete basic verification
- [ ] Check credit score
- [ ] View verification status

#### Social Features
- [ ] Create lending circle
- [ ] Join circle
- [ ] Vote on loan
- [ ] Vouch for member

---

## 🔒 Security

### Security Best Practices

#### Smart Contracts

✅ **Implemented**:
- OpenZeppelin security-audited contracts
- Reentrancy protection (ReentrancyGuard)
- Access control (Role-based)
- Pausable functionality
- Upgradeable pattern (UUPS)
- SafeERC20 for token transfers
- Input validation
- Integer overflow protection (Solidity 0.8+)

⏳ **Planned**:
- Professional security audit
- Bug bounty program
- Multi-signature admin operations
- Timelock for upgrades
- Emergency response procedures

#### Frontend

✅ **Implemented**:
- Environment variable security
- Client-side input validation
- HTTPS enforcement
- CSP headers
- XSS protection

⏳ **Planned**:
- Rate limiting
- DDoS protection
- Advanced monitoring

### Security Audit

**Pre-Mainnet Requirements**:

1. **Professional Audit**:
   - Engage reputable auditing firm
   - Full smart contract review
   - Penetration testing
   - Budget: $10,000 - $30,000

2. **Bug Bounty Program**:
   - Launch on Immunefi or HackerOne
   - Tiered rewards system
   - Public disclosure policy

3. **Monitoring**:
   - Real-time transaction monitoring
   - Anomaly detection
   - Automated alerts

### Responsible Disclosure

Found a security issue? Please email: security@trustcircle.io

**Do NOT** open a public issue for security vulnerabilities.

---

## 🗺 Roadmap

### Phase 1: MVP (Completed ✅)

- [x] Smart contract development
- [x] Frontend basic UI
- [x] WalletConnect integration
- [x] Testnet deployment
- [x] Contract verification
- [x] Basic lending features

### Phase 2: Beta (In Progress 🚧)

- [ ] Frontend completion
- [ ] AI credit scoring integration
- [ ] Farcaster social features
- [ ] Comprehensive testing
- [ ] Bug fixes and optimizations
- [ ] User documentation

**ETA: Q1 2025**

### Phase 3: Security Audit (Planned 📋)

- [ ] Professional security audit
- [ ] Penetration testing
- [ ] Bug bounty program
- [ ] Code optimization
- [ ] Final security fixes

**ETA: Q2 2025**

### Phase 4: Mainnet Launch (Planned 🎯)

- [ ] Mainnet deployment
- [ ] Marketing campaign
- [ ] User onboarding
- [ ] Community building
- [ ] Partnership announcements

**ETA: Q3 2025**

### Phase 5: Scaling (Future 🚀)

- [ ] Mobile app development
- [ ] Multi-chain expansion (Polygon, Optimism)
- [ ] Advanced features (Flash loans, Yield farming)
- [ ] Governance token launch
- [ ] DAO formation

**ETA: Q4 2025+**

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs**: Open an issue with detailed information
- 💡 **Suggest Features**: Share your ideas for improvements
- 📝 **Improve Documentation**: Help make our docs better
- 💻 **Submit Code**: Fix bugs or add features via PRs
- 🧪 **Write Tests**: Increase test coverage
- 🎨 **Design**: Improve UI/UX

### Development Process

1. **Fork the repository**

```bash
git clone https://github.com/yourusername/trustcircle.git
cd trustcircle
```

2. **Create a feature branch**

```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**

- Follow code style guidelines
- Write tests for new features
- Update documentation

4. **Run tests**

```bash
npm run test
npm run lint
```

5. **Commit your changes**

```bash
git commit -m "feat: add amazing feature"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

6. **Push and create PR**

```bash
git push origin feature/amazing-feature
```

Then open a Pull Request on GitHub.

### Code Review Process

1. All PRs require review from maintainers
2. CI/CD checks must pass
3. Test coverage must not decrease
4. Documentation must be updated

### Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)
- Ask questions in discussions, not issues

---

## 📖 Documentation

### Additional Resources

- [Quick Start Guide](QUICK_START.md)
- [Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Security Documentation](SECURITY.md)
- [API Documentation](docs/API.md)
- [Smart Contract Documentation](packages/contracts/README.md)

### External Links

- [Celo Documentation](https://docs.celo.org/)
- [Mento Protocol](https://docs.mento.org/)
- [WalletConnect Docs](https://docs.reown.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 💬 Community

Stay connected with the TrustCircle community:

- **Discord**: [Join our server](#) (Coming Soon)
- **Twitter**: [@TrustCircle](#) (Coming Soon)
- **Telegram**: [TrustCircle Community](#) (Coming Soon)
- **Forum**: [Discuss](https://github.com/yourusername/trustcircle/discussions)
- **Blog**: [Medium](#) (Coming Soon)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- OpenZeppelin Contracts: MIT License
- Next.js: MIT License
- React: MIT License
- Wagmi: MIT License
- Other dependencies: See individual package licenses

---

## 🙏 Acknowledgments

### Built With

- **[Celo](https://celo.org/)** - Mobile-first blockchain platform
- **[Mento Protocol](https://mento.org/)** - Stablecoin infrastructure
- **[OpenZeppelin](https://openzeppelin.com/)** - Secure smart contract library
- **[WalletConnect](https://walletconnect.com/)** - Web3 wallet connection
- **[Anthropic Claude](https://www.anthropic.com/)** - AI credit scoring
- **[Farcaster](https://www.farcaster.xyz/)** - Decentralized social network

### Special Thanks

- Celo Foundation for grants and support
- OpenZeppelin for security tools
- The open-source community

---

## ⚠️ Disclaimer

**IMPORTANT NOTICES**:

1. **Experimental Software**: TrustCircle is currently in beta. Use at your own risk.

2. **Not Financial Advice**: Nothing on this platform constitutes financial advice. Do your own research.

3. **Regulatory Compliance**: Users are responsible for compliance with local regulations.

4. **Smart Contract Risks**: While we've implemented security best practices, smart contracts carry inherent risks.

5. **No Guarantees**: We make no guarantees about loan repayment, returns, or platform availability.

6. **Testnet Only**: Current deployment is on testnet. Do not use real funds.

---

## 📊 Project Status

| Category | Status |
|----------|--------|
| Smart Contracts | ✅ Deployed & Verified |
| Frontend | 🚧 In Development |
| Testing | ✅ Comprehensive Tests |
| Security Audit | 📋 Planned |
| Documentation | ✅ Complete |
| Mainnet | 📋 Planned Q3 2025 |

---

## 📞 Contact

**Questions? Feedback? Issues?**

- **Email**: contact@trustcircle.io
- **GitHub Issues**: [Report a bug](https://github.com/yourusername/trustcircle/issues)
- **Discussions**: [Ask a question](https://github.com/yourusername/trustcircle/discussions)

---

<div align="center">

**Made with ❤️ by the TrustCircle Team**

⭐ Star us on GitHub if you find this project useful!

[Website](#) | [Twitter](#) | [Discord](#) | [Documentation](#)

</div>
