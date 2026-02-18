/**
 * User ストアのテスト
 */

import { useUserStore } from './user-store';
import type { User } from '@/types';

describe('UserStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useUserStore.setState({
      users: [],
      isLoading: false,
      error: null,
    });
  });

  describe('addUser', () => {
    it('新しいユーザーを追加できる', () => {
      const { addUser } = useUserStore.getState();

      const newUser: User = {
        id: 'test-1',
        name: 'テストユーザー',
        email: 'test@example.com',
        phone: '090-1234-5678',
        hireDate: '2024-01-01',
        unitId: '1',
        roles: ['employee'],
        status: 'active',
        timezone: 'Asia/Tokyo',
        avatar: '',
        position: 'スタッフ',
        department: 'テスト部門',
      };

      addUser(newUser);

      const { users } = useUserStore.getState();
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('テストユーザー');
    });

    it('複数のユーザーを順次追加できる', () => {
      const { addUser } = useUserStore.getState();

      const user1: User = {
        id: 'test-1',
        name: 'ユーザー1',
        email: 'user1@example.com',
        phone: '090-1111-1111',
        hireDate: '2024-01-01',
        unitId: '1',
        roles: ['employee'],
        status: 'active',
        timezone: 'Asia/Tokyo',
        avatar: '',
        position: 'スタッフ',
        department: '部門A',
      };

      const user2: User = {
        id: 'test-2',
        name: 'ユーザー2',
        email: 'user2@example.com',
        phone: '090-2222-2222',
        hireDate: '2024-01-02',
        unitId: '2',
        roles: ['manager'],
        status: 'active',
        timezone: 'Asia/Tokyo',
        avatar: '',
        position: 'マネージャー',
        department: '部門B',
      };

      addUser(user1);
      addUser(user2);

      const { users } = useUserStore.getState();
      expect(users).toHaveLength(2);
      expect(users[0].id).toBe('test-1');
      expect(users[1].id).toBe('test-2');
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      const { addUser } = useUserStore.getState();

      const user: User = {
        id: 'test-1',
        name: '元の名前',
        email: 'original@example.com',
        phone: '090-1234-5678',
        hireDate: '2024-01-01',
        unitId: '1',
        roles: ['employee'],
        status: 'active',
        timezone: 'Asia/Tokyo',
        avatar: '',
        position: 'スタッフ',
        department: 'テスト部門',
      };

      addUser(user);
    });

    it('既存ユーザーを更新できる', () => {
      const { updateUser } = useUserStore.getState();

      updateUser('test-1', {
        name: '更新後の名前',
        position: 'リーダー',
      });

      const { users } = useUserStore.getState();
      expect(users[0].name).toBe('更新後の名前');
      expect(users[0].position).toBe('リーダー');
      expect(users[0].email).toBe('original@example.com'); // 他のフィールドは変わらない
    });

    it('currentUserも同期して更新される', () => {
      const { updateUser } = useUserStore.getState();

      // currentUserを設定
      useUserStore.setState({
        currentUser: useUserStore.getState().users[0],
      });

      updateUser('test-1', {
        name: 'currentUser更新',
      });

      const { currentUser } = useUserStore.getState();
      expect(currentUser?.name).toBe('currentUser更新');
    });

    it('存在しないIDでは更新されない', () => {
      const { updateUser } = useUserStore.getState();

      updateUser('non-existent', {
        name: '存在しない',
      });

      const { users } = useUserStore.getState();
      expect(users[0].name).toBe('元の名前');
    });
  });

  describe('removeUser', () => {
    beforeEach(() => {
      const { addUser } = useUserStore.getState();

      const users: User[] = [
        {
          id: 'test-1',
          name: 'ユーザー1',
          email: 'user1@example.com',
          phone: '090-1111-1111',
          hireDate: '2024-01-01',
          unitId: '1',
          roles: ['employee'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
        },
        {
          id: 'test-2',
          name: 'ユーザー2',
          email: 'user2@example.com',
          phone: '090-2222-2222',
          hireDate: '2024-01-02',
          unitId: '2',
          roles: ['manager'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'マネージャー',
          department: '部門B',
        },
      ];

      users.forEach((u) => addUser(u));
    });

    it('ユーザーを削除できる', () => {
      const { removeUser } = useUserStore.getState();

      expect(useUserStore.getState().users).toHaveLength(2);

      removeUser('test-1');

      const { users } = useUserStore.getState();
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('test-2');
    });

    it('currentUserを削除するとnullになる', () => {
      const { removeUser } = useUserStore.getState();

      // currentUserを設定
      useUserStore.setState({
        currentUser: useUserStore.getState().users[0],
      });

      removeUser('test-1');

      const { currentUser } = useUserStore.getState();
      expect(currentUser).toBeNull();
    });
  });

  describe('retireUser', () => {
    beforeEach(() => {
      const { addUser } = useUserStore.getState();

      const user: User = {
        id: 'test-1',
        name: '退職予定ユーザー',
        email: 'retire@example.com',
        phone: '090-1234-5678',
        hireDate: '2020-04-01',
        unitId: '1',
        roles: ['employee'],
        status: 'active',
        timezone: 'Asia/Tokyo',
        avatar: '',
        position: 'スタッフ',
        department: 'テスト部門',
      };

      addUser(user);
    });

    it('ユーザーを退職状態にできる', () => {
      const { retireUser } = useUserStore.getState();

      retireUser('test-1', '2024-03-31', 'voluntary');

      const { users } = useUserStore.getState();
      expect(users[0].status).toBe('retired');
      expect(users[0].retiredDate).toBe('2024-03-31');
      expect(users[0].retirementReason).toBe('voluntary');
    });

    it('退職理由を指定できる', () => {
      const { retireUser } = useUserStore.getState();

      retireUser('test-1', '2024-06-30', 'retirement_age');

      const { users } = useUserStore.getState();
      expect(users[0].retirementReason).toBe('retirement_age');
    });

    it('currentUserも退職状態に更新される', () => {
      const { retireUser } = useUserStore.getState();

      // currentUserを設定
      useUserStore.setState({
        currentUser: useUserStore.getState().users[0],
      });

      retireUser('test-1', '2024-03-31', 'company');

      const { currentUser } = useUserStore.getState();
      expect(currentUser?.status).toBe('retired');
      expect(currentUser?.retiredDate).toBe('2024-03-31');
    });
  });

  describe('getUserById', () => {
    beforeEach(() => {
      const { addUser } = useUserStore.getState();

      const users: User[] = [
        {
          id: 'test-1',
          name: 'ユーザー1',
          email: 'user1@example.com',
          phone: '090-1111-1111',
          hireDate: '2024-01-01',
          unitId: '1',
          roles: ['employee'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
        },
        {
          id: 'test-2',
          name: 'ユーザー2',
          email: 'user2@example.com',
          phone: '090-2222-2222',
          hireDate: '2024-01-02',
          unitId: '2',
          roles: ['manager'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'マネージャー',
          department: '部門B',
        },
      ];

      users.forEach((u) => addUser(u));
    });

    it('IDでユーザーを取得できる', () => {
      const { getUserById } = useUserStore.getState();

      const user = getUserById('test-1');

      expect(user).toBeDefined();
      expect(user?.name).toBe('ユーザー1');
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const { getUserById } = useUserStore.getState();

      const user = getUserById('non-existent');

      expect(user).toBeUndefined();
    });
  });

  describe('getUsersByUnit', () => {
    beforeEach(() => {
      const { addUser } = useUserStore.getState();

      const users: User[] = [
        {
          id: 'test-1',
          name: 'ユニット1のユーザーA',
          email: 'user1a@example.com',
          phone: '090-1111-1111',
          hireDate: '2024-01-01',
          unitId: '1',
          roles: ['employee'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
        },
        {
          id: 'test-2',
          name: 'ユニット1のユーザーB',
          email: 'user1b@example.com',
          phone: '090-1112-1111',
          hireDate: '2024-01-02',
          unitId: '1',
          roles: ['employee'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
        },
        {
          id: 'test-3',
          name: 'ユニット2のユーザー',
          email: 'user2@example.com',
          phone: '090-2222-2222',
          hireDate: '2024-01-03',
          unitId: '2',
          roles: ['manager'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'マネージャー',
          department: '部門B',
        },
      ];

      users.forEach((u) => addUser(u));
    });

    it('ユニットIDでユーザーをフィルタリングできる', () => {
      const { getUsersByUnit } = useUserStore.getState();

      const unit1Users = getUsersByUnit('1');

      expect(unit1Users).toHaveLength(2);
      expect(unit1Users.every((u) => u.unitId === '1')).toBe(true);
    });

    it('該当するユニットがない場合は空配列を返す', () => {
      const { getUsersByUnit } = useUserStore.getState();

      const noUsers = getUsersByUnit('999');

      expect(noUsers).toHaveLength(0);
    });
  });

  describe('getActiveUsers', () => {
    beforeEach(() => {
      const { addUser } = useUserStore.getState();

      const users: User[] = [
        {
          id: 'test-1',
          name: '有効ユーザー1',
          email: 'active1@example.com',
          phone: '090-1111-1111',
          hireDate: '2024-01-01',
          unitId: '1',
          roles: ['employee'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
        },
        {
          id: 'test-2',
          name: '退職ユーザー',
          email: 'retired@example.com',
          phone: '090-2222-2222',
          hireDate: '2020-04-01',
          unitId: '1',
          roles: ['employee'],
          status: 'retired',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
          retiredDate: '2024-03-31',
          retirementReason: 'voluntary',
        },
        {
          id: 'test-3',
          name: '有効ユーザー2',
          email: 'active2@example.com',
          phone: '090-3333-3333',
          hireDate: '2024-01-02',
          unitId: '2',
          roles: ['manager'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'マネージャー',
          department: '部門B',
        },
      ];

      users.forEach((u) => addUser(u));
    });

    it('有効ユーザーのみ取得できる', () => {
      const { getActiveUsers } = useUserStore.getState();

      const activeUsers = getActiveUsers();

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.every((u) => u.status === 'active')).toBe(true);
    });
  });

  describe('getRetiredUsers', () => {
    beforeEach(() => {
      const { addUser } = useUserStore.getState();

      const users: User[] = [
        {
          id: 'test-1',
          name: '有効ユーザー',
          email: 'active@example.com',
          phone: '090-1111-1111',
          hireDate: '2024-01-01',
          unitId: '1',
          roles: ['employee'],
          status: 'active',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
        },
        {
          id: 'test-2',
          name: '退職ユーザー1',
          email: 'retired1@example.com',
          phone: '090-2222-2222',
          hireDate: '2020-04-01',
          unitId: '1',
          roles: ['employee'],
          status: 'retired',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門A',
          retiredDate: '2024-03-31',
          retirementReason: 'voluntary',
        },
        {
          id: 'test-3',
          name: '退職ユーザー2',
          email: 'retired2@example.com',
          phone: '090-3333-3333',
          hireDate: '2019-04-01',
          unitId: '2',
          roles: ['employee'],
          status: 'retired',
          timezone: 'Asia/Tokyo',
          avatar: '',
          position: 'スタッフ',
          department: '部門B',
          retiredDate: '2023-12-31',
          retirementReason: 'retirement_age',
        },
      ];

      users.forEach((u) => addUser(u));
    });

    it('退職ユーザーのみ取得できる', () => {
      const { getRetiredUsers } = useUserStore.getState();

      const retiredUsers = getRetiredUsers();

      expect(retiredUsers).toHaveLength(2);
      expect(retiredUsers.every((u) => u.status === 'retired')).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('ローディング状態を設定できる', () => {
      const { setLoading } = useUserStore.getState();

      expect(useUserStore.getState().isLoading).toBe(false);

      setLoading(true);

      expect(useUserStore.getState().isLoading).toBe(true);

      setLoading(false);

      expect(useUserStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('エラーメッセージを設定できる', () => {
      const { setError } = useUserStore.getState();

      expect(useUserStore.getState().error).toBeNull();

      setError('エラーが発生しました');

      expect(useUserStore.getState().error).toBe('エラーが発生しました');

      setError(null);

      expect(useUserStore.getState().error).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('currentUserとaccessTokenがある場合はtrueを返す', () => {
      const { isAuthenticated } = useUserStore.getState();

      const user: User = {
        id: 'test-1',
        name: 'テストユーザー',
        email: 'test@example.com',
        phone: '090-1234-5678',
        hireDate: '2024-01-01',
        unitId: '1',
        roles: ['employee'],
        status: 'active',
        timezone: 'Asia/Tokyo',
        avatar: '',
        position: 'スタッフ',
        department: 'テスト部門',
      };

      useUserStore.setState({
        currentUser: user,
        accessToken: 'test-token',
      });

      expect(isAuthenticated()).toBe(true);
    });

    it('currentUserまたはaccessTokenがない場合はfalseを返す', () => {
      const { isAuthenticated } = useUserStore.getState();

      useUserStore.setState({
        currentUser: null,
        accessToken: null,
      });

      expect(isAuthenticated()).toBe(false);
    });
  });
});
