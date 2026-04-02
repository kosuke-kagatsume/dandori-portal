'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { type VehicleFromAPI } from '@/hooks/use-vehicles-api';
import { type PCAssetFromAPI } from '@/hooks/use-pc-assets-api';
import { type GeneralAssetFromAPI } from '@/hooks/use-general-assets-api';
import { useAssetsBatchAPI } from '@/hooks/use-assets-batch-api';
import { RepairFormModal } from '@/components/assets/RepairFormModal';
import { MaintenanceDialog, type MaintenanceFormData } from '@/features/assets/maintenance-dialog';
import { VehicleFormDialog } from '@/features/assets/vehicle-form-dialog';
import { VendorFormDialog } from '@/features/assets/vendor-form-dialog';
import { PCFormDialog } from '@/features/assets/pc-form-dialog';
import { GeneralAssetFormDialog } from '@/features/assets/general-asset-form-dialog';

// ロジック層
import { getAllDeadlineWarnings, type WarningItem } from '@/lib/assets/warnings';

// UIコンポーネント
import { AssetStatsCards } from '@/features/assets/asset-stats-cards';
import { VehiclesTab } from '@/features/assets/tabs/vehicles-tab';
import { PCGeneralTab } from '@/features/assets/tabs/pc-general-tab';
import { RepairTab } from '@/features/assets/tabs/repair-tab';
import { WarningsTab } from '@/features/assets/tabs/warnings-tab';
import { MaintenanceTab } from '@/features/assets/tabs/maintenance-tab';
import { VendorsTab } from '@/features/assets/tabs/vendors-tab';
import { CostsTab } from '@/features/assets/tabs/costs-tab';

