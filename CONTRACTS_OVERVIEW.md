# Smart Contracts Overview

## 📋 TrustCircle Contract Architecture

### **9 Core Contracts**

---

## 1. 💰 **LendingPool.sol**
**Purpose:** Main liquidity pool for deposits and loans

**What it does:**
- Accepts user deposits in stablecoins (cUSD, cEUR, cREAL)
- Issues LP tokens representing user's share of the pool
- Provides liquidity for loans
- Calculates dynamic interest rates based on utilization
- Manages reserves and accumulated interest

**Key Features:**
- Dynamic APY: 5-55% based on pool utilization
- Optimal utilization: 80%
- Minimum deposit: 1 token
- 10% reserve factor for safety

---

## 2. 📝 **LoanManager.sol**
**Purpose:** Manages complete loan lifecycle

**What it does:**
- Processes loan requests from borrowers
- Auto-approves high credit score users (≥800)
- Requires circle voting for lower scores
- Disburses funds from LendingPool
- Tracks loan repayments and installments
- Handles late payments and defaults

**Key Features:**
- Loan range: $50 - $5,000
- Duration: 1-12 months
- Interest: 8-25% APY (credit score based)
- Late penalty: 2% per week
- 7-day grace period before default

---

## 3. 🔒 **CollateralManager.sol**
**Purpose:** Manages loan collateral and liquidations

**What it does:**
- Accepts ERC20 tokens and NFTs as collateral
- Locks collateral when loan is disbursed
- Calculates loan-to-value (LTV) ratios
- Liquidates collateral if loan defaults
- Returns remaining collateral to borrower

**Collateral Types:**
- ERC20 tokens (CELO, stablecoins)
- ERC721 NFTs (digital assets)

**LTV Ratios:**
- Under-collateralized: 50%
- Fully-collateralized: 100%
- Over-collateralized: 150%

---

## 4. 📊 **CreditScore.sol**
**Purpose:** On-chain credit scoring system

**What it does:**
- Stores credit scores (0-1000) for all users
- Tracks loan history (completed, defaulted, on-time payments)
- Records social reputation (Farcaster followers, vouches)
- Stores verification levels
- Updates scores based on user behavior

**Score Components:**
- Loan repayment history (40%)
- Social reputation (30%)
- On-chain activity (20%)
- Verification level (10%)

**Default Score:** 500 (new users)

---

## 5. 👥 **LendingCircle.sol**
**Purpose:** Social lending circles with community support

**What it does:**
- Creates lending circles (5-20 members)
- Members vouch for each other
- Circle votes on loan approvals
- Manages shared circle treasury
- Distributes losses if member defaults

**Benefits:**
- Lower interest rates for members
- Community accountability
- Shared financial learning
- Social capital building

**Requirements:**
- Minimum credit score: 400
- Quorum: 60% of members must vote
- Voting period: 7 days

---

## 6. 🎫 **VerificationSBT.sol**
**Purpose:** Soul Bound Token for identity verification

**What it does:**
- Issues non-transferable NFT for verified users
- Stores verification level and provider
- Cannot be sold or traded (soul bound)
- One token per user address

**Verification Levels:**
- **Level 0:** None (unverified)
- **Level 1:** Basic (email/phone)
- **Level 2:** Verified (KYC + ID documents)
- **Level 3:** Trusted (enhanced verification)

**Supported Providers:**
- World ID (Worldcoin)
- Holonym
- Gitcoin Passport
- Custom KYC

---

## 7. 🪙 **LPToken.sol**
**Purpose:** ERC20 token representing pool shares

**What it does:**
- Minted when users deposit to pool
- Burned when users withdraw
- Represents proportional ownership of pool
- Value per token increases as pool earns interest

**Example:**
```
1. Deposit 1000 cUSD → Get 1000 LP tokens
2. Pool earns 100 cUSD interest
3. Redeem 1000 LP tokens → Get 1100 cUSD
```

**Note:** Not rebasing - balance stays constant, value increases

---

## 8. 🧮 **InterestCalculator.sol**
**Purpose:** Library for interest calculations

**What it does:**
- Calculates simple interest
- Calculates compound interest
- Amortization formulas (equal installments)
- APR/APY conversions
- Early payment calculations

**Used By:**
- LendingPool (lender APY)
- LoanManager (borrower interest)
- Frontend (projected earnings)

---

## 9. 🎯 **MockERC20.sol**
**Purpose:** Test token for development

