'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { VehicleFromAPI, VendorFromAPI } from '@/hooks/use-vehicles-api';

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: VehicleFromAPI[];
  vendors: VendorFromAPI[];
  onSubmit: (data: MaintenanceFormData) => Promise<{ success: boolean; error?: string }>;
  preSelectedVehicleId?: string;
}

export interface MaintenanceFormData {
  vehicleId: string;
  type: string;
  date: string;
  mileage: number | null;
  cost: number;
  vendorId: string | null;
  description: string | null;
  nextDueDate: string | null;
  nextDueMileage: number | null;
  performedBy: string | null;
  notes: string | null;
}

const MAINTENANCE_TYPES = [
  { value: 'oil_change', label: 'オイル交換' },
  { value: 'tire_change', label: 'タイヤ交換' },
  { value: 'inspection', label: '点検' },
  { value: 'shaken', label: '車検' },
  { value: 'repair', label: '修理' },
  { value: 'other', label: 'その他' },
];

export function MaintenanceDialog({
  open,
  onOpenChange,
  vehicles,
  vendors,
  onSubmit,
  preSelectedVehicleId,
}: MaintenanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームの状態
  const [formData, setFormData] = useState<MaintenanceFormData>({
    vehicleId: preSelectedVehicleId || '',
    type: 'oil_change',
    date: new Date().toISOString().split('T')[0],
    mileage: null,
    cost: 0,
    vendorId: null,
    description: null,
    nextDueDate: null,
    nextDueMileage: null,
    performedBy: null,
    notes: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.vehicleId) {
      setError('車両を選択してください');
      return;
    }

    if (!formData.date) {
      setError('日付を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        // フォームをリセット
        setFormData({
          vehicleId: '',
          type: 'oil_change',
          date: new Date().toISOString().split('T')[0],
          mileage: null,
          cost: 0,
          vendorId: null,
          description: null,
          nextDueDate: null,
          nextDueMileage: null,
          performedBy: null,
          notes: null,
        });
        onOpenChange(false);
      } else {
        setError(result.error || '登録に失敗しました');
      }
    } catch {
      setError('登録中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: preSelectedVehicleId || '',
      type: 'oil_change',
      date: new Date().toISOString().split('T')[0],
      mileage: null,
      cost: 0,
      vendorId: null,
      description: null,
      nextDueDate: null,
      nextDueMileage: null,
      performedBy: null,
      notes: null,
    });
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetForm();
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>メンテナンス記録の登録</DialogTitle>
          <DialogDescription>
            車両のメンテナンス・修理記録を登録します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {/* 車両選択 */}
          <div className="space-y-2">
            <Label htmlFor="vehicleId">車両 *</Label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">車両を選択してください</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicleNumber} - {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                </option>
              ))}
            </select>
          </div>

          {/* メンテナンス種別 */}
          <div className="space-y-2">
            <Label htmlFor="type">種別 *</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              {MAINTENANCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 日付と走行距離 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">実施日 *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">走行距離 (km)</Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formData.mileage || ''}
                onChange={handleNumberChange}
                placeholder="例: 50000"
              />
            </div>
          </div>

          {/* 費用と業者 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">費用 (円) *</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleNumberChange}
                placeholder="例: 10000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorId">業者</Label>
              <select
                id="vendorId"
                name="vendorId"
                value={formData.vendorId || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択なし</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 作業内容 */}
          <div className="space-y-2">
            <Label htmlFor="description">作業内容</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="例: エンジンオイル交換、オイルフィルター交換"
              rows={3}
            />
          </div>

          {/* 次回予定 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextDueDate">次回予定日</Label>
              <Input
                id="nextDueDate"
                name="nextDueDate"
                type="date"
                value={formData.nextDueDate || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextDueMileage">次回予定距離 (km)</Label>
              <Input
                id="nextDueMileage"
                name="nextDueMileage"
                type="number"
                value={formData.nextDueMileage || ''}
                onChange={handleNumberChange}
                placeholder="例: 55000"
              />
            </div>
          </div>

          {/* 作業者・備考 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="performedBy">作業担当者</Label>
              <Input
                id="performedBy"
                name="performedBy"
                type="text"
                value={formData.performedBy || ''}
                onChange={handleInputChange}
                placeholder="例: 田中太郎"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Input
                id="notes"
                name="notes"
                type="text"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="追加情報など"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              登録する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
