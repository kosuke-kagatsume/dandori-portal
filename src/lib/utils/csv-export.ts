/**
 * CSV export utilities for SaaS management
 */

import type { LicenseAssignment, SaaSService, LicensePlan } from '@/types/saas';

// SaaS詳細情報の型定義
export interface UserSaaSDetail {
  assignment: LicenseAssignment;
  service: SaaSService;
  plan: LicensePlan;
  monthlyCost: number;
}

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: Record<string, unknown>[], headers: string[]): string {
  const headerRow = headers.join(',');
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export user SaaS usage to CSV
 */
export interface UserSaaSExportData {
  ユーザー名: string;
  メールアドレス: string;
  部門: string;
  サービス名: string;
  カテゴリ: string;
  プラン名: string;
  ステータス: string;
  月額コスト: number;
  年額コスト: number;
  割り当て日: string;
  最終利用日: string;
}

export function exportUserSaaSToCSV(
  userName: string,
  userEmail: string,
  userDepartment: string,
  saasDetails: UserSaaSDetail[]
): void {
  const data: UserSaaSExportData[] = saasDetails.map((detail) => ({
    ユーザー名: userName,
    メールアドレス: userEmail,
    部門: userDepartment || '-',
    サービス名: detail.service.name,
    カテゴリ: String(detail.service.category),
    プラン名: detail.plan.planName,
    ステータス: detail.assignment.status === 'active' ? 'アクティブ' : '非アクティブ',
    月額コスト: detail.monthlyCost,
    年額コスト: detail.monthlyCost * 12,
    割り当て日: detail.assignment.assignedAt
      ? new Date(detail.assignment.assignedAt).toLocaleDateString('ja-JP')
      : '-',
    最終利用日: detail.assignment.lastUsedAt
      ? new Date(detail.assignment.lastUsedAt).toLocaleDateString('ja-JP')
      : '-',
  }));

  const headers = [
    'ユーザー名',
    'メールアドレス',
    '部門',
    'サービス名',
    'カテゴリ',
    'プラン名',
    'ステータス',
    '月額コスト',
    '年額コスト',
    '割り当て日',
    '最終利用日',
  ];

  const csv = convertToCSV(data as unknown as Record<string, unknown>[], headers);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `SaaS利用状況_${userName}_${timestamp}.csv`);
}

/**
 * Export all users' SaaS usage to CSV
 */
export interface AllUsersSaaSExportData {
  ユーザー名: string;
  メールアドレス: string;
  部門: string;
  役職: string;
  月額コスト合計: number;
  年額コスト合計: number;
  利用サービス数: number;
}

export function exportAllUsersSaaSToCSV(
  usersData: Array<{
    name: string;
    email: string;
    department?: string;
    role?: string;
    totalCost: number;
    serviceCount: number;
  }>
): void {
  const data: AllUsersSaaSExportData[] = usersData.map((user) => ({
    ユーザー名: user.name,
    メールアドレス: user.email,
    部門: user.department || '-',
    役職: user.role || '-',
    月額コスト合計: user.totalCost,
    年額コスト合計: user.totalCost * 12,
    利用サービス数: user.serviceCount,
  }));

  const headers = [
    'ユーザー名',
    'メールアドレス',
    '部門',
    '役職',
    '月額コスト合計',
    '年額コスト合計',
    '利用サービス数',
  ];

  const csv = convertToCSV(data as unknown as Record<string, unknown>[], headers);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `SaaS利用状況_全ユーザー_${timestamp}.csv`);
}

/**
 * Export detailed user SaaS list to CSV (with all service details)
 */
export interface DetailedUserSaaSExportData {
  ユーザー名: string;
  メールアドレス: string;
  部門: string;
  サービス名: string;
  ベンダー: string;
  カテゴリ: string;
  プラン名: string;
  ライセンスタイプ: string;
  ステータス: string;
  月額コスト: number;
  年額コスト: number;
  割り当て日: string;
  最終利用日: string;
}

export function exportDetailedAllUsersSaaSToCSV(
  allUsersDetails: Array<{
    userName: string;
    userEmail: string;
    userDepartment?: string;
    saasDetails: Array<{
      assignment: {
        status: string;
        assignedAt: string;
        lastUsedAt?: string;
      };
      service: {
        name: string;
        vendor: string;
        category: string;
        licenseType: string;
      };
      plan: {
        planName: string;
      };
      monthlyCost: number;
    }>;
  }>
): void {
  const data: DetailedUserSaaSExportData[] = [];

  allUsersDetails.forEach((user) => {
    user.saasDetails.forEach((detail) => {
      data.push({
        ユーザー名: user.userName,
        メールアドレス: user.userEmail,
        部門: user.userDepartment || '-',
        サービス名: detail.service.name,
        ベンダー: detail.service.vendor,
        カテゴリ: detail.service.category,
        プラン名: detail.plan.planName,
        ライセンスタイプ: detail.service.licenseType,
        ステータス: detail.assignment.status === 'active' ? 'アクティブ' : '非アクティブ',
        月額コスト: detail.monthlyCost,
        年額コスト: detail.monthlyCost * 12,
        割り当て日: new Date(detail.assignment.assignedAt).toLocaleDateString('ja-JP'),
        最終利用日: detail.assignment.lastUsedAt
          ? new Date(detail.assignment.lastUsedAt).toLocaleDateString('ja-JP')
          : '-',
      });
    });
  });

  const headers = [
    'ユーザー名',
    'メールアドレス',
    '部門',
    'サービス名',
    'ベンダー',
    'カテゴリ',
    'プラン名',
    'ライセンスタイプ',
    'ステータス',
    '月額コスト',
    '年額コスト',
    '割り当て日',
    '最終利用日',
  ];

  const csv = convertToCSV(data as unknown as Record<string, unknown>[], headers);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `SaaS利用状況_詳細_${timestamp}.csv`);
}
