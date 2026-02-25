/**
 * 従業員同期 Receive API
 *
 * POST /api/integration/employees/receive
 *
 * DRM からの従業員データを受信して Portal に反映
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  IntegrationErrorCodes,
  type IntegrationApiResponse,
  type EmployeeSyncRequest,
  type EmployeeSyncResponse,
} from '@/lib/integrations/drm';
import { receiveEmployeesFromDrm } from '@/lib/integrations/drm/employee-sync';

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
    let payload: EmployeeSyncRequest;

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

    if (!payload.employees || !Array.isArray(payload.employees)) {
      return NextResponse.json(
        {
          success: false,
          error: 'employees array is required',
          errorCode: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    // 同期実行
    const result = await receiveEmployeesFromDrm(payload);

    const httpStatus = result.success ? 200 : result.errors ? 207 : 500;

    return NextResponse.json(
      {
        success: result.success,
        data: result,
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse<EmployeeSyncResponse>,
      { status: httpStatus }
    );
  } catch (error) {
    console.error('[Employee Receive] Error:', error);

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
