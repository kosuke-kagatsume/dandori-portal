/**
 * DRM Suite 統合モジュール
 *
 * Dandori Portal ↔ DRM Suite 連携の公開インターフェース
 */

// 型定義
export * from './types';

// 認証・認可
export {
  generateSignature,
  verifySignature,
  verifyTimestamp,
  authenticateIntegrationRequest,
  authenticateWebhook,
  createIntegrationHeaders,
  createWebhookHeaders,
  hasScope,
  hasAnyScope,
  hasAllScopes,
  generateRequestId,
  getCurrentTimestamp,
} from './auth';

// Webhook
export {
  sendWebhookToDrm,
  processIncomingWebhook,
  validateWebhookPayload,
  isValidEventType,
  isEventProcessed,
  markEventProcessed,
} from './webhook';

// APIクライアント
export { DrmApiClient, drmService, createDrmClient } from './client';

// 監査ログ
export {
  logIntegrationAudit,
  logWebhookReceived,
  logWebhookSent,
  logApiCall,
  logAuthAttempt,
  getIntegrationAuditLogs,
  type IntegrationAuditLog,
  type IntegrationAuditAction,
} from './audit';

// 従業員同期
export {
  pushEmployeesToDrm,
  notifyEmployeeChange,
  getEmployeesForSync,
  receiveEmployeesFromDrm,
  getLastSyncTime,
  updateLastSyncTime,
} from './employee-sync';
