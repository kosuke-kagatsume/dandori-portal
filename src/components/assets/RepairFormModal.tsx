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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RepairRecordFromAPI,
  REPAIR_TYPES,
  useRepairRecordsAPI
} from '@/hooks/use-general-assets-api';
import { usePCAssetsAPI } from '@/hooks/use-pc-assets-api';
import type { PCAssetFromAPI } from '@/hooks/use-pc-assets-api';
import { useGeneralAssetsAPI, GeneralAssetFromAPI, ASSET_CATEGORIES } from '@/hooks/use-general-assets-api';
import { useVehicleStore } from '@/lib/store/vehicle-store';

interface RepairFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repair?: RepairRecordFromAPI;
  preselectedAssetType?: 'pc' | 'general';
  preselectedAssetId?: string;
}

// 修理ステータス
const REPAIR_STATUSES = [
  { value: 'pending', label: '修理待ち' },
  { value: 'in_progress', label: '修理中' },
  { value: 'completed', label: '完了' },
  { value: 'cancelled', label: 'キャンセル' },
];

export function RepairFormModal({
  open,
  onOpenChange,
  repair,
  preselectedAssetType,
  preselectedAssetId,
}: RepairFormModalProps) {
  const { createRecord, updateRecord } = useRepairRecordsAPI();
  const { pcs: pcAssets } = usePCAssetsAPI();
  const { assets: generalAssets } = useGeneralAssetsAPI();
  const vendors = useVehicleStore((state) => state.vendors);

  const isEdit = !!repair;

  // 資産タイプの判定
  const getInitialAssetType = () => {
    if (preselectedAssetType) return preselectedAssetType;
    if (repair?.pcAssetId) return 'pc';
    if (repair?.generalAssetId) return 'general';
    return 'pc';
  };

  const [assetType, setAssetType] = useState<'pc' | 'general'>(getInitialAssetType());

  const [formData, setFormData] = useState({
    pcAssetId: repair?.pcAssetId || preselectedAssetId || '',
    generalAssetId: repair?.generalAssetId || preselectedAssetId || '',
    repairType: repair?.repairType || 'other',
    date: repair?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    cost: repair?.cost?.toString() || '',
    vendorId: repair?.vendorId || '',
    vendorName: repair?.vendorName || '',
    symptom: repair?.symptom || '',
    description: repair?.description || '',
    status: repair?.status || 'completed',
    completedDate: repair?.completedDate?.split('T')[0] || '',
    performedBy: repair?.performedBy || '',
    performedByName: repair?.performedByName || '',
    notes: repair?.notes || '',
  });

  // 編集時にassetTypeを正しく設定
  useEffect(() => {
    if (repair) {
      if (repair.pcAssetId) {
        setAssetType('pc');
      } else if (repair.generalAssetId) {
        setAssetType('general');
      }
    }
  }, [repair]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 選択された業者の名前を取得
    const selectedVendor = vendors.find((v) => v.id === formData.vendorId);

    const recordData: Partial<RepairRecordFromAPI> = {
      pcAssetId: assetType === 'pc' ? formData.pcAssetId : null,
      generalAssetId: assetType === 'general' ? formData.generalAssetId : null,
      repairType: formData.repairType,
      date: formData.date,
      cost: formData.cost ? Number(formData.cost) : 0,
      vendorId: formData.vendorId || null,
      vendorName: selectedVendor?.name || formData.vendorName || null,
      symptom: formData.symptom || null,
      description: formData.description || null,
      status: formData.status,
      completedDate: formData.completedDate || null,
      performedBy: formData.performedBy || null,
      performedByName: formData.performedByName || null,
      notes: formData.notes || null,
    };

    let result;
    if (isEdit && repair) {
      result = await updateRecord(repair.id, recordData);
    } else {
      result = await createRecord(recordData);
    }

    if (result.success) {
      onOpenChange(false);
    } else {
      alert(result.error || '保存に失敗しました');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // カテゴリラベルを取得
  const getCategoryLabel = (category: string) => {
    return ASSET_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '修理記録編集' : '修理記録追加'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 対象資産の選択 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">対象資産</h3>

            <Tabs value={assetType} onValueChange={(v) => setAssetType(v as 'pc' | 'general')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pc">PC資産</TabsTrigger>
                <TabsTrigger value="general">その他資産</TabsTrigger>
              </TabsList>

              <TabsContent value="pc" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="pcAssetId">PC資産 *</Label>
                  <Select
                    value={formData.pcAssetId}
                    onValueChange={(value) => handleChange('pcAssetId', value)}
                    required={assetType === 'pc'}
                  >
                    <SelectTrigger id="pcAssetId">
                      <SelectValue placeholder="PC資産を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {pcAssets.map((asset: PCAssetFromAPI) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.assetNumber} - {asset.manufacturer} {asset.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="general" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="generalAssetId">その他資産 *</Label>
                  <Select
                    value={formData.generalAssetId}
                    onValueChange={(value) => handleChange('generalAssetId', value)}
                    required={assetType === 'general'}
                  >
                    <SelectTrigger id="generalAssetId">
                      <SelectValue placeholder="資産を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {generalAssets.map((asset: GeneralAssetFromAPI) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          [{getCategoryLabel(asset.category)}] {asset.assetNumber} - {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 修理情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">修理情報</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repairType">修理種別 *</Label>
                <Select
                  value={formData.repairType}
                  onValueChange={(value) => handleChange('repairType', value)}
                  required
                >
                  <SelectTrigger id="repairType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAIR_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">修理日 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {REPAIR_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completedDate">完了日</Label>
                <Input
                  id="completedDate"
                  type="date"
                  value={formData.completedDate}
                  onChange={(e) => handleChange('completedDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptom">症状</Label>
              <Textarea
                id="symptom"
                placeholder="修理前の症状を入力"
                value={formData.symptom}
                onChange={(e) => handleChange('symptom', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">修理内容</Label>
              <Textarea
                id="description"
                placeholder="実施した修理内容を入力"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* 費用・業者情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">費用・業者情報</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">修理費用 (円)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="50000"
                  value={formData.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                />
              </div>

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
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performedByName">担当者名</Label>
              <Input
                id="performedByName"
                placeholder="修理担当者名"
                value={formData.performedByName}
                onChange={(e) => handleChange('performedByName', e.target.value)}
              />
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">備考</h3>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                placeholder="その他メモ"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
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
