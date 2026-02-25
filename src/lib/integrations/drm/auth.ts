/**
 * DRM Suite 統合API 認証・認可
 *
 * HMAC-SHA256署名による相互認証
 */

import crypto from 'crypto';
import { headers } from 'next/headers';
import {
  type AuthValidationResult,
  type IntegrationAuthHeaders,
  type IntegrationScope,
  IntegrationErrorCodes,
} from './types';

// ============================================================
// 定数
// ============================================================

/** タイムスタンプ許容範囲（ミリ秒） */
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5分

/** 環境変数から取得 */
const getDrmApiKey = () => process.env.DRM_API_KEY || '';
const getDrmApiSecret = () => process.env.DRM_API_SECRET || '';
const getDrmWebhookSecret = () => process.env.DRM_WEBHOOK_SECRET || '';
const getAllowedIps = () =>
  (process.env.DRM_ALLOWED_IPS || '').split(',').filter(Boolean);

// ============================================================
// 署名生成・検証
// ============================================================

/**
 * HMAC-SHA256署名を生成
 */
export function generateSignature(
  payload: string,
  timestamp: string,
  secret: string
): string {
  const message = `${timestamp}.${payload}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * 署名を検証
 */
export function verifySignature(
  payload: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, timestamp, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * タイムスタンプを検証（リプレイ攻撃防止）
 */
export function verifyTimestamp(timestamp: string): boolean {
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) return false;

  const now = Date.now();
  const diff = Math.abs(now - requestTime);

  return diff <= TIMESTAMP_TOLERANCE_MS;
}

// ============================================================
// リクエスト認証
// ============================================================

/**
 * 統合APIリクエストを認証
 */
export async function authenticateIntegrationRequest(
  body: string
): Promise<AuthValidationResult> {
  const headersList = await headers();

  const apiKey = headersList.get('X-API-Key');
  const timestamp = headersList.get('X-Timestamp');
  const signature = headersList.get('X-Signature');
  const requestId = headersList.get('X-Request-Id');

  // 必須ヘッダーチェック
  if (!apiKey || !timestamp || !signature || !requestId) {
    return {
      valid: false,
      error: '必須ヘッダーが不足しています',
    };
  }

  // APIキー検証
  const expectedApiKey = getDrmApiKey();
  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return {
      valid: false,
      error: IntegrationErrorCodes.INVALID_API_KEY,
    };
  }

  // タイムスタンプ検証
  if (!verifyTimestamp(timestamp)) {
    return {
      valid: false,
      error: IntegrationErrorCodes.EXPIRED_TIMESTAMP,
    };
  }

  // 署名検証
  const secret = getDrmApiSecret();
  if (!secret || !verifySignature(body, timestamp, signature, secret)) {
    return {
      valid: false,
      error: IntegrationErrorCodes.INVALID_SIGNATURE,
    };
  }

  // IP制限（本番環境のみ）
  if (process.env.NODE_ENV === 'production') {
    const clientIp = getClientIp(headersList);
    const allowedIps = getAllowedIps();

    if (allowedIps.length > 0 && clientIp && !allowedIps.includes(clientIp)) {
      return {
        valid: false,
        error: IntegrationErrorCodes.IP_NOT_ALLOWED,
      };
    }
  }

  return {
    valid: true,
    apiKeyId: apiKey.substring(0, 8) + '...',
  };
}

/**
 * Webhookリクエストを認証
 */
export async function authenticateWebhook(
  body: string
): Promise<AuthValidationResult> {
  const headersList = await headers();

  const signature = headersList.get('X-Webhook-Signature');
  const timestamp = headersList.get('X-Timestamp');

  if (!signature || !timestamp) {
    return {
      valid: false,
      error: '必須ヘッダーが不足しています',
    };
  }

  // タイムスタンプ検証
  if (!verifyTimestamp(timestamp)) {
    return {
      valid: false,
      error: IntegrationErrorCodes.EXPIRED_TIMESTAMP,
    };
  }

  // 署名検証
  const secret = getDrmWebhookSecret();
  if (!secret || !verifySignature(body, timestamp, signature, secret)) {
    return {
      valid: false,
      error: IntegrationErrorCodes.INVALID_SIGNATURE,
    };
  }

  return { valid: true };
}

// ============================================================
// リクエスト送信用
// ============================================================

/**
 * 統合APIリクエスト用のヘッダーを生成
 */
export function createIntegrationHeaders(
  payload: string,
  tenantId?: string
): IntegrationAuthHeaders {
  const apiKey = getDrmApiKey();
  const secret = getDrmApiSecret();
  const timestamp = Date.now().toString();
  const requestId = crypto.randomUUID();

  const signature = generateSignature(payload, timestamp, secret);

  const headers: IntegrationAuthHeaders = {
    'X-API-Key': apiKey,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
    'X-Request-Id': requestId,
  };

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  return headers;
}

/**
 * Webhook送信用のヘッダーを生成
 */
export function createWebhookHeaders(payload: string): Record<string, string> {
  const secret = getDrmWebhookSecret();
  const timestamp = Date.now().toString();

  const signature = generateSignature(payload, timestamp, secret);

  return {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
    'X-Timestamp': timestamp,
  };
}

// ============================================================
// スコープ検証
// ============================================================

/**
 * 必要なスコープを持っているか検証
 */
export function hasScope(
  userScopes: IntegrationScope[],
  requiredScope: IntegrationScope
): boolean {
  return userScopes.includes(requiredScope);
}

/**
 * 複数スコープのいずれかを持っているか検証
 */
export function hasAnyScope(
  userScopes: IntegrationScope[],
  requiredScopes: IntegrationScope[]
): boolean {
  return requiredScopes.some((scope) => userScopes.includes(scope));
}

/**
 * 全てのスコープを持っているか検証
 */
export function hasAllScopes(
  userScopes: IntegrationScope[],
  requiredScopes: IntegrationScope[]
): boolean {
  return requiredScopes.every((scope) => userScopes.includes(scope));
}

// ============================================================
// ユーティリティ
// ============================================================

/**
 * クライアントIPを取得
 */
function getClientIp(headersList: Headers): string | null {
  // Cloudflare
  const cfIp = headersList.get('CF-Connecting-IP');
  if (cfIp) return cfIp;

  // X-Forwarded-For（最初のIP）
  const xForwardedFor = headersList.get('X-Forwarded-For');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map((ip) => ip.trim());
    return ips[0] || null;
  }

  // X-Real-IP
  const xRealIp = headersList.get('X-Real-IP');
  if (xRealIp) return xRealIp;

  return null;
}

/**
 * リクエストIDを生成
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * 現在のタイムスタンプを取得
 */
export function getCurrentTimestamp(): string {
  return Date.now().toString();
}
