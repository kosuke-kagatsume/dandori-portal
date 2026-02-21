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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVehiclesAPI, type VehicleFromAPI } from '@/hooks/use-vehicles-api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: VehicleFromAPI;
}

const OWNERSHIP_TYPES = [
  { value: 'owned', label: '自社所有' },
  { value: 'leased', label: 'リース' },
  { value: 'rental', label: 'レンタル' },
];

const VEHICLE_STATUSES = [
  { value: 'active', label: '稼働中' },
  { value: 'maintenance', label: '整備中' },
  { value: 'retired', label: '退役' },
];

const TIRE_TYPES = [
  { value: 'summer', label: '夏タイヤ' },
  { value: 'winter', label: '冬タイヤ' },
  { value: 'all_season', label: 'オールシーズン' },
];

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
}: VehicleFormDialogProps) {
  const { createVehicle, updateVehicle } = useVehiclesAPI();
  const isEdit = !!vehicle;

  const [formData, setFormData] = useState({
    vehicleNumber: vehicle?.vehicleNumber || '',
    licensePlate: vehicle?.licensePlate || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year?.toString() || new Date().getFullYear().toString(),
    color: vehicle?.color || '',
    vin: vehicle?.vin || '',
    ownershipType: vehicle?.ownershipType || 'owned',
    status: vehicle?.status || 'active',
    assignedUserName: vehicle?.assignedUserName || '',
    assignedDate: vehicle?.assignedDate?.split('T')[0] || '',
    inspectionDate: vehicle?.inspectionDate?.split('T')[0] || '',
    maintenanceDate: vehicle?.maintenanceDate?.split('T')[0] || '',
    insuranceDate: vehicle?.insuranceDate?.split('T')[0] || '',
    tireChangeDate: vehicle?.tireChangeDate?.split('T')[0] || '',
    currentTireType: vehicle?.currentTireType || 'summer',
    leaseMonthlyCost: vehicle?.leaseMonthlyCost?.toString() || '',
    leaseStartDate: vehicle?.leaseStartDate?.split('T')[0] || '',
    leaseEndDate: vehicle?.leaseEndDate?.split('T')[0] || '',
    purchaseCost: vehicle?.purchaseCost?.toString() || '',
    purchaseDate: vehicle?.purchaseDate?.split('T')[0] || '',
    warrantyExpiration: vehicle?.warrantyExpiration?.split('T')[0] || '',
    notes: vehicle?.notes || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const vehicleData: Partial<VehicleFromAPI> = {
      vehicleNumber: formData.vehicleNumber,
      licensePlate: formData.licensePlate,
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year) || new Date().getFullYear(),
      color: formData.color || null,
      vin: formData.vin || null,
      ownershipType: formData.ownershipType,
      status: formData.status,
      assignedUserName: formData.assignedUserName || null,
      assignedDate: formData.assignedDate || null,
      inspectionDate: formData.inspectionDate || null,
      maintenanceDate: formData.maintenanceDate || null,
      insuranceDate: formData.insuranceDate || null,
      tireChangeDate: formData.tireChangeDate || null,
      currentTireType: formData.currentTireType || null,
      leaseMonthlyCost: formData.leaseMonthlyCost ? parseInt(formData.leaseMonthlyCost) : null,
      leaseStartDate: formData.leaseStartDate || null,
      leaseEndDate: formData.leaseEndDate || null,
      purchaseCost: formData.purchaseCost ? parseInt(formData.purchaseCost) : null,
      purchaseDate: formData.purchaseDate || null,
      warrantyExpiration: formData.warrantyExpiration || null,
      notes: formData.notes || null,
    };

    let result;
    if (isEdit && vehicle) {
      result = await updateVehicle(vehicle.id, vehicleData);
    } else {
      result = await createVehicle(vehicleData);
    }

    setLoading(false);

    if (result.success) {
      toast.success(isEdit ? '車両情報を更新しました' : '車両を登録しました');
      onOpenChange(false);
    } else {
      toast.error(result.error || '保存に失敗しました');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '車両編集' : '車両登録'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="management">管理情報</TabsTrigger>
              <TabsTrigger value="cost">費用・期限</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">管理番号 *</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="V-001"
                    value={formData.vehicleNumber}
                    onChange={(e) => handleChange('vehicleNumber', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">ナンバープレート *</Label>
                  <Input
                    id="licensePlate"
                    placeholder="品川 500 あ 1234"
                    value={formData.licensePlate}
                    onChange={(e) => handleChange('licensePlate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">メーカー *</Label>
                  <Input
                    id="make"
                    placeholder="トヨタ"
                    value={formData.make}
                    onChange={(e) => handleChange('make', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">型式 *</Label>
                  <Input
                    id="model"
                    placeholder="プリウス"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">年式 *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1990"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">色</Label>
                  <Input
                    id="color"
                    placeholder="白"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">車台番号</Label>
                  <Input
                    id="vin"
                    placeholder="VIN"
                    value={formData.vin}
                    onChange={(e) => handleChange('vin', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownershipType">所有形態</Label>
                  <Select
                    value={formData.ownershipType}
                    onValueChange={(value) => handleChange('ownershipType', value)}
                  >
                    <SelectTrigger id="ownershipType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OWNERSHIP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">ステータス</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedUserName">使用者</Label>
                  <Input
                    id="assignedUserName"
                    placeholder="山田太郎"
                    value={formData.assignedUserName}
                    onChange={(e) => handleChange('assignedUserName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedDate">使用開始日</Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={formData.assignedDate}
                    onChange={(e) => handleChange('assignedDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentTireType">現在のタイヤ</Label>
                  <Select
                    value={formData.currentTireType}
                    onValueChange={(value) => handleChange('currentTireType', value)}
                  >
                    <SelectTrigger id="currentTireType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIRE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tireChangeDate">タイヤ交換日</Label>
                  <Input
                    id="tireChangeDate"
                    type="date"
                    value={formData.tireChangeDate}
                    onChange={(e) => handleChange('tireChangeDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  placeholder="その他メモ"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="cost" className="space-y-4 mt-4">
              {formData.ownershipType === 'leased' && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">リース情報</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leaseMonthlyCost">月額リース料 (円)</Label>
                      <Input
                        id="leaseMonthlyCost"
                        type="number"
                        placeholder="50000"
                        value={formData.leaseMonthlyCost}
                        onChange={(e) => handleChange('leaseMonthlyCost', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseStartDate">リース開始日</Label>
                      <Input
                        id="leaseStartDate"
                        type="date"
                        value={formData.leaseStartDate}
                        onChange={(e) => handleChange('leaseStartDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseEndDate">リース終了日</Label>
                      <Input
                        id="leaseEndDate"
                        type="date"
                        value={formData.leaseEndDate}
                        onChange={(e) => handleChange('leaseEndDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.ownershipType === 'owned' && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">購入情報</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchaseCost">購入価格 (円)</Label>
                      <Input
                        id="purchaseCost"
                        type="number"
                        placeholder="3000000"
                        value={formData.purchaseCost}
                        onChange={(e) => handleChange('purchaseCost', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">購入日</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => handleChange('purchaseDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">期限管理</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inspectionDate">車検期限</Label>
                    <Input
                      id="inspectionDate"
                      type="date"
                      value={formData.inspectionDate}
                      onChange={(e) => handleChange('inspectionDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuranceDate">保険期限</Label>
                    <Input
                      id="insuranceDate"
                      type="date"
                      value={formData.insuranceDate}
                      onChange={(e) => handleChange('insuranceDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceDate">次回点検日</Label>
                    <Input
                      id="maintenanceDate"
                      type="date"
                      value={formData.maintenanceDate}
                      onChange={(e) => handleChange('maintenanceDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warrantyExpiration">保証期限</Label>
                    <Input
                      id="warrantyExpiration"
                      type="date"
                      value={formData.warrantyExpiration}
                      onChange={(e) => handleChange('warrantyExpiration', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : isEdit ? '更新' : '登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
