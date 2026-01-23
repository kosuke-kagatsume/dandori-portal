'use client';

import { useAuditStore, type AuditLog } from '@/lib/store/audit-store';
// AuditAction, AuditCategory - 型定義として将来使用予定
import { useUserStore } from '@/lib/store/user-store';

type AuditLogInput = Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole' | 'ipAddress' | 'userAgent'>;

/**
 * 監査ログを記録するヘルパー関数
 * 現在のユーザー情報を自動的に取得して記録
 */
export function logAudit(input: AuditLogInput): void {
  // クライアント側でのみ実行
  if (typeof window === 'undefined') return;

  try {
    const userStore = useUserStore.getState();
    const auditStore = useAuditStore.getState();

    // 本番モード: currentUser、デモモード: currentDemoUser を使用
    const user = userStore.currentUser;
    const demoUser = userStore.currentDemoUser;

    // ユーザー情報を取得（本番ユーザー優先、なければデモユーザー）
    const userId = user?.id || demoUser?.id;
    const userName = user?.name || demoUser?.name;
    const userRole = user?.roles?.[0] || demoUser?.role;

    if (!userId || !userName) {
      // ログイン前や認証処理中は警告を出さない（静かに終了）
      return;
    }

    // ユーザーロールをマッピング
    const roleMap: Record<string, AuditLog['userRole']> = {
      employee: 'employee',
      manager: 'manager',
      hr: 'hr',
      admin: 'admin',
      executive: 'manager',
      applicant: 'employee',
    };

    auditStore.addLog({
      ...input,
      userId,
      userName,
      userRole: roleMap[userRole || 'employee'] || 'employee',
      ipAddress: 'localhost', // デモ用
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });
  } catch (error) {
    console.error('監査ログの記録に失敗:', error);
  }
}

// 便利なヘルパー関数群

/**
 * ワークフロー関連の監査ログ
 */
export const workflowAudit = {
  create: (workflowId: string, workflowTitle: string) => {
    logAudit({
      action: 'create',
      category: 'workflow',
      targetType: 'ワークフロー申請',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `ワークフロー申請「${workflowTitle}」を作成しました`,
      severity: 'info',
    });
  },

  submit: (workflowId: string, workflowTitle: string) => {
    logAudit({
      action: 'update',
      category: 'workflow',
      targetType: 'ワークフロー申請',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `ワークフロー申請「${workflowTitle}」を提出しました`,
      severity: 'info',
    });
  },

  approve: (workflowId: string, workflowTitle: string, approverName: string) => {
    logAudit({
      action: 'approve',
      category: 'workflow',
      targetType: 'ワークフロー申請',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `ワークフロー申請「${workflowTitle}」を承認しました`,
      severity: 'info',
      metadata: { approverName },
    });
  },

  reject: (workflowId: string, workflowTitle: string, reason: string) => {
    logAudit({
      action: 'reject',
      category: 'workflow',
      targetType: 'ワークフロー申請',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `ワークフロー申請「${workflowTitle}」を却下しました：${reason}`,
      severity: 'warning',
      metadata: { reason },
    });
  },

  return: (workflowId: string, workflowTitle: string, reason: string) => {
    logAudit({
      action: 'return',
      category: 'workflow',
      targetType: 'ワークフロー申請',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `ワークフロー申請「${workflowTitle}」を差し戻しました：${reason}`,
      severity: 'warning',
      metadata: { reason },
    });
  },

  cancel: (workflowId: string, workflowTitle: string) => {
    logAudit({
      action: 'delete',
      category: 'workflow',
      targetType: 'ワークフロー申請',
      targetId: workflowId,
      targetName: workflowTitle,
      description: `ワークフロー申請「${workflowTitle}」を取り消しました`,
      severity: 'warning',
    });
  },
};

/**
 * 勤怠関連の監査ログ
 */
export const attendanceAudit = {
  checkIn: (date: string) => {
    logAudit({
      action: 'create',
      category: 'attendance',
      targetType: '勤怠記録',
      targetName: date,
      description: `${date}の出勤を記録しました`,
      severity: 'info',
    });
  },

  checkOut: (date: string) => {
    logAudit({
      action: 'update',
      category: 'attendance',
      targetType: '勤怠記録',
      targetName: date,
      description: `${date}の退勤を記録しました`,
      severity: 'info',
    });
  },

  correct: (date: string, reason: string) => {
    logAudit({
      action: 'update',
      category: 'attendance',
      targetType: '勤怠記録',
      targetName: date,
      description: `${date}の勤怠を修正しました：${reason}`,
      severity: 'warning',
      metadata: { reason },
    });
  },
};

/**
 * ユーザー関連の監査ログ
 */
