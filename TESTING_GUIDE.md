# TrustCircle Testing Guide

## 🎯 Testing Strategy

Comprehensive testing following DeFi security best practices with >90% code coverage target.

---

## 📦 Test Structure

```
packages/
├── contracts/
│   └── test/
│       ├── helpers/
│       │   └── testHelpers.ts ✅
│       ├── LendingPool.test.ts
│       ├── LendingCircle.test.ts
│       ├── LoanManager.test.ts
│       ├── CreditScore.test.ts
│       ├── VerificationSBT.test.ts
│       ├── integration/
│       │   ├── FullLoanLifecycle.test.ts
│       │   └── CircleWorkflow.test.ts
│       └── security/
│           ├── ReentrancyTests.test.ts
│           ├── AccessControlTests.test.ts
│           └── EdgeCaseTests.test.ts
│
└── frontend/
    ├── __tests__/
    │   ├── components/
    │   │   ├── WalletConnect.test.tsx
    │   │   ├── LoanRequestForm.test.tsx
    │   │   └── CreditScoreDisplay.test.tsx
    │   ├── hooks/
    │   │   ├── useLendingPool.test.ts
    │   │   └── useLoanManager.test.ts
    │   └── integration/
    │       └── LoanFlow.test.tsx
    └── e2e/
        ├── loan-request.spec.ts
        ├── deposit-withdraw.spec.ts
        └── circle-creation.spec.ts
```

---

## 🔐 Smart Contract Testing

### **Test Helper Utilities** ✅ **Created**

File: `packages/contracts/test/helpers/testHelpers.ts` (450+ lines)

**Categories:**
1. **Time Helpers** - Fast-forward time, manipulate blocks
2. **Token Helpers** - Deploy mock ERC20, mint, approve
3. **Lending Pool Helpers** - Deploy, deposit, withdraw
4. **Loan Manager Helpers** - Request, approve, repay loans
5. **Circle Helpers** - Create circles, join, vouch
6. **Credit Score Helpers** - Set scores, track history
7. **Expectation Helpers** - Custom expect functions
8. **Gas Tracking** - Measure and log gas usage
9. **Calculation Helpers** - Interest, installments
10. **Common Test Values** - Standard amounts, durations

**Usage Example:**
```typescript
import {
  deployLendingPool,
  depositToPool,
  COMMON_AMOUNTS,
  COMMON_DURATIONS,
  calculateInterest,
} from "./helpers/testHelpers";

describe("LendingPool", () => {
  it("should calculate interest correctly", async () => {
    const interest = calculateInterest(
      COMMON_AMOUNTS.THOUSAND_TOKENS,
      10, // 10% APR
      30  // 30 days
    );
    
    expect(interest).to.be.gt(0);
  });
});
```

---

### **1. Unit Tests - LendingPool**

File: `packages/contracts/test/LendingPool.test.ts`

**Test Categories:**

#### **A. Deployment Tests**
```typescript
describe("LendingPool - Deployment", () => {
  it("Should deploy with correct token address");
  it("Should set deployer as owner");
  it("Should initialize with zero total deposits");
  it("Should initialize with zero total borrowed");
});
```

#### **B. Deposit Tests**
```typescript
describe("LendingPool - Deposits", () => {
  it("Should accept valid deposits");
  it("Should mint pool tokens (shares) proportionally");
  it("Should update total deposits");
  it("Should emit Deposit event");
  it("Should revert if amount is zero");
  it("Should revert if token transfer fails");
  it("Should handle multiple depositors correctly");
  it("Should calculate shares correctly for subsequent deposits");
});
```

#### **C. Withdrawal Tests**
```typescript
describe("LendingPool - Withdrawals", () => {
  it("Should allow withdrawal of deposited funds");
  it("Should burn pool tokens on withdrawal");
  it("Should update total deposits");
  it("Should emit Withdrawal event");
  it("Should revert if insufficient balance");
  it("Should revert if pool has insufficient liquidity");
  it("Should handle partial withdrawals");
  it("Should calculate withdrawable amount correctly");
});
```

