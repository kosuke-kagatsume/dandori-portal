/**
 * 統合API Webhook受信
 *
 * POST /api/integration/webhook
 *
 * DRM Suite からのWebhookイベントを受信・処理
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateWebhook,
  processIncomingWebhook,
  validateWebhookPayload,
  isValidEventType,
  IntegrationErrorCodes,
  type WebhookPayload,
  type IntegrationApiResponse,
  type WebhookProcessResult,
} from '@/lib/integrations/drm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // リクエストボディを取得
    const body = await request.text();

    // 認証検証
    const authResult = await authenticateWebhook(body);
    if (!authResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook authentication failed',
          errorCode: authResult.error,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 401 }
      );
    }

    // ペイロードをパース
    let payload: unknown;
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

    // ペイロード検証
    if (!validateWebhookPayload(payload)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid webhook payload structure',
          errorCode: IntegrationErrorCodes.INVALID_PAYLOAD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    // イベント種別検証
    if (!isValidEventType(payload.event)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown event type: ${payload.event}`,
          errorCode: IntegrationErrorCodes.INVALID_EVENT_TYPE,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    // Webhook処理
    const result = await processIncomingWebhook(payload as WebhookPayload);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Webhook processing failed',
          errorCode: IntegrationErrorCodes.INTERNAL_ERROR,
          requestId,
          timestamp,
          data: result,
        } satisfies IntegrationApiResponse<WebhookProcessResult>,
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json(
      {
        success: true,
        data: result,
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse<WebhookProcessResult>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);

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
 * Webhook設定確認用（開発時のみ）
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    endpoint: '/api/integration/webhook',
    method: 'POST',
    description: 'DRM Suite Webhook receiver',
    requiredHeaders: {
      'X-Webhook-Signature': 'HMAC-SHA256 signature',
      'X-Timestamp': 'Unix timestamp in milliseconds',
    },
    supportedEvents: [
      'customer.created',
      'customer.updated',
      'contract.created',
      'contract.signed',
      'contract.completed',
      'opportunity.won',
      'opportunity.lost',
    ],
  });
}
