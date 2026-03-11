'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// 市区町村の型定義
interface Municipality {
  id: string;
  code: string;
  name: string;
  prefectureName: string;
  isActive: boolean;
}

// 都道府県一覧
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const defaultFormData = {
  code: '',
  name: '',
  prefectureName: '',
  isActive: true,
};

export function ResidentTaxPanel() {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;

  const [items, setItems] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Municipality | null>(null);
  const [deletingItem, setDeletingItem] = useState<Municipality | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [filterPrefecture, setFilterPrefecture] = useState<string>('all');

  // データ取得
  const fetchItems = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/settings/payroll/municipalities?tenantId=${tenantId}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch {
      toast.error('市区町村データの取得に失敗しました');
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
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (item: Municipality) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      prefectureName: item.prefectureName,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  // 保存処理
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('市区町村コードと市区町村名は必須です');
      return;
    }
    if (!formData.prefectureName) {
      toast.error('都道府県を選択してください');
      return;
    }
    setIsSaving(true);
    try {
      const url = `/api/settings/payroll/municipalities?tenantId=${tenantId}`;
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
        toast.success(editingItem ? '市区町村を更新しました' : '市区町村を追加しました');
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
      const res = await fetch(`/api/settings/payroll/municipalities?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingItem.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('市区町村を削除しました');
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
  const handleToggleActive = async (item: Municipality, isActive: boolean) => {
    try {
      const res = await fetch(`/api/settings/payroll/municipalities?tenantId=${tenantId}`, {
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

  // フィルタリング
  const filteredItems = filterPrefecture === 'all'
    ? items
    : items.filter((i) => i.prefectureName === filterPrefecture);

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
              <CardTitle className="text-base">住民税設定（市区町村マスタ）</CardTitle>
              <CardDescription>住民税の納付先市区町村を管理します</CardDescription>
            </div>
            <Button onClick={openAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 都道府県フィルタ */}
          <div className="mb-4">
            <Select value={filterPrefecture} onValueChange={setFilterPrefecture}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="都道府県で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての都道府県</SelectItem>
                {PREFECTURES.map((pref) => (
                  <SelectItem key={pref} value={pref}>
                    {pref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {filterPrefecture !== 'all'
                ? `${filterPrefecture}の市区町村が登録されていません`
                : '市区町村が登録されていません'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>市区町村コード</TableHead>
                  <TableHead>市区町村名</TableHead>
                  <TableHead>都道府県</TableHead>
                  <TableHead>有効</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => openEditDialog(item)}
                  >
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {item.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.prefectureName}</TableCell>
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
              {editingItem ? '市区町村を編集' : '市区町村を追加'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `${editingItem.name}の設定を変更します`
                : '新しい市区町村を登録します'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="municipality-code">市区町村コード *</Label>
              <Input
                id="municipality-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="131016"
              />
              <p className="text-xs text-muted-foreground">
                総務省の全国地方公共団体コード（6桁）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipality-name">市区町村名 *</Label>
              <Input
                id="municipality-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="千代田区"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="municipality-prefecture">都道府県 *</Label>
              <Select
                value={formData.prefectureName}
                onValueChange={(value) =>
                  setFormData({ ...formData, prefectureName: value })
                }
              >
                <SelectTrigger id="municipality-prefecture">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {PREFECTURES.map((pref) => (
                    <SelectItem key={pref} value={pref}>
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="municipality-active">有効</Label>
              <Switch
                id="municipality-active"
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
            <AlertDialogTitle>市区町村を削除</AlertDialogTitle>
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
