/**
 * CSV出力ユーティリティ
 * 勤怠・給与・賞与・人事評価データのCSV出力機能
 */

import type { AttendanceRecord, PayrollRecord, BonusRecord, CSVExportResult } from '@/types/csv';
import type { PerformanceEvaluation } from '@/lib/payroll/performance-evaluation-types';
import type { LeaveRequest } from '@/lib/store/leave-management-store';
import type { User } from '@/types';
import type { Vehicle, PCAsset } from '@/types/asset';
import type { SaaSService, LicenseAssignment } from '@/types/saas';
import { exportAudit } from '@/lib/audit/audit-logger';
import {
  getWorkLocationLabel,
  getStatusLabel,
  getApprovalStatusLabel,
  getBonusTypeLabel,
  getLeaveTypeLabel,
  getLeaveStatusLabel,
  getUserStatusLabel,
  getRetirementReasonLabel,
  getAssetStatusLabel,
  getOwnershipTypeLabel,
  getSaaSCategoryLabel,
  getLicenseTypeLabel,
  getLicenseStatusLabel,
  getSecurityRatingLabel,
} from '@/config/labels';

// ===== ヘルパー関数 =====

/**
 * CSVエスケープ処理
 */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * CSV文字列を生成
 */
const generateCSVString = (headers: string[], rows: (string | number)[][]): string => {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map((row) => row.map(escapeCSV).join(',')).join('\n');
  return `${headerRow}\n${dataRows}`;
};

/**
 * CSVファイルをダウンロード
 */
const downloadCSV = (csvString: string, filename: string): void => {
  try {
    // BOM付きUTF-8に変換（Excel対応）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV download failed:', error);
    throw new Error('CSVファイルのダウンロードに失敗しました');
  }
};

/**
 * 現在日付を「YYYY-MM-DD」形式で取得
 */
const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// ===== エクスポート関数 =====

/**
 * 勤怠データをCSV出力
 */
