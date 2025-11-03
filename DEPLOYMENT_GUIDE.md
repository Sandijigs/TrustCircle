# TrustCircle Deployment Guide

## 🎯 Overview

Comprehensive guide for deploying TrustCircle to Celo testnet (Alfajores) and mainnet.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Network Information](#network-information)
3. [Deployment Process](#deployment-process)
4. [Contract Verification](#contract-verification)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Frontend Deployment](#frontend-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- ✅ All tests passing (run `npm test`)
- ✅ Environment variables configured
- ✅ Deployer wallet funded with CELO
- ✅ WalletConnect Project ID obtained

### For Mainnet (Additional)

- ✅ Security audit completed
- ✅ Multi-sig wallets set up
- ✅ Timelock contract ready
- ✅ Emergency procedures documented
- ✅ Legal review completed

---

## Network Information

### Celo Alfajores (Testnet)

```
Network Name: Celo Alfajores Testnet
RPC URL: https://alfajores-forno.celo-testnet.org
Chain ID: 44787
Currency Symbol: CELO
Block Explorer: https://alfajores.celoscan.io
```

**Test Tokens:**
- cUSD: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
- cEUR: `0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F`
- cREAL: `0xE4D517785D091D3c54818832dB6094bcc2744545`

**Get Test Funds:**
- Faucet: https://faucet.celo.org/

### Celo Mainnet (Production)

```
Network Name: Celo Mainnet
RPC URL: https://forno.celo.org
Chain ID: 42220
Currency Symbol: CELO
Block Explorer: https://celoscan.io
```

**Production Tokens:**
- cUSD: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- cEUR: `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73`
- cREAL: `0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787`

---

## Deployment Process

### Step 1: Pre-Deployment Checks

```bash
# 1. Verify environment setup
cd packages/contracts
cat .env.local

# 2. Check deployer balance
# Go to: https://alfajores.celoscan.io/address/YOUR_ADDRESS
# Ensure you have at least 2 CELO for gas

# 3. Run final tests
npm test

# 4. Compile contracts
npm run compile

# 5. Check for security issues
npm run security:scan
```

### Step 2: Deploy to Alfajores (Testnet)

```bash
# From root directory
npm run deploy:alfajores

# Or from contracts directory
cd packages/contracts
npx hardhat run scripts/deploy.ts --network alfajores
```

**Expected Duration:** 3-5 minutes

**What Happens:**
1. ✅ Deploys CreditScore contract (UUPS proxy)
2. ✅ Deploys VerificationSBT contract
3. ✅ Deploys LendingPool contract
4. ✅ Whitelists Mento stablecoins (cUSD, cEUR, cREAL)
5. ✅ Creates pools for each token
6. ✅ Deploys CollateralManager contract
7. ✅ Adds supported collateral assets
8. ✅ Deploys LoanManager contract
9. ✅ Deploys LendingCircle contract
10. ✅ Sets up all roles and permissions
11. ✅ Saves addresses to `deployments.json`

**Example Output:**

```
🚀 Starting TrustCircle deployment...

Deploying contracts with account: 0x1234...5678
Account balance: 5.0 CELO

📊 Deploying CreditScore...
✅ CreditScore deployed to: 0xABC...123
   Granted AI_AGENT_ROLE to deployer

🎫 Deploying VerificationSBT...
✅ VerificationSBT deployed to: 0xDEF...456
   Set base URI for verification metadata

💰 Deploying LendingPool...
✅ LendingPool deployed to: 0xGHI...789
   Whitelisting Alfajores tokens...
   ✓ Whitelisted cUSD
   ✓ Whitelisted cEUR
   ✓ Whitelisted cREAL
   Creating pools for whitelisted tokens...
   ✓ Created cUSD pool
   ✓ Created cEUR pool
   ✓ Created cREAL pool

🔐 Deploying CollateralManager...
✅ CollateralManager deployed to: 0xJKL...012
   Added Mento stablecoins as supported collateral

📋 Deploying LoanManager...
✅ LoanManager deployed to: 0xMNO...345

🤝 Deploying LendingCircle...
✅ LendingCircle deployed to: 0xPQR...678

🔑 Setting up role permissions...
   ✓ Granted LOAN_MANAGER_ROLE to LoanManager on LendingPool
   ✓ Granted LOAN_MANAGER_ROLE to LoanManager on CollateralManager
   ✓ Granted SCORE_UPDATER_ROLE to LoanManager on CreditScore
   ✓ Granted APPROVER_ROLE to LendingCircle on LoanManager

============================================================
🎉 DEPLOYMENT COMPLETE!
============================================================

📝 Contract Addresses:
------------------------------------------------------------
CreditScore:        0xABC...123
VerificationSBT:    0xDEF...456
LendingPool:        0xGHI...789
CollateralManager:  0xJKL...012
LoanManager:        0xMNO...345
LendingCircle:      0xPQR...678
------------------------------------------------------------

💰 Mento Token Pools Created:
------------------------------------------------------------
cUSD:  0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
cEUR:  0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F
cREAL: 0xE4D517785D091D3c54818832dB6094bcc2744545
------------------------------------------------------------

📋 Next Steps:
1. Verify contracts on CeloScan
2. Update frontend config with contract addresses
3. Set up AI agent with API keys
4. Configure verification providers
5. Test with small amounts on testnet

✅ Ready for testing!

💾 Deployment addresses saved to deployments.json
```

### Step 3: Verify Deployment

```bash
# Check deployments.json was created
cat packages/contracts/deployments.json

# Should see:
# {
#   "alfajores": {
#     "network": "alfajores",
#     "deployer": "0x...",
#     "timestamp": "2025-11-02T...",
#     "contracts": {
#       "creditScore": "0x...",
#       "verificationSBT": "0x...",
#       ...
#     },
#     "tokens": {
#       "cUSD": "0x874069...",
#       ...
#     }
#   }
# }
```

**Verify on CeloScan:**

1. Go to https://alfajores.celoscan.io/
2. Search for each contract address
3. Verify transactions succeeded
4. Check contract is verified (if not, see next section)

---

## Contract Verification

### Why Verify Contracts?

- ✅ Allows users to read contract code on CeloScan
- ✅ Builds trust and transparency
- ✅ Enables easier debugging
- ✅ Required for mainnet deployment

### Option 1: Automatic Verification (During Deployment)

Add to `hardhat.config.ts`:

```typescript
etherscan: {
  apiKey: {
    alfajores: process.env.CELOSCAN_API_KEY || "",
    celo: process.env.CELOSCAN_API_KEY || "",
  },
  customChains: [
    {
      network: "alfajores",
      chainId: 44787,
      urls: {
        apiURL: "https://api-alfajores.celoscan.io/api",
        browserURL: "https://alfajores.celoscan.io",
      },
    },
    {
      network: "celo",
      chainId: 42220,
      urls: {
        apiURL: "https://api.celoscan.io/api",
        browserURL: "https://celoscan.io",
      },
    },
  ],
},
```

### Option 2: Manual Verification

```bash
# Get CeloScan API key from https://celoscan.io/myapikey

# Add to .env.local
CELOSCAN_API_KEY=your_api_key_here

# Verify each contract
npx hardhat verify --network alfajores CONTRACT_ADDRESS

# Example for CreditScore (proxy)
npx hardhat verify --network alfajores 0xYourCreditScoreAddress

# Example for LendingPool with constructor args
npx hardhat verify --network alfajores 0xYourLendingPoolAddress "0xAdminAddress"
```

**For UUPS Proxies:**

You need to verify both proxy and implementation:

```bash
# 1. Get implementation address from CeloScan
# Go to contract → Read as Proxy → Implementation

# 2. Verify implementation
npx hardhat verify --network alfajores IMPLEMENTATION_ADDRESS

# 3. Proxy auto-verifies
```

---

## Post-Deployment Steps

### 1. Update Frontend Configuration

Create `packages/frontend/config/contracts.ts`:

```typescript
import deployments from '../../contracts/deployments.json';

const network = (process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'alfajores') as 'alfajores' | 'celo';

if (!deployments[network]) {
  throw new Error(`No deployment found for network: ${network}`);
}

export const CONTRACT_ADDRESSES = {
  CreditScore: deployments[network].contracts.creditScore,
  VerificationSBT: deployments[network].contracts.verificationSBT,
  LendingPool: deployments[network].contracts.lendingPool,
  CollateralManager: deployments[network].contracts.collateralManager,
  LoanManager: deployments[network].contracts.loanManager,
  LendingCircle: deployments[network].contracts.lendingCircle,
} as const;

export const MENTO_TOKENS = deployments[network].tokens;

export const NETWORK_CONFIG = {
  name: network,
  deployer: deployments[network].deployer,
  deployedAt: deployments[network].timestamp,
};
```

### 2. Test Contract Interactions

```bash
# Start frontend
npm run dev

# In browser:
# 1. Connect wallet
# 2. Try each feature
# 3. Check transactions on CeloScan
```

### 3. Fund Lending Pools (Initial Liquidity)

```bash
# Option A: Through UI
# 1. Go to /lend
# 2. Deposit into each pool

# Option B: Directly via contract
npx hardhat console --network alfajores
> const pool = await ethers.getContractAt("LendingPool", "0xYourPoolAddress")
> const cUSD = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
> await pool.deposit(cUSD, ethers.parseUnits("100", 18))
```

### 4. Set Up AI Agent Role

```bash
# Grant AI_AGENT_ROLE to backend service
npx hardhat console --network alfajores

> const creditScore = await ethers.getContractAt("CreditScore", "0xYourAddress")
> const AI_AGENT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AI_AGENT_ROLE"))
> await creditScore.grantRole(AI_AGENT_ROLE, "0xYourBackendWalletAddress")
```

### 5. Configure Verification Providers

Update `VerificationSBT` base URI:

```bash
npx hardhat console --network alfajores

> const verificationSBT = await ethers.getContractAt("VerificationSBT", "0xYourAddress")
> await verificationSBT.setBaseURI("https://api.trustcircle.finance/verification/")
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Prerequisites:**
- Vercel account
- GitHub repository

**Steps:**

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com/)
   - Click "New Project"
   - Import your GitHub repo
   - Select "packages/frontend" as root directory

3. **Configure Environment Variables**
   Add all variables from `.env.local`:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_DEFAULT_NETWORK`
   - `NEXT_PUBLIC_APP_URL`
   - etc.

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get deployment URL (e.g., `trustcircle.vercel.app`)

5. **Set Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records

### Option 2: Self-Hosted

```bash
# Build frontend
cd packages/frontend
npm run build

# Start production server
npm start

# Or with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "trustcircle" -- start
pm2 save
pm2 startup
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm install

COPY . .

WORKDIR /app/packages/frontend

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build image
docker build -t trustcircle .

# Run container
docker run -p 3000:3000 --env-file .env.local trustcircle
```

---

## Monitoring

### Contract Monitoring

**Watch for Events:**

```typescript
// In frontend or backend
import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

const client = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

// Watch loan events
client.watchContractEvent({
  address: CONTRACT_ADDRESSES.LoanManager,
  abi: LoanManagerABI,
  eventName: 'LoanRequested',
  onLogs: (logs) => {
    logs.forEach((log) => {
      console.log('New loan request:', log);
      // Send alert, update database, etc.
    });
  },
});
```

**Set Up Alerts:**

1. **Tenderly** (Recommended)
   - Go to [tenderly.co](https://tenderly.co/)
   - Add your contracts
   - Set up alerts for:
     - Failed transactions
     - Unusual gas usage
     - Specific events (LoanDefaulted, etc.)

2. **OpenZeppelin Defender**
   - Go to [defender.openzeppelin.com](https://defender.openzeppelin.com/)
   - Add contracts
   - Create Sentinels for monitoring
   - Set up Autotasks for automated responses

### Application Monitoring

**Sentry (Error Tracking):**

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

**Analytics (See ANALYTICS_IMPLEMENTATION_SUMMARY.md):**

```typescript
// Already implemented!
import { useAnalytics } from '@/hooks/useAnalytics';

const { track } = useAnalytics();
track('loan_request_completed', { amount: 100 });
```

---

## Troubleshooting

### Issue: Deployment Fails with "Insufficient Funds"

**Solution:**
```bash
# Check balance
npx hardhat run scripts/checkBalance.js --network alfajores

# Get more test tokens
open https://faucet.celo.org/
```

### Issue: Contract Verification Fails

**Solutions:**

1. **Check compiler version matches:**
   ```bash
   # In hardhat.config.ts
   solidity: {
     version: "0.8.27", // Must match
   }
   ```

2. **Flatten contract:**
   ```bash
   npx hardhat flatten contracts/CreditScore.sol > CreditScore_flat.sol
   # Upload flat file to CeloScan manually
   ```

3. **Wait and retry:**
   ```bash
   # Sometimes CeloScan is slow
   sleep 60 && npx hardhat verify --network alfajores ADDRESS
   ```

### Issue: Frontend Can't Connect to Contracts

**Check:**

1. ✅ Contract addresses in config are correct
2. ✅ ABIs are up to date (run `npm run compile`)
3. ✅ Network is correct (Alfajores vs Celo)
4. ✅ Wallet is on correct network

**Debug:**
```typescript
// In component
console.log('Contract address:', CONTRACT_ADDRESSES.LoanManager);
console.log('Current network:', chain?.id);
console.log('Expected network:', celoAlfajores.id); // 44787
```

### Issue: Transactions Fail

**Check:**

1. ✅ Gas price (Celo is usually cheap, but can spike)
2. ✅ Contract is not paused
3. ✅ User has correct roles/permissions
4. ✅ Token allowance is sufficient

**Debug:**
```bash
# Check transaction on CeloScan
open https://alfajores.celoscan.io/tx/YOUR_TX_HASH

# Check contract pause status
npm run security:status
```

---

## Mainnet Deployment Checklist

⚠️ **Before deploying to Celo Mainnet:**

### Security
- [ ] All 600+ tests passing
- [ ] Security audit completed (92/100+ score)
- [ ] Penetration testing done
- [ ] Bug bounty program active
- [ ] Emergency pause tested
- [ ] Multi-sig wallets set up (3-of-5 admin, 2-of-3 pauser)
- [ ] Timelock contract deployed (48-hour delay)

### Legal & Compliance
- [ ] Terms of service finalized
- [ ] Privacy policy published
- [ ] Legal entity established
- [ ] Regulatory compliance checked
- [ ] Insurance obtained (if required)

### Operations
- [ ] Monitoring tools set up (Tenderly, Sentry)
- [ ] Alert system configured (Slack, PagerDuty)
- [ ] Incident response plan documented
- [ ] Team trained on emergency procedures
- [ ] Customer support ready

### Financial
- [ ] Initial liquidity secured (minimum $10k per pool)
- [ ] Insurance fund allocated (5-10% of TVL)
- [ ] Treasury management plan
- [ ] Fee structure finalized

### Technical
- [ ] Contracts verified on CeloScan
- [ ] Frontend deployed to production
- [ ] CDN configured
- [ ] Database backups automated
- [ ] Load testing completed

### Marketing
- [ ] Website live
- [ ] Social media accounts set up
- [ ] Documentation published
- [ ] Community built (Discord, Telegram)
- [ ] Launch announcement prepared

---

## Deployment Cost Estimates

### Alfajores (Testnet)

- Total gas: ~15-20M gas
- Cost: ~0.5-1 CELO (free from faucet)

### Celo Mainnet

- Total gas: ~15-20M gas
- Cost: ~$15-25 USD (at $1.50/CELO, 0.5 Gwei)

**Per Contract:**
- CreditScore: ~2-3M gas (~$3-5)
- VerificationSBT: ~2-3M gas (~$3-5)
- LendingPool: ~3-4M gas (~$5-7)
- CollateralManager: ~2-3M gas (~$3-5)
- LoanManager: ~4-5M gas (~$6-8)
- LendingCircle: ~2-3M gas (~$3-5)

---

## Next Steps

After successful deployment:

1. ✅ **Test Everything** - See [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md)
2. 📊 **Monitor Closely** - First 48 hours are critical
3. 📣 **Announce** - Let users know it's live
4. 🐛 **Fix Bugs** - Iterate based on feedback
5. 📈 **Grow** - Marketing and community building

---

**Need Help?**
- GitHub Issues: [Create Issue](#)
- Discord: [Join Community](#)
- Email: devops@trustcircle.finance

---

**Last Updated**: November 2, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
