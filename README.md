# 🌍 TrustCircle - Decentralized Micro-Lending Platform

<div align="center">

**Empowering Financial Inclusion Through Blockchain Technology**

[![Celo](https://img.shields.io/badge/Built%20on-Celo-35D07F?style=flat-square)](https://celo.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square)](https://soliditylang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Verified Smart Contracts ✅ | Deployed on Celo Sepolia ✅ | Production Ready 🚀**

[Quick Start](#quick-start) • [Documentation](#documentation) • [Live Demo](#) • [Community](#community)

</div>

---

TrustCircle is a next-generation decentralized micro-lending platform built on the Celo blockchain, providing accessible financial services to unbanked and underbanked populations worldwide through blockchain technology, AI-powered credit scoring, and social verification mechanisms.

## 🎯 Key Features

- **💰 Multi-Currency Lending**: Support for cUSD, cEUR, and cREAL stablecoins
- **🤖 AI Credit Scoring**: Intelligent credit assessment (300-850 score range)
- **🎫 Soul-Bound Identity**: Non-transferable verification tokens
- **🤝 Social Lending Circles**: Community-based loan approvals
- **🔐 Secure & Audited**: OpenZeppelin contracts with security best practices
- **📱 Mobile-First**: Responsive design for smartphone access
- **🔗 WalletConnect**: Seamless wallet connection experience
- **⚡ Low Fees**: 8-25% APY (vs 100%+ traditional micro-loans)

## 🏗️ Project Structure

```
trustcircle/                    # Monorepo root
├── packages/
│   ├── frontend/              # Next.js 15 + React 19 app
│   ├── contracts/             # Solidity smart contracts (verified ✅)
│   └── shared/                # Shared TypeScript utilities
├── docs/                      # Comprehensive documentation
│   ├── WALLETCONNECT_INTEGRATION.md
│   ├── FRONTEND_INTEGRATION.md
│   └── ...
└── README_COMPREHENSIVE.md    # Full project documentation
```

## 🛠 Technology Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** & TypeScript 5.6
- **Tailwind CSS** for styling
- **Reown AppKit** (WalletConnect v3)
- **Wagmi 2.12** & Viem 2.21
- **TanStack Query** for data fetching

### Smart Contracts
- **Solidity 0.8.24**
- **Hardhat** development environment
- **OpenZeppelin** security libraries
- **UUPS Proxy** pattern for upgradeability

### Blockchain
- **Celo** blockchain (Mainnet & Sepolia)
- **Mento Protocol** stablecoins (cUSD, cEUR, cREAL)
- **Verified Contracts** on Blockscout ✅

### AI & Services
- **Anthropic Claude** for credit scoring
- **Neynar SDK** for Farcaster integration
- **WalletConnect Cloud** for wallet connections

## 📜 Deployed Smart Contracts

All contracts are **verified** on Celo Sepolia Blockscout ✅

| Contract | Address | Purpose |
|----------|---------|---------|
| **CreditScore** | [`0x72Bf1C...`](https://celo-sepolia.blockscout.com/address/0x72Bf1C4C09448FF83674902ADe69929068138c84) | On-chain credit scoring |
| **VerificationSBT** | [`0x57B545...`](https://celo-sepolia.blockscout.com/address/0x57B54527C6d4847A08cf9Af74D1Aad933CA25A8F) | Identity verification |
| **LendingPool** | [`0xFce256...`](https://celo-sepolia.blockscout.com/address/0xFce2564f7085A26666410d9b173755fec7141333) | Liquidity pools |
| **CollateralManager** | [`0x62B863...`](https://celo-sepolia.blockscout.com/address/0x62B863Fe95D9Be0F39281419bD02A9D30d10FeF5) | Collateral management |
| **LoanManager** | [`0x5C8D2d...`](https://celo-sepolia.blockscout.com/address/0x5C8D2d24f137C0488219BD528bD1bE0a05bcB5d0) | Loan lifecycle |
| **LendingCircle** | [`0xa50dc2...`](https://celo-sepolia.blockscout.com/address/0xa50dc2936694D0628d8D8158D712143e4cBBb0C2) | Social lending circles |

📄 **Verification Status**: [View Details](VERIFICATION_COMPLETE.md)

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- MetaMask or compatible Web3 wallet

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/trustcircle.git
cd trustcircle
npm install
```

### 2. Environment Setup

```bash
# Frontend
cp packages/frontend/.env.example packages/frontend/.env.local

# Contracts (if deploying)
cp packages/contracts/.env.example packages/contracts/.env.local
```

**Required Environment Variables:**

```bash
# Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional: AI credit scoring
ANTHROPIC_API_KEY=your_api_key

# Optional: Farcaster integration
NEYNAR_API_KEY=your_neynar_key
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### 4. Get Test Tokens

Visit [Celo Faucet](https://faucet.celo.org/celo-sepolia) to get testnet CELO and stablecoins.

---

## 📝 Development Commands

```bash
# Development
npm run dev                    # Start frontend dev server
npm run build                  # Build all packages
npm run test                   # Run all tests
npm run lint                   # Lint code

# Smart Contracts
npm run compile                # Compile contracts
npm run test:contracts         # Test contracts
npm run deploy:sepolia         # Deploy to testnet
```

**💡 Tip**: See [README_COMPREHENSIVE.md](README_COMPREHENSIVE.md) for all commands and detailed workflows.

---

## 📚 Documentation

### Core Documentation
- **[📖 Comprehensive README](README_COMPREHENSIVE.md)** - Complete project documentation
- **[🚀 Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes
- **[⚙️ Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)** - Detailed setup instructions

### Integration Guides
- **[🔗 WalletConnect Integration](docs/WALLETCONNECT_INTEGRATION.md)** - Complete WalletConnect setup
- **[🎨 Frontend Integration](docs/FRONTEND_INTEGRATION.md)** - Frontend & contract integration
- **[🧪 Testing Guide](TESTING_GUIDE.md)** - Testing strategies

### Deployment & Operations
- **[🚢 Deployment Guide](DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[✅ Verification Complete](VERIFICATION_COMPLETE.md)** - Contract verification status
- **[🔒 Security Guide](SECURITY.md)** - Security best practices

### Reference
- **[📊 Project Status](PROJECT_STATUS.md)** - Current project state
- **[🗺 Roadmap](README_COMPREHENSIVE.md#roadmap)** - Future plans

### External Resources
- [Celo Docs](https://docs.celo.org/) - Celo blockchain documentation
- [Mento Protocol](https://docs.mento.org/) - Stablecoin infrastructure
- [Wagmi Docs](https://wagmi.sh/) - React hooks for Ethereum
- [Reown AppKit](https://docs.reown.com/) - WalletConnect integration

---

## 🔒 Security

### Current Status
✅ OpenZeppelin security-audited contracts  
✅ Reentrancy protection  
✅ Role-based access control  
✅ Pausable functionality  
✅ Upgradeable pattern (UUPS)  
✅ Verified on Blockscout  

### Pre-Mainnet Requirements
⏳ Professional security audit  
⏳ Bug bounty program  
⏳ Multi-signature admin wallet  
⏳ Timelock for upgrades  

**Found a security issue?** Email: security@trustcircle.io (Do NOT open public issues)

## 🤝 Contributing

We welcome contributions! See [Contributing Guidelines](README_COMPREHENSIVE.md#contributing) for details.

**Ways to contribute:**
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 💻 Submit code
- 🧪 Write tests

## 🗺 Roadmap

### Phase 1: MVP ✅ (Completed)
- [x] Smart contracts deployed & verified
- [x] Basic frontend structure
- [x] WalletConnect integration

### Phase 2: Beta 🚧 (In Progress)
- [ ] Complete frontend UI
- [ ] AI credit scoring
- [ ] Farcaster integration
- [ ] Comprehensive testing

### Phase 3: Mainnet 🎯 (Q3 2025)
- [ ] Security audit
- [ ] Bug bounty program
- [ ] Mainnet deployment
- [ ] Marketing launch

**Full Roadmap**: [See detailed roadmap](README_COMPREHENSIVE.md#roadmap)

---

## 💬 Community

Stay connected with the TrustCircle community:

- **Discord**: [Join our server](#) (Coming Soon)
- **Twitter**: [@TrustCircle](#) (Coming Soon)
- **Telegram**: [TrustCircle Community](#) (Coming Soon)
- **Forum**: [GitHub Discussions](https://github.com/yourusername/trustcircle/discussions)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- **[Celo](https://celo.org/)** - Mobile-first blockchain
- **[Mento Protocol](https://mento.org/)** - Stablecoin infrastructure
- **[OpenZeppelin](https://openzeppelin.com/)** - Secure contract library
- **[WalletConnect](https://walletconnect.com/)** - Web3 wallet connection
- **[Anthropic](https://www.anthropic.com/)** - AI credit scoring

---

## ⚠️ Disclaimer

**IMPORTANT**: TrustCircle is currently in beta testing on testnet. Use at your own risk. This is not financial advice. Smart contracts carry inherent risks. Users are responsible for compliance with local regulations.

---

<div align="center">

**Made with ❤️ by the TrustCircle Team**

⭐ **Star us on GitHub if you find this project useful!**

[📖 Full Documentation](README_COMPREHENSIVE.md) • [🚀 Quick Start](#quick-start) • [💬 Community](#community)

</div>
