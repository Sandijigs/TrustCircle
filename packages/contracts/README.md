# TrustCircle Smart Contracts

Production-ready Solidity contracts for TrustCircle micro-lending platform on Celo blockchain.

## 📜 Contracts

### Core Contracts

#### 1. **LendingPool.sol** ✅
Main lending pool with dynamic interest rates and liquidity management.

**Features:**
- Multi-currency support (cUSD, cEUR, cREAL)
- Dynamic interest rate calculation (kinked curve model)
- LP token shares for lenders
- Reserve management (10% reserve ratio)
- Upgradeable (UUPS proxy pattern)

**Interest Rate Model:**
```
Base Rate: 5%
Optimal Utilization: 80%

If utilization < 80%:
  APY = 5% + (utilization/80%) * 10%

If utilization >= 80%:
  APY = 15% + ((utilization-80%)/20%) * 40%
```

#### 2. **LoanManager.sol** ✅
Complete loan lifecycle management from request to repayment.

**Features:**
- Loan request and approval workflow
- Credit score-based interest rates (8-25% APY)
- Amortization-based installment calculations
- Late payment penalties (2% per week)
- Automatic default handling after 30 days
- Upgradeable (UUPS)

**Interest Rates by Credit Score:**
- 800+: 8% APY (Excellent)
- 700-799: 12% APY (Good)
- 600-699: 16% APY (Fair)
- 500-599: 20% APY (Poor)
- <500: 25% APY (Bad)

#### 3. **CreditScore.sol** ✅
On-chain credit score storage and management.

**Features:**
- Scores range from 0-1000
- Loan history tracking
- Social reputation integration
- AI agent integration for score updates
- Public credit score queries (transparency)
- Score history tracking

**Score Components:**
- On-chain history (loan repayment, volume)
- Social reputation (Farcaster, vouches)
- Verification level

#### 4. **LendingCircle.sol** ✅
Social lending circles with member voting and shared responsibility.

**Features:**
- 5-20 members per circle
- Proposal-based governance (loan approval, member management)
- Voting with 60% quorum requirement
- Circle treasury management
- Member reputation system
- Vouch mechanism (stake reputation)

**Circle Mechanics:**
- Members vote on loan proposals
- 7-day voting period
- Shared loss if member defaults
- Reputation rewards for participation

#### 5. **CollateralManager.sol** ✅
Manages collateral deposits and liquidations.

**Features:**
- ERC20 token collateral support
- ERC721 NFT collateral support
- Collateral ratio calculations (50-150% LTV)
- Automated liquidation on default
- Price oracle integration
- 5% liquidation bonus

**Supported Collateral:**
- Mento stablecoins (cUSD, cEUR, cREAL)
- CELO native token
- Any approved ERC20/ERC721

#### 6. **VerificationSBT.sol** ✅
Soul Bound Token (non-transferable NFT) for identity verification.

**Features:**
- Non-transferable identity tokens
- 4 verification levels (None, Basic, Verified, Trusted)
- Multiple provider support (World ID, Holonym, etc.)
- Expiration support
- Admin recovery mechanism
- Upgradeable (UUPS)

**Verification Levels:**
- Level 0: None
- Level 1: Basic (email/phone)
- Level 2: Verified (KYC with ID)
- Level 3: Trusted (Enhanced verification)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                     │
└─────────────────┬───────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼──────────┐      ┌─────────▼────────┐
│ LoanManager  │◄────►│  LendingCircle   │
└───┬──────────┘      └──────────────────┘
    │
    ├──────┬──────────┬──────────┐
    │      │          │          │
