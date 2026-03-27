'use client';

import { useUserStore } from '@/lib/store/user-store';

export function useHealthRBAC() {
  const currentUser = useUserStore(state => state.currentUser);
  const roles = currentUser?.roles || [];

  const isHR = roles.includes('hr');
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const isExecutive = roles.includes('executive');

  // hr/admin: 全データ閲覧・マスタ管理可
  const canViewAllEmployees = isHR || isAdmin || isExecutive;

  // manager: 自部署のみ閲覧
  const canViewDepartmentEmployees = isManager;

  // マスタ管理権限（hr/adminのみ）
  const canManageMaster = isHR || isAdmin;

  // 結果登録権限（hr/adminのみ）
  const canRegisterResults = isHR || isAdmin;

  // フォローアップ管理権限（hr/admin/manager）
  const canManageFollowUp = isHR || isAdmin || isManager;

  // 自分のデータのみ閲覧（employee）
  const selfOnly = !canViewAllEmployees && !canViewDepartmentEmployees;

  // ストレスチェック閲覧スコープ（G-3）
  const stressCheckViewScope: 'all' | 'department' | 'self' =
    (isExecutive || isHR) ? 'all' :
    isManager ? 'department' :
    'self';

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
    stressCheckViewScope,
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
