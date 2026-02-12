/**
 * CSV import/export utilities for scheduled changes
 */

import type { ScheduledChange, ScheduledChangeType, ScheduledChangeStatus, HireDetails, TransferDetails, RetirementDetails } from '@/lib/store/scheduled-changes-store';
import { changeTypeLabels, changeStatusLabels, approvalStatusLabels } from '@/lib/store/scheduled-changes-store';
import type { CSVExportResult } from '@/types/csv';

// ===== ヘルパー関数 =====

/**
 * CSVエスケープ処理
 */
const escapeCSV = (value: string | number | boolean | null | undefined): string => {
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

/**
 * 詳細情報を文字列に変換
 */
const detailsToString = (change: ScheduledChange): string => {
  switch (change.type) {
    case 'hire': {
      const details = change.details as HireDetails;
      return `氏名:${details.name}, メール:${details.email}, 部署:${details.department}, 役職:${details.position}, 権限:${details.role}, 社員番号:${details.employeeNumber || 'なし'}`;
    }
    case 'transfer': {
      const details = change.details as TransferDetails;
      return `現部署:${details.currentDepartment}, 新部署:${details.newDepartment}, 現役職:${details.currentPosition}, 新役職:${details.newPosition}, 理由:${details.reason || 'なし'}`;
    }
    case 'retirement': {
      const details = change.details as RetirementDetails;
      const reasonLabels: Record<string, string> = {
        voluntary: '自己都合退職',
        company: '会社都合退職',
        contract_end: '契約期間満了',
        retirement_age: '定年退職',
        other: 'その他',
      };
      return `退職理由:${reasonLabels[details.retirementReason]}, 備考:${details.notes || 'なし'}`;
    }
    default:
      return '';
  }
};

// ===== エクスポート関数 =====

/**
 * 予約データをCSV出力
 */
export const exportScheduledChangesToCSV = (
  changes: ScheduledChange[],
  filename?: string
): CSVExportResult => {
  try {
    if (!changes || changes.length === 0) {
      return {
        success: false,
        error: 'エクスポートするデータがありません',
        recordCount: 0,
      };
    }

    const headers = [
      '予約ID',
      '予約タイプ',
      '対象ユーザーID',
      '対象ユーザー名',
      '有効日',
      'ステータス',
      '作成者ID',
      '作成者名',
      '承認必要',
      '承認ステータス',
      'ワークフローID',
      '承認者ID',
      '承認者名',
      '承認日時',
      '却下理由',
      '作成日時',
      '更新日時',
      '詳細情報',
    ];

    const rows = changes.map((change) => [
      change.id,
      changeTypeLabels[change.type],
      change.userId || '',
      change.userName || '',
      change.effectiveDate,
      changeStatusLabels[change.status],
      change.createdBy,
      change.createdByName,
      change.requiresApproval ? 'はい' : 'いいえ',
      change.approvalStatus ? approvalStatusLabels[change.approvalStatus] : '',
      change.workflowId || '',
      change.approvedBy || '',
      change.approvedByName || '',
      change.approvedAt || '',
      change.rejectionReason || '',
      change.createdAt,
      change.updatedAt,
      detailsToString(change),
    ]);

    const csvString = generateCSVString(headers, rows);
    const defaultFilename = `scheduled_changes_${getCurrentDate()}.csv`;
    downloadCSV(csvString, filename || defaultFilename);

    return {
      success: true,
      recordCount: changes.length,
    };
  } catch (error) {
    console.error('Failed to export scheduled changes CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '予約管理CSVの出力に失敗しました',
      recordCount: 0,
    };
  }
};

// ===== インポート関数 =====

/**
 * CSVファイルを読み込んでパース
 */
export const parseScheduledChangesCSV = (file: File): Promise<ScheduledChange[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          reject(new Error('ファイルが空です'));
          return;
        }

        // BOM削除
        const content = text.replace(/^\uFEFF/, '');
        const lines = content.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error('データが不足しています（ヘッダーとデータ行が必要です）'));
          return;
        }

        // ヘッダーを解析
        const headers = parseCSVLine(lines[0]);

        // データ行を解析
        const changes: ScheduledChange[] = [];
        const typeReverseMap: Record<string, ScheduledChangeType> = {
          '入社': 'hire',
          '異動': 'transfer',
          '退職': 'retirement',
        };
        const statusReverseMap: Record<string, ScheduledChangeStatus> = {
          '予約中': 'pending',
          '適用済み': 'applied',
          'キャンセル': 'cancelled',
        };

        for (let i = 1; i < lines.length; i++) {
          try {
            const values = parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;

            const change: ScheduledChange = {
              id: values[0] || `import-${Date.now()}-${i}`,
              type: typeReverseMap[values[1]] || 'hire',
              userId: values[2] || undefined,
              userName: values[3] || undefined,
              effectiveDate: values[4],
              status: statusReverseMap[values[5]] || 'pending',
              createdBy: values[6],
              createdByName: values[7],
              requiresApproval: values[8] === 'はい',
              approvalStatus: values[9] ? getApprovalStatusFromLabel(values[9]) : undefined,
              workflowId: values[10] || undefined,
              approvedBy: values[11] || undefined,
              approvedByName: values[12] || undefined,
              approvedAt: values[13] || undefined,
              rejectionReason: values[14] || undefined,
              createdAt: values[15] || new Date().toISOString(),
              updatedAt: values[16] || new Date().toISOString(),
              details: parseDetailsFromString(values[17] || '', typeReverseMap[values[1]] || 'hire'),
            };

            changes.push(change);
          } catch (error) {
            console.warn(`Row ${i + 1} のパースに失敗しました:`, error);
          }
        }

        if (changes.length === 0) {
          reject(new Error('有効なデータが見つかりませんでした'));
          return;
        }

        resolve(changes);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * CSV行をパース（カンマ区切り、ダブルクォート対応）
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされたダブルクォート
        current += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // フィールドの区切り
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // 最後のフィールドを追加
  result.push(current);

  return result;
};

