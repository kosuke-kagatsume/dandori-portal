'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MaintenanceRecord, MonthlyMileage, Vehicle } from '@/types/asset';
import { Calendar, DollarSign, Edit, Gauge, Plus, Trash2, Wrench } from 'lucide-react';
import { MaintenanceFormModal } from './MaintenanceFormModal';
import { MileageFormModal } from './MileageFormModal';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicleId: string) => void;
}

export function VehicleDetailModal({
  vehicle,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: VehicleDetailModalProps) {
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | undefined>(undefined);
  const [mileageFormOpen, setMileageFormOpen] = useState(false);
  const [editingMileage, setEditingMileage] = useState<MonthlyMileage | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_deleteConfirmOpen, _setDeleteConfirmOpen] = useState(false); // 削除確認ダイアログで使用予定

  if (!vehicle) return null;

  const handleAddMaintenance = () => {
    setEditingMaintenance(undefined);
    setMaintenanceFormOpen(true);
  };

  const handleEditMaintenance = (maintenance: MaintenanceRecord) => {
    setEditingMaintenance(maintenance);
    setMaintenanceFormOpen(true);
  };

  const handleAddMileage = () => {
    setEditingMileage(undefined);
    setMileageFormOpen(true);
  };

  const handleEditMileage = (mileage: MonthlyMileage) => {
    setEditingMileage(mileage);
    setMileageFormOpen(true);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(vehicle);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`車両 ${vehicle.vehicleNumber} を削除してもよろしいですか？`)) {
      onDelete(vehicle.id);
      onOpenChange(false);
    }
  };

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

  // タイヤ種別ラベル
  const getTireTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      summer: '夏タイヤ',
      winter: '冬タイヤ',
    };
    return labels[type] || type;
  };

  // 期限までの残日数計算
  const getDaysRemaining = (dateString: string) => {
    const days = Math.ceil(
      (new Date(dateString).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {vehicle.make} {vehicle.model}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {vehicle.vehicleNumber} - {vehicle.licensePlate}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(vehicle.status)}
              {getOwnershipBadge(vehicle.ownershipType)}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="deadlines">期限管理</TabsTrigger>
            <TabsTrigger value="mileage">走行距離</TabsTrigger>
            <TabsTrigger value="maintenance">メンテナンス</TabsTrigger>
          </TabsList>

          {/* 基本情報タブ */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  車両情報
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">車両番号:</span>
                    <span className="font-medium">{vehicle.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ナンバープレート:</span>
                    <span className="font-medium">{vehicle.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">メーカー:</span>
                    <span className="font-medium">{vehicle.make}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">車種:</span>
                    <span className="font-medium">{vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">年式:</span>
                    <span className="font-medium">{vehicle.year}年</span>
                  </div>
                  {vehicle.color && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">色:</span>
                      <span className="font-medium">{vehicle.color}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  割当・使用状況
                </h3>
                <div className="space-y-1 text-sm">
                  {vehicle.assignedTo ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">割当先:</span>
                        <span className="font-medium">
                          {vehicle.assignedTo.userName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">割当日:</span>
                        <span className="font-medium">
                          {formatDate(vehicle.assignedTo.assignedDate)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">未割当</div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">現在タイヤ:</span>
                    <span className="font-medium">
                      {getTireTypeLabel(vehicle.currentTireType)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 所有・リース情報 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                所有・リース情報
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">所有形態:</span>
                    <span className="font-medium">
                      {getOwnershipBadge(vehicle.ownershipType)}
                    </span>
                  </div>
                  {vehicle.ownershipType === 'owned' && vehicle.purchaseDate && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">購入日:</span>
                        <span className="font-medium">
                          {formatDate(vehicle.purchaseDate)}
                        </span>
                      </div>
                      {vehicle.purchaseCost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">購入価格:</span>
                          <span className="font-medium">
                            {formatCurrency(vehicle.purchaseCost)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {vehicle.ownershipType === 'leased' && vehicle.leaseInfo && (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">リース会社:</span>
                      <span className="font-medium">{vehicle.leaseInfo.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">月額費用:</span>
                      <span className="font-medium">
                        {formatCurrency(vehicle.leaseInfo.monthlyCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">契約期間:</span>
                      <span className="font-medium">
                        {formatDate(vehicle.leaseInfo.contractStart)} 〜{' '}
                        {formatDate(vehicle.leaseInfo.contractEnd)}
                      </span>
                    </div>
                    {vehicle.leaseInfo.contactPerson && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">担当者:</span>
                        <span className="font-medium">
                          {vehicle.leaseInfo.contactPerson}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {vehicle.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    備考
                  </h3>
                  <p className="text-sm">{vehicle.notes}</p>
                </div>
              </>
            )}
          </TabsContent>

          {/* 期限管理タブ */}
          <TabsContent value="deadlines" className="space-y-4">
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">車検</h3>
                  </div>
                  {getDaysRemaining(vehicle.inspectionDate) <= 30 && (
                    <Badge variant="destructive">
                      残{getDaysRemaining(vehicle.inspectionDate)}日
                    </Badge>
                  )}
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">次回車検日:</span>
                    <span className="font-medium">
                      {formatDate(vehicle.inspectionDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">点検</h3>
                  </div>
                  {getDaysRemaining(vehicle.maintenanceDate) <= 30 && (
                    <Badge variant="destructive">
                      残{getDaysRemaining(vehicle.maintenanceDate)}日
                    </Badge>
                  )}
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">次回点検日:</span>
                    <span className="font-medium">
                      {formatDate(vehicle.maintenanceDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">保険</h3>
                  </div>
                  {getDaysRemaining(vehicle.insuranceDate) <= 30 && (
                    <Badge variant="destructive">
                      残{getDaysRemaining(vehicle.insuranceDate)}日
                    </Badge>
                  )}
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">保険更新日:</span>
                    <span className="font-medium">
                      {formatDate(vehicle.insuranceDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 走行距離タブ */}
          <TabsContent value="mileage" className="space-y-4">
            {vehicle.mileageTracking ? (
              <>
                {vehicle.currentMileage !== undefined && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">現在の総走行距離</h3>
                    </div>
                    <div className="text-2xl font-bold">
                      {vehicle.currentMileage.toLocaleString()} km
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      月次走行距離履歴
                    </h3>
                    <Button size="sm" onClick={handleAddMileage}>
                      <Plus className="mr-2 h-4 w-4" />
                      記録追加
                    </Button>
                  </div>
                  {vehicle.monthlyMileages.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>年月</TableHead>
                          <TableHead>走行距離</TableHead>
                          <TableHead>記録者</TableHead>
                          <TableHead>記録日</TableHead>
                          <TableHead className="w-20">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicle.monthlyMileages.map((mileage) => (
                          <TableRow key={mileage.id}>
                            <TableCell>{mileage.month}</TableCell>
                            <TableCell>{mileage.distance.toLocaleString()} km</TableCell>
                            <TableCell>{mileage.recordedByName}</TableCell>
                            <TableCell>{formatDate(mileage.recordedAt)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMileage(mileage)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      走行距離の記録がありません
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                この車両は走行距離管理が無効になっています
              </div>
            )}
          </TabsContent>

          {/* メンテナンスタブ */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleAddMaintenance}>
                <Plus className="mr-2 h-4 w-4" />
                記録追加
              </Button>
            </div>

            {vehicle.maintenanceRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>業者</TableHead>
                    <TableHead>費用</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicle.maintenanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getMaintenanceTypeLabel(record.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.vendorName}</TableCell>
                      <TableCell>{formatCurrency(record.cost)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.description}
                        {record.tireType && ` (${getTireTypeLabel(record.tireType)})`}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMaintenance(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                メンテナンス履歴がありません
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* フッターアクション */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              閉じる
            </Button>
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </div>
        </div>

        {/* メンテナンス記録追加モーダル */}
        <MaintenanceFormModal
          open={maintenanceFormOpen}
          onOpenChange={setMaintenanceFormOpen}
          vehicle={vehicle}
          maintenance={editingMaintenance}
        />

        {/* 月次走行距離追加モーダル */}
        <MileageFormModal
          open={mileageFormOpen}
          onOpenChange={setMileageFormOpen}
          vehicle={vehicle}
          mileage={editingMileage}
        />
      </DialogContent>
    </Dialog>
  );
}
