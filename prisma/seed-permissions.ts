/**
 * 権限マスタ・システムロールのシードスクリプト
 *
 * 実行: npx ts-node prisma/seed-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// システムロール定義（既存6ロール）
// ============================================================================

const SYSTEM_ROLES = [
  { code: 'employee', name: '一般社員', sortOrder: 1, color: '#6B7280' },
  { code: 'manager', name: 'マネージャー', sortOrder: 2, color: '#3B82F6' },
  { code: 'executive', name: '経営者', sortOrder: 3, color: '#8B5CF6' },
  { code: 'hr', name: '人事担当', sortOrder: 4, color: '#10B981' },
  { code: 'admin', name: 'システム管理者', sortOrder: 5, color: '#EF4444' },
  { code: 'applicant', name: '新入社員', sortOrder: 6, color: '#F59E0B' },
];

// ============================================================================
// 権限マスタ定義
// ============================================================================

type PermissionDef = {
  resource: string;
  action: string;
  scope: string;
  name: string;
  description?: string;
  category: 'menu' | 'feature';
  menuKey?: string;
};

// メニュー表示権限
const MENU_PERMISSIONS: PermissionDef[] = [
  { resource: 'dashboard', action: 'read', scope: 'self', name: 'ダッシュボード表示', category: 'menu', menuKey: 'dashboard' },
  { resource: 'announcements', action: 'read', scope: 'self', name: 'アナウンス表示', category: 'menu', menuKey: 'announcements' },
  { resource: 'users', action: 'read', scope: 'self', name: 'ユーザー管理表示', category: 'menu', menuKey: 'users' },
  { resource: 'members', action: 'read', scope: 'self', name: 'メンバー管理表示', category: 'menu', menuKey: 'members' },
  { resource: 'attendance', action: 'read', scope: 'self', name: '勤怠管理表示', category: 'menu', menuKey: 'attendance' },
  { resource: 'leave', action: 'read', scope: 'self', name: '休暇管理表示', category: 'menu', menuKey: 'leave' },
  { resource: 'workflow', action: 'read', scope: 'self', name: 'ワークフロー表示', category: 'menu', menuKey: 'workflow' },
  { resource: 'approval', action: 'read', scope: 'self', name: '承認管理表示', category: 'menu', menuKey: 'approval' },
  { resource: 'payroll', action: 'read', scope: 'self', name: '給与管理表示', category: 'menu', menuKey: 'payroll' },
  { resource: 'evaluation', action: 'read', scope: 'self', name: '人事評価表示', category: 'menu', menuKey: 'evaluation' },
  { resource: 'organization', action: 'read', scope: 'self', name: '組織管理表示', category: 'menu', menuKey: 'organization' },
  { resource: 'scheduled_changes', action: 'read', scope: 'self', name: '予約管理表示', category: 'menu', menuKey: 'scheduledChanges' },
  { resource: 'legal_updates', action: 'read', scope: 'self', name: '法令更新表示', category: 'menu', menuKey: 'legalUpdates' },
  { resource: 'announcements_admin', action: 'read', scope: 'self', name: 'アナウンス管理表示', category: 'menu', menuKey: 'announcementsAdmin' },
  { resource: 'assets', action: 'read', scope: 'self', name: '資産管理表示', category: 'menu', menuKey: 'assets' },
  { resource: 'saas', action: 'read', scope: 'self', name: 'SaaS管理表示', category: 'menu', menuKey: 'saas' },
  { resource: 'onboarding', action: 'read', scope: 'self', name: '入社手続き表示', category: 'menu', menuKey: 'onboarding' },
  { resource: 'settings', action: 'read', scope: 'self', name: '設定表示', category: 'menu', menuKey: 'settings' },
  { resource: 'audit', action: 'read', scope: 'self', name: '監査ログ表示', category: 'menu', menuKey: 'audit' },
  { resource: 'health', action: 'read', scope: 'self', name: '健康管理表示', category: 'menu', menuKey: 'health' },
];

// 機能権限
const FEATURE_PERMISSIONS: PermissionDef[] = [
  // ユーザー管理
  { resource: 'users', action: 'create', scope: 'company', name: 'ユーザー作成', category: 'feature' },
  { resource: 'users', action: 'read', scope: 'company', name: '全ユーザー閲覧', category: 'feature' },
  { resource: 'users', action: 'update', scope: 'company', name: 'ユーザー更新', category: 'feature' },
  { resource: 'users', action: 'delete', scope: 'company', name: 'ユーザー削除', category: 'feature' },
  // 勤怠
  { resource: 'attendance', action: 'create', scope: 'self', name: '打刻', category: 'feature' },
  { resource: 'attendance', action: 'read', scope: 'team', name: 'チーム勤怠閲覧', category: 'feature' },
  { resource: 'attendance', action: 'read', scope: 'company', name: '全社勤怠閲覧', category: 'feature' },
  { resource: 'attendance', action: 'update', scope: 'company', name: '勤怠修正', category: 'feature' },
  { resource: 'attendance', action: 'approve', scope: 'team', name: 'チーム勤怠承認', category: 'feature' },
  // 休暇
  { resource: 'leave', action: 'create', scope: 'self', name: '休暇申請', category: 'feature' },
  { resource: 'leave', action: 'read', scope: 'team', name: 'チーム休暇閲覧', category: 'feature' },
  { resource: 'leave', action: 'read', scope: 'company', name: '全社休暇閲覧', category: 'feature' },
  { resource: 'leave', action: 'approve', scope: 'team', name: '休暇承認', category: 'feature' },
  // ワークフロー
  { resource: 'workflow', action: 'create', scope: 'self', name: 'ワークフロー作成', category: 'feature' },
  { resource: 'workflow', action: 'read', scope: 'team', name: 'チームワークフロー閲覧', category: 'feature' },
  { resource: 'workflow', action: 'read', scope: 'company', name: '全社ワークフロー閲覧', category: 'feature' },
  // 承認
  { resource: 'approval', action: 'approve', scope: 'team', name: 'チーム承認', category: 'feature' },
  { resource: 'approval', action: 'approve', scope: 'department', name: '部門承認', category: 'feature' },
  { resource: 'approval', action: 'approve', scope: 'company', name: '全社承認', category: 'feature' },
  // 給与
  { resource: 'payroll', action: 'read', scope: 'self', name: '自分の給与閲覧', category: 'feature' },
  { resource: 'payroll', action: 'read', scope: 'team', name: 'チーム給与閲覧', category: 'feature' },
  { resource: 'payroll', action: 'read', scope: 'company', name: '全社給与閲覧', category: 'feature' },
  { resource: 'payroll', action: 'create', scope: 'company', name: '給与計算実行', category: 'feature' },
  { resource: 'payroll', action: 'update', scope: 'company', name: '給与編集', category: 'feature' },
  // 人事評価
  { resource: 'evaluation', action: 'read', scope: 'team', name: 'チーム評価閲覧', category: 'feature' },
  { resource: 'evaluation', action: 'read', scope: 'company', name: '全社評価閲覧', category: 'feature' },
  { resource: 'evaluation', action: 'create', scope: 'team', name: 'チーム評価入力', category: 'feature' },
  { resource: 'evaluation', action: 'approve', scope: 'company', name: '評価承認', category: 'feature' },
  // 組織管理
  { resource: 'organization', action: 'read', scope: 'company', name: '組織閲覧', category: 'feature' },
  { resource: 'organization', action: 'manage', scope: 'company', name: '組織管理', category: 'feature' },
  // アナウンス管理
  { resource: 'announcements_admin', action: 'create', scope: 'company', name: 'アナウンス作成', category: 'feature' },
  { resource: 'announcements_admin', action: 'update', scope: 'company', name: 'アナウンス編集', category: 'feature' },
  { resource: 'announcements_admin', action: 'delete', scope: 'company', name: 'アナウンス削除', category: 'feature' },
  // 資産管理
  { resource: 'assets', action: 'create', scope: 'company', name: '資産登録', category: 'feature' },
  { resource: 'assets', action: 'update', scope: 'company', name: '資産更新', category: 'feature' },
  { resource: 'assets', action: 'delete', scope: 'company', name: '資産削除', category: 'feature' },
  // SaaS管理
  { resource: 'saas', action: 'manage', scope: 'company', name: 'SaaS管理', category: 'feature' },
  // オンボーディング
  { resource: 'onboarding', action: 'manage', scope: 'company', name: '入社手続き管理', category: 'feature' },
  { resource: 'onboarding', action: 'read', scope: 'self', name: '自分の入社手続き', category: 'feature' },
  // 設定
  { resource: 'settings', action: 'manage', scope: 'company', name: 'システム設定管理', category: 'feature' },
  // 監査
  { resource: 'audit', action: 'read', scope: 'company', name: '監査ログ閲覧', category: 'feature' },
  // 健康管理
  { resource: 'health', action: 'read', scope: 'company', name: '健康管理閲覧', category: 'feature' },
  { resource: 'health', action: 'manage', scope: 'company', name: '健康管理', category: 'feature' },
  // メンバー
  { resource: 'members', action: 'read', scope: 'company', name: '全メンバー閲覧', category: 'feature' },
  { resource: 'members', action: 'read', scope: 'team', name: 'チームメンバー閲覧', category: 'feature' },
  // 予約管理
  { resource: 'scheduled_changes', action: 'manage', scope: 'company', name: '予約変更管理', category: 'feature' },
  // 法令更新
  { resource: 'legal_updates', action: 'read', scope: 'company', name: '法令更新閲覧', category: 'feature' },
  { resource: 'legal_updates', action: 'manage', scope: 'company', name: '法令更新管理', category: 'feature' },
];

const ALL_PERMISSIONS = [...MENU_PERMISSIONS, ...FEATURE_PERMISSIONS];

// ============================================================================
// ロール×権限マッピング（既存MENU_PERMISSIONSから移行）
// ============================================================================

// 各ロールに付与する権限コード
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  employee: [
    // メニュー
    'dashboard:read:self', 'announcements:read:self', 'members:read:self',
    'attendance:read:self', 'leave:read:self', 'workflow:read:self',
    // 機能
    'attendance:create:self', 'leave:create:self', 'workflow:create:self',
    'payroll:read:self', 'members:read:team',
  ],
  manager: [
    // メニュー
    'dashboard:read:self', 'announcements:read:self', 'users:read:self',
    'members:read:self', 'attendance:read:self', 'leave:read:self',
    'workflow:read:self', 'approval:read:self', 'evaluation:read:self',
    // 機能
    'attendance:create:self', 'attendance:read:team', 'attendance:approve:team',
    'leave:create:self', 'leave:read:team', 'leave:approve:team',
    'workflow:create:self', 'workflow:read:team',
    'approval:approve:team',
    'payroll:read:self', 'payroll:read:team',
    'evaluation:read:team', 'evaluation:create:team',
    'organization:read:company',
    'members:read:company',
  ],
  executive: [
    // メニュー
    'dashboard:read:self', 'announcements:read:self', 'users:read:self',
    'members:read:self', 'attendance:read:self', 'leave:read:self',
    'workflow:read:self', 'approval:read:self', 'payroll:read:self',
    'evaluation:read:self', 'organization:read:self',
    'assets:read:self', 'saas:read:self', 'settings:read:self',
    // 機能
    'attendance:create:self', 'attendance:read:company',
    'leave:create:self', 'leave:read:company',
    'workflow:create:self', 'workflow:read:company',
    'approval:approve:company',
    'payroll:read:self', 'payroll:read:company',
    'evaluation:read:company', 'evaluation:approve:company',
    'organization:read:company', 'organization:manage:company',
    'users:read:company',
    'members:read:company',
    'settings:manage:company',
  ],
  hr: [
    // メニュー
    'dashboard:read:self', 'announcements:read:self', 'users:read:self',
    'members:read:self', 'attendance:read:self', 'leave:read:self',
    'workflow:read:self', 'approval:read:self', 'payroll:read:self',
    'evaluation:read:self', 'organization:read:self',
    'scheduled_changes:read:self', 'legal_updates:read:self',
    'announcements_admin:read:self', 'assets:read:self', 'saas:read:self',
    'onboarding:read:self', 'settings:read:self', 'health:read:self',
    // 機能
    'users:create:company', 'users:read:company', 'users:update:company', 'users:delete:company',
    'attendance:create:self', 'attendance:read:company', 'attendance:update:company',
    'leave:create:self', 'leave:read:company', 'leave:approve:team',
    'workflow:create:self', 'workflow:read:company',
    'approval:approve:department',
    'payroll:read:self', 'payroll:read:company', 'payroll:create:company', 'payroll:update:company',
    'evaluation:read:company', 'evaluation:approve:company',
    'organization:read:company', 'organization:manage:company',
    'announcements_admin:create:company', 'announcements_admin:update:company', 'announcements_admin:delete:company',
    'assets:create:company', 'assets:update:company', 'assets:delete:company',
    'saas:manage:company',
    'onboarding:manage:company',
    'scheduled_changes:manage:company',
    'legal_updates:read:company', 'legal_updates:manage:company',
    'health:read:company', 'health:manage:company',
    'members:read:company',
    'settings:manage:company',
  ],
  admin: [
    // メニュー
    'dashboard:read:self', 'announcements:read:self', 'members:read:self',
    'attendance:read:self', 'leave:read:self', 'workflow:read:self',
    'organization:read:self', 'legal_updates:read:self',
    'announcements_admin:read:self', 'assets:read:self', 'saas:read:self',
    'settings:read:self', 'audit:read:self', 'health:read:self',
    // 機能
    'users:create:company', 'users:read:company', 'users:update:company', 'users:delete:company',
    'attendance:create:self', 'attendance:read:company', 'attendance:update:company',
    'leave:create:self', 'leave:read:company',
    'workflow:create:self', 'workflow:read:company',
    'organization:read:company', 'organization:manage:company',
    'announcements_admin:create:company', 'announcements_admin:update:company', 'announcements_admin:delete:company',
    'assets:create:company', 'assets:update:company', 'assets:delete:company',
    'saas:manage:company',
    'settings:manage:company',
    'audit:read:company',
    'legal_updates:read:company', 'legal_updates:manage:company',
    'health:read:company', 'health:manage:company',
    'members:read:company',
    'payroll:read:self',
  ],
  applicant: [
    // メニュー
    'dashboard:read:self', 'announcements:read:self',
    'attendance:read:self', 'leave:read:self', 'workflow:read:self',
    'onboarding:read:self',
    // 機能
    'attendance:create:self', 'leave:create:self', 'workflow:create:self',
    'onboarding:read:self',
  ],
};

// ============================================================================
// シード実行
// ============================================================================

function generateId(): string {
  return crypto.randomUUID();
}

async function seedPermissions(tenantId: string) {
  console.log(`テナント ${tenantId} の権限データをシード中...`);

  // 1. 権限マスタの作成（テナント非依存）
  const permissionRecords: Array<{
    id: string;
    resource: string;
    action: string;
    scope: string;
    code: string;
    name: string;
    description: string | null;
    category: string;
    menuKey: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const perm of ALL_PERMISSIONS) {
    const code = `${perm.resource}:${perm.action}:${perm.scope}`;
    permissionRecords.push({
      id: generateId(),
      resource: perm.resource,
      action: perm.action,
      scope: perm.scope,
      code,
      name: perm.name,
      description: perm.description || null,
      category: perm.category,
      menuKey: perm.menuKey || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 重複排除（codeベース）
  const uniquePermissions = permissionRecords.filter(
    (p, idx, arr) => arr.findIndex(q => q.code === p.code) === idx
  );

  // Upsertで権限マスタ作成
  for (const perm of uniquePermissions) {
    await prisma.permissions.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description, category: perm.category, menuKey: perm.menuKey, updatedAt: new Date() },
      create: perm,
    });
  }
  console.log(`  権限マスタ: ${uniquePermissions.length}件`);

  // 2. システムロールの作成（テナントごと）
  const roleRecords: Array<{ id: string; code: string }> = [];
  for (const role of SYSTEM_ROLES) {
    const id = generateId();
    await prisma.roles.upsert({
      where: { tenantId_code: { tenantId, code: role.code } },
      update: { name: role.name, sortOrder: role.sortOrder, color: role.color, updatedAt: new Date() },
      create: {
        id,
        tenantId,
        code: role.code,
        name: role.name,
        isSystem: true,
        isActive: true,
        sortOrder: role.sortOrder,
        color: role.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const existing = await prisma.roles.findUnique({ where: { tenantId_code: { tenantId, code: role.code } } });
    if (existing) {
      roleRecords.push({ id: existing.id, code: role.code });
    }
  }
  console.log(`  システムロール: ${roleRecords.length}件`);

  // 3. ロール×権限マッピング
  let mappingCount = 0;
  for (const roleRec of roleRecords) {
    const permCodes = ROLE_PERMISSION_MAP[roleRec.code] || [];
    for (const code of permCodes) {
      const perm = await prisma.permissions.findUnique({ where: { code } });
      if (!perm) {
        console.warn(`    警告: 権限 "${code}" がマスタに存在しません`);
        continue;
      }
      await prisma.role_permissions.upsert({
        where: { roleId_permissionId: { roleId: roleRec.id, permissionId: perm.id } },
        update: {},
        create: {
          id: generateId(),
          roleId: roleRec.id,
          permissionId: perm.id,
          createdAt: new Date(),
        },
      });
      mappingCount++;
    }
  }
  console.log(`  ロール×権限マッピング: ${mappingCount}件`);
}

async function main() {
  console.log('=== 権限マスタシード開始 ===');

  // 全テナントに対してシード
  const tenants = await prisma.tenants.findMany({ select: { id: true, name: true } });

  if (tenants.length === 0) {
    console.log('テナントが存在しません。ダミーテナントIDでシードします。');
    await seedPermissions('default-tenant');
  } else {
    for (const tenant of tenants) {
      console.log(`\nテナント: ${tenant.name} (${tenant.id})`);
      await seedPermissions(tenant.id);
    }
  }

  console.log('\n=== 権限マスタシード完了 ===');
}

main()
  .catch((e) => {
    console.error('シードエラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
