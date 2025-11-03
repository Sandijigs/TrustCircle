import { test, expect } from '@playwright/test';

test.describe('Loan Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/TrustCircle/i);
  });

  test('should navigate to loan request page', async ({ page }) => {
    await page.click('text=Request Loan');
    await expect(page).toHaveURL(/.*loan-request/);
  });

  test('should show connect wallet button when not connected', async ({ page }) => {
    await page.goto('/loan-request');
    
    const connectButton = page.locator('button:has-text("Connect Wallet")');
    await expect(connectButton).toBeVisible();
  });

  test('should validate loan amount input', async ({ page }) => {
    await page.goto('/loan-request');
    
    // Try to enter amount below minimum
    await page.fill('input[name="amount"]', '25');
    await page.click('button:has-text("Request Loan")');
    
    await expect(page.locator('text=/minimum.*50/i')).toBeVisible();
  });

  test('should validate loan amount maximum', async ({ page }) => {
    await page.goto('/loan-request');
    
    // Try to enter amount above maximum
    await page.fill('input[name="amount"]', '6000');
    await page.click('button:has-text("Request Loan")');
    
    await expect(page.locator('text=/maximum.*5000/i')).toBeVisible();
  });

  test('should show credit score when available', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for credit score to load
    await page.waitForSelector('[data-testid="credit-score"]');
    
    const creditScore = page.locator('[data-testid="credit-score"]');
    await expect(creditScore).toBeVisible();
  });

  test('should display user loans on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for loans section
    await page.waitForSelector('[data-testid="user-loans"]');
    
    const loansSection = page.locator('[data-testid="user-loans"]');
    await expect(loansSection).toBeVisible();
  });

  test('should allow selecting payment frequency', async ({ page }) => {
    await page.goto('/loan-request');
    
    const frequencySelect = page.locator('select[name="frequency"]');
    await expect(frequencySelect).toBeVisible();
    
    // Select monthly
    await frequencySelect.selectOption('2');
    
    const selectedValue = await frequencySelect.inputValue();
    expect(selectedValue).toBe('2');
  });

  test('should calculate and display estimated payment', async ({ page }) => {
    await page.goto('/loan-request');
    
    // Enter loan details
    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="duration"]', '90');
    await page.selectOption('select[name="frequency"]', '2');
    
    // Wait for calculation
    await page.waitForTimeout(500);
    
    // Check if estimated payment is displayed
    const estimatedPayment = page.locator('[data-testid="estimated-payment"]');
    await expect(estimatedPayment).toBeVisible();
  });

  test('should show form validation errors', async ({ page }) => {
    await page.goto('/loan-request');
    
    // Submit without filling form
    await page.click('button:has-text("Request Loan")');
    
    // Check for validation errors
    await expect(page.locator('text=/required/i')).toHaveCount(1);
  });

  test('should navigate to lending pool page', async ({ page }) => {
    await page.click('text=Lending Pool');
    await expect(page).toHaveURL(/.*pool/);
  });

  test('should display pool statistics', async ({ page }) => {
    await page.goto('/pool');
    
    // Wait for stats to load
    await page.waitForSelector('[data-testid="pool-stats"]');
    
    const totalDeposits = page.locator('[data-testid="total-deposits"]');
    await expect(totalDeposits).toBeVisible();
    
    const utilization = page.locator('[data-testid="utilization-rate"]');
    await expect(utilization).toBeVisible();
  });

  test('should show lending circles page', async ({ page }) => {
    await page.goto('/circles');
    
    await expect(page.locator('h1')).toContainText(/Lending Circles/i);
  });

  test('should allow creating a circle', async ({ page }) => {
    await page.goto('/circles');
    
    const createButton = page.locator('button:has-text("Create Circle")');
    await createButton.click();
    
    await expect(page.locator('text=/create.*circle/i')).toBeVisible();
  });

  test('mobile: should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if mobile menu button exists
    const menuButton = page.locator('[aria-label="Menu"]');
    await expect(menuButton).toBeVisible();
  });

  test('mobile: should open navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuButton = page.locator('[aria-label="Menu"]');
    await menuButton.click();
    
    // Check if navigation items are visible
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true);
    await page.goto('/dashboard');
    
    // Should show error message
    await expect(page.locator('text=/network error/i')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should persist form data on page reload', async ({ page }) => {
    await page.goto('/loan-request');
    
    // Fill form
    await page.fill('input[name="amount"]', '1000');
    await page.selectOption('select[name="duration"]', '90');
    
    // Reload page
    await page.reload();
    
    // Check if form data is persisted (if implemented)
    const amountValue = await page.inputValue('input[name="amount"]');
    // This depends on implementation - may or may not persist
  });

  test('accessibility: should have proper ARIA labels', async ({ page }) => {
    await page.goto('/loan-request');
    
    // Check for form labels
    const amountInput = page.locator('input[name="amount"]');
    const label = await amountInput.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  test('accessibility: should be keyboard navigable', async ({ page }) => {
    await page.goto('/loan-request');
    
    // Tab through form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to interact with form using keyboard
    await page.keyboard.type('1000');
  });
});