export default function AssetsPage() {
  // ダイアログ状態
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [pcDialogOpen, setPcDialogOpen] = useState(false);
  const [generalAssetDialogOpen, setGeneralAssetDialogOpen] = useState(false);

  // 詳細/編集モーダル
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleFromAPI | null>(null);
  const [selectedPCAsset, setSelectedPCAsset] = useState<PCAssetFromAPI | null>(null);
  const [selectedGeneralAsset, setSelectedGeneralAsset] = useState<GeneralAssetFromAPI | null>(null);
  const [vehicleDetailOpen, setVehicleDetailOpen] = useState(false);
  const [pcDetailOpen, setPcDetailOpen] = useState(false);
  const [generalAssetDetailOpen, setGeneralAssetDetailOpen] = useState(false);

  // バッチAPIで全データを一括取得
  const {
    vehicles, pcAssets, generalAssets, vendors,
    maintenanceRecords, repairRecords,
    loading: batchLoading,
    refresh: refreshAllData,
  } = useAssetsBatchAPI();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isLoading = batchLoading || deleteLoading;

  // ── 統計値 ──────────────────────────────────

  const stats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const totalPCs = pcAssets.length;
    const totalGeneralAssets = generalAssets.length;
    const totalRepairs = repairRecords.length;
    const totalMaintenance = maintenanceRecords.length;
    const monthlyLeaseCost = vehicles
      .filter((v) => v.ownershipType === 'leased' && v.leaseMonthlyCost)
      .reduce((sum, v) => sum + (v.leaseMonthlyCost || 0), 0);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthRepairCost = repairRecords
      .filter((r) => r.date.startsWith(currentMonth))
      .reduce((sum, r) => sum + r.cost, 0);
    const thisMonthMaintenanceCost = maintenanceRecords
      .filter((r) => r.date.startsWith(currentMonth))
      .reduce((sum, r) => sum + r.cost, 0);

    return {
      totalAssets: totalVehicles + totalPCs + totalGeneralAssets,
      totalVehicles,
      totalPCs,
      totalGeneralAssets,
      totalRepairsAndMaintenance: totalRepairs + totalMaintenance,
      totalRepairs,
      totalMaintenance,
      thisMonthTotalCost: monthlyLeaseCost + thisMonthRepairCost + thisMonthMaintenanceCost,
      monthlyLeaseCost,
    };
  }, [vehicles, pcAssets, generalAssets, maintenanceRecords, repairRecords]);

  // ── 期限警告 ──────────────────────────────────

  const allWarnings = useMemo(
    () => getAllDeadlineWarnings(vehicles, pcAssets, generalAssets),
    [vehicles, pcAssets, generalAssets],
  );

  const warningStats = useMemo(() => ({
    criticalCount: allWarnings.filter((w) => w.level === 'critical').length,
    warningCount: allWarnings.filter((w) => w.level === 'warning').length,
    infoCount: allWarnings.filter((w) => w.level === 'info').length,
  }), [allWarnings]);

  // ── 削除ハンドラー ──────────────────────────────────

  const deleteEntity = async (url: string, label: string) => {
    try {
      setDeleteLoading(true);
      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        toast.success(`${label}を削除しました`);
        await refreshAllData();
      } else {
        toast.error(result.error || '削除に失敗しました');
      }
    } catch {
      toast.error('削除に失敗しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteVehicle = (id: string, vehicleNumber: string) => {
    if (window.confirm(`車両 ${vehicleNumber} を削除してもよろしいですか？`)) {
      deleteEntity(`/api/assets/vehicles/${id}`, '車両');
    }
  };

  const handleDeletePC = (id: string, assetNumber: string) => {
    if (window.confirm(`PC ${assetNumber} を削除してもよろしいですか？`)) {
      deleteEntity(`/api/assets/pc-assets/${id}`, 'PC');
    }
  };

  const handleDeleteGeneralAsset = (id: string, name: string) => {
    if (window.confirm(`資産 ${name} を削除してもよろしいですか？`)) {
      deleteEntity(`/api/assets/general-assets/${id}`, '資産');
    }
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (window.confirm(`業者 ${name} を削除してもよろしいですか？`)) {
      deleteEntity(`/api/assets/vendors/${id}`, '業者');
    }
  };

  const handleDeleteRepairRecord = (id: string) => {
    if (window.confirm('この修理記録を削除してもよろしいですか？')) {
      deleteEntity(`/api/assets/repair-records/${id}`, '修理記録');
    }
  };

  const handleDeleteMaintenance = (id: string) => {
    if (window.confirm('このメンテナンス記録を削除してもよろしいですか？')) {
      deleteEntity(`/api/assets/maintenance-records/${id}`, 'メンテナンス記録');
    }
  };

  // ── メンテナンス登録 ──────────────────────────────────

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

  // ── 警告からの詳細表示 ──────────────────────────────────

  const handleViewWarningDetail = (warning: WarningItem) => {
    if (warning.assetCategory === 'vehicle') {
      const vehicle = vehicles.find((v) => v.id === warning.assetId);
      if (vehicle) { setSelectedVehicle(vehicle); setVehicleDetailOpen(true); }
    } else if (warning.assetCategory === 'pc') {
      const pc = pcAssets.find((p) => p.id === warning.assetId);
      if (pc) { setSelectedPCAsset(pc); setPcDetailOpen(true); }
    } else if (warning.assetCategory === 'general') {
      const asset = generalAssets.find((a) => a.id === warning.assetId);
      if (asset) { setSelectedGeneralAsset(asset); setGeneralAssetDetailOpen(true); }
    }
  };

  // ── ローディング ──────────────────────────────────

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

  // ── 描画 ──────────────────────────────────

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
          <Button variant="outline" onClick={async () => { await refreshAllData(); toast.success('データを更新しました'); }} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <AssetStatsCards stats={stats} warningStats={warningStats} />

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
            {mounted && warningStats.criticalCount > 0 && (
              <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                {warningStats.criticalCount}
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

        <TabsContent value="vehicles" className="space-y-4">
          <VehiclesTab
            vehicles={vehicles}
            mounted={mounted}
            onDelete={handleDeleteVehicle}
            onAdd={() => setVehicleDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="pcs" className="space-y-4">
          <PCGeneralTab
            pcAssets={pcAssets}
            generalAssets={generalAssets}
            mounted={mounted}
            onDeletePC={handleDeletePC}
            onDeleteGeneralAsset={handleDeleteGeneralAsset}
            onAddPC={() => setPcDialogOpen(true)}
            onAddGeneralAsset={() => setGeneralAssetDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="repair" className="space-y-4">
          <RepairTab
            repairRecords={repairRecords}
            onDelete={handleDeleteRepairRecord}
            onAdd={() => setRepairDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <WarningsTab
            allWarnings={allWarnings}
            onViewDetail={handleViewWarningDetail}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceTab
            maintenanceRecords={maintenanceRecords}
            vehicles={vehicles}
            vendors={vendors}
            onDelete={handleDeleteMaintenance}
            onAdd={() => setMaintenanceDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <VendorsTab
            vendors={vendors}
            onDelete={handleDeleteVendor}
            onAdd={() => setVendorDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <CostsTab vehicles={vehicles} maintenanceRecords={maintenanceRecords} />
        </TabsContent>
      </Tabs>

      {/* ダイアログ群 */}
      <MaintenanceDialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
        vehicles={vehicles}
        vendors={vendors}
        onSubmit={handleMaintenanceSubmit}
      />
      <RepairFormModal open={repairDialogOpen} onOpenChange={setRepairDialogOpen} />
      <VehicleFormDialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen} />
      <VendorFormDialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen} />
      <PCFormDialog open={pcDialogOpen} onOpenChange={setPcDialogOpen} />
      <GeneralAssetFormDialog open={generalAssetDialogOpen} onOpenChange={setGeneralAssetDialogOpen} />

      {/* 詳細/編集ダイアログ */}
      <VehicleFormDialog
        open={vehicleDetailOpen}
        onOpenChange={(open) => {
          setVehicleDetailOpen(open);
          if (!open) { setSelectedVehicle(null); refreshAllData(); }
        }}
        vehicle={selectedVehicle || undefined}
      />
      <PCFormDialog
        open={pcDetailOpen}
        onOpenChange={(open) => {
          setPcDetailOpen(open);
          if (!open) { setSelectedPCAsset(null); refreshAllData(); }
        }}
        pc={selectedPCAsset || undefined}
      />
      <GeneralAssetFormDialog
        open={generalAssetDetailOpen}
        onOpenChange={(open) => {
          setGeneralAssetDetailOpen(open);
          if (!open) { setSelectedGeneralAsset(null); refreshAllData(); }
        }}
        asset={selectedGeneralAsset || undefined}
      />
    </div>
  );
}
