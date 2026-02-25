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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Briefcase, Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { WorkRule, WorkRuleType } from '@/features/users/user-attendance-tab';

// 就業ルールタイプの定義
const workRuleTypes: { value: WorkRuleType; label: string; description: string }[] = [
  { value: 'standard', label: '基本勤務制', description: '固定の始業・終業時刻で勤務' },
  { value: 'shift', label: 'シフト制', description: '日によって勤務時間が変動' },
  { value: 'manager', label: '管理監督者', description: '労働時間・休日の規定が適用されない' },
  { value: 'discretionary', label: '裁量労働制', description: '業務の遂行方法を労働者に委ねる' },
  { value: 'flextime', label: 'フレックスタイム制', description: 'コアタイムを設定し柔軟に勤務' },
  { value: 'monthly_variable', label: '1ヶ月単位変形労働制', description: '1ヶ月以内の期間で労働時間を調整' },
  { value: 'yearly_variable', label: '1年単位変形労働制', description: '1年以内の期間で労働時間を調整' },
];

const workRuleTypeLabels: Record<WorkRuleType, string> = {
  standard: '基本勤務制',
  shift: 'シフト制',
  manager: '管理監督者',
  discretionary: '裁量労働制',
  flextime: 'フレックスタイム制',
  monthly_variable: '1ヶ月単位変形労働制',
  yearly_variable: '1年単位変形労働制',
};

// デモデータ
const demoWorkRules: (WorkRule & { id: string; assignedCount: number })[] = [
  {
    id: '1',
    type: 'standard',
    name: '基本勤務（9:00-18:00）',
    standardWorkHours: 480,
    breakMinutes: 60,
    workStartTime: '09:00',
    workEndTime: '18:00',
    assignedCount: 45,
  },
  {
    id: '2',
    type: 'flextime',
    name: 'フレックス（コア10-15時）',
    standardWorkHours: 480,
    breakMinutes: 60,
    coreTimeStart: '10:00',
    coreTimeEnd: '15:00',
    flexTimeStart: '07:00',
    flexTimeEnd: '22:00',
    assignedCount: 23,
  },
  {
    id: '3',
    type: 'manager',
    name: '管理職',
    standardWorkHours: 480,
    breakMinutes: 60,
    assignedCount: 8,
  },
];

interface WorkRuleFormData {
  type: WorkRuleType;
  name: string;
  standardWorkHours: number;
  breakMinutes: number;
  workStartTime: string;
  workEndTime: string;
  coreTimeStart: string;
  coreTimeEnd: string;
  flexTimeStart: string;
  flexTimeEnd: string;
}

const defaultFormData: WorkRuleFormData = {
  type: 'standard',
  name: '',
  standardWorkHours: 480,
  breakMinutes: 60,
  workStartTime: '09:00',
  workEndTime: '18:00',
  coreTimeStart: '10:00',
  coreTimeEnd: '15:00',
  flexTimeStart: '07:00',
  flexTimeEnd: '22:00',
};

