'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
import { BarChart3 } from 'lucide-react';

interface AggregationCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

interface FreeTextMasterItem {
  id: string;
  name: string;
  sortOrder: number;
}

const defaultCategories: AggregationCategory[] = [
  { id: '1', code: 'normal', name: '通常勤務', description: '所定労働時間内の通常勤務', isActive: true, sortOrder: 1 },
  { id: '2', code: 'overtime', name: '残業', description: '所定労働時間を超えた勤務', isActive: true, sortOrder: 2 },
  { id: '3', code: 'late_night', name: '深夜勤務', description: '22:00〜翌5:00の勤務', isActive: true, sortOrder: 3 },
  { id: '4', code: 'holiday', name: '休日勤務', description: '法定休日・所定休日の勤務', isActive: true, sortOrder: 4 },
  { id: '5', code: 'paid_leave', name: '有給休暇', description: '年次有給休暇の取得', isActive: true, sortOrder: 5 },
  { id: '6', code: 'absence', name: '欠勤', description: '無届け・承認なし欠勤', isActive: true, sortOrder: 6 },
  { id: '7', code: 'late_early', name: '遅刻・早退', description: '遅刻・早退時間の集計', isActive: true, sortOrder: 7 },
];

export function AggregationCategoryPanel() {
  const [categories, setCategories] = useState<AggregationCategory[]>(defaultCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AggregationCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', sortOrder: 0, isActive: true });

  // 部門マスタ
  const [departments, setDepartments] = useState<FreeTextMasterItem[]>([]);
  const [deptInput, setDeptInput] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');

  // 職種マスタ
  const [jobTypes, setJobTypes] = useState<FreeTextMasterItem[]>([]);
  const [jobInput, setJobInput] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingJobName, setEditingJobName] = useState('');

  const addDepartment = () => {
    if (!deptInput.trim()) return;
    setDepartments(prev => [...prev, { id: crypto.randomUUID(), name: deptInput.trim(), sortOrder: prev.length + 1 }]);
    setDeptInput('');
  };

  const addJobType = () => {
    if (!jobInput.trim()) return;
    setJobTypes(prev => [...prev, { id: crypto.randomUUID(), name: jobInput.trim(), sortOrder: prev.length + 1 }]);
    setJobInput('');
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setForm({ code: '', name: '', description: '', sortOrder: categories.length + 1, isActive: true });
    setDialogOpen(true);
  };

  const openEditDialog = (item: AggregationCategory) => {
    setEditingItem(item);
    setForm({ code: item.code, name: item.name, description: item.description, sortOrder: item.sortOrder, isActive: item.isActive });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.name) return;
    if (editingItem) {
      setCategories(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...form } : c));
    } else {
      setCategories(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setCategories(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  const toggleActive = (id: string, isActive: boolean) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive } : c));
  };

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <div>
              <CardTitle>集計区分設定</CardTitle>
              <CardDescription>勤怠集計のカテゴリ（通常勤務・残業・深夜等）を定義します</CardDescription>
            </div>
          </div>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="w-4 h-4 mr-2" />追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>区分名</TableHead>
              <TableHead>コード</TableHead>
              <TableHead>説明</TableHead>
              <TableHead>有効</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.sort((a, b) => a.sortOrder - b.sortOrder).map((cat) => (
              <TableRow key={cat.id} className="cursor-pointer" onClick={() => openEditDialog(cat)}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell><Badge variant="outline">{cat.code}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">{cat.description}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Switch checked={cat.isActive} onCheckedChange={(v) => toggleActive(cat.id, v)} />
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(cat)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? '集計区分の編集' : '集計区分の追加'}</DialogTitle>
            <DialogDescription>勤怠集計区分の情報を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>区分名 *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>コード *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>説明</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>表示順</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
                <Label>有効</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={!form.code || !form.name}>
              {editingItem ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>集計区分の削除</AlertDialogTitle>
            <AlertDialogDescription>この集計区分を削除しますか？この操作は元に戻せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>

    {/* 部門マスタ */}
    <Card>
      <CardHeader>
        <CardTitle className="text-base">部門マスタ</CardTitle>
        <CardDescription>勤怠集計で使用する部門を管理します（自由入力）</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={deptInput}
              onChange={e => setDeptInput(e.target.value)}
              placeholder="部門名を入力"
              onKeyDown={e => e.key === 'Enter' && addDepartment()}
            />
            <Button onClick={addDepartment} size="sm" disabled={!deptInput.trim()}>
              <Plus className="w-4 h-4 mr-1" />追加
            </Button>
          </div>
          {departments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部門名</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {editingDeptId === d.id ? (
                        <Input
                          value={editingDeptName}
                          onChange={e => setEditingDeptName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              setDepartments(prev => prev.map(p => p.id === d.id ? { ...p, name: editingDeptName } : p));
                              setEditingDeptId(null);
                            }
                          }}
                          onBlur={() => {
                            setDepartments(prev => prev.map(p => p.id === d.id ? { ...p, name: editingDeptName } : p));
                            setEditingDeptId(null);
                          }}
                          className="h-8"
                          autoFocus
                        />
                      ) : (
                        <span className="cursor-pointer" onClick={() => { setEditingDeptId(d.id); setEditingDeptName(d.name); }}>{d.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingDeptId(d.id); setEditingDeptName(d.name); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDepartments(prev => prev.filter(p => p.id !== d.id))}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>

    {/* 職種マスタ */}
    <Card>
      <CardHeader>
        <CardTitle className="text-base">職種マスタ</CardTitle>
        <CardDescription>勤怠集計で使用する職種を管理します（自由入力）</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={jobInput}
              onChange={e => setJobInput(e.target.value)}
              placeholder="職種名を入力"
              onKeyDown={e => e.key === 'Enter' && addJobType()}
            />
            <Button onClick={addJobType} size="sm" disabled={!jobInput.trim()}>
              <Plus className="w-4 h-4 mr-1" />追加
            </Button>
          </div>
          {jobTypes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>職種名</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobTypes.map(j => (
                  <TableRow key={j.id}>
                    <TableCell>
                      {editingJobId === j.id ? (
                        <Input
                          value={editingJobName}
                          onChange={e => setEditingJobName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              setJobTypes(prev => prev.map(p => p.id === j.id ? { ...p, name: editingJobName } : p));
                              setEditingJobId(null);
                            }
                          }}
                          onBlur={() => {
                            setJobTypes(prev => prev.map(p => p.id === j.id ? { ...p, name: editingJobName } : p));
                            setEditingJobId(null);
                          }}
                          className="h-8"
                          autoFocus
                        />
                      ) : (
                        <span className="cursor-pointer" onClick={() => { setEditingJobId(j.id); setEditingJobName(j.name); }}>{j.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingJobId(j.id); setEditingJobName(j.name); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setJobTypes(prev => prev.filter(p => p.id !== j.id))}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
