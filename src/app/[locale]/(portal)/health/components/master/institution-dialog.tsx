'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import type { HealthMedicalInstitution } from '@/types/health';

interface InstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: HealthMedicalInstitution;
  onSuccess?: () => void;
}

export function InstitutionDialog({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: InstitutionDialogProps) {
  const { addMedicalInstitution, updateMedicalInstitution } = useHealthMasterStore();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    isActive: true,
    sortOrder: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの場合、既存データをフォームにセット
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        code: editItem.code || '',
        address: editItem.address || '',
        phone: editItem.phone || '',
        isActive: editItem.isActive,
        sortOrder: editItem.sortOrder,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [editItem, open]);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('医療機関名は必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editItem) {
        await updateMedicalInstitution(editItem.id, formData);
        toast.success('医療機関を更新しました');
      } else {
        await addMedicalInstitution(formData);
        toast.success('医療機関を追加しました');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('エラー:', error);
      toast.error(editItem ? '更新に失敗しました' : '追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? '医療機関の編集' : '医療機関の追加'}</DialogTitle>
          <DialogDescription>
            健診を受ける医療機関を{editItem ? '編集' : '追加'}します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>医療機関名 *</Label>
            <Input
              placeholder="東京健診センター"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>コード</Label>
            <Input
              placeholder="tokyo-kenshin"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>住所</Label>
            <Input
              placeholder="東京都千代田区丸の内1-1-1"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>電話番号</Label>
            <Input
              placeholder="03-1234-5678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>表示順</Label>
            <Input
              type="number"
              min={0}
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>有効</Label>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : editItem ? '更新' : '追加'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
