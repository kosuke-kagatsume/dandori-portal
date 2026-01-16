/**
 * 統一組織データ（システム会社版）
 *
 * 50人のシステム会社として現実的な組織構造を構築
 * - 取締役: 3名（CEO、CTO、CFO）
 * - 開発部門: 24名
 * - 営業部門: 11名
 * - 管理部門: 12名（人事4名、経理4名、総務4名）
 */

import { generateMockUsers } from './mock-data';
import type { User, OrganizationNode, OrganizationMember, UserRole } from '@/types';

// 50人のユーザーを取得
const mockUsers = generateMockUsers();

// 役職定義（システム会社に適した構成）
const positions = {
  // 経営層（3名）
  ceo: '代表取締役社長',
  cto: '取締役CTO',
  cfo: '取締役CFO',

  // 部長（3名）
  devManager: '開発部長',
  salesManager: '営業部長',
  adminManager: '管理部長',

  // 課長/マネージャー（6名）
  frontendManager: 'フロントエンド課長',
  backendManager: 'バックエンド課長',
  infraManager: 'インフラ課長',
  salesTeamLeader1: '営業1課長',
  salesTeamLeader2: '営業2課長',
  hrManager: '人事課長',

  // リーダー/主任（9名）
  frontendLead: 'フロントエンドリーダー',
  backendLead: 'バックエンドリーダー',
  infraLead: 'インフラリーダー',
  salesLead1: '営業1係長',
  salesLead2: '営業2係長',
  salesLead3: '営業3係長',
  hrLead: '人事主任',
  accountingLead: '経理主任',
  generalAffairsLead: '総務主任',

  // メンバー
  seniorEngineer: 'シニアエンジニア',
  engineer: 'エンジニア',
  juniorEngineer: 'ジュニアエンジニア',
  salesMember: '営業担当',
  hrMember: '人事担当',
  accountingMember: '経理担当',
  generalAffairsMember: '総務担当',
};

// 部署構成（User.unitId → 部署名のマッピング）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _departmentMapping: Record<string, { name: string; division: string }> = {
  'dept-1': { name: '経営企画室', division: 'executive' },
  'dept-2': { name: 'フロントエンド課', division: 'development' },
  'dept-3': { name: 'バックエンド課', division: 'development' },
  'dept-4': { name: 'インフラ課', division: 'development' },
  'dept-5': { name: '営業1課', division: 'sales' },
  'dept-6': { name: '営業2課', division: 'sales' },
  'dept-7': { name: '人事課', division: 'admin' },
  'dept-8': { name: '経理課', division: 'admin' },
  'dept-9': { name: '総務課', division: 'admin' },
};

