/**
 * 従業員同期 Pull API
 *
 * GET /api/integration/employees/pull
 *
 * DRM が Portal の従業員データを取得
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  IntegrationErrorCodes,
  type IntegrationApiResponse,
  type EmployeeSyncData,
} from '@/lib/integrations/drm';
import { getEmployeesForSync } from '@/lib/integrations/drm/employee-sync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PullResponse {
  employees: EmployeeSyncData[];
  total: number;
  hasMore: boolean;
  syncedAt: string;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // 認証（GETリクエストはボディなし）
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

    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const lastSyncAt = searchParams.get('lastSyncAt');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 必須パラメータチェック
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

    // 従業員データ取得
    const result = await getEmployeesForSync(tenantId, {
      lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : undefined,
      limit: Math.min(limit, 500), // 最大500件
      offset,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          employees: result.employees,
          total: result.total,
          hasMore: result.hasMore,
          syncedAt: timestamp,
        },
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse<PullResponse>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Employee Pull] Error:', error);

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
