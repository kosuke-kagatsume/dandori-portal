/**
 * SSOコールバック API
 *
 * GET /api/integration/auth/callback
 *
 * DRMからのSSOログインを受け入れ、Portalのセッションを発行
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { acceptDrmSsoToken } from '@/lib/integrations/drm/sso';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('sso_token');
  const returnPath = searchParams.get('return_path') || '/dashboard';

  // エラーページURL
  const errorUrl = `/auth/login?error=sso_failed`;

  if (!token) {
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }

  try {
    // DRMからのSSOトークンを検証
    const result = await acceptDrmSsoToken(token);

    if (!result.success || !result.user) {
      console.error('[SSO Callback] Token validation failed:', result.error);
      return NextResponse.redirect(
        new URL(`${errorUrl}&message=${encodeURIComponent(result.error || 'Unknown error')}`, request.url)
      );
    }

    // セッションを作成
    const sessionData = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      tenantId: result.user.tenantId,
      roles: result.user.roles,
      loginMethod: 'sso',
      loginSource: 'drm-suite',
      createdAt: new Date().toISOString(),
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Cookieを設定
    const cookieStore = await cookies();

    // セッションCookie
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
      path: '/',
    });

    // テナントID Cookie
    cookieStore.set('x-tenant-id', result.user.tenantId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
      path: '/',
    });

    // リダイレクト
    const redirectUrl = returnPath.startsWith('/') ? returnPath : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('[SSO Callback] Error:', error);
    return NextResponse.redirect(new URL(errorUrl, request.url));
  }
}
