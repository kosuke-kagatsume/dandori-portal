/**
 * API認証・認可ユーティリティ
 *
 * サーバーサイドAPIルートでの認証・認可チェックに使用
 */

import { cookies } from 'next/headers';
import { verify, JwtPayload } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dandori-portal-secret-key-change-in-production';
const DW_ADMIN_JWT_SECRET =
  process.env.DW_ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dw-admin-secret-key-change-in-production';

/**
 * JWTペイロードの型定義
 */
export interface AuthPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
}

/**
 * 認証結果の型定義
 */
export interface AuthResult {
  success: boolean;
  user?: AuthPayload;
  error?: string;
}

/**
 * 認証エラーレスポンスを生成
 */
export function createAuthErrorResponse(message: string, status: 401 | 403): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * リクエストの認証を検証
 * Cookieからアクセストークンを取得し、JWTを検証
 */
export async function verifyAuth(_request: NextRequest): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    try {
      const decoded = verify(accessToken, JWT_SECRET) as AuthPayload;
      return {
        success: true,
        user: decoded,
      };
    } catch {
      return {
        success: false,
        error: 'セッションが無効です。再度ログインしてください',
      };
    }
  } catch {
    return {
      success: false,
      error: '認証処理中にエラーが発生しました',
    };
  }
}

/**
 * ユーザーが必要なロールを持っているか確認
 * @param user 認証されたユーザー
 * @param allowedRoles 許可されるロールの配列
 * @returns ロールが許可されていればtrue
 */
export function requireRoles(user: AuthPayload, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * admin権限を持っているか確認
 */
export function isAdmin(user: AuthPayload): boolean {
  return user.role === 'admin';
}

/**
 * adminまたはhr権限を持っているか確認
 */
export function isAdminOrHR(user: AuthPayload): boolean {
  return ['admin', 'hr'].includes(user.role);
}

/**
 * 認証と権限チェックを行うラッパー関数
 * 認証エラーの場合は適切なレスポンスを返す
 */
export async function withAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ auth: AuthResult; errorResponse?: NextResponse }> {
  const auth = await verifyAuth(request);

  if (!auth.success) {
    return {
      auth,
      errorResponse: createAuthErrorResponse(auth.error || '認証が必要です', 401),
    };
  }

  if (allowedRoles && auth.user && !requireRoles(auth.user, allowedRoles)) {
    return {
      auth: { ...auth, success: false, error: '権限がありません' },
      errorResponse: createAuthErrorResponse('権限がありません', 403),
    };
  }

  return { auth };
}

/**
 * テナントIDの検証
 * ユーザーのテナントIDとリクエストのテナントIDが一致するか確認
 */
export function validateTenantAccess(
  user: AuthPayload,
  requestedTenantId: string
): boolean {
  // adminは全テナントにアクセス可能（DW管理者の場合）
  // 通常のユーザーは自分のテナントのみ
  return user.tenantId === requestedTenantId;
}

/**
 * DW管理者用JWTペイロードの型定義
 */
export interface DWAdminPayload extends JwtPayload {
  email: string;
  role: 'dw_admin';
}

/**
 * DW管理者用認証結果の型定義
 */
export interface DWAdminAuthResult {
  success: boolean;
  admin?: DWAdminPayload;
  error?: string;
}

/**
 * DW管理者の認証を検証
 * Cookieからdw_admin_tokenを取得し、JWTを検証
 */
export async function verifyDWAdminAuth(): Promise<DWAdminAuthResult> {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('dw_admin_token')?.value;

    if (!adminToken) {
      return {
        success: false,
        error: 'DW管理者認証が必要です',
      };
    }

    try {
      const decoded = verify(adminToken, DW_ADMIN_JWT_SECRET) as DWAdminPayload;
      return {
        success: true,
        admin: decoded,
      };
    } catch {
      return {
        success: false,
        error: 'DW管理者セッションが無効です。再度ログインしてください',
      };
    }
  } catch {
    return {
      success: false,
      error: 'DW管理者認証処理中にエラーが発生しました',
    };
  }
}

/**
 * DW管理者認証を行うラッパー関数
 * 認証エラーの場合は適切なレスポンスを返す
 */
export async function withDWAdminAuth(): Promise<{
  auth: DWAdminAuthResult;
  errorResponse?: NextResponse;
}> {
  const auth = await verifyDWAdminAuth();

  if (!auth.success) {
    return {
      auth,
      errorResponse: createAuthErrorResponse(auth.error || 'DW管理者認証が必要です', 401),
    };
  }

  return { auth };
}
