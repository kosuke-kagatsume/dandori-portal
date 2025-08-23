import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 認証ページは国際化をスキップ
  if (pathname.startsWith('/auth')) {
    // Supabase認証チェック
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';
    
    const supabase = createServerClient(
      url,
      key,
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

    const { data: { user } } = await supabase.auth.getUser();
    
    // 既にログイン済みの場合はダッシュボードへ
    if (pathname === '/auth/login' && user) {
      return NextResponse.redirect(new URL('/ja/dashboard', request.url));
    }
    
    return response;
  }
  
  // ルートパスへのアクセスは /ja/dashboard にリダイレクト
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ja/dashboard', request.url));
  }
  
  // /ja が付いていないパスは /ja を付けてリダイレクト
  if (!pathname.startsWith('/ja') && !pathname.startsWith('/en') && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL(`/ja${pathname}`, request.url));
  }
  
  // 保護されたパスの認証チェック（国際化パス対応）
  const protectedPaths = [
    '/dashboard',
    '/workflow',
    '/attendance',
    '/approval',
    '/leave',
    '/expenses',
    '/members',
    '/users',
    '/organization',
    '/settings',
    '/profile',
  ];

  // /ja/dashboard のような国際化パスから実際のパスを抽出
  const actualPath = pathname.replace(/^\/(ja|en)/, '');
  const isProtectedPath = protectedPaths.some(path => actualPath.startsWith(path));

  if (isProtectedPath) {
    // Supabase認証チェック
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';
    
    const supabase = createServerClient(
      url,
      key,
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

    const { data: { user } } = await supabase.auth.getUser();
    
    // 未認証の場合はログインページへ
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    return response;
  }
  
  return NextResponse.next();
}

// ★静的ファイル/内部パスを "完全除外"
export const config = {
  matcher: [
    // api / _next / favicon / robots / sitemap / そして "拡張子あり(.*\..*)" を除外
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};