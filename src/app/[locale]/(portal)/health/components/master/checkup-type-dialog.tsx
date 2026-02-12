'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { HealthCheckupType } from '@/types/health';

interface CheckupTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: HealthCheckupType;
  onSuccess?: () => void;
}

export function CheckupTypeDialog({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: CheckupTypeDialogProps) {
  const { addCheckupType, updateCheckupType } = useHealthMasterStore();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集モードの場合、既存データをフォームにセット
  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        code: editItem.code,
        description: editItem.description || '',
        isActive: editItem.isActive,
        sortOrder: editItem.sortOrder,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [editItem, open]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast.error('種別名とコードは必須です');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editItem) {
        await updateCheckupType(editItem.id, formData);
        toast.success('健診種別を更新しました');
      } else {
        await addCheckupType(formData);
        toast.success('健診種別を追加しました');
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
          <DialogTitle>{editItem ? '健診種別の編集' : '健診種別の追加'}</DialogTitle>
          <DialogDescription>
            健康診断の種別を{editItem ? '編集' : '追加'}します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>種別名 *</Label>
            <Input
              placeholder="定期健康診断"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>コード *</Label>
            <Input
              placeholder="regular"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              英数字とアンダースコアのみ使用可能
            </p>
          </div>

          <div className="space-y-2">
            <Label>説明</Label>
            <Textarea
              placeholder="年1回の定期健康診断"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
