/**
 * DRMへのSSOリダイレクト API
 *
 * GET /api/integration/auth/redirect
 *
 * PortalからDRMへのSSOリダイレクトURLを生成してリダイレクト
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDrmSsoRedirectUrl } from '@/lib/integrations/drm/sso';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnPath = searchParams.get('return_path');

  // 認証エラーページ
  const loginUrl = '/auth/login?error=auth_required';

  try {
    // セッションからユーザー情報を取得
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    const tenantIdCookie = cookieStore.get('x-tenant-id');

    if (!sessionCookie?.value || !tenantIdCookie?.value) {
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    // セッションをパース
    let userId: string;
    try {
      const session = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      );
      userId = session.userId || session.id;
    } catch {
      return NextResponse.redirect(new URL(loginUrl, request.url));
    }

    const tenantId = tenantIdCookie.value;

    // DRMへのSSOリダイレクトURLを生成
    const result = await createDrmSsoRedirectUrl(userId, tenantId, returnPath || undefined);

    if (!result.success || !result.url) {
      console.error('[SSO Redirect] Failed to create redirect URL:', result.error);
      return NextResponse.redirect(
        new URL('/error?message=sso_redirect_failed', request.url)
      );
    }

    // DRMにリダイレクト
    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error('[SSO Redirect] Error:', error);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }
}
