'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// アナウンス種別のインターフェース
export interface AnnouncementTypeMaster {
  id: string;
  code: string;        // 内部コード（例: 'general', 'deadline'）
  name: string;        // 表示名（例: '一般告知', '締切・期限'）
  color: string;       // バッジカラー（例: 'blue', 'orange', 'red'）
  order: number;       // 表示順
  isActive: boolean;   // 有効/無効
  isSystem: boolean;   // システム種別（削除不可）
}

// デフォルトの種別
const DEFAULT_ANNOUNCEMENT_TYPES: AnnouncementTypeMaster[] = [
  { id: '1', code: 'general', name: '一般告知', color: 'blue', order: 1, isActive: true, isSystem: true },
  { id: '2', code: 'deadline', name: '締切・期限', color: 'orange', order: 2, isActive: true, isSystem: true },
  { id: '3', code: 'system', name: 'システム関連', color: 'purple', order: 3, isActive: true, isSystem: true },
  { id: '4', code: 'event', name: 'イベント', color: 'green', order: 4, isActive: true, isSystem: true },
  { id: '5', code: 'policy', name: '規程・ポリシー', color: 'indigo', order: 5, isActive: true, isSystem: true },
  { id: '6', code: 'emergency', name: '緊急連絡', color: 'red', order: 6, isActive: true, isSystem: true },
];

// 色の選択肢
const COLOR_OPTIONS = [
  { value: 'blue', label: '青', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'orange', label: 'オレンジ', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'red', label: '赤', class: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'green', label: '緑', class: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'purple', label: '紫', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'indigo', label: '藍', class: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'gray', label: 'グレー', class: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'yellow', label: '黄', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'pink', label: 'ピンク', class: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'cyan', label: '水色', class: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
];

// ストアのインターフェース
interface AnnouncementTypeMasterState {
  types: AnnouncementTypeMaster[];
  isLoading: boolean;
  error: string | null;

  // 操作
  fetchTypes: () => void;
  addType: (type: Omit<AnnouncementTypeMaster, 'id' | 'isSystem'>) => void;
  updateType: (id: string, data: Partial<AnnouncementTypeMaster>) => void;
  deleteType: (id: string) => void;
  getActiveTypes: () => AnnouncementTypeMaster[];
}

// ストアの作成
export const useAnnouncementTypeMasterStore = create<AnnouncementTypeMasterState>()(
  persist(
    (set, get) => ({
      types: DEFAULT_ANNOUNCEMENT_TYPES,
      isLoading: false,
      error: null,

      fetchTypes: () => {
        // 初回ロード時にデフォルト種別がない場合は追加
        const currentTypes = get().types;
        if (currentTypes.length === 0) {
          set({ types: DEFAULT_ANNOUNCEMENT_TYPES });
        }
      },

      addType: (type) => {
        const newType: AnnouncementTypeMaster = {
          ...type,
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isSystem: false,
        };
        set((state) => ({
          types: [...state.types, newType],
        }));
      },

      updateType: (id, data) => {
        set((state) => ({
          types: state.types.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));
      },

      deleteType: (id) => {
        const type = get().types.find((t) => t.id === id);
        if (type?.isSystem) {
          return; // システム種別は削除不可
        }
        set((state) => ({
          types: state.types.filter((t) => t.id !== id),
        }));
      },

      getActiveTypes: () => {
        return get().types.filter((t) => t.isActive).sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'announcement-type-master-storage',
    }
  )
);

// 色からクラスを取得
const getColorClass = (color: string) => {
  return COLOR_OPTIONS.find((c) => c.value === color)?.class || 'bg-gray-100 text-gray-700 border-gray-200';
};

export function AnnouncementTypeMasterPanel() {
  const {
    types,
    addType,
    updateType,
    deleteType,
    fetchTypes,
  } = useAnnouncementTypeMasterStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementTypeMaster | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    color: 'blue',
    order: 1,
  });

  // 初期化
  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // 新規追加・編集ダイアログを開く
  const openEditDialog = useCallback((item?: AnnouncementTypeMaster) => {
    setEditingItem(item || null);

    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        color: item.color,
        order: item.order,
      });
    } else {
      const maxOrder = Math.max(...types.map((t) => t.order), 0);
      setFormData({
        code: '',
        name: '',
        color: 'blue',
        order: maxOrder + 1,
      });
    }

    setEditDialogOpen(true);
  }, [types]);

  // 保存処理
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('種別名を入力してください');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('コードを入力してください');
      return;
    }

    // コードの重複チェック
    const existingCode = types.find(
      (t) => t.code === formData.code && t.id !== editingItem?.id
    );
    if (existingCode) {
      toast.error('同じコードの種別が既に存在します');
      return;
    }

    if (editingItem) {
      updateType(editingItem.id, {
        name: formData.name,
        code: formData.code,
        color: formData.color,
        order: formData.order,
      });
      toast.success('種別を更新しました');
    } else {
      addType({
        code: formData.code,
        name: formData.name,
        color: formData.color,
        order: formData.order,
        isActive: true,
      });
      toast.success('種別を追加しました');
    }

    setEditDialogOpen(false);
  };

  // 削除処理
  const handleDelete = (id: string) => {
    const type = types.find((t) => t.id === id);
    if (type?.isSystem) {
      toast.error('システム種別は削除できません');
      return;
    }
    deleteType(id);
    toast.success('種別を削除しました');
  };

  // 有効/無効切り替え
  const handleToggleActive = (id: string, isActive: boolean) => {
    updateType(id, { isActive });
    toast.success(isActive ? '有効にしました' : '無効にしました');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          アナウンス種別マスタ
        </CardTitle>
        <CardDescription>
          アナウンスの種別を管理します。種別ごとに色分けして表示されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            システム種別は編集のみ可能で、削除はできません。
          </p>
          <Button onClick={() => openEditDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            種別を追加
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>種別名</TableHead>
              <TableHead className="w-24">コード</TableHead>
              <TableHead className="w-24">色</TableHead>
              <TableHead className="w-24">状態</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.sort((a, b) => a.order - b.order).map((type) => (
              <TableRow key={type.id}>
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={getColorClass(type.color)}>
                      {type.name}
                    </Badge>
                    {type.isSystem && (
                      <Badge variant="outline" className="text-xs">
                        システム
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {type.code}
                  </code>
                </TableCell>
                <TableCell>
                  <div
                    className={`w-6 h-6 rounded border ${getColorClass(type.color).split(' ')[0]}`}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={type.isActive}
                    onCheckedChange={(checked) => handleToggleActive(type.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(type)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!type.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(type.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'アナウンス種別を編集' : 'アナウンス種別を追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">種別名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: お知らせ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">コード</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="例: notice"
                disabled={editingItem?.isSystem}
              />
              <p className="text-xs text-muted-foreground">
                半角英数字とハイフンのみ。システムで使用する識別子です。
              </p>
            </div>
            <div className="grid gap-2">
              <Label>色</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      color.class.split(' ')[0]
                    } ${
                      formData.color === color.value
                        ? 'ring-2 ring-primary ring-offset-2'
                        : ''
                    }`}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">表示順</Label>
              <Input
                id="order"
                type="number"
                min={1}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
