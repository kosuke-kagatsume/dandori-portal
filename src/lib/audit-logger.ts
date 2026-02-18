/**
 * 監査ログユーティリティ
 * 各APIから呼び出して監査ログを記録する共通関数
 */

type AuditAction =
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

type AuditCategory =
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

type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: AuditAction;
  category: AuditCategory;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  description: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

const API_BASE = '/api/audit-logs';

/**
 * 監査ログを記録する
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}?tenantId=${entry.tenantId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...entry,
        severity: entry.severity || 'info',
      }),
    });

    if (!response.ok) {
      console.error('Failed to record audit log:', await response.text());
    }
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}

/**
 * サーバーサイドから直接Prismaを使用して監査ログを記録する
 * （APIエンドポイント内で使用）
 */
export async function recordAuditLogDirect(
  prisma: { audit_logs: { create: (args: { data: Record<string, unknown> }) => Promise<unknown> } },
  entry: AuditLogEntry
): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: entry.tenantId,
        userId: entry.userId,
        userName: entry.userName,
        userRole: entry.userRole,
        action: entry.action,
        category: entry.category,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetName: entry.targetName,
        description: entry.description,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
        severity: entry.severity || 'info',
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}

/**
 * 便利なヘルパー関数群
 */
export const auditLogger = {
  // 認証関連
  login: (tenantId: string, userId: string, userName: string, ipAddress?: string) =>
    recordAuditLog({
      tenantId,
      userId,
      userName,
      action: 'login',
      category: 'auth',
      description: `${userName}がログインしました`,
      ipAddress,
      severity: 'info',
    }),

  logout: (tenantId: string, userId: string, userName: string) =>
    recordAuditLog({
      tenantId,
      userId,
      userName,
      action: 'logout',
      category: 'auth',
      description: `${userName}がログアウトしました`,
      severity: 'info',
    }),

  // ユーザー関連
  createUser: (tenantId: string, actorId: string, actorName: string, targetId: string, targetName: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'create',
      category: 'user',
      targetType: 'ユーザー',
      targetId,
      targetName,
      description: `${actorName}がユーザー「${targetName}」を作成しました`,
      severity: 'info',
    }),

  updateUser: (tenantId: string, actorId: string, actorName: string, targetId: string, targetName: string, changes?: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'update',
      category: 'user',
      targetType: 'ユーザー',
      targetId,
      targetName,
      description: `${actorName}がユーザー「${targetName}」を更新しました${changes ? `（${changes}）` : ''}`,
      severity: 'info',
    }),

  deleteUser: (tenantId: string, actorId: string, actorName: string, targetId: string, targetName: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'delete',
      category: 'user',
      targetType: 'ユーザー',
      targetId,
      targetName,
      description: `${actorName}がユーザー「${targetName}」を削除しました`,
      severity: 'warning',
    }),

  // ワークフロー関連
  approveWorkflow: (tenantId: string, actorId: string, actorName: string, workflowId: string, workflowTitle: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'approve',
      category: 'workflow',
      targetType: 'ワークフロー',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `${actorName}がワークフロー「${workflowTitle}」を承認しました`,
      severity: 'info',
    }),

  rejectWorkflow: (tenantId: string, actorId: string, actorName: string, workflowId: string, workflowTitle: string, reason?: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'reject',
      category: 'workflow',
      targetType: 'ワークフロー',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `${actorName}がワークフロー「${workflowTitle}」を却下しました${reason ? `（理由: ${reason}）` : ''}`,
      severity: 'warning',
    }),

  // 汎用
  create: (tenantId: string, actorId: string, actorName: string, category: AuditCategory, targetType: string, targetId: string, targetName: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'create',
      category,
      targetType,
      targetId,
      targetName,
      description: `${actorName}が${targetType}「${targetName}」を作成しました`,
      severity: 'info',
    }),

  update: (tenantId: string, actorId: string, actorName: string, category: AuditCategory, targetType: string, targetId: string, targetName: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'update',
      category,
      targetType,
      targetId,
      targetName,
      description: `${actorName}が${targetType}「${targetName}」を更新しました`,
      severity: 'info',
    }),

  delete: (tenantId: string, actorId: string, actorName: string, category: AuditCategory, targetType: string, targetId: string, targetName: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'delete',
      category,
      targetType,
      targetId,
      targetName,
      description: `${actorName}が${targetType}「${targetName}」を削除しました`,
      severity: 'warning',
    }),

  export: (tenantId: string, actorId: string, actorName: string, category: AuditCategory, targetType: string, description: string) =>
    recordAuditLog({
      tenantId,
      userId: actorId,
      userName: actorName,
      action: 'export',
      category,
      targetType,
      description,
      severity: 'info',
    }),
};
