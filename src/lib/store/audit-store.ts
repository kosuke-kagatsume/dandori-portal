import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// REST API helper functions
const API_BASE = '/api/audit-logs';

// CookieからテナントIDを取得（ミドルウェアで設定される x-tenant-id を使用）
const getTenantId = (): string => {
  if (typeof document === 'undefined') return 'tenant-1'; // SSR時のフォールバック
  const match = document.cookie.match(/x-tenant-id=([^;]+)/);
  return match ? match[1] : 'tenant-1';
};

interface ApiFetchLogsParams {
  userId?: string;
  category?: AuditCategory;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  severity?: AuditLog['severity'];
  searchQuery?: string;
  page?: number;
  limit?: number;
}

async function apiFetchLogs(filters?: ApiFetchLogsParams) {
  const params = new URLSearchParams({ tenantId: getTenantId() });
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.action) params.set('action', filters.action);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.severity) params.set('severity', filters.severity);
  if (filters?.searchQuery) params.set('searchQuery', filters.searchQuery);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const response = await fetch(`${API_BASE}?${params}`);
  if (!response.ok) {
    throw new Error('監査ログの取得に失敗しました');
  }
  const result = await response.json();
  return result;
}

async function apiCreateLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const response = await fetch(`${API_BASE}?tenantId=${getTenantId()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!response.ok) {
    throw new Error('監査ログの作成に失敗しました');
  }
  const result = await response.json();
  return result.data;
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'return'
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
  metadata?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface AuditStore {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // API連携
  fetchLogs: (filters?: ApiFetchLogsParams) => Promise<void>;

  // ログ追加
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;

  // ログ検索（ローカル）
  getLogs: (filters?: {
    userId?: string;
    category?: AuditCategory;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    severity?: AuditLog['severity'];
    searchQuery?: string;
  }) => AuditLog[];

  // ログクリア（ローカルのみ）
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

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      logs: [],
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
      },

      fetchLogs: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiFetchLogs(filters);

          // APIレスポンスをAuditLog形式に変換
          const logs: AuditLog[] = (result.data || []).map((log: Record<string, unknown>) => ({
            id: log.id as string,
            timestamp: log.createdAt as string,
            userId: log.userId as string,
            userName: log.userName as string,
            userRole: (log.userRole as 'employee' | 'manager' | 'hr' | 'admin') || 'employee',
            action: log.action as AuditAction,
            category: log.category as AuditCategory,
            targetType: log.targetType as string || '',
            targetId: log.targetId as string,
            targetName: log.targetName as string,
            description: log.description as string,
            ipAddress: log.ipAddress as string,
            userAgent: log.userAgent as string,
            metadata: log.metadata as Record<string, unknown>,
            severity: (log.severity as 'info' | 'warning' | 'error' | 'critical') || 'info',
          }));

          set({
            logs,
            isLoading: false,
            pagination: result.pagination || {
              page: 1,
              limit: 50,
              total: logs.length,
              totalPages: 1,
            },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '監査ログの取得に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      addLog: async (log) => {
        set({ isLoading: true, error: null });
        try {
          const createdLog = await apiCreateLog(log);

          const newLog: AuditLog = {
            id: createdLog.id,
            timestamp: createdLog.createdAt,
            ...log,
          };

          set((state) => ({
            logs: [newLog, ...state.logs],
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '監査ログの作成に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
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
          return: 0,
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
      skipHydration: true,
    }
  )
);
