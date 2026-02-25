/**
 * DRM Suite 統合API 型定義
 *
 * Dandori Portal ↔ DRM Suite 間の連携に使用する共通型
 */

// ============================================================
// 認証・認可
// ============================================================

/**
 * API認証ヘッダー
 */
export interface IntegrationAuthHeaders {
  'X-API-Key': string;
  'X-Timestamp': string;
  'X-Signature': string;
  'X-Request-Id': string;
  'X-Tenant-Id'?: string;
}

/**
 * 認証検証結果
 */
export interface AuthValidationResult {
  valid: boolean;
  error?: string;
  tenantId?: string;
  apiKeyId?: string;
}

/**
 * APIキー情報
 */
export interface ApiKeyInfo {
  id: string;
  name: string;
  tenantId: string;
  scopes: IntegrationScope[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  allowedIps?: string[];
}

/**
 * 認可スコープ
 */
export type IntegrationScope =
  | 'read:employees'
  | 'write:employees'
  | 'read:departments'
  | 'write:departments'
  | 'read:attendance'
  | 'write:attendance'
  | 'read:payroll'
  | 'webhook:receive'
  | 'webhook:send';

// ============================================================
// Webhook
// ============================================================

/**
 * Webhookイベント種別
 */
export type IntegrationEvent =
  // Portal → DRM (従業員関連)
  | 'employee.created'
  | 'employee.updated'
  | 'employee.retired'
  | 'employee.department_changed'
  // Portal → DRM (組織関連)
  | 'department.created'
  | 'department.updated'
  | 'department.deleted'
  | 'position.created'
  | 'position.updated'
  // Portal → DRM (勤怠関連)
  | 'attendance.submitted'
  | 'attendance.approved'
  | 'leave.requested'
  | 'leave.approved'
  // DRM → Portal (顧客関連)
  | 'customer.created'
  | 'customer.updated'
  // DRM → Portal (契約関連)
  | 'contract.created'
  | 'contract.signed'
  | 'contract.completed'
  // DRM → Portal (案件関連)
  | 'opportunity.won'
  | 'opportunity.lost';

/**
 * Webhookペイロード
 */
export interface WebhookPayload<T = unknown> {
  /** イベントID（冪等性キー） */
  id: string;
  /** イベント種別 */
  event: IntegrationEvent;
  /** タイムスタンプ（ISO 8601） */
  timestamp: string;
  /** テナントID */
  tenantId: string;
  /** イベントデータ */
  data: T;
  /** HMAC署名 */
  signature: string;
  /** 送信元システム */
  source: 'dandori-portal' | 'drm-suite';
  /** リトライ回数 */
  retryCount?: number;
}

/**
 * Webhook処理結果
 */
export interface WebhookProcessResult {
  success: boolean;
  eventId: string;
  processedAt: string;
  error?: string;
  /** 重複検知でスキップされた */
  skipped?: boolean;
}

/**
 * Webhook配信ステータス
 */
export type WebhookDeliveryStatus =
  | 'pending'
  | 'delivered'
  | 'failed'
  | 'retrying';

/**
 * Webhook配信ログ
 */
export interface WebhookDeliveryLog {
  id: string;
  eventId: string;
  event: IntegrationEvent;
  targetUrl: string;
  status: WebhookDeliveryStatus;
  statusCode?: number;
  requestBody: string;
  responseBody?: string;
  attemptCount: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

// ============================================================
// 従業員同期
// ============================================================

/**
 * 従業員同期データ
 */
export interface EmployeeSyncData {
  /** 社員番号（一意識別子） */
  employeeNumber: string;
  /** 氏名 */
  name: string;
  /** フリガナ */
  nameKana?: string;
  /** メールアドレス */
  email: string;
  /** 部署コード */
  departmentCode?: string;
  /** 部署名 */
  departmentName?: string;
  /** 役職コード */
  positionCode?: string;
  /** 役職名 */
  positionName?: string;
  /** 入社日 */
  hireDate?: string;
  /** 退職日 */
  retirementDate?: string;
  /** ステータス */
  status: 'active' | 'inactive' | 'retired';
  /** 雇用形態 */
  employmentType?: string;
  /** 権限レベル（1-10） */
  permissionLevel?: number;
  /** ロール */
  roles?: string[];
}

/**
 * 従業員同期リクエスト
 */
export interface EmployeeSyncRequest {
  tenantId: string;
  employees: EmployeeSyncData[];
  syncType: 'full' | 'incremental';
  lastSyncAt?: string;
}

/**
 * 従業員同期レスポンス
 */
export interface EmployeeSyncResponse {
  success: boolean;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors?: Array<{
    employeeNumber: string;
    error: string;
  }>;
  syncedAt: string;
}

// ============================================================
// 組織同期
// ============================================================

/**
 * 部署同期データ
 */
export interface DepartmentSyncData {
  /** 部署コード */
  code: string;
  /** 部署名 */
  name: string;
  /** 親部署コード */
  parentCode?: string;
  /** 表示順 */
  sortOrder?: number;
  /** 有効フラグ */
  isActive: boolean;
}

/**
 * 役職同期データ
 */
export interface PositionSyncData {
  /** 役職コード */
  code: string;
  /** 役職名 */
  name: string;
  /** 権限レベル */
  level?: number;
  /** 表示順 */
  sortOrder?: number;
  /** 有効フラグ */
  isActive: boolean;
}

// ============================================================
// API共通
// ============================================================

/**
 * 統合APIレスポンス
 */
export interface IntegrationApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  requestId: string;
  timestamp: string;
}

/**
 * ヘルスチェックレスポンス
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: 'up' | 'down';
    cache?: 'up' | 'down';
  };
}

/**
 * Rate Limit情報
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
}

// ============================================================
// エラーコード
// ============================================================

export const IntegrationErrorCodes = {
  // 認証エラー
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED_TIMESTAMP: 'EXPIRED_TIMESTAMP',
  INSUFFICIENT_SCOPE: 'INSUFFICIENT_SCOPE',
  IP_NOT_ALLOWED: 'IP_NOT_ALLOWED',

  // 検証エラー
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_TENANT: 'INVALID_TENANT',

  // Webhookエラー
  DUPLICATE_EVENT: 'DUPLICATE_EVENT',
  INVALID_EVENT_TYPE: 'INVALID_EVENT_TYPE',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',

  // 同期エラー
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  PARTIAL_SYNC_FAILURE: 'PARTIAL_SYNC_FAILURE',

  // システムエラー
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type IntegrationErrorCode =
  (typeof IntegrationErrorCodes)[keyof typeof IntegrationErrorCodes];
