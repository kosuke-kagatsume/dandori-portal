/**
 * CSV出力 — 資産管理（車両・PC・SaaS・ライセンス）
 */

import type { CSVExportResult } from '@/types/csv';
import type { Vehicle, PCAsset } from '@/types/asset';
import type { SaaSService, LicenseAssignment } from '@/types/saas';
import {
  getAssetStatusLabel, getOwnershipTypeLabel,
  getSaaSCategoryLabel, getLicenseTypeLabel, getLicenseStatusLabel, getSecurityRatingLabel,
} from '@/config/labels';
import { exportCSV, emptyResult, errorResult, getCurrentDate } from './csv-helpers';

export const exportVehiclesToCSV = (
  vehicles: Vehicle[],
  filename?: string
): CSVExportResult => {
  try {
    if (!vehicles || vehicles.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '車両番号', 'ナンバープレート', 'メーカー', '車種', '年式',
      '割当先', '割当日', '所有形態', 'ステータス', '車検期限',
      '点検期限', '保険期限', '現在走行距離',
      'リース契約開始', 'リース契約終了', '月額リース費用', 'メンテナンス記録数',
    ];

    const rows = vehicles.map((v) => [
      v.vehicleNumber, v.licensePlate, v.make, v.model, v.year,
      v.assignedTo?.userName || '未割当', v.assignedTo?.assignedDate || '',
      getOwnershipTypeLabel(v.ownershipType), getAssetStatusLabel(v.status),
      v.inspectionDate, v.maintenanceDate, v.insuranceDate, v.currentMileage || '',
      v.leaseInfo?.contractStart || '', v.leaseInfo?.contractEnd || '',
      v.leaseInfo?.monthlyCost || '', v.maintenanceRecords.length,
    ]);

    return exportCSV(headers, rows, `vehicles_${getCurrentDate()}.csv`, '車両データ', filename);
  } catch (error) {
    console.error('Failed to export vehicles CSV:', error);
    return errorResult(error, '車両CSVの出力に失敗しました');
  }
};

export const exportPCAssetsToCSV = (
  pcs: PCAsset[],
  filename?: string
): CSVExportResult => {
  try {
    if (!pcs || pcs.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '資産番号', 'メーカー', '型番', 'シリアルナンバー', 'CPU', 'メモリ', 'ストレージ', 'OS',
      '割当先', '割当日', '所有形態', 'ステータス', '保証期限',
      '購入日', '購入価格', 'リース契約開始', 'リース契約終了', '月額リース費用',
    ];

    const rows = pcs.map((pc) => [
      pc.assetNumber, pc.manufacturer, pc.model, pc.serialNumber,
      pc.cpu, pc.memory, pc.storage, pc.os,
      pc.assignedTo?.userName || '未割当', pc.assignedTo?.assignedDate || '',
      getOwnershipTypeLabel(pc.ownershipType), getAssetStatusLabel(pc.status),
      pc.warrantyExpiration, pc.purchaseDate || '', pc.purchaseCost ?? '',
      pc.leaseInfo?.contractStart || '', pc.leaseInfo?.contractEnd || '',
      pc.leaseInfo?.monthlyCost || '',
    ]);

    return exportCSV(headers, rows, `pc_assets_${getCurrentDate()}.csv`, 'PC資産データ', filename);
  } catch (error) {
    console.error('Failed to export PC assets CSV:', error);
    return errorResult(error, 'PC資産CSVの出力に失敗しました');
  }
};

export const exportSaaSServicesToCSV = (
  services: SaaSService[],
  filename?: string
): CSVExportResult => {
  try {
    if (!services || services.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      'サービスID', 'サービス名', 'カテゴリ', 'ベンダー', 'ライセンスタイプ',
      '公式サイト', '管理者メール', '契約開始日', '契約終了日', '自動更新',
      'SSO対応', 'MFA対応', 'セキュリティ評価', 'アクティブ',
    ];

    const rows = services.map((s) => [
      s.id, s.name, getSaaSCategoryLabel(s.category), s.vendor,
      getLicenseTypeLabel(s.licenseType), s.website, s.adminEmail || '',
      s.contractStartDate || '', s.contractEndDate || '',
      s.autoRenew ? '有効' : '無効', s.ssoEnabled ? '対応' : '未対応',
      s.mfaEnabled ? '対応' : '未対応', getSecurityRatingLabel(s.securityRating),
      s.isActive ? 'はい' : 'いいえ',
    ]);

    return exportCSV(headers, rows, `saas_services_${getCurrentDate()}.csv`, 'SaaSサービスデータ', filename);
  } catch (error) {
    console.error('Failed to export SaaS services CSV:', error);
    return errorResult(error, 'SaaSサービスCSVの出力に失敗しました');
  }
};

export const exportLicenseAssignmentsToCSV = (
  assignments: LicenseAssignment[],
  filename?: string
): CSVExportResult => {
  try {
    if (!assignments || assignments.length === 0) return emptyResult('エクスポートするデータがありません');

    const headers = [
      '割り当てID', 'サービス名', 'プラン名', 'ユーザー名', 'メールアドレス',
      '部署名', 'ステータス', '割り当て日', '最終使用日', '月次使用回数', '削除日', 'メモ',
    ];

    const rows = assignments.map((a) => [
      a.id, a.serviceName, a.planName, a.userName || '', a.userEmail || '',
      a.departmentName || '', getLicenseStatusLabel(a.status),
      a.assignedDate, a.lastUsedAt || '', a.usageCount || 0,
      a.revokedDate || '', a.notes || '',
    ] as (string | number)[]);

    return exportCSV(headers, rows, `license_assignments_${getCurrentDate()}.csv`, 'ライセンス割り当てデータ', filename);
  } catch (error) {
    console.error('Failed to export license assignments CSV:', error);
    return errorResult(error, 'ライセンス割り当てCSVの出力に失敗しました');
  }
};
