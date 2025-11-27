'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useVendorsAPI, type VendorFromAPI } from '@/hooks/use-vehicles-api';

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: VendorFromAPI;
  onSuccess?: () => void;
}

const VENDOR_CATEGORIES = [
  { value: 'repair', label: '修理・整備' },
  { value: 'tire', label: 'タイヤ' },
  { value: 'parts', label: '部品' },
  { value: 'insurance', label: '保険' },
  { value: 'lease', label: 'リース' },
  { value: 'fuel', label: '燃料' },
  { value: 'other', label: 'その他' },
];

const RATING_OPTIONS = [
  { value: '5', label: '5 - 最高' },
  { value: '4', label: '4 - 良い' },
  { value: '3', label: '3 - 普通' },
  { value: '2', label: '2 - やや不満' },
  { value: '1', label: '1 - 不満' },
];

// 初期フォームデータを生成
const getInitialFormData = (vendor?: VendorFromAPI) => ({
  name: vendor?.name || '',
  category: vendor?.category || 'repair',
  contactPerson: vendor?.contactPerson || '',
  phone: vendor?.phone || '',
  email: vendor?.email || '',
  address: vendor?.address || '',
  rating: vendor?.rating?.toString() || '',
  notes: vendor?.notes || '',
});

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: VendorFormDialogProps) {
  const { createVendor, updateVendor } = useVendorsAPI();
  const isEdit = !!vendor;

  const [formData, setFormData] = useState(getInitialFormData(vendor));

  // vendor propが変更されたらフォームデータをリセット
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(vendor));
    }
  }, [vendor, open]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const vendorData: Partial<VendorFromAPI> = {
      name: formData.name,
      category: formData.category || null,
      contactPerson: formData.contactPerson || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      rating: formData.rating ? parseInt(formData.rating) : null,
      notes: formData.notes || null,
    };

    let result;
    if (isEdit && vendor) {
      result = await updateVendor(vendor.id, vendorData);
    } else {
      result = await createVendor(vendorData);
    }

    setLoading(false);

    if (result.success) {
      onSuccess?.();
      onOpenChange(false);
    } else {
      alert(result.error || '保存に失敗しました');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '業者編集' : '業者登録'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">業者名 *</Label>
            <Input
              id="name"
              placeholder="○○自動車整備"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">担当者名</Label>
              <Input
                id="contactPerson"
                placeholder="山田太郎"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="03-1234-5678"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              placeholder="東京都港区..."
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">評価</Label>
            <Select
              value={formData.rating}
              onValueChange={(value) => handleChange('rating', value)}
            >
              <SelectTrigger id="rating">
                <SelectValue placeholder="評価を選択" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {loading ? '保存中...' : isEdit ? '更新' : '登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