export function WorkRuleMasterPanel() {
  const [workRules, setWorkRules] = useState(demoWorkRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<(typeof demoWorkRules)[0] | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkRuleFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (rule: (typeof demoWorkRules)[0]) => {
    setEditingRule(rule);
    setFormData({
      type: rule.type,
      name: rule.name,
      standardWorkHours: rule.standardWorkHours,
      breakMinutes: rule.breakMinutes,
      workStartTime: rule.workStartTime || '09:00',
      workEndTime: rule.workEndTime || '18:00',
      coreTimeStart: rule.coreTimeStart || '10:00',
      coreTimeEnd: rule.coreTimeEnd || '15:00',
      flexTimeStart: rule.flexTimeStart || '07:00',
      flexTimeEnd: rule.flexTimeEnd || '22:00',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('就業ルール名を入力してください');
      return;
    }

    const newRule: WorkRule & { id: string; assignedCount: number } = {
      id: editingRule?.id || `rule-${Date.now()}`,
      type: formData.type,
      name: formData.name,
      standardWorkHours: formData.standardWorkHours,
      breakMinutes: formData.breakMinutes,
      workStartTime: formData.type === 'standard' || formData.type === 'shift' ? formData.workStartTime : undefined,
      workEndTime: formData.type === 'standard' || formData.type === 'shift' ? formData.workEndTime : undefined,
      coreTimeStart: formData.type === 'flextime' ? formData.coreTimeStart : undefined,
      coreTimeEnd: formData.type === 'flextime' ? formData.coreTimeEnd : undefined,
      flexTimeStart: formData.type === 'flextime' ? formData.flexTimeStart : undefined,
      flexTimeEnd: formData.type === 'flextime' ? formData.flexTimeEnd : undefined,
      assignedCount: editingRule?.assignedCount || 0,
    };

    if (editingRule) {
      setWorkRules(workRules.map(r => r.id === editingRule.id ? newRule : r));
      toast.success('就業ルールを更新しました');
    } else {
      setWorkRules([...workRules, newRule]);
      toast.success('就業ルールを作成しました');
    }

    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setEditingRule(null);
  };

  const handleDelete = () => {
    if (!deletingRuleId) return;

    const rule = workRules.find(r => r.id === deletingRuleId);
    if (rule && rule.assignedCount > 0) {
      toast.error(`${rule.assignedCount}名の従業員に割り当てられているため削除できません`);
      setIsDeleteDialogOpen(false);
      setDeletingRuleId(null);
      return;
    }

    setWorkRules(workRules.filter(r => r.id !== deletingRuleId));
    toast.success('就業ルールを削除しました');
    setIsDeleteDialogOpen(false);
    setDeletingRuleId(null);
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
  };

  const selectedTypeConfig = workRuleTypes.find(t => t.value === formData.type);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">就業ルールマスタ</CardTitle>
                <CardDescription>従業員に適用する勤務制度を管理します（MF互換）</CardDescription>
              </div>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              就業ルールが登録されていません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ルール名</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>所定労働時間</TableHead>
                  <TableHead>休憩時間</TableHead>
                  <TableHead>勤務時間/コアタイム</TableHead>
                  <TableHead className="text-center">適用人数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{workRuleTypeLabels[rule.type]}</Badge>
                    </TableCell>
                    <TableCell>{formatHours(rule.standardWorkHours)}</TableCell>
                    <TableCell>{rule.breakMinutes}分</TableCell>
                    <TableCell>
                      {rule.type === 'flextime' && rule.coreTimeStart && rule.coreTimeEnd ? (
                        <span className="text-sm">
                          コア: {rule.coreTimeStart} - {rule.coreTimeEnd}
                        </span>
                      ) : rule.workStartTime && rule.workEndTime ? (
                        <span className="text-sm">
                          {rule.workStartTime} - {rule.workEndTime}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{rule.assignedCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingRuleId(rule.id);
                            setIsDeleteDialogOpen(true);
                          }}
                          disabled={rule.assignedCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* 種別説明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">勤務制度の種別</CardTitle>
          <CardDescription>Money Forward給与と同等の7種類の勤務制度に対応</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workRuleTypes.map((type) => (
              <div key={type.value} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{type.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 作成・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? '就業ルールを編集' : '就業ルールを作成'}
            </DialogTitle>
            <DialogDescription>
              {selectedTypeConfig?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">種別 *</Label>
              <div className="col-span-3">
                <Select
                  value={formData.type}
                  onValueChange={(value: WorkRuleType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workRuleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">ルール名 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="基本勤務（9:00-18:00）"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">所定労働時間</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  type="number"
                  value={Math.floor(formData.standardWorkHours / 60)}
                  onChange={(e) => setFormData({
                    ...formData,
                    standardWorkHours: parseInt(e.target.value) * 60 + (formData.standardWorkHours % 60)
                  })}
                  className="w-20"
                />
                <span>時間</span>
                <Input
                  type="number"
                  value={formData.standardWorkHours % 60}
                  onChange={(e) => setFormData({
                    ...formData,
                    standardWorkHours: Math.floor(formData.standardWorkHours / 60) * 60 + parseInt(e.target.value)
                  })}
                  className="w-20"
                />
                <span>分</span>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">休憩時間</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.breakMinutes}
                  onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) })}
                  className="w-20"
                />
                <span>分</span>
              </div>
            </div>

            {/* 基本勤務・シフト制の場合 */}
            {(formData.type === 'standard' || formData.type === 'shift') && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">始業時刻</Label>
                  <Input
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">終業時刻</Label>
                  <Input
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </>
            )}

            {/* フレックスタイム制の場合 */}
            {formData.type === 'flextime' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">コアタイム開始</Label>
                  <Input
                    type="time"
                    value={formData.coreTimeStart}
                    onChange={(e) => setFormData({ ...formData, coreTimeStart: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">コアタイム終了</Label>
                  <Input
                    type="time"
                    value={formData.coreTimeEnd}
                    onChange={(e) => setFormData({ ...formData, coreTimeEnd: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">フレキシブル開始</Label>
                  <Input
                    type="time"
                    value={formData.flexTimeStart}
                    onChange={(e) => setFormData({ ...formData, flexTimeStart: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">フレキシブル終了</Label>
                  <Input
                    type="time"
                    value={formData.flexTimeEnd}
                    onChange={(e) => setFormData({ ...formData, flexTimeEnd: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              {editingRule ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>就業ルールを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。削除する前に、このルールが従業員に割り当てられていないことを確認してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
