import type { DemoUser, UserRole, Permission } from '@/types';

// 役割別の権限マッピング
const rolePermissions: Record<UserRole, Permission[]> = {
  employee: ['view_own'],
  manager: ['view_own', 'view_team', 'approve_requests'],
  hr: ['view_own', 'view_team', 'view_all', 'approve_requests'],
  admin: ['view_own', 'view_team', 'view_all', 'approve_requests', 'manage_system'],
};

// デモユーザー定義
export const demoUsers: Record<UserRole, DemoUser> = {
  employee: {
    id: '1',
    name: '田中太郎',
    email: 'tanaka@dandori.local',
    role: 'employee',
    department: '営業部',
    avatar: '/avatars/tanaka.png',
    permissions: rolePermissions.employee,
  },
  manager: {
    id: '2',
    name: '佐藤部長',
    email: 'sato@dandori.local',
    role: 'manager',
    department: '営業部',
    avatar: '/avatars/sato.png',
    permissions: rolePermissions.manager,
  },
  hr: {
    id: '3',
    name: '山田人事',
    email: 'yamada@dandori.local',
    role: 'hr',
    department: '人事部',
    avatar: '/avatars/yamada.png',
    permissions: rolePermissions.hr,
  },
  admin: {
    id: '4',
    name: 'システム管理者',
    email: 'admin@dandori.local',
    role: 'admin',
    department: 'IT部',
    avatar: '/avatars/admin.png',
    permissions: rolePermissions.admin,
  },
};

// 役割の日本語表示名
export const roleDisplayNames: Record<UserRole, string> = {
  employee: '一般社員',
  manager: 'マネージャー',
  hr: '人事担当',
  admin: 'システム管理者',
};

// 権限チェック関数
export function hasPermission(user: DemoUser | null, permission: Permission): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

// 役割チェック関数
export function hasRole(user: DemoUser | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

// 役割以上のチェック関数（階層的権限）
export function hasRoleOrHigher(user: DemoUser | null, minRole: UserRole): boolean {
  if (!user) return false;
  
  const roleHierarchy: Record<UserRole, number> = {
    employee: 1,
    manager: 2,
    hr: 3,
    admin: 4,
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[minRole];
}