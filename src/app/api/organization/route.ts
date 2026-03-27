import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// 組織ノードの型定義
interface OrganizationTreeNode {
  id: string;
  name: string;
  type: string;
  level: number;
  memberCount: number;
  description: string;
  headMember?: {
    id: string;
    name: string;
    email: string;
    position: string;
    role: string;
    avatar: string | null;
    isManager: boolean;
    joinDate: string;
    status: string;
  };
  members: {
    id: string;
    name: string;
    email: string;
    position: string;
    role: string;
    avatar: string | null;
    isManager: boolean;
    joinDate: string;
    status: string;
  }[];
  children: OrganizationTreeNode[];
}

// GET /api/organization - 組織構造全体を取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    // テナントの組織管理モードを取得
    const settings = await prisma.tenant_settings.findUnique({
      where: { tenantId },
      select: { organizationMode: true },
    });
    const mode = settings?.organizationMode ?? 'flat';

    // 部門一覧を取得
    const departments = await prisma.departments.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // 組織ユニット一覧を取得（ツリー構造用）
    const orgUnits = await prisma.org_units.findMany({
      where: { tenantId },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    // メンバー情報を取得
    const users = await prisma.users.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        role: true,
        status: true,
        avatar: true,
        hireDate: true,
        department: true,
        departmentId: true,
        unitId: true,
      },
    });

    // モードに応じてツリーを構築
    const organizationTree = mode === 'hierarchy'
      ? buildOrganizationTree(orgUnits, users)
      : buildFlatOrganizationTree(departments, users);

    return successResponse({
      tree: organizationTree,
      departments,
      orgUnits,
      members: users,
      mode,
    });
  } catch (error) {
    return handleApiError(error, '組織構造の取得');
  }
}

// 組織ツリーを構築するヘルパー関数
function buildOrganizationTree(
  orgUnits: { id: string; name: string; type: string; parentId: string | null; level: number; headUserId: string | null; description: string | null }[],
  users: { id: string; name: string; email: string; position: string | null; role: string | null; status: string; avatar: string | null; hireDate: Date | null; department: string | null; unitId: string | null }[]
): OrganizationTreeNode {
  // ユーザーをunitIdでグループ化
  const usersByUnit = new Map<string, typeof users>();
  users.forEach(user => {
    if (user.unitId) {
      const existing = usersByUnit.get(user.unitId) || [];
      existing.push(user);
      usersByUnit.set(user.unitId, existing);
    }
  });

  // ルートノードを作成
  const root: OrganizationTreeNode = {
    id: 'company',
    name: '組織',
    type: 'company',
    level: 0,
    memberCount: users.length,
    description: '',
    members: [],
    children: [],
  };

  // ルートユニット（parentId が null）をトップレベルに追加
  orgUnits
    .filter(unit => !unit.parentId)
    .forEach(unit => {
      root.children.push(buildUnitNode(unit, orgUnits, usersByUnit));
    });

  return root;
}

// フラットモード用: departmentsベースで組織ツリーを構築
function buildFlatOrganizationTree(
  departments: { id: string; name: string; isActive: boolean }[],
  users: { id: string; name: string; email: string; position: string | null; role: string | null; status: string; avatar: string | null; hireDate: Date | null; department: string | null; departmentId: string | null; unitId: string | null }[]
): OrganizationTreeNode {
  const activeDepts = departments.filter(d => d.isActive);

  // ユーザーをdepartmentIdでグループ化
  const usersByDept = new Map<string, typeof users>();
  const unassigned: typeof users = [];

  users.forEach(user => {
    if (user.departmentId) {
      const existing = usersByDept.get(user.departmentId) || [];
      existing.push(user);
      usersByDept.set(user.departmentId, existing);
    } else {
      unassigned.push(user);
    }
  });

  const formatMember = (u: typeof users[0]) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    position: u.position || '',
    role: u.role || 'employee',
    avatar: u.avatar,
    isManager: false,
    joinDate: u.hireDate?.toISOString() || '',
    status: u.status,
  });

  // 各部署をノード化
  const children: OrganizationTreeNode[] = activeDepts.map(dept => {
    const deptMembers = usersByDept.get(dept.id) || [];
    return {
      id: dept.id,
      name: dept.name,
      type: 'department',
      level: 1,
      memberCount: deptMembers.length,
      description: '',
      members: deptMembers.map(formatMember),
      children: [],
    };
  });

  // 未所属ユーザーがいれば「未所属」ノードを追加
  if (unassigned.length > 0) {
    children.push({
      id: 'unassigned',
      name: '未所属',
      type: 'department',
      level: 1,
      memberCount: unassigned.length,
      description: '',
      members: unassigned.map(formatMember),
      children: [],
    });
  }

  return {
    id: 'company',
    name: '組織',
    type: 'company',
    level: 0,
    memberCount: users.length,
    description: '',
    members: [],
    children,
  };
}

function buildUnitNode(
  unit: { id: string; name: string; type: string; parentId: string | null; level: number; headUserId: string | null; description: string | null },
  allUnits: { id: string; name: string; type: string; parentId: string | null; level: number; headUserId: string | null; description: string | null }[],
  usersByUnit: Map<string, { id: string; name: string; email: string; position: string | null; role: string | null; status: string; avatar: string | null; hireDate: Date | null }[]>
): OrganizationTreeNode {
  const unitMembers = usersByUnit.get(unit.id) || [];
  const headMember = unitMembers.find(u => u.id === unit.headUserId);

  const node: OrganizationTreeNode = {
    id: unit.id,
    name: unit.name,
    type: unit.type,
    level: unit.level,
    memberCount: unitMembers.length,
    description: unit.description || '',
    headMember: headMember ? {
      id: headMember.id,
      name: headMember.name,
      email: headMember.email,
      position: headMember.position || '',
      role: headMember.role || 'employee',
      avatar: headMember.avatar,
      isManager: true,
      joinDate: headMember.hireDate?.toISOString() || '',
      status: headMember.status,
    } : undefined,
    members: unitMembers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      position: u.position || '',
      role: u.role || 'employee',
      avatar: u.avatar,
      isManager: u.id === unit.headUserId,
      joinDate: u.hireDate?.toISOString() || '',
      status: u.status,
    })),
    children: [],
  };

  // 子ユニットを追加
  allUnits
    .filter(u => u.parentId === unit.id)
    .forEach(childUnit => {
      node.children.push(buildUnitNode(childUnit, allUnits, usersByUnit));
    });

  return node;
}
