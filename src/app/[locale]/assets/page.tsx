'use client';

import { useState, useEffect } from 'react';
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
import { useVehicleStore } from '@/lib/store/vehicle-store';
import { usePCStore } from '@/lib/store/pc-store';
import {
  Car,
  Plus,
  AlertTriangle,
  Wrench,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Filter,
  Search,
  Trash2,
  Monitor,
} from 'lucide-react';
import type { Vehicle, DeadlineWarning, PCAsset, Vendor } from '@/types/asset';
import { VehicleDetailModal } from '@/components/assets/VehicleDetailModal';
import { VehicleFormModal } from '@/components/assets/VehicleFormModal';
import { VendorFormModal } from '@/components/assets/VendorFormModal';
import { PCFormModal } from '@/components/assets/PCFormModal';

export default function AssetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance' | 'retired'>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [pcFormOpen, setPCFormOpen] = useState(false);
  const [editingPC, setEditingPC] = useState<PCAsset | null>(null);
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState<string>('all');
  const [maintenanceVendorFilter, setMaintenanceVendorFilter] = useState<string>('all');

  const { vehicles, vendors, getDeadlineWarnings, deleteVehicle, deleteVendor } = useVehicleStore();
  const { pcs, deletePC } = usePCStore();

  // 統計値をstateで管理（SSR/CSR不一致を防ぐ）
  const [stats, setStats] = useState({
    activeVehicles: 0,
    leasedVehicles: 0,
    totalMaintenanceRecords: 0,
    monthlyLeaseCost: 0,
    criticalWarningsCount: 0,
    warningsCount: 0,
    totalVehicles: 0,
    totalVendors: 0,
  });

  const [warnings, setWarnings] = useState<DeadlineWarning[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [mounted, setMounted] = useState(false);

  // マウント状態の設定（SSR/CSR差を吸収）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 統計値の計算（クライアント側でのみ実行）
  useEffect(() => {
    const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
    const leasedVehicles = vehicles.filter((v) => v.ownershipType === 'leased').length;
    const totalMaintenanceRecords = vehicles.reduce(
      (sum, v) => sum + v.maintenanceRecords.length,
      0
    );
    const monthlyLeaseCost = vehicles
      .filter((v) => v.ownershipType === 'leased' && v.leaseInfo)
      .reduce((sum, v) => sum + (v.leaseInfo?.monthlyCost || 0), 0);

    const currentWarnings = getDeadlineWarnings();
    const criticalWarningsCount = currentWarnings.filter((w) => w.level === 'critical').length;
    const warningsCount = currentWarnings.filter((w) => w.level === 'warning').length;

    setStats({
      activeVehicles,
      leasedVehicles,
      totalMaintenanceRecords,
      monthlyLeaseCost,
      criticalWarningsCount,
      warningsCount,
      totalVehicles: vehicles.length,
      totalVendors: vendors.length,
    });
    setWarnings(currentWarnings);
  }, [vehicles, vendors, getDeadlineWarnings]);

  // フィルタリングされた車両リスト
  useEffect(() => {
    const filtered = vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterStatus === 'all' || vehicle.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
    setFilteredVehicles(filtered);
  }, [vehicles, searchQuery, filterStatus]);

  // ステータスバッジ
  const getStatusBadge = (status: Vehicle['status']) => {
    const variants = {
      active: 'default',
      maintenance: 'secondary',
      retired: 'outline',
    } as const;
    const labels = {
      active: '稼働中',
      maintenance: '整備中',
      retired: '廃車',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // 所有形態バッジ
  const getOwnershipBadge = (type: Vehicle['ownershipType']) => {
    const labels = {
      owned: '自己所有',
      leased: 'リース',
      rental: 'レンタル',
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  // 期限レベルバッジ
  const getWarningLevelBadge = (level: DeadlineWarning['level']) => {
    const variants = {
      critical: 'destructive',
      warning: 'secondary',
      info: 'outline',
    } as const;
    const labels = {
      critical: '緊急',
      warning: '注意',
      info: '情報',
    };
    return <Badge variant={variants[level]}>{labels[level]}</Badge>;
  };

  // 期限種別ラベル
  const getDeadlineTypeLabel = (type: DeadlineWarning['deadlineType']) => {
    const labels = {
      inspection: '車検',
      maintenance: '点検',
      insurance: '保険',
      contract: 'リース契約',
      warranty: '保証',
    };
    return labels[type];
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

  // 全メンテナンス記録を集約（車両情報付き）
  const allMaintenanceRecords = vehicles.flatMap((vehicle) =>
    vehicle.maintenanceRecords.map((record) => ({
      ...record,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // フィルタリングされたメンテナンス記録
  const filteredMaintenanceRecords = allMaintenanceRecords.filter((record) => {
    const matchesType = maintenanceTypeFilter === 'all' || record.type === maintenanceTypeFilter;
    const matchesVendor = maintenanceVendorFilter === 'all' || record.vendorId === maintenanceVendorFilter;
    return matchesType && matchesVendor;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">資産管理</h1>
          <p className="text-muted-foreground mt-1">
            車両・PC・携帯電話などの資産を一元管理
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingVehicle(null);
            setFormModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">稼働車両</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVehicles}台</div>
            <p className="text-xs text-muted-foreground">総車両: {stats.totalVehicles}台</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">期限警告</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.criticalWarningsCount}件
            </div>
            <p className="text-xs text-muted-foreground">
              注意: {stats.warningsCount}件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">メンテナンス実績</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaintenanceRecords}件</div>
            <p className="text-xs text-muted-foreground">登録業者: {stats.totalVendors}社</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月リース費用</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyLeaseCost)}</div>
            <p className="text-xs text-muted-foreground">リース車両: {stats.leasedVehicles}台</p>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツ */}
      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="vehicles">車両一覧</TabsTrigger>
          <TabsTrigger value="pcs">PC一覧</TabsTrigger>
          <TabsTrigger value="warnings">
            期限警告
            {mounted && stats.criticalWarningsCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.criticalWarningsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance">メンテナンス</TabsTrigger>
          <TabsTrigger value="vendors">業者管理</TabsTrigger>
          <TabsTrigger value="costs">費用集計</TabsTrigger>
        </TabsList>

        {/* 車両一覧タブ */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>車両一覧</CardTitle>
                  <CardDescription>登録されている全車両の管理</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="車両番号、ナンバーで検索..."
                      className="pl-8 pr-4 py-2 border rounded-md w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-3 py-2 border rounded-md"
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
                            {vehicle.assignedTo ? (
                              <div>
                                {vehicle.assignedTo.userName}
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(vehicle.assignedTo.assignedDate)}～
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">未割当</span>
                            )}
                          </TableCell>
                          <TableCell>{getOwnershipBadge(vehicle.ownershipType)}</TableCell>
                          <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(vehicle.inspectionDate)}</div>
                            <div className="text-xs text-muted-foreground">
                              {calculateDaysRemaining(vehicle.inspectionDate)}日後
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(vehicle.maintenanceDate)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {calculateDaysRemaining(vehicle.maintenanceDate)}日後
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVehicle(vehicle);
                                  setDetailModalOpen(true);
                                }}
                              >
                                詳細
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingVehicle(vehicle);
                                  setFormModalOpen(true);
                                }}
                              >
                                編集
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm(`車両 ${vehicle.vehicleNumber} を削除してもよろしいですか？`)) {
                                    deleteVehicle(vehicle.id);
                                  }
                                }}
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

        {/* PC一覧タブ */}
        <TabsContent value="pcs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>PC一覧</CardTitle>
                  <CardDescription>登録されている全PCの管理</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingPC(null);
                    setPCFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  PC登録
                </Button>
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
                  {pcs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        PCが見つかりません
                      </TableCell>
                    </TableRow>
                  ) : (
                    pcs.map((pc) => (
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
                          {pc.assignedTo ? (
                            <div>
                              {pc.assignedTo.userName}
                              <div className="text-xs text-muted-foreground">
                                {formatDate(pc.assignedTo.assignedDate)}～
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">未割当</span>
                          )}
                        </TableCell>
                        <TableCell>{getOwnershipBadge(pc.ownershipType)}</TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(pc.warrantyExpiration)}</div>
                          <div className="text-xs text-muted-foreground">
                            {calculateDaysRemaining(pc.warrantyExpiration)}日後
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(pc.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPC(pc);
                                setPCFormOpen(true);
                              }}
                            >
                              編集
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`PC ${pc.assetNumber} を削除してもよろしいですか？`)) {
                                  deletePC(pc.id);
                                }
                              }}
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

        {/* 期限警告タブ */}
        <TabsContent value="warnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>期限警告</CardTitle>
              <CardDescription>
                車検・点検・保険などの期限が近い車両（60日以内）
              </CardDescription>
            </CardHeader>
            <CardContent>
                {warnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    期限が近い項目はありません
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>レベル</TableHead>
                        <TableHead>種別</TableHead>
                        <TableHead>車両</TableHead>
                        <TableHead>期限日</TableHead>
                        <TableHead>残日数</TableHead>
                        <TableHead className="text-right">アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warnings.map((warning) => (
                        <TableRow key={warning.id}>
                          <TableCell>{getWarningLevelBadge(warning.level)}</TableCell>
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
                                  : 'text-orange-600'
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
                                const vehicle = vehicles.find((v) => v.id === warning.assetId);
                                if (vehicle) {
                                  setSelectedVehicle(vehicle);
                                  setDetailModalOpen(true);
                                }
                              }}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>メンテナンス履歴</CardTitle>
                  <CardDescription>全車両のメンテナンス記録</CardDescription>
                </div>
                <div className="flex gap-2">
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
              </div>
            </CardHeader>
            <CardContent>
              {filteredMaintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  メンテナンス記録がありません
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>車両</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead>業者</TableHead>
                      <TableHead>費用</TableHead>
                      <TableHead>内容</TableHead>
                      <TableHead>作業者</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenanceRecords.map((record) => {
                      const vehicle = vehicles.find((v) => v.vehicleNumber === record.vehicleNumber);
                      return (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.vehicleNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.vehicleName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getMaintenanceTypeLabel(record.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.vendorName}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(record.cost)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.description}
                          {record.notes && (
                            <div className="text-xs text-muted-foreground">
                              {record.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.performedByName}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (vehicle) {
                                setSelectedVehicle(vehicle);
                                setDetailModalOpen(true);
                              }
                            }}
                          >
                            詳細
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>業者管理</CardTitle>
                  <CardDescription>メンテナンス業者の管理</CardDescription>
                </div>
                <Button variant="outline" onClick={() => {
                  setEditingVendor(null);
                  setVendorFormOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  業者追加
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
                      <TableHead>作業実績</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.contactPerson}</TableCell>
                        <TableCell>{vendor.phone}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {vendor.address}
                        </TableCell>
                        <TableCell>
                          {vendor.rating && (
                            <div className="flex items-center">
                              {'★'.repeat(vendor.rating)}
                              {'☆'.repeat(5 - vendor.rating)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{vendor.workCount || 0}件</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingVendor(vendor);
                                setVendorFormOpen(true);
                              }}
                            >
                              編集
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`業者 ${vendor.name} を削除してもよろしいですか？`)) {
                                  deleteVendor(vendor.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 費用集計タブ */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>費用集計</CardTitle>
              <CardDescription>リース費用・メンテナンス費用の月次集計</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                費用集計機能は開発中です
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 車両詳細モーダル */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={(vehicle) => {
          setEditingVehicle(vehicle);
          setFormModalOpen(true);
        }}
        onDelete={(vehicleId) => {
          deleteVehicle(vehicleId);
        }}
      />

      {/* 車両登録・編集モーダル */}
      <VehicleFormModal
        open={formModalOpen}
        onOpenChange={(open) => {
          setFormModalOpen(open);
          if (!open) {
            setEditingVehicle(null);
          }
        }}
        vehicle={editingVehicle}
      />

      {/* 業者追加・編集モーダル */}
      <VendorFormModal
        open={vendorFormOpen}
        onOpenChange={(open) => {
          setVendorFormOpen(open);
          if (!open) {
            setEditingVendor(null);
          }
        }}
        vendor={editingVendor}
      />

      {/* PC追加・編集モーダル */}
      <PCFormModal
        open={pcFormOpen}
        onOpenChange={(open) => {
          setPCFormOpen(open);
          if (!open) {
            setEditingPC(null);
          }
        }}
        pc={editingPC}
      />
    </div>
  );
}
