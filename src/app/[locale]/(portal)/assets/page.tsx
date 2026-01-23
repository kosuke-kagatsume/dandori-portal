'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type VehicleFromAPI } from '@/hooks/use-vehicles-api';
import { type PCAssetFromAPI } from '@/hooks/use-pc-assets-api';
// import { type MaintenanceRecordFromAPI } from '@/hooks/use-maintenance-api'; // 型定義参照用
import {
  type GeneralAssetFromAPI,
  // type RepairRecordFromAPI,
  ASSET_CATEGORIES,
  REPAIR_TYPES,
} from '@/hooks/use-general-assets-api';
import { useAssetsBatchAPI } from '@/hooks/use-assets-batch-api';
import { RepairFormModal } from '@/components/assets/RepairFormModal';
import {
  Car,
  Plus,
  AlertTriangle,
  Wrench,
  DollarSign,
  Search,
  Trash2,
  Download,
  Loader2,
  RefreshCw,
  Monitor,
  Laptop,
  // ChevronDown, // 将来的にアコーディオンで使用予定
  // ChevronRight, // 将来的にアコーディオンで使用予定
} from 'lucide-react';
import { toast } from 'sonner';
import { MaintenanceDialog, type MaintenanceFormData } from '@/features/assets/maintenance-dialog';
import { VehicleFormDialog } from '@/features/assets/vehicle-form-dialog';
import { VendorFormDialog } from '@/features/assets/vendor-form-dialog';
import { PCFormDialog } from '@/features/assets/pc-form-dialog';
import { GeneralAssetFormDialog } from '@/features/assets/general-asset-form-dialog';

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance' | 'retired'>('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedVehicle, setSelectedVehicle] = useState<VehicleFromAPI | null>(null); // 詳細モーダルで使用予定
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_detailModalOpen, setDetailModalOpen] = useState(false); // 詳細モーダルで使用予定
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState<string>('all');
  const [maintenanceVendorFilter, setMaintenanceVendorFilter] = useState<string>('all');

  // 費用集計の期間選択
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [costStartMonth, setCostStartMonth] = useState(
    `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`
  );
  const [costEndMonth, setCostEndMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );

  // バッチAPIで全データを一括取得（6 API → 1 APIに最適化）
  const {
    vehicles,
    pcAssets,
    generalAssets,
    vendors,
    maintenanceRecords,
    repairRecords,
    loading: batchLoading,
    // error: batchError, // エラー表示で使用予定
    refresh: refreshAllData,
  } = useAssetsBatchAPI();

  // CRUD操作用の状態（削除時にはrefreshAllDataで再取得）
  const [deleteLoading, setDeleteLoading] = useState(false);

  // メンテナンス登録ダイアログの状態
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);

  // 修理登録ダイアログの状態
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);

  // 車両登録ダイアログの状態
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);

  // 業者登録ダイアログの状態
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);

  // PC登録ダイアログの状態
  const [pcDialogOpen, setPcDialogOpen] = useState(false);

  // 備品登録ダイアログの状態
  const [generalAssetDialogOpen, setGeneralAssetDialogOpen] = useState(false);

  // 期限警告タブのカテゴリフィルター
  const [warningCategoryFilter, setWarningCategoryFilter] = useState<'all' | 'vehicle' | 'pc' | 'general'>('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_expandedWarningGroups, _setExpandedWarningGroups] = useState<Record<string, boolean>>({
    vehicle: true,
    pc: true,
    general: true,
  }); // アコーディオン実装時に使用予定

  const isLoading = batchLoading || deleteLoading;

  // O(1)検索用のMap（パフォーマンス最適化）
  const vehicleMap = useMemo(() => {
    return new Map(vehicles.map((v) => [v.id, v]));
  }, [vehicles]);

  const vendorMap = useMemo(() => {
    return new Map(vendors.map((v) => [v.id, v]));
  }, [vendors]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _pcAssetMap = useMemo(() => {
    return new Map(pcAssets.map((p) => [p.id, p]));
  }, [pcAssets]); // O(1)検索用（将来的に使用予定）

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _generalAssetMap = useMemo(() => {
    return new Map(generalAssets.map((a) => [a.id, a]));
  }, [generalAssets]); // O(1)検索用（将来的に使用予定）

  // 車両別費用集計を計算する関数
  const calculateVehicleCosts = (startMonth: string, endMonth: string) => {
    const start = new Date(startMonth + '-01');
    const end = new Date(endMonth + '-01');
    end.setMonth(end.getMonth() + 1);

    return vehicles.map((vehicle) => {
      let leaseCost = 0;
      let maintenanceCost = 0;

      // リース費用の計算
      if (vehicle.ownershipType === 'leased' && vehicle.leaseMonthlyCost && vehicle.leaseStartDate && vehicle.leaseEndDate) {
        const contractStart = new Date(vehicle.leaseStartDate);
        const contractEnd = new Date(vehicle.leaseEndDate);

        let monthCount = 0;
        for (let d = new Date(start); d < end; d.setMonth(d.getMonth() + 1)) {
          if (d >= contractStart && d <= contractEnd) {
            monthCount++;
          }
        }
        leaseCost = vehicle.leaseMonthlyCost * monthCount;
      }

      // メンテナンス費用の計算
      maintenanceCost = maintenanceRecords
        .filter((record) => {
          if (record.vehicleId !== vehicle.id) return false;
          const recordDate = new Date(record.date);
          return recordDate >= start && recordDate < end;
        })
        .reduce((sum, record) => sum + record.cost, 0);

      return {
        vehicleId: vehicle.id,
        leaseCost,
        maintenanceCost,
      };
    }).filter(item => item.leaseCost > 0 || item.maintenanceCost > 0);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 統計値（memoで計算）- 全資産の統合サマリー
  const stats = useMemo(() => {
    // 資産数
    const totalVehicles = vehicles.length;
    const totalPCs = pcAssets.length;
    const totalGeneralAssets = generalAssets.length;
    const totalAssets = totalVehicles + totalPCs + totalGeneralAssets;

    // 稼働中の資産
    const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
    const activePCs = pcAssets.filter((p) => p.status === 'active').length;
    const activeGeneralAssets = generalAssets.filter((a) => a.status === 'active').length;
    const activeAssets = activeVehicles + activePCs + activeGeneralAssets;

    // リース費用（車両のみ）
    const leasedVehicles = vehicles.filter((v) => v.ownershipType === 'leased').length;
    const monthlyLeaseCost = vehicles
      .filter((v) => v.ownershipType === 'leased' && v.leaseMonthlyCost)
      .reduce((sum, v) => sum + (v.leaseMonthlyCost || 0), 0);

    // 修理・メンテナンス件数
    const totalRepairs = repairRecords.length;
    const totalMaintenance = maintenanceRecords.length;
    const totalRepairsAndMaintenance = totalRepairs + totalMaintenance;

    // 今月の費用（リース + 修理）
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthRepairCost = repairRecords
      .filter((r) => r.date.startsWith(currentMonth))
      .reduce((sum, r) => sum + r.cost, 0);
    const thisMonthMaintenanceCost = maintenanceRecords
      .filter((r) => r.date.startsWith(currentMonth))
      .reduce((sum, r) => sum + r.cost, 0);
    const thisMonthTotalCost = monthlyLeaseCost + thisMonthRepairCost + thisMonthMaintenanceCost;

    return {
      // 統合サマリー用
      totalAssets,
      activeAssets,
      totalVehicles,
      totalPCs,
      totalGeneralAssets,
      totalRepairsAndMaintenance,
      totalRepairs,
      totalMaintenance,
      thisMonthTotalCost,
      monthlyLeaseCost,
      thisMonthRepairCost,
      thisMonthMaintenanceCost,
      // 警告用
      criticalWarningsCount: 0, // 後で計算
      warningsCount: 0, // 後で計算
      // その他
      activeVehicles,
      leasedVehicles,
      totalMaintenanceRecords: maintenanceRecords.length,
      totalVendors: vendors.length,
    };
  }, [vehicles, pcAssets, generalAssets, maintenanceRecords, repairRecords, vendors]);

  // 期限警告を計算
  // 全資産の期限警告（車両、PC、その他）
  const allWarnings = useMemo(
    () => getAllDeadlineWarnings(vehicles, pcAssets, generalAssets),
    [vehicles, pcAssets, generalAssets]
  );

  // フィルタされた警告（カテゴリフィルターを適用）
  const filteredWarnings = useMemo(() => {
    if (warningCategoryFilter === 'all') return allWarnings;
    return allWarnings.filter((w) => w.assetCategory === warningCategoryFilter);
  }, [allWarnings, warningCategoryFilter]);

  // 後方互換性のための車両のみの警告
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _warnings = useMemo(() => getDeadlineWarnings(vehicles), [vehicles]); // レガシー互換用（将来的に削除予定）

  // フィルタリングされた車両リスト
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterStatus === 'all' || vehicle.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [vehicles, searchQuery, filterStatus]);

  // 期限警告を計算するヘルパー関数（車両・PC・その他資産すべて対応）
  type WarningItem = {
    id: string;
    assetId: string;
    assetName: string;
    assetCategory: 'vehicle' | 'pc' | 'general';
    deadlineType: 'inspection' | 'maintenance' | 'tireChange' | 'contract' | 'warranty' | 'lease';
    deadlineDate: string;
    daysRemaining: number;
    level: 'critical' | 'warning' | 'info';
  };

  function getAllDeadlineWarnings(
    vehicleList: VehicleFromAPI[],
    pcList: PCAssetFromAPI[],
    generalList: GeneralAssetFromAPI[]
  ): WarningItem[] {
    const warningsList: WarningItem[] = [];
    const now = new Date();

    // 車両の期限警告
    vehicleList.forEach((vehicle) => {
      // 車検期限
      if (vehicle.inspectionDate) {
        const inspDate = new Date(vehicle.inspectionDate);
        const days = Math.ceil((inspDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 60) {
          warningsList.push({
            id: `${vehicle.id}-inspection`,
            assetId: vehicle.id,
            assetName: `${vehicle.vehicleNumber} (${vehicle.make} ${vehicle.model})`,
            assetCategory: 'vehicle',
            deadlineType: 'inspection',
            deadlineDate: vehicle.inspectionDate,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : 'warning',
          });
        }
      }

      // 点検期限
      if (vehicle.maintenanceDate) {
        const maintDate = new Date(vehicle.maintenanceDate);
        const days = Math.ceil((maintDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 60) {
          warningsList.push({
            id: `${vehicle.id}-maintenance`,
            assetId: vehicle.id,
            assetName: `${vehicle.vehicleNumber} (${vehicle.make} ${vehicle.model})`,
            assetCategory: 'vehicle',
            deadlineType: 'maintenance',
            deadlineDate: vehicle.maintenanceDate,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : 'warning',
          });
        }
      }

      // タイヤ履き替え期限
      if (vehicle.tireChangeDate) {
        const tireDate = new Date(vehicle.tireChangeDate);
        const days = Math.ceil((tireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 60) {
          const nextTireType = vehicle.currentTireType === 'winter' ? '夏タイヤ' : '冬タイヤ';
          warningsList.push({
            id: `${vehicle.id}-tireChange`,
            assetId: vehicle.id,
            assetName: `${vehicle.vehicleNumber} (${vehicle.make} ${vehicle.model}) → ${nextTireType}`,
            assetCategory: 'vehicle',
            deadlineType: 'tireChange',
            deadlineDate: vehicle.tireChangeDate,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : 'warning',
          });
        }
      }

      // リース終了期限
      if (vehicle.ownershipType === 'leased' && vehicle.leaseEndDate) {
        const leaseDate = new Date(vehicle.leaseEndDate);
        const days = Math.ceil((leaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 90) {
          warningsList.push({
            id: `${vehicle.id}-lease`,
            assetId: vehicle.id,
            assetName: `${vehicle.vehicleNumber} (${vehicle.make} ${vehicle.model})`,
            assetCategory: 'vehicle',
            deadlineType: 'lease',
            deadlineDate: vehicle.leaseEndDate,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info',
          });
        }
      }
    });

    // PC資産の期限警告
    pcList.forEach((pc) => {
      // 保証期限
      if (pc.warrantyExpiration) {
        const warrantyDate = new Date(pc.warrantyExpiration);
        const days = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 90) {
          warningsList.push({
            id: `${pc.id}-warranty`,
            assetId: pc.id,
            assetName: `${pc.assetNumber} (${pc.manufacturer} ${pc.model})`,
            assetCategory: 'pc',
            deadlineType: 'warranty',
            deadlineDate: pc.warrantyExpiration,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info',
          });
        }
      }

      // リース終了期限
      if (pc.ownershipType === 'leased' && pc.leaseEndDate) {
        const leaseDate = new Date(pc.leaseEndDate);
        const days = Math.ceil((leaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 90) {
          warningsList.push({
            id: `${pc.id}-lease`,
            assetId: pc.id,
            assetName: `${pc.assetNumber} (${pc.manufacturer} ${pc.model})`,
            assetCategory: 'pc',
            deadlineType: 'lease',
            deadlineDate: pc.leaseEndDate,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info',
          });
        }
      }
    });

    // その他資産の期限警告
    generalList.forEach((asset) => {
      // 保証期限
      if (asset.warrantyExpiration) {
        const warrantyDate = new Date(asset.warrantyExpiration);
        const days = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 90) {
          warningsList.push({
            id: `${asset.id}-warranty`,
            assetId: asset.id,
            assetName: `${asset.assetNumber} (${asset.name})`,
            assetCategory: 'general',
            deadlineType: 'warranty',
            deadlineDate: asset.warrantyExpiration,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info',
          });
        }
      }

      // リース終了期限
      if (asset.ownershipType === 'leased' && asset.leaseEndDate) {
        const leaseDate = new Date(asset.leaseEndDate);
        const days = Math.ceil((leaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 90) {
          warningsList.push({
            id: `${asset.id}-lease`,
            assetId: asset.id,
            assetName: `${asset.assetNumber} (${asset.name})`,
            assetCategory: 'general',
            deadlineType: 'lease',
            deadlineDate: asset.leaseEndDate,
            daysRemaining: days,
            level: days <= 30 ? 'critical' : days <= 60 ? 'warning' : 'info',
          });
        }
      }
    });

    return warningsList.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  // 後方互換性のため元の関数を維持
  function getDeadlineWarnings(vehicleList: VehicleFromAPI[]) {
    return getAllDeadlineWarnings(vehicleList, [], []);
  }

  // ステータスバッジ
  const getStatusBadge = (status: string) => {
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
  };

  // 所有形態バッジ
  const getOwnershipBadge = (type: string) => {
    const labels: Record<string, string> = {
      owned: '自己所有',
      leased: 'リース',
      rental: 'レンタル',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  // 期限レベルバッジ
  const getWarningLevelBadge = (level: 'critical' | 'warning' | 'info') => {
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
  };

  // 期限種別ラベル
  const getDeadlineTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      inspection: '車検',
      maintenance: '点検',
      tireChange: 'タイヤ履き替え',
      contract: 'リース契約',
      warranty: '保証期限',
      lease: 'リース終了',
    };
    return labels[type] || type;
  };

  // 資産カテゴリラベル
  const getAssetCategoryLabel = (category: 'vehicle' | 'pc' | 'general') => {
    const labels: Record<string, string> = {
      vehicle: '車両',
      pc: 'PC',
      general: 'その他',
    };
    return labels[category] || category;
  };

  // 資産カテゴリバッジ
  const getAssetCategoryBadge = (category: 'vehicle' | 'pc' | 'general') => {
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
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  // 残日数計算（SSR/CSR不一致を防ぐため、mountedチェック後のみ使用）
  const calculateDaysRemaining = (dateString: string) => {
    if (!mounted) return 0;
    return Math.ceil(
      (new Date(dateString).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  // メンテナンス種別ラベル
  const getMaintenanceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      oil_change: 'オイル交換',
      tire_change: 'タイヤ交換',
      inspection: '点検',
      shaken: '車検',
      repair: '修理',
      other: 'その他',
    };
    return labels[type] || type;
  };

  // 車両CSV出力ハンドラー
  const handleExportVehiclesCSV = () => {
    const headers = ['車両番号', 'ナンバープレート', 'メーカー', '型番', '年式', '所有形態', 'ステータス', '車検日', '点検日', '月額リース費用'];
    const rows = filteredVehicles.map(v => [
      v.vehicleNumber,
      v.licensePlate,
      v.make,
      v.model,
      v.year?.toString() || '',
      v.ownershipType,
      v.status,
      v.inspectionDate || '',
      v.maintenanceDate || '',
      v.leaseMonthlyCost?.toString() || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vehicles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`CSV出力完了: ${filteredVehicles.length}件`);
  };

  // PC資産CSV出力ハンドラー
  const handleExportPCsCSV = () => {
    const headers = ['資産番号', 'メーカー', '型番', 'シリアル番号', 'CPU', 'メモリ', 'ストレージ', 'OS', '所有形態', 'ステータス', '保証期限'];
    const rows = pcAssets.map(p => [
      p.assetNumber,
      p.manufacturer,
      p.model,
      p.serialNumber || '',
      p.cpu || '',
      p.memory || '',
      p.storage || '',
      p.os || '',
      p.ownershipType,
      p.status,
      p.warrantyExpiration || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pc_assets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`CSV出力完了: ${pcAssets.length}件`);
  };

  // 削除ハンドラー（直接API呼び出し + バッチ再取得）
  const handleDeleteVehicle = async (id: string, vehicleNumber: string) => {
    if (window.confirm(`車両 ${vehicleNumber} を削除してもよろしいですか？`)) {
      try {
        setDeleteLoading(true);
        const response = await fetch(`/api/assets/vehicles/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          toast.success('車両を削除しました');
          await refreshAllData();
        } else {
          toast.error(result.error || '削除に失敗しました');
        }
      } catch {
        toast.error('削除に失敗しました');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleDeletePC = async (id: string, assetNumber: string) => {
    if (window.confirm(`PC ${assetNumber} を削除してもよろしいですか？`)) {
      try {
        setDeleteLoading(true);
        const response = await fetch(`/api/assets/pc-assets/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          toast.success('PCを削除しました');
          await refreshAllData();
        } else {
          toast.error(result.error || '削除に失敗しました');
        }
      } catch {
        toast.error('削除に失敗しました');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleDeleteVendor = async (id: string, name: string) => {
    if (window.confirm(`業者 ${name} を削除してもよろしいですか？`)) {
      try {
        setDeleteLoading(true);
        const response = await fetch(`/api/assets/vendors/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          toast.success('業者を削除しました');
          await refreshAllData();
        } else {
          toast.error(result.error || '削除に失敗しました');
        }
      } catch {
        toast.error('削除に失敗しました');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // データ更新ハンドラー（バッチAPIで一括更新）
  const handleRefreshData = async () => {
    await refreshAllData();
    toast.success('データを更新しました');
  };

  // 汎用資産削除ハンドラー
  const handleDeleteGeneralAsset = async (id: string, name: string) => {
    if (window.confirm(`資産 ${name} を削除してもよろしいですか？`)) {
      try {
        setDeleteLoading(true);
        const response = await fetch(`/api/assets/general-assets/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          toast.success('資産を削除しました');
          await refreshAllData();
        } else {
          toast.error(result.error || '削除に失敗しました');
        }
      } catch {
        toast.error('削除に失敗しました');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // 修理記録削除ハンドラー
  const handleDeleteRepairRecord = async (id: string) => {
    if (window.confirm('この修理記録を削除してもよろしいですか？')) {
      try {
        setDeleteLoading(true);
        const response = await fetch(`/api/assets/repair-records/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          toast.success('修理記録を削除しました');
          await refreshAllData();
        } else {
          toast.error(result.error || '削除に失敗しました');
        }
      } catch {
        toast.error('削除に失敗しました');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // カテゴリラベル取得
  const getCategoryLabel = (category: string) => {
    return ASSET_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  // 修理種別ラベル取得
  const getRepairTypeLabel = (type: string) => {
    return REPAIR_TYPES.find(t => t.value === type)?.label || type;
  };

  // メンテナンス登録ハンドラー
  const handleMaintenanceSubmit = async (formData: MaintenanceFormData) => {
    try {
      const response = await fetch('/api/assets/maintenance-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('メンテナンス記録を登録しました');
        await refreshAllData();
      }
      return result;
    } catch {
      return { success: false, error: '登録に失敗しました' };
    }
  };

  // メンテナンス削除ハンドラー
  const handleDeleteMaintenance = async (id: string) => {
    if (window.confirm('このメンテナンス記録を削除してもよろしいですか？')) {
      try {
        setDeleteLoading(true);
        const response = await fetch(`/api/assets/maintenance-records/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          toast.success('メンテナンス記録を削除しました');
          await refreshAllData();
        } else {
          toast.error(result.error || '削除に失敗しました');
        }
      } catch {
        toast.error('削除に失敗しました');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // フィルタリングされたメンテナンス記録
  const filteredMaintenanceFromAPI = useMemo(() => {
    return maintenanceRecords.filter((record) => {
      const matchesType = maintenanceTypeFilter === 'all' || record.type === maintenanceTypeFilter;
      const matchesVendor = maintenanceVendorFilter === 'all' || record.vendorId === maintenanceVendorFilter;
      return matchesType && matchesVendor;
    });
  }, [maintenanceRecords, maintenanceTypeFilter, maintenanceVendorFilter]);

  // ローディング表示
  if (isLoading && vehicles.length === 0) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">資産管理</h1>
          <p className="text-muted-foreground mt-1">
            車両・PC・携帯電話などの資産を一元管理（DB接続）
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshData} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </div>

      {/* 統計カード - 全資産の統合サマリー */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総資産数</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssets}件</div>
            <p className="text-xs text-muted-foreground">
              車両{stats.totalVehicles} / PC{stats.totalPCs} / 他{stats.totalGeneralAssets}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">期限警告</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {allWarnings.filter(w => w.level === 'critical').length}件
            </div>
            <p className="text-xs text-muted-foreground">
              注意: {allWarnings.filter(w => w.level === 'warning').length}件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">修理・メンテナンス</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRepairsAndMaintenance}件</div>
            <p className="text-xs text-muted-foreground">
              修理{stats.totalRepairs} / メンテ{stats.totalMaintenance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月費用</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.thisMonthTotalCost)}</div>
            <p className="text-xs text-muted-foreground">
              リース{formatCurrency(stats.monthlyLeaseCost).replace('￥', '')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツ */}
      <Tabs defaultValue="vehicles" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="vehicles">車両</TabsTrigger>
          <TabsTrigger value="pcs">
            <span className="hidden sm:inline">PC・その他</span>
            <span className="sm:hidden">PC</span>
          </TabsTrigger>
          <TabsTrigger value="repair">修理</TabsTrigger>
          <TabsTrigger value="warnings" className="relative">
            <span className="hidden sm:inline">期限警告</span>
            <span className="sm:hidden">警告</span>
            {mounted && stats.criticalWarningsCount > 0 && (
              <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                {stats.criticalWarningsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <span className="hidden sm:inline">メンテナンス</span>
            <span className="sm:hidden">整備</span>
          </TabsTrigger>
          <TabsTrigger value="vendors">業者</TabsTrigger>
          <TabsTrigger value="costs">費用</TabsTrigger>
        </TabsList>

        {/* 車両一覧タブ */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>車両一覧</CardTitle>
                    <CardDescription>登録されている全車両の管理（{vehicles.length}台）</CardDescription>
                  </div>
                  <Button onClick={() => setVehicleDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    車両を登録
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="車両番号、ナンバーで検索..."
                      className="pl-8 pr-4 py-2 border rounded-md w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-3 py-2 border rounded-md w-full sm:w-auto"
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(e.target.value as typeof filterStatus)
                    }
                  >
                    <option value="all">全てのステータス</option>
                    <option value="active">稼働中</option>
                    <option value="maintenance">整備中</option>
                    <option value="retired">廃車</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={handleExportVehiclesCSV} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    CSV出力
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>車両番号</TableHead>
                      <TableHead>ナンバープレート</TableHead>
                      <TableHead>車種</TableHead>
                      <TableHead>割当先</TableHead>
                      <TableHead>所有形態</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>次回車検</TableHead>
                      <TableHead>次回点検</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          車両が見つかりません
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">
                            {vehicle.vehicleNumber}
                          </TableCell>
                          <TableCell>{vehicle.licensePlate}</TableCell>
                          <TableCell>
                            {vehicle.make} {vehicle.model}
                            <div className="text-xs text-muted-foreground">
                              {vehicle.year}年式
                            </div>
                          </TableCell>
                          <TableCell>
                            {vehicle.assignedUserName ? (
                              <div>
                                {vehicle.assignedUserName}
                                {vehicle.assignedDate && (
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(vehicle.assignedDate)}～
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">未割当</span>
                            )}
                          </TableCell>
                          <TableCell>{getOwnershipBadge(vehicle.ownershipType)}</TableCell>
                          <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                          <TableCell>
                            {vehicle.inspectionDate ? (
                              <>
                                <div className="text-sm">{formatDate(vehicle.inspectionDate)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {calculateDaysRemaining(vehicle.inspectionDate)}日後
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {vehicle.maintenanceDate ? (
                              <>
                                <div className="text-sm">{formatDate(vehicle.maintenanceDate)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {calculateDaysRemaining(vehicle.maintenanceDate)}日後
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVehicle(vehicle.id, vehicle.vehicleNumber)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PC・その他一覧タブ */}
        <TabsContent value="pcs" className="space-y-4">
          {/* PC一覧 */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Laptop className="h-5 w-5" />
                    PC一覧
                  </CardTitle>
                  <CardDescription>登録されている全PCの管理（{pcAssets.length}台）</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportPCsCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV出力
                  </Button>
                  <Button onClick={() => setPcDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    PCを登録
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>資産番号</TableHead>
                    <TableHead>メーカー・型番</TableHead>
                    <TableHead>スペック</TableHead>
                    <TableHead>割当先</TableHead>
                    <TableHead>所有形態</TableHead>
                    <TableHead>保証期限</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pcAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        PCが見つかりません
                      </TableCell>
                    </TableRow>
                  ) : (
                    pcAssets.map((pc) => (
                      <TableRow key={pc.id}>
                        <TableCell className="font-medium">{pc.assetNumber}</TableCell>
                        <TableCell>
                          {pc.manufacturer} {pc.model}
                          <div className="text-xs text-muted-foreground">
                            S/N: {pc.serialNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{pc.cpu}</div>
                          <div className="text-xs text-muted-foreground">
                            {pc.memory} / {pc.storage}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pc.assignedUserName ? (
                            <div>
                              {pc.assignedUserName}
                              {pc.assignedDate && (
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(pc.assignedDate)}～
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">未割当</span>
                          )}
                        </TableCell>
                        <TableCell>{getOwnershipBadge(pc.ownershipType)}</TableCell>
                        <TableCell>
                          {pc.warrantyExpiration ? (
                            <>
                              <div className="text-sm">{formatDate(pc.warrantyExpiration)}</div>
                              <div className="text-xs text-muted-foreground">
                                {calculateDaysRemaining(pc.warrantyExpiration)}日後
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(pc.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePC(pc.id, pc.assetNumber)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* その他資産一覧 */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    その他資産一覧
                  </CardTitle>
                  <CardDescription>モニター、プリンター、スマートフォンなど（{generalAssets.length}件）</CardDescription>
                </div>
                <Button onClick={() => setGeneralAssetDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  備品を登録
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>資産番号</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>名称・型番</TableHead>
                    <TableHead>割当先</TableHead>
                    <TableHead>所有形態</TableHead>
                    <TableHead>保証期限</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generalAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        その他資産が見つかりません
                      </TableCell>
                    </TableRow>
                  ) : (
                    generalAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoryLabel(asset.category)}</Badge>
                        </TableCell>
                        <TableCell>
                          {asset.name}
                          {asset.manufacturer && asset.model && (
                            <div className="text-xs text-muted-foreground">
                              {asset.manufacturer} {asset.model}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {asset.assignedUserName ? (
                            <div>
                              {asset.assignedUserName}
                              {asset.assignedDate && (
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(asset.assignedDate)}～
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">未割当</span>
                          )}
                        </TableCell>
                        <TableCell>{getOwnershipBadge(asset.ownershipType)}</TableCell>
                        <TableCell>
                          {asset.warrantyExpiration ? (
                            <>
                              <div className="text-sm">{formatDate(asset.warrantyExpiration)}</div>
                              <div className="text-xs text-muted-foreground">
                                {calculateDaysRemaining(asset.warrantyExpiration)}日後
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGeneralAsset(asset.id, asset.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 修理タブ */}
        <TabsContent value="repair" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    修理記録
                  </CardTitle>
                  <CardDescription>PC・その他資産の修理履歴（{repairRecords.length}件）</CardDescription>
                </div>
                <Button onClick={() => setRepairDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  修理を登録
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {repairRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>修理記録がありません</p>
                  <p className="text-sm mt-2">「修理登録」ボタンから修理記録を追加してください</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>対象資産</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>症状</TableHead>
                      <TableHead>業者</TableHead>
                      <TableHead className="text-right">費用</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repairRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          {record.pcAsset ? (
                            <>
                              <Badge variant="outline" className="mr-1">PC</Badge>
                              <span className="font-medium">{record.pcAsset.assetNumber}</span>
                              <div className="text-xs text-muted-foreground">
                                {record.pcAsset.manufacturer} {record.pcAsset.model}
                              </div>
                            </>
                          ) : record.generalAsset ? (
                            <>
                              <Badge variant="outline" className="mr-1">{getCategoryLabel(record.generalAsset.category)}</Badge>
                              <span className="font-medium">{record.generalAsset.assetNumber}</span>
                              <div className="text-xs text-muted-foreground">
                                {record.generalAsset.name}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getRepairTypeLabel(record.repairType)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.symptom || '-'}
                        </TableCell>
                        <TableCell>{record.vendorName || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(record.cost)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'completed' ? 'default' : record.status === 'in_progress' ? 'secondary' : 'outline'}>
                            {record.status === 'completed' ? '完了' : record.status === 'in_progress' ? '修理中' : record.status === 'pending' ? '修理待ち' : 'キャンセル'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRepairRecord(record.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 期限警告タブ */}
        <TabsContent value="warnings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>期限警告</CardTitle>
                  <CardDescription>
                    車検・点検・保証・リース終了など、期限が近い項目（90日以内）
                  </CardDescription>
                </div>
                {/* カテゴリフィルターボタン */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={warningCategoryFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWarningCategoryFilter('all')}
                  >
                    すべて ({allWarnings.length})
                  </Button>
                  <Button
                    variant={warningCategoryFilter === 'vehicle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWarningCategoryFilter('vehicle')}
                  >
                    <Car className="mr-1 h-4 w-4" />
                    車両 ({allWarnings.filter(w => w.assetCategory === 'vehicle').length})
                  </Button>
                  <Button
                    variant={warningCategoryFilter === 'pc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWarningCategoryFilter('pc')}
                  >
                    <Laptop className="mr-1 h-4 w-4" />
                    PC ({allWarnings.filter(w => w.assetCategory === 'pc').length})
                  </Button>
                  <Button
                    variant={warningCategoryFilter === 'general' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWarningCategoryFilter('general')}
                  >
                    <Monitor className="mr-1 h-4 w-4" />
                    その他 ({allWarnings.filter(w => w.assetCategory === 'general').length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                {filteredWarnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    期限が近い項目はありません
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>レベル</TableHead>
                        <TableHead>カテゴリ</TableHead>
                        <TableHead>種別</TableHead>
                        <TableHead>資産</TableHead>
                        <TableHead>期限日</TableHead>
                        <TableHead>残日数</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarnings.map((warning) => (
                        <TableRow key={warning.id}>
                          <TableCell>{getWarningLevelBadge(warning.level)}</TableCell>
                          <TableCell>{getAssetCategoryBadge(warning.assetCategory)}</TableCell>
                          <TableCell>{getDeadlineTypeLabel(warning.deadlineType)}</TableCell>
                          <TableCell className="font-medium">
                            {warning.assetName}
                          </TableCell>
                          <TableCell>{formatDate(warning.deadlineDate)}</TableCell>
                          <TableCell>
                            <span
                              className={
                                warning.daysRemaining <= 30
                                  ? 'text-destructive font-semibold'
                                  : warning.daysRemaining <= 60
                                  ? 'text-orange-600'
                                  : 'text-muted-foreground'
                              }
                            >
                              あと{warning.daysRemaining}日
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (warning.assetCategory === 'vehicle') {
                                  const vehicle = vehicleMap.get(warning.assetId);
                                  if (vehicle) {
                                    setSelectedVehicle(vehicle);
                                    setDetailModalOpen(true);
                                  }
                                }
                              }}
                              disabled={warning.assetCategory !== 'vehicle'}
                            >
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* メンテナンスタブ */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>メンテナンス履歴</CardTitle>
                  <CardDescription>全車両のメンテナンス記録（{maintenanceRecords.length}件）</CardDescription>
                </div>
                <Button onClick={() => setMaintenanceDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  メンテナンスを登録
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                  <select
                    className="px-3 py-2 border rounded-md text-sm"
                    value={maintenanceTypeFilter}
                    onChange={(e) => setMaintenanceTypeFilter(e.target.value)}
                  >
                    <option value="all">全ての種別</option>
                    <option value="oil_change">オイル交換</option>
                    <option value="tire_change">タイヤ交換</option>
                    <option value="inspection">点検</option>
                    <option value="shaken">車検</option>
                    <option value="repair">修理</option>
                    <option value="other">その他</option>
                  </select>
                  <select
                    className="px-3 py-2 border rounded-md text-sm"
                    value={maintenanceVendorFilter}
                    onChange={(e) => setMaintenanceVendorFilter(e.target.value)}
                  >
                    <option value="all">全ての業者</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMaintenanceFromAPI.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>メンテナンス記録がありません</p>
                  <p className="text-sm mt-2">「新規登録」ボタンからメンテナンス記録を追加してください</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>車両</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>走行距離</TableHead>
                      <TableHead>業者</TableHead>
                      <TableHead className="text-right">費用</TableHead>
                      <TableHead>内容</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenanceFromAPI.map((record) => {
                      const vehicle = vehicleMap.get(record.vehicleId);
                      const vendor = record.vendorId ? vendorMap.get(record.vendorId) : null;
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell>
                            {vehicle ? (
                              <>
                                <div className="font-medium">{vehicle.vehicleNumber}</div>
                                <div className="text-xs text-muted-foreground">
                                  {vehicle.make} {vehicle.model}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getMaintenanceTypeLabel(record.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.mileage ? `${record.mileage.toLocaleString()} km` : '-'}
                          </TableCell>
                          <TableCell>{vendor?.name || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(record.cost)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.description || '-'}
                            {record.notes && (
                              <div className="text-xs text-muted-foreground">
                                {record.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMaintenance(record.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 業者管理タブ */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>業者管理</CardTitle>
                  <CardDescription>メンテナンス業者の管理（{vendors.length}社）</CardDescription>
                </div>
                <Button onClick={() => setVendorDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  業者を登録
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>業者名</TableHead>
                      <TableHead>担当者</TableHead>
                      <TableHead>電話番号</TableHead>
                      <TableHead>住所</TableHead>
                      <TableHead>評価</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          業者が登録されていません
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell>{vendor.contactPerson || '-'}</TableCell>
                          <TableCell>{vendor.phone || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {vendor.address || '-'}
                          </TableCell>
                          <TableCell>
                            {vendor.rating ? (
                              <div className="flex items-center">
                                {'★'.repeat(vendor.rating)}
                                {'☆'.repeat(5 - vendor.rating)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 費用集計タブ */}
        <TabsContent value="costs" className="space-y-4">
          {/* 期間選択 */}
          <Card>
            <CardHeader>
              <CardTitle>集計期間</CardTitle>
              <CardDescription>費用集計の対象期間を選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">開始月</label>
                  <input
                    type="month"
                    value={costStartMonth}
                    onChange={(e) => setCostStartMonth(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">終了月</label>
                  <input
                    type="month"
                    value={costEndMonth}
                    onChange={(e) => setCostEndMonth(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 費用サマリー */}
          <Card>
            <CardHeader>
              <CardTitle>車両別費用集計</CardTitle>
              <CardDescription>
                {costStartMonth} 〜 {costEndMonth} の費用内訳
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const costSummary = calculateVehicleCosts(costStartMonth, costEndMonth);
                const totalLeaseCost = costSummary.reduce((sum, item) => sum + item.leaseCost, 0);
                const totalMaintenanceCost = costSummary.reduce((sum, item) => sum + item.maintenanceCost, 0);
                const totalCost = totalLeaseCost + totalMaintenanceCost;

                if (costSummary.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      指定期間の費用データがありません
                    </div>
                  );
                }

                return (
                  <>
                    {/* 合計表示 */}
                    <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold">期間合計</div>
                        <div className="text-3xl font-bold text-primary">
                          {formatCurrency(totalCost)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground flex gap-4">
                        <span>
                          リース費用: {formatCurrency(totalLeaseCost)}
                        </span>
                        <span>
                          メンテナンス費用: {formatCurrency(totalMaintenanceCost)}
                        </span>
                      </div>
                    </div>

                    {/* 車両別費用テーブル */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>車両番号</TableHead>
                          <TableHead>車種</TableHead>
                          <TableHead>所有形態</TableHead>
                          <TableHead className="text-right">リース費用</TableHead>
                          <TableHead className="text-right">メンテナンス費用</TableHead>
                          <TableHead className="text-right">合計</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costSummary.map((item) => {
                          const vehicle = vehicleMap.get(item.vehicleId);
                          const total = item.leaseCost + item.maintenanceCost;

                          return (
                            <TableRow key={item.vehicleId}>
                              <TableCell className="font-medium">
                                {vehicle?.vehicleNumber || '-'}
                              </TableCell>
                              <TableCell>
                                {vehicle ? `${vehicle.make} ${vehicle.model}` : '-'}
                              </TableCell>
                              <TableCell>
                                {vehicle && (
                                  <Badge variant="outline">
                                    {vehicle.ownershipType === 'owned'
                                      ? '自己所有'
                                      : vehicle.ownershipType === 'leased'
                                      ? 'リース'
                                      : 'レンタル'}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-blue-600">
                                {formatCurrency(item.leaseCost)}
                              </TableCell>
                              <TableCell className="text-right text-orange-600">
                                {formatCurrency(item.maintenanceCost)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-primary">
                                {formatCurrency(total)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* メンテナンス登録ダイアログ */}
      <MaintenanceDialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
        vehicles={vehicles}
        vendors={vendors}
        onSubmit={handleMaintenanceSubmit}
      />

      {/* 修理登録ダイアログ */}
      <RepairFormModal
        open={repairDialogOpen}
        onOpenChange={setRepairDialogOpen}
      />

      {/* 車両登録ダイアログ */}
      <VehicleFormDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
      />

      {/* 業者登録ダイアログ */}
      <VendorFormDialog
        open={vendorDialogOpen}
        onOpenChange={setVendorDialogOpen}
      />

      {/* PC登録ダイアログ */}
      <PCFormDialog
        open={pcDialogOpen}
        onOpenChange={setPcDialogOpen}
      />

      {/* 備品登録ダイアログ */}
      <GeneralAssetFormDialog
        open={generalAssetDialogOpen}
        onOpenChange={setGeneralAssetDialogOpen}
      />
    </div>
  );
}
