/**
 * SSO認証統合サービス
 *
 * Dandori Portal ↔ DRM Suite 間のシングルサインオン
 *
 * フロー:
 * 1. ユーザーがPortalにログイン
 * 2. DRMにアクセスする際、Portal→DRMにトークン交換リクエスト
 * 3. DRMがトークンを検証し、DRM側のセッションを発行
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// ============================================================
// 定数
// ============================================================

/** SSOトークンのプレフィックス */
const SSO_TOKEN_PREFIX = 'sso_';

// ============================================================
// 型定義
// ============================================================

export interface SsoTokenPayload {
  /** トークンID */
  tokenId: string;
  /** ユーザーID */
  userId: string;
  /** メールアドレス */
  email: string;
  /** テナントID */
  tenantId: string;
  /** ユーザー名 */
  name: string;
  /** ロール */
  roles: string[];
  /** 発行時刻（Unix timestamp） */
  issuedAt: number;
  /** 有効期限（Unix timestamp） */
  expiresAt: number;
  /** 発行元システム */
  issuer: 'dandori-portal' | 'drm-suite';
  /** 対象システム */
  audience: 'dandori-portal' | 'drm-suite';
}

export interface SsoTokenRequest {
  /** トークン交換元のセッションID or ユーザーID */
  sourceUserId: string;
  /** テナントID */
  tenantId: string;
  /** 対象システム */
  targetSystem: 'dandori-portal' | 'drm-suite';
  /** リダイレクトURL */
  redirectUrl?: string;
}

export interface SsoTokenResponse {
  success: boolean;
  token?: string;
  expiresAt?: number;
  redirectUrl?: string;
  error?: string;
}

export interface SsoValidationResult {
  valid: boolean;
  payload?: SsoTokenPayload;
  error?: string;
}

// ============================================================
// メモリ内トークンストア（本番ではRedis推奨）
// ============================================================

const tokenStore = new Map<string, SsoTokenPayload>();

/**
 * 期限切れトークンをクリーンアップ
 */
function cleanupExpiredTokens(): void {
  const now = Math.floor(Date.now() / 1000);
  const entries = Array.from(tokenStore.entries());
  for (const [tokenId, payload] of entries) {
    if (payload.expiresAt < now) {
      tokenStore.delete(tokenId);
    }
  }
}

// 定期クリーンアップ（1分ごと）
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredTokens, 60 * 1000);
}

// ============================================================
// トークン生成・検証
// ============================================================

/**
 * SSOトークンを生成
 */
export async function generateSsoToken(
  request: SsoTokenRequest
): Promise<SsoTokenResponse> {
  const { sourceUserId, tenantId, targetSystem, redirectUrl } = request;

  try {
    // ユーザー情報を取得
    const user = await prisma.users.findFirst({
      where: { id: sourceUserId, tenantId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const secret = process.env.DRM_SSO_SECRET || '';
    if (!secret) {
      return { success: false, error: 'DRM_SSO_SECRET not configured' };
    }

    // トークンIDを生成
    const tokenId = `${SSO_TOKEN_PREFIX}${crypto.randomUUID()}`;
    const now = Math.floor(Date.now() / 1000); // 秒単位
    const expiresAt = now + 300; // 5分

    // ペイロード作成
    const payload: SsoTokenPayload = {
      tokenId,
      userId: user.id,
      email: user.email,
      tenantId,
      name: user.name,
      roles: user.roles,
      issuedAt: now,
      expiresAt,
      issuer: 'dandori-portal',
      audience: targetSystem,
    };

    // トークンストアに保存
    tokenStore.set(tokenId, payload);

    // DRM互換トークン形式: Base64URL(payload).Base64URL(HMAC署名)
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');
    const token = `${payloadBase64}.${signature}`;

    return {
      success: true,
      token,
      expiresAt: expiresAt * 1000, // APIレスポンスではミリ秒に戻す
      redirectUrl,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * SSOトークンを検証
 */
export function validateSsoToken(token: string): SsoValidationResult {
  try {
    const secret = process.env.DRM_SSO_SECRET || '';
    if (!secret) {
      return { valid: false, error: 'DRM_SSO_SECRET not configured' };
    }

    // ドット区切りで分割
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [payloadBase64, signature] = parts;

    // 署名検証: Base64URLペイロードに対してHMAC
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
      if (!isValid) {
        return { valid: false, error: 'Invalid signature' };
      }
    } catch {
      return { valid: false, error: 'Signature verification failed' };
    }

    // ペイロードデコード
    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: SsoTokenPayload = JSON.parse(payloadStr);

    // 有効期限チェック（秒単位）
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      return { valid: false, error: 'Token expired' };
    }

    // ワンタイム使用チェック
    const storedPayload = tokenStore.get(payload.tokenId);
    if (storedPayload) {
      tokenStore.delete(payload.tokenId); // 消費
    }

    return { valid: true, payload };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Invalid token format';
    return { valid: false, error: errorMessage };
  }
}

/**
 * SSOトークンを消費してユーザー情報を取得
 */
export async function consumeSsoToken(
  token: string
): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    roles: string[];
  };
  error?: string;
}> {
  const validation = validateSsoToken(token);

  if (!validation.valid || !validation.payload) {
    return { success: false, error: validation.error };
  }

  const { userId, email, name, tenantId, roles } = validation.payload;

  return {
    success: true,
    user: { id: userId, email, name, tenantId, roles },
  };
}

// ============================================================
// DRM連携
// ============================================================

/**
 * DRMへのSSOリダイレクトURLを生成
 */
export async function createDrmSsoRedirectUrl(
  userId: string,
  tenantId: string,
  returnPath?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const tokenResponse = await generateSsoToken({
    sourceUserId: userId,
    tenantId,
    targetSystem: 'drm-suite',
  });

  if (!tokenResponse.success || !tokenResponse.token) {
    return { success: false, error: tokenResponse.error };
  }

  const drmBaseUrl =
    process.env.DRM_API_URL?.replace('/api/integration', '') ||
    'https://www.dandori-relationship-management.com';

  const params = new URLSearchParams({
    sso_token: tokenResponse.token,
    ...(returnPath && { return_path: returnPath }),
  });

  const url = `${drmBaseUrl}/api/integration/auth/callback?${params.toString()}`;

  return { success: true, url };
}

/**
 * Portal側でDRMからのSSOトークンを受け入れ
 */
export async function acceptDrmSsoToken(
  token: string
): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    roles: string[];
  };
  error?: string;
}> {
  // トークンを検証・消費
  const result = await consumeSsoToken(token);

  if (!result.success || !result.user) {
    return { success: false, error: result.error };
  }

  // Portal側のユーザーを確認
  const portalUser = await prisma.users.findFirst({
    where: {
      email: result.user.email,
      tenantId: result.user.tenantId,
    },
  });

  if (!portalUser) {
    return {
      success: false,
      error: 'User not found in Portal',
    };
  }

  return {
    success: true,
    user: {
      id: portalUser.id,
      email: portalUser.email,
      name: portalUser.name,
      tenantId: portalUser.tenantId,
      roles: portalUser.roles,
    },
  };
}
