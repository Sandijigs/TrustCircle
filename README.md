# TrustCircle - Web3 Micro-Lending Platform (Monorepo)

TrustCircle is a verified micro-lending platform built on the Celo blockchain, combining KYC/AML verification, DeFi lending pools, AI-powered credit scoring, and Farcaster social integration to provide accessible micro-loans in stablecoins.

## 🏗️ Monorepo Structure

This project is organized as a monorepo using npm workspaces:

```
trustcircle/
├── packages/
│   ├── frontend/          # Next.js web application
│   ├── contracts/         # Solidity smart contracts
│   └── shared/            # Shared types and utilities
├── package.json           # Root workspace configuration
└── README.md              # This file
```

## 📦 Packages

### 🎨 `@trustcircle/frontend`

Next.js 15 web application with React 19, TypeScript, and Tailwind CSS.

**Features:**
- WalletConnect integration (Reown AppKit)
- Multi-currency support (cUSD, cEUR, cREAL)
- Responsive mobile-first design
- Dark mode support
- Real-time blockchain interactions

**Tech Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Wagmi + Viem
- TanStack React Query

**Location:** `packages/frontend/`

### 📝 `@trustcircle/contracts`

Solidity smart contracts for the lending platform.

**Contracts:**
- **LendingPool.sol** - Main lending pool with dynamic interest rates
- **LoanManager.sol** - Loan lifecycle management
- **LendingCircle.sol** - Social lending circles
- **CreditScore.sol** - On-chain credit score storage
- **CollateralManager.sol** - Collateral management and liquidation
- **VerificationSBT.sol** - Soul Bound Token for identity verification

**Tech Stack:**
- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts
- Hardhat Viem plugin

**Location:** `packages/contracts/`

### 🔗 `@trustcircle/shared`

Shared TypeScript types, constants, and utilities used across all packages.

**Exports:**
- Type definitions (Loan, Pool, Circle, etc.)
- Constants (chain IDs, token addresses, rates)
- Utility functions (formatting, calculations, validation)

**Location:** `packages/shared/`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

This will install dependencies for all packages in the monorepo.

2. **Set up environment variables:**

```bash
# Copy environment templates
cp packages/frontend/.env.example packages/frontend/.env.local
cp packages/contracts/.env.example packages/contracts/.env.local

# Edit with your API keys
nano packages/frontend/.env.local
```

Required variables:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - From [WalletConnect Cloud](https://cloud.walletconnect.com/)
- `ANTHROPIC_API_KEY` - From [Anthropic Console](https://console.anthropic.com/)
- `PRIVATE_KEY` - Your wallet private key (testnet only!)

---

## 📝 Development Commands

### Root Commands (run from project root)

```bash
# Development
npm run dev                    # Start frontend dev server
npm run dev:frontend          # Start frontend dev server (explicit)

# Build
npm run build                 # Build all packages
npm run build:frontend        # Build frontend only
npm run build:contracts       # Compile smart contracts

# Test
npm run test                  # Run all tests
npm run test:contracts        # Run contract tests only

# Smart Contracts
npm run compile               # Compile Solidity contracts
npm run deploy:alfajores      # Deploy to Alfajores testnet
npm run deploy:celo           # Deploy to Celo mainnet

# Utilities
npm run lint                  # Lint all packages
npm run clean                 # Clean all build artifacts
```

### Package-Specific Commands

#### Frontend (packages/frontend)

```bash
cd packages/frontend

npm run dev                   # Start dev server (http://localhost:3000)
npm run build                 # Build for production
npm run start                 # Start production server
npm run lint                  # Run ESLint
```

#### Contracts (packages/contracts)

```bash
cd packages/contracts

npm run compile               # Compile contracts
npm run test                  # Run tests
npm run deploy:alfajores      # Deploy to Alfajores
npm run deploy:celo           # Deploy to Celo
npm run verify                # Verify contracts on CeloScan
npm run clean                 # Clean artifacts
```

#### Shared (packages/shared)

```bash
cd packages/shared

npm run build                 # Build TypeScript
npm run dev                   # Watch mode
```

## 🔗 Network Configuration

### Celo Alfajores Testnet
- Chain ID: 44787
- RPC: https://alfajores-forno.celo-testnet.org
- Explorer: https://alfajores.celoscan.io
- Faucet: https://faucet.celo.org

### Celo Mainnet
- Chain ID: 42220
- RPC: https://forno.celo.org
- Explorer: https://celoscan.io

## 💰 Supported Stablecoins (Mento)

- **cUSD**: Celo Dollar (US Dollar)
- **cEUR**: Celo Euro
- **cREAL**: Brazilian Real

## 🧪 Testing

Get testnet tokens:
1. Visit [Celo Faucet](https://faucet.celo.org)
2. Connect your wallet
3. Request CELO, cUSD, cEUR, or cREAL

## 📚 Documentation

- [Celo Documentation](https://docs.celo.org/)
- [Mento Protocol](https://docs.mento.org/)
- [Wagmi Documentation](https://wagmi.sh/)
- [WalletConnect (Reown) Docs](https://docs.reown.com/)
- [Hardhat Documentation](https://hardhat.org/docs)

## 🔐 Security Considerations

- Never commit private keys or sensitive data
- All smart contracts should be audited before mainnet deployment
- KYC/AML compliance required for regulatory adherence
- Rate limiting on AI credit scoring API
- Multi-signature wallets for admin functions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built on [Celo](https://celo.org/) blockchain
- Powered by [Mento](https://mento.org/) stablecoins
- Credit scoring by [Claude AI](https://www.anthropic.com/claude)
- Social features via [Farcaster](https://www.farcaster.xyz/)

## 📞 Support

- Documentation: [Coming Soon]
- Discord: [Coming Soon]
- Twitter: [Coming Soon]

---

**⚠️ Disclaimer**: TrustCircle is experimental software. Use at your own risk. This is not financial advice.
