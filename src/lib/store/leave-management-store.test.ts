/**
 * Leave Management ストアのテスト
 */

import { useLeaveManagementStore } from './leave-management-store';
import type { LeaveRequest, LeaveBalance } from './leave-management-store';

describe('LeaveManagementStore', () => {
  // 現在の年度を使用
  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    // 各テスト前にストアをリセット
    useLeaveManagementStore.setState({
      requests: [],
      balances: new Map(),
    });
  });

  describe('createLeaveRequest', () => {
    it('新しい休暇申請を作成できる', () => {
      const { createLeaveRequest, getUserRequests } = useLeaveManagementStore.getState();

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'リフレッシュ休暇',
        status: 'pending',
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^leave-/);

      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(1);
      expect(requests[0].userId).toBe('user-1');
      expect(requests[0].type).toBe('paid');
      expect(requests[0].days).toBe(3);
      expect(requests[0].status).toBe('pending');
    });

    it('承認済みで作成すると休暇残数が更新される', () => {
      const { createLeaveRequest, initializeLeaveBalance, getLeaveBalance } =
        useLeaveManagementStore.getState();

      // 残数を初期化
      initializeLeaveBalance('user-1', currentYear, 20);

      // 承認済みで申請を作成
      createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'リフレッシュ休暇',
        status: 'approved',
      });

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.used).toBe(3);
      expect(balance?.paidLeave.remaining).toBe(17);
    });
  });

  describe('updateLeaveRequest', () => {
    it('休暇申請を更新できる', () => {
      const { createLeaveRequest, updateLeaveRequest, getUserRequests } =
        useLeaveManagementStore.getState();

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: '個人的な用事',
        status: 'draft',
      });

      updateLeaveRequest(id, {
        reason: 'リフレッシュ休暇',
        status: 'pending',
      });

      const requests = getUserRequests('user-1');
      expect(requests[0].reason).toBe('リフレッシュ休暇');
      expect(requests[0].status).toBe('pending');
    });
  });

  describe('approveLeaveRequest', () => {
    it('休暇申請を承認できる', () => {
      const { createLeaveRequest, approveLeaveRequest, getUserRequests, initializeLeaveBalance } =
        useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear, 20);

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'リフレッシュ休暇',
        status: 'pending',
      });

      approveLeaveRequest(id, 'manager-1');

      const requests = getUserRequests('user-1');
      expect(requests[0].status).toBe('approved');
      expect(requests[0].approver).toBe('manager-1');
      expect(requests[0].approvedDate).toBeDefined();
    });

    it('承認時に休暇残数が更新される', () => {
      const {
        createLeaveRequest,
        approveLeaveRequest,
        initializeLeaveBalance,
        getLeaveBalance,
      } = useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear, 20);

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'リフレッシュ休暇',
        status: 'pending',
      });

      approveLeaveRequest(id, 'manager-1');

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.used).toBe(3);
      expect(balance?.paidLeave.remaining).toBe(17);
    });
  });

  describe('rejectLeaveRequest', () => {
    it('休暇申請を却下できる', () => {
      const { createLeaveRequest, rejectLeaveRequest, getUserRequests } =
        useLeaveManagementStore.getState();

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'リフレッシュ休暇',
        status: 'pending',
      });

      rejectLeaveRequest(id, 'manager-1', '業務都合により承認できません');

      const requests = getUserRequests('user-1');
      expect(requests[0].status).toBe('rejected');
      expect(requests[0].approver).toBe('manager-1');
      expect(requests[0].rejectedReason).toBe('業務都合により承認できません');
    });
  });

  describe('cancelLeaveRequest', () => {
    it('下書き申請をキャンセルできる', () => {
      const { createLeaveRequest, cancelLeaveRequest, getUserRequests } =
        useLeaveManagementStore.getState();

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'リフレッシュ休暇',
        status: 'draft',
      });

      cancelLeaveRequest(id);

      const requests = getUserRequests('user-1');
      expect(requests[0].status).toBe('cancelled');
    });

    it('承認済み申請をキャンセルすると休暇残数が戻る', () => {
      const {
        createLeaveRequest,
        approveLeaveRequest,
        cancelLeaveRequest,
        initializeLeaveBalance,
        getLeaveBalance,
      } = useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear, 20);

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'リフレッシュ休暇',
        status: 'pending',
      });

      approveLeaveRequest(id, 'manager-1');

      // 残数が減っていることを確認
      let balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.used).toBe(3);
      expect(balance?.paidLeave.remaining).toBe(17);

      // キャンセル
      cancelLeaveRequest(id);

      // 残数が戻ることを確認
      balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.used).toBe(0);
      expect(balance?.paidLeave.remaining).toBe(20);
    });
  });

  describe('getUserRequests', () => {
    it('ユーザーの休暇申請一覧を取得できる', () => {
      const { createLeaveRequest, getUserRequests } = useLeaveManagementStore.getState();

      // user-1の申請を3件作成
      createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        days: 1,
        reason: 'テスト1',
        status: 'pending',
      });

      createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'sick',
        startDate: '2024-06-01',
        endDate: '2024-06-01',
        days: 1,
        reason: 'テスト2',
        status: 'approved',
      });

      // user-2の申請を1件作成
      createLeaveRequest({
        userId: 'user-2',
        userName: 'ユーザー2',
        type: 'paid',
        startDate: '2024-05-15',
        endDate: '2024-05-15',
        days: 1,
        reason: 'テスト3',
        status: 'pending',
      });

      const user1Requests = getUserRequests('user-1');
      expect(user1Requests).toHaveLength(2);
      expect(user1Requests.every(r => r.userId === 'user-1')).toBe(true);

      const user2Requests = getUserRequests('user-2');
      expect(user2Requests).toHaveLength(1);
      expect(user2Requests[0].userId).toBe('user-2');
    });

    it('作成日時の降順でソートされる', () => {
      const { createLeaveRequest, getUserRequests } = useLeaveManagementStore.getState();

      // 時間差を作るため順番に作成
      const id1 = createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        days: 1,
        reason: '最初',
        status: 'pending',
      });

      // 時間差を確保するために少し待つ
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // 10ミリ秒待機
      }

      const id2 = createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-06-01',
        endDate: '2024-06-01',
        days: 1,
        reason: '2番目',
        status: 'pending',
      });

      const requests = getUserRequests('user-1');
      // 最新が最初に来る（降順）
      expect(requests[0].id).toBe(id2);
      expect(requests[1].id).toBe(id1);
    });
  });

  describe('getPendingRequests', () => {
    it('承認待ちの申請のみを取得できる', () => {
      const { createLeaveRequest, getPendingRequests } = useLeaveManagementStore.getState();

      createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        days: 1,
        reason: 'pending申請',
        status: 'pending',
      });

      createLeaveRequest({
        userId: 'user-2',
        userName: 'ユーザー2',
        type: 'paid',
        startDate: '2024-05-02',
        endDate: '2024-05-02',
        days: 1,
        reason: 'approved申請',
        status: 'approved',
      });

      createLeaveRequest({
        userId: 'user-3',
        userName: 'ユーザー3',
        type: 'paid',
        startDate: '2024-05-03',
        endDate: '2024-05-03',
        days: 1,
        reason: 'draft申請',
        status: 'draft',
      });

      const pendingRequests = getPendingRequests();
      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].status).toBe('pending');
      expect(pendingRequests[0].reason).toBe('pending申請');
    });
  });

  describe('getRequestsByPeriod', () => {
    it('期間を指定して申請を取得できる', () => {
      const { createLeaveRequest, getRequestsByPeriod } = useLeaveManagementStore.getState();

      createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-04-30',
        endDate: '2024-04-30',
        days: 1,
        reason: '期間外1',
        status: 'pending',
      });

      createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        days: 1,
        reason: '期間内1',
        status: 'pending',
      });

      createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-05-15',
        endDate: '2024-05-15',
        days: 1,
        reason: '期間内2',
        status: 'pending',
      });

      createLeaveRequest({
        userId: 'user-1',
        userName: 'ユーザー1',
        type: 'paid',
        startDate: '2024-06-01',
        endDate: '2024-06-01',
        days: 1,
        reason: '期間外2',
        status: 'pending',
      });

      const requests = getRequestsByPeriod('2024-05-01', '2024-05-31');
      expect(requests).toHaveLength(2);
      expect(requests.every(r => r.startDate >= '2024-05-01' && r.startDate <= '2024-05-31')).toBe(true);
    });
  });

  describe('initializeLeaveBalance', () => {
    it('休暇残数を初期化できる', () => {
      const { initializeLeaveBalance, getLeaveBalance } = useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear, 20);

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance).toBeDefined();
      expect(balance?.userId).toBe('user-1');
      expect(balance?.year).toBe(currentYear);
      expect(balance?.paidLeave.total).toBe(20);
      expect(balance?.paidLeave.used).toBe(0);
      expect(balance?.paidLeave.remaining).toBe(20);
      expect(balance?.paidLeave.expiry).toBeDefined();
    });

    it('異なる種類の休暇が初期化される', () => {
      const { initializeLeaveBalance, getLeaveBalance } = useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear);

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.sickLeave.total).toBe(5);
      expect(balance?.specialLeave.total).toBe(5);
      expect(balance?.compensatoryLeave.total).toBe(0);
    });
  });

  describe('updateLeaveUsage', () => {
    it('有給休暇の使用を更新できる', () => {
      const { initializeLeaveBalance, updateLeaveUsage, getLeaveBalance } =
        useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear, 20);

      updateLeaveUsage('user-1', 'paid', 3);

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.used).toBe(3);
      expect(balance?.paidLeave.remaining).toBe(17);
    });

    it('病気休暇の使用を更新できる', () => {
      const { initializeLeaveBalance, updateLeaveUsage, getLeaveBalance } =
        useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear);

      updateLeaveUsage('user-1', 'sick', 2);

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.sickLeave.used).toBe(2);
      expect(balance?.sickLeave.remaining).toBe(3);
    });

    it('特別休暇の使用を更新できる', () => {
      const { initializeLeaveBalance, updateLeaveUsage, getLeaveBalance } =
        useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear);

      updateLeaveUsage('user-1', 'special', 1);

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.specialLeave.used).toBe(1);
      expect(balance?.specialLeave.remaining).toBe(4);
    });
  });

  describe('resetYearlyBalance', () => {
    it('年度更新で有給休暇を繰り越せる', () => {
      const { initializeLeaveBalance, resetYearlyBalance, getLeaveBalance } =
        useLeaveManagementStore.getState();

      const prevYear = currentYear - 1;

      // 前年度の残数を初期化
      initializeLeaveBalance('user-1', prevYear, 20);

      // 前年度の使用済みを直接設定（5日使用）
      const balancePrevYear = getLeaveBalance('user-1', prevYear);
      if (balancePrevYear) {
        balancePrevYear.paidLeave.used = 5;
        balancePrevYear.paidLeave.remaining = 15;
        const newBalances = new Map(useLeaveManagementStore.getState().balances);
        newBalances.set(`user-1-${prevYear}`, balancePrevYear);
        useLeaveManagementStore.setState({ balances: newBalances });
      }

      // 前年度は15日残っている
      const verifyBalancePrevYear = getLeaveBalance('user-1', prevYear);
      expect(verifyBalancePrevYear?.paidLeave.remaining).toBe(15);

      // currentYear年度に更新
      resetYearlyBalance('user-1', currentYear);

      // currentYear年度は 20(新規付与) + 15(繰越) = 35日
      const balanceCurrentYear = getLeaveBalance('user-1', currentYear);
      expect(balanceCurrentYear?.paidLeave.total).toBe(35);
      expect(balanceCurrentYear?.paidLeave.remaining).toBe(35);
    });

    it('繰越は最大20日まで', () => {
      const { initializeLeaveBalance, resetYearlyBalance, getLeaveBalance } =
        useLeaveManagementStore.getState();

      const prevYear = currentYear - 1;

      // 前年度の残数を初期化（20日すべて残っている状態）
      initializeLeaveBalance('user-1', prevYear, 20);

      // currentYear年度に更新
      resetYearlyBalance('user-1', currentYear);

      // currentYear年度は 20(新規付与) + 20(繰越上限) = 40日
      const balanceCurrentYear = getLeaveBalance('user-1', currentYear);
      expect(balanceCurrentYear?.paidLeave.total).toBe(40);
    });
  });

  describe('deleteRequest', () => {
    it('休暇申請を削除できる', () => {
      const { createLeaveRequest, deleteRequest, getUserRequests } =
        useLeaveManagementStore.getState();

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        days: 1,
        reason: 'テスト',
        status: 'draft',
      });

      deleteRequest(id);

      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(0);
    });

    it('承認済み申請を削除すると休暇残数が戻る', () => {
      const {
        createLeaveRequest,
        approveLeaveRequest,
        deleteRequest,
        initializeLeaveBalance,
        getLeaveBalance,
      } = useLeaveManagementStore.getState();

      initializeLeaveBalance('user-1', currentYear, 20);

      const id = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'テスト',
        status: 'pending',
      });

      approveLeaveRequest(id, 'manager-1');

      // 残数が減っていることを確認
      let balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.remaining).toBe(17);

      // 削除
      deleteRequest(id);

      // 残数が戻ることを確認
      balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.remaining).toBe(20);
    });
  });

  describe('clearAll', () => {
    it('すべてのデータをクリアできる', () => {
      const {
        createLeaveRequest,
        initializeLeaveBalance,
        clearAll,
        getUserRequests,
        getLeaveBalance,
      } = useLeaveManagementStore.getState();

      // データを作成
      createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-01',
        days: 1,
        reason: 'テスト',
        status: 'pending',
      });

      initializeLeaveBalance('user-1', currentYear);

      // クリア
      clearAll();

      // データがクリアされていることを確認
      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(0);

      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance).toBeUndefined();
    });
  });

  describe('複合的なシナリオ', () => {
    it('複数の申請と残数管理が正しく動作する', () => {
      const {
        createLeaveRequest,
        approveLeaveRequest,
        initializeLeaveBalance,
        getLeaveBalance,
        getUserRequests,
      } = useLeaveManagementStore.getState();

      // 残数を初期化（有給20日）
      initializeLeaveBalance('user-1', currentYear, 20);

      // 申請1: 3日間の有給（承認）
      const id1 = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-05-01',
        endDate: '2024-05-03',
        days: 3,
        reason: 'GW休暇',
        status: 'pending',
      });
      approveLeaveRequest(id1, 'manager-1');

      // 申請2: 2日間の病気休暇（承認）
      const id2 = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'sick',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        days: 2,
        reason: '体調不良',
        status: 'pending',
      });
      approveLeaveRequest(id2, 'manager-1');

      // 申請3: 5日間の有給（承認）
      const id3 = createLeaveRequest({
        userId: 'user-1',
        userName: 'テストユーザー',
        type: 'paid',
        startDate: '2024-08-01',
        endDate: '2024-08-05',
        days: 5,
        reason: '夏季休暇',
        status: 'pending',
      });
      approveLeaveRequest(id3, 'manager-1');

      // 残数を確認
      const balance = getLeaveBalance('user-1', currentYear);
      expect(balance?.paidLeave.used).toBe(8); // 3 + 5
      expect(balance?.paidLeave.remaining).toBe(12); // 20 - 8
      expect(balance?.sickLeave.used).toBe(2);
      expect(balance?.sickLeave.remaining).toBe(3); // 5 - 2

      // 申請一覧を確認
      const requests = getUserRequests('user-1');
      expect(requests).toHaveLength(3);
      expect(requests.every(r => r.status === 'approved')).toBe(true);
    });
  });
});