export const exportAttendanceToCSV = (
  records: AttendanceRecord[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '従業員ID',
      '従業員名',
      '日付',
      '出勤時刻',
      '退勤時刻',
      '休憩開始',
      '休憩終了',
      '休憩時間(分)',
      '勤務時間(分)',
      '残業時間(分)',
      '勤務場所',
      'ステータス',
      '承認状況',
      'メモ',
    ];

    const rows = records.map((record) => [
      record.userId,
      record.userName,
      record.date,
      record.checkIn || '',
      record.checkOut || '',
      record.breakStart || '',
      record.breakEnd || '',
      record.totalBreakMinutes,
      record.workMinutes,
      record.overtimeMinutes,
      getWorkLocationLabel(record.workLocation),
      getStatusLabel(record.status),
      getApprovalStatusLabel(record.approvalStatus),
      record.memo || '',
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `attendance_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('勤怠データ', records.length);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export attendance CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '勤怠CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 給与データをCSV出力
 */
export const exportPayrollToCSV = (
  records: PayrollRecord[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '従業員ID',
      '従業員名',
      '部署',
      '支給年月',
      '基本給',
      '手当合計',
      '総支給額',
      '控除合計',
      '差引支給額',
      'ステータス',
      '支払日',
    ];

    const rows = records.map((record) => [
      record.employeeId,
      record.employeeName,
      record.department,
      record.period,
      record.basicSalary,
      record.totalAllowances,
      record.basicSalary + record.totalAllowances,
      record.totalDeductions,
      record.netSalary,
      getStatusLabel(record.status),
      record.paymentDate || '',
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `payroll_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('給与データ', records.length);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export payroll CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '給与CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 賞与データをCSV出力
 */
export const exportBonusToCSV = (
  records: BonusRecord[],
  filename?: string
): CSVExportResult => {
  try {
    if (!records || records.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '従業員ID',
      '従業員名',
      '部署',
      '支給年月',
      '賞与種別',
      '基本賞与',
      '査定賞与',
      '査定評価',
      '控除合計',
      '差引支給額',
      'ステータス',
      '支払日',
    ];

    const rows = records.map((record) => [
      record.employeeId,
      record.employeeName,
      record.department,
      record.period,
      getBonusTypeLabel(record.bonusType),
      record.basicBonus,
      record.performanceBonus,
      record.performanceRating,
      record.totalDeductions,
      record.netBonus,
      getStatusLabel(record.status),
      record.paymentDate || '',
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `bonus_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('賞与データ', records.length);

    return {
      success: true,
      recordCount: records.length,
    };
  } catch (error) {
    console.error('Failed to export bonus CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '賞与CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 人事評価データをCSV出力
 */
export const exportEvaluationToCSV = (
  evaluations: PerformanceEvaluation[],
  filename?: string
): CSVExportResult => {
  try {
    if (!evaluations || evaluations.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const statusLabels = {
      draft: '下書き',
      submitted: '申告済み',
      approved: '承認済み',
      finalized: '確定',
    };

    const headers = [
      '従業員ID',
      '従業員名',
      '部門',
      '役職',
      '年度',
      '期間',
      '総合評価',
      '総合スコア',
      '重み付けスコア',
      '評価者名',
      'ステータス',
      '評価日',
      '業績評価平均',
      '能力評価平均',
      '態度評価平均',
      'リーダーシップ評価平均',
      'チームワーク評価平均',
      '強み',
      '改善点',
      '次期目標',
    ];

    const rows = evaluations.map((evaluation) => {
      // カテゴリ別平均スコアを計算
      const itemsByCategory = evaluation.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof evaluation.items>);

      const categoryAverages = {
        performance: 0,
        competency: 0,
        attitude: 0,
        leadership: 0,
        teamwork: 0,
      };

      Object.entries(itemsByCategory).forEach(([category, items]) => {
        const avgScore = items.reduce((sum, item) => sum + item.score, 0) / items.length;
        categoryAverages[category as keyof typeof categoryAverages] = Math.round(avgScore);
      });

      return [
        evaluation.employeeId,
        evaluation.employeeName,
        evaluation.department,
        evaluation.position,
        evaluation.fiscalYear,
        evaluation.period,
        evaluation.overallRating,
        evaluation.overallScore,
        evaluation.weightedScore,
        evaluation.evaluatorName,
        statusLabels[evaluation.status],
        new Date(evaluation.evaluationDate).toLocaleDateString('ja-JP'),
        categoryAverages.performance || '',
        categoryAverages.competency || '',
        categoryAverages.attitude || '',
        categoryAverages.leadership || '',
        categoryAverages.teamwork || '',
        evaluation.strengths || '',
        evaluation.improvements || '',
        evaluation.goals || '',
      ];
    });

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `evaluation_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('人事評価データ', evaluations.length);

    return {
      success: true,
      recordCount: evaluations.length,
    };
  } catch (error) {
    console.error('Failed to export evaluation CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '人事評価CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 休暇申請データをCSV出力
 */
export const exportLeaveToCSV = (
  requests: LeaveRequest[],
  filename?: string
): CSVExportResult => {
  try {
    if (!requests || requests.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '申請ID',
      '従業員ID',
      '従業員名',
      '休暇種別',
      '開始日',
      '終了日',
      '日数',
      '理由',
      'ステータス',
      '承認者',
      '承認日',
      '却下理由',
      '申請日',
      '更新日',
    ];

    const rows = requests.map((request) => [
      request.id,
      request.userId,
      request.userName,
      getLeaveTypeLabel(request.type),
      request.startDate,
      request.endDate,
      request.days,
      request.reason,
      getLeaveStatusLabel(request.status),
      request.approver || '',
      request.approvedDate || '',
      request.rejectedReason || '',
      request.createdAt,
      request.updatedAt,
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `leave_requests_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('休暇申請データ', requests.length);

    return {
      success: true,
      recordCount: requests.length,
    };
  } catch (error) {
    console.error('Failed to export leave CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '休暇申請CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * ユーザー（従業員）データをCSV出力
 */
export const exportUsersToCSV = (
  users: User[],
  filename?: string
): CSVExportResult => {
  try {
    if (!users || users.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '従業員ID',
      '氏名',
      'メールアドレス',
      '電話番号',
      '部署',
      '役職',
      '入社日',
      'ステータス',
      '退職日',
      '退職理由',
      '役割',
      'タイムゾーン',
    ];

    const rows = users.map((user) => [
      user.id,
      user.name,
      user.email,
      user.phone || '',
      user.department || '',
      user.position || '',
      user.hireDate,
      getUserStatusLabel(user.status),
      user.retiredDate || '',
      getRetirementReasonLabel(user.retirementReason),
      user.roles.join(', '),
      user.timezone || 'Asia/Tokyo',
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `users_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('ユーザーデータ', users.length);

    return {
      success: true,
      recordCount: users.length,
    };
  } catch (error) {
    console.error('Failed to export users CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ユーザーCSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * 車両データをCSV出力
 */
export const exportVehiclesToCSV = (
  vehicles: Vehicle[],
  filename?: string
): CSVExportResult => {
  try {
    if (!vehicles || vehicles.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '車両番号',
      'ナンバープレート',
      'メーカー',
      '車種',
      '年式',
      '割当先',
      '割当日',
      '所有形態',
      'ステータス',
      '車検期限',
      '点検期限',
      '保険期限',
      '現在走行距離',
      'リース契約開始',
      'リース契約終了',
      '月額リース費用',
      'メンテナンス記録数',
    ];

    const rows = vehicles.map((vehicle) => [
      vehicle.vehicleNumber,
      vehicle.licensePlate,
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.assignedTo?.userName || '未割当',
      vehicle.assignedTo?.assignedDate || '',
      getOwnershipTypeLabel(vehicle.ownershipType),
      getAssetStatusLabel(vehicle.status),
      vehicle.inspectionDate,
      vehicle.maintenanceDate,
      vehicle.insuranceDate,
      vehicle.currentMileage || '',
      vehicle.leaseInfo?.contractStart || '',
      vehicle.leaseInfo?.contractEnd || '',
      vehicle.leaseInfo?.monthlyCost || '',
      vehicle.maintenanceRecords.length,
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `vehicles_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('車両データ', vehicles.length);

    return {
      success: true,
      recordCount: vehicles.length,
    };
  } catch (error) {
    console.error('Failed to export vehicles CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '車両CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * PC資産データをCSV出力
 */
export const exportPCAssetsToCSV = (
  pcs: PCAsset[],
  filename?: string
): CSVExportResult => {
  try {
    if (!pcs || pcs.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '資産番号',
      'メーカー',
      '型番',
      'シリアルナンバー',
      'CPU',
      'メモリ',
      'ストレージ',
      'OS',
      '割当先',
      '割当日',
      '所有形態',
      'ステータス',
      '保証期限',
      '購入日',
      '購入価格',
      'リース契約開始',
      'リース契約終了',
      '月額リース費用',
    ];

    const rows = pcs.map((pc) => [
      pc.assetNumber,
      pc.manufacturer,
      pc.model,
      pc.serialNumber,
      pc.cpu,
      pc.memory,
      pc.storage,
      pc.os,
      pc.assignedTo?.userName || '未割当',
      pc.assignedTo?.assignedDate || '',
      getOwnershipTypeLabel(pc.ownershipType),
      getAssetStatusLabel(pc.status),
      pc.warrantyExpiration,
      pc.purchaseDate || '',
      pc.purchasePrice || '',
      pc.leaseInfo?.contractStart || '',
      pc.leaseInfo?.contractEnd || '',
      pc.leaseInfo?.monthlyCost || '',
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `pc_assets_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('PC資産データ', pcs.length);

    return {
      success: true,
      recordCount: pcs.length,
    };
  } catch (error) {
    console.error('Failed to export PC assets CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PC資産CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * SaaSサービスデータをCSV出力
 */
export const exportSaaSServicesToCSV = (
  services: SaaSService[],
  filename?: string
): CSVExportResult => {
  try {
    if (!services || services.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      'サービスID',
      'サービス名',
      'カテゴリ',
      'ベンダー',
      'ライセンスタイプ',
      '公式サイト',
      '管理者メール',
      '契約開始日',
      '契約終了日',
      '自動更新',
      'SSO対応',
      'MFA対応',
      'セキュリティ評価',
      'アクティブ',
    ];

    const rows = services.map((service) => [
      service.id,
      service.name,
      getSaaSCategoryLabel(service.category),
      service.vendor,
      getLicenseTypeLabel(service.licenseType),
      service.website,
      service.adminEmail || '',
      service.contractStartDate || '',
      service.contractEndDate || '',
      service.autoRenew ? '有効' : '無効',
      service.ssoEnabled ? '対応' : '未対応',
      service.mfaEnabled ? '対応' : '未対応',
      getSecurityRatingLabel(service.securityRating),
      service.isActive ? 'はい' : 'いいえ',
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `saas_services_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('SaaSサービスデータ', services.length);

    return {
      success: true,
      recordCount: services.length,
    };
  } catch (error) {
    console.error('Failed to export SaaS services CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SaaSサービスCSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

/**
 * ライセンス割り当てデータをCSV出力
 */
export const exportLicenseAssignmentsToCSV = (
  assignments: LicenseAssignment[],
  filename?: string
): CSVExportResult => {
  try {
    if (!assignments || assignments.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '割り当てID',
      'サービス名',
      'プラン名',
      'ユーザー名',
      'メールアドレス',
      '部署名',
      'ステータス',
      '割り当て日',
      '最終使用日',
      '月次使用回数',
      '削除日',
      'メモ',
    ];

    const rows = assignments.map((assignment) => [
      assignment.id,
      assignment.serviceName,
      assignment.planName,
      assignment.userName || '',
      assignment.userEmail || '',
      assignment.departmentName || '',
      getLicenseStatusLabel(assignment.status),
      assignment.assignedDate,
      assignment.lastUsedAt || '',
      assignment.usageCount || 0,
      assignment.revokedDate || '',
      assignment.notes || '',
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `license_assignments_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    // 監査ログ記録
    exportAudit.csv('ライセンス割り当てデータ', assignments.length);

    return {
      success: true,
      recordCount: assignments.length,
    };
  } catch (error) {
    console.error('Failed to export license assignments CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ライセンス割り当てCSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};
