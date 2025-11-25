import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// next-intlミドルウェアを作成
const intlMiddleware = createMiddleware({
  locales: ['ja', 'en'],
  defaultLocale: 'ja'
});

// テナント情報をサブドメインから取得するマッピング
const SUBDOMAIN_TO_TENANT: Record<string, string> = {
  'dandori-work': 'tenant-006', // 株式会社ダンドリワーク（本番）
  'sample-corp': 'tenant-001',  // デモ: 株式会社サンプル商事
  'test-corp': 'tenant-002',    // デモ: テスト株式会社
  'trial-corp': 'tenant-003',   // デモ: トライアル株式会社
  'large-corp': 'tenant-004',   // デモ: 大規模株式会社
  'suspended-corp': 'tenant-005', // デモ: 停止中株式会社
};

// メインドメインのデフォルトテナント
const DEFAULT_TENANT_ID = 'tenant-006'; // 株式会社ダンドリワーク

/**
 * サブドメインからテナントIDを抽出
 */
function extractTenantFromHostname(hostname: string): {
  tenantId: string;
  subdomain: string | null;
} {
  // ローカル開発環境のチェック
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  let subdomain: string | null = null;
  let tenantId = DEFAULT_TENANT_ID;

  if (isLocalhost) {
    // ローカル開発: subdomain.localhost:3000 形式
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  } else {
    // 本番環境: subdomain.dandori-portal.com 形式
    const parts = hostname.split('.');

    // サブドメインがある場合（3つ以上のパーツ）
    if (parts.length >= 3) {
      subdomain = parts[0];

      // dev/wwwは特殊扱い（デフォルトテナント）
      if (subdomain === 'dev' || subdomain === 'www') {
        subdomain = null;
      }
    }
  }

  // サブドメインからテナントIDを取得
  if (subdomain && SUBDOMAIN_TO_TENANT[subdomain]) {
    tenantId = SUBDOMAIN_TO_TENANT[subdomain];
  }

  // デバッグログ（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] Hostname:', hostname);
    console.log('[Middleware] Subdomain:', subdomain);
    console.log('[Middleware] Tenant ID:', tenantId);
  }

  return { tenantId, subdomain };
}

// メニュー権限マッピング（src/lib/rbac.tsと同期）
const MENU_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'],
  users: ['hr', 'admin'],
  members: ['manager', 'executive', 'hr'],
  attendance: ['employee', 'manager', 'executive', 'hr', 'applicant'],
  leave: ['employee', 'manager', 'executive', 'hr', 'applicant'],
  workflow: ['employee', 'manager', 'executive', 'hr', 'applicant'],
  approval: ['manager', 'executive', 'hr'],
  payroll: ['executive', 'hr'],
  evaluation: ['manager', 'executive', 'hr'],
  organization: ['executive', 'hr', 'admin'],
  assets: ['executive', 'hr', 'admin'],
  saas: ['executive', 'hr', 'admin'],
  onboarding: ['hr', 'applicant'],
  'onboarding-admin': ['hr'], // HR管理画面
  settings: ['admin'],
  audit: ['admin'],
  profile: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'], // プロフィールは全員アクセス可
};

/**
 * パス名からメニューキーを抽出
 */
function getMenuKeyFromPath(pathname: string): string | null {
  // /ja/dashboard → dashboard
  const match = pathname.match(/\/(?:ja|en)\/([^/?]+)/);
  if (!match) return null;
  return match[1];
}

/**
 * ユーザーロールがメニューにアクセス可能かチェック
 */
function hasMenuAccess(userRole: string, menuKey: string): boolean {
  const allowedRoles = MENU_PERMISSIONS[menuKey];
  if (!allowedRoles) return true; // 定義されていないメニューはアクセス許可
  return allowedRoles.includes(userRole);
}

/**
 * 認証チェック付きミドルウェア
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. マルチテナント識別（すべてのリクエストで実行）
  const hostname = request.headers.get('host') || '';
  const { tenantId, subdomain } = extractTenantFromHostname(hostname);

  // 0-1. DW社管理画面（locale不要、テナント識別スキップ）
  if (pathname.startsWith('/dw-admin')) {
    // DW社管理画面は locale 処理をスキップ
    // TODO: 将来的にDW社専用の認証チェックを追加
    return NextResponse.next();
  }

  // 1. パブリックルート（認証不要）
  const publicPaths = ['/auth/login', '/auth/register', '/'];
  const isPublicPath = publicPaths.some(path => pathname.includes(path));

  if (isPublicPath) {
    const response = intlMiddleware(request);

    // パブリックルートでもテナント情報を設定
    const finalResponse = addTenantHeaders(response, tenantId, subdomain);
    return finalResponse;
  }

  // 2. デモモードチェック
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isDemoMode) {
    // デモモードでもロールベースアクセス制御を実施
    const userRole = request.cookies.get('user_role')?.value || 'employee';
    const menuKey = getMenuKeyFromPath(pathname);

    if (menuKey && !hasMenuAccess(userRole, menuKey)) {
      // アクセス権限がない場合、ダッシュボードにリダイレクト
      // 現在のロケールをpathnameから取得
      const locale = pathname.match(/^\/(ja|en)/)?.[1] || 'ja';
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
      const redirectResponse = NextResponse.redirect(dashboardUrl);
      return addTenantHeaders(redirectResponse, tenantId, subdomain);
    }

    const response = intlMiddleware(request);
    return addTenantHeaders(response, tenantId, subdomain);
  }

  // 3. 認証チェック（Cookie）
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    // 未認証の場合、ログインページにリダイレクト
    // 現在のロケールをpathnameから取得（/ja/... or /en/...）
    const locale = pathname.match(/^\/(ja|en)/)?.[1] || 'ja';
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    return addTenantHeaders(redirectResponse, tenantId, subdomain);
  }

  // 4. ロールベースアクセス制御
  const userRole = request.cookies.get('user_role')?.value;
  const menuKey = getMenuKeyFromPath(pathname);

  if (userRole && menuKey && !hasMenuAccess(userRole, menuKey)) {
    // アクセス権限がない場合、ダッシュボードにリダイレクト
    const dashboardUrl = new URL('/ja/dashboard', request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    return addTenantHeaders(redirectResponse, tenantId, subdomain);
  }

  // 5. 認証済み・権限OKの場合、next-intlミドルウェアに処理を渡す
  const response = intlMiddleware(request);
  return addTenantHeaders(response, tenantId, subdomain);
}

/**
 * レスポンスにテナント情報を追加
 */
function addTenantHeaders(
  response: NextResponse,
  tenantId: string,
  subdomain: string | null
): NextResponse {
  // リクエストヘッダーに追加（サーバーコンポーネントで使用）
  response.headers.set('x-tenant-id', tenantId);
  response.headers.set('x-subdomain', subdomain || 'main');

  // クッキーに設定（クライアントサイドで使用）
  response.cookies.set('x-tenant-id', tenantId, {
    path: '/',
    httpOnly: false, // クライアントサイドで読み取り可能
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ]
};
