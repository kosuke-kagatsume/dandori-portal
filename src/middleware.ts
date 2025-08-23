import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // ルートパスへのアクセスは /ja/dashboard にリダイレクト
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ja/dashboard', request.url));
  }
  
  // /ja が付いていないパスは /ja を付けてリダイレクト
  if (!pathname.startsWith('/ja') && !pathname.startsWith('/en') && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL(`/ja${pathname}`, request.url));
  }
  
  // デモモード: 認証チェックをスキップ
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};