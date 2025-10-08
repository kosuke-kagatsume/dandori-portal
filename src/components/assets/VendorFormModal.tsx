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
import type { Vendor } from '@/types/asset';
import { useVehicleStore } from '@/lib/store/vehicle-store';

interface VendorFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
}

export function VendorFormModal({
  open,
  onOpenChange,
  vendor,
}: VendorFormModalProps) {
  const { addVendor, updateVendor } = useVehicleStore();
  const isEdit = !!vendor;

  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    contactPerson: vendor?.contactPerson || '',
    email: vendor?.email || '',
    rating: vendor?.rating?.toString() || '3',
    notes: vendor?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert('業者名と電話番号は必須です');
      return;
    }

    const vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'workCount'> = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address || undefined,
      contactPerson: formData.contactPerson || undefined,
      email: formData.email || undefined,
      rating: Number(formData.rating),
      notes: formData.notes || undefined,
    };

    if (isEdit && vendor) {
      updateVendor(vendor.id, vendorData);
    } else {
      addVendor(vendorData);
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
            {isEdit ? '業者情報編集' : '業者追加'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">基本情報</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">業者名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="オートサービス山田"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号 *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="03-1234-5678"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="東京都港区1-2-3"
              />
            </div>
          </div>

          {/* 担当者情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">担当者情報</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">担当者名</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  placeholder="山田太郎"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="yamada@example.com"
                />
              </div>
            </div>
          </div>

          {/* 評価・備考 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">評価・備考</h3>

            <div className="space-y-2">
              <Label htmlFor="rating">評価</Label>
              <Select
                value={formData.rating}
                onValueChange={(value) => handleChange('rating', value)}
              >
                <SelectTrigger id="rating">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">★☆☆☆☆ (1)</SelectItem>
                  <SelectItem value="2">★★☆☆☆ (2)</SelectItem>
                  <SelectItem value="3">★★★☆☆ (3)</SelectItem>
                  <SelectItem value="4">★★★★☆ (4)</SelectItem>
                  <SelectItem value="5">★★★★★ (5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="業者に関する特記事項"
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
              {isEdit ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
