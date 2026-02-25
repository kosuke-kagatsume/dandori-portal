/**
 * 役職同期 API
 *
 * GET  /api/integration/positions - 役職データ取得（Pull）
 * POST /api/integration/positions - 役職データ受信（Receive）
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  IntegrationErrorCodes,
  type IntegrationApiResponse,
  type PositionSyncData,
} from '@/lib/integrations/drm';
import {
  getPositionsForSync,
  receivePositionsFromDrm,
} from '@/lib/integrations/drm/organization-sync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET - DRM が Portal の役職データを取得
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // 認証
    const authResult = await authenticateIntegrationRequest('');
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

    // クエリパラメータ
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const lastSyncAt = searchParams.get('lastSyncAt');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'tenantId is required',
          errorCode: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    const result = await getPositionsForSync(tenantId, {
      lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : undefined,
      activeOnly,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...result,
          syncedAt: timestamp,
        },
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Positions GET] Error:', error);
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

/**
 * POST - DRM から役職データを受信
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const body = await request.text();

    // 認証
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

    // パース
    let payload: {
      tenantId: string;
      positions: PositionSyncData[];
    };

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

    if (!payload.tenantId || !Array.isArray(payload.positions)) {
      return NextResponse.json(
        {
          success: false,
          error: 'tenantId and positions array are required',
          errorCode: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    const result = await receivePositionsFromDrm(
      payload.tenantId,
      payload.positions
    );

    return NextResponse.json(
      {
        success: result.success,
        data: {
          ...result,
          syncedAt: timestamp,
        },
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse,
      { status: result.success ? 200 : 207 }
    );
  } catch (error) {
    console.error('[Positions POST] Error:', error);
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
