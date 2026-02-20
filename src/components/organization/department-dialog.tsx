'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null; // 編集時は既存データを渡す
  departments: Department[]; // 親部門選択用
  onSuccess?: () => void;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  departments,
  onSuccess,
}: DepartmentDialogProps) {
  const isEditing = !!department;

  const [formData, setFormData] = useState({
    name: '',
    parentId: '__none__',
    sortOrder: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 編集時はデータを初期化
  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        parentId: department.parentId || '__none__',
        sortOrder: department.sortOrder,
        isActive: department.isActive,
      });
    } else {
      setFormData({
        name: '',
        parentId: '__none__',
        sortOrder: 0,
        isActive: true,
      });
    }
  }, [department, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('部門名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/organization/departments/${department.id}`
        : '/api/organization/departments';

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          parentId: formData.parentId === '__none__' ? null : formData.parentId,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '操作に失敗しました');
      }

      toast.success(isEditing ? '部門を更新しました' : '部門を追加しました');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Department operation failed:', error);
      toast.error(error instanceof Error ? error.message : '操作に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 親部門の選択肢から自分自身と子孫を除外（編集時）
  const availableParents = departments.filter(d => {
    if (!isEditing) return true;
    if (d.id === department?.id) return false;
    // 子孫部門も除外（循環参照防止）
    let current: Department | undefined = d;
    while (current) {
      if (current.parentId === department?.id) return false;
      current = departments.find(p => p.id === current?.parentId);
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? '部門を編集' : '部門を追加'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? '部門情報を編集します' : '新しい部門を追加します'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">部門名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: 営業部"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">親部門</Label>
            <Select
              value={formData.parentId}
              onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="親部門を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">なし（ルート）</SelectItem>
                {availableParents.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              親部門を選択すると、その部門の下に配置されます
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">表示順</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              小さい数値ほど上に表示されます
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isActive">有効</Label>
              <p className="text-xs text-muted-foreground">
                無効にすると選択肢に表示されません
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : isEditing ? (
              '更新'
            ) : (
              '追加'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