/**
 * 承認ステータスラベルから値を取得
 */
const getApprovalStatusFromLabel = (label: string) => {
  const reverseMap: Record<string, 'not_required' | 'pending_approval' | 'approved' | 'rejected'> = {
    '承認不要': 'not_required',
    '承認待ち': 'pending_approval',
    '承認済み': 'approved',
    '却下': 'rejected',
  };
  return reverseMap[label];
};

/**
 * 詳細情報文字列をパース
 */
const parseDetailsFromString = (
  detailsStr: string,
  type: ScheduledChangeType
): HireDetails | TransferDetails | RetirementDetails => {
  const parts = detailsStr.split(', ').reduce((acc, part) => {
    const [key, value] = part.split(':');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);

  switch (type) {
    case 'hire':
      return {
        name: parts['氏名'] || '',
        email: parts['メール'] || '',
        department: parts['部署'] || '',
        position: parts['役職'] || '',
        role: (parts['権限'] as 'employee' | 'manager' | 'hr' | 'admin') || 'employee',
        employeeNumber: parts['社員番号'] !== 'なし' ? parts['社員番号'] : undefined,
      } as HireDetails;

    case 'transfer':
      return {
        currentDepartment: parts['現部署'] || '',
        newDepartment: parts['新部署'] || '',
        currentPosition: parts['現役職'] || '',
        newPosition: parts['新役職'] || '',
        reason: parts['理由'] !== 'なし' ? parts['理由'] : undefined,
      } as TransferDetails;

    case 'retirement': {
      const reasonReverseMap: Record<string, 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other'> = {
        '自己都合退職': 'voluntary',
        '会社都合退職': 'company',
        '契約期間満了': 'contract_end',
        '定年退職': 'retirement_age',
        'その他': 'other',
      };
      return {
        retirementReason: reasonReverseMap[parts['退職理由']] || 'voluntary',
        notes: parts['備考'] !== 'なし' ? parts['備考'] : undefined,
      } as RetirementDetails;
    }

    default:
      return {} as HireDetails;
  }
};

/**
 * インポートデータのバリデーション
 */
export const validateScheduledChanges = (changes: ScheduledChange[]): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  changes.forEach((change, index) => {
    const rowNum = index + 2; // ヘッダー行を除く

    // 必須フィールドのチェック
    if (!change.effectiveDate) {
      errors.push(`行${rowNum}: 有効日が必要です`);
    }
    if (!change.createdBy) {
      errors.push(`行${rowNum}: 作成者IDが必要です`);
    }
    if (!change.createdByName) {
      errors.push(`行${rowNum}: 作成者名が必要です`);
    }

    // 日付形式のチェック
    if (change.effectiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(change.effectiveDate)) {
      errors.push(`行${rowNum}: 有効日の形式が不正です（YYYY-MM-DD形式で指定してください）`);
    }

    // タイプ別の詳細情報チェック
    if (change.type === 'hire') {
      const details = change.details as HireDetails;
      if (!details.name) errors.push(`行${rowNum}: 氏名が必要です`);
      if (!details.email) errors.push(`行${rowNum}: メールアドレスが必要です`);
      if (!details.department) errors.push(`行${rowNum}: 部署が必要です`);
      if (!details.position) errors.push(`行${rowNum}: 役職が必要です`);
    } else if (change.type === 'transfer') {
      const details = change.details as TransferDetails;
      if (!details.newDepartment) errors.push(`行${rowNum}: 新部署が必要です`);
      if (!details.newPosition) errors.push(`行${rowNum}: 新役職が必要です`);
    } else if (change.type === 'retirement') {
      const details = change.details as RetirementDetails;
      if (!details.retirementReason) errors.push(`行${rowNum}: 退職理由が必要です`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
