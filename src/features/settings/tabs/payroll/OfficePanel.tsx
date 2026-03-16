'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Office {
  id: string;
  name: string;
  nameKana: string;
  isHeadquarters: boolean;
  postalCode: string;
  prefecture: string;
  address1: string;
  address1Kana: string;
  address2: string;
  address2Kana: string;
  tel: string;
  fax: string;
  url: string;
  ownerTitle: string;
  ownerName: string;
  ownerNameKana: string;
  sortOrder: number;
  socialInsuranceSettings: Record<string, unknown> | null;
  laborInsuranceSettings: Record<string, unknown> | null;
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
  nameKana: '',
  isHeadquarters: false,
  postalCode: '',
  prefecture: '',
  address1: '',
  address1Kana: '',
  address2: '',
  address2Kana: '',
  tel: '',
  fax: '',
  url: '',
  ownerTitle: '',
  ownerName: '',
  ownerNameKana: '',
  sortOrder: 0,
};

export function OfficePanel() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Office | null>(null);
  const [deletingItem, setDeletingItem] = useState<Office | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchOffices = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/payroll/offices');
      const json = await res.json();
      if (json.success && json.data?.offices) {
        setOffices(json.data.offices);
      }
    } catch {
      // フォールバック
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const openAddDialog = () => {
    setEditingItem(null);
    setForm({ ...defaultForm, sortOrder: offices.length + 1 });
    setDialogOpen(true);
  };

  const openEditDialog = (item: Office) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      nameKana: item.nameKana || '',
      isHeadquarters: item.isHeadquarters,
      postalCode: item.postalCode || '',
      prefecture: item.prefecture || '',
      address1: item.address1 || '',
      address1Kana: item.address1Kana || '',
      address2: item.address2 || '',
      address2Kana: item.address2Kana || '',
      tel: item.tel || '',
      fax: item.fax || '',
      url: item.url || '',
      ownerTitle: item.ownerTitle || '',
      ownerName: item.ownerName || '',
      ownerNameKana: item.ownerNameKana || '',
      sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingItem) {
        const res = await fetch(`/api/settings/payroll/offices?id=${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('事業所を更新しました');
          fetchOffices();
        } else {
          toast.error(json.error || '更新に失敗しました');
        }
      } else {
        const res = await fetch('/api/settings/payroll/offices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('事業所を追加しました');
          fetchOffices();
        } else {
          toast.error(json.error || '追加に失敗しました');
        }
      }
      setDialogOpen(false);
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(`/api/settings/payroll/offices?id=${deletingItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('事業所を削除しました');
        fetchOffices();
      } else {
        toast.error(json.error || '削除に失敗しました');
      }
    } catch {
      toast.error('削除に失敗しました');
    }
    setDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                  <TableHead>本社</TableHead>
                  <TableHead>都道府県</TableHead>
                  <TableHead>住所</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>事業主名</TableHead>
                  <TableHead>社会保険</TableHead>
                  <TableHead>労働保険</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offices.sort((a, b) => a.sortOrder - b.sortOrder).map((office) => (
                  <TableRow key={office.id} className="cursor-pointer" onClick={() => openEditDialog(office)}>
                    <TableCell className="font-medium">{office.name}</TableCell>
                    <TableCell>
                      {office.isHeadquarters ? (
                        <Badge variant="default" className="text-xs">本社</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{office.prefecture || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{office.address1 || '-'}</TableCell>
                    <TableCell>{office.tel || '-'}</TableCell>
                    <TableCell>{office.ownerName || '-'}</TableCell>
                    <TableCell>
                      {office.socialInsuranceSettings ? (
                        <Badge variant="secondary" className="text-xs">設定済</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">未設定</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {office.laborInsuranceSettings ? (
                        <Badge variant="secondary" className="text-xs">設定済</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">未設定</span>
                      )}
                    </TableCell>
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
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? '事業所を編集' : '事業所を追加'}</DialogTitle>
            <DialogDescription>{editingItem ? `${editingItem.name}の情報を変更します` : '新しい事業所を登録します'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>事業所名 *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="本社" />
              </div>
              <div className="space-y-2">
                <Label>事業所名フリガナ</Label>
                <Input value={form.nameKana} onChange={e => setForm(f => ({ ...f, nameKana: e.target.value }))} placeholder="ホンシャ" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isHeadquarters"
                checked={form.isHeadquarters}
                onCheckedChange={(v) => setForm(f => ({ ...f, isHeadquarters: !!v }))}
              />
              <Label htmlFor="isHeadquarters">本社</Label>
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
              <Label>住所1</Label>
              <Input value={form.address1} onChange={e => setForm(f => ({ ...f, address1: e.target.value }))} placeholder="市区町村 番地" />
            </div>
            <div className="space-y-2">
              <Label>住所1カナ</Label>
              <Input value={form.address1Kana} onChange={e => setForm(f => ({ ...f, address1Kana: e.target.value }))} placeholder="シクチョウソン バンチ" />
            </div>
            <div className="space-y-2">
              <Label>住所2</Label>
              <Input value={form.address2} onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} placeholder="建物名 部屋番号" />
            </div>
            <div className="space-y-2">
              <Label>住所2カナ</Label>
              <Input value={form.address2Kana} onChange={e => setForm(f => ({ ...f, address2Kana: e.target.value }))} placeholder="タテモノメイ ヘヤバンゴウ" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="03-1234-5678" />
              </div>
              <div className="space-y-2">
                <Label>FAX番号</Label>
                <Input value={form.fax} onChange={e => setForm(f => ({ ...f, fax: e.target.value }))} placeholder="03-1234-5679" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>事業主役職名</Label>
                <Input value={form.ownerTitle} onChange={e => setForm(f => ({ ...f, ownerTitle: e.target.value }))} placeholder="代表取締役" />
              </div>
              <div className="space-y-2">
                <Label>事業主名</Label>
                <Input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>事業主フリガナ</Label>
              <Input value={form.ownerNameKana} onChange={e => setForm(f => ({ ...f, ownerNameKana: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>表示順</Label>
              <Input type="number" min={0} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
