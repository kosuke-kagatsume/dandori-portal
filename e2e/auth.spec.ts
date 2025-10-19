import { test, expect } from '@playwright/test';

/**
 * 認証フローのE2Eテスト
 *
 * - デモアカウントログイン
 * - ログアウト
 */

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージとCookieをクリア
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('デモアカウントでログインできる', async ({ page }) => {
    // ログインページに遷移
    await page.goto('/ja/auth/login');

    // デモアカウント情報入力ボタンが表示されるまで待つ
    await page.getByTestId('demo-login-button').waitFor({ state: 'visible', timeout: 30000 });

    // デモアカウント情報入力ボタンをクリック
    await page.getByTestId('demo-login-button').click();

    // メールアドレスとパスワードが入力されたことを確認
    await expect(page.locator('#email')).toHaveValue('demo@dandori.local');
    await expect(page.locator('#password')).toHaveValue('demo-demo-demo');

    // ログインボタンをクリック
    await page.getByTestId('login-submit-button').click();

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/ja\/dashboard/);

    // ダッシュボードの要素が表示されることを確認
    await expect(page.locator('h1,h2').filter({ hasText: 'ダッシュボード' })).toBeVisible();
  });

  test('ログアウトできる', async ({ page }) => {
    // デモアカウントでログイン
    await page.goto('/ja/auth/login');

    // デモアカウント情報入力ボタンが表示されるまで待つ
    await page.getByTestId('demo-login-button').waitFor({ state: 'visible', timeout: 30000 });

    await page.getByTestId('demo-login-button').click();
    await page.getByTestId('login-submit-button').click();
    await expect(page).toHaveURL(/\/ja\/dashboard/);

    // 確認ダイアログを自動承認するリスナーを設定
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('ログアウトしますか');
      await dialog.accept();
    });

    // ユーザードロップダウンを開く
    await page.getByTestId('user-menu-trigger').click();

    // ログアウトボタンをクリック
    await page.getByTestId('logout-button').click();

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/ja\/auth\/login/);
  });
});
