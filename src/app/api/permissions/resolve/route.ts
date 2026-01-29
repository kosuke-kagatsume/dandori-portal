import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  errorResponse,
} from '@/lib/api/api-helpers';

// GET /api/permissions/resolve?userId=xxx - 最終権限を計算して返す
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');

    if (!userId) {
      return errorResponse('userId は必須です', 400);
    }

    // 1. ユーザー情報取得（role フィールドからロールコード取得）
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true, roles: true },
    });

    if (!user) {
      return errorResponse('ユーザーが見つかりません', 404);
    }

    // 2. ユーザーの全ロール取得（role + roles配列）
    const roleCodes = new Set<string>();
    if (user.role) roleCodes.add(user.role);
    if (user.roles) user.roles.forEach((r) => roleCodes.add(r));

    // 3. ロールIDに変換
    const roles = await prisma.roles.findMany({
      where: {
        tenantId,
        code: { in: Array.from(roleCodes) },
        isActive: true,
      },
    });

    // 4. 各ロールの権限を和集合で取得
    const roleIds = roles.map((r) => r.id);
    const rolePermissions = await prisma.role_permissions.findMany({
      where: { roleId: { in: roleIds } },
      include: { permissions: true },
    });

    // 権限を code → permission のMapに
    const permissionMap = new Map<string, typeof rolePermissions[0]['permissions']>();
    for (const rp of rolePermissions) {
      permissionMap.set(rp.permissions.code, rp.permissions);
    }

    // 5. user_permission_overrides を適用
    const overrides = await prisma.user_permission_overrides.findMany({
      where: { tenantId, userId },
      include: { permissions: true },
    });

    const now = new Date();
    for (const override of overrides) {
      // 有効期限チェック
      if (override.expiresAt && override.expiresAt < now) {
        continue;
      }

      if (override.overrideType === 'grant') {
        permissionMap.set(override.permissions.code, override.permissions);
      } else if (override.overrideType === 'revoke') {
        permissionMap.delete(override.permissions.code);
      }
    }

    // 6. 最終権限セットを返す
    const resolvedPermissions = Array.from(permissionMap.values());
    const permissionCodes = resolvedPermissions.map((p) => p.code);

    // メニュー権限とフィーチャー権限を分離
    const menuPermissions = resolvedPermissions.filter((p) => p.category === 'menu');
    const featurePermissions = resolvedPermissions.filter((p) => p.category === 'feature');

    return successResponse({
      userId,
      roleCodes: Array.from(roleCodes),
      roles: roles.map((r) => ({ id: r.id, code: r.code, name: r.name })),
      permissions: permissionCodes,
      menuPermissions: menuPermissions.map((p) => ({
        code: p.code,
        menuKey: p.menuKey,
        name: p.name,
      })),
      featurePermissions: featurePermissions.map((p) => ({
        code: p.code,
        resource: p.resource,
        action: p.action,
        scope: p.scope,
        name: p.name,
      })),
      overrides: overrides
        .filter((o) => !o.expiresAt || o.expiresAt >= now)
        .map((o) => ({
          permissionCode: o.permissions.code,
          overrideType: o.overrideType,
          reason: o.reason,
          expiresAt: o.expiresAt,
        })),
    });
  } catch (error) {
    return handleApiError(error, '権限解決');
  }
}
