/**
 * DRM Suite Webhook 送受信
 *
 * イベント駆動型のリアルタイム同期
 */

import crypto from 'crypto';
import {
  type IntegrationEvent,
  type WebhookPayload,
  type WebhookProcessResult,
  type WebhookDeliveryStatus,
} from './types';
import { createWebhookHeaders, generateSignature } from './auth';

// ============================================================
// 定数
// ============================================================

/** DRM Webhook URL */
const getDrmWebhookUrl = () =>
  process.env.DRM_WEBHOOK_URL ||
  'https://www.dandori-relationship-management.com/api/integration/webhook';

/** リトライ設定 */
const MAX_RETRY_COUNT = 3;
const RETRY_DELAYS = [1000, 5000, 30000]; // 1秒, 5秒, 30秒

// ============================================================
// イベント処理済みキャッシュ（冪等性）
// ============================================================

/**
 * メモリ内イベントキャッシュ
 * 本番ではRedisに置き換え推奨
 */
const processedEvents = new Map<string, Date>();

/** キャッシュの有効期限（24時間） */
const EVENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * イベントが処理済みかチェック
 */
export function isEventProcessed(eventId: string): boolean {
  const processedAt = processedEvents.get(eventId);
  if (!processedAt) return false;

  // 期限切れチェック
  if (Date.now() - processedAt.getTime() > EVENT_CACHE_TTL_MS) {
    processedEvents.delete(eventId);
    return false;
  }

  return true;
}

/**
 * イベントを処理済みとしてマーク
 */
export function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, new Date());

  // 古いエントリをクリーンアップ（100件以上で実行）
  if (processedEvents.size > 100) {
    cleanupOldEvents();
  }
}

/**
 * 古いイベントをクリーンアップ
 */
function cleanupOldEvents(): void {
  const now = Date.now();
  const entries = Array.from(processedEvents.entries());
  for (const [eventId, processedAt] of entries) {
    if (now - processedAt.getTime() > EVENT_CACHE_TTL_MS) {
      processedEvents.delete(eventId);
    }
  }
}

// ============================================================
// Webhook送信
// ============================================================

/**
 * DRMにWebhookを送信
 */
