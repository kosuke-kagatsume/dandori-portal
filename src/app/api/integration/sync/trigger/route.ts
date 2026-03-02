/**
 * 同期トリガー API
 *
 * POST /api/integration/sync/trigger
 *
 * DRM Suite管理画面の「同期実行」ボタンから呼び出され、
 * Portal側でデータ収集→DRM側の既存同期APIを呼ぶ
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  IntegrationErrorCodes,
  type IntegrationApiResponse,
} from '@/lib/integrations/drm';
import { pushEmployeesToDrm } from '@/lib/integrations/drm/employee-sync';
import {
  pushDepartmentsToDrm,
  pushPositionsToDrm,
} from '@/lib/integrations/drm/organization-sync';
import { logApiCall } from '@/lib/integrations/drm/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VALID_TYPES = ['employees', 'departments', 'positions'] as const;
type SyncType = (typeof VALID_TYPES)[number];

const SYNC_MESSAGES: Record<SyncType, string> = {
  employees: '従業員同期が完了しました',
  departments: '部署同期が完了しました',
  positions: '役職同期が完了しました',
};

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  try {
    const body = await request.text();

    // 1. HMAC認証
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

    // 2. リクエストボディをパース
    let payload: {
      type: string;
      tenantId: string;
      callbackBaseUrl?: string;
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

    // 3. バリデーション
    if (!payload.type || !payload.tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'type and tenantId are required',
          errorCode: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(payload.type as SyncType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
          errorCode: IntegrationErrorCodes.INVALID_PAYLOAD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    const syncType = payload.type as SyncType;
    const { tenantId } = payload;

    // 4. typeに応じて既存Push関数を呼び出し
    let syncedCount = 0;
    let syncSuccess = true;
    let errorMessage: string | undefined;

    switch (syncType) {
      case 'employees': {
        const result = await pushEmployeesToDrm(tenantId);
        syncedCount = result.syncedCount;
        syncSuccess = result.success;
        if (!result.success && result.errors?.length) {
          errorMessage = result.errors.map((e) => e.error).join('; ');
        }
        break;
      }
      case 'departments': {
        const result = await pushDepartmentsToDrm(tenantId);
        syncSuccess = result.success;
        syncedCount = result.data?.syncedCount ?? 0;
        if (!result.success) {
          errorMessage = result.error;
        }
        break;
      }
      case 'positions': {
        const result = await pushPositionsToDrm(tenantId);
        syncSuccess = result.success;
        syncedCount = result.data?.syncedCount ?? 0;
        if (!result.success) {
          errorMessage = result.error;
        }
        break;
      }
    }

    const durationMs = Date.now() - startTime;

    // 5. 監査ログ記録
    await logApiCall({
      tenantId,
      requestId,
      endpoint: `/api/integration/sync/trigger (${syncType})`,
      method: 'POST',
      success: syncSuccess,
      errorMessage,
      durationMs,
    });

    // 6. レスポンス返却
    if (!syncSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage || '同期に失敗しました',
          errorCode: IntegrationErrorCodes.PARTIAL_SYNC_FAILURE,
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
          triggered: true,
          message: SYNC_MESSAGES[syncType],
          syncedCount,
        },
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse<{
        triggered: boolean;
        message: string;
        syncedCount: number;
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Sync Trigger] Error:', error);

    const durationMs = Date.now() - startTime;

    // エラー時も監査ログ記録を試みる
    try {
      await logApiCall({
        tenantId: 'unknown',
        requestId,
        endpoint: '/api/integration/sync/trigger',
        method: 'POST',
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error',
        durationMs,
      });
    } catch {
      // ログ記録失敗は無視
    }

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
