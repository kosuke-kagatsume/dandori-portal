import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'access';

export type AuditCategory =
  | 'auth'
  | 'user'
  | 'attendance'
  | 'leave'
  | 'workflow'
  | 'payroll'
  | 'organization'
  | 'settings'
  | 'saas'
  | 'assets';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  userRole: 'employee' | 'manager' | 'hr' | 'admin';
  action: AuditAction;
  category: AuditCategory;
  targetType: string; // 'ユーザー', '勤怠記録', '給与', etc.
  targetId?: string;
  targetName?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface AuditStore {
  logs: AuditLog[];

  // ログ追加
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;

  // ログ検索
  getLogs: (filters?: {
    userId?: string;
    category?: AuditCategory;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    severity?: AuditLog['severity'];
    searchQuery?: string;
  }) => AuditLog[];

  // ログクリア（管理者のみ）
  clearLogs: (beforeDate?: string) => void;

  // 統計取得
  getStats: () => {
    totalLogs: number;
    byCategory: Record<AuditCategory, number>;
    byAction: Record<AuditAction, number>;
    bySeverity: Record<string, number>;
    recentLogs: AuditLog[];
  };
}

// モックデータ生成
const generateMockLogs = (): AuditLog[] => {
  const users = [
    { id: 'demo-user-1', name: '田中太郎', role: 'employee' as const },
    { id: 'demo-user-2', name: '佐藤花子', role: 'manager' as const },
    { id: 'demo-user-3', name: '山田次郎', role: 'hr' as const },
    { id: 'demo-user-4', name: '鈴木一郎', role: 'admin' as const },
  ];

  const actions: { action: AuditAction; category: AuditCategory; targetType: string; description: string; severity: AuditLog['severity'] }[] = [
    { action: 'login', category: 'auth', targetType: 'システム', description: 'ログインしました', severity: 'info' },
    { action: 'create', category: 'attendance', targetType: '勤怠記録', description: '出勤を記録しました', severity: 'info' },
    { action: 'update', category: 'user', targetType: 'ユーザー', description: 'プロフィールを更新しました', severity: 'info' },
    { action: 'approve', category: 'workflow', targetType: '休暇申請', description: '休暇申請を承認しました', severity: 'info' },
    { action: 'reject', category: 'workflow', targetType: '経費申請', description: '経費申請を却下しました', severity: 'warning' },
    { action: 'export', category: 'payroll', targetType: '給与データ', description: '給与データをエクスポートしました', severity: 'warning' },
    { action: 'delete', category: 'user', targetType: 'ユーザー', description: 'ユーザーを削除しました', severity: 'error' },
    { action: 'update', category: 'settings', targetType: 'システム設定', description: 'セキュリティ設定を変更しました', severity: 'critical' },
  ];

  const logs: AuditLog[] = [];
  const now = new Date();

  for (let i = 0; i < 100; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const actionData = actions[Math.floor(Math.random() * actions.length)];
    const timestamp = new Date(now.getTime() - i * 1000 * 60 * Math.random() * 120);

    logs.push({
      id: `audit-${i + 1}`,
      timestamp: timestamp.toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: actionData.action,
      category: actionData.category,
      targetType: actionData.targetType,
      targetId: `target-${i + 1}`,
      targetName: `${actionData.targetType}-${i + 1}`,
      description: actionData.description,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: actionData.severity,
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      logs: generateMockLogs(),

      addLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          logs: [newLog, ...state.logs],
        }));
      },

      getLogs: (filters) => {
        const logs = get().logs;

        if (!filters) return logs;

        return logs.filter((log) => {
          if (filters.userId && log.userId !== filters.userId) return false;
          if (filters.category && log.category !== filters.category) return false;
          if (filters.action && log.action !== filters.action) return false;
          if (filters.severity && log.severity !== filters.severity) return false;

          if (filters.startDate) {
            const logDate = new Date(log.timestamp);
            const startDate = new Date(filters.startDate);
            if (logDate < startDate) return false;
          }

          if (filters.endDate) {
            const logDate = new Date(log.timestamp);
            const endDate = new Date(filters.endDate);
            if (logDate > endDate) return false;
          }

          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            return (
              log.userName.toLowerCase().includes(query) ||
              log.description.toLowerCase().includes(query) ||
              log.targetType.toLowerCase().includes(query) ||
              log.targetName?.toLowerCase().includes(query)
            );
          }

          return true;
        });
      },

      clearLogs: (beforeDate) => {
        set((state) => {
          if (beforeDate) {
            const cutoffDate = new Date(beforeDate);
            return {
              logs: state.logs.filter(log => new Date(log.timestamp) >= cutoffDate),
            };
          }
          return { logs: [] };
        });
      },

      getStats: () => {
        const logs = get().logs;

        const byCategory: Record<AuditCategory, number> = {
          auth: 0,
          user: 0,
          attendance: 0,
          leave: 0,
          workflow: 0,
          payroll: 0,
          organization: 0,
          settings: 0,
          saas: 0,
          assets: 0,
        };

        const byAction: Record<AuditAction, number> = {
          login: 0,
          logout: 0,
          create: 0,
          update: 0,
          delete: 0,
          approve: 0,
          reject: 0,
          export: 0,
          import: 0,
          access: 0,
        };

        const bySeverity: Record<string, number> = {
          info: 0,
          warning: 0,
          error: 0,
          critical: 0,
        };

        logs.forEach((log) => {
          byCategory[log.category]++;
          byAction[log.action]++;
          bySeverity[log.severity]++;
        });

        return {
          totalLogs: logs.length,
          byCategory,
          byAction,
          bySeverity,
          recentLogs: logs.slice(0, 10),
        };
      },
    }),
    {
      name: 'audit-store',
    }
  )
);
