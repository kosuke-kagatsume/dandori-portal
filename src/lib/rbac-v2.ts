/**
 * RBAC v2 - DB連携の権限チェック関数
 *
 * 解決済み権限データを元に権限チェックを行う。
 * デモモード時はハードコード（rbac.ts）にフォールバック。
 */

// 解決済み権限の型
export interface ResolvedPermissions {
  userId: string;
  roleCodes: string[];
  roles: Array<{ id: string; code: string; name: string }>;
  permissions: string[]; // 権限コード配列
  menuPermissions: Array<{ code: string; menuKey: string | null; name: string }>;
  featurePermissions: Array<{
    code: string;
    resource: string;
    action: string;
    scope: string;
    name: string;
  }>;
  overrides: Array<{
    permissionCode: string;
    overrideType: string;
    reason: string | null;
    expiresAt: string | null;
  }>;
}

/**
 * 権限コードでチェック
 * 例: can('payroll:read:company', resolvedPermissions)
 */
export function can(
  permissionCode: string,
  resolved: ResolvedPermissions | null
): boolean {
  if (!resolved) return false;
  return resolved.permissions.includes(permissionCode);
}

/**
 * メニュー表示権限チェック
 * 例: canMenu('attendance', resolvedPermissions)
 */
export function canMenu(
  menuKey: string,
  resolved: ResolvedPermissions | null
): boolean {
  if (!resolved) return false;
  return resolved.menuPermissions.some((mp) => mp.menuKey === menuKey);
}

/**
 * いずれかの権限があるかチェック
 */
export function canAny(
  permissionCodes: string[],
  resolved: ResolvedPermissions | null
): boolean {
  if (!resolved) return false;
  return permissionCodes.some((code) => resolved.permissions.includes(code));
}

/**
 * 全ての権限があるかチェック
 */
export function canAll(
  permissionCodes: string[],
  resolved: ResolvedPermissions | null
): boolean {
  if (!resolved) return false;
  return permissionCodes.every((code) => resolved.permissions.includes(code));
}

/**
 * リソースに対する特定アクションの権限チェック
 * 例: canResource('payroll', 'read', resolved) → payroll:read:* のいずれかがあればtrue
 */
export function canResource(
  resource: string,
  action: string,
  resolved: ResolvedPermissions | null
): boolean {
  if (!resolved) return false;
  const prefix = `${resource}:${action}:`;
  return resolved.permissions.some((code) => code.startsWith(prefix));
}

/**
 * 権限解決APIを呼び出す
 */
export async function resolvePermissions(
  userId: string,
  tenantId: string
): Promise<ResolvedPermissions | null> {
  try {
    const response = await fetch(
      `/api/permissions/resolve?userId=${userId}&tenantId=${tenantId}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success) return null;
    return data.data as ResolvedPermissions;
  } catch {
    return null;
  }
}
