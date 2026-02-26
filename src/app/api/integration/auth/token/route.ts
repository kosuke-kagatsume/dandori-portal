/**
 * SSOトークン生成 API
 *
 * POST /api/integration/auth/token
 *
 * PortalユーザーがDRMにアクセスするためのSSOトークンを生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  IntegrationErrorCodes,
  type IntegrationApiResponse,
} from '@/lib/integrations/drm';
import { generateSsoToken } from '@/lib/integrations/drm/sso';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // セッションからユーザー情報を取得
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    const tenantIdCookie = cookieStore.get('x-tenant-id');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          errorCode: 'UNAUTHORIZED',
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 401 }
      );
    }

    // セッションをパース（簡易実装）
    let userId: string;
    try {
      const session = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      );
      userId = session.userId || session.id;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session',
          errorCode: 'INVALID_SESSION',
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 401 }
      );
    }

    const tenantId = tenantIdCookie?.value;
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant ID not found',
          errorCode: IntegrationErrorCodes.INVALID_TENANT,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    // リクエストボディを取得
    let redirectUrl: string | undefined;
    let bodyTargetSystem: string | undefined;

    try {
      const body = await request.json();
      bodyTargetSystem = body.targetSystem;
      redirectUrl = body.redirectUrl;
    } catch {
      // ボディなしでもOK
    }

    const targetSystem = (bodyTargetSystem || 'drm-suite') as 'drm-suite';

    // SSOトークンを生成
    const result = await generateSsoToken({
      sourceUserId: userId,
      tenantId,
      targetSystem,
      redirectUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: IntegrationErrorCodes.INTERNAL_ERROR,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          token: result.token,
          expiresAt: result.expiresAt,
          redirectUrl: result.redirectUrl,
        },
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse<{
        token?: string;
        expiresAt?: number;
        redirectUrl?: string;
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[SSO Token] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        errorCode: IntegrationErrorCodes.INTERNAL_ERROR,
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse,
      { status: 500 }
    );
  }
}
