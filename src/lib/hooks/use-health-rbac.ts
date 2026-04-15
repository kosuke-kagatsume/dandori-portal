'use client';

import { useUserStore } from '@/lib/store/user-store';

export function useHealthRBAC() {
  const currentUser = useUserStore(state => state.currentUser);
  const roles = currentUser?.roles || [];

  const isHR = roles.includes('hr');
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const isExecutive = roles.includes('executive');

  // hr: 全データ閲覧・マスタ管理可
  const canViewAllEmployees = isHR;

  // manager: 自部署のみ閲覧
  const canViewDepartmentEmployees = isManager;

  // admin/executive: 健康管理は予定タブ（自分の予定）のみ
  const scheduleOnly = (isAdmin || isExecutive) && !isHR;

  // マスタ管理権限（hrのみ）
  const canManageMaster = isHR;

  // 結果登録権限（hrのみ）
  const canRegisterResults = isHR;

  // フォローアップ管理権限（hr/manager）
  const canManageFollowUp = isHR || isManager;

  // 自分のデータのみ閲覧（employee, admin, executive）
  const selfOnly = !canViewAllEmployees && !canViewDepartmentEmployees;

  // レポート権限（I-3）
  const canViewReports = isExecutive || isHR;
  const canDownloadReports = isHR;

  // 予定管理権限
  const canManageSchedules = isHR;

  // 現在のユーザーの部署
  const userDepartment = currentUser?.department || '';
  const userId = currentUser?.id || '';

  return {
    canViewAllEmployees,
    canViewDepartmentEmployees,
    canManageMaster,
    canRegisterResults,
    canManageFollowUp,
    selfOnly,
    scheduleOnly,
    canViewReports,
    canDownloadReports,
    canManageSchedules,
    userDepartment,
    userId,
    isHR,
    isAdmin,
    isManager,
    isExecutive,
  };
}
