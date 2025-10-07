/**
 * ブラウザでCookieを取得するユーティリティ関数
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
}

/**
 * デモセッションCookieからユーザー情報を取得
 */
export function getDemoUserFromCookie(): any | null {
  try {
    const demoSessionCookie = getCookie('demo_session');
    if (demoSessionCookie) {
      return JSON.parse(decodeURIComponent(demoSessionCookie));
    }
    return null;
  } catch (error) {
    console.error('Failed to parse demo session cookie:', error);
    return null;
  }
}