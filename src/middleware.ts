import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// next-intlミドルウェアを作成
const intlMiddleware = createMiddleware({
  locales: ['ja', 'en'],
  defaultLocale: 'ja'
});

// DW社管理者メールアドレス（環境変数から取得、なければデフォルト）
const DW_ADMIN_EMAILS = (process.env.DW_ADMIN_EMAILS || 'admin@dw-inc.co.jp,super@dw-inc.co.jp').split(',');

// メインドメインのデフォルトテナント（デモモード用のみ）
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'tenant-1' : null;

// テナント情報のキャッシュ（メモリ内）
// Edge Runtimeでもグローバル変数は利用可能
const tenantCache = new Map<string, { tenantId: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分間キャッシュ

/**
 * キャッシュからテナント情報を取得
 */
function getCachedTenant(subdomain: string): string | null {
  const cached = tenantCache.get(subdomain);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    // キャッシュ期限切れ
    tenantCache.delete(subdomain);
    return null;
  }

  return cached.tenantId;
}

/**
 * キャッシュにテナント情報を保存
 */
function setCachedTenant(subdomain: string, tenantId: string): void {
  tenantCache.set(subdomain, {
    tenantId,
    timestamp: Date.now(),
  });
}

/**
 * データベースからテナント情報を取得
 */
async function fetchTenantFromDatabase(
  subdomain: string,
  baseUrl: string
): Promise<string | null> {
  try {
    const url = new URL('/api/tenant/resolve', baseUrl);
    url.searchParams.set('subdomain', subdomain);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // タイムアウト設定（3秒）
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.warn(
        `[Middleware] Tenant not found in database: ${subdomain}`
      );
      return null;
    }

    const data = await response.json();
    return data.tenantId || null;
  } catch (error) {
    console.error('[Middleware] Failed to fetch tenant:', error);
    return null;
  }
}

/**
 * サブドメインからテナントIDを抽出
 */
async function extractTenantFromHostname(
  hostname: string,
  requestUrl: string
): Promise<{
  tenantId: string | null;
  subdomain: string | null;
  error?: string;
}> {
  // ローカル開発環境のチェック
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  let subdomain: string | null = null;
  let tenantId: string | null = DEFAULT_TENANT_ID;

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

  // サブドメインからテナントIDを取得（データベース検索）
  if (subdomain) {
    // 1. キャッシュチェック
    const cachedTenantId = getCachedTenant(subdomain);
    if (cachedTenantId) {
      tenantId = cachedTenantId;
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Cache hit:', subdomain, '→', tenantId);
      }
    } else {
      // 2. データベース検索
      const fetchedTenantId = await fetchTenantFromDatabase(subdomain, requestUrl);
      if (fetchedTenantId) {
        tenantId = fetchedTenantId;
        // キャッシュに保存
        setCachedTenant(subdomain, tenantId);
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] Database hit:', subdomain, '→', tenantId);
        }
      } else {
        // 3. テナントが見つからない場合はエラー（デモモードでない限り）
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[Middleware] Tenant not found:',
            subdomain
          );
        }
        // デモモードでない場合、tenantIdはnullのまま（エラーとして処理）
        return { tenantId: null, subdomain, error: 'TENANT_NOT_FOUND' };
      }
    }
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
  members: ['manager', 'executive', 'hr', 'admin'],
  attendance: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'],
  leave: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'],
  workflow: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'],
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
  const { tenantId, subdomain, error: tenantError } = await extractTenantFromHostname(
    hostname,
    request.url
  );

  // テナントが見つからない場合（デモモード以外）
  if (tenantError === 'TENANT_NOT_FOUND' && !tenantId) {
    // DW管理画面からのアクセスかどうかをチェック
    const referer = request.headers.get('referer') || '';
    const isDWAdminReferer = referer.includes('/dw-admin');

    // テナントエラーページにリダイレクト（ループ防止）
    if (!pathname.includes('/tenant-not-found')) {
      // メインドメインにリダイレクト（サブドメインの問題を回避）
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'dandori-portal.com';
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const errorUrl = new URL(`${protocol}://${mainDomain}/tenant-not-found`);
      errorUrl.searchParams.set('subdomain', subdomain || '');
      if (isDWAdminReferer) {
        errorUrl.searchParams.set('from', 'dw-admin');
      }
      return NextResponse.redirect(errorUrl);
    }
  }

  // 0-1. DW社管理画面（locale不要、テナント識別スキップ）
  if (pathname.startsWith('/dw-admin')) {
    // DW社管理画面はDW社専用の認証チェックを実施
    const dwAccessToken = request.cookies.get('dw_access_token')?.value;
    const dwUserEmail = request.cookies.get('dw_user_email')?.value;

    // DW管理者ログインページは認証不要
    if (pathname === '/dw-admin/login') {
      // 既にログイン済みならダッシュボードにリダイレクト
      if (dwAccessToken && dwUserEmail && DW_ADMIN_EMAILS.includes(dwUserEmail)) {
        return NextResponse.redirect(new URL('/dw-admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // 認証チェック
    if (!dwAccessToken || !dwUserEmail) {
      // 未認証の場合、DW管理者ログインページにリダイレクト
      const loginUrl = new URL('/dw-admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // DW管理者権限チェック
    if (!DW_ADMIN_EMAILS.includes(dwUserEmail)) {
      // 権限がない場合、ログインページにリダイレクト
      const response = NextResponse.redirect(new URL('/dw-admin/login', request.url));
      // 不正なCookieを削除
      response.cookies.delete('dw_access_token');
      response.cookies.delete('dw_user_email');
      return response;
    }

    return NextResponse.next();
  }

  // 0-2. テナントエラーページ（locale不要、認証不要）
  if (pathname === '/tenant-not-found' || pathname.startsWith('/tenant-not-found')) {
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
  tenantId: string | null,
  subdomain: string | null
): NextResponse {
  // tenantIdがnullの場合は何も設定しない（エラーケース）
  if (!tenantId) {
    return response;
  }

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
