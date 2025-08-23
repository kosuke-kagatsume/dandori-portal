import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
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
  
  // Supabase クライアントの作成
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kwnybcmrwknjihxhhbso.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bnliY21yd2tuamxoeGhoYnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NDk1OTMsImV4cCI6MjA3MTUyNTU5M30.Bpniq-nuEx0hwZ0O86Gw5T8HjDiOiX-C-nesECHHhMY',
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

  // セッションの確認
  const { data: { user } } = await supabase.auth.getUser();

  // 認証が必要なパスで未認証の場合はログインページへリダイレクト
  if (!isPublicPath && !user) {
    // デモユーザーのチェック（フォールバック）
    const demoUserCookie = request.cookies.get('demo_user');
    console.log('Demo user cookie:', demoUserCookie?.value);
    if (!demoUserCookie) {
      console.log('No demo user cookie, redirecting to login');
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