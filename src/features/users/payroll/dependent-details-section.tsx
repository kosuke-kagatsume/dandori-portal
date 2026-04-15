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
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, MoreHorizontal, Pencil, Trash2, ShieldCheck } from 'lucide-react';
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
}

interface MynumberMeta {
  hasNumber: boolean;
  status: string;
}

interface DependentDetailsSectionProps {
  userId: string;
  canEdit: boolean;
  canReadMynumber?: boolean;
  canManageMynumber?: boolean;
}

const dependentTypeLabels: Record<string, string> = {
  spouse: '配偶者',
  general: '一般扶養',
  specific: '特定扶養(19-22歳)',
  elderly: '老人扶養(70歳以上)',
  under16: '16歳未満',
};

const disabilityGradeLabels: Record<string, string> = {
  none: 'なし',
  general: '一般障害者',
  special: '特別障害者',
  fellow_living_special: '同居特別障害者',
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
});

const statusLabels: Record<string, string> = {
  pending: '未提供',
  requested: '依頼中',
  approved: '提供済み',
};

export function DependentDetailsSection({ userId, canEdit, canReadMynumber, canManageMynumber: canManageMn }: DependentDetailsSectionProps) {
  const [records, setRecords] = useState<DependentDetail[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [mynumberMap, setMynumberMap] = useState<Record<string, MynumberMeta>>({});
  const [revealedNumbers, setRevealedNumbers] = useState<Record<string, string>>({});
  const [mnDialogDepId, setMnDialogDepId] = useState<string | null>(null);
  const [mnInput, setMnInput] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/dependent-details`);
      if (res.ok) {
        const json = await res.json();
        const deps: DependentDetail[] = json.data || [];
        setRecords(deps);
        if (canReadMynumber && deps.length > 0) {
          const mnMap: Record<string, MynumberMeta> = {};
          await Promise.all(deps.map(async (dep) => {
            try {
              const mnRes = await fetch(`/api/users/${userId}/dependent-details/${dep.id}/mynumber`);
              if (mnRes.ok) {
                const mnJson = await mnRes.json();
                if (mnJson.data) {
                  mnMap[dep.id] = { hasNumber: mnJson.data.hasNumber, status: mnJson.data.status };
                }
              }
            } catch { /* ignore */ }
          }));
          setMynumberMap(mnMap);
        }
      }
    } catch { /* */ }
  }, [userId, canReadMynumber]);

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
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.dependentType) {
      toast.error('氏名と扶養区分は必須です');
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

  const handleRevealToggle = async (depId: string, checked: boolean) => {
    if (checked) {
      try {
        const res = await fetch(`/api/users/${userId}/dependent-details/${depId}/mynumber/reveal`, { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          setRevealedNumbers(prev => ({ ...prev, [depId]: json.data.myNumber }));
        }
      } catch {
        toast.error('マイナンバーの復号に失敗しました');
      }
    } else {
      setRevealedNumbers(prev => {
        const next = { ...prev };
        delete next[depId];
        return next;
      });
    }
  };

  const saveMynumber = async () => {
    if (!mnDialogDepId || !mnInput) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/dependent-details/${mnDialogDepId}/mynumber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myNumber: mnInput }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || 'マイナンバー登録に失敗しました');
        return;
      }
      toast.success('マイナンバーを登録しました');
      setMnDialogDepId(null);
      setMnInput('');
      await fetchData();
    } catch {
      toast.error('マイナンバー登録に失敗しました');
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
                  <TableHead>区分</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>続柄</TableHead>
                  <TableHead>生年月日</TableHead>
                  <TableHead>同居</TableHead>
                  <TableHead>障害区分</TableHead>
                  {canReadMynumber && <TableHead>マイナンバー</TableHead>}
                  {canReadMynumber && <TableHead>提供状況</TableHead>}
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
                    {canReadMynumber && (
                      <TableCell>
                        {mynumberMap[record.id]?.hasNumber ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono">
                              {revealedNumbers[record.id] || '************'}
                            </span>
                            <Checkbox
                              checked={!!revealedNumbers[record.id]}
                              onCheckedChange={(checked) => handleRevealToggle(record.id, !!checked)}
                            />
                            <span className="text-[10px] text-muted-foreground">表示</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">未登録</span>
                        )}
                      </TableCell>
                    )}
                    {canReadMynumber && (
                      <TableCell>
                        <Badge variant={mynumberMap[record.id]?.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                          {statusLabels[mynumberMap[record.id]?.status || ''] || '未依頼'}
                        </Badge>
                      </TableCell>
                    )}
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
                            {canManageMn && (
                              <DropdownMenuItem onClick={() => { setMnDialogDepId(record.id); setMnInput(''); }}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                マイナンバー登録
                              </DropdownMenuItem>
                            )}
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
                <Label className="text-xs">扶養区分 *</Label>
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
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.isLivingTogether} onCheckedChange={(v) => setForm(f => ({ ...f, isLivingTogether: v }))} />
                <Label className="text-xs">同居</Label>
              </div>
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

      {/* マイナンバー登録ダイアログ */}
      <Dialog open={!!mnDialogDepId} onOpenChange={(open) => { if (!open) { setMnDialogDepId(null); setMnInput(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>扶養家族マイナンバー登録</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs">マイナンバー（12桁）</Label>
            <Input
              className="h-8 font-mono"
              value={mnInput}
              onChange={(e) => setMnInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="123456789012"
              maxLength={12}
            />
            {mnInput.length > 0 && mnInput.length !== 12 && (
              <p className="text-xs text-destructive">12桁の数字を入力してください</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMnDialogDepId(null); setMnInput(''); }}>キャンセル</Button>
            <Button onClick={saveMynumber} disabled={isSaving || mnInput.length !== 12}>
              {isSaving ? '登録中...' : '登録'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
