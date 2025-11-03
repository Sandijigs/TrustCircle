# Loan Request & Management System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Loan Lifecycle](#loan-lifecycle)
3. [Loan Mathematics](#loan-mathematics)
4. [Risk Management](#risk-management)
5. [User Flows](#user-flows)
6. [Smart Contract Integration](#smart-contract-integration)
7. [Components Reference](#components-reference)
8. [Best Practices](#best-practices)

---

## System Overview

TrustCircle's Loan Management System provides a complete DeFi lending solution with social trust elements. The system manages the entire loan lifecycle from request to repayment or default, with built-in credit scoring and risk management.

### Key Features

- **Multi-currency Support**: Borrow in cUSD, cEUR, or cREAL
- **Flexible Terms**: 1-12 month durations with weekly, bi-weekly, or monthly payments
- **Risk-based Pricing**: Interest rates (8-25% APY) based on credit score
- **Collateral Options**: Optional collateral reduces interest by 2%
- **Auto-approval**: High credit scores (≥800) get instant approval
- **Payment Flexibility**: Partial payments, early payoff with discounts
- **Credit Score Integration**: Payment history affects creditworthiness

---

## Loan Lifecycle

### Stage 1: Request
**Borrower Actions:**
1. Select currency (cUSD/cEUR/cREAL)
2. Choose amount ($50-$5000 based on credit score)
3. Set duration (1-12 months)
4. Select payment frequency (weekly/bi-weekly/monthly)
5. Optionally add collateral
6. Review and submit

**System Actions:**
- Validate credit score (minimum 300)
- Calculate interest rate based on score
- Generate amortization schedule
- Auto-approve if score ≥ 800 or queue for approval

### Stage 2: Approval
**Approval Criteria:**
- **Auto-approved**: Credit score ≥ 800
- **Manual Review**: Score 300-799
  - Debt-to-income ratio
  - Active loan count (max 3)
  - Payment history
  - Collateral value
  - Circle member vouches

**Circle Loans:**
- Require majority circle member approval
- Lower interest rates (10% reduction)
- Shared risk among circle

### Stage 3: Disbursement
**Process:**
1. Collateral locked (if provided)
2. Funds transferred from lending pool
3. Loan marked as Active
4. Payment schedule activated
5. First payment date set

### Stage 4: Repayment
**Payment Options:**
- Regular installments (automatic calculation)
- Partial payments (minimum = installment due)
- Early payoff (50% interest discount)

**On-time Payment Benefits:**
- +5 credit score points per payment
- Build positive payment history
- No penalties

**Late Payment Consequences:**
- Grace period: 7 days
- Penalty: 2% per week after grace period
- Credit score impact: -5 points per late payment
- Default threshold: 30 days overdue

### Stage 5: Completion or Default

**Successful Completion:**
- +20 credit score points
- Collateral released
- Loan marked as Completed
- Eligibility for larger future loans

**Default (30+ days overdue):**
- Loan marked as Defaulted
- Collateral liquidated (if any)
- -200 credit score points
- 180-day cooldown before new loans
- Collection process initiated

---

## Loan Mathematics

### Interest Rate Calculation

Interest rates are determined by credit score using risk-based pricing:

```
Credit Score Range | Base Rate | With Collateral
-------------------|-----------|----------------
800-1000          | 8%        | 6%
700-799           | 12%       | 10%
600-699           | 16%       | 14%
500-599           | 20%       | 18%
300-499           | 25%       | 23%
```

### Amortization Formula

Equal installment payments are calculated using the standard amortization formula:

```
A = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
A = Installment amount
P = Principal (loan amount)
r = Interest rate per period
n = Number of periods (installments)
```

**Example:**
- Loan: $1,000
- Rate: 12% APY (1200 basis points)
- Duration: 6 months
- Frequency: Monthly

```
r = 0.12 / 12 = 0.01 (1% per month)
n = 6 payments
A = 1000 × [0.01(1.01)^6] / [(1.01)^6 - 1]
A = 1000 × 0.01061520 / 0.061520
A ≈ $172.55 per month
```

Total Interest: ($172.55 × 6) - $1,000 = $35.30

### Payment Allocation

Each payment is split into principal and interest:

```
Interest Portion = Remaining Balance × (Annual Rate / Periods per Year)
Principal Portion = Payment Amount - Interest Portion
```

**Payment Schedule Example:**

| Payment | Remaining Balance | Interest | Principal | Total Payment | New Balance |
|---------|------------------|----------|-----------|---------------|-------------|
| 1       | $1,000.00        | $10.00   | $162.55   | $172.55       | $837.45     |
| 2       | $837.45          | $8.37    | $164.18   | $172.55       | $673.27     |
| 3       | $673.27          | $6.73    | $165.82   | $172.55       | $507.45     |
| 4       | $507.45          | $5.07    | $167.48   | $172.55       | $339.97     |
| 5       | $339.97          | $3.40    | $169.15   | $172.55       | $170.82     |
| 6       | $170.82          | $1.71    | $170.84   | $172.55       | $0.00       |

### APR vs APY

**APR (Annual Percentage Rate)**: Simple interest rate without compounding
**APY (Annual Percentage Yield)**: Effective rate with compounding

```
APY = (1 + APR/n)^n - 1

Where n = compounding frequency per year
```

For TrustCircle loans, APR and APY are approximately equal since we use amortization (not compounding).

### Late Payment Penalty

```
Penalty = Installment Amount × 0.02 × (Weeks Late)

Example:
- Installment: $172.55
- Days Late: 10 days (1.43 weeks = 1 week for calculation)
- Penalty: $172.55 × 0.02 × 1 = $3.45
```

### Early Payoff Calculation

Borrowers can pay off loans early with an interest discount:

```
Early Payoff = Remaining Principal + (Remaining Interest × Discount Factor)

Where Discount Factor = 0.5 (50% off remaining interest)

Example (after 2 payments):
- Remaining Principal: $673.27
- Remaining Interest: $15.91 (sum of future interest payments)
- Discount: 50%
- Early Payoff: $673.27 + ($15.91 × 0.5) = $681.23

Savings: ($172.55 × 4) - $681.23 = $8.97
```

---

## Risk Management

### Credit Risk Assessment

**Credit Score Components:**

1. **Payment History (40%)**
   - On-time payment rate
   - Late payment frequency
   - Default history

2. **Credit Utilization (25%)**
   - Active loans vs capacity
   - Total borrowed vs income
   - Debt-to-income ratio

3. **Social Reputation (20%)**
   - Farcaster follower count
   - Circle membership
   - Peer vouches

4. **Verification Level (15%)**
   - KYC completion
   - Identity verification
   - Document verification

### Collateralization Strategies

**Under-collateralized (50% LTV)**
- Lower risk for borrower
- Higher interest rate
- Suitable for trusted borrowers

**Fully-collateralized (100% LTV)**
- Balanced risk/reward
- Standard interest rate
- Most common scenario

**Over-collateralized (150% LTV)**
- Lowest interest rate (2% reduction)
- Maximum lender protection
- Preferred for high-value loans

### Default Risk Mitigation

**Prevention:**
1. Payment reminders (7 days, 3 days, 1 day before due)
2. Grace period (7 days)
3. Flexible payment options
4. Credit counseling resources

**Early Warning Signs:**
- Missed payment deadlines
- Partial payments only
- No wallet activity
- Circle member alerts

**Collection Process:**
1. **Day 0-7**: Grace period, gentle reminders
2. **Day 8-14**: Late fee applied, escalated notifications
3. **Day 15-29**: Credit score penalty, collection team contact
4. **Day 30+**: Default declared, collateral liquidation

### Pool Risk Management

**Liquidity Management:**
- Maintain 20% reserve ratio
- Dynamic interest rates based on utilization
- Emergency liquidity from DAO treasury

**Risk Distribution:**
- Maximum loan size: 5% of pool
- Borrower concentration limit: 10%
- Geographic diversification

**Loss Provisions:**
- 5% of interest goes to reserve fund
- Expected default rate: 2-3%
- Reserve target: 10% of loans

---

## User Flows

### Borrower Flow

```
┌─────────────────┐
│  Connect Wallet │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Credit    │
│ Score (≥300)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Loan    │
│ - Amount        │
│ - Duration      │
│ - Frequency     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Collateral? │
│ (Optional -2%)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review Terms    │
│ - Interest      │
│ - Schedule      │
│ - Total Cost    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Submit Request  │
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Auto-   │ │ Manual   │
│Approve │ │ Review   │
│(≥800)  │ │ (<800)   │
└───┬────┘ └────┬─────┘
    │           │
    └─────┬─────┘
          │
          ▼
┌─────────────────┐
│ Loan Disbursed  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Make Payments   │
│ - On Schedule   │
│ - Early Payoff  │
│ - Partial OK    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│Complete │ │ Default  │
│+20 pts  │ │ -200 pts │
└─────────┘ └──────────┘
```

### Payment Flow

```
┌─────────────────┐
│ View Loan       │
│ Details         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Payment  │
│ Type:           │
│ • Installment   │
│ • Early Payoff  │
│ • Custom        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review Amount   │
│ & Breakdown     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Approve Token   │
│ Transfer        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute Payment │
│ Transaction     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Payment Recorded│
│ - Balance Update│
│ - Score Update  │
│ - Schedule      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Confirmation &  │
│ Receipt         │
└─────────────────┘
```

### Circle Loan Flow

```
┌─────────────────┐
│ Join/Create     │
│ Lending Circle  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Circle  │
│ Loan            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Circle Members  │
│ Vote (Majority  │
│ Required)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Approved:       │
│ • 10% Lower Rate│
│ • Shared Risk   │
│ • Group Support │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Regular         │
│ Repayment       │
│ + Circle        │
│ Accountability  │
└─────────────────┘
```

---

## Smart Contract Integration

### LoanManager.sol

**Key Functions:**

```solidity
// Request a new loan
function requestLoan(
    address asset,
    uint256 amount,
    uint256 duration,
    PaymentFrequency frequency,
    uint256 circleId
) external returns (uint256 loanId);

// Make a payment
function makePayment(
    uint256 loanId,
    uint256 amount
) external;

// Declare loan default
function declareDefault(
    uint256 loanId
) external;

// Get loan details
function getLoan(
    uint256 loanId
) external view returns (Loan memory);
```

**Events:**

```solidity
event LoanRequested(
    uint256 indexed loanId,
    address indexed borrower,
    address indexed asset,
    uint256 amount,
    uint256 duration
);

event PaymentMade(
    uint256 indexed loanId,
    address indexed borrower,
    uint256 amount,
    uint256 installmentNumber
);

event LoanCompleted(
    uint256 indexed loanId,
    address indexed borrower
);

event LoanDefaulted(
    uint256 indexed loanId,
    address indexed borrower,
    uint256 amountOwed
);
```

### CreditScore.sol Integration

**Score Updates:**

```solidity
// On successful payment
creditScore.updateCreditScore(borrower, currentScore + 5);

// On late payment
creditScore.recordPayment(borrower, false);

// On loan completion
creditScore.updateCreditScore(borrower, currentScore + 20);

// On default
creditScore.updateCreditScore(
    borrower,
    currentScore > 200 ? currentScore - 200 : 0
);
```

### CollateralManager.sol

**Collateral Operations:**

```solidity
// Deposit collateral
collateralManager.depositERC20Collateral(
    loanId,
    tokenAddress,
    amount
);

// Lock on disbursement
collateralManager.lockCollateral(borrower, loanId);

// Release on completion
collateralManager.releaseCollateral(borrower, loanId);

// Liquidate on default
uint256 recovered = collateralManager.liquidateCollateral(
    borrower,
    loanId
);
```

---

## Components Reference

### LoanRequestForm

**Multi-step wizard for requesting loans**

```tsx
<LoanRequestForm
  circleId={BigInt(0)} // 0 for general pool, >0 for circle
  onSuccess={() => router.push('/borrow/my-loans')}
  onCancel={() => router.back()}
/>
```

**Props:**
- `circleId`: Circle ID (optional, default 0)
- `onSuccess`: Callback after successful loan request
- `onCancel`: Callback for cancellation

**Steps:**
1. Amount & Purpose
2. Terms Selection
3. Collateral (Optional)
4. Review & Submit

### LoanCard

**Compact loan summary card**

```tsx
<LoanCard
  loan={loanData}
  onViewDetails={() => router.push(`/borrow/${loan.id}`)}
  onMakePayment={() => router.push(`/borrow/${loan.id}/pay`)}
/>
```

### MyLoans

**Borrower's loan dashboard**

```tsx
<MyLoans
  onRequestLoan={() => router.push('/borrow/request')}
/>
```

**Features:**
- Loan statistics
- Filter by status (all/active/pending/completed/defaulted)
- Quick actions

### RepaymentSchedule

**Payment schedule table/timeline**

```tsx
<RepaymentSchedule
  schedule={paymentSchedule}
  assetSymbol="cUSD"
/>
```

### MakePayment

**Payment interface with options**

```tsx
<MakePayment
  loan={loanData}
  onSuccess={() => refresh()}
  onCancel={() => router.back()}
/>
```

**Options:**
- Regular installment
- Full early payoff
- Custom amount

### LoanDetails

**Comprehensive loan information**

```tsx
<LoanDetails loanId="123" />
```

**Tabs:**
- Overview
- Payment Schedule
- Payment History

---

## Best Practices

### For Borrowers

**✅ DO:**
- Set payment reminders 3 days before due date
- Pay early when possible for credit score boost
- Add collateral to reduce interest rates
- Join lending circles for better rates
- Maintain emergency fund for unexpected issues
- Communicate with lenders if facing difficulties

**❌ DON'T:**
- Borrow more than you can afford
- Miss payment deadlines (affects credit score)
- Take multiple loans simultaneously
- Ignore payment reminders
- Default on loans (severe credit penalty)

### Payment Strategies

**1. Snowball Method**
Pay off smallest loan first for psychological wins

**2. Avalanche Method**
Pay off highest interest loan first for maximum savings

**3. Minimum Plus Extra**
Pay minimum on all loans + extra on one target loan

**4. Early Payoff**
If you have extra funds, pay off entire loan early for 50% interest discount

### Credit Score Optimization

**Actions that Improve Score:**
- On-time payments (+5 points each)
- Completing loans (+20 points)
- Maintaining low DTI ratio
- Getting peer vouches
- Increasing verification level
- Being active in circles

**Actions that Harm Score:**
- Late payments (-5 points each)
- Defaults (-200 points)
- Multiple missed payments
- High DTI ratio

### Risk Mitigation

**For Lenders:**
1. Diversify across multiple borrowers
2. Review credit scores before approval
3. Require collateral for large loans
4. Monitor payment patterns
5. Set conservative LTV ratios

**For Borrowers:**
1. Only borrow what you need
2. Choose realistic repayment terms
3. Consider collateral for better rates
4. Build credit history gradually
5. Have backup repayment plan

---

## Legal Considerations

### Disclaimers

⚠️ **Important Legal Notices:**

1. **Not Financial Advice**: This system provides lending tools but not financial advice
2. **Regulatory Compliance**: Users responsible for compliance with local laws
3. **Risk Disclosure**: Borrowing involves risk of loss
4. **Credit Reporting**: Payment history may affect credit score
5. **Collection Rights**: Lenders reserve right to pursue collection
6. **No Guarantee**: Platform doesn't guarantee loan approval or repayment
7. **Smart Contract Risk**: Code audited but bugs possible
8. **Jurisdiction**: Governed by laws of platform jurisdiction

### Terms of Service Highlights

- Borrowers must be 18+ years old
- Accurate information required
- Platform fees may apply
- Default consequences clearly stated
- Privacy policy compliance
- Dispute resolution process defined
- Force majeure provisions
- Right to modify terms with notice

---

## Troubleshooting

### Common Issues

**Loan Request Failed**
- Check credit score (minimum 300)
- Verify wallet has gas for transaction
- Ensure amount within limits ($50-$5000)
- Check active loan count (max 3)

**Payment Not Processing**
- Verify sufficient token balance
- Check token approval
- Ensure payment >= minimum due
- Wait for previous transaction to confirm

**Credit Score Not Updating**
- Transactions may take time to reflect
- Check transaction confirmed on blockchain
- Refresh page after 30 seconds
- Contact support if issue persists

**Collateral Not Releasing**
- Verify all payments completed
- Check loan status is "Completed"
- Ensure no pending transactions
- Contact support with loan ID

---

## Support & Resources

**Documentation:**
- Smart Contract Docs: `/docs/contracts`
- API Reference: `/docs/api`
- Video Tutorials: `/learn`

**Community:**
- Discord: [discord.gg/trustcircle](https://discord.gg/trustcircle)
- Telegram: [@trustcircle](https://t.me/trustcircle)
- Forum: [forum.trustcircle.io](https://forum.trustcircle.io)

**Help:**
- FAQ: `/help/faq`
- Support Tickets: `/support`
- Email: support@trustcircle.io

---

## Changelog

### v1.0.0 (Current)
- Initial loan system release
- Basic amortization calculations
- Credit score integration
- Collateral support
- Payment reminders
- Circle lending

### Roadmap

**v1.1** (Q2 2024)
- Refinancing options
- Loan consolidation
- Variable interest rates
- Advanced analytics

**v1.2** (Q3 2024)
- Cross-chain lending
- Fiat on/off ramps
- Insurance products
- Mobile app

**v2.0** (Q4 2024)
- AI-powered credit scoring
- Automated collections
- Secondary loan market
- Institutional lending

---

## Conclusion

TrustCircle's Loan Management System combines traditional lending principles with DeFi innovation and social trust mechanisms. By understanding the mathematics, managing risks appropriately, and following best practices, borrowers and lenders can participate safely in a transparent, efficient lending marketplace.

For additional questions or support, please refer to our documentation or contact our support team.

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**License**: MIT
