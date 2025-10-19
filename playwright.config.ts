import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Dandori Portal のエンドツーエンドテスト設定
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',

  // 各テストのタイムアウト（30秒）
  timeout: 30000,

  // 並列実行の設定
  fullyParallel: true,

  // CI環境での再試行設定
  retries: process.env.CI ? 2 : 0,

  // 並列ワーカー数（CI環境では1つ、ローカルでは未定義）
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 共通設定
  use: {
    // ベースURL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // トレース設定（失敗時のみ記録）
    trace: 'on-first-retry',

    // スクリーンショット設定（失敗時のみ）
    screenshot: 'only-on-failure',

    // ビデオ設定（失敗時のみ）
    video: 'retain-on-failure',

    // タイムアウト設定
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // プロジェクト設定（ブラウザ別）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 開発サーバー設定（既存のサーバーを使用）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
