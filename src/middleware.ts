import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // APIルートは認証チェックをスキップ
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // 認証不要なパスの定義
  const publicPaths = ['/auth/login', '/auth/callback', '/auth/signup'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // ルートパスへのアクセスは /ja/dashboard にリダイレクト
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ja/dashboard', request.url));
  }
  
  // /ja が付いていないパス（authとapi以外）は /ja を付けてリダイレクト
  if (!pathname.startsWith('/ja') && !pathname.startsWith('/en') && !pathname.startsWith('/auth') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL(`/ja${pathname}`, request.url));
  }
  
  // レスポンスオブジェクトの作成
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // デモモードかチェック
  const isDemoMode = process.env.DEMO_MODE === 'true' ||
                    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user = null;

  if (!isDemoMode) {
    // Supabaseが利用可能な場合の認証チェック
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set({
                name,
                value,
                ...options,
              });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              });
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              response.cookies.set({
                name,
                value: '',
                ...options,
              });
            },
          },
        }
      );

      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (error) {
      console.warn('Supabase auth check failed, falling back to demo mode');
    }
  }

  // 認証が必要なパスで未認証の場合
  if (!isPublicPath && !user) {
    // デモセッションのチェック（正しいキー名を使用）
    const demoSessionCookie = request.cookies.get('demo_session');
    console.log('Demo user cookie:', demoSessionCookie?.value);

    if (!demoSessionCookie) {
      console.log('No demo session cookie, redirecting to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    } else {
      console.log('Demo user found, allowing access');
    }
  }

  // 認証済みユーザーが認証ページにアクセスした場合はダッシュボードへリダイレクト
  if (isPublicPath && user) {
    return NextResponse.redirect(new URL('/ja/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};