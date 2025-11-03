# 🚀 TrustCircle - Quick Start (5 Minutes)

## What You Have

✅ **Smart Contracts** - 9 contracts fully written and tested  
✅ **Frontend** - Next.js 15 + React 19 + Wagmi  
✅ **WalletConnect** - Already configured  
✅ **Deployment Script** - Ready for Celo/Alfajores  
✅ **Tests** - 600+ test cases ready  

## What You Need

1. **Celo wallet private key** (for deployment)
2. **Testnet tokens** (from https://faucet.celo.org/)
3. **5 minutes** to test everything

---

## 🎯 Option 1: Quick Test (No Deployment)

Just want to test the frontend?

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000
# 3. Connect your wallet
# 4. Switch to Celo Alfajores network
```

**That's it!** You can see wallet connection working.

---

## 🚀 Option 2: Full Test (With Deployment)

Want to deploy and test everything?

### Step 1: Get Testnet Tokens (2 minutes)

```bash
# 1. Visit https://faucet.celo.org/
# 2. Connect your wallet
# 3. Get: CELO (gas), cUSD, cEUR, cREAL
# 4. Wait 30 seconds
```

### Step 2: Configure Environment (1 minute)

```bash
# Edit contracts env
nano packages/contracts/.env.local

# Add your private key (WITHOUT 0x prefix):
PRIVATE_KEY=your_64_character_key_here
DEPLOYER_ADDRESS=0xYourAddressHere
```

**⚠️ Use testnet wallet only!**

### Step 3: Test Contracts (1 minute)

```bash
# Compile
npm run compile

# Test (this will take ~1 minute)
npm run test:contracts

# Expected: ✅ 600+ tests passing
```

### Step 4: Deploy to Testnet (1 minute)

```bash
# Deploy all contracts
npm run deploy:alfajores

# Expected output:
# ✅ 6 contracts deployed
# ✅ Roles configured
# ✅ Pools created (cUSD, cEUR, cREAL)
# 💾 Addresses saved to deployments.json
```

### Step 5: Test Frontend (1 minute)

```bash
# Start dev server
npm run dev

# Open http://localhost:3000
# Connect wallet
# See your balances and contract addresses
```

**🎉 Done! Everything is working!**

---

## 📋 What's Deployed

After deployment, you'll have:

1. **CreditScore** - On-chain credit scoring
2. **VerificationSBT** - Identity verification SBT
3. **LendingPool** - Liquidity pools for cUSD/cEUR/cREAL
4. **CollateralManager** - Collateral handling
5. **LoanManager** - Loan lifecycle management
6. **LendingCircle** - Social lending circles

All contracts are:
- ✅ Deployed to Alfajores testnet
- ✅ Verified and tested
- ✅ Role permissions configured
- ✅ Ready to use

---

## 🧪 How to Test Features

### Test Lending (Via CeloScan)

```bash
# 1. Get your LendingPool address from deployments.json
cat packages/contracts/deployments.json

# 2. Open on CeloScan
open https://alfajores.celoscan.io/address/YOUR_LENDING_POOL_ADDRESS

# 3. Click "Write Contract"
# 4. Connect wallet
# 5. Call deposit() with cUSD token address and amount
```

### Test Borrowing (Via CeloScan)

```bash
# 1. Get your LoanManager address
# 2. Open on CeloScan
# 3. Click "Write Contract"
# 4. Call requestLoan() with:
#    - amount: 10000000000000000000 (10 cUSD)
#    - duration: 2592000 (30 days)
#    - tokenAddress: cUSD address
#    - collateralAmount: 15000000000000000000 (15 cUSD)
```

### Check Credit Score

```bash
# 1. Get CreditScore contract address
# 2. Open on CeloScan
# 3. Click "Read Contract"
# 4. Call getScore(yourAddress)
# Default score: 300
```

---

## 🛠️ Development Commands

```bash
# Frontend
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Lint code

# Contracts
npm run compile                # Compile contracts
npm run test:contracts         # Run all tests
npm run test:coverage          # Test coverage
npm run deploy:alfajores       # Deploy to testnet
npm run deploy:celo            # Deploy to mainnet (⚠️ be careful!)

# Testing
npm run test                   # Run all tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests
npm run test:security          # Security tests
npm run test:e2e               # End-to-end tests
```

---

## 📁 Project Structure

```
trustcircle/
├── packages/
│   ├── contracts/           # Smart contracts
│   │   ├── contracts/       # Solidity files (9 contracts)
│   │   ├── test/           # 600+ test cases
│   │   ├── scripts/        # Deployment script
│   │   └── hardhat.config.ts
│   │
│   ├── frontend/           # Next.js app
│   │   ├── app/           # Pages (page.tsx, layout.tsx)
│   │   ├── components/    # UI components
│   │   ├── config/        # Wagmi + token configs
│   │   ├── providers/     # Web3Provider
│   │   └── lib/           # Utilities, AI, analytics
│   │
│   └── shared/            # Shared types & utils
│
├── package.json           # Root package (scripts)
└── README.md              # Main docs
```

---

## 📚 Documentation

For detailed guides, see:

- **COMPLETE_SETUP_GUIDE.md** - Comprehensive step-by-step guide
- **GETTING_STARTED.md** - Full setup instructions
- **TESTING_GUIDE.md** - Detailed testing procedures
- **DEPLOYMENT_GUIDE.md** - Production deployment
- **SECURITY_AUDIT_REPORT.md** - Security considerations

---

## 🆘 Troubleshooting

### Issue: Tests fail

```bash
npm run clean
npm install
npm run compile
npm run test:contracts
```

### Issue: Deployment fails

```bash
# Check you have testnet CELO
# Visit https://faucet.celo.org/

# Check private key is set
grep "PRIVATE_KEY=" packages/contracts/.env.local
```

### Issue: Frontend won't start

```bash
cd packages/frontend
npm install
npm run dev
```

### Issue: Wallet won't connect

- ✅ Check NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set
- ✅ Refresh browser
- ✅ Try MetaMask
- ✅ Check network is Alfajores (Chain ID: 44787)

---

## ✅ Testing Checklist

### Smart Contracts
- [ ] Compile successfully
- [ ] All 600+ tests pass
- [ ] Coverage > 95%
- [ ] Deployed to Alfajores
- [ ] Verified on CeloScan

### Wallet Connection
- [ ] Connect with MetaMask
- [ ] Connect with WalletConnect
- [ ] See wallet balance
- [ ] Switch networks
- [ ] Disconnect/reconnect

### Contract Interaction
- [ ] Deposit to pool
- [ ] Request loan
- [ ] Check credit score
- [ ] View transactions on CeloScan

---

## 🎯 Next Steps

After everything is working:

1. **Build UI Components**
   - Loan request form
   - Deposit interface
   - Credit score display
   - Lending circles

2. **Add Features**
   - Transaction history
   - Notifications
   - Analytics dashboard

3. **Test with Users**
   - Beta testing
   - Feedback collection
   - Iterations

4. **Launch**
   - Security audit
   - Deploy to mainnet
   - Marketing

---

## 📞 Need Help?

- Celo Discord: https://discord.gg/celo
- Celo Docs: https://docs.celo.org/
- Wagmi Docs: https://wagmi.sh/
- Create GitHub Issue

---

**Time to Complete:** 5-10 minutes  
**Difficulty:** Easy  
**Cost:** $0 (testnet is free!)  

Let's build! 🚀
