import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // ルートパスへのアクセスは /ja/dashboard にリダイレクト
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ja/dashboard', request.url));
  }
  
  // /ja が付いていないパスは /ja を付けてリダイレクト
  if (!pathname.startsWith('/ja') && !pathname.startsWith('/en')) {
    return NextResponse.redirect(new URL(`/ja${pathname}`, request.url));
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