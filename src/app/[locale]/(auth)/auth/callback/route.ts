import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 認証コールバックルート
 * JWT認証への移行により、このルートはリダイレクトのみ実行
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get('token');

  // 招待受諾用のトークンがある場合は招待受諾ページへ
  if (token) {
    return NextResponse.redirect(new URL(`/ja/auth/accept-invite?token=${token}`, request.url));
  }

  // デフォルトでダッシュボードにリダイレクト
  return NextResponse.redirect(new URL('/ja/dashboard', request.url));
}