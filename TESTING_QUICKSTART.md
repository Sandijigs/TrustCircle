# TrustCircle Testing Quick Start Guide

## Installation

First, install all dependencies:

```bash
# From project root
npm install

# Or install for specific packages
npm install --workspace=@trustcircle/contracts
npm install --workspace=@trustcircle/frontend
```

## Running Tests

### Smart Contract Tests

#### All Contract Tests
```bash
npm run test --workspace=@trustcircle/contracts
```

#### Specific Test Suites
```bash
# Unit tests only (excludes integration and security)
npm run test:unit --workspace=@trustcircle/contracts

# Integration tests
npm run test:integration --workspace=@trustcircle/contracts

# Security tests
npm run test:security --workspace=@trustcircle/contracts
```

#### Coverage Report
```bash
npm run test:coverage --workspace=@trustcircle/contracts
```

This generates:
- Console output with coverage percentages
- HTML report in `packages/contracts/coverage/`
- Open `coverage/index.html` in browser for detailed view

#### Gas Usage Report
```bash
npm run test:gas --workspace=@trustcircle/contracts
```

Outputs:
- Gas costs for each function
- Average and median costs
- Report saved to `gas-report.txt`

#### Run Specific Test File
```bash
cd packages/contracts
npx hardhat test test/LendingPool.test.ts
npx hardhat test test/integration/FullLoanLifecycle.test.ts
npx hardhat test test/security/SecurityTests.test.ts
```

### Frontend Tests

#### Component & Hook Tests
```bash
# Run all tests
npm run test --workspace=@trustcircle/frontend

# Watch mode (re-runs on file changes)
npm run test -- --watch

# With UI interface
npm run test:ui --workspace=@trustcircle/frontend

# Coverage
npm run test:coverage --workspace=@trustcircle/frontend
```

#### E2E Tests with Playwright
```bash
# Headless mode (CI)
npm run test:e2e --workspace=@trustcircle/frontend

# With UI (recommended for development)
npm run test:e2e:ui --workspace=@trustcircle/frontend

# Headed mode (see browser)
npm run test:e2e:headed --workspace=@trustcircle/frontend

# Specific browser
cd packages/frontend
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**Note:** E2E tests require the dev server to be running:
```bash
# Terminal 1
npm run dev --workspace=@trustcircle/frontend

# Terminal 2
npm run test:e2e --workspace=@trustcircle/frontend
```

### Run All Tests
```bash
npm run test --workspaces
```

## Test Structure

```
packages/contracts/test/
├── helpers/
│   └── testHelpers.ts          # Shared utilities
├── integration/
│   └── FullLoanLifecycle.test.ts  # End-to-end flows
├── security/
│   └── SecurityTests.test.ts    # Attack scenarios
├── LendingPool.test.ts          # Unit tests
├── LendingCircle.test.ts        # Unit tests
└── LoanManager.test.ts          # Unit tests

packages/frontend/
├── __tests__/
│   ├── mocks/
│   │   └── mockWeb3.ts          # Web3 mocks
│   ├── components/
│   │   ├── LoanRequestForm.test.tsx
│   │   └── CreditScoreDisplay.test.tsx
│   └── hooks/
│       └── useLendingPool.test.ts
└── e2e/
    └── loan-request.spec.ts      # Playwright E2E
```

## Expected Output

### Smart Contract Tests

Successful run should show:
```
  LendingPool
    Deployment
      ✔ Should set the right owner (45ms)
      ✔ Should create pool with correct asset (32ms)
    Deposits
      ✔ Should allow deposits (67ms)
      ✔ Should mint LP shares on deposit (54ms)
    ...
  
  150 passing (12s)
```

Coverage report:
```
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
LendingPool.sol        |   95.5  |   88.2   |   96.3  |   94.8  |
LoanManager.sol        |   93.2  |   85.7   |   94.1  |   92.9  |
LendingCircle.sol      |   91.8  |   83.3   |   92.5  |   91.2  |
-----------------------|---------|----------|---------|---------|
All files              |   93.5  |   85.7   |   94.3  |   93.0  |
```

Gas report:
```
·--------------------------------|---------------------------|-----------|----------·
|      Solc version: 0.8.24      ·  Optimizer enabled: true  ·  Runs: 200          |
·································|···························|·············|··········
|  Methods                       ·               Gas costs                          |
·················|···············|·········|·········|·········|··········|··········
|  Contract      ·  Method       ·  Min    ·  Max    ·  Avg    ·  # calls ·  USD   |
·················|···············|·········|·········|·········|··········|··········
|  LendingPool   ·  deposit     ·  145k   ·  165k   ·  152k   ·   45     ·  $4.56 |
|  LendingPool   ·  withdraw    ·  115k   ·  135k   ·  123k   ·   32     ·  $3.69 |
|  LoanManager   ·  requestLoan ·  175k   ·  195k   ·  184k   ·   67     ·  $5.52 |
·················|···············|·········|·········|·········|··········|··········
```

### Frontend Tests

```
 ✓ __tests__/components/LoanRequestForm.test.tsx (8)
   ✓ LoanRequestForm (8)
     ✓ renders loan request form
     ✓ validates minimum loan amount
     ✓ validates maximum loan amount
     ...

 ✓ __tests__/components/CreditScoreDisplay.test.tsx (7)
 ✓ __tests__/hooks/useLendingPool.test.ts (8)

 Test Files  3 passed (3)
      Tests  23 passed (23)
   Duration  2.3s
