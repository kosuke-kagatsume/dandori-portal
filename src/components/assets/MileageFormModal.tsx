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
import type { MonthlyMileage, Vehicle } from '@/types/asset';
import { useVehicleStore } from '@/lib/store/vehicle-store';
import { useUserStore } from '@/lib/store';

interface MileageFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  mileage?: MonthlyMileage;
}

export function MileageFormModal({
  open,
  onOpenChange,
  vehicle,
  mileage,
}: MileageFormModalProps) {
  const { addMonthlyMileage, updateMonthlyMileage } = useVehicleStore();
  const { currentUser } = useUserStore();
  const isEdit = !!mileage;

  // 今月のデフォルト値
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    month: mileage?.month || getCurrentMonth(),
    distance: mileage?.distance?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.distance || Number(formData.distance) <= 0) {
      alert('走行距離を入力してください');
      return;
    }

    const newMileage: Omit<MonthlyMileage, 'id' | 'recordedAt'> = {
      month: formData.month,
      distance: Number(formData.distance),
      recordedBy: currentUser?.id || 'unknown',
      recordedByName: currentUser?.name || '不明',
    };

    if (isEdit && mileage) {
      updateMonthlyMileage(vehicle.id, mileage.id, newMileage);
    } else {
      addMonthlyMileage(vehicle.id, newMileage);
    }

    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '月次走行距離編集' : '月次走行距離追加'} - {vehicle.vehicleNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month">対象月 *</Label>
            <Input
              id="month"
              type="month"
              value={formData.month}
              onChange={(e) => handleChange('month', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">走行距離 (km) *</Label>
            <Input
              id="distance"
              type="number"
              placeholder="1200"
              value={formData.distance}
              onChange={(e) => handleChange('distance', e.target.value)}
              required
              min="0"
            />
          </div>

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
