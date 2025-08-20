import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 静的ファイルとAPIルートはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') || // 拡張子があるファイル（.jpg, .png, .js, .css など）
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // ルートパスへのアクセスは /ja/dashboard にリダイレクト
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ja/dashboard', request.url));
  }
  
  // /ja が付いていないパスは /ja を付けてリダイレクト
  if (!pathname.startsWith('/ja')) {
    return NextResponse.redirect(new URL(`/ja${pathname}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};