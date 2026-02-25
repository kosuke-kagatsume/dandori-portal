/**
 * DRM統合 監査ログ
 *
 * 全ての統合API呼び出しを記録
 */

import { prisma } from '@/lib/prisma';

// ============================================================
// 型定義
// ============================================================

export interface IntegrationAuditLog {
  id?: string;
  tenantId: string;
  action: IntegrationAuditAction;
  direction: 'inbound' | 'outbound';
  endpoint: string;
  method: string;
  requestId: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  durationMs?: number;
  ipAddress?: string;
  createdAt?: Date;
}

export type IntegrationAuditAction =
  | 'webhook.received'
  | 'webhook.sent'
  | 'api.called'
  | 'api.received'
  | 'sync.employees'
  | 'sync.departments'
  | 'sync.positions'
  | 'auth.success'
  | 'auth.failure';

// ============================================================
// 監査ログ記録
// ============================================================

/**
 * 統合API監査ログを記録
 */
export async function logIntegrationAudit(
  log: IntegrationAuditLog
): Promise<void> {
  try {
    // audit_logsテーブルに記録
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: log.tenantId,
        userId: null, // システム間連携なのでユーザーなし
        action: `integration.${log.action}`,
        category: 'integration',
        targetType: 'integration',
        targetId: log.requestId,
        description: `${log.direction} ${log.method} ${log.endpoint}`,
        metadata: {
          direction: log.direction,
          endpoint: log.endpoint,
          method: log.method,
          statusCode: log.statusCode,
          success: log.success,
          errorMessage: log.errorMessage,
          durationMs: log.durationMs,
        },
        ipAddress: log.ipAddress || null,
        userAgent: 'DRM-Integration',
        severity: log.success ? 'info' : 'warning',
      },
    });
  } catch (error) {
    // ログ記録失敗は本体処理に影響させない
    console.error('[Integration Audit] Failed to log:', error);
  }
}

/**
 * Webhook受信ログを記録
 */
export async function logWebhookReceived(params: {
  tenantId: string;
  requestId: string;
  event: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
}): Promise<void> {
  await logIntegrationAudit({
    tenantId: params.tenantId,
    action: 'webhook.received',
    direction: 'inbound',
    endpoint: '/api/integration/webhook',
    method: 'POST',
    requestId: params.requestId,
    success: params.success,
    errorMessage: params.errorMessage,
    ipAddress: params.ipAddress,
  });
}

/**
 * Webhook送信ログを記録
 */
export async function logWebhookSent(params: {
  tenantId: string;
  requestId: string;
  event: string;
  targetUrl: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
}): Promise<void> {
  await logIntegrationAudit({
    tenantId: params.tenantId,
    action: 'webhook.sent',
    direction: 'outbound',
    endpoint: params.targetUrl,
    method: 'POST',
    requestId: params.requestId,
    statusCode: params.statusCode,
    success: params.success,
    errorMessage: params.errorMessage,
    durationMs: params.durationMs,
  });
}

/**
 * API呼び出しログを記録
 */
export async function logApiCall(params: {
  tenantId: string;
  requestId: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
}): Promise<void> {
  await logIntegrationAudit({
    tenantId: params.tenantId,
    action: 'api.called',
    direction: 'outbound',
    endpoint: params.endpoint,
    method: params.method,
    requestId: params.requestId,
    statusCode: params.statusCode,
    success: params.success,
    errorMessage: params.errorMessage,
    durationMs: params.durationMs,
  });
}

/**
 * 認証ログを記録
 */
export async function logAuthAttempt(params: {
  tenantId: string;
  requestId: string;
  endpoint: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
}): Promise<void> {
  await logIntegrationAudit({
    tenantId: params.tenantId,
    action: params.success ? 'auth.success' : 'auth.failure',
    direction: 'inbound',
    endpoint: params.endpoint,
    method: 'POST',
    requestId: params.requestId,
    success: params.success,
    errorMessage: params.errorMessage,
    ipAddress: params.ipAddress,
  });
}

// ============================================================
// 監査ログ取得
// ============================================================

/**
 * 統合API監査ログを取得
 */
export async function getIntegrationAuditLogs(params: {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
  action?: IntegrationAuditAction;
  limit?: number;
  offset?: number;
}): Promise<{ logs: unknown[]; total: number }> {
  const { tenantId, startDate, endDate, action, limit = 50, offset = 0 } = params;

  const where: Record<string, unknown> = {
    tenantId,
    action: action ? { startsWith: `integration.${action}` } : { startsWith: 'integration.' },
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.audit_logs.count({ where }),
  ]);

  return { logs, total };
}
