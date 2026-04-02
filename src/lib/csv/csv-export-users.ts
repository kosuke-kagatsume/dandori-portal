/**
 * CSV出力 — ユーザー（従業員）
 */

import type { CSVExportResult } from '@/types/csv';
import type { User } from '@/types';
import { getUserStatusLabel, getRetirementReasonLabel } from '@/config/labels';
import { exportCSV, emptyResult, errorResult, getCurrentDate } from './csv-helpers';

const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export const exportUsersToCSV = (
  users: User[],
  filename?: string
): CSVExportResult => {
  try {
    if (!users || users.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '従業員ID', '※社員番号', '※氏名', 'フリガナ', '※メールアドレス',
      '電話番号', '※部署', '※役職', '雇用形態', '入社日', '生年月日',
      '性別', '郵便番号', '住所', 'ステータス', '退職日', '退職理由', '※役割', '招待',
    ];

    const rows = users.map((u) => [
      u.id, u.employeeNumber || '', u.name, u.nameKana || '', u.email,
      u.phone || '', u.department || '', u.position || '', u.employmentType || '',
      formatDate(u.hireDate), formatDate(u.birthDate), u.gender || '',
      u.postalCode || '', u.address || '', getUserStatusLabel(u.status),
      formatDate(u.retiredDate), getRetirementReasonLabel(u.retirementReason),
      u.roles.join(', '), '',
    ]);

    return exportCSV(headers, rows, `users_${getCurrentDate()}.csv`, 'ユーザーデータ', filename);
  } catch (error) {
    console.error('Failed to export users CSV:', error);
    return errorResult(error, 'ユーザーCSVの出力に失敗しました');
  }
};