export const userAudit = {
  create: (userId: string, userName: string) => {
    logAudit({
      action: 'create',
      category: 'user',
      targetType: 'ユーザー',
      targetId: userId,
      targetName: userName,
      description: `ユーザー「${userName}」を作成しました`,
      severity: 'info',
    });
  },

  update: (userId: string, userName: string, changes: string) => {
    logAudit({
      action: 'update',
      category: 'user',
      targetType: 'ユーザー',
      targetId: userId,
      targetName: userName,
      description: `ユーザー「${userName}」の情報を更新しました：${changes}`,
      severity: 'info',
      metadata: { changes },
    });
  },

  retire: (userId: string, userName: string, reason: string) => {
    logAudit({
      action: 'delete',
      category: 'user',
      targetType: 'ユーザー',
      targetId: userId,
      targetName: userName,
      description: `ユーザー「${userName}」を退職処理しました：${reason}`,
      severity: 'error',
      metadata: { reason },
    });
  },

  roleChange: (userId: string, userName: string, oldRole: string, newRole: string) => {
    logAudit({
      action: 'update',
      category: 'user',
      targetType: 'ユーザー',
      targetId: userId,
      targetName: userName,
      description: `ユーザー「${userName}」の権限を${oldRole}から${newRole}に変更しました`,
      severity: 'warning',
      metadata: { oldRole, newRole },
    });
  },
};

/**
 * 認証関連の監査ログ
 */
export const authAudit = {
  login: () => {
    logAudit({
      action: 'login',
      category: 'auth',
      targetType: 'システム',
      description: 'システムにログインしました',
      severity: 'info',
    });
  },

  logout: () => {
    logAudit({
      action: 'logout',
      category: 'auth',
      targetType: 'システム',
      description: 'システムからログアウトしました',
      severity: 'info',
    });
  },

  switchRole: (newRole: string) => {
    logAudit({
      action: 'update',
      category: 'auth',
      targetType: 'デモロール',
      description: `デモロールを${newRole}に切り替えました`,
      severity: 'info',
      metadata: { newRole },
    });
  },
};

/**
 * データエクスポート関連の監査ログ
 */
export const exportAudit = {
  csv: (dataType: string, recordCount: number) => {
    logAudit({
      action: 'export',
      category: 'payroll',
      targetType: dataType,
      description: `${dataType}をCSV形式でエクスポートしました（${recordCount}件）`,
      severity: 'warning',
      metadata: { format: 'csv', recordCount },
    });
  },

  pdf: (dataType: string, documentName: string) => {
    logAudit({
      action: 'export',
      category: 'payroll',
      targetType: dataType,
      targetName: documentName,
      description: `${dataType}「${documentName}」をPDF形式でエクスポートしました`,
      severity: 'warning',
      metadata: { format: 'pdf', documentName },
    });
  },
};

/**
 * 設定変更の監査ログ
 */
export const settingsAudit = {
  update: (settingName: string, oldValue: string, newValue: string) => {
    logAudit({
      action: 'update',
      category: 'settings',
      targetType: 'システム設定',
      targetName: settingName,
      description: `システム設定「${settingName}」を「${oldValue}」から「${newValue}」に変更しました`,
      severity: 'critical',
      metadata: { oldValue, newValue },
    });
  },
};

/**
 * SaaS/ライセンス関連の監査ログ
 */
export const saasAudit = {
  assignLicense: (serviceName: string, userName: string) => {
    logAudit({
      action: 'create',
      category: 'saas',
      targetType: 'ライセンス割り当て',
      targetName: serviceName,
      description: `「${serviceName}」のライセンスを${userName}に割り当てました`,
      severity: 'info',
      metadata: { userName },
    });
  },

  revokeLicense: (serviceName: string, userName: string) => {
    logAudit({
      action: 'delete',
      category: 'saas',
      targetType: 'ライセンス割り当て',
      targetName: serviceName,
      description: `「${serviceName}」のライセンスを${userName}から解除しました`,
      severity: 'warning',
      metadata: { userName },
    });
  },
};

/**
 * 資産管理の監査ログ
 */
export const assetAudit = {
  create: (assetType: string, assetName: string) => {
    logAudit({
      action: 'create',
      category: 'assets',
      targetType: assetType,
      targetName: assetName,
      description: `${assetType}「${assetName}」を登録しました`,
      severity: 'info',
    });
  },

  assign: (assetType: string, assetName: string, userName: string) => {
    logAudit({
      action: 'update',
      category: 'assets',
      targetType: assetType,
      targetName: assetName,
      description: `${assetType}「${assetName}」を${userName}に割り当てました`,
      severity: 'info',
      metadata: { userName },
    });
  },

  dispose: (assetType: string, assetName: string, reason: string) => {
    logAudit({
      action: 'delete',
      category: 'assets',
      targetType: assetType,
      targetName: assetName,
      description: `${assetType}「${assetName}」を廃棄しました：${reason}`,
      severity: 'warning',
      metadata: { reason },
    });
  },
};
