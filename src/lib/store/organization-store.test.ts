/**
 * 組織管理ストアのテスト
 */

import { useOrganizationStore } from './organization-store';
import type { OrganizationNode, OrganizationMember } from '@/types';

// テスト用のTransferHistory型定義（実際の型定義に合わせて更新）
interface TransferHistory {
  id: string;
  userId: string;
  userName: string;
  type: 'transfer' | 'promotion' | 'demotion' | 'role_change';
  fromUnitId: string;
  fromUnitName: string;
  toUnitId: string;
  toUnitName: string;
  fromPosition: string;
  toPosition: string;
  fromRole?: 'employee' | 'manager' | 'hr' | 'admin';
  toRole?: 'employee' | 'manager' | 'hr' | 'admin';
  effectiveDate: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason?: string;
  notes?: string;
  approvedBy?: string;
  approvedByName?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

describe('OrganizationStore', () => {
  beforeEach(() => {
    // 各テスト前にストアとlocalStorageをリセット
    localStorage.clear();
    useOrganizationStore.setState({
      organizationTree: null,
      allMembers: [],
      selectedMember: null,
      selectedNode: null,
      viewMode: 'tree',
      searchQuery: '',
      filters: {
        role: 'all',
        department: 'all',
        status: 'active',
      },
      transferHistories: [],
    });
  });

  describe('addMember', () => {
    it('組織ノードにメンバーを追加できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode, allMembers: [] });

      const newMember: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業部長',
        role: 'manager',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: true,
      };

      useOrganizationStore.getState().addMember('node-1', newMember);

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.members).toHaveLength(1);
      expect(state.organizationTree?.memberCount).toBe(1);
      expect(state.allMembers).toHaveLength(1);
      expect(state.allMembers[0].name).toBe('田中太郎');
    });

    it('複数のメンバーを追加できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode, allMembers: [] });

      const member1: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業部長',
        role: 'manager',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: true,
      };

      const member2: OrganizationMember = {
        id: 'member-2',
        name: '佐藤花子',
        email: 'sato@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-02-01',
        isManager: false,
      };

      useOrganizationStore.getState().addMember('node-1', member1);
      useOrganizationStore.getState().addMember('node-1', member2);

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.members).toHaveLength(2);
      expect(state.organizationTree?.memberCount).toBe(2);
      expect(state.allMembers).toHaveLength(2);
    });

    it('子ノードにメンバーを追加できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [
          {
            id: 'node-2',
            name: '営業部',
            type: 'department',
            parentId: 'node-1',
            level: 1,
            children: [],
            members: [],
            memberCount: 0,
          },
        ],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode, allMembers: [] });

      const newMember: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業部長',
        role: 'manager',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: true,
      };

      useOrganizationStore.getState().addMember('node-2', newMember);

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.children[0].members).toHaveLength(1);
      expect(state.organizationTree?.children[0].memberCount).toBe(1);
      expect(state.allMembers).toHaveLength(1);
    });
  });

  describe('updateMember', () => {
    it('メンバー情報を更新できる', () => {
      const member: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: false,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [member],
        memberCount: 1,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        allMembers: [member],
      });

      useOrganizationStore.getState().updateMember('member-1', {
        position: '営業部長',
        role: 'manager',
        isManager: true,
      });

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.members[0].position).toBe('営業部長');
      expect(state.organizationTree?.members[0].role).toBe('manager');
      expect(state.organizationTree?.members[0].isManager).toBe(true);
      expect(state.allMembers[0].position).toBe('営業部長');
    });

    it('存在しないメンバーを更新しようとしても他のメンバーに影響しない', () => {
      const member: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: false,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [member],
        memberCount: 1,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        allMembers: [member],
      });

      useOrganizationStore.getState().updateMember('non-existent-id', {
        position: '部長',
      });

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.members[0].position).toBe('営業担当');
    });

    it('headMemberも更新される', () => {
      const member: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業部長',
        role: 'manager',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: true,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [member],
        memberCount: 1,
        headMember: member,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        allMembers: [member],
      });

      useOrganizationStore.getState().updateMember('member-1', {
        position: '取締役',
      });

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.headMember?.position).toBe('取締役');
    });
  });

  describe('removeMember', () => {
    it('メンバーを削除できる', () => {
      const member: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: false,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [member],
        memberCount: 1,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        allMembers: [member],
      });

      useOrganizationStore.getState().removeMember('member-1');

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.members).toHaveLength(0);
      expect(state.organizationTree?.memberCount).toBe(0);
      expect(state.allMembers).toHaveLength(0);
    });

    it('複数のメンバーから特定のメンバーだけを削除できる', () => {
      const member1: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: false,
      };

      const member2: OrganizationMember = {
        id: 'member-2',
        name: '佐藤花子',
        email: 'sato@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-02-01',
        isManager: false,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [member1, member2],
        memberCount: 2,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        allMembers: [member1, member2],
      });

      useOrganizationStore.getState().removeMember('member-1');

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.members).toHaveLength(1);
      expect(state.organizationTree?.members[0].id).toBe('member-2');
      expect(state.allMembers).toHaveLength(1);
      expect(state.allMembers[0].id).toBe('member-2');
    });

    it('selectedMemberが削除対象の場合はnullになる', () => {
      const member: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: false,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [member],
        memberCount: 1,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        allMembers: [member],
        selectedMember: member,
      });

      useOrganizationStore.getState().removeMember('member-1');

      const state = useOrganizationStore.getState();
      expect(state.selectedMember).toBeNull();
    });
  });

  describe('moveMember', () => {
    it('メンバーを別のノードに移動できる', () => {
      const member: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: false,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [
          {
            id: 'node-2',
            name: '営業部',
            type: 'department',
            parentId: 'node-1',
            level: 1,
            children: [],
            members: [member],
            memberCount: 1,
          },
          {
            id: 'node-3',
            name: '開発部',
            type: 'department',
            parentId: 'node-1',
            level: 1,
            children: [],
            members: [],
            memberCount: 0,
          },
        ],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        allMembers: [member],
      });

      useOrganizationStore.getState().moveMember('member-1', 'node-3');

      const state = useOrganizationStore.getState();
      // Find node-2 (営業部) - should be empty
      const salesNode = state.organizationTree?.children.find(n => n.id === 'node-2');
      expect(salesNode?.members).toHaveLength(0);

      // Find node-3 (開発部) - should have the member
      const devNode = state.organizationTree?.children.find(n => n.id === 'node-3');
      expect(devNode?.members).toHaveLength(1);
      expect(devNode?.members[0].id).toBe('member-1');
    });
  });

  describe('addNode', () => {
    it('新しいノードを追加できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode });

      const newNode: Omit<OrganizationNode, 'children' | 'members'> = {
        id: 'node-2',
        name: '営業部',
        type: 'department',
        parentId: 'node-1',
        level: 1,
        memberCount: 0,
      };

      useOrganizationStore.getState().addNode('node-1', newNode);

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.children).toHaveLength(1);
      expect(state.organizationTree?.children[0].name).toBe('営業部');
    });

    it('複数のノードを追加できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode });

      const salesNode: Omit<OrganizationNode, 'children' | 'members'> = {
        id: 'node-2',
        name: '営業部',
        type: 'department',
        parentId: 'node-1',
        level: 1,
        memberCount: 0,
      };

      const devNode: Omit<OrganizationNode, 'children' | 'members'> = {
        id: 'node-3',
        name: '開発部',
        type: 'department',
        parentId: 'node-1',
        level: 1,
        memberCount: 0,
      };

      useOrganizationStore.getState().addNode('node-1', salesNode);
      useOrganizationStore.getState().addNode('node-1', devNode);

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.children).toHaveLength(2);
    });
  });

  describe('updateNode', () => {
    it('ノード情報を更新できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [
          {
            id: 'node-2',
            name: '営業部',
            type: 'department',
            parentId: 'node-1',
            level: 1,
            children: [],
            members: [],
            memberCount: 0,
          },
        ],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode });

      useOrganizationStore.getState().updateNode('node-2', {
        name: '営業本部',
        description: '全社の営業活動を統括',
      });

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.children[0].name).toBe('営業本部');
      expect(state.organizationTree?.children[0].description).toBe('全社の営業活動を統括');
    });
  });

  describe('removeNode', () => {
    it('ノードを削除できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [
          {
            id: 'node-2',
            name: '営業部',
            type: 'department',
            parentId: 'node-1',
            level: 1,
            children: [],
            members: [],
            memberCount: 0,
          },
        ],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode });

      useOrganizationStore.getState().removeNode('node-2');

      const state = useOrganizationStore.getState();
      expect(state.organizationTree?.children).toHaveLength(0);
    });

    it('selectedNodeが削除対象の場合はnullになる', () => {
      const childNode: OrganizationNode = {
        id: 'node-2',
        name: '営業部',
        type: 'department',
        parentId: 'node-1',
        level: 1,
        children: [],
        members: [],
        memberCount: 0,
      };

      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [childNode],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({
        organizationTree: rootNode,
        selectedNode: childNode,
      });

      useOrganizationStore.getState().removeNode('node-2');

      const state = useOrganizationStore.getState();
      expect(state.selectedNode).toBeNull();
    });
  });

  describe('findMember', () => {
    it('IDでメンバーを取得できる', () => {
      const member: OrganizationMember = {
        id: 'member-1',
        name: '田中太郎',
        email: 'tanaka@example.com',
        position: '営業担当',
        role: 'employee',
        avatar: '',
        status: 'active',
        joinDate: '2024-01-01',
        isManager: false,
      };

      useOrganizationStore.setState({ allMembers: [member] });

      const found = useOrganizationStore.getState().findMember('member-1');
      expect(found).toBeDefined();
      expect(found?.name).toBe('田中太郎');
    });

    it('存在しないIDの場合はnullを返す', () => {
      const found = useOrganizationStore.getState().findMember('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findNode', () => {
    it('IDでノードを取得できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [
          {
            id: 'node-2',
            name: '営業部',
            type: 'department',
            parentId: 'node-1',
            level: 1,
            children: [],
            members: [],
            memberCount: 0,
          },
        ],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.setState({ organizationTree: rootNode });

      const found = useOrganizationStore.getState().findNode('node-2');
      expect(found).toBeDefined();
      expect(found?.name).toBe('営業部');
    });

    it('存在しないIDの場合はnullを返す', () => {
      const found = useOrganizationStore.getState().findNode('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('getFilteredMembers', () => {
    beforeEach(() => {
      const members: OrganizationMember[] = [
        {
          id: 'member-1',
          name: '田中太郎',
          email: 'tanaka@example.com',
          position: '営業部長',
          role: 'manager',
          avatar: '',
          status: 'active',
          joinDate: '2024-01-01',
          isManager: true,
        },
        {
          id: 'member-2',
          name: '佐藤花子',
          email: 'sato@example.com',
          position: '開発部長',
          role: 'hr',
          avatar: '',
          status: 'active',
          joinDate: '2024-02-01',
          isManager: true,
        },
        {
          id: 'member-3',
          name: '鈴木一郎',
          email: 'suzuki@example.com',
          position: '営業担当',
          role: 'employee',
          avatar: '',
          status: 'inactive',
          joinDate: '2024-03-01',
          isManager: false,
        },
      ];

      useOrganizationStore.setState({ allMembers: members });
    });

    it('検索クエリでメンバーを絞り込める', () => {
      useOrganizationStore.getState().setSearchQuery('田中');

      const filtered = useOrganizationStore.getState().getFilteredMembers();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('田中太郎');
    });

    it('ロールでメンバーを絞り込める', () => {
      useOrganizationStore.getState().setFilters({ role: 'manager' });

      const filtered = useOrganizationStore.getState().getFilteredMembers();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].role).toBe('manager');
    });

    it('ステータスでメンバーを絞り込める', () => {
      useOrganizationStore.getState().setFilters({ status: 'active' });

      const filtered = useOrganizationStore.getState().getFilteredMembers();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(m => m.status === 'active')).toBe(true);
    });

    it('複数の条件で絞り込める', () => {
      useOrganizationStore.getState().setSearchQuery('営業');
      useOrganizationStore.getState().setFilters({ status: 'active' });

      const filtered = useOrganizationStore.getState().getFilteredMembers();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('田中太郎');
    });
  });

  describe('addTransferHistory', () => {
    it('異動履歴を追加できる', () => {
      const transfer: TransferHistory = {
        id: 'transfer-1',
        userId: 'user-001',
        userName: '田中太郎',
        type: 'transfer',
        fromUnitId: 'node-1',
        fromUnitName: '営業部',
        toUnitId: 'node-2',
        toUnitName: '開発部',
        fromPosition: '営業担当',
        toPosition: 'エンジニア',
        effectiveDate: '2024-04-01',
        status: 'completed',
        reason: '組織再編による配置転換',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      useOrganizationStore.getState().addTransferHistory(transfer);

      const state = useOrganizationStore.getState();
      expect(state.transferHistories).toHaveLength(1);
      expect(state.transferHistories[0].userName).toBe('田中太郎');
    });

    it('複数の異動履歴を追加できる', () => {
      const transfer1: TransferHistory = {
        id: 'transfer-1',
        userId: 'user-001',
        userName: '田中太郎',
        type: 'transfer',
        fromUnitId: 'node-1',
        fromUnitName: '営業部',
        toUnitId: 'node-2',
        toUnitName: '開発部',
        fromPosition: '営業担当',
        toPosition: 'エンジニア',
        effectiveDate: '2024-04-01',
        status: 'completed',
        reason: '組織再編',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      const transfer2: TransferHistory = {
        id: 'transfer-2',
        userId: 'user-002',
        userName: '佐藤花子',
        type: 'transfer',
        fromUnitId: 'node-2',
        fromUnitName: '開発部',
        toUnitId: 'node-3',
        toUnitName: '人事部',
        fromPosition: 'エンジニア',
        toPosition: '人事担当',
        effectiveDate: '2024-05-01',
        status: 'completed',
        reason: 'キャリアアップ',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      useOrganizationStore.getState().addTransferHistory(transfer1);
      useOrganizationStore.getState().addTransferHistory(transfer2);

      const state = useOrganizationStore.getState();
      expect(state.transferHistories).toHaveLength(2);
    });
  });

  describe('getTransferHistoriesByUser', () => {
    it('ユーザーIDで異動履歴を取得できる', () => {
      const transfer1: TransferHistory = {
        id: 'transfer-1',
        userId: 'user-001',
        userName: '田中太郎',
        type: 'transfer',
        fromUnitId: 'node-1',
        fromUnitName: '営業部',
        toUnitId: 'node-2',
        toUnitName: '開発部',
        fromPosition: '営業担当',
        toPosition: 'エンジニア',
        effectiveDate: '2024-04-01',
        status: 'completed',
        reason: '組織再編',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      const transfer2: TransferHistory = {
        id: 'transfer-2',
        userId: 'user-001',
        userName: '田中太郎',
        type: 'promotion',
        fromUnitId: 'node-2',
        fromUnitName: '開発部',
        toUnitId: 'node-3',
        toUnitName: '人事部',
        fromPosition: 'エンジニア',
        toPosition: 'シニアエンジニア',
        effectiveDate: '2024-06-01',
        status: 'completed',
        reason: 'キャリアアップ',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      useOrganizationStore.setState({ transferHistories: [transfer1, transfer2] });

      const histories = useOrganizationStore
        .getState()
        .getTransferHistoriesByUser('user-001');
      expect(histories).toHaveLength(2);
      expect(histories.every(h => h.userId === 'user-001')).toBe(true);
    });

    it('日付の新しい順にソートされる', () => {
      const transfer1: TransferHistory = {
        id: 'transfer-1',
        userId: 'user-001',
        userName: '田中太郎',
        type: 'transfer',
        fromUnitId: 'node-1',
        fromUnitName: '営業部',
        toUnitId: 'node-2',
        toUnitName: '開発部',
        fromPosition: '営業担当',
        toPosition: 'エンジニア',
        effectiveDate: '2024-04-01',
        status: 'completed',
        reason: '組織再編',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      const transfer2: TransferHistory = {
        id: 'transfer-2',
        userId: 'user-001',
        userName: '田中太郎',
        type: 'promotion',
        fromUnitId: 'node-2',
        fromUnitName: '開発部',
        toUnitId: 'node-3',
        toUnitName: '人事部',
        fromPosition: 'エンジニア',
        toPosition: 'シニアエンジニア',
        effectiveDate: '2024-06-01',
        status: 'completed',
        reason: 'キャリアアップ',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      useOrganizationStore.setState({ transferHistories: [transfer1, transfer2] });

      const histories = useOrganizationStore
        .getState()
        .getTransferHistoriesByUser('user-001');
      expect(histories[0].effectiveDate).toBe('2024-06-01');
      expect(histories[1].effectiveDate).toBe('2024-04-01');
    });
  });

  describe('getTransferHistoriesByUnit', () => {
    it('組織IDで異動履歴を取得できる', () => {
      const transfer1: TransferHistory = {
        id: 'transfer-1',
        userId: 'user-001',
        userName: '田中太郎',
        type: 'transfer',
        fromUnitId: 'node-1',
        fromUnitName: '営業部',
        toUnitId: 'node-2',
        toUnitName: '開発部',
        fromPosition: '営業担当',
        toPosition: 'エンジニア',
        effectiveDate: '2024-04-01',
        status: 'completed',
        reason: '組織再編',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      const transfer2: TransferHistory = {
        id: 'transfer-2',
        userId: 'user-002',
        userName: '佐藤花子',
        type: 'transfer',
        fromUnitId: 'node-2',
        fromUnitName: '開発部',
        toUnitId: 'node-3',
        toUnitName: '人事部',
        fromPosition: 'エンジニア',
        toPosition: '人事担当',
        effectiveDate: '2024-05-01',
        status: 'completed',
        reason: 'キャリアアップ',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      };

      useOrganizationStore.setState({ transferHistories: [transfer1, transfer2] });

      const histories = useOrganizationStore
        .getState()
        .getTransferHistoriesByUnit('node-2');
      expect(histories).toHaveLength(2);
      expect(histories.some(h => h.fromUnitId === 'node-2')).toBe(true);
      expect(histories.some(h => h.toUnitId === 'node-2')).toBe(true);
    });
  });

  describe('getRecentTransfers', () => {
    it('最近の異動履歴を取得できる', () => {
      const transfers: TransferHistory[] = Array.from({ length: 15 }, (_, i) => ({
        id: `transfer-${i + 1}`,
        userId: `user-${String(i + 1).padStart(3, '0')}`,
        userName: `ユーザー${i + 1}`,
        type: 'transfer' as const,
        fromUnitId: 'node-1',
        fromUnitName: '営業部',
        toUnitId: 'node-2',
        toUnitName: '開発部',
        fromPosition: '営業担当',
        toPosition: 'エンジニア',
        effectiveDate: `2024-${String(i + 1).padStart(2, '0')}-01`,
        status: 'completed' as const,
        reason: '組織再編',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      }));

      useOrganizationStore.setState({ transferHistories: transfers });

      const recent = useOrganizationStore.getState().getRecentTransfers(10);
      expect(recent).toHaveLength(10);
    });

    it('デフォルトで10件取得する', () => {
      const transfers: TransferHistory[] = Array.from({ length: 15 }, (_, i) => ({
        id: `transfer-${i + 1}`,
        userId: `user-${String(i + 1).padStart(3, '0')}`,
        userName: `ユーザー${i + 1}`,
        type: 'transfer' as const,
        fromUnitId: 'node-1',
        fromUnitName: '営業部',
        toUnitId: 'node-2',
        toUnitName: '開発部',
        fromPosition: '営業担当',
        toPosition: 'エンジニア',
        effectiveDate: `2024-${String(i + 1).padStart(2, '0')}-01`,
        status: 'completed' as const,
        reason: '組織再編',
        createdAt: new Date().toISOString(),
        createdBy: 'admin-001',
        createdByName: '管理者',
      }));

      useOrganizationStore.setState({ transferHistories: transfers });

      const recent = useOrganizationStore.getState().getRecentTransfers();
      expect(recent).toHaveLength(10);
    });
  });

  describe('setters', () => {
    it('setOrganizationTreeで組織ツリーを設定できる', () => {
      const rootNode: OrganizationNode = {
        id: 'node-1',
        name: '本社',
        type: 'company',
        parentId: undefined,
        level: 0,
        children: [],
        members: [],
        memberCount: 0,
      };

      useOrganizationStore.getState().setOrganizationTree(rootNode);

      const state = useOrganizationStore.getState();
      expect(state.organizationTree).toBeDefined();
      expect(state.organizationTree?.name).toBe('本社');
    });

    it('setViewModeで表示モードを切り替えられる', () => {
      useOrganizationStore.getState().setViewMode('list');

      const state = useOrganizationStore.getState();
      expect(state.viewMode).toBe('list');
    });

    it('setSearchQueryで検索クエリを設定できる', () => {
      useOrganizationStore.getState().setSearchQuery('田中');

      const state = useOrganizationStore.getState();
      expect(state.searchQuery).toBe('田中');
    });

    it('setFiltersでフィルターを設定できる', () => {
      useOrganizationStore.getState().setFilters({
        role: 'manager',
        status: 'inactive',
      });

      const state = useOrganizationStore.getState();
      expect(state.filters.role).toBe('manager');
      expect(state.filters.status).toBe('inactive');
    });
  });
});
