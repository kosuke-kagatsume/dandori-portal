'use client';

import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import type { PCAsset, OwnershipType, AssetStatus } from '@/types/asset';
import { usePCStore } from '@/lib/store/pc-store';

interface PCFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pc?: PCAsset | null;
}

export function PCFormModal({
  open,
  onOpenChange,
  pc,
}: PCFormModalProps) {
  const { addPC, updatePC } = usePCStore();
  const isEdit = !!pc;

  const [formData, setFormData] = useState({
    assetNumber: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    cpu: '',
    memory: '',
    storage: '',
    os: '',
    ownershipType: 'owned' as OwnershipType,
    purchaseDate: '',
    purchaseCost: '',
    leaseCompany: '',
    leaseMonthlyCost: '',
    leaseContractStart: '',
    leaseContractEnd: '',
    leaseContactPerson: '',
    leasePhone: '',
    warrantyExpiration: '',
    status: 'active' as AssetStatus,
    notes: '',
  });

  useEffect(() => {
    if (pc) {
      setFormData({
        assetNumber: pc.assetNumber,
        manufacturer: pc.manufacturer,
        model: pc.model,
        serialNumber: pc.serialNumber,
        cpu: pc.cpu,
        memory: pc.memory,
        storage: pc.storage,
        os: pc.os,
        ownershipType: pc.ownershipType,
        purchaseDate: pc.purchaseDate || '',
        purchaseCost: pc.purchaseCost?.toString() || '',
        leaseCompany: pc.leaseInfo?.company || '',
        leaseMonthlyCost: pc.leaseInfo?.monthlyCost.toString() || '',
        leaseContractStart: pc.leaseInfo?.contractStart || '',
        leaseContractEnd: pc.leaseInfo?.contractEnd || '',
        leaseContactPerson: pc.leaseInfo?.contactPerson || '',
        leasePhone: pc.leaseInfo?.phone || '',
        warrantyExpiration: pc.warrantyExpiration,
        status: pc.status,
        notes: pc.notes || '',
      });
    } else {
      // 新規登録時はリセット
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const defaultWarranty = nextYear.toISOString().split('T')[0];

      setFormData({
        assetNumber: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        cpu: '',
        memory: '',
        storage: '',
        os: '',
        ownershipType: 'owned',
        purchaseDate: '',
        purchaseCost: '',
        leaseCompany: '',
        leaseMonthlyCost: '',
        leaseContractStart: '',
        leaseContractEnd: '',
        leaseContactPerson: '',
        leasePhone: '',
        warrantyExpiration: defaultWarranty,
        status: 'active',
        notes: '',
      });
    }
  }, [pc, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newPC: Omit<PCAsset, 'id' | 'createdAt' | 'updatedAt'> = {
      assetNumber: formData.assetNumber,
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber,
      cpu: formData.cpu,
      memory: formData.memory,
      storage: formData.storage,
      os: formData.os,
      assignedTo: pc?.assignedTo || null,
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
            contactPerson: formData.leaseContactPerson,
            phone: formData.leasePhone,
          }
        : undefined,
      warrantyExpiration: formData.warrantyExpiration,
      licenses: pc?.licenses || [],
      status: formData.status,
      notes: formData.notes || undefined,
    };

    if (isEdit && pc) {
      updatePC(pc.id, newPC);
    } else {
      addPC(newPC);
    }

    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'PC編集' : 'PC登録'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本情報</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetNumber">資産番号 *</Label>
                <Input
                  id="assetNumber"
                  value={formData.assetNumber}
                  onChange={(e) => handleChange('assetNumber', e.target.value)}
                  placeholder="PC-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">メーカー *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  placeholder="Dell"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">型番 *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="Latitude 5420"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">シリアル番号 *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  placeholder="SN123456789"
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* スペック */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">スペック</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpu">CPU *</Label>
                <Input
                  id="cpu"
                  value={formData.cpu}
                  onChange={(e) => handleChange('cpu', e.target.value)}
                  placeholder="Intel Core i7-1185G7"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memory">メモリ *</Label>
                <Input
                  id="memory"
                  value={formData.memory}
                  onChange={(e) => handleChange('memory', e.target.value)}
                  placeholder="16GB"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storage">ストレージ *</Label>
                <Input
                  id="storage"
                  value={formData.storage}
                  onChange={(e) => handleChange('storage', e.target.value)}
                  placeholder="512GB SSD"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="os">OS *</Label>
                <Input
                  id="os"
                  value={formData.os}
                  onChange={(e) => handleChange('os', e.target.value)}
                  placeholder="Windows 11 Pro"
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 所有・リース情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">所有・リース情報</h3>

            <div className="space-y-2">
              <Label htmlFor="ownershipType">所有形態 *</Label>
              <Select
                value={formData.ownershipType}
                onValueChange={(value) => handleChange('ownershipType', value)}
                required
              >
                <SelectTrigger id="ownershipType">
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
                    onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseCost">購入価格 (円)</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) => handleChange('purchaseCost', e.target.value)}
                    placeholder="180000"
                  />
                </div>
              </div>
            )}

            {formData.ownershipType === 'leased' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaseCompany">リース会社 *</Label>
                    <Input
                      id="leaseCompany"
                      value={formData.leaseCompany}
                      onChange={(e) => handleChange('leaseCompany', e.target.value)}
                      placeholder="デル・リース"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseMonthlyCost">月額費用 (円) *</Label>
                    <Input
                      id="leaseMonthlyCost"
                      type="number"
                      value={formData.leaseMonthlyCost}
                      onChange={(e) => handleChange('leaseMonthlyCost', e.target.value)}
                      placeholder="8000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaseContractStart">契約開始日 *</Label>
                    <Input
                      id="leaseContractStart"
                      type="date"
                      value={formData.leaseContractStart}
                      onChange={(e) => handleChange('leaseContractStart', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseContractEnd">契約終了日 *</Label>
                    <Input
                      id="leaseContractEnd"
                      type="date"
                      value={formData.leaseContractEnd}
                      onChange={(e) => handleChange('leaseContractEnd', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaseContactPerson">担当者名</Label>
                    <Input
                      id="leaseContactPerson"
                      value={formData.leaseContactPerson}
                      onChange={(e) => handleChange('leaseContactPerson', e.target.value)}
                      placeholder="佐藤営業"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leasePhone">電話番号</Label>
                    <Input
                      id="leasePhone"
                      type="tel"
                      value={formData.leasePhone}
                      onChange={(e) => handleChange('leasePhone', e.target.value)}
                      placeholder="0120-111-222"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* その他 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">その他</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warrantyExpiration">保証期限 *</Label>
                <Input
                  id="warrantyExpiration"
                  type="date"
                  value={formData.warrantyExpiration}
                  onChange={(e) => handleChange('warrantyExpiration', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">ステータス *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">稼働中</SelectItem>
                    <SelectItem value="maintenance">整備中</SelectItem>
                    <SelectItem value="retired">廃棄</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="備考を入力"
                rows={3}
              />
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
              {isEdit ? '更新' : '登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
