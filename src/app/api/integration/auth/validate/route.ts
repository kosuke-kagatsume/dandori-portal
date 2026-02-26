/**
 * SSOトークン検証 API
 *
 * POST /api/integration/auth/validate
 *
 * DRMから送られたSSOトークンを検証し、ユーザー情報を返す
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  IntegrationErrorCodes,
  type IntegrationApiResponse,
} from '@/lib/integrations/drm';
import { consumeSsoToken } from '@/lib/integrations/drm/sso';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const body = await request.text();

    // API認証（DRMからのリクエストを検証）
    const authResult = await authenticateIntegrationRequest(body);
    if (!authResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          errorCode: authResult.error,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 401 }
      );
    }

    // リクエストボディをパース
    let payload: { token: string };
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload',
          errorCode: IntegrationErrorCodes.INVALID_PAYLOAD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    if (!payload.token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token is required',
          errorCode: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    // トークンを検証・消費
    const result = await consumeSsoToken(payload.token);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: 'INVALID_TOKEN',
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: result.user,
          validatedAt: timestamp,
        },
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[SSO Validate] Error:', error);
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