// 50名の役職割り当て
const roleAssignments: Array<{
  userId: string;
  position: string;
  role: UserRole;
  isManager: boolean;
  deptId: string;
  deptName: string;
}> = [
  // === 経営層（3名）===
  { userId: 'user-1', position: positions.ceo, role: 'admin', isManager: true, deptId: 'dept-1', deptName: '経営企画室' },
  { userId: 'user-2', position: positions.cto, role: 'admin', isManager: true, deptId: 'dept-1', deptName: '経営企画室' },
  { userId: 'user-3', position: positions.cfo, role: 'admin', isManager: true, deptId: 'dept-1', deptName: '経営企画室' },

  // === 開発部門（24名）===
  // 開発部長
  { userId: 'user-4', position: positions.devManager, role: 'manager', isManager: true, deptId: 'dept-2', deptName: 'フロントエンド課' },

  // フロントエンド課（8名）
  { userId: 'user-5', position: positions.frontendManager, role: 'manager', isManager: true, deptId: 'dept-2', deptName: 'フロントエンド課' },
  { userId: 'user-6', position: positions.frontendLead, role: 'manager', isManager: true, deptId: 'dept-2', deptName: 'フロントエンド課' },
  { userId: 'user-7', position: positions.seniorEngineer, role: 'employee', isManager: false, deptId: 'dept-2', deptName: 'フロントエンド課' },
  { userId: 'user-8', position: positions.seniorEngineer, role: 'employee', isManager: false, deptId: 'dept-2', deptName: 'フロントエンド課' },
  { userId: 'user-9', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-2', deptName: 'フロントエンド課' },
  { userId: 'user-10', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-2', deptName: 'フロントエンド課' },
  { userId: 'user-11', position: positions.juniorEngineer, role: 'employee', isManager: false, deptId: 'dept-2', deptName: 'フロントエンド課' },

  // バックエンド課（8名）
  { userId: 'user-12', position: positions.backendManager, role: 'manager', isManager: true, deptId: 'dept-3', deptName: 'バックエンド課' },
  { userId: 'user-13', position: positions.backendLead, role: 'manager', isManager: true, deptId: 'dept-3', deptName: 'バックエンド課' },
  { userId: 'user-14', position: positions.seniorEngineer, role: 'employee', isManager: false, deptId: 'dept-3', deptName: 'バックエンド課' },
  { userId: 'user-15', position: positions.seniorEngineer, role: 'employee', isManager: false, deptId: 'dept-3', deptName: 'バックエンド課' },
  { userId: 'user-16', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-3', deptName: 'バックエンド課' },
  { userId: 'user-17', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-3', deptName: 'バックエンド課' },
  { userId: 'user-18', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-3', deptName: 'バックエンド課' },
  { userId: 'user-19', position: positions.juniorEngineer, role: 'employee', isManager: false, deptId: 'dept-3', deptName: 'バックエンド課' },

  // インフラ課（7名）
  { userId: 'user-20', position: positions.infraManager, role: 'manager', isManager: true, deptId: 'dept-4', deptName: 'インフラ課' },
  { userId: 'user-21', position: positions.infraLead, role: 'manager', isManager: true, deptId: 'dept-4', deptName: 'インフラ課' },
  { userId: 'user-22', position: positions.seniorEngineer, role: 'employee', isManager: false, deptId: 'dept-4', deptName: 'インフラ課' },
  { userId: 'user-23', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-4', deptName: 'インフラ課' },
  { userId: 'user-24', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-4', deptName: 'インフラ課' },
  { userId: 'user-25', position: positions.engineer, role: 'employee', isManager: false, deptId: 'dept-4', deptName: 'インフラ課' },
  { userId: 'user-26', position: positions.juniorEngineer, role: 'employee', isManager: false, deptId: 'dept-4', deptName: 'インフラ課' },

  // === 営業部門（11名）===
  { userId: 'user-27', position: positions.salesManager, role: 'manager', isManager: true, deptId: 'dept-5', deptName: '営業1課' },

  // 営業1課（5名）
  { userId: 'user-28', position: positions.salesTeamLeader1, role: 'manager', isManager: true, deptId: 'dept-5', deptName: '営業1課' },
  { userId: 'user-29', position: positions.salesLead1, role: 'manager', isManager: true, deptId: 'dept-5', deptName: '営業1課' },
  { userId: 'user-30', position: positions.salesMember, role: 'employee', isManager: false, deptId: 'dept-5', deptName: '営業1課' },
  { userId: 'user-31', position: positions.salesMember, role: 'employee', isManager: false, deptId: 'dept-5', deptName: '営業1課' },

  // 営業2課（5名）
  { userId: 'user-32', position: positions.salesTeamLeader2, role: 'manager', isManager: true, deptId: 'dept-6', deptName: '営業2課' },
  { userId: 'user-33', position: positions.salesLead2, role: 'manager', isManager: true, deptId: 'dept-6', deptName: '営業2課' },
  { userId: 'user-34', position: positions.salesMember, role: 'employee', isManager: false, deptId: 'dept-6', deptName: '営業2課' },
  { userId: 'user-35', position: positions.salesMember, role: 'employee', isManager: false, deptId: 'dept-6', deptName: '営業2課' },
  { userId: 'user-36', position: positions.salesMember, role: 'employee', isManager: false, deptId: 'dept-6', deptName: '営業2課' },

  // === 管理部門（12名）===
  { userId: 'user-37', position: positions.adminManager, role: 'hr', isManager: true, deptId: 'dept-7', deptName: '人事課' },

  // 人事課（4名）
  { userId: 'user-38', position: positions.hrManager, role: 'hr', isManager: true, deptId: 'dept-7', deptName: '人事課' },
  { userId: 'user-39', position: positions.hrLead, role: 'hr', isManager: true, deptId: 'dept-7', deptName: '人事課' },
  { userId: 'user-40', position: positions.hrMember, role: 'hr', isManager: false, deptId: 'dept-7', deptName: '人事課' },

  // 経理課（4名）
  { userId: 'user-41', position: positions.hrManager, role: 'hr', isManager: true, deptId: 'dept-8', deptName: '経理課' },
  { userId: 'user-42', position: positions.accountingLead, role: 'hr', isManager: true, deptId: 'dept-8', deptName: '経理課' },
  { userId: 'user-43', position: positions.accountingMember, role: 'hr', isManager: false, deptId: 'dept-8', deptName: '経理課' },
  { userId: 'user-44', position: positions.accountingMember, role: 'hr', isManager: false, deptId: 'dept-8', deptName: '経理課' },

  // 総務課（4名）
  { userId: 'user-45', position: positions.hrManager, role: 'hr', isManager: true, deptId: 'dept-9', deptName: '総務課' },
  { userId: 'user-46', position: positions.generalAffairsLead, role: 'hr', isManager: true, deptId: 'dept-9', deptName: '総務課' },
  { userId: 'user-47', position: positions.generalAffairsMember, role: 'hr', isManager: false, deptId: 'dept-9', deptName: '総務課' },
  { userId: 'user-48', position: positions.generalAffairsMember, role: 'hr', isManager: false, deptId: 'dept-9', deptName: '総務課' },

  // 残り2名（経営企画室のスタッフ）
  { userId: 'user-49', position: '経営企画担当', role: 'manager', isManager: false, deptId: 'dept-1', deptName: '経営企画室' },
  { userId: 'user-50', position: '経営企画担当', role: 'manager', isManager: false, deptId: 'dept-1', deptName: '経営企画室' },
];

// User → OrganizationMember 変換（役職割り当てを反映）
function userToOrganizationMember(user: User): OrganizationMember {
  const assignment = roleAssignments.find(a => a.userId === user.id);

  if (!assignment) {
    // 割り当てがない場合のフォールバック
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      position: '一般社員',
      role: 'employee',
      avatar: user.avatar,
      isManager: false,
      joinDate: user.hireDate,
      status: user.status === 'retired' ? 'leave' : (user.status as OrganizationMember['status']),
    };
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    position: assignment.position,
    role: assignment.role,
    avatar: user.avatar,
    isManager: assignment.isManager,
    joinDate: user.hireDate,
    status: user.status === 'retired' ? 'leave' : (user.status as OrganizationMember['status']),
  };
}

// OrganizationMember形式に変換
export const unifiedOrganizationMembers: OrganizationMember[] = mockUsers.map(userToOrganizationMember);

// 部署IDからメンバーを取得
function getMembersByDepartmentId(deptId: string): OrganizationMember[] {
  return roleAssignments
    .filter(a => a.deptId === deptId)
    .map(a => unifiedOrganizationMembers.find(m => m.id === a.userId))
    .filter(Boolean) as OrganizationMember[];
}

// 部署の責任者を取得（最初のマネージャー）
function getHeadMember(members: OrganizationMember[]): OrganizationMember | undefined {
  return members.find(m => m.isManager);
}

// 統一された組織ツリーを構築
export const unifiedOrganizationTree: OrganizationNode = {
  id: 'company',
  name: 'ダンドリ株式会社',
  type: 'company',
  level: 0,
  memberCount: unifiedOrganizationMembers.length,
  description: 'HR管理システムを開発・提供するテクノロジー企業',
  members: getMembersByDepartmentId('dept-1'), // 経営企画室（取締役3名 + スタッフ2名）
  headMember: getHeadMember(getMembersByDepartmentId('dept-1')),
  children: [
    // 開発部門（24名）
    {
      id: 'dev-division',
      name: '開発部門',
      type: 'division',
      parentId: 'company',
      level: 1,
      memberCount: 24,
      description: 'システム開発・運用全般を担当',
      members: [getMembersByDepartmentId('dept-2')[0]], // 開発部長
      headMember: getMembersByDepartmentId('dept-2')[0],
      children: [
        {
          id: 'dept-2',
          name: 'フロントエンド課',
          type: 'department',
          parentId: 'dev-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-2').length - 1, // 部長除く
          members: getMembersByDepartmentId('dept-2').slice(1), // 部長除く
          headMember: getMembersByDepartmentId('dept-2')[1], // 課長
          children: [],
        },
        {
          id: 'dept-3',
          name: 'バックエンド課',
          type: 'department',
          parentId: 'dev-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-3').length,
          members: getMembersByDepartmentId('dept-3'),
          headMember: getHeadMember(getMembersByDepartmentId('dept-3')),
          children: [],
        },
        {
          id: 'dept-4',
          name: 'インフラ課',
          type: 'department',
          parentId: 'dev-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-4').length,
          members: getMembersByDepartmentId('dept-4'),
          headMember: getHeadMember(getMembersByDepartmentId('dept-4')),
          children: [],
        },
      ],
    },
    // 営業部門（11名）
    {
      id: 'sales-division',
      name: '営業部門',
      type: 'division',
      parentId: 'company',
      level: 1,
      memberCount: 11,
      description: '営業・マーケティング活動を担当',
      members: [getMembersByDepartmentId('dept-5')[0]], // 営業部長
      headMember: getMembersByDepartmentId('dept-5')[0],
      children: [
        {
          id: 'dept-5',
          name: '営業1課',
          type: 'department',
          parentId: 'sales-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-5').length - 1,
          members: getMembersByDepartmentId('dept-5').slice(1),
          headMember: getMembersByDepartmentId('dept-5')[1],
          children: [],
        },
        {
          id: 'dept-6',
          name: '営業2課',
          type: 'department',
          parentId: 'sales-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-6').length,
          members: getMembersByDepartmentId('dept-6'),
          headMember: getHeadMember(getMembersByDepartmentId('dept-6')),
          children: [],
        },
      ],
    },
    // 管理部門（12名）
    {
      id: 'admin-division',
      name: '管理部門',
      type: 'division',
      parentId: 'company',
      level: 1,
      memberCount: 12,
      description: '人事・経理・総務を担当',
      members: [getMembersByDepartmentId('dept-7')[0]], // 管理部長
      headMember: getMembersByDepartmentId('dept-7')[0],
      children: [
        {
          id: 'dept-7',
          name: '人事課',
          type: 'department',
          parentId: 'admin-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-7').length - 1,
          members: getMembersByDepartmentId('dept-7').slice(1),
          headMember: getMembersByDepartmentId('dept-7')[1],
          children: [],
        },
        {
          id: 'dept-8',
          name: '経理課',
          type: 'department',
          parentId: 'admin-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-8').length,
          members: getMembersByDepartmentId('dept-8'),
          headMember: getHeadMember(getMembersByDepartmentId('dept-8')),
          children: [],
        },
        {
          id: 'dept-9',
          name: '総務課',
          type: 'department',
          parentId: 'admin-division',
          level: 2,
          memberCount: getMembersByDepartmentId('dept-9').length,
          members: getMembersByDepartmentId('dept-9'),
          headMember: getHeadMember(getMembersByDepartmentId('dept-9')),
          children: [],
        },
      ],
    },
  ],
};

// ヘルパー関数: IDからメンバーを取得
export function findMemberById(id: string): OrganizationMember | undefined {
  return unifiedOrganizationMembers.find(m => m.id === id);
}

// ヘルパー関数: roleでメンバーをフィルタ
export function getMembersByRole(role: UserRole): OrganizationMember[] {
  return unifiedOrganizationMembers.filter(m => m.role === role);
}

// ヘルパー関数: 部署名でメンバーをフィルタ
export function getMembersByDepartment(departmentName: string): OrganizationMember[] {
  return roleAssignments
    .filter(a => a.deptName === departmentName)
    .map(a => unifiedOrganizationMembers.find(m => m.id === a.userId))
    .filter(Boolean) as OrganizationMember[];
}
