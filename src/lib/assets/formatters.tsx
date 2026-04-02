/**
 * 資産管理 — 共通フォーマッター・バッジ・ラベル
 */

import { Badge } from '@/components/ui/badge';
import { Car, Laptop, Monitor } from 'lucide-react';
import { ASSET_CATEGORIES, REPAIR_TYPES } from '@/hooks/use-general-assets-api';

// ── 日付・通貨 ──────────────────────────────────

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

export function calculateDaysRemaining(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ── ステータスバッジ ──────────────────────────────────

export function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    maintenance: 'secondary',
    retired: 'outline',
  };
  const labels: Record<string, string> = {
    active: '稼働中',
    maintenance: '整備中',
    retired: '廃車',
  };
  return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
}

// ── 所有形態バッジ ──────────────────────────────────

export function getOwnershipBadge(type: string) {
  const labels: Record<string, string> = {
    owned: '自己所有',
    leased: 'リース',
    rental: 'レンタル',
  };
  return <Badge variant="outline">{labels[type] || type}</Badge>;
}

// ── 期限レベルバッジ ──────────────────────────────────

export function getWarningLevelBadge(level: 'critical' | 'warning' | 'info') {
  const variants: Record<string, 'destructive' | 'secondary' | 'outline'> = {
    critical: 'destructive',
    warning: 'secondary',
    info: 'outline',
  };
  const labels: Record<string, string> = {
    critical: '緊急',
    warning: '注意',
    info: '情報',
  };
  return <Badge variant={variants[level]}>{labels[level]}</Badge>;
}

// ── ラベル取得 ──────────────────────────────────

export function getDeadlineTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    inspection: '車検',
    maintenance: '点検',
    tireChange: 'タイヤ履き替え',
    contract: 'リース契約',
    warranty: '保証期限',
    lease: 'リース終了',
  };
  return labels[type] || type;
}

export function getAssetCategoryLabel(category: 'vehicle' | 'pc' | 'general'): string {
  const labels: Record<string, string> = {
    vehicle: '車両',
    pc: 'PC',
    general: 'その他',
  };
  return labels[category] || category;
}

export function getAssetCategoryBadge(category: 'vehicle' | 'pc' | 'general') {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    vehicle: 'default',
    pc: 'secondary',
    general: 'outline',
  };
  return (
    <Badge variant={variants[category]}>
      {category === 'vehicle' && <Car className="mr-1 h-3 w-3" />}
      {category === 'pc' && <Laptop className="mr-1 h-3 w-3" />}
      {category === 'general' && <Monitor className="mr-1 h-3 w-3" />}
      {getAssetCategoryLabel(category)}
    </Badge>
  );
}

export function getMaintenanceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    oil_change: 'オイル交換',
    tire_change: 'タイヤ交換',
    inspection: '点検',
    shaken: '車検',
    repair: '修理',
    other: 'その他',
  };
  return labels[type] || type;
}

export function getCategoryLabel(category: string): string {
  return ASSET_CATEGORIES.find((c) => c.value === category)?.label || category;
}

export function getRepairTypeLabel(type: string): string {
  return REPAIR_TYPES.find((t) => t.value === type)?.label || type;
}
