import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// next-intlミドルウェアを作成
const intlMiddleware = createMiddleware({
  locales: ['ja', 'en'],
  defaultLocale: 'ja'
});

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

  // 0. DW社管理画面（locale不要）
  if (pathname.startsWith('/dw-admin')) {
    // DW社管理画面は locale 処理をスキップ
    // TODO: 将来的にDW社専用の認証チェックを追加
    return NextResponse.next();
  }

  // 1. パブリックルート（認証不要）
  const publicPaths = ['/auth/login', '/auth/register', '/'];
  const isPublicPath = publicPaths.some(path => pathname.includes(path));

  if (isPublicPath) {
    return intlMiddleware(request);
  }

  // 2. デモモードチェック
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (isDemoMode) {
    // デモモードでもロールベースアクセス制御を実施
    const userRole = request.cookies.get('user_role')?.value || 'employee';
    const menuKey = getMenuKeyFromPath(pathname);

    if (menuKey && !hasMenuAccess(userRole, menuKey)) {
      // アクセス権限がない場合、ダッシュボードにリダイレクト
      const dashboardUrl = new URL('/ja/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return intlMiddleware(request);
  }

  // 3. 認証チェック（Cookie）
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    // 未認証の場合、ログインページにリダイレクト
    const loginUrl = new URL('/ja/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. ロールベースアクセス制御
  const userRole = request.cookies.get('user_role')?.value;
  const menuKey = getMenuKeyFromPath(pathname);

  if (userRole && menuKey && !hasMenuAccess(userRole, menuKey)) {
    // アクセス権限がない場合、ダッシュボードにリダイレクト
    const dashboardUrl = new URL('/ja/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 5. 認証済み・権限OKの場合、next-intlミドルウェアに処理を渡す
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ]
};
