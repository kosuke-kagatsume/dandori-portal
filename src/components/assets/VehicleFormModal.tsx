'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { Vehicle, OwnershipType, AssetStatus, TireType } from '@/types/asset';
import { useVehicleStore } from '@/lib/store/vehicle-store';

interface VehicleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null; // 編集時はvehicleを渡す
}

export function VehicleFormModal({
  open,
  onOpenChange,
  vehicle,
}: VehicleFormModalProps) {
  const { addVehicle, updateVehicle } = useVehicleStore();
  const isEdit = !!vehicle;

  // フォーム状態
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    ownershipType: 'owned' as OwnershipType,
    purchaseDate: '',
    purchaseCost: '',
    leaseCompany: '',
    leaseMonthlyCost: '',
    leaseContractStart: '',
    leaseContractEnd: '',
    leaseContactPerson: '',
    leasePhone: '',
    inspectionDate: '',
    maintenanceDate: '',
    insuranceDate: '',
    currentTireType: 'summer' as TireType,
    status: 'active' as AssetStatus,
    mileageTracking: false,
    currentMileage: '',
    notes: '',
  });

  // 編集時は初期値をセット
  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleNumber: vehicle.vehicleNumber,
        licensePlate: vehicle.licensePlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        ownershipType: vehicle.ownershipType,
        purchaseDate: vehicle.purchaseDate || '',
        purchaseCost: vehicle.purchaseCost?.toString() || '',
        leaseCompany: vehicle.leaseInfo?.company || '',
        leaseMonthlyCost: vehicle.leaseInfo?.monthlyCost.toString() || '',
        leaseContractStart: vehicle.leaseInfo?.contractStart || '',
        leaseContractEnd: vehicle.leaseInfo?.contractEnd || '',
        leaseContactPerson: vehicle.leaseInfo?.contactPerson || '',
        leasePhone: vehicle.leaseInfo?.phone || '',
        inspectionDate: vehicle.inspectionDate,
        maintenanceDate: vehicle.maintenanceDate,
        insuranceDate: vehicle.insuranceDate,
        currentTireType: vehicle.currentTireType,
        status: vehicle.status,
        mileageTracking: vehicle.mileageTracking,
        currentMileage: vehicle.currentMileage?.toString() || '',
        notes: vehicle.notes || '',
      });
    } else {
      // 新規登録時はリセット
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const nextYearDate = nextYear.toISOString().split('T')[0];

      setFormData({
        vehicleNumber: '',
        licensePlate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        ownershipType: 'owned',
        purchaseDate: today,
        purchaseCost: '',
        leaseCompany: '',
        leaseMonthlyCost: '',
        leaseContractStart: today,
        leaseContractEnd: nextYearDate,
        leaseContactPerson: '',
        leasePhone: '',
        inspectionDate: nextYearDate,
        maintenanceDate: nextYearDate,
        insuranceDate: nextYearDate,
        currentTireType: 'summer',
        status: 'active',
        mileageTracking: false,
        currentMileage: '',
        notes: '',
      });
    }
  }, [vehicle, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> = {
      vehicleNumber: formData.vehicleNumber,
      licensePlate: formData.licensePlate,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      color: formData.color || undefined,
      assignedTo: null, // 新規登録時は未割当
      ownershipType: formData.ownershipType,
      purchaseDate: formData.ownershipType === 'owned' ? formData.purchaseDate : undefined,
      purchaseCost: formData.ownershipType === 'owned' && formData.purchaseCost
        ? Number(formData.purchaseCost)
        : undefined,
      leaseInfo: formData.ownershipType === 'leased'
        ? {
            company: formData.leaseCompany,
            monthlyCost: Number(formData.leaseMonthlyCost),
            contractStart: formData.leaseContractStart,
            contractEnd: formData.leaseContractEnd,
            contactPerson: formData.leaseContactPerson || undefined,
            phone: formData.leasePhone || undefined,
          }
        : undefined,
      inspectionDate: formData.inspectionDate,
      maintenanceDate: formData.maintenanceDate,
      insuranceDate: formData.insuranceDate,
      currentTireType: formData.currentTireType,
      status: formData.status,
      mileageTracking: formData.mileageTracking,
      currentMileage: formData.mileageTracking && formData.currentMileage
        ? Number(formData.currentMileage)
        : undefined,
      monthlyMileages: vehicle?.monthlyMileages || [],
      maintenanceRecords: vehicle?.maintenanceRecords || [],
      notes: formData.notes || undefined,
    };

    if (isEdit && vehicle) {
      updateVehicle(vehicle.id, newVehicle);
    } else {
      addVehicle(newVehicle);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '車両編集' : '新規車両登録'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '車両情報を編集します' : '新しい車両を登録します'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">基本情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">
                  車両番号 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vehicleNumber"
                  required
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleNumber: e.target.value })
                  }
                  placeholder="V-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">
                  ナンバープレート <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="licensePlate"
                  required
                  value={formData.licensePlate}
                  onChange={(e) =>
                    setFormData({ ...formData, licensePlate: e.target.value })
                  }
                  placeholder="品川 500 あ 12-34"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">
                  メーカー <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="make"
                  required
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="トヨタ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">
                  車種 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="プリウス"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">
                  年式 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">色</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="シルバー"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 所有・リース情報 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">所有・リース情報</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ownershipType">所有形態</Label>
                <Select
                  value={formData.ownershipType}
                  onValueChange={(value: OwnershipType) =>
                    setFormData({ ...formData, ownershipType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owned">自己所有</SelectItem>
                    <SelectItem value="leased">リース</SelectItem>
                    <SelectItem value="rental">レンタル</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.ownershipType === 'owned' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">購入日</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaseCost">購入価格（円）</Label>
                    <Input
                      id="purchaseCost"
                      type="number"
                      value={formData.purchaseCost}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseCost: e.target.value })
                      }
                      placeholder="2500000"
                    />
                  </div>
                </div>
              )}

              {formData.ownershipType === 'leased' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leaseCompany">
                        リース会社 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="leaseCompany"
                        required
                        value={formData.leaseCompany}
                        onChange={(e) =>
                          setFormData({ ...formData, leaseCompany: e.target.value })
                        }
                        placeholder="トヨタファイナンス"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseMonthlyCost">
                        月額費用（円） <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="leaseMonthlyCost"
                        type="number"
                        required
                        value={formData.leaseMonthlyCost}
                        onChange={(e) =>
                          setFormData({ ...formData, leaseMonthlyCost: e.target.value })
                        }
                        placeholder="45000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseContractStart">
                        契約開始日 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="leaseContractStart"
                        type="date"
                        required
                        value={formData.leaseContractStart}
                        onChange={(e) =>
                          setFormData({ ...formData, leaseContractStart: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseContractEnd">
                        契約終了日 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="leaseContractEnd"
                        type="date"
                        required
                        value={formData.leaseContractEnd}
                        onChange={(e) =>
                          setFormData({ ...formData, leaseContractEnd: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseContactPerson">担当者名</Label>
                      <Input
                        id="leaseContactPerson"
                        value={formData.leaseContactPerson}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            leaseContactPerson: e.target.value,
                          })
                        }
                        placeholder="田中営業"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leasePhone">電話番号</Label>
                      <Input
                        id="leasePhone"
                        type="tel"
                        value={formData.leasePhone}
                        onChange={(e) =>
                          setFormData({ ...formData, leasePhone: e.target.value })
                        }
                        placeholder="0120-123-456"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 期限管理 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">期限管理</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspectionDate">
                  次回車検日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  required
                  value={formData.inspectionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, inspectionDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceDate">
                  次回点検日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maintenanceDate"
                  type="date"
                  required
                  value={formData.maintenanceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenanceDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceDate">
                  保険更新日 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="insuranceDate"
                  type="date"
                  required
                  value={formData.insuranceDate}
                  onChange={(e) =>
                    setFormData({ ...formData, insuranceDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* その他 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">その他</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentTireType">現在タイヤ種別</Label>
                <Select
                  value={formData.currentTireType}
                  onValueChange={(value: TireType) =>
                    setFormData({ ...formData, currentTireType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summer">夏タイヤ</SelectItem>
                    <SelectItem value="winter">冬タイヤ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: AssetStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">稼働中</SelectItem>
                    <SelectItem value="maintenance">整備中</SelectItem>
                    <SelectItem value="retired">廃車</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="mileageTracking"
                checked={formData.mileageTracking}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, mileageTracking: checked })
                }
              />
              <Label htmlFor="mileageTracking">走行距離管理を有効にする</Label>
            </div>

            {formData.mileageTracking && (
              <div className="space-y-2">
                <Label htmlFor="currentMileage">現在の総走行距離（km）</Label>
                <Input
                  id="currentMileage"
                  type="number"
                  value={formData.currentMileage}
                  onChange={(e) =>
                    setFormData({ ...formData, currentMileage: e.target.value })
                  }
                  placeholder="45000"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="特記事項があれば入力してください"
                rows={3}
              />
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">{isEdit ? '更新' : '登録'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
