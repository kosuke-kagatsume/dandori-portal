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

// 支給項目の型定義
interface AllowanceItem {
  id: string;
  code: string;
  name: string;
  isTaxable: boolean;
  itemType: 'fixed' | 'variable';
  calculationType?: 'fixed' | 'hourly' | 'rate' | null;
  defaultAmount?: number | null;
  isInsuranceTarget: boolean;
  isBaseCalculation?: boolean;
  sortOrder: number;
  isActive: boolean;
}

const CALC_TYPE_LABELS: Record<string, string> = {
  fixed: '固定額',
  hourly: '時給計算',
  rate: '率計算',
};

const defaultFormData = {
  code: '',
  name: '',
  isTaxable: true,
  itemType: 'fixed' as 'fixed' | 'variable',
  calculationType: 'fixed' as 'fixed' | 'hourly' | 'rate',
  defaultAmount: 0,
  isInsuranceTarget: true,
  isBaseCalculation: false,
  sortOrder: 0,
  isActive: true,
};

export function AllowanceItemsPanel() {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;

  const [items, setItems] = useState<AllowanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AllowanceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<AllowanceItem | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  // データ取得
  const fetchItems = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/settings/payroll/allowance-items?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch {
      toast.error('支給項目の取得に失敗しました');
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

  const openEditDialog = (item: AllowanceItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      isTaxable: item.isTaxable,
      itemType: item.itemType,
      calculationType: (item.calculationType || 'fixed') as 'fixed' | 'hourly' | 'rate',
      defaultAmount: item.defaultAmount || 0,
      isInsuranceTarget: item.isInsuranceTarget,
      isBaseCalculation: item.isBaseCalculation || false,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  // 保存処理
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('項目名と項目コードは必須です');
      return;
    }
    setIsSaving(true);
    try {
      const url = `/api/settings/payroll/allowance-items?tenantId=${tenantId}`;
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
        toast.success(editingItem ? '支給項目を更新しました' : '支給項目を追加しました');
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
      const res = await fetch(`/api/settings/payroll/allowance-items?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingItem.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('支給項目を削除しました');
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
  const handleToggleActive = async (item: AllowanceItem, isActive: boolean) => {
    try {
      const res = await fetch(`/api/settings/payroll/allowance-items?tenantId=${tenantId}`, {
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
              <CardTitle className="text-base">支給項目マスタ</CardTitle>
              <CardDescription>給与の支給項目を管理します</CardDescription>
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
              支給項目が登録されていません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>項目名</TableHead>
                  <TableHead>項目コード</TableHead>
                  <TableHead>課税区分</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>計算方式</TableHead>
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
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {item.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isTaxable ? 'default' : 'secondary'}>
                        {item.isTaxable ? '課税' : '非課税'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.itemType === 'fixed' ? '固定' : '変動'}</TableCell>
                    <TableCell>{CALC_TYPE_LABELS[item.calculationType || 'fixed'] || '-'}</TableCell>
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
              {editingItem ? '支給項目を編集' : '支給項目を追加'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? `${editingItem.name}の設定を変更します` : '新しい支給項目を作成します'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowance-name">項目名 *</Label>
                <Input
                  id="allowance-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="基本給"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowance-code">項目コード *</Label>
                <Input
                  id="allowance-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="BASE_PAY"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowance-item-type">種別</Label>
              <Select
                value={formData.itemType}
                onValueChange={(value: 'fixed' | 'variable') =>
                  setFormData({ ...formData, itemType: value })
                }
              >
                <SelectTrigger id="allowance-item-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">固定</SelectItem>
                  <SelectItem value="variable">変動</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowance-calc-type">計算方式</Label>
              <Select
                value={formData.calculationType}
                onValueChange={(value: 'fixed' | 'hourly' | 'rate') =>
                  setFormData({ ...formData, calculationType: value })
                }
              >
                <SelectTrigger id="allowance-calc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">固定額</SelectItem>
                  <SelectItem value="hourly">時給計算</SelectItem>
                  <SelectItem value="rate">率計算</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.calculationType === 'fixed' && (
              <div className="space-y-2">
                <Label htmlFor="allowance-default-amount">デフォルト金額</Label>
                <Input
                  id="allowance-default-amount"
                  type="number"
                  min={0}
                  value={formData.defaultAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultAmount: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="allowance-sort-order">表示順</Label>
              <Input
                id="allowance-sort-order"
                type="number"
                min={0}
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowance-taxable">課税</Label>
              <Switch
                id="allowance-taxable"
                checked={formData.isTaxable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isTaxable: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowance-insurance">社保対象</Label>
              <Switch
                id="allowance-insurance"
                checked={formData.isInsuranceTarget}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isInsuranceTarget: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowance-base-calc">割増賃金の計算基礎に含む</Label>
              <Switch
                id="allowance-base-calc"
                checked={formData.isBaseCalculation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isBaseCalculation: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allowance-active">有効</Label>
              <Switch
                id="allowance-active"
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
            <AlertDialogTitle>支給項目を削除</AlertDialogTitle>
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
