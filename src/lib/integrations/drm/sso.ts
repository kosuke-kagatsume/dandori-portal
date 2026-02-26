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
import { generateSignature, verifySignature } from './auth';

// ============================================================
// 定数
// ============================================================

/** SSOトークン有効期限（5分） */
const SSO_TOKEN_EXPIRY_MS = 5 * 60 * 1000;

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
  const now = Date.now();
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

    // トークンIDを生成
    const tokenId = `${SSO_TOKEN_PREFIX}${crypto.randomUUID()}`;
    const now = Date.now();
    const expiresAt = now + SSO_TOKEN_EXPIRY_MS;

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

    // トークン文字列を生成（署名付き）
    const payloadString = JSON.stringify(payload);
    const secret = process.env.DRM_SSO_SECRET || process.env.DRM_API_SECRET || '';
    const signature = generateSignature(payloadString, now.toString(), secret);

    // Base64エンコード
    const token = Buffer.from(
      JSON.stringify({ payload, signature })
    ).toString('base64url');

    return {
      success: true,
      token,
      expiresAt,
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
    // Base64デコード
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const { payload, signature } = JSON.parse(decoded) as {
      payload: SsoTokenPayload;
      signature: string;
    };

    // 有効期限チェック
    if (payload.expiresAt < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }

    // 署名検証
    const secret = process.env.DRM_SSO_SECRET || process.env.DRM_API_SECRET || '';
    const payloadString = JSON.stringify(payload);
    const isValid = verifySignature(
      payloadString,
      payload.issuedAt.toString(),
      signature,
      secret
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    // トークンストアで確認（使い回し防止）
    const storedPayload = tokenStore.get(payload.tokenId);
    if (!storedPayload) {
      return { valid: false, error: 'Token not found or already used' };
    }

    // トークンを無効化（ワンタイム使用）
    tokenStore.delete(payload.tokenId);

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
    process.env.DRM_BASE_URL ||
    'https://www.dandori-relationship-management.com';

  const params = new URLSearchParams({
    sso_token: tokenResponse.token,
    ...(returnPath && { return_path: returnPath }),
  });

  const url = `${drmBaseUrl}/auth/sso?${params.toString()}`;

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
