'use client';

import { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Briefcase,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMasterDataStore, Department, Position, EmploymentType } from '@/lib/store/master-data-store';

// CookieからテナントIDを取得するヘルパー
const getTenantIdFromCookie = (): string => {
  if (typeof document === 'undefined') return 'tenant-1';
  const match = document.cookie.match(/x-tenant-id=([^;]+)/);
  return match ? match[1] : 'tenant-1';
};

export function MasterDataPanel() {
  const [activeTab, setActiveTab] = useState('departments');

  // 編集ダイアログの状態
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<'department' | 'position' | 'employmentType'>('department');
  const [editingItem, setEditingItem] = useState<Department | Position | EmploymentType | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', parentId: '', level: 1, order: 0 });

  const {
    departments,
    positions,
    employmentTypes,
    isLoading,
    error,
    tenantId,
    setTenantId,
    fetchAll,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addPosition,
    updatePosition,
    deletePosition,
    addEmploymentType,
    updateEmploymentType,
    deleteEmploymentType,
  } = useMasterDataStore();

  // テナントIDの設定とデータの取得
  useEffect(() => {
    // Cookieから正しいテナントIDを取得
    const cookieTenantId = getTenantIdFromCookie();
    if (cookieTenantId !== tenantId) {
      setTenantId(cookieTenantId);
    }
  }, [tenantId, setTenantId]);

  // tenantIdが設定されたらデータを取得
  useEffect(() => {
    if (tenantId) {
      fetchAll();
    }
  }, [tenantId, fetchAll]);

  // 新規追加・編集ダイアログを開く
  const openEditDialog = (type: 'department' | 'position' | 'employmentType', item?: Department | Position | EmploymentType) => {
    setEditingType(type);
    setEditingItem(item || null);

    if (item) {
      setFormData({
        name: item.name,
        code: 'code' in item ? (item.code || '') : '',
        parentId: 'parentId' in item ? (item.parentId || '') : '',
        level: 'level' in item ? item.level : 1,
        order: item.order,
      });
    } else {
      // 新規追加時は最大orderの次を設定
      let maxOrder = 0;
      if (type === 'department') {
        maxOrder = Math.max(...departments.map(d => d.order), 0);
      } else if (type === 'position') {
        maxOrder = Math.max(...positions.map(p => p.order), 0);
      } else {
        maxOrder = Math.max(...employmentTypes.map(t => t.order), 0);
      }
      setFormData({ name: '', code: '', parentId: '', level: 1, order: maxOrder + 1 });
    }

    setEditDialogOpen(true);
  };

  // 保存処理
  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('名称を入力してください');
      return;
    }

    if (editingItem) {
      // 更新
      if (editingType === 'department') {
        updateDepartment(editingItem.id, {
          code: formData.code || undefined,
          name: formData.name,
          parentId: formData.parentId || null,
          order: formData.order,
        });
      } else if (editingType === 'position') {
        updatePosition(editingItem.id, { name: formData.name, level: formData.level, order: formData.order });
      } else {
        updateEmploymentType(editingItem.id, { name: formData.name, order: formData.order });
      }
      toast.success('更新しました');
    } else {
      // 新規追加
      if (editingType === 'department') {
        addDepartment({
          code: formData.code || undefined,
          name: formData.name,
          parentId: formData.parentId || null,
          order: formData.order,
          isActive: true,
        });
      } else if (editingType === 'position') {
        addPosition({ name: formData.name, level: formData.level, order: formData.order, isActive: true });
      } else {
        addEmploymentType({ name: formData.name, order: formData.order, isActive: true });
      }
      toast.success('追加しました');
    }

    setEditDialogOpen(false);
  };

  // 削除処理
  const handleDelete = (type: 'department' | 'position' | 'employmentType', id: string) => {
    if (type === 'department') {
      deleteDepartment(id);
    } else if (type === 'position') {
      deletePosition(id);
    } else {
      deleteEmploymentType(id);
    }
    toast.success('削除しました');
  };

  // 有効/無効切り替え
  const handleToggleActive = (type: 'department' | 'position' | 'employmentType', id: string, isActive: boolean) => {
    if (type === 'department') {
      updateDepartment(id, { isActive });
    } else if (type === 'position') {
      updatePosition(id, { isActive });
    } else {
      updateEmploymentType(id, { isActive });
    }
    toast.success(isActive ? '有効にしました' : '無効にしました');
  };

  const getTypeLabel = () => {
    switch (editingType) {
      case 'department': return '部署';
      case 'position': return '役職';
      case 'employmentType': return '雇用形態';
    }
  };

  // ローディング中の表示
  if (isLoading && departments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            マスタ管理
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            マスタ管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>エラー: {error}</p>
            <Button onClick={() => fetchAll()} className="mt-4" variant="outline">
              再読み込み
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          マスタ管理
        </CardTitle>
        <CardDescription>
          部署、役職、雇用形態などのマスタデータを管理します。
          ユーザー招待時の選択肢として使用されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              部署
              <Badge variant="secondary" className="ml-1">{departments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              役職
              <Badge variant="secondary" className="ml-1">{positions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="employmentTypes" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              雇用形態
              <Badge variant="secondary" className="ml-1">{employmentTypes.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* 部署タブ */}
          <TabsContent value="departments">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                組織の部署を管理します。ユーザー招待時の所属部署として選択できます。
              </p>
              <Button onClick={() => openEditDialog('department')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                部署を追加
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="w-24">コード</TableHead>
                  <TableHead>部署名</TableHead>
                  <TableHead className="w-32">親部署</TableHead>
                  <TableHead className="w-20">表示順</TableHead>
                  <TableHead className="w-24">状態</TableHead>
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.sort((a, b) => a.order - b.order).map((dept) => {
                  const parentDept = dept.parentId ? departments.find(d => d.id === dept.parentId) : null;
                  return (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{dept.code || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className={dept.parentId ? 'ml-4' : ''}>
                          {dept.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {parentDept ? parentDept.name : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dept.order}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={dept.isActive}
                          onCheckedChange={(checked) => handleToggleActive('department', dept.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog('department', dept)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('department', dept.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          {/* 役職タブ */}
          <TabsContent value="positions">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                役職を管理します。レベルは承認フローの階層判定などに使用されます。
              </p>
              <Button onClick={() => openEditDialog('position')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                役職を追加
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>役職名</TableHead>
                  <TableHead className="w-24">レベル</TableHead>
                  <TableHead className="w-24">状態</TableHead>
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.sort((a, b) => a.order - b.order).map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>{pos.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Lv.{pos.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={pos.isActive}
                        onCheckedChange={(checked) => handleToggleActive('position', pos.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog('position', pos)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete('position', pos.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* 雇用形態タブ */}
          <TabsContent value="employmentTypes">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                雇用形態を管理します。正社員、契約社員、パートなどを設定できます。
              </p>
              <Button onClick={() => openEditDialog('employmentType')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                雇用形態を追加
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>雇用形態</TableHead>
                  <TableHead className="w-24">状態</TableHead>
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employmentTypes.sort((a, b) => a.order - b.order).map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>
                      <Switch
                        checked={type.isActive}
                        onCheckedChange={(checked) => handleToggleActive('employmentType', type.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog('employmentType', type)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete('employmentType', type.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `${getTypeLabel()}を編集` : `${getTypeLabel()}を追加`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingType === 'department' && (
              <div className="grid gap-2">
                <Label htmlFor="code">部署コード</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例: SALES-001"
                />
                <p className="text-xs text-muted-foreground">
                  部署を識別するためのコード（任意）
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">{getTypeLabel()}名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`${getTypeLabel()}名を入力`}
              />
            </div>
            {editingType === 'department' && (
              <div className="grid gap-2">
                <Label htmlFor="parentId">親部署</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="親部署を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし（トップレベル）</SelectItem>
                    {departments
                      .filter(d => d.id !== editingItem?.id) // 自分自身は除外
                      .sort((a, b) => a.order - b.order)
                      .map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  上位の部署を選択します
                </p>
              </div>
            )}
            {editingType === 'position' && (
              <div className="grid gap-2">
                <Label htmlFor="level">レベル</Label>
                <Input
                  id="level"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground">
                  役職の階層を表します（1: 一般, 4: 課長, 5: 部長 など）
                </p>
              </div>
            )}
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