┌───▼──┐ ┌▼───────┐ ┌▼────────┐ ┌▼──────────────┐
│Credit│ │Lending │ │Collateral│ │Verification   │
│Score │ │Pool    │ │Manager   │ │SBT            │
└──────┘ └────────┘ └──────────┘ └───────────────┘
```

**Flow:**
1. User requests loan via `LoanManager`
2. `CreditScore` checked for eligibility
3. `VerificationSBT` checked for KYC status
4. `LendingCircle` votes on approval (if circle loan)
5. `CollateralManager` locks collateral (if provided)
6. `LendingPool` disburses funds
7. Repayments go back to `LendingPool`
8. `CreditScore` updated on payment events

---

## 🚀 Deployment

### Prerequisites

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy to Alfajores Testnet

```bash
npm run deploy:alfajores
```

### Deploy to Celo Mainnet

```bash
npm run deploy:celo
```

### Verify on CeloScan

```bash
npx hardhat verify --network alfajores <CONTRACT_ADDRESS>
```

---

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test

```bash
npx hardhat test test/LendingPool.test.ts
```

### Test Coverage

```bash
npx hardhat coverage
```

---

## 🔐 Security Features

### Access Control
- Role-based permissions (OpenZeppelin AccessControl)
- Multi-signature admin functions
- Separate roles for different operations

### Safety Mechanisms
- ReentrancyGuard on all state-changing functions
- Pausable functionality for emergencies
- SafeERC20 for token transfers
- Input validation on all parameters

### Upgradeability
- UUPS proxy pattern
- Only admin can upgrade
- Transparent upgrade process

### Audit Checklist
- [ ] External security audit
- [ ] Formal verification of critical functions
- [ ] Gas optimization review
- [ ] Front-running protection analysis
- [ ] Oracle manipulation checks

---

## 📊 Gas Optimization

All contracts implement:
- Storage packing
- Efficient loops
- Batch operations where possible
- Minimal storage writes
- View functions for reads

---

## 🔧 Configuration

### Hardhat Config

Located in `hardhat.config.ts`:
- Solidity 0.8.24 with optimizer enabled
- Celo Alfajores and Mainnet networks
- CeloScan verification support

### Environment Variables

Required in `.env.local`:
```
PRIVATE_KEY=your_deployer_private_key
CELOSCAN_API_KEY=your_celoscan_api_key
```

---

## 📝 Contract Addresses

After deployment, addresses are saved to `deployments.json`:

```json
{
  "alfajores": {
    "contracts": {
      "creditScore": "0x...",
      "verificationSBT": "0x...",
      "lendingPool": "0x...",
      "collateralManager": "0x...",
      "loanManager": "0x...",
      "lendingCircle": "0x..."
    }
  }
}
```

---

## 🎯 Key Functions

### For Lenders

```solidity
// Deposit funds
lendingPool.deposit(asset, amount);

// Withdraw funds
lendingPool.withdraw(asset, shares);

// Check APY
lendingPool.calculateLenderAPY(asset);
```

### For Borrowers

```solidity
// Request loan
loanManager.requestLoan(asset, amount, duration, frequency, circleId);

// Make payment
loanManager.makePayment(loanId, amount);

// Check credit score
creditScore.getCreditScore(user);
```

### For Circle Members

```solidity
// Create circle
lendingCircle.createCircle(name, description, maxMembers, minCreditScore);

// Vote on proposal
lendingCircle.vote(proposalId, support);

// Vouch for member
lendingCircle.vouchForMember(circleId, member);
```

---

## 📈 Interest Rate Examples

### Borrow APY by Utilization

| Utilization | Borrow APY |
|-------------|------------|
| 0%          | 5.0%       |
| 40%         | 10.0%      |
| 80%         | 15.0%      |
| 90%         | 35.0%      |
| 100%        | 55.0%      |

### Loan APY by Credit Score

| Score Range | APY   | Tier      |
|-------------|-------|-----------|
| 800-1000    | 8%    | Excellent |
| 700-799     | 12%   | Good      |
| 600-699     | 16%   | Fair      |
| 500-599     | 20%   | Poor      |
| 0-499       | 25%   | Bad       |

---

## 🐛 Troubleshooting

### Common Issues

**"Insufficient liquidity"**
- Pool doesn't have enough available funds
- Wait for liquidity or try smaller amount

**"Insufficient credit score"**
- Credit score below minimum (300)
- Build credit history first

**"Circle full"**
- Circle has reached max members
- Join a different circle

**"Proposal expired"**
- Voting period (7 days) has passed
- Create a new proposal

---

## 📚 Additional Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Celo Developer Docs](https://docs.celo.org/)
- [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)

---

## 🤝 Contributing

1. Write tests for new features
2. Follow Solidity style guide
3. Add NatSpec documentation
4. Run gas optimization checks
5. Submit PR with description

---

## ⚠️ Disclaimer

These contracts are provided as-is. Conduct thorough testing and obtain professional audits before mainnet deployment. DeFi protocols carry inherent risks.

---

**Built with ❤️ for financial inclusion on Celo**
