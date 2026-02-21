/**
 * デモデータモジュール
 *
 * 環境変数 NEXT_PUBLIC_DEMO_MODE が 'true' の場合のみデモデータを読み込む
 * 本番環境では空のデータを返す
 */

import type { OnboardingApplication } from '@/types/onboarding';

/**
 * デモモードかどうかを判定
 */
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

/**
 * デモデータを取得
 * デモモードでない場合は null を返す
 */
export async function getDemoOnboardingApplication(): Promise<OnboardingApplication | null> {
  if (!isDemoMode()) {
    return null;
  }

  // 動的インポートでデモデータを読み込む
  const { demoOnboardingApplication } = await import('@/lib/demo-onboarding-data');
  return demoOnboardingApplication;
}

/**
 * デモデータを取得（同期版、サーバーサイド用）
 * デモモードでない場合は null を返す
 */
export function getDemoOnboardingApplicationSync(): OnboardingApplication | null {
  if (!isDemoMode()) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { demoOnboardingApplication } = require('@/lib/demo-onboarding-data');
  return demoOnboardingApplication;
}
