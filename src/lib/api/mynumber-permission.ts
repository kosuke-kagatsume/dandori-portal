/**
 * マイナンバー権限チェック
 * HR権限とは分離された個別権限のみ
 */

import { prisma } from '@/lib/prisma';

export type MynumberPermission = 'mynumber:read:company' | 'mynumber:manage:company';

interface PermissionCheckResult {
  hasPermission: boolean;
  permissionCode: MynumberPermission;
}

/**
 * ユーザーがマイナンバー権限を持っているか検証
 * user_permission_overrides テーブルで個別に付与された権限のみ有効
 */
export async function checkMynumberPermission(
  tenantId: string,
  userId: string,
  requiredPermission: MynumberPermission
): Promise<PermissionCheckResult> {
  const override = await prisma.user_permission_overrides.findFirst({
    where: {
      tenantId,
      userId,
      overrideType: 'grant',
      permissions: {
        code: requiredPermission,
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: { permissions: true },
  });

  return {
    hasPermission: !!override,
    permissionCode: requiredPermission,
  };
}

/**
 * マイナンバー閲覧権限チェック
 */
export async function canReadMynumber(tenantId: string, userId: string): Promise<boolean> {
  const result = await checkMynumberPermission(tenantId, userId, 'mynumber:read:company');
  return result.hasPermission;
}

/**
 * マイナンバー管理権限チェック（manage は read も含む）
 */
export async function canManageMynumber(tenantId: string, userId: string): Promise<boolean> {
  const result = await checkMynumberPermission(tenantId, userId, 'mynumber:manage:company');
  return result.hasPermission;
}
