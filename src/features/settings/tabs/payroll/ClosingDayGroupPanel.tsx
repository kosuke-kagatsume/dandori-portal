'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store/tenant-store';

// 締め日グループの型定義
interface ClosingDayGroup {
  id: string;
  name: string;
  closingDay: number; // 1-31, 99=末日
  paymentMonth: 'same' | 'next';
  paymentDay: number; // 1-31, 99=末日
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

// 日付の表示ヘルパー
const formatDay = (day: number): string => {
  if (day === 99) return '末日';
  return `${day}日`;
};

// 日の選択肢を生成（1-31 + 末日）
const dayOptions = [
  ...Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString(), label: `${i + 1}日` })),
  { value: '99', label: '末日' },
];

const defaultFormData = {
  name: '',
  closingDay: 99,
  paymentMonth: 'next' as 'same' | 'next',
  paymentDay: 25,
  isDefault: false,
  sortOrder: 0,
  isActive: true,
};

export function ClosingDayGroupPanel() {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;

  const [items, setItems] = useState<ClosingDayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClosingDayGroup | null>(null);
  const [deletingItem, setDeletingItem] = useState<ClosingDayGroup | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  // データ取得
  const fetchItems = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/settings/payroll/closing-day-groups?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch {
      toast.error('締め日グループの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ダイアログを開く
  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      ...defaultFormData,
      sortOrder: items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 1,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: ClosingDayGroup) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      closingDay: item.closingDay,
      paymentMonth: item.paymentMonth,
      paymentDay: item.paymentDay,
      isDefault: item.isDefault,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  // 保存処理
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('グループ名は必須です');
      return;
    }
    setIsSaving(true);
    try {
      const url = `/api/settings/payroll/closing-day-groups?tenantId=${tenantId}`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { id: editingItem.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingItem ? '締め日グループを更新しました' : '締め日グループを追加しました');
        setDialogOpen(false);
        fetchItems();
      } else {
        toast.error('保存に失敗しました');
      }
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(`/api/settings/payroll/closing-day-groups?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingItem.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('締め日グループを削除しました');
        fetchItems();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch {
      toast.error('削除に失敗しました');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

  // 有効/無効の切り替え
  const handleToggleActive = async (item: ClosingDayGroup, isActive: boolean) => {
    try {
      const res = await fetch(`/api/settings/payroll/closing-day-groups?tenantId=${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive } : i)));
        toast.success(isActive ? '有効にしました' : '無効にしました');
      }
    } catch {
      toast.error('更新に失敗しました');
    }
  };

  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">締め日グループ設定</CardTitle>
              <CardDescription>給与の締め日・支給日グループを管理します</CardDescription>
            </div>
            <Button onClick={openAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              締め日グループが登録されていません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>グループ名</TableHead>
                  <TableHead>締め日</TableHead>
                  <TableHead>支給月</TableHead>
                  <TableHead>支給日</TableHead>
                  <TableHead>デフォルト</TableHead>
                  <TableHead>有効</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => openEditDialog(item)}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatDay(item.closingDay)}</TableCell>
                    <TableCell>{item.paymentMonth === 'same' ? '当月' : '翌月'}</TableCell>
                    <TableCell>{formatDay(item.paymentDay)}</TableCell>
                    <TableCell>
                      {item.isDefault && (
                        <Badge variant="default">デフォルト</Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(checked) => handleToggleActive(item, checked)}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingItem(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 追加・編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? '締め日グループを編集' : '締め日グループを追加'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `${editingItem.name}の設定を変更します`
                : '新しい締め日グループを作成します'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="closing-group-name">グループ名 *</Label>
              <Input
                id="closing-group-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="月末締め翌月25日払い"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="closing-day">締め日</Label>
                <Select
                  value={formData.closingDay.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, closingDay: parseInt(value) })
                  }
                >
                  <SelectTrigger id="closing-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-month">支給月</Label>
                <Select
                  value={formData.paymentMonth}
                  onValueChange={(value: 'same' | 'next') =>
                    setFormData({ ...formData, paymentMonth: value })
                  }
                >
                  <SelectTrigger id="payment-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same">当月</SelectItem>
                    <SelectItem value="next">翌月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-day">支給日</Label>
                <Select
                  value={formData.paymentDay.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentDay: parseInt(value) })
                  }
                >
                  <SelectTrigger id="payment-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closing-sort-order">表示順</Label>
                <Input
                  id="closing-sort-order"
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="closing-default">デフォルト</Label>
              <Switch
                id="closing-default"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="closing-active">有効</Label>
              <Switch
                id="closing-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : editingItem ? (
                '更新'
              ) : (
                '追加'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>締め日グループを削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingItem?.name}」を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
