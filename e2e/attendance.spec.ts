import { test, expect } from '@playwright/test';

/**
 * E2E Test: Attendance Clock-in/out Flow
 *
 * Tests the attendance management functionality including:
 * - Clock-in flow with work location selection
 * - Clock-out flow with memo
 * - Attendance calendar and history display
 */
test.describe('Attendance Management Flow', () => {
  /**
   * Helper function to login as demo user
   * Reusable across all tests in this suite
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

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('/ja/auth/login');
    await page.evaluate(() => {
      localStorage.removeItem('attendance-store');
      localStorage.removeItem('attendance-store-date');
    });
  });

  test('should navigate to attendance page and verify page structure', async ({ page }) => {
    // Login as demo user
    await loginAsDemoUser(page);

    // Navigate to attendance page
    await page.goto('/ja/attendance');
    await page.waitForURL('/ja/attendance');

    // Verify page title contains "勤怠管理" or "勤怠"
    await expect(page.locator('h1')).toContainText(/勤怠/);

    // Verify page description is visible
    await expect(page.locator('text=勤怠記録の打刻と管理を行います')).toBeVisible();

    // Verify stats cards are displayed (月間実働時間, 残業時間, etc.)
    const statsCards = page.locator('.card, [class*="card"]').filter({ hasText: /月間実働時間|残業時間/ });
    await expect(statsCards.first()).toBeVisible();

    // Verify check-in card is visible
    const checkInCard = page.locator('text=勤怠打刻システム').first();
    await expect(checkInCard).toBeVisible({ timeout: 10000 });

    // Verify tabs are present (勤怠一覧, チーム勤怠, カレンダー, 統計)
    await expect(page.getByRole('tab', { name: /勤怠一覧/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /カレンダー/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /統計/ })).toBeVisible();
  });

  test('should complete clock-in flow successfully', async ({ page }) => {
    // Login and navigate to attendance page
    await loginAsDemoUser(page);
    await page.goto('/ja/attendance');
    await page.waitForURL('/ja/attendance');

    // Wait for the check-in button to be visible
    const checkInButton = page.getByRole('button', { name: /出勤する|出勤|チェックイン/i });
    await expect(checkInButton).toBeVisible({ timeout: 10000 });

    // Click the check-in button
    await checkInButton.click();

    // Work location dialog should appear
    await expect(page.getByRole('heading', { name: '勤務場所を選択' })).toBeVisible({ timeout: 5000 });

    // Select office location (オフィス勤務)
    const officeOption = page.locator('label:has-text("オフィス勤務")');
    await expect(officeOption).toBeVisible();
    await officeOption.click();

    // Confirm clock-in
    const confirmButton = page.getByRole('button', { name: /出勤する/ }).last();
    await confirmButton.click();

    // Verify success toast notification
    await expect(page.locator('text=/出勤打刻完了|出勤しました/i').first()).toBeVisible({ timeout: 5000 });

    // Verify the button changes to clock-out state (退勤する button should be visible)
    const checkOutButton = page.getByRole('button', { name: /退勤する|退勤|チェックアウト/i });
    await expect(checkOutButton).toBeVisible({ timeout: 5000 });

    // Verify check-in time is displayed (format: HH:MM)
    // Note: Complex selector, skip detailed time format check for now
    await page.waitForTimeout(1000); // Wait for UI to stabilize

    // Verify check-in button is no longer visible
    await expect(page.getByRole('button', { name: /^出勤する$/ })).not.toBeVisible();
  });

  test('should complete full clock-in and clock-out flow', async ({ page }) => {
    // Login and navigate to attendance page
    await loginAsDemoUser(page);
    await page.goto('/ja/attendance');
    await page.waitForURL('/ja/attendance');

    // Step 1: Clock-in
    const checkInButton = page.getByRole('button', { name: /出勤する|出勤|チェックイン/i });
    await expect(checkInButton).toBeVisible({ timeout: 10000 });
    await checkInButton.click();

    // Select work location (在宅勤務 for variety)
    await expect(page.getByRole('heading', { name: '勤務場所を選択' })).toBeVisible({ timeout: 5000 });
    const homeOption = page.locator('label:has-text("在宅勤務")');
    await homeOption.click();

    const confirmCheckInButton = page.getByRole('button', { name: /出勤する/ }).last();
    await confirmCheckInButton.click();

    // Wait for clock-in to complete
    await expect(page.locator('text=/出勤打刻完了|出勤しました/i').first()).toBeVisible({ timeout: 5000 });

    // Step 2: Clock-out
    // Wait a moment to ensure UI has updated
    await page.waitForTimeout(1000);

    const checkOutButton = page.getByRole('button', { name: /退勤する|退勤|チェックアウト/i });
    await expect(checkOutButton).toBeVisible({ timeout: 5000 });
    await checkOutButton.click();

    // Memo dialog should appear
    await expect(page.locator('text=退勤処理')).toBeVisible({ timeout: 5000 });

    // Optionally add a memo
    const memoTextarea = page.locator('textarea[placeholder*="本日の業務内容"]');
    if (await memoTextarea.isVisible()) {
      await memoTextarea.fill('E2Eテストによる勤怠記録');
    }

    // Confirm clock-out
    const confirmCheckOutButton = page.getByRole('button', { name: /退勤する/ }).last();
    await confirmCheckOutButton.click();

    // Verify success message
    await expect(page.locator('text=/退勤打刻完了|お疲れ様でした/i').first()).toBeVisible({ timeout: 5000 });

    // Verify status is updated to "finished"
    await expect(page.locator('text=本日の勤務終了')).toBeVisible({ timeout: 5000 });

    // Verify both check-in and check-out times are displayed
    // Note: Complex selector, skip detailed time format check for now
    await page.waitForTimeout(1000); // Wait for UI to stabilize
  });

  test('should display attendance history in calendar view', async ({ page }) => {
    // Login and navigate to attendance page
    await loginAsDemoUser(page);
    await page.goto('/ja/attendance');
    await page.waitForURL('/ja/attendance');

    // Click on the calendar tab
    const calendarTab = page.getByRole('tab', { name: /カレンダー/ });
    await calendarTab.click();

    // Wait for calendar to load
    await page.waitForTimeout(1000);

    // Verify calendar is displayed
    await expect(page.locator('text=勤怠カレンダー').first()).toBeVisible({ timeout: 10000 });

    // Verify calendar description
    await expect(page.locator('text=日付をクリックすると詳細を確認できます')).toBeVisible();

    // Verify legend is displayed (出勤, 在宅勤務, etc.)
    await expect(page.locator('text=凡例')).toBeVisible();
    await expect(page.locator('text=出勤').nth(2)).toBeVisible();
    await expect(page.locator('text=在宅勤務').last()).toBeVisible();

    // Verify monthly stats are displayed
    await expect(page.locator('text=今月の実績')).toBeVisible();
    await expect(page.locator('text=出勤日数')).toBeVisible();
    await expect(page.locator('text=総労働時間')).toBeVisible();

    // Verify calendar component renders (check for calendar table or grid)
    const calendar = page.locator('.rdp, [class*="calendar"]').first();
    await expect(calendar).toBeVisible({ timeout: 10000 });
  });

  test('should display attendance list with records', async ({ page }) => {
    // Login and navigate to attendance page
    await loginAsDemoUser(page);
    await page.goto('/ja/attendance');
    await page.waitForURL('/ja/attendance');

    // By default, the "勤怠一覧" tab should be active
    // Verify the attendance list card is visible
    await expect(page.locator('text=勤怠一覧').first()).toBeVisible();
    await expect(page.locator('text=過去の勤怠記録を確認・管理')).toBeVisible();

    // Verify CSV export button is present
    const csvButton = page.getByRole('button', { name: /CSV出力/ });
    await expect(csvButton).toBeVisible();

    // Verify table headers exist (日付, 出勤, 退勤, etc.)
    const tableArea = page.locator('[class*="table"], table').first();
    if (await tableArea.isVisible({ timeout: 2000 })) {
      // Table should have headers
      await expect(page.locator('text=/日付|出勤|退勤|実働/').first()).toBeVisible();
    }

    // Verify search input is present
    const searchInput = page.locator('input[placeholder*="検索"], input[placeholder*="日付"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle break time flow', async ({ page }) => {
    // Login and navigate to attendance page
    await loginAsDemoUser(page);
    await page.goto('/ja/attendance');
    await page.waitForURL('/ja/attendance');

    // Clock-in first
    const checkInButton = page.getByRole('button', { name: /出勤する|出勤|チェックイン/i });
    await expect(checkInButton).toBeVisible({ timeout: 10000 });
    await checkInButton.click();

    // Select work location
    await expect(page.getByRole('heading', { name: '勤務場所を選択' })).toBeVisible({ timeout: 5000 });
    const officeOption = page.locator('label:has-text("オフィス勤務")');
    await officeOption.click();

    const confirmCheckInButton = page.getByRole('button', { name: /出勤する/ }).last();
    await confirmCheckInButton.click();

    // Wait for check-in to complete
    await expect(page.locator('text=/出勤打刻完了|出勤しました/i').first()).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Start break
    const breakStartButton = page.getByRole('button', { name: /休憩開始/ });
    await expect(breakStartButton).toBeVisible({ timeout: 5000 });
    await breakStartButton.click();

    // Verify break started toast
    await expect(page.locator('text=/休憩開始/i').first()).toBeVisible({ timeout: 5000 });

    // Verify break end button appears
    const breakEndButton = page.getByRole('button', { name: /休憩終了/ });
    await expect(breakEndButton).toBeVisible({ timeout: 5000 });

    // End break
    await breakEndButton.click();

    // Verify break ended toast
    await expect(page.locator('text=/休憩終了/i').first()).toBeVisible({ timeout: 5000 });

    // Verify break time is recorded (should show in the break time display)
    await expect(page.locator('text=休憩時間')).toBeVisible();
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Login and navigate to attendance page
    await loginAsDemoUser(page);
    await page.goto('/ja/attendance');
    await page.waitForURL('/ja/attendance');

    // Test switching to Team tab
    const teamTab = page.getByRole('tab', { name: /チーム勤怠/ });
    await teamTab.click();
    await expect(page.locator('text=チーム勤怠状況')).toBeVisible({ timeout: 5000 });

    // Test switching to Calendar tab
    const calendarTab = page.getByRole('tab', { name: /カレンダー/ });
    await calendarTab.click();
    await expect(page.locator('text=勤怠カレンダー')).toBeVisible({ timeout: 5000 });

    // Test switching to Analytics/Statistics tab
    const analyticsTab = page.getByRole('tab', { name: /統計/ });
    await analyticsTab.click();
    await expect(page.locator('text=月次実績サマリー')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=36協定状況')).toBeVisible();

    // Switch back to list tab
    const listTab = page.getByRole('tab', { name: /勤怠一覧/ });
    await listTab.click();
    await expect(page.locator('text=過去の勤怠記録を確認・管理')).toBeVisible({ timeout: 5000 });
  });
});
