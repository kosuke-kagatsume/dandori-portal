/**
 * Role-Based Access Control (RBAC)
 *
 * 権限別アクセス制御システム
 * - 6つのユーザーロール定義
 * - メニュー表示権限管理
 * - 機能別アクセス権限
 */

// ============================================================================
// USER ROLES
// ============================================================================

export type UserRole =
  | 'employee'   // 一般社員
  | 'manager'    // マネージャー
  | 'executive'  // 経営者
  | 'hr'         // 人事担当
  | 'admin'      // システム管理者
  | 'applicant'; // 新入社員（入社前）

// ============================================================================
// MENU PERMISSIONS
// ============================================================================

export const MENU_PERMISSIONS = {
  dashboard: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'],
  announcements: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'], // アナウンス一覧（全社員）
  users: ['hr', 'admin'],
  members: ['manager', 'executive', 'hr', 'admin'], // システム管理者追加
  attendance: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'], // システム管理者追加
  leave: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'], // システム管理者追加
  workflow: ['employee', 'manager', 'executive', 'hr', 'admin', 'applicant'], // システム管理者追加
  approval: ['manager', 'executive', 'hr'],
  payroll: ['executive', 'hr'],
  evaluation: ['manager', 'executive', 'hr'],
  organization: ['executive', 'hr', 'admin'],
  scheduledChanges: ['hr'], // 予約管理（HR権限のみ）
  legalUpdates: ['hr', 'admin'], // 法令・制度更新（HR・管理者のみ）
  announcementsAdmin: ['hr', 'admin'], // アナウンス管理（HR・管理者のみ）
  assets: ['executive', 'hr', 'admin'],
  saas: ['executive', 'hr', 'admin'],
  onboarding: ['hr', 'applicant'], // 人事担当と新入社員がアクセス可能
  settings: ['executive', 'hr', 'admin'], // 経営者、人事担当、システム管理者
  audit: ['admin'], // 監査ログはシステム管理者のみ
  dwAdminDashboard: ['admin'], // DW管理者ダッシュボード（システム管理者のみ）
  health: ['hr', 'admin'], // 健康管理（人事担当・管理者のみ）
} as const;

export type MenuKey = keyof typeof MENU_PERMISSIONS;

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * ユーザーが指定されたメニューにアクセスできるかチェック
 */
export function hasMenuAccess(
  userRole: UserRole,
  menuKey: MenuKey
): boolean {
  const allowedRoles = MENU_PERMISSIONS[menuKey];
  return allowedRoles.includes(userRole);
}

/**
 * ユーザーのアクセス可能なメニュー一覧を取得
 */
export function getAccessibleMenus(userRole: UserRole): MenuKey[] {
  return Object.entries(MENU_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([key]) => key as MenuKey);
}

/**
 * 特定機能へのアクセス権限チェック
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

// ============================================================================
// FEATURE PERMISSIONS
// ============================================================================

export type Permission =
  // ユーザー管理
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:delete'
  // 給与管理
  | 'payroll:read:all'      // 全社員の給与閲覧
  | 'payroll:read:team'     // チームの給与閲覧
  | 'payroll:read:own'      // 自分の給与閲覧
  | 'payroll:write'         // 給与計算・編集
  // 人事評価
  | 'evaluation:read:all'   // 全社評価閲覧
  | 'evaluation:read:team'  // チーム評価閲覧
  | 'evaluation:write:team' // チーム評価入力
  | 'evaluation:approve'    // 評価承認
  // 組織管理
  | 'organization:read'
  | 'organization:write'
  // 承認
  | 'approval:team'         // チーム承認
  | 'approval:hr'           // 人事承認
  | 'approval:executive'    // 経営承認
  // オンボーディング
  | 'onboarding:manage'     // 入社手続き管理
  // システム
  | 'system:settings'       // システム設定
  | 'system:audit'          // 監査ログ閲覧
  ;

export const PERMISSIONS: Record<Permission, UserRole[]> = {
  // ユーザー管理
  'user:create': ['hr', 'admin'],
  'user:read': ['manager', 'executive', 'hr', 'admin'],
  'user:update': ['hr', 'admin'],
  'user:delete': ['hr', 'admin'],

  // 給与管理
  'payroll:read:all': ['hr'],
  'payroll:read:team': ['manager'],
  'payroll:read:own': ['employee', 'manager', 'executive', 'hr', 'admin'],
  'payroll:write': ['hr'],

  // 人事評価
  'evaluation:read:all': ['executive', 'hr'],
  'evaluation:read:team': ['manager'],
  'evaluation:write:team': ['manager'],
  'evaluation:approve': ['executive', 'hr'],

  // 組織管理
  'organization:read': ['manager', 'executive', 'hr', 'admin'],
  'organization:write': ['executive', 'hr', 'admin'],

  // 承認
  'approval:team': ['manager'],
  'approval:hr': ['hr'],
  'approval:executive': ['executive'],

  // オンボーディング
  'onboarding:manage': ['hr'],

  // システム
  'system:settings': ['admin'],
  'system:audit': ['admin'],
};

// ============================================================================
// ROLE DISPLAY NAMES
// ============================================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: '一般社員',
  manager: 'マネージャー',
  executive: '経営者',
  hr: '人事担当',
  admin: 'システム管理者',
  applicant: '新入社員',
};

// ============================================================================
// ROLE COLORS (for badges)
// ============================================================================

export const ROLE_COLORS: Record<
  UserRole,
  { bg: string; text: string; border: string }
> = {
  employee: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
  manager: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  executive: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },
  hr: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  admin: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  applicant: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
  },
};
