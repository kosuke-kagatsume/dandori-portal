'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

interface Office {
  id: string;
  name: string;
  postalCode: string;
  prefecture: string;
  address: string;
  tel: string;
  representativeName: string;
  sortOrder: number;
}

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県',
  '岐阜県','静岡県','愛知県','三重県',
  '滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県',
  '鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県',
  '福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];

const defaultForm = {
  name: '',
  postalCode: '',
  prefecture: '',
  address: '',
  tel: '',
  representativeName: '',
  sortOrder: 0,
};

export function OfficePanel() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Office | null>(null);
  const [deletingItem, setDeletingItem] = useState<Office | null>(null);
  const [form, setForm] = useState(defaultForm);

  const openAddDialog = () => {
    setEditingItem(null);
    setForm({ ...defaultForm, sortOrder: offices.length + 1 });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Office) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      postalCode: item.postalCode,
      prefecture: item.prefecture,
      address: item.address,
      tel: item.tel,
      representativeName: item.representativeName,
      sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingItem) {
      setOffices(prev => prev.map(o => o.id === editingItem.id ? { ...o, ...form } : o));
    } else {
      setOffices(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    setOffices(prev => prev.filter(o => o.id !== deletingItem.id));
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <div>
                <CardTitle className="text-base">事業所マスタ</CardTitle>
                <CardDescription>給与計算・社会保険に使用する事業所情報を管理します</CardDescription>
              </div>
            </div>
            <Button onClick={openAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {offices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              事業所が登録されていません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>事業所名</TableHead>
                  <TableHead>都道府県</TableHead>
                  <TableHead>住所</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>代表者</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offices.sort((a, b) => a.sortOrder - b.sortOrder).map((office) => (
                  <TableRow key={office.id} className="cursor-pointer" onClick={() => openEditDialog(office)}>
                    <TableCell className="font-medium">{office.name}</TableCell>
                    <TableCell>{office.prefecture}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{office.address}</TableCell>
                    <TableCell>{office.tel || '-'}</TableCell>
                    <TableCell>{office.representativeName || '-'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(office)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingItem(office); setDeleteDialogOpen(true); }}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? '事業所を編集' : '事業所を追加'}</DialogTitle>
            <DialogDescription>{editingItem ? `${editingItem.name}の情報を変更します` : '新しい事業所を登録します'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>事業所名 *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="本社" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>郵便番号</Label>
                <Input value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} placeholder="123-4567" />
              </div>
              <div className="space-y-2">
                <Label>都道府県</Label>
                <Select value={form.prefecture} onValueChange={v => setForm(f => ({ ...f, prefecture: v }))}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>住所</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="市区町村 番地 建物名" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="03-1234-5678" />
              </div>
              <div className="space-y-2">
                <Label>代表者名</Label>
                <Input value={form.representativeName} onChange={e => setForm(f => ({ ...f, representativeName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>表示順</Label>
              <Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editingItem ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>事業所を削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingItem?.name}」を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
