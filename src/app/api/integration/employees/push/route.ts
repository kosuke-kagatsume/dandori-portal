/**
 * 従業員同期 Push API
 *
 * POST /api/integration/employees/push
 *
 * Portal の従業員データを DRM に送信
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  IntegrationErrorCodes,
  type IntegrationApiResponse,
  type EmployeeSyncResponse,
} from '@/lib/integrations/drm';
import { pushEmployeesToDrm } from '@/lib/integrations/drm/employee-sync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // リクエストボディをパース
    let payload: {
      tenantId: string;
      syncType?: 'full' | 'incremental';
      lastSyncAt?: string;
      employeeNumbers?: string[];
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

    // 必須パラメータチェック
    if (!payload.tenantId) {
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

    // 同期実行
    const result = await pushEmployeesToDrm(payload.tenantId, {
      syncType: payload.syncType,
      lastSyncAt: payload.lastSyncAt ? new Date(payload.lastSyncAt) : undefined,
      employeeNumbers: payload.employeeNumbers,
    });

    return NextResponse.json(
      {
        success: result.success,
        data: result,
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse<EmployeeSyncResponse>,
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error('[Employee Push] Error:', error);

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
