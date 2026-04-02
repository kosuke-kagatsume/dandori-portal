/**
 * 資産管理 — 期限警告計算ロジック
 *
 * 車両・PC・その他資産の期限(車検、点検、保証、リース等)を
 * 一括で走査し、警告レベル付きで返す。
 */

import { type VehicleFromAPI } from '@/hooks/use-vehicles-api';
import { type PCAssetFromAPI } from '@/hooks/use-pc-assets-api';
import { type GeneralAssetFromAPI } from '@/hooks/use-general-assets-api';

// ── 型定義 ──────────────────────────────────

export type WarningItem = {
  id: string;
  assetId: string;
  assetName: string;
  assetCategory: 'vehicle' | 'pc' | 'general';
  deadlineType: 'inspection' | 'maintenance' | 'tireChange' | 'contract' | 'warranty' | 'lease';
  deadlineDate: string;
  daysRemaining: number;
  level: 'critical' | 'warning' | 'info';
};

// ── ヘルパー ──────────────────────────────────

function daysUntil(dateString: string, now: Date): number {
  return Math.ceil((new Date(dateString).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function levelByDays(days: number, criticalThreshold = 30, warningThreshold = 60): WarningItem['level'] {
  if (days <= criticalThreshold) return 'critical';
  if (days <= warningThreshold) return 'warning';
  return 'info';
}

// ── 車両の期限警告 ──────────────────────────────────

function vehicleWarnings(vehicleList: VehicleFromAPI[], now: Date): WarningItem[] {
  const items: WarningItem[] = [];

  vehicleList.forEach((vehicle) => {
    const name = `${vehicle.vehicleNumber} (${vehicle.make} ${vehicle.model})`;

    // 車検期限
    if (vehicle.inspectionDate) {
      const days = daysUntil(vehicle.inspectionDate, now);
      if (days <= 60) {
        items.push({
          id: `${vehicle.id}-inspection`,
          assetId: vehicle.id,
          assetName: name,
          assetCategory: 'vehicle',
          deadlineType: 'inspection',
          deadlineDate: vehicle.inspectionDate,
          daysRemaining: days,
          level: levelByDays(days),
        });
      }
    }

    // 点検期限
    if (vehicle.maintenanceDate) {
      const days = daysUntil(vehicle.maintenanceDate, now);
      if (days <= 60) {
        items.push({
          id: `${vehicle.id}-maintenance`,
          assetId: vehicle.id,
          assetName: name,
          assetCategory: 'vehicle',
          deadlineType: 'maintenance',
          deadlineDate: vehicle.maintenanceDate,
          daysRemaining: days,
          level: levelByDays(days),
        });
      }
    }

    // タイヤ履き替え期限
    if (vehicle.tireChangeDate) {
      const days = daysUntil(vehicle.tireChangeDate, now);
      if (days <= 60) {
        const nextTireType = vehicle.currentTireType === 'winter' ? '夏タイヤ' : '冬タイヤ';
        items.push({
          id: `${vehicle.id}-tireChange`,
          assetId: vehicle.id,
          assetName: `${name} → ${nextTireType}`,
          assetCategory: 'vehicle',
          deadlineType: 'tireChange',
          deadlineDate: vehicle.tireChangeDate,
          daysRemaining: days,
          level: levelByDays(days),
        });
      }
    }

    // リース終了期限
    if (vehicle.ownershipType === 'leased' && vehicle.leaseEndDate) {
      const days = daysUntil(vehicle.leaseEndDate, now);
      if (days <= 90) {
        items.push({
          id: `${vehicle.id}-lease`,
          assetId: vehicle.id,
          assetName: name,
          assetCategory: 'vehicle',
          deadlineType: 'lease',
          deadlineDate: vehicle.leaseEndDate,
          daysRemaining: days,
          level: levelByDays(days, 30, 60),
        });
      }
    }
  });

  return items;
}

// ── PC資産の期限警告 ──────────────────────────────────

function pcWarnings(pcList: PCAssetFromAPI[], now: Date): WarningItem[] {
  const items: WarningItem[] = [];

  pcList.forEach((pc) => {
    const name = `${pc.assetNumber} (${pc.manufacturer} ${pc.model})`;

    // 保証期限
    if (pc.warrantyExpiration) {
      const days = daysUntil(pc.warrantyExpiration, now);
      if (days <= 90) {
        items.push({
          id: `${pc.id}-warranty`,
          assetId: pc.id,
          assetName: name,
          assetCategory: 'pc',
          deadlineType: 'warranty',
          deadlineDate: pc.warrantyExpiration,
          daysRemaining: days,
          level: levelByDays(days, 30, 60),
        });
      }
    }

    // リース終了期限
    if (pc.ownershipType === 'leased' && pc.leaseEndDate) {
      const days = daysUntil(pc.leaseEndDate, now);
      if (days <= 90) {
        items.push({
          id: `${pc.id}-lease`,
          assetId: pc.id,
          assetName: name,
          assetCategory: 'pc',
          deadlineType: 'lease',
          deadlineDate: pc.leaseEndDate,
          daysRemaining: days,
          level: levelByDays(days, 30, 60),
        });
      }
    }
  });

  return items;
}

// ── その他資産の期限警告 ──────────────────────────────────

function generalWarnings(generalList: GeneralAssetFromAPI[], now: Date): WarningItem[] {
  const items: WarningItem[] = [];

  generalList.forEach((asset) => {
    const name = `${asset.assetNumber} (${asset.name})`;

    // 保証期限
    if (asset.warrantyExpiration) {
      const days = daysUntil(asset.warrantyExpiration, now);
      if (days <= 90) {
        items.push({
          id: `${asset.id}-warranty`,
          assetId: asset.id,
          assetName: name,
          assetCategory: 'general',
          deadlineType: 'warranty',
          deadlineDate: asset.warrantyExpiration,
          daysRemaining: days,
          level: levelByDays(days, 30, 60),
        });
      }
    }

    // リース終了期限
    if (asset.ownershipType === 'leased' && asset.leaseEndDate) {
      const days = daysUntil(asset.leaseEndDate, now);
      if (days <= 90) {
        items.push({
          id: `${asset.id}-lease`,
          assetId: asset.id,
          assetName: name,
          assetCategory: 'general',
          deadlineType: 'lease',
          deadlineDate: asset.leaseEndDate,
          daysRemaining: days,
          level: levelByDays(days, 30, 60),
        });
      }
    }
  });

  return items;
}

// ── 公開API ──────────────────────────────────

export function getAllDeadlineWarnings(
  vehicleList: VehicleFromAPI[],
  pcList: PCAssetFromAPI[],
  generalList: GeneralAssetFromAPI[],
): WarningItem[] {
  const now = new Date();
  return [
    ...vehicleWarnings(vehicleList, now),
    ...pcWarnings(pcList, now),
    ...generalWarnings(generalList, now),
  ].sort((a, b) => a.daysRemaining - b.daysRemaining);
}
