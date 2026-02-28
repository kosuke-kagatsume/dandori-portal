/**
 * トークン管理ユーティリティ
 *
 * トークンの有効期限管理と自動リフレッシュを行います
 */

import { refreshToken as apiRefreshToken } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 秒単位
  issuedAt: number; // タイムスタンプ
}

let tokenRefreshTimer: NodeJS.Timeout | null = null;

/**
 * トークンの有効期限をチェック
 */
export function isTokenExpired(issuedAt: number, expiresIn: number): boolean {
  const now = Date.now();
  const expiresAt = issuedAt + expiresIn * 1000;
  return now >= expiresAt;
}

/**
 * トークンが期限切れ間近かチェック（有効期限の80%経過）
 */
export function isTokenNearExpiry(issuedAt: number, expiresIn: number): boolean {
  const now = Date.now();
  // expiresAt は将来の機能拡張用（期限切れチェックの詳細ロギング等）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const expiresAt = issuedAt + expiresIn * 1000;
  const threshold = issuedAt + (expiresIn * 0.8) * 1000; // 80%経過
  return now >= threshold;
}

/**
 * トークンデータを保存（localStorage + Cookie）
 */
export function saveTokenData(accessToken: string, refreshToken: string, expiresIn: number): TokenData {
  const tokenData: TokenData = {
    accessToken,
    refreshToken,
    expiresIn,
    issuedAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    // localStorageに保存
    localStorage.setItem('token_data', JSON.stringify(tokenData));

    // 注意: access_token / refresh_token のCookieはサーバー側で httpOnly として設定済み
    // document.cookie で非httpOnly cookieを重複設定すると、サーバーが誤ったcookieを読む原因になるため、ここでは設定しない
  }

  return tokenData;
}

/**
 * 保存されたトークンデータを取得
 */
export function getTokenData(): TokenData | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem('token_data');
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * トークンデータをクリア（localStorage + Cookie）
 */
export function clearTokenData(): void {
  if (typeof window !== 'undefined') {
    // localStorageクリア
    localStorage.removeItem('token_data');

    // Cookieクリア
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  stopTokenRefreshTimer();
}

/**
 * トークンリフレッシュタイマーを開始
 */
export function startTokenRefreshTimer(
  onRefresh: (accessToken: string, refreshToken: string) => void,
  onError: () => void
): void {
  stopTokenRefreshTimer();

  const tokenData = getTokenData();
  if (!tokenData) return;

  // 有効期限の80%経過時点でリフレッシュ
  const refreshIn = tokenData.expiresIn * 0.8 * 1000;
  const elapsed = Date.now() - tokenData.issuedAt;
  const delay = Math.max(0, refreshIn - elapsed);

  tokenRefreshTimer = setTimeout(async () => {
    try {
      const currentTokenData = getTokenData();
      if (!currentTokenData) {
        onError();
        return;
      }

      // トークンリフレッシュAPI呼び出し
      const result = await apiRefreshToken({
        refreshToken: currentTokenData.refreshToken,
      });

      // 新しいトークンを保存
      saveTokenData(result.accessToken, result.refreshToken, result.expiresIn);

      // apiClientにも新しいトークンを設定
      apiClient.setToken(result.accessToken);

      // コールバック実行
      onRefresh(result.accessToken, result.refreshToken);

      // 次のリフレッシュをスケジュール
      startTokenRefreshTimer(onRefresh, onError);
    } catch (error) {
      console.error('Token refresh failed:', error);
      onError();
    }
  }, delay);
}

/**
 * トークンリフレッシュタイマーを停止
 */
export function stopTokenRefreshTimer(): void {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
}

/**
 * 手動でトークンをリフレッシュ
 */
export async function manualRefreshToken(
  currentRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const result = await apiRefreshToken({
    refreshToken: currentRefreshToken,
  });

  // 新しいトークンを保存
  saveTokenData(result.accessToken, result.refreshToken, result.expiresIn);

  // apiClientにも新しいトークンを設定
  apiClient.setToken(result.accessToken);

  return result;
}
