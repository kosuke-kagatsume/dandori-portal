import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DW管理者ログアウトAPI
 * POST /api/dw-admin/auth/logout
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'ログアウトしました',
  });

  // Cookieを削除
  response.cookies.delete('dw_access_token');
  response.cookies.delete('dw_user_email');

  return response;
}