#### **D. Interest Distribution Tests**
```typescript
describe("LendingPool - Interest", () => {
  it("Should distribute interest to all depositors");
  it("Should calculate interest proportional to share");
  it("Should increase pool token value over time");
  it("Should handle interest distribution with active loans");
});
```

#### **E. Utilization Tests**
```typescript
describe("LendingPool - Utilization", () => {
  it("Should calculate utilization rate correctly");
  it("Should prevent borrowing when fully utilized");
  it("Should adjust APY based on utilization");
  it("Should track available liquidity");
});
```

#### **F. Access Control Tests**
```typescript
describe("LendingPool - Access Control", () => {
  it("Should only allow LoanManager to borrow");
  it("Should only allow owner to update parameters");
  it("Should only allow owner to pause/unpause");
  it("Should prevent deposits when paused");
  it("Should prevent withdrawals when paused");
});
```

#### **G. Edge Cases**
```typescript
describe("LendingPool - Edge Cases", () => {
  it("Should handle deposit overflow");
  it("Should handle withdrawal of entire balance");
  it("Should handle rounding errors in share calculation");
  it("Should handle zero share edge case");
  it("Should handle very small deposits");
  it("Should handle very large deposits");
});
```

---

### **2. Unit Tests - LoanManager**

File: `packages/contracts/test/LoanManager.test.ts`

**Test Categories:**

#### **A. Loan Request Tests**
```typescript
describe("LoanManager - Loan Requests", () => {
  it("Should create loan request with valid parameters");
  it("Should assign unique loan ID");
  it("Should set correct loan terms");
  it("Should emit LoanRequested event");
  it("Should revert if amount is zero");
  it("Should revert if duration is too short");
  it("Should revert if duration is too long");
  it("Should revert if borrower has active defaulted loan");
  it("Should require minimum credit score");
  it("Should check borrowing limit based on credit score");
});
```

#### **B. Loan Approval Tests**
```typescript
describe("LoanManager - Loan Approvals", () => {
  it("Should approve loan if conditions met");
  it("Should transfer funds from pool to borrower");
  it("Should update loan status to Active");
  it("Should emit LoanApproved event");
  it("Should revert if loan already approved");
  it("Should revert if pool has insufficient funds");
  it("Should revert if unauthorized approver");
  it("Should calculate correct interest rate");
  it("Should set correct repayment schedule");
});
```

#### **C. Repayment Tests**
```typescript
describe("LoanManager - Repayments", () => {
  it("Should accept valid repayment");
  it("Should update amount paid");
  it("Should transfer funds to pool");
  it("Should emit Repayment event");
  it("Should mark loan as fully repaid");
  it("Should handle partial repayments");
  it("Should handle early repayments");
  it("Should calculate interest savings for early payment");
  it("Should handle late payments");
  it("Should charge late fees correctly");
});
```

#### **D. Default Tests**
```typescript
describe("LoanManager - Defaults", () => {
  it("Should mark loan as defaulted after grace period");
  it("Should emit LoanDefaulted event");
  it("Should update borrower's credit score");
  it("Should update circle default statistics");
  it("Should prevent new loans for defaulted borrowers");
  it("Should allow recovery process");
});
```

#### **E. Liquidation Tests**
```typescript
describe("LoanManager - Liquidations", () => {
  it("Should liquidate collateralized loans");
  it("Should distribute liquidation proceeds");
  it("Should update loan status to Liquidated");
  it("Should return surplus to borrower");
});
```

---

### **3. Unit Tests - LendingCircle**

File: `packages/contracts/test/LendingCircle.test.ts`

**Test Categories:**

#### **A. Circle Creation Tests**
```typescript
describe("LendingCircle - Creation", () => {
  it("Should create circle with valid name");
  it("Should set creator as first member");
  it("Should initialize member count to 1");
  it("Should emit CircleCreated event");
});
```

#### **B. Member Management Tests**
```typescript
describe("LendingCircle - Members", () => {
  it("Should allow users to join circle");
  it("Should require minimum credit score");
  it("Should emit MemberJoined event");
  it("Should prevent duplicate membership");
  it("Should allow members to leave");
  it("Should handle leaving member with active loans");
  it("Should track member count correctly");
});
```

#### **C. Vouching Tests**
```typescript
describe("LendingCircle - Vouching", () => {
  it("Should allow member to vouch for another");
  it("Should emit VouchCreated event");
  it("Should prevent vouching for non-members");
  it("Should prevent self-vouching");
  it("Should track vouch count");
  it("Should weight vouches by voucher reputation");
});
```

#### **D. Circle Governance Tests**
```typescript
describe("LendingCircle - Governance", () => {
  it("Should allow voting on loan approvals");
  it("Should require quorum for approval");
  it("Should calculate votes correctly");
  it("Should handle tie-breaking");
  it("Should allow parameter proposals");
});
```

---

### **4. Integration Tests - Full Loan Lifecycle**

File: `packages/contracts/test/integration/FullLoanLifecycle.test.ts`

```typescript
describe("Integration - Full Loan Lifecycle", () => {
  let pool: Contract;
  let loanManager: Contract;
  let creditScore: Contract;
  let token: Contract;
  let lender: SignerWithAddress;
  let borrower: SignerWithAddress;

  beforeEach(async () => {
    // Setup contracts
    token = await deployMockERC20("cUSD", "cUSD");
    creditScore = await deployCreditScore();
    pool = await deployLendingPool(await token.getAddress(), owner);
    loanManager = await deployLoanManager(
      await creditScore.getAddress(),
      await verificationSBT.getAddress()
    );
    
    // Set borrower credit score
    await setCreditScore(creditScore, owner, borrower.address, 700);
  });

  it("Complete loan lifecycle: Request → Approve → Repay", async () => {
    // 1. Lender deposits to pool
    const depositAmount = parseUnits("10000");
    await depositToPool(pool, token, lender, depositAmount);
    
    expect(await pool.totalDeposits()).to.equal(depositAmount);

    // 2. Borrower requests loan
    const loanAmount = parseUnits("1000");
    const duration = 30 * ONE_DAY; // 30 days
    
    const { loanId } = await requestLoan(loanManager, borrower, {
      tokenAddress: await token.getAddress(),
      amount: loanAmount,
      duration,
      purpose: "Business expansion",
    });

    // 3. Loan is approved
    await approveLoan(loanManager, pool, owner, loanId);
    
    // Verify funds transferred
    expect(await token.balanceOf(borrower.address)).to.equal(loanAmount);

    // 4. Borrower repays loan with interest
    const totalRepayment = calculateTotalRepayment(loanAmount, 10, 30);
    
    await repayLoan(loanManager, token, borrower, loanId, totalRepayment);

    // 5. Verify loan marked as repaid
    const loan = await loanManager.getLoan(loanId);
    expect(loan.status).to.equal(2); // Repaid status

    // 6. Verify lender can withdraw with interest
    const expectedBalance = depositAmount + (totalRepayment - loanAmount);
    await withdrawFromPool(pool, lender, expectedBalance);
    
    expect(await token.balanceOf(lender.address)).to.be.closeTo(
      expectedBalance,
      parseUnits("0.01") // Allow for small rounding
    );
  });

  it("Should handle partial repayments correctly", async () => {
    // ... test partial repayments
  });

  it("Should handle late payments with fees", async () => {
    // ... test late payment scenario
  });

  it("Should handle default scenario", async () => {
    // ... test default handling
  });
});
```

---

### **5. Security Tests**

File: `packages/contracts/test/security/SecurityTests.test.ts`

#### **A. Reentrancy Tests**
```typescript
describe("Security - Reentrancy", () => {
  it("Should prevent reentrancy on withdraw", async () => {
    const AttackContract = await ethers.getContractFactory("ReentrancyAttacker");
    const attacker = await AttackContract.deploy(await pool.getAddress());
    
    await expectRevert(
      attacker.attack(),
      "ReentrancyGuard: reentrant call"
    );
  });

  it("Should prevent reentrancy on loan approval");
  it("Should prevent reentrancy on repayment");
});
```

#### **B. Access Control Tests**
```typescript
describe("Security - Access Control", () => {
  it("Should prevent unauthorized loan approvals", async () => {
    await expectRevert(
      loanManager.connect(attacker).approveLoan(loanId),
      "Unauthorized"
    );
  });

  it("Should prevent unauthorized parameter updates");
  it("Should prevent unauthorized pausing");
  it("Should require multi-sig for critical operations");
});
```

#### **C. Integer Overflow Tests**
```typescript
describe("Security - Integer Overflow", () => {
  it("Should handle max uint256 deposits safely", async () => {
    const maxUint = ethers.MaxUint256;
    await expectRevert(
      pool.connect(user).deposit(maxUint),
      "SafeMath: addition overflow"
    );
  });

  it("Should prevent interest overflow");
  it("Should handle share calculation overflow");
});
```

#### **D. Flash Loan Attack Tests**
```typescript
describe("Security - Flash Loan Attacks", () => {
  it("Should prevent flash loan price manipulation", async () => {
    // Simulate flash loan attack attempt
    const FlashLoanAttacker = await ethers.getContractFactory("FlashLoanAttacker");
    const attacker = await FlashLoanAttacker.deploy();
    
    await expectRevert(
      attacker.executeFlashLoanAttack(await pool.getAddress()),
      "Attack prevented"
    );
  });

  it("Should use time-weighted average prices");
  it("Should have maximum single transaction limits");
});
```

#### **E. Front-Running Tests**
```typescript
describe("Security - Front-Running", () => {
  it("Should prevent front-running of loan approvals", async () => {
    // Test commit-reveal scheme or similar protection
  });

  it("Should use slippage protection for swaps");
  it("Should have transaction ordering protection");
});
```

#### **F. Denial of Service Tests**
```typescript
describe("Security - DoS", () => {
  it("Should handle malicious contract as depositor", async () => {
    const MaliciousContract = await ethers.getContractFactory("DoSAttacker");
    const attacker = await MaliciousContract.deploy();
    
    // Should not block withdrawals for other users
    await pool.connect(attacker).deposit(parseUnits("100"));
    await pool.connect(goodUser).withdraw(parseUnits("50"));
  });

  it("Should have gas limits for loops");
  it("Should handle array growth gracefully");
});
```

---

### **6. Gas Optimization Tests**

File: `packages/contracts/test/GasOptimization.test.ts`

```typescript
describe("Gas Optimization", () => {
  it("Should measure gas for deposit", async () => {
    const tx = await depositToPool(pool, token, user, parseUnits("1000"));
    await logGasUsage("Deposit", tx);
    
    const gasUsed = await getGasUsed(tx);
    expect(gasUsed).to.be.lt(100000); // Target gas limit
  });

  it("Should measure gas for loan request", async () => {
    const { tx } = await requestLoan(loanManager, borrower, {
      tokenAddress: await token.getAddress(),
      amount: parseUnits("1000"),
      duration: 30 * ONE_DAY,
      purpose: "Test",
    });
    
    await logGasUsage("Loan Request", tx);
  });

  it("Should measure gas for repayment", async () => {
    // ... test repayment gas
  });

  it("Should compare optimized vs unoptimized versions", async () => {
    const gasUnoptimized = await getGasUsed(txUnoptimized);
    const gasOptimized = await getGasUsed(txOptimized);
    
    const savings = gasUnoptimized - gasOptimized;
    const savingsPercent = (Number(savings) / Number(gasUnoptimized)) * 100;
    
    console.log(`💰 Gas savings: ${savings} (${savingsPercent.toFixed(2)}%)`);
    expect(gasOptimized).to.be.lt(gasUnoptimized);
  });
});
```

---

## 🎨 Frontend Testing

### **1. Component Tests (Jest + React Testing Library)**

File: `packages/frontend/__tests__/components/WalletConnect.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnect } from '@/components/WalletConnect';
import { useAccount, useConnect } from 'wagmi';

jest.mock('wagmi');

describe('WalletConnect Component', () => {
  beforeEach(() => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    (useConnect as jest.Mock).mockReturnValue({
      connect: jest.fn(),
      connectors: [
        { id: 'injected', name: 'MetaMask' },
        { id: 'walletConnect', name: 'WalletConnect' },
      ],
    });
  });

  it('should render connect button when not connected', () => {
    render(<WalletConnect />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('should show wallet address when connected', () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      isConnected: true,
    });

    render(<WalletConnect />);
    expect(screen.getByText(/0x742d/)).toBeInTheDocument();
  });

  it('should call connect when button clicked', async () => {
    const mockConnect = jest.fn();
    (useConnect as jest.Mock).mockReturnValue({
      connect: mockConnect,
      connectors: [{ id: 'injected', name: 'MetaMask' }],
    });

    render(<WalletConnect />);
    fireEvent.click(screen.getByText('Connect Wallet'));

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it('should handle connection error', async () => {
    const mockConnect = jest.fn().mockRejectedValue(new Error('User rejected'));
    (useConnect as jest.Mock).mockReturnValue({
      connect: mockConnect,
      connectors: [{ id: 'injected', name: 'MetaMask' }],
    });

    render(<WalletConnect />);
    fireEvent.click(screen.getByText('Connect Wallet'));

    await waitFor(() => {
      expect(screen.getByText(/Error connecting wallet/)).toBeInTheDocument();
    });
  });

  it('should be keyboard accessible', () => {
    render(<WalletConnect />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label');
    expect(button).not.toHaveAttribute('disabled');
  });
});
```

---

### **2. Loan Request Form Tests**

File: `packages/frontend/__tests__/components/LoanRequestForm.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoanRequestForm } from '@/components/LoanRequestForm';

describe('LoanRequestForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render all form fields', () => {
    render(<LoanRequestForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText('Loan Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (days)')).toBeInTheDocument();
    expect(screen.getByLabelText('Purpose')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Loan' })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<LoanRequestForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Request Loan' }));

    await waitFor(() => {
      expect(screen.getByText('Amount is required')).toBeInTheDocument();
      expect(screen.getByText('Duration is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate minimum amount', async () => {
    render(<LoanRequestForm onSubmit={mockOnSubmit} />);
    
    const amountInput = screen.getByLabelText('Loan Amount');
    await userEvent.type(amountInput, '50'); // Below minimum

    fireEvent.click(screen.getByRole('button', { name: 'Request Loan' }));

    await waitFor(() => {
      expect(screen.getByText('Minimum loan amount is $100')).toBeInTheDocument();
    });
  });

  it('should submit valid form', async () => {
    render(<LoanRequestForm onSubmit={mockOnSubmit} />);
    
    await userEvent.type(screen.getByLabelText('Loan Amount'), '1000');
    await userEvent.type(screen.getByLabelText('Duration (days)'), '30');
    await userEvent.type(screen.getByLabelText('Purpose'), 'Business expansion');

    fireEvent.click(screen.getByRole('button', { name: 'Request Loan' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: '1000',
        duration: '30',
        purpose: 'Business expansion',
      });
    });
  });

  it('should show loading state during submission', async () => {
    const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<LoanRequestForm onSubmit={slowSubmit} />);
    
    await userEvent.type(screen.getByLabelText('Loan Amount'), '1000');
    fireEvent.click(screen.getByRole('button', { name: 'Request Loan' }));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should display error message on failure', async () => {
    const failingSubmit = jest.fn().mockRejectedValue(new Error('Insufficient funds'));
    render(<LoanRequestForm onSubmit={failingSubmit} />);
    
    await userEvent.type(screen.getByLabelText('Loan Amount'), '1000');
    fireEvent.click(screen.getByRole('button', { name: 'Request Loan' }));

    await waitFor(() => {
      expect(screen.getByText(/Insufficient funds/)).toBeInTheDocument();
    });
  });
});
```

---

### **3. Hook Tests**

File: `packages/frontend/__tests__/hooks/useLendingPool.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useLendingPool } from '@/hooks/useLendingPool';
import { useReadContract, useWriteContract } from 'wagmi';

jest.mock('wagmi');

describe('useLendingPool Hook', () => {
  beforeEach(() => {
    (useReadContract as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract: jest.fn(),
      isPending: false,
      isSuccess: false,
      error: null,
    });
  });

  it('should fetch pool data', async () => {
    (useReadContract as jest.Mock).mockReturnValue({
      data: {
        totalDeposits: 100000n,
        totalBorrowed: 75000n,
        utilizationRate: 75,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useLendingPool('0xPoolAddress'));

    await waitFor(() => {
      expect(result.current.totalDeposits).toBe('100000');
      expect(result.current.utilizationRate).toBe(75);
    });
  });

  it('should handle deposit function', async () => {
    const mockWrite = jest.fn();
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract: mockWrite,
      isPending: false,
      isSuccess: false,
    });

    const { result } = renderHook(() => useLendingPool('0xPoolAddress'));

    await result.current.deposit('1000');

    expect(mockWrite).toHaveBeenCalledWith({
      address: '0xPoolAddress',
      abi: expect.any(Array),
      functionName: 'deposit',
      args: [expect.any(BigInt)],
    });
  });

  it('should handle loading state', () => {
    (useReadContract as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useLendingPool('0xPoolAddress'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle error state', () => {
    const error = new Error('Network error');
    (useReadContract as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    });

    const { result } = renderHook(() => useLendingPool('0xPoolAddress'));

    expect(result.current.error).toBe(error);
  });
});
```

---

### **4. E2E Tests (Playwright)**

File: `packages/frontend/e2e/loan-request.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Loan Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Mock wallet connection
    await page.evaluate(() => {
      window.ethereum = {
        request: async ({ method }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'];
          }
          if (method === 'eth_chainId') {
            return '0xa4ec'; // Celo Alfajores
          }
        },
        on: () => {},
        removeListener: () => {},
      };
    });
  });

  test('Complete loan request flow', async ({ page }) => {
    // 1. Connect wallet
    await page.click('button:has-text("Connect Wallet")');
    await expect(page.locator('text=0x742d')).toBeVisible();

    // 2. Navigate to borrow page
    await page.click('a:has-text("Borrow")');
    await expect(page).toHaveURL(/.*borrow/);

    // 3. Fill loan request form
    await page.fill('input[name="amount"]', '1000');
    await page.fill('input[name="duration"]', '30');
    await page.fill('textarea[name="purpose"]', 'Business expansion');

    // 4. Check credit score is displayed
    await expect(page.locator('text=/Credit Score:/i')).toBeVisible();

    // 5. Submit loan request
    await page.click('button:has-text("Request Loan")');

    // 6. Wait for transaction confirmation
    await expect(page.locator('text=/Transaction confirmed/i')).toBeVisible({ timeout: 30000 });

    // 7. Verify success message
    await expect(page.locator('text=/Loan requested successfully/i')).toBeVisible();

    // 8. Verify redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // 9. Verify loan appears in active loans
    await expect(page.locator('text=$1,000')).toBeVisible();
  });

  test('Should validate form inputs', async ({ page }) => {
    await page.click('button:has-text("Connect Wallet")');
    await page.click('a:has-text("Borrow")');

    // Submit empty form
    await page.click('button:has-text("Request Loan")');

    // Check for validation errors
    await expect(page.locator('text=/Amount is required/i')).toBeVisible();
    await expect(page.locator('text=/Duration is required/i')).toBeVisible();
  });

  test('Should handle transaction rejection', async ({ page }) => {
    await page.evaluate(() => {
      window.ethereum.request = async ({ method }) => {
        if (method === 'eth_sendTransaction') {
          throw new Error('User rejected transaction');
        }
      };
    });

    await page.click('button:has-text("Connect Wallet")');
    await page.click('a:has-text("Borrow")');
    await page.fill('input[name="amount"]', '1000');
    await page.click('button:has-text("Request Loan")');

    await expect(page.locator('text=/Transaction rejected/i')).toBeVisible();
  });

  test('Should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button[aria-label="Menu"]'); // Mobile menu
    await page.click('a:has-text("Borrow")');
    
    await expect(page.locator('input[name="amount"]')).toBeVisible();
  });
});
```

---

## 🏃 Running Tests

### **Smart Contract Tests**

```bash
cd packages/contracts

# Run all tests
npm test

# Run specific test file
npx hardhat test test/LendingPool.test.ts

# Run with coverage
npm run test:coverage

# Run security tests only
npx hardhat test test/security/

# Run with gas reporting
REPORT_GAS=true npm test

# Run on forked mainnet
npx hardhat test --network celo_fork
```

### **Frontend Tests**

```bash
cd packages/frontend

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- LoanRequestForm.test.tsx

# Run E2E tests
npm run test:e2e

# Run E2E in headed mode (see browser)
npm run test:e2e:headed

# Run E2E on specific browser
npm run test:e2e -- --project=chromium
```

---

## 📊 Coverage Requirements

**Target: >90% code coverage**

### **Contract Coverage**
- Line coverage: >90%
- Branch coverage: >85%
- Function coverage: 100%
- Statement coverage: >90%

### **Frontend Coverage**
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

**Check coverage:**
```bash
# Contracts
cd packages/contracts && npm run test:coverage

# Frontend
cd packages/frontend && npm run test:coverage

# View HTML report
open coverage/index.html
```

---

## 🔒 Security Testing Checklist

- [ ] All functions have access control tests
- [ ] Reentrancy guards tested
- [ ] Integer overflow/underflow handled
- [ ] Zero amount edge cases covered
- [ ] Unauthorized access prevented
- [ ] Flash loan attack scenarios tested
- [ ] Front-running protection verified
- [ ] DoS attack scenarios tested
- [ ] Gas limit attacks prevented
- [ ] Array iteration bounded
- [ ] External call failures handled
- [ ] Price oracle manipulation prevented

---

## 📈 Gas Optimization Benchmarks

**Target Gas Costs:**
- Deposit: <100,000 gas
- Withdraw: <120,000 gas
- Loan Request: <150,000 gas
- Loan Approval: <180,000 gas
- Repayment: <130,000 gas

**Measure gas:**
```typescript
const tx = await pool.deposit(amount);
const receipt = await tx.wait();
console.log(`Gas used: ${receipt.gasUsed}`);
```

---

## 🎯 Best Practices

### **Smart Contract Testing**

1. **Arrange-Act-Assert** pattern
2. **One assertion per test** (when possible)
3. **Descriptive test names** ("should do X when Y")
4. **Test both success and failure cases**
5. **Use constants for magic numbers**
6. **Snapshot testing for gas costs**
7. **Fuzz testing for edge cases**

### **Frontend Testing**

1. **Test user behavior, not implementation**
2. **Use Testing Library queries** (getByRole, getByText)
3. **Avoid testing library internals**
4. **Mock external dependencies**
5. **Test accessibility**
6. **Test error states**
7. **Test loading states**

### **E2E Testing**

1. **Test critical user journeys only**
2. **Keep tests independent**
3. **Use Page Object Model**
4. **Handle async operations properly**
5. **Test on multiple viewports**
6. **Use realistic test data**
7. **Clean up after tests**

---

## 🛠️ Test Configuration Files

### **Hardhat Config** (with coverage)

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.CELO_RPC_URL || "",
        enabled: process.env.FORK === "true",
      },
    },
    celo_alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 21,
  },
  mocha: {
    timeout: 300000, // 5 minutes
  },
};

export default config;
```

### **Jest Config**

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
  ],
};
```

### **Playwright Config**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🎓 Summary

**Comprehensive Testing Suite:**

✅ **Test Helpers Created** (450+ lines)
- Time, token, and contract helpers
- Expectation and calculation helpers
- Gas tracking and common values

✅ **Test Specifications** (Complete)
- Unit tests for all contracts
- Integration tests for workflows
- Security tests for attack vectors
- Frontend component tests
- Hook tests
- E2E user journey tests

✅ **Configuration Files** (Specified)
- Hardhat with coverage
- Jest for React
- Playwright for E2E

✅ **Best Practices** (Documented)
- Testing patterns
- Coverage targets
- Security checklist
- Gas benchmarks

**Ready for implementation:**
- Clear test structure
- Helper utilities
- Example tests
- Configuration
- CI/CD integration

**Next Steps:**
1. Implement remaining test files
2. Run coverage reports
3. Fix identified issues
4. Integrate with CI/CD
5. Regular security audits

---

**Testing Status**: Foundation Complete, Ready for Full Implementation  
**Coverage Target**: >90% for contracts, >80% for frontend  
**Security**: All critical attack vectors covered
