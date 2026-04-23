'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DependentDetail {
  id: string;
  dependentType: string;
  name: string;
  nameKana: string | null;
  birthDate: string | null;
  relationship: string | null;
  isLivingTogether: boolean;
  annualIncome: number | null;
  disabilityGrade: string;
  healthInsuranceType: string;
}

interface DependentDetailsSectionProps {
  userId: string;
  canEdit: boolean;
  /** @deprecated 扶養親族詳細画面ではマイナンバーを扱わない（別セクション管理） */
  canReadMynumber?: boolean;
  /** @deprecated 同上 */
  canManageMynumber?: boolean;
}

const dependentTypeLabels: Record<string, string> = {
  spouse: '配偶者',
  general: '一般扶養',
  specific: '特定扶養(19-22歳)',
  elderly: '老人扶養(70歳以上)',
  under16: '16歳未満',
  excluded: '対象外',
};

const disabilityGradeLabels: Record<string, string> = {
  none: 'なし',
  general: '一般障害者',
  special: '特別障害者',
  fellow_living_special: '同居特別障害者',
};

const healthInsuranceTypeLabels: Record<string, string> = {
  enrolled: '加入',
  excluded: '対象外',
};

const emptyForm = () => ({
  dependentType: 'general',
  name: '',
  nameKana: '',
  birthDate: '',
  relationship: '',
  isLivingTogether: true,
  annualIncome: '',
  disabilityGrade: 'none',
  healthInsuranceType: 'enrolled',
});

export function DependentDetailsSection({ userId, canEdit }: DependentDetailsSectionProps) {
  const [records, setRecords] = useState<DependentDetail[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/dependent-details`);
      if (res.ok) {
        const json = await res.json();
        const deps: DependentDetail[] = json.data || [];
        setRecords(deps);
      }
    } catch { /* */ }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (record: DependentDetail) => {
    setEditingId(record.id);
    setForm({
      dependentType: record.dependentType,
      name: record.name,
      nameKana: record.nameKana || '',
      birthDate: record.birthDate ? record.birthDate.split('T')[0] : '',
      relationship: record.relationship || '',
      isLivingTogether: record.isLivingTogether,
      annualIncome: record.annualIncome != null ? String(record.annualIncome) : '',
      disabilityGrade: record.disabilityGrade,
      healthInsuranceType: record.healthInsuranceType || 'enrolled',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.dependentType) {
      toast.error('氏名と税扶養区分は必須です');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        annualIncome: form.annualIncome ? parseInt(form.annualIncome) : null,
        birthDate: form.birthDate || null,
        ...(editingId && { recordId: editingId }),
      };
      const res = await fetch(`/api/users/${userId}/dependent-details`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? '扶養親族情報を更新しました' : '扶養親族を追加しました');
      setDialogOpen(false);
      setEditingId(null);
      await fetchData();
    } catch {
      toast.error('扶養親族情報の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/dependent-details?recordId=${recordId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('扶養親族を削除しました');
      setDeleteId(null);
      await fetchData();
    } catch {
      toast.error('扶養親族の削除に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 区分ごとの人数集計
  const typeCounts = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.dependentType] = (acc[r.dependentType] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">扶養親族詳細</CardTitle>
                <CardDescription>
                  {records.length > 0
                    ? `${records.length}名登録`
                    : '扶養親族の詳細情報'}
                </CardDescription>
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                追加
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {records.length > 0 && (
            <div className="flex gap-2 mb-3">
              {Object.entries(typeCounts).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {dependentTypeLabels[type] || type}: {count}名
                </Badge>
              ))}
            </div>
          )}
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">扶養親族の登録はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>税区分</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>続柄</TableHead>
                  <TableHead>生年月日</TableHead>
                  <TableHead>同居</TableHead>
                  <TableHead>障害</TableHead>
                  <TableHead>健保区分</TableHead>
                  {canEdit && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {dependentTypeLabels[record.dependentType] || record.dependentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{record.relationship || '-'}</TableCell>
                    <TableCell>
                      {record.birthDate
                        ? new Date(record.birthDate).toLocaleDateString('ja-JP')
                        : '-'}
                    </TableCell>
                    <TableCell>{record.isLivingTogether ? '同居' : '別居'}</TableCell>
                    <TableCell>{disabilityGradeLabels[record.disabilityGrade] || '-'}</TableCell>
                    <TableCell>{healthInsuranceTypeLabels[record.healthInsuranceType] || '-'}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(record)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(record.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 追加/編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setEditingId(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '扶養親族の編集' : '扶養親族の追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">税扶養区分 *</Label>
                <Select value={form.dependentType} onValueChange={(v) => setForm(f => ({ ...f, dependentType: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(dependentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">続柄</Label>
                <Input className="h-8" value={form.relationship} onChange={(e) => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="妻、子など" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">氏名 *</Label>
                <Input className="h-8" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">フリガナ</Label>
                <Input className="h-8" value={form.nameKana} onChange={(e) => setForm(f => ({ ...f, nameKana: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">生年月日</Label>
                <Input type="date" className="h-8" value={form.birthDate} onChange={(e) => setForm(f => ({ ...f, birthDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">年間所得</Label>
                <Input type="number" className="h-8" value={form.annualIncome} onChange={(e) => setForm(f => ({ ...f, annualIncome: e.target.value }))} placeholder="円" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">障害区分</Label>
                <Select value={form.disabilityGrade} onValueChange={(v) => setForm(f => ({ ...f, disabilityGrade: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(disabilityGradeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">健保扶養区分</Label>
                <Select value={form.healthInsuranceType} onValueChange={(v) => setForm(f => ({ ...f, healthInsuranceType: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(healthInsuranceTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isLivingTogether} onCheckedChange={(v) => setForm(f => ({ ...f, isLivingTogether: v }))} />
              <Label className="text-xs">同居</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={save} disabled={isSaving}>
              {isSaving ? '保存中...' : (editingId ? '更新' : '追加')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>扶養親族の削除</AlertDialogTitle>
            <AlertDialogDescription>この扶養親族情報を削除してもよろしいですか？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} disabled={isSaving}>
              {isSaving ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
