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
import { useGeneralAssetsAPI, ASSET_CATEGORIES, type GeneralAssetFromAPI } from '@/hooks/use-general-assets-api';

interface GeneralAssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: GeneralAssetFromAPI;
}

const OWNERSHIP_TYPES = [
  { value: 'owned', label: '自社所有' },
  { value: 'leased', label: 'リース' },
  { value: 'rental', label: 'レンタル' },
];

const ASSET_STATUSES = [
  { value: 'active', label: '稼働中' },
  { value: 'maintenance', label: '整備中' },
  { value: 'retired', label: '退役' },
  { value: 'storage', label: '保管中' },
];

export function GeneralAssetFormDialog({
  open,
  onOpenChange,
  asset,
}: GeneralAssetFormDialogProps) {
  const { createAsset, updateAsset } = useGeneralAssetsAPI();
  const isEdit = !!asset;

  const [formData, setFormData] = useState({
    assetNumber: asset?.assetNumber || '',
    category: asset?.category || 'monitor',
    name: asset?.name || '',
    manufacturer: asset?.manufacturer || '',
    model: asset?.model || '',
    serialNumber: asset?.serialNumber || '',
    ownershipType: asset?.ownershipType || 'owned',
    status: asset?.status || 'active',
    assignedUserName: asset?.assignedUserName || '',
    assignedDate: asset?.assignedDate?.split('T')[0] || '',
    purchaseCost: asset?.purchaseCost?.toString() || '',
    purchaseDate: asset?.purchaseDate?.split('T')[0] || '',
    leaseCompany: asset?.leaseCompany || '',
    leaseMonthlyCost: asset?.leaseMonthlyCost?.toString() || '',
    leaseStartDate: asset?.leaseStartDate?.split('T')[0] || '',
    leaseEndDate: asset?.leaseEndDate?.split('T')[0] || '',
    warrantyExpiration: asset?.warrantyExpiration?.split('T')[0] || '',
    notes: asset?.notes || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const assetData: Partial<GeneralAssetFromAPI> = {
      assetNumber: formData.assetNumber,
      category: formData.category,
      name: formData.name,
      manufacturer: formData.manufacturer || null,
      model: formData.model || null,
      serialNumber: formData.serialNumber || null,
      ownershipType: formData.ownershipType,
      status: formData.status,
      assignedUserName: formData.assignedUserName || null,
      assignedDate: formData.assignedDate || null,
      purchaseCost: formData.purchaseCost ? parseInt(formData.purchaseCost) : null,
      purchaseDate: formData.purchaseDate || null,
      leaseCompany: formData.leaseCompany || null,
      leaseMonthlyCost: formData.leaseMonthlyCost ? parseInt(formData.leaseMonthlyCost) : null,
      leaseStartDate: formData.leaseStartDate || null,
      leaseEndDate: formData.leaseEndDate || null,
      warrantyExpiration: formData.warrantyExpiration || null,
      notes: formData.notes || null,
    };

    let result;
    if (isEdit && asset) {
      result = await updateAsset(asset.id, assetData);
    } else {
      result = await createAsset(assetData);
    }

    setLoading(false);

    if (result.success) {
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '備品編集' : '備品登録'}
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
                  <Label htmlFor="assetNumber">管理番号 *</Label>
                  <Input
                    id="assetNumber"
                    placeholder="GA-001"
                    value={formData.assetNumber}
                    onChange={(e) => handleChange('assetNumber', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリー *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  placeholder="Dell 27インチモニター"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">メーカー</Label>
                  <Input
                    id="manufacturer"
                    placeholder="Dell"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">型式</Label>
                  <Input
                    id="model"
                    placeholder="U2722D"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">シリアル番号</Label>
                <Input
                  id="serialNumber"
                  placeholder="XXXXXXXXX"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                />
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
                      {ASSET_STATUSES.map((status) => (
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leaseCompany">リース会社</Label>
                      <Input
                        id="leaseCompany"
                        placeholder="オリックス"
                        value={formData.leaseCompany}
                        onChange={(e) => handleChange('leaseCompany', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseMonthlyCost">月額リース料 (円)</Label>
                      <Input
                        id="leaseMonthlyCost"
                        type="number"
                        placeholder="5000"
                        value={formData.leaseMonthlyCost}
                        onChange={(e) => handleChange('leaseMonthlyCost', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                        placeholder="50000"
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
                <h4 className="font-medium">保証期限</h4>
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
              {loading ? '保存中...' : isEdit ? '更新' : '登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
