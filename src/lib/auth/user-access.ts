/**
 * /api/users/* 系エンドポイント向け 共通認可ヘルパ
 *
 * 全ハンドラーに以下を一括適用する:
 * 1. JWT認証
 * 2. 対象ユーザーの存在確認
 * 3. テナント越境ブロック (auth.tenantId !== target.tenantId なら 403)
 * 4. アクセスモード判定 (self_or_hr / hr_only)
 *
 * Phase 0a 横展開（2026-04-28）: /api/users/[id] 配下の認可なしハンドラー
 *                                40件超を本ヘルパ経由で塞ぐ
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthPayload } from './api-auth';
import { prisma } from '@/lib/prisma';
import { canReadMynumber, canManageMynumber } from '@/lib/api/mynumber-permission';

export type UserAccessMode = 'self_or_hr' | 'hr_only';

interface UserAccessSuccess {
  errorResponse?: never;
  user: AuthPayload;
  targetUser: { id: string; tenantId: string };
  isSelf: boolean;
  isAdminOrHR: boolean;
}

interface UserAccessFailure {
  errorResponse: NextResponse;
  user?: never;
  targetUser?: never;
  isSelf?: never;
  isAdminOrHR?: never;
}

export type UserAccessResult = UserAccessSuccess | UserAccessFailure;

/**
 * /api/users/[id]/* 系で必要な認証 + 認可 + テナント検証をまとめて行う
 *
 * @param request NextRequest
 * @param targetUserId 操作対象のユーザーID（params.id）
 * @param mode self_or_hr | hr_only
 */
export async function requireUserAccess(
  request: NextRequest,
  targetUserId: string,
  mode: UserAccessMode,
): Promise<UserAccessResult> {
  const { auth, errorResponse } = await withAuth(request);
  if (errorResponse) return { errorResponse };
  if (!auth.user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 },
      ),
    };
  }

  const targetUser = await prisma.users.findUnique({
    where: { id: targetUserId },
    select: { id: true, tenantId: true },
  });

  if (!targetUser) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      ),
    };
  }

  if (targetUser.tenantId !== auth.user.tenantId) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 },
      ),
    };
  }

  const isSelf = auth.user.userId === targetUserId;
  const isAdminOrHR = ['admin', 'hr'].includes(auth.user.role);

  if (mode === 'hr_only' && !isAdminOrHR) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 },
      ),
    };
  }

  if (mode === 'self_or_hr' && !isSelf && !isAdminOrHR) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 },
      ),
    };
  }

  return {
    user: auth.user,
    targetUser: { id: targetUser.id, tenantId: targetUser.tenantId },
    isSelf,
    isAdminOrHR,
  };
}

/**
 * PATCH /api/users/[id] 本人モード時の編集可能フィールド ホワイトリスト
 *
 * 含まないもの: email, role, roles, tenantId, employmentStatus, status,
 *              retiredDate, retirementReason, hireDate, employeeNumber,
 *              departmentId, positionId, unitId, workRuleId, salary系全般,
 *              tax系全般, paidLeaveStartDate, isSpecialWorker 等
 */
export const SELF_PATCH_ALLOWED_FIELDS: ReadonlySet<string> = new Set([
  'name',
  'nameKana',
  'phone',
  'avatar',
  'postalCode',
  'address',
  'birthDate',
  'gender',
  'timezone',
]);

/**
 * 本人モードのPATCH bodyを安全フィールドのみに絞り込む
 */
export function sanitizeSelfPatchBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (SELF_PATCH_ALLOWED_FIELDS.has(key)) {
      sanitized[key] = body[key];
    }
  }
  return sanitized;
}

/**
 * マイナンバー系エンドポイント向け 認可ヘルパ
 *
 * チェック内容:
 * 1. 認証
 * 2. ターゲットユーザー存在 + 自テナント所属（テナント越境ブロック）
 * 3. mynumber 個別権限（user_permission_overrides 経由）
 *
 * HR権限とは独立した個別権限制（read/manage）を要求する。
 * admin/hr ロールでも個別付与がなければ拒否される。
 */
export async function requireMynumberAccess(
  request: NextRequest,
  targetUserId: string,
  permission: 'read' | 'manage',
): Promise<UserAccessResult> {
  const { auth, errorResponse } = await withAuth(request);
  if (errorResponse) return { errorResponse };
  if (!auth.user?.tenantId) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 },
      ),
    };
  }

  const targetUser = await prisma.users.findUnique({
    where: { id: targetUserId },
    select: { id: true, tenantId: true },
  });

  if (!targetUser) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      ),
    };
  }

  if (targetUser.tenantId !== auth.user.tenantId) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: '権限がありません' },
        { status: 403 },
      ),
    };
  }

  const hasPerm =
    permission === 'manage'
      ? await canManageMynumber(auth.user.tenantId, auth.user.userId)
      : await canReadMynumber(auth.user.tenantId, auth.user.userId);

  if (!hasPerm) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error:
            permission === 'manage'
              ? 'マイナンバー管理権限がありません'
              : 'マイナンバー閲覧権限がありません',
        },
        { status: 403 },
      ),
    };
  }

  return {
    user: auth.user,
    targetUser: { id: targetUser.id, tenantId: targetUser.tenantId },
    isSelf: auth.user.userId === targetUserId,
    isAdminOrHR: ['admin', 'hr'].includes(auth.user.role),
  };
}
