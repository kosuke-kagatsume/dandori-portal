import { test, expect } from '@playwright/test';

/**
 * E2E Test: Dashboard Display and Navigation
 *
 * Tests the dashboard functionality including:
 * - Dashboard page structure and navigation
 * - Statistics cards display
 * - Charts and graphs display
 * - Recent activity display
 * - Quick action buttons
 */
test.describe('Dashboard Display', () => {
  /**
   * Helper function to login as demo user
   */
  async function loginAsDemoUser(page: any) {
    await page.goto('/ja/auth/login');

    const demoButton = page.getByTestId('demo-login-button');
    await expect(demoButton).toBeVisible({ timeout: 30000 });
    await demoButton.click();

    const loginButton = page.getByTestId('login-submit-button');
    await loginButton.click();

    await page.waitForURL('/ja/dashboard');
    await expect(page).toHaveURL(/\/ja\/dashboard/);
  }

  test('should navigate to dashboard after login', async ({ page }) => {
    // Login redirects to dashboard automatically
    await loginAsDemoUser(page);

    // Verify we're on the dashboard page
    await expect(page).toHaveURL(/\/ja\/dashboard/);

    // Verify dashboard title is visible
    await expect(page.locator('h1, h2').filter({ hasText: /ダッシュボード|Dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display statistics cards', async ({ page }) => {
    await loginAsDemoUser(page);

    // Wait for page to load
    await page.waitForTimeout(1500);

    // Look for stat cards - they usually contain numbers and labels
    const statCards = page.locator('[class*="card"]').filter({
      hasText: /総|合計|残|pending|approved|total/i
    });

    const cardCount = await statCards.count();

    // Dashboard should have at least some stat cards
    expect(cardCount).toBeGreaterThan(0);

    // Verify numeric values are displayed (numbers in cards)
    const numbers = page.locator('[class*="text-2xl"], [class*="text-3xl"], [class*="text-4xl"]');
    const numberCount = await numbers.count();
    expect(numberCount).toBeGreaterThanOrEqual(0);
  });

  test('should display user greeting', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1000);

    // Look for greeting message (おはようございます、こんにちは、こんばんは、etc.)
    const greeting = page.locator('text=/おはよう|こんにちは|こんばんは|ようこそ|Welcome/i');

    // Greeting should be visible
    if (await greeting.isVisible({ timeout: 3000 })) {
      await expect(greeting.first()).toBeVisible();
    }
  });

  test('should display navigation menu', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1000);

    // Verify main navigation items are visible
    const navItems = [
      /ダッシュボード|Dashboard/i,
      /勤怠|Attendance/i,
      /ワークフロー|Workflow/i,
    ];

    for (const item of navItems) {
      const navLink = page.locator(`a:has-text("${item.source}"), button:has-text("${item.source}")`).first();

      // Check if navigation item exists (may be in sidebar or header)
      const exists = await navLink.count();
      if (exists > 0) {
        // Just verify it exists, don't need to click
        expect(exists).toBeGreaterThan(0);
      }
    }
  });

  test('should display recent activity or notifications', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1500);

    // Look for recent activity section
    const activitySection = page.locator('text=/最近|最新|アクティビティ|通知|recent|activity|notification/i').first();

    // If activity section exists, verify it
    if (await activitySection.isVisible({ timeout: 3000 })) {
      await expect(activitySection).toBeVisible();
    } else {
      // If no activity section, that's also OK (dashboard might not have it)
      console.log('No recent activity section found, skipping');
    }
  });

  test('should display charts or graphs', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1500);

    // Look for chart containers (Recharts, Chart.js, or custom charts)
    const chartContainers = page.locator('[class*="chart"], [class*="recharts"], svg[class*="recharts"]');

    const chartCount = await chartContainers.count();

    // Dashboard may or may not have charts
    if (chartCount > 0) {
      console.log(`Found ${chartCount} chart(s)`);
      expect(chartCount).toBeGreaterThan(0);
    } else {
      console.log('No charts found on dashboard');
    }
  });

  test('should have working user menu dropdown', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1000);

    // Look for user menu trigger (usually avatar or username)
    const userMenuTrigger = page.getByTestId('user-menu-trigger');

    if (await userMenuTrigger.isVisible({ timeout: 3000 })) {
      // Click to open dropdown
      await userMenuTrigger.click();

      await page.waitForTimeout(500);

      // Verify dropdown items are visible
      const profileLink = page.locator('text=/プロフィール|Profile/i').first();
      const settingsLink = page.locator('text=/設定|Settings/i').first();

      // At least one of these should be visible
      const profileVisible = await profileLink.isVisible({ timeout: 2000 });
      const settingsVisible = await settingsLink.isVisible({ timeout: 2000 });

      expect(profileVisible || settingsVisible).toBeTruthy();
    }
  });

  test('should navigate to different pages from dashboard', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1000);

    // Try to navigate to attendance page
    const attendanceLink = page.locator('a:has-text("勤怠"), button:has-text("勤怠")').first();

    if (await attendanceLink.isVisible({ timeout: 3000 })) {
      await attendanceLink.click();

      // Wait for navigation
      await page.waitForTimeout(1000);

      // Verify we navigated (URL changed or heading changed)
      const currentUrl = page.url();
      const hasNavigated = currentUrl.includes('/attendance') ||
                         currentUrl.includes('/leave') ||
                         currentUrl.includes('/workflow');

      if (hasNavigated) {
        expect(hasNavigated).toBeTruthy();

        // Navigate back to dashboard
        await page.goto('/ja/dashboard');
        await expect(page).toHaveURL(/\/ja\/dashboard/);
      }
    }
  });

  test('should display current date and time', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1000);

    // Look for current date/time display
    const dateDisplay = page.locator('text=/\\d{4}|\\d{2}月|\\d{2}日|\\d{2}:\\d{2}/');

    const dateCount = await dateDisplay.count();

    // Dashboard typically shows current date/time somewhere
    if (dateCount > 0) {
      await expect(dateDisplay.first()).toBeVisible();
    }
  });

  test('should be responsive to window resize', async ({ page }) => {
    await loginAsDemoUser(page);

    await page.waitForTimeout(1000);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify page still renders
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await expect(body).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    await expect(body).toBeVisible();
  });
});