export async function sendWebhookToDrm<T>(
  event: IntegrationEvent,
  tenantId: string,
  data: T,
  retryCount = 0
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const payload: WebhookPayload<T> = {
    id: eventId,
    event,
    timestamp,
    tenantId,
    data,
    signature: '', // 後で設定
    source: 'dandori-portal',
    retryCount,
  };

  // ペイロードをJSON化
  const payloadString = JSON.stringify(payload);

  // 署名を生成してペイロードに追加
  const webhookSecret = process.env.DRM_WEBHOOK_SECRET || '';
  payload.signature = generateSignature(
    payloadString,
    Date.now().toString(),
    webhookSecret
  );

  const finalPayload = JSON.stringify(payload);
  const headers = createWebhookHeaders(finalPayload);

  try {
    const response = await fetch(getDrmWebhookUrl(), {
      method: 'POST',
      headers,
      body: finalPayload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // 監査ログ記録
    await logWebhookDelivery({
      eventId,
      event,
      status: 'delivered',
      statusCode: response.status,
    });

    return { success: true, eventId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // 監査ログ記録
    await logWebhookDelivery({
      eventId,
      event,
      status: retryCount < MAX_RETRY_COUNT ? 'retrying' : 'failed',
      error: errorMessage,
    });

    // リトライ
    if (retryCount < MAX_RETRY_COUNT) {
      const delay = RETRY_DELAYS[retryCount] || 30000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendWebhookToDrm(event, tenantId, data, retryCount + 1);
    }

    return { success: false, eventId, error: errorMessage };
  }
}

// ============================================================
// Webhook受信
// ============================================================

/**
 * 受信したWebhookを処理
 */
export async function processIncomingWebhook(
  payload: WebhookPayload
): Promise<WebhookProcessResult> {
  const { id: eventId, event, tenantId, data } = payload;

  // 冪等性チェック
  if (isEventProcessed(eventId)) {
    return {
      success: true,
      eventId,
      processedAt: new Date().toISOString(),
      skipped: true,
    };
  }

  try {
    // イベント種別に応じた処理
    await routeWebhookEvent(event, tenantId, data);

    // 処理済みとしてマーク
    markEventProcessed(eventId);

    return {
      success: true,
      eventId,
      processedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      eventId,
      processedAt: new Date().toISOString(),
      error: errorMessage,
    };
  }
}

/**
 * イベント種別に応じてハンドラーにルーティング
 */
async function routeWebhookEvent(
  event: IntegrationEvent,
  tenantId: string,
  data: unknown
): Promise<void> {
  switch (event) {
    // DRM → Portal: 顧客関連
    case 'customer.created':
    case 'customer.updated':
      await handleCustomerEvent(event, tenantId, data);
      break;

    // DRM → Portal: 契約関連
    case 'contract.created':
    case 'contract.signed':
    case 'contract.completed':
      await handleContractEvent(event, tenantId, data);
      break;

    // DRM → Portal: 案件関連
    case 'opportunity.won':
    case 'opportunity.lost':
      await handleOpportunityEvent(event, tenantId, data);
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${event}`);
  }
}

// ============================================================
// イベントハンドラー（スタブ）
// ============================================================

async function handleCustomerEvent(
  event: IntegrationEvent,
  tenantId: string,
  data: unknown
): Promise<void> {
  console.log(`[Webhook] Processing ${event} for tenant ${tenantId}`, data);
  // TODO: 顧客データをPortal側に反映
}

async function handleContractEvent(
  event: IntegrationEvent,
  tenantId: string,
  data: unknown
): Promise<void> {
  console.log(`[Webhook] Processing ${event} for tenant ${tenantId}`, data);
  // TODO: 契約データをPortal側に反映（例：営業インセンティブ計算）
}

async function handleOpportunityEvent(
  event: IntegrationEvent,
  tenantId: string,
  data: unknown
): Promise<void> {
  console.log(`[Webhook] Processing ${event} for tenant ${tenantId}`, data);
  // TODO: 案件結果をPortal側に反映
}

// ============================================================
// 監査ログ
// ============================================================

interface WebhookLogEntry {
  eventId: string;
  event: IntegrationEvent;
  status: WebhookDeliveryStatus;
  statusCode?: number;
  error?: string;
}

async function logWebhookDelivery(entry: WebhookLogEntry): Promise<void> {
  // TODO: DBまたは外部サービスに記録
  console.log('[Webhook Audit]', JSON.stringify(entry));
}

// ============================================================
// Webhookペイロード検証
// ============================================================

/**
 * Webhookペイロードを検証
 */
export function validateWebhookPayload(
  payload: unknown
): payload is WebhookPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const p = payload as Record<string, unknown>;

  return (
    typeof p.id === 'string' &&
    typeof p.event === 'string' &&
    typeof p.timestamp === 'string' &&
    typeof p.tenantId === 'string' &&
    typeof p.signature === 'string' &&
    (p.source === 'dandori-portal' || p.source === 'drm-suite')
  );
}

/**
 * イベント種別が有効かチェック
 */
export function isValidEventType(event: string): event is IntegrationEvent {
  const validEvents: IntegrationEvent[] = [
    'employee.created',
    'employee.updated',
    'employee.retired',
    'employee.department_changed',
    'department.created',
    'department.updated',
    'department.deleted',
    'position.created',
    'position.updated',
    'attendance.submitted',
    'attendance.approved',
    'leave.requested',
    'leave.approved',
    'customer.created',
    'customer.updated',
    'contract.created',
    'contract.signed',
    'contract.completed',
    'opportunity.won',
    'opportunity.lost',
  ];

  return validEvents.includes(event as IntegrationEvent);
}