**What it does:**
- Simple ERC20 token for testing
- Can mint unlimited tokens
- Used in testnet deployments
- Simulates real stablecoins (cUSD, cEUR, cREAL)

**Note:** Only for testing - NOT used in production

---

## 🔗 Contract Relationships

```
User
  ↓
LendingPool ←→ LPToken (issues shares)
  ↓
LoanManager ←→ CreditScore (checks score)
  ↓           ↓
CollateralManager   LendingCircle
  ↓                     ↓
VerificationSBT (checks verification)
```

---

## 🛡️ Security Features

All contracts implement:
- ✅ **ReentrancyGuard** - Prevents reentrancy attacks
- ✅ **Pausable** - Emergency pause functionality
- ✅ **AccessControl** - Role-based permissions
- ✅ **UUPS Upgradeable** - Can upgrade without losing data
- ✅ **SafeERC20** - Safe token transfers

---

## 📊 Contract Stats

| Contract | Lines of Code | Complexity |
|----------|--------------|------------|
| LendingPool | 675 | High |
| LoanManager | 697 | High |
| CollateralManager | 591 | Medium |
| CreditScore | 593 | Medium |
| LendingCircle | 668 | High |
| VerificationSBT | 581 | Medium |
| LPToken | 98 | Low |
| InterestCalculator | 313 | Medium |
| MockERC20 | 21 | Low |
| **Total** | **4,237** | - |

---

## 🎯 Current Implementation Status

### ✅ Deployed & Working:
- LendingPool (deposits, withdrawals)
- MockERC20 (test tokens)
- LPToken (pool shares)

### 🚧 Deployed but Not Integrated:
- LoanManager (needs frontend)
- CreditScore (needs AI integration)
- CollateralManager (needs frontend)
- LendingCircle (needs frontend)
- VerificationSBT (needs KYC provider)

### 📝 Next Steps:
1. Integrate LoanManager with frontend
2. Connect CreditScore to AI scoring engine
3. Build borrowing UI
4. Add collateral deposit UI
5. Implement lending circles UI

---

## 💡 Key Innovations

1. **Dynamic Interest Rates** - APY adjusts based on pool usage
2. **On-Chain Credit Scoring** - Transparent, blockchain-based scores
3. **Social Lending Circles** - Community-based loan approvals
4. **Soul Bound Verification** - Non-transferable identity NFTs
5. **Flexible Collateral** - Supports both tokens and NFTs
6. **Amortized Loans** - Equal installment payments like traditional banks

---

**Total Smart Contract Code:** 4,237 lines of Solidity  
**Security Standard:** OpenZeppelin upgradeable contracts  
**Network:** Celo Sepolia Testnet  
**Upgrade Pattern:** UUPS (minimal proxy)

---

## 📍 Deployed Contract Addresses (Celo Sepolia)

### Core Contracts
```
LendingPool:        0xFce2564f7085A26666410d9b173755fec7141333
LoanManager:        0x5C8D2d24f137C0488219BD528bD1bE0a05bcB5d0
CollateralManager:  0x62B863Fe95D9Be0F39281419bD02A9D30d10FeF5
CreditScore:        0x72Bf1C4C09448FF83674902ADe69929068138c84
LendingCircle:      0xa50dc2936694D0628d8D8158D712143e4cBBb0C2
VerificationSBT:    0x57B54527C6d4847A08cf9Af74D1Aad933CA25A8F
```

### Official Testnet Tokens
```
cUSD:   0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b
cEUR:   0xA99dC247d6b7B2E3ab48a1fEE101b83cD6aCd82a
cREAL:  0x2294298942fdc79417DE9E0D740A4957E0e7783a
```

### Mock Tokens (For Testing)
```
MockERC20 (cUSD/cEUR/cREAL): 0x8dd252909C90846956592867EaeE335E5c4BbCF5
```

### Deployer Address
```
0xDf666C902386E1E57755f161a665A0ad04c4ee19
```

### Deployment Info
- **Network:** Celo Sepolia Testnet (Chain ID: 44787)
- **Deployment Date:** November 4, 2025
- **Block Explorer:** https://celo-testnet.blockscout.com/

### Verify on Block Explorer
- LendingPool: https://celo-testnet.blockscout.com/address/0xFce2564f7085A26666410d9b173755fec7141333
- MockERC20: https://celo-testnet.blockscout.com/address/0x8dd252909C90846956592867EaeE335E5c4BbCF5
