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
import { usePCAssetsAPI, type PCAssetFromAPI } from '@/hooks/use-pc-assets-api';

interface PCFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pc?: PCAssetFromAPI;
}

const OWNERSHIP_TYPES = [
  { value: 'owned', label: '自社所有' },
  { value: 'leased', label: 'リース' },
  { value: 'rental', label: 'レンタル' },
];

const PC_STATUSES = [
  { value: 'active', label: '稼働中' },
  { value: 'maintenance', label: '整備中' },
  { value: 'retired', label: '退役' },
  { value: 'storage', label: '保管中' },
];

const MANUFACTURERS = [
  { value: 'Dell', label: 'Dell' },
  { value: 'HP', label: 'HP' },
  { value: 'Lenovo', label: 'Lenovo' },
  { value: 'Apple', label: 'Apple' },
  { value: 'ASUS', label: 'ASUS' },
  { value: 'Microsoft', label: 'Microsoft' },
  { value: 'Dynabook', label: 'Dynabook' },
  { value: 'NEC', label: 'NEC' },
  { value: 'Fujitsu', label: '富士通' },
  { value: 'Other', label: 'その他' },
];

const OS_OPTIONS = [
  { value: 'Windows 11 Pro', label: 'Windows 11 Pro' },
  { value: 'Windows 11 Home', label: 'Windows 11 Home' },
  { value: 'Windows 10 Pro', label: 'Windows 10 Pro' },
  { value: 'Windows 10 Home', label: 'Windows 10 Home' },
  { value: 'macOS Sonoma', label: 'macOS Sonoma' },
  { value: 'macOS Ventura', label: 'macOS Ventura' },
  { value: 'Linux', label: 'Linux' },
  { value: 'Other', label: 'その他' },
];

export function PCFormDialog({
  open,
  onOpenChange,
  pc,
}: PCFormDialogProps) {
  const { createPC, updatePC } = usePCAssetsAPI();
  const isEdit = !!pc;

  const [formData, setFormData] = useState({
    assetNumber: pc?.assetNumber || '',
    manufacturer: pc?.manufacturer || '',
    model: pc?.model || '',
    serialNumber: pc?.serialNumber || '',
    cpu: pc?.cpu || '',
    memory: pc?.memory || '',
    storage: pc?.storage || '',
    os: pc?.os || '',
    ownershipType: pc?.ownershipType || 'owned',
    status: pc?.status || 'active',
    assignedUserName: pc?.assignedUserName || '',
    assignedDate: pc?.assignedDate?.split('T')[0] || '',
    purchaseCost: pc?.purchaseCost?.toString() || '',
    purchaseDate: pc?.purchaseDate?.split('T')[0] || '',
    warrantyExpiration: pc?.warrantyExpiration?.split('T')[0] || '',
    notes: pc?.notes || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pcData: Partial<PCAssetFromAPI> = {
      assetNumber: formData.assetNumber,
      manufacturer: formData.manufacturer,
      model: formData.model,
      serialNumber: formData.serialNumber || null,
      cpu: formData.cpu || null,
      memory: formData.memory || null,
      storage: formData.storage || null,
      os: formData.os || null,
      ownershipType: formData.ownershipType,
      status: formData.status,
      assignedUserName: formData.assignedUserName || null,
      assignedDate: formData.assignedDate || null,
      purchaseCost: formData.purchaseCost ? parseInt(formData.purchaseCost) : null,
      purchaseDate: formData.purchaseDate || null,
      warrantyExpiration: formData.warrantyExpiration || null,
      notes: formData.notes || null,
    };

    let result;
    if (isEdit && pc) {
      result = await updatePC(pc.id, pcData);
    } else {
      result = await createPC(pcData);
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
            {isEdit ? 'PC編集' : 'PC登録'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="spec">スペック</TabsTrigger>
              <TabsTrigger value="cost">費用・期限</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assetNumber">管理番号 *</Label>
                  <Input
                    id="assetNumber"
                    placeholder="PC-001"
                    value={formData.assetNumber}
                    onChange={(e) => handleChange('assetNumber', e.target.value)}
                    required
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">メーカー *</Label>
                  <Select
                    value={formData.manufacturer}
                    onValueChange={(value) => handleChange('manufacturer', value)}
                  >
                    <SelectTrigger id="manufacturer">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {MANUFACTURERS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">型式 *</Label>
                  <Input
                    id="model"
                    placeholder="ThinkPad X1 Carbon"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    required
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
                      {PC_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
            </TabsContent>

            <TabsContent value="spec" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpu">CPU</Label>
                  <Input
                    id="cpu"
                    placeholder="Intel Core i7-1365U"
                    value={formData.cpu}
                    onChange={(e) => handleChange('cpu', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memory">メモリ</Label>
                  <Input
                    id="memory"
                    placeholder="16GB"
                    value={formData.memory}
                    onChange={(e) => handleChange('memory', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storage">ストレージ</Label>
                  <Input
                    id="storage"
                    placeholder="512GB SSD"
                    value={formData.storage}
                    onChange={(e) => handleChange('storage', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="os">OS</Label>
                  <Select
                    value={formData.os}
                    onValueChange={(value) => handleChange('os', value)}
                  >
                    <SelectTrigger id="os">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {OS_OPTIONS.map((os) => (
                        <SelectItem key={os.value} value={os.value}>
                          {os.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">購入・費用情報</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseCost">購入価格 (円)</Label>
                    <Input
                      id="purchaseCost"
                      type="number"
                      placeholder="150000"
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
