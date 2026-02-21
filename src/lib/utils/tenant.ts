/**
 * テナントID取得ユーティリティ
 *
 * クライアントサイドでCookieからテナントIDを取得する共通関数
 * サーバーサイドからの呼び出しやCookieが設定されていない場合はエラーをスロー
 */

/**
 * クライアントサイドでCookieからテナントIDを取得
 * @throws {Error} サーバーサイドから呼び出された場合
 * @throws {Error} テナントIDが設定されていない場合
 */
export const getTenantIdFromCookie = (): string => {
  if (typeof document === 'undefined') {
    throw new Error('テナントIDはサーバーサイドでは取得できません。getTenantIdFromRequest()を使用してください。');
  }
  const match = document.cookie.match(/x-tenant-id=([^;]+)/);
  if (!match) {
    throw new Error('テナントIDが設定されていません。ログインし直してください。');
  }
  return match[1];
};

/**
 * クライアントサイドでテナントIDを安全に取得（エラー時はnullを返す）
 * 認証状態の確認など、テナントIDが無い場合にエラーにしたくないケースで使用
 */
export const getTenantIdFromCookieSafe = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(/x-tenant-id=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * デモモード用: テナントIDを取得（存在しない場合はデモ用IDを返す）
 * 開発環境やデモモードでのみ使用
 * @deprecated 本番環境では getTenantIdFromCookie() を使用
 */
export const getTenantIdWithFallback = (): string => {
  if (typeof document === 'undefined') {
    return 'tenant-1';
  }
  const match = document.cookie.match(/x-tenant-id=([^;]+)/);
  return match ? match[1] : 'tenant-1';
};
