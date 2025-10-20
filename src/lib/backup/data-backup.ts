/**
 * 全データ一括バックアップ・リストア機能
 *
 * 全ストアのデータをJSON/CSVで一括出力・インポート
 */

import { useUserStore } from '@/lib/store/user-store';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';
import { useLeaveManagementStore } from '@/lib/store/leave-management-store';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { useWorkflowStore } from '@/lib/workflow-store';
import { useSaaSStore } from '@/lib/store/saas-store';
import { usePCStore } from '@/lib/store/pc-store';
import { useVehicleStore } from '@/lib/store/vehicle-store';
import { usePerformanceEvaluationStore } from '@/lib/store/performance-evaluation-store';
import { useOrganizationStore } from '@/lib/store/organization-store';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { useAuditStore } from '@/lib/store/audit-store';

// 各ストアの型を推論
type UserStoreState = ReturnType<typeof useUserStore.getState>;
type AttendanceStoreState = ReturnType<typeof useAttendanceHistoryStore.getState>;
type LeaveStoreState = ReturnType<typeof useLeaveManagementStore.getState>;
type PayrollStoreState = ReturnType<typeof usePayrollStore.getState>;
type WorkflowStoreState = ReturnType<typeof useWorkflowStore.getState>;
type SaaSStoreState = ReturnType<typeof useSaaSStore.getState>;
type PCStoreState = ReturnType<typeof usePCStore.getState>;
type VehicleStoreState = ReturnType<typeof useVehicleStore.getState>;
type EvaluationStoreState = ReturnType<typeof usePerformanceEvaluationStore.getState>;
type OrganizationStoreState = ReturnType<typeof useOrganizationStore.getState>;
type SettingsStoreState = ReturnType<typeof useCompanySettingsStore.getState>;
type AuditStoreState = ReturnType<typeof useAuditStore.getState>;

export interface BackupData {
  version: string;
  timestamp: string;
  stores: {
    users: UserStoreState;
    attendance: AttendanceStoreState;
    leave: LeaveStoreState;
    payroll: PayrollStoreState;
    workflow: WorkflowStoreState;
    saas: SaaSStoreState;
    pc: PCStoreState;
    vehicle: VehicleStoreState;
    evaluation: EvaluationStoreState;
    organization: OrganizationStoreState;
    settings: SettingsStoreState;
    audit: AuditStoreState;
  };
}

/**
 * 全データをJSON形式でバックアップ
 */
export function exportAllDataAsJSON(): BackupData {
  const backup: BackupData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stores: {
      users: useUserStore.getState(),
      attendance: useAttendanceHistoryStore.getState(),
      leave: useLeaveManagementStore.getState(),
      payroll: usePayrollStore.getState(),
      workflow: useWorkflowStore.getState(),
      saas: useSaaSStore.getState(),
      pc: usePCStore.getState(),
      vehicle: useVehicleStore.getState(),
      evaluation: usePerformanceEvaluationStore.getState(),
      organization: useOrganizationStore.getState(),
      settings: useCompanySettingsStore.getState(),
      audit: useAuditStore.getState(),
    },
  };

  return backup;
}

/**
 * JSONバックアップをファイルとしてダウンロード
 */
export function downloadBackupJSON() {
  const backup = exportAllDataAsJSON();
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dandori-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * バックアップデータをリストア
 */
export function restoreFromBackup(backup: BackupData): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // バージョンチェック
    if (backup.version !== '1.0.0') {
      errors.push(`非対応のバージョンです: ${backup.version}`);
      return { success: false, errors };
    }

    // 各ストアにデータをリストア
    try {
      useUserStore.setState(backup.stores.users);
    } catch (e) {
      errors.push('ユーザーデータのリストアに失敗しました');
    }

    try {
      useAttendanceHistoryStore.setState(backup.stores.attendance);
    } catch (e) {
      errors.push('勤怠データのリストアに失敗しました');
    }

    try {
      useLeaveManagementStore.setState(backup.stores.leave);
    } catch (e) {
      errors.push('休暇データのリストアに失敗しました');
    }

    try {
      usePayrollStore.setState(backup.stores.payroll);
    } catch (e) {
      errors.push('給与データのリストアに失敗しました');
    }

    try {
      useWorkflowStore.setState(backup.stores.workflow);
    } catch (e) {
      errors.push('ワークフローデータのリストアに失敗しました');
    }

    try {
      useSaaSStore.setState(backup.stores.saas);
    } catch (e) {
      errors.push('SaaSデータのリストアに失敗しました');
    }

    try {
      usePCStore.setState(backup.stores.pc);
    } catch (e) {
      errors.push('PC資産データのリストアに失敗しました');
    }

    try {
      useVehicleStore.setState(backup.stores.vehicle);
    } catch (e) {
      errors.push('車両データのリストアに失敗しました');
    }

    try {
      usePerformanceEvaluationStore.setState(backup.stores.evaluation);
    } catch (e) {
      errors.push('評価データのリストアに失敗しました');
    }

    try {
      useOrganizationStore.setState(backup.stores.organization);
    } catch (e) {
      errors.push('組織データのリストアに失敗しました');
    }

    try {
      useCompanySettingsStore.setState(backup.stores.settings);
    } catch (e) {
      errors.push('設定データのリストアに失敗しました');
    }

    try {
      useAuditStore.setState(backup.stores.audit);
    } catch (e) {
      errors.push('監査ログのリストアに失敗しました');
    }

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (e) {
    errors.push('バックアップデータの読み込みに失敗しました');
    return { success: false, errors };
  }
}

/**
 * バックアップファイルを読み込んでリストア
 */
export function importBackupFile(file: File): Promise<{ success: boolean; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const backup: BackupData = JSON.parse(jsonString);
        const result = restoreFromBackup(backup);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          errors: ['バックアップファイルの形式が不正です'],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['ファイルの読み込みに失敗しました'],
      });
    };

    reader.readAsText(file);
  });
}

/**
 * 全データをCSV形式でエクスポート（複数ファイル）
 */
export function downloadAllDataAsCSV() {
  // 実装は既存のCSVエクスポート機能を活用
  // 各ストアのデータを個別のCSVファイルとしてZIP圧縮してダウンロード
  // （簡易版として、JSONバックアップを推奨）

  console.warn('CSV一括エクスポートは開発中です。JSONバックアップをご利用ください。');
  downloadBackupJSON();
}

/**
 * バックアップデータの検証
 */
export function validateBackup(backup: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 型ガード: backupがオブジェクトかチェック
  if (typeof backup !== 'object' || backup === null) {
    errors.push('バックアップデータが不正です');
    return { valid: false, errors };
  }

  const data = backup as Record<string, unknown>;

  if (!data.version) {
    errors.push('バージョン情報が見つかりません');
  }

  if (!data.timestamp) {
    errors.push('タイムスタンプが見つかりません');
  }

  if (!data.stores || typeof data.stores !== 'object') {
    errors.push('ストアデータが見つかりません');
  } else {
    const stores = data.stores as Record<string, unknown>;
    const requiredStores = [
      'users',
      'attendance',
      'leave',
      'payroll',
      'workflow',
      'saas',
      'pc',
      'vehicle',
      'evaluation',
      'organization',
      'settings',
      'audit',
    ];

    requiredStores.forEach((store) => {
      if (!stores[store]) {
        errors.push(`${store}データが見つかりません`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * バックアップサイズの取得（MB）
 */
export function getBackupSize(): number {
  const backup = exportAllDataAsJSON();
  const jsonString = JSON.stringify(backup);
  const sizeInBytes = new Blob([jsonString]).size;
  return sizeInBytes / (1024 * 1024); // MB
}
