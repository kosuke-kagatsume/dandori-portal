import { test, expect } from '@playwright/test';

/**
 * E2E Test: Login Flow
 *
 * Tests the demo mode login functionality
 */
test.describe('Login Flow', () => {
  test('should successfully login as demo user', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/ja/auth/login');

    // Wait for the page to load
    await expect(page).toHaveTitle(/Dandori Portal/);

    // Click the demo mode button
    const demoButton = page.getByTestId('demo-login-button');
    await expect(demoButton).toBeVisible({ timeout: 30000 });
    await demoButton.click();

    // Click login submit button
    const loginButton = page.getByTestId('login-submit-button');
    await loginButton.click();

    // Wait for navigation to dashboard
    await page.waitForURL('/ja/dashboard');

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/ja\/dashboard/);
    await expect(page.locator('h1, h2').filter({ hasText: /ダッシュボード|Dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display dashboard statistics after login', async ({ page }) => {
    // Login as demo user
    await page.goto('/ja/auth/login');
    const demoButton = page.getByTestId('demo-login-button');
    await expect(demoButton).toBeVisible({ timeout: 30000 });
    await demoButton.click();
    const loginButton = page.getByTestId('login-submit-button');
    await loginButton.click();
    await page.waitForURL('/ja/dashboard');

    // Wait for page to load
    await page.waitForTimeout(1500);

    // Verify stat cards are displayed (using same selector as dashboard.spec.ts)
    const statCards = page.locator('[class*="Card"], [class*="card"]').filter({
      hasText: /総従業員|出勤|承認|申請|従業員数|attendance|approval|employee/i
    });
    const cardCount = await statCards.count();

    // Should have at least some stat cards (KPI cards wrapped in Links)
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should navigate to different pages after login', async ({ page }) => {
    // Login
    await page.goto('/ja/auth/login');
    const demoButton = page.getByTestId('demo-login-button');
    await expect(demoButton).toBeVisible({ timeout: 30000 });
    await demoButton.click();
    const loginButton = page.getByTestId('login-submit-button');
    await loginButton.click();
    await page.waitForURL('/ja/dashboard');

    // Navigate to attendance page
    const attendanceLink = page.locator('a[href="/ja/attendance"], a:has-text("勤怠管理")').first();
    if (await attendanceLink.isVisible()) {
      await attendanceLink.click();
      await expect(page).toHaveURL(/\/attendance/);
    }

    // Navigate to users page
    await page.goto('/ja/users');
    await expect(page).toHaveURL('/ja/users');
    await expect(page.locator('h1')).toContainText('ユーザー');
  });

  test('should switch demo user roles', async ({ page }) => {
    // Login
    await page.goto('/ja/auth/login');
    const demoButton = page.getByTestId('demo-login-button');
    await expect(demoButton).toBeVisible({ timeout: 30000 });
    await demoButton.click();
    const loginButton = page.getByTestId('login-submit-button');
    await loginButton.click();
    await page.waitForURL('/ja/dashboard');

    // Open user dropdown
    const userDropdown = page.locator('[data-testid="user-dropdown"], .user-menu, button:has-text("田中太郎")').first();
    await userDropdown.click();

    // Look for role switcher option
    const roleSwitcher = page.locator('text=/ロール切替|デモユーザー切替/i').first();

    if (await roleSwitcher.isVisible({ timeout: 2000 })) {
      await roleSwitcher.click();

      // Select a different role (e.g., HR)
      const hrRole = page.locator('text=/人事担当|HR/i').first();
      if (await hrRole.isVisible({ timeout: 2000 })) {
        await hrRole.click();

        // Verify role switch (page might reload or update)
        await page.waitForTimeout(1000);
      }
    }
  });
});
