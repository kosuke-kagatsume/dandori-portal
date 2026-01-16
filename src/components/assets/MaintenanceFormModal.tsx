'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MaintenanceRecord, MaintenanceType, Vehicle } from '@/types/asset';
import { useVehicleStore } from '@/lib/store/vehicle-store';

interface MaintenanceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  maintenance?: MaintenanceRecord;
}

const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  oil_change: 'オイル交換',
  tire_change: 'タイヤ交換',
  inspection: '点検',
  shaken: '車検',
  repair: '修理',
  other: 'その他',
};

export function MaintenanceFormModal({
  open,
  onOpenChange,
  vehicle,
  maintenance,
}: MaintenanceFormModalProps) {
  const { addMaintenanceRecord, updateMaintenanceRecord } = useVehicleStore();
  const isEdit = !!maintenance;

  const [formData, setFormData] = useState({
    type: maintenance?.type || 'inspection' as MaintenanceType,
    date: maintenance?.date || new Date().toISOString().split('T')[0],
    mileage: maintenance?.mileage?.toString() || vehicle.currentMileage?.toString() || '',
    cost: maintenance?.cost?.toString() || '',
    vendorId: maintenance?.vendorId || '',
    description: maintenance?.description || '',
    nextDueDate: maintenance?.nextDueDate || '',
    nextDueMileage: maintenance?.nextDueMileage?.toString() || '',
    tireType: maintenance?.tireType || vehicle.currentTireType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 業者名を取得
    const vendors = useVehicleStore.getState().vendors;
    const selectedVendor = vendors.find((v) => v.id === formData.vendorId);

    const newRecord: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      vehicleId: vehicle.id,
      type: formData.type,
      date: formData.date,
      mileage: formData.mileage ? Number(formData.mileage) : undefined,
      cost: formData.cost ? Number(formData.cost) : 0,
      vendorId: formData.vendorId || undefined,
      vendorName: selectedVendor?.name,
      description: formData.description || undefined,
      nextDueDate: formData.nextDueDate || undefined,
      nextDueMileage: formData.nextDueMileage ? Number(formData.nextDueMileage) : undefined,
      tireType: formData.type === 'tire_change' ? formData.tireType : undefined,
    };

    if (isEdit && maintenance) {
      updateMaintenanceRecord(vehicle.id, maintenance.id, newRecord);
    } else {
      addMaintenanceRecord(vehicle.id, newRecord);
    }

    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'メンテナンス記録編集' : 'メンテナンス記録追加'} - {vehicle.vehicleNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本情報</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">メンテナンス種別 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                  required
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(maintenanceTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">実施日 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            {formData.type === 'tire_change' && (
              <div className="space-y-2">
                <Label htmlFor="tireType">タイヤ種別</Label>
                <Select
                  value={formData.tireType}
                  onValueChange={(value) => handleChange('tireType', value)}
                >
                  <SelectTrigger id="tireType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summer">夏タイヤ</SelectItem>
                    <SelectItem value="winter">冬タイヤ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 走行距離・費用 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">走行距離・費用</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mileage">走行距離 (km)</Label>
                <Input
                  id="mileage"
                  type="number"
                  placeholder="12000"
                  value={formData.mileage}
                  onChange={(e) => handleChange('mileage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">費用 (円)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="50000"
                  value={formData.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 業者・詳細 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">業者・詳細</h3>

            <div className="space-y-2">
              <Label htmlFor="vendorId">業者</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(value) => handleChange('vendorId', value)}
              >
                <SelectTrigger id="vendorId">
                  <SelectValue placeholder="業者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {useVehicleStore.getState().vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">詳細・備考</Label>
              <Textarea
                id="description"
                placeholder="実施内容や特記事項を入力"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* 次回予定 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">次回予定</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">次回実施予定日</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => handleChange('nextDueDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextDueMileage">次回実施予定距離 (km)</Label>
                <Input
                  id="nextDueMileage"
                  type="number"
                  placeholder="15000"
                  value={formData.nextDueMileage}
                  onChange={(e) => handleChange('nextDueMileage', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">
              {isEdit ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
