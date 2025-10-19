/**
 * Audit ストアのテスト
 */

import { useAuditStore } from './audit-store';
import type { AuditLog } from './audit-store';

describe('AuditStore', () => {
  beforeEach(() => {
    // 各テスト前にストアとlocalStorageをリセット
    localStorage.clear();
    useAuditStore.setState({ logs: [] });
  });

  describe('Store initialization', () => {
    it('ストアが正しく初期化される', () => {
      // Test that the store can be initialized with logs
      const state = useAuditStore.getState();
      expect(state.logs).toBeDefined();
      expect(Array.isArray(state.logs)).toBe(true);
    });

    it('モックログはタイムスタンプ降順でソートされている', () => {
      // Skip beforeEach to test initial state
      localStorage.clear();

      const logs: Omit<AuditLog, 'id' | 'timestamp'>[] = [];
      for (let i = 0; i < 5; i++) {
        logs.push({
          userId: `user-${i}`,
          userName: `ユーザー${i}`,
          userRole: 'employee',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: `ログ${i}`,
          severity: 'info',
        });
      }

      // Add logs in random order
      logs.forEach(log => useAuditStore.getState().addLog(log));

      const state = useAuditStore.getState();

      for (let i = 0; i < state.logs.length - 1; i++) {
        const currentTime = new Date(state.logs[i].timestamp).getTime();
        const nextTime = new Date(state.logs[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }

      // Reset for other tests
      useAuditStore.setState({ logs: [] });
    });
  });

  describe('addLog', () => {
    it('新しいログを追加できる', () => {
      useAuditStore.setState({ logs: [] });

      const newLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user-1',
        userName: 'テストユーザー',
        userRole: 'admin',
        action: 'create',
        category: 'user',
        targetType: 'ユーザー',
        targetId: 'target-1',
        targetName: 'テスト対象',
        description: 'ユーザーを作成しました',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        severity: 'info',
      };

      useAuditStore.getState().addLog(newLog);

      const state = useAuditStore.getState();
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0].userName).toBe('テストユーザー');
      expect(state.logs[0].action).toBe('create');
    });

    it('IDとタイムスタンプが自動生成される', () => {
      useAuditStore.setState({ logs: [] });

      const newLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user-1',
        userName: 'テストユーザー',
        userRole: 'admin',
        action: 'login',
        category: 'auth',
        targetType: 'システム',
        description: 'ログインしました',
        severity: 'info',
      };

      useAuditStore.getState().addLog(newLog);

      const state = useAuditStore.getState();
      expect(state.logs[0].id).toBeDefined();
      expect(state.logs[0].id).toContain('audit-');
      expect(state.logs[0].timestamp).toBeDefined();
      expect(new Date(state.logs[0].timestamp).getTime()).toBeGreaterThan(0);
    });

    it('新しいログが配列の先頭に追加される', () => {
      useAuditStore.setState({ logs: [] });

      const log1: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user-1',
        userName: 'ユーザー1',
        userRole: 'employee',
        action: 'login',
        category: 'auth',
        targetType: 'システム',
        description: 'ログイン1',
        severity: 'info',
      };

      const log2: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user-2',
        userName: 'ユーザー2',
        userRole: 'manager',
        action: 'logout',
        category: 'auth',
        targetType: 'システム',
        description: 'ログアウト2',
        severity: 'info',
      };

      useAuditStore.getState().addLog(log1);
      useAuditStore.getState().addLog(log2);

      const state = useAuditStore.getState();
      expect(state.logs[0].userName).toBe('ユーザー2'); // 最新が先頭
      expect(state.logs[1].userName).toBe('ユーザー1');
    });

    it('メタデータ付きログを追加できる', () => {
      useAuditStore.setState({ logs: [] });

      const newLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user-1',
        userName: 'テストユーザー',
        userRole: 'admin',
        action: 'update',
        category: 'settings',
        targetType: 'システム設定',
        description: '設定を変更しました',
        severity: 'warning',
        metadata: {
          oldValue: '旧設定',
          newValue: '新設定',
          changedField: 'securityLevel',
        },
      };

      useAuditStore.getState().addLog(newLog);

      const state = useAuditStore.getState();
      expect(state.logs[0].metadata).toBeDefined();
      expect(state.logs[0].metadata?.oldValue).toBe('旧設定');
      expect(state.logs[0].metadata?.newValue).toBe('新設定');
    });
  });

  describe('getLogs - filtering by single criteria', () => {
    beforeEach(() => {
      useAuditStore.setState({ logs: [] });

      const logs: Omit<AuditLog, 'id' | 'timestamp'>[] = [
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: 'ログインしました',
          severity: 'info',
        },
        {
          userId: 'user-2',
          userName: '佐藤花子',
          userRole: 'manager',
          action: 'approve',
          category: 'workflow',
          targetType: '休暇申請',
          description: '休暇申請を承認しました',
          severity: 'info',
        },
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'delete',
          category: 'user',
          targetType: 'ユーザー',
          description: 'ユーザーを削除しました',
          severity: 'error',
        },
        {
          userId: 'user-3',
          userName: '山田次郎',
          userRole: 'hr',
          action: 'export',
          category: 'payroll',
          targetType: '給与データ',
          description: '給与データをエクスポートしました',
          severity: 'warning',
        },
      ];

      logs.forEach(log => useAuditStore.getState().addLog(log));
    });

    it('フィルターなしで全てのログを取得する', () => {
      const logs = useAuditStore.getState().getLogs();
      expect(logs).toHaveLength(4);
    });

    it('userIdでフィルタリングできる', () => {
      const logs = useAuditStore.getState().getLogs({ userId: 'user-1' });
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.userId === 'user-1')).toBe(true);
    });

    it('categoryでフィルタリングできる', () => {
      const logs = useAuditStore.getState().getLogs({ category: 'auth' });
      expect(logs).toHaveLength(1);
      expect(logs[0].category).toBe('auth');
      expect(logs[0].action).toBe('login');
    });

    it('actionでフィルタリングできる', () => {
      const logs = useAuditStore.getState().getLogs({ action: 'approve' });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('approve');
      expect(logs[0].userName).toBe('佐藤花子');
    });

    it('severityでフィルタリングできる', () => {
      const logs = useAuditStore.getState().getLogs({ severity: 'error' });
      expect(logs).toHaveLength(1);
      expect(logs[0].severity).toBe('error');
      expect(logs[0].action).toBe('delete');
    });
  });

  describe('getLogs - filtering by date range', () => {
    beforeEach(() => {
      useAuditStore.setState({ logs: [] });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Manually create logs with specific timestamps
      const logs: AuditLog[] = [
        {
          id: 'audit-1',
          timestamp: twoDaysAgo.toISOString(),
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: '2日前のログイン',
          severity: 'info',
        },
        {
          id: 'audit-2',
          timestamp: yesterday.toISOString(),
          userId: 'user-2',
          userName: '佐藤花子',
          userRole: 'manager',
          action: 'approve',
          category: 'workflow',
          targetType: '休暇申請',
          description: '昨日の承認',
          severity: 'info',
        },
        {
          id: 'audit-3',
          timestamp: now.toISOString(),
          userId: 'user-3',
          userName: '山田次郎',
          userRole: 'hr',
          action: 'export',
          category: 'payroll',
          targetType: '給与データ',
          description: '今日のエクスポート',
          severity: 'warning',
        },
      ];

      useAuditStore.setState({ logs });
    });

    it('startDateでフィルタリングできる', () => {
      // Clear logs and add test data with known timestamps
      useAuditStore.setState({ logs: [] });

      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // Add logs with specific timestamps
      useAuditStore.getState().addLog({
        userId: 'user-1',
        userName: 'User 1',
        userRole: 'employee',
        action: 'login',
        category: 'auth',
        targetType: 'システム',
        description: 'ログインしました (2 days ago)',
        severity: 'info',
      });

      // Manually update timestamp to 2 days ago
      const state1 = useAuditStore.getState();
      const log1 = state1.logs[0];
      useAuditStore.setState({
        logs: [{ ...log1, timestamp: twoDaysAgo.toISOString() }]
      });

      // Add recent logs (today)
      useAuditStore.getState().addLog({
        userId: 'user-2',
        userName: 'User 2',
        userRole: 'manager',
        action: 'create',
        category: 'user',
        targetType: 'ユーザー',
        description: 'ユーザーを作成しました (today)',
        severity: 'info',
      });

      useAuditStore.getState().addLog({
        userId: 'user-3',
        userName: 'User 3',
        userRole: 'hr',
        action: 'update',
        category: 'attendance',
        targetType: '勤怠記録',
        description: '勤怠を更新しました (today)',
        severity: 'info',
      });

      // Test filter
      const logs = useAuditStore.getState().getLogs({
        startDate: yesterday.toISOString(),
      });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      logs.forEach(log => {
        expect(new Date(log.timestamp).getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
      });
    });

    it('endDateでフィルタリングできる', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const logs = useAuditStore.getState().getLogs({
        endDate: yesterday.toISOString(),
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      logs.forEach(log => {
        expect(new Date(log.timestamp).getTime()).toBeLessThanOrEqual(yesterday.getTime());
      });
    });

    it('startDateとendDateで範囲指定できる', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const logs = useAuditStore.getState().getLogs({
        startDate: twoDaysAgo.toISOString(),
        endDate: yesterday.toISOString(),
      });

      logs.forEach(log => {
        const logTime = new Date(log.timestamp).getTime();
        expect(logTime).toBeGreaterThanOrEqual(twoDaysAgo.getTime());
        expect(logTime).toBeLessThanOrEqual(yesterday.getTime());
      });
    });
  });

  describe('getLogs - filtering by searchQuery', () => {
    beforeEach(() => {
      useAuditStore.setState({ logs: [] });

      const logs: Omit<AuditLog, 'id' | 'timestamp'>[] = [
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'create',
          category: 'user',
          targetType: 'ユーザー',
          targetName: '新規ユーザーA',
          description: '新規ユーザーを作成しました',
          severity: 'info',
        },
        {
          userId: 'user-2',
          userName: '佐藤花子',
          userRole: 'manager',
          action: 'update',
          category: 'attendance',
          targetType: '勤怠記録',
          targetName: '2024年10月の勤怠',
          description: '勤怠記録を更新しました',
          severity: 'info',
        },
        {
          userId: 'user-3',
          userName: '山田次郎',
          userRole: 'hr',
          action: 'delete',
          category: 'user',
          targetType: 'ユーザー',
          targetName: '退職者B',
          description: 'ユーザーを削除しました',
          severity: 'error',
        },
      ];

      logs.forEach(log => useAuditStore.getState().addLog(log));
    });

    it('userNameで検索できる', () => {
      const logs = useAuditStore.getState().getLogs({ searchQuery: '田中' });
      expect(logs).toHaveLength(1);
      expect(logs[0].userName).toContain('田中');
    });

    it('descriptionで検索できる', () => {
      const logs = useAuditStore.getState().getLogs({ searchQuery: '勤怠' });
      expect(logs).toHaveLength(1);
      expect(logs[0].description).toContain('勤怠');
    });

    it('targetTypeで検索できる', () => {
      const logs = useAuditStore.getState().getLogs({ searchQuery: 'ユーザー' });
      expect(logs).toHaveLength(2);
      logs.forEach(log => {
        expect(log.targetType).toContain('ユーザー');
      });
    });

    it('targetNameで検索できる', () => {
      const logs = useAuditStore.getState().getLogs({ searchQuery: '退職者' });
      expect(logs).toHaveLength(1);
      expect(logs[0].targetName).toContain('退職者');
    });

    it('部分一致で検索できる', () => {
      const logs = useAuditStore.getState().getLogs({ searchQuery: '田中' });
      expect(logs).toHaveLength(1);
      expect(logs[0].userName).toBe('田中太郎');
    });
  });

  describe('getLogs - combined filters', () => {
    beforeEach(() => {
      useAuditStore.setState({ logs: [] });

      const logs: Omit<AuditLog, 'id' | 'timestamp'>[] = [
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: 'ログインしました',
          severity: 'info',
        },
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'create',
          category: 'attendance',
          targetType: '勤怠記録',
          description: '出勤を記録しました',
          severity: 'info',
        },
        {
          userId: 'user-2',
          userName: '佐藤花子',
          userRole: 'manager',
          action: 'approve',
          category: 'workflow',
          targetType: '休暇申請',
          description: '休暇申請を承認しました',
          severity: 'info',
        },
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'delete',
          category: 'user',
          targetType: 'ユーザー',
          description: 'ユーザーを削除しました',
          severity: 'error',
        },
      ];

      logs.forEach(log => useAuditStore.getState().addLog(log));
    });

    it('userIdとcategoryで絞り込める', () => {
      const logs = useAuditStore.getState().getLogs({
        userId: 'user-1',
        category: 'attendance',
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].category).toBe('attendance');
    });

    it('actionとseverityで絞り込める', () => {
      const logs = useAuditStore.getState().getLogs({
        action: 'delete',
        severity: 'error',
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('delete');
      expect(logs[0].severity).toBe('error');
    });

    it('userId、category、actionで絞り込める', () => {
      const logs = useAuditStore.getState().getLogs({
        userId: 'user-1',
        category: 'auth',
        action: 'login',
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('user-1');
      expect(logs[0].category).toBe('auth');
      expect(logs[0].action).toBe('login');
    });
  });

  describe('clearLogs', () => {
    beforeEach(() => {
      useAuditStore.setState({ logs: [] });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const logs: AuditLog[] = [
        {
          id: 'audit-1',
          timestamp: twoDaysAgo.toISOString(),
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: '2日前のログイン',
          severity: 'info',
        },
        {
          id: 'audit-2',
          timestamp: yesterday.toISOString(),
          userId: 'user-2',
          userName: '佐藤花子',
          userRole: 'manager',
          action: 'approve',
          category: 'workflow',
          targetType: '休暇申請',
          description: '昨日の承認',
          severity: 'info',
        },
        {
          id: 'audit-3',
          timestamp: now.toISOString(),
          userId: 'user-3',
          userName: '山田次郎',
          userRole: 'hr',
          action: 'export',
          category: 'payroll',
          targetType: '給与データ',
          description: '今日のエクスポート',
          severity: 'warning',
        },
      ];

      useAuditStore.setState({ logs });
    });

    it('全てのログをクリアできる', () => {
      useAuditStore.getState().clearLogs();
      const state = useAuditStore.getState();
      expect(state.logs).toHaveLength(0);
    });

    it('指定日時より前のログのみクリアできる', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      useAuditStore.getState().clearLogs(yesterday.toISOString());

      const state = useAuditStore.getState();
      expect(state.logs.length).toBeGreaterThanOrEqual(2);

      state.logs.forEach(log => {
        expect(new Date(log.timestamp).getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
      });
    });

    it('30日前のログをクリアしても最近のログは残る', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      useAuditStore.getState().clearLogs(thirtyDaysAgo.toISOString());

      const state = useAuditStore.getState();
      expect(state.logs).toHaveLength(3); // All logs are within 30 days
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      useAuditStore.setState({ logs: [] });

      const logs: Omit<AuditLog, 'id' | 'timestamp'>[] = [
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: 'ログインしました',
          severity: 'info',
        },
        {
          userId: 'user-2',
          userName: '佐藤花子',
          userRole: 'manager',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: 'ログインしました',
          severity: 'info',
        },
        {
          userId: 'user-1',
          userName: '田中太郎',
          userRole: 'employee',
          action: 'create',
          category: 'attendance',
          targetType: '勤怠記録',
          description: '出勤を記録しました',
          severity: 'info',
        },
        {
          userId: 'user-2',
          userName: '佐藤花子',
          userRole: 'manager',
          action: 'approve',
          category: 'workflow',
          targetType: '休暇申請',
          description: '休暇申請を承認しました',
          severity: 'info',
        },
        {
          userId: 'user-3',
          userName: '山田次郎',
          userRole: 'hr',
          action: 'delete',
          category: 'user',
          targetType: 'ユーザー',
          description: 'ユーザーを削除しました',
          severity: 'error',
        },
        {
          userId: 'user-4',
          userName: '鈴木一郎',
          userRole: 'admin',
          action: 'update',
          category: 'settings',
          targetType: 'システム設定',
          description: 'セキュリティ設定を変更しました',
          severity: 'critical',
        },
        {
          userId: 'user-3',
          userName: '山田次郎',
          userRole: 'hr',
          action: 'export',
          category: 'payroll',
          targetType: '給与データ',
          description: '給与データをエクスポートしました',
          severity: 'warning',
        },
      ];

      logs.forEach(log => useAuditStore.getState().addLog(log));
    });

    it('総ログ数を正しく取得できる', () => {
      const stats = useAuditStore.getState().getStats();
      expect(stats.totalLogs).toBe(7);
    });

    it('カテゴリ別の集計が正しい', () => {
      const stats = useAuditStore.getState().getStats();
      expect(stats.byCategory.auth).toBe(2);
      expect(stats.byCategory.attendance).toBe(1);
      expect(stats.byCategory.workflow).toBe(1);
      expect(stats.byCategory.user).toBe(1);
      expect(stats.byCategory.settings).toBe(1);
      expect(stats.byCategory.payroll).toBe(1);
      expect(stats.byCategory.leave).toBe(0);
    });

    it('アクション別の集計が正しい', () => {
      const stats = useAuditStore.getState().getStats();
      expect(stats.byAction.login).toBe(2);
      expect(stats.byAction.create).toBe(1);
      expect(stats.byAction.approve).toBe(1);
      expect(stats.byAction.delete).toBe(1);
      expect(stats.byAction.update).toBe(1);
      expect(stats.byAction.export).toBe(1);
      expect(stats.byAction.logout).toBe(0);
    });

    it('重要度別の集計が正しい', () => {
      const stats = useAuditStore.getState().getStats();
      expect(stats.bySeverity.info).toBe(4);
      expect(stats.bySeverity.warning).toBe(1);
      expect(stats.bySeverity.error).toBe(1);
      expect(stats.bySeverity.critical).toBe(1);
    });

    it('最新10件のログを取得できる', () => {
      const stats = useAuditStore.getState().getStats();
      expect(stats.recentLogs).toHaveLength(7);
      expect(stats.recentLogs.length).toBeLessThanOrEqual(10);
    });

    it('最新ログが先頭に表示される', () => {
      // Add more logs to test ordering
      for (let i = 0; i < 15; i++) {
        useAuditStore.getState().addLog({
          userId: `user-${i}`,
          userName: `ユーザー${i}`,
          userRole: 'employee',
          action: 'login',
          category: 'auth',
          targetType: 'システム',
          description: `ログ${i}`,
          severity: 'info',
        });
      }

      const stats = useAuditStore.getState().getStats();
      expect(stats.recentLogs).toHaveLength(10);

      // Check timestamps are in descending order
      for (let i = 0; i < stats.recentLogs.length - 1; i++) {
        const currentTime = new Date(stats.recentLogs[i].timestamp).getTime();
        const nextTime = new Date(stats.recentLogs[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it('空のログでも統計を取得できる', () => {
      useAuditStore.setState({ logs: [] });

      const stats = useAuditStore.getState().getStats();
      expect(stats.totalLogs).toBe(0);
      expect(stats.byCategory.auth).toBe(0);
      expect(stats.byAction.login).toBe(0);
      expect(stats.bySeverity.info).toBe(0);
      expect(stats.recentLogs).toHaveLength(0);
    });
  });
});