```

E2E Tests:
```
Running 20 tests using 5 workers

  ✓ should display homepage (523ms)
  ✓ should navigate to loan request page (412ms)
  ✓ should validate loan amount input (678ms)
  ...

  20 passed (24.5s)
```

## Debugging Failed Tests

### Smart Contract Tests

If a test fails:

1. **Read the error message carefully:**
   ```
   Error: VM Exception while processing transaction: reverted with custom error 'InsufficientBalance()'
   ```

2. **Check test expectations vs actual:**
   ```
   AssertionError: expected 1000000000000000000000n to equal 2000000000000000000000n
   ```

3. **Enable console logging in Solidity:**
   ```solidity
   import "hardhat/console.sol";
   console.log("Balance:", balance);
   ```

4. **Run single test:**
   ```bash
   npx hardhat test test/LendingPool.test.ts --grep "Should allow deposits"
   ```

### Frontend Tests

If a test fails:

1. **Check async operations:**
   - Use `waitFor` for async updates
   - Check if components finished loading

2. **Inspect mocks:**
   - Verify mock return values
   - Check if mocks are properly set up

3. **Debug with --ui:**
   ```bash
   npm run test:ui --workspace=@trustcircle/frontend
   ```

4. **Run specific test:**
   ```bash
   npx vitest run __tests__/components/LoanRequestForm.test.tsx
   ```

### E2E Tests

1. **Run in headed mode to see what's happening:**
   ```bash
   npm run test:e2e:headed --workspace=@trustcircle/frontend
   ```

2. **Use Playwright Inspector:**
   ```bash
   cd packages/frontend
   PWDEBUG=1 npx playwright test
   ```

3. **Check screenshots on failure:**
   - Saved to `test-results/` folder
   - Open HTML report: `npx playwright show-report`

## Common Issues

### Issue: "Cannot find module"
**Solution:** Run `npm install` in the specific package

### Issue: "Network connection timeout"
**Solution:** Check your RPC URL in `.env.local`

### Issue: "Transaction reverted"
**Solution:** Check if contracts are deployed and addresses are correct

### Issue: "Tests are slow"
**Solutions:**
- Run specific test files instead of all
- Use `--parallel` flag for Hardhat
- Reduce number of test iterations

### Issue: "Gas estimation failed"
**Solution:** Check if you have enough test ETH, verify contract deployment

### Issue: E2E tests fail with "Target closed"
**Solution:** Ensure dev server is running on correct port (3000)

## Best Practices

1. **Run tests before committing:**
   ```bash
   npm run test --workspaces
   ```

2. **Check coverage regularly:**
   ```bash
   npm run test:coverage --workspace=@trustcircle/contracts
   ```

3. **Run security tests before deployment:**
   ```bash
   npm run test:security --workspace=@trustcircle/contracts
   ```

4. **Test on multiple browsers (E2E):**
   ```bash
   npx playwright test --project=chromium --project=firefox
   ```

5. **Update snapshots when UI changes:**
   ```bash
   npm run test -- --update
   ```

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage --workspace=@trustcircle/contracts
      - run: npm run test:security --workspace=@trustcircle/contracts
      
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage --workspace=@trustcircle/frontend
      - run: npx playwright install
      - run: npm run build --workspace=@trustcircle/frontend
      - run: npm run test:e2e --workspace=@trustcircle/frontend
```

## Next Steps

1. **First Run:**
   ```bash
   npm install
   npm run test --workspaces
   ```

2. **Review Coverage:**
   - Check which areas need more tests
   - Aim for >90% on critical paths

3. **Fix Any Failures:**
   - Some tests may need contract addresses updated
   - Mock data may need adjustment

4. **Customize:**
   - Add project-specific test cases
   - Adjust mock data to match your scenarios
   - Add more E2E flows for your specific features

5. **Setup CI/CD:**
   - Configure automated test runs
   - Add deployment tests
   - Set up alerts for test failures

## Resources

- [Hardhat Testing](https://hardhat.org/tutorial/testing-contracts)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers/)

## Support

If you encounter issues:
1. Check error messages carefully
2. Review test configuration files
3. Ensure all dependencies are installed
4. Check that contracts are compiled
5. Verify network configuration

---

**Ready to test!** 🚀

Start with: `npm install && npm run test --workspaces`
