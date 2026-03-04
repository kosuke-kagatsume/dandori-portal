'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit, ArrowRightLeft, PauseCircle, Briefcase, CalendarOff, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';
import type { User, TransferHistory } from '@/types';

// 就業ルールタイプ（MFと同等）
export type WorkRuleType =
  | 'standard'        // 基本勤務制
  | 'shift'           // シフト制
  | 'manager'         // 管理監督者
  | 'discretionary'   // 裁量労働制
  | 'flextime'        // フレックスタイム制
  | 'monthly_variable' // 1ヶ月単位変形労働制
  | 'yearly_variable'; // 1年単位変形労働制

export interface WorkRule {
  type: WorkRuleType;
  name: string;
  standardWorkHours: number;      // 所定労働時間（分）
  breakMinutes: number;           // 休憩時間（分）
  // フレックス用
  coreTimeStart?: string;         // コアタイム開始
  coreTimeEnd?: string;           // コアタイム終了
  flexTimeStart?: string;         // フレキシブルタイム開始
  flexTimeEnd?: string;           // フレキシブルタイム終了
  // 通常勤務用
  workStartTime?: string;         // 始業時刻
  workEndTime?: string;           // 終業時刻
}

interface UserAttendanceTabProps {
  user: User;
  transferHistory?: TransferHistory[];
  workRule?: WorkRule;
  isReadOnly: boolean;
  onEdit?: () => void;
}

const punchMethodLabels: Record<string, string> = {
  web: 'Web打刻',
  ic_card: 'ICカード',
  mobile: 'モバイル',
  face: '顔認証',
};

const workRuleTypeLabels: Record<WorkRuleType, string> = {
  standard: '基本勤務制',
  shift: 'シフト制',
  manager: '管理監督者',
  discretionary: '裁量労働制',
  flextime: 'フレックスタイム制',
  monthly_variable: '1ヶ月単位変形労働制',
  yearly_variable: '1年単位変形労働制',
};

const leaveTypeOptions = [
  { value: 'sick_leave', label: '傷病休職' },
  { value: 'maternity_leave', label: '産前産後休業' },
  { value: 'childcare_leave', label: '育児休業' },
  { value: 'family_care_leave', label: '介護休業' },
  { value: 'personal_leave', label: '自己都合休職' },
  { value: 'other', label: 'その他' },
];

const payCalcMethodOptions = [
  { value: 'no_pay', label: '無給' },
  { value: 'partial_pay', label: '一部支給' },
  { value: 'full_pay', label: '全額支給' },
  { value: 'insurance', label: '傷病手当金/育休手当' },
];

export function UserAttendanceTab({
  user,
  transferHistory = [],
  workRule,
  isReadOnly,
  onEdit,
}: UserAttendanceTabProps) {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;

  // 就業ルール選択ダイアログ
  const [workRuleDialogOpen, setWorkRuleDialogOpen] = useState(false);
  const [availableWorkRules, setAvailableWorkRules] = useState<{ id: string; name: string; type: string }[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // 休職履歴
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<{ id: string; startDate: string; endDate?: string | null; leaveType: string; payCalcMethod?: string | null; notes?: string | null }[]>([]);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: '',
    payCalcMethod: '',
    notes: '',
  });

  // 就業ルール一覧取得
  const fetchWorkRules = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/attendance-master/work-rules?tenantId=${tenantId}&activeOnly=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setAvailableWorkRules(data.data);
        }
      }
    } catch {
      // fallback
    }
  }, [tenantId]);

  // 休職履歴取得
  const fetchLeaveHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/leave-of-absence`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setLeaveHistory(data.data);
        }
      }
    } catch {
      // fallback
    }
  }, [user.id]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  useEffect(() => {
    if (workRuleDialogOpen) {
      fetchWorkRules();
    }
  }, [workRuleDialogOpen, fetchWorkRules]);

  const handleWorkRuleSelect = async () => {
    if (!selectedRuleId) {
      toast.error('就業ルールを選択してください');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workRuleId: selectedRuleId }),
      });
      if (!res.ok) throw new Error('更新に失敗しました');
      const selected = availableWorkRules.find(r => r.id === selectedRuleId);
      toast.success(`就業ルール「${selected?.name}」を適用しました`);
      setWorkRuleDialogOpen(false);
      setSelectedRuleId('');
      window.location.reload();
    } catch {
      toast.error('就業ルールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLeaveHistory = async () => {
    if (!leaveForm.startDate || !leaveForm.leaveType) {
      toast.error('休職開始日と休職種別は必須です');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/leave-of-absence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      });
      if (!res.ok) throw new Error('追加に失敗しました');
      toast.success('休職履歴を追加しました');
      setLeaveDialogOpen(false);
      setLeaveForm({ startDate: '', endDate: '', leaveType: '', payCalcMethod: '', notes: '' });
      await fetchLeaveHistory();
    } catch {
      toast.error('休職履歴の追加に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 勤怠設定情報カード */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">勤怠設定</CardTitle>
              <CardDescription>有給起算日・打刻方法・退職日</CardDescription>
            </div>
            {!isReadOnly && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">有給起算日</p>
              <p className="text-sm mt-1">
                {user.paidLeaveStartDate
                  ? new Date(user.paidLeaveStartDate).toLocaleDateString('ja-JP')
                  : user.hireDate
                    ? new Date(user.hireDate).toLocaleDateString('ja-JP')
                    : '未設定'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">打刻方法</p>
              <p className="text-sm mt-1">
                {user.punchMethod ? punchMethodLabels[user.punchMethod] || user.punchMethod : 'Web打刻'}
              </p>
            </div>
            {user.status === 'retired' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CalendarOff className="h-3 w-3" />
                  退職日
                </p>
                <p className="text-sm mt-1 text-destructive font-medium">
                  {user.retiredDate
                    ? new Date(user.retiredDate).toLocaleDateString('ja-JP')
                    : '未設定'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 就業ルールカード */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <div>
                <CardTitle className="text-base">就業ルール</CardTitle>
                <CardDescription>適用されている勤務制度</CardDescription>
              </div>
            </div>
            {!isReadOnly && (
              <Button variant="outline" size="sm" onClick={() => setWorkRuleDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                変更
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {workRule ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-sm">
                  {workRuleTypeLabels[workRule.type]}
                </Badge>
                <span className="text-sm font-medium">{workRule.name}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">所定労働時間</p>
                  <p className="font-medium">
                    {Math.floor(workRule.standardWorkHours / 60)}時間{workRule.standardWorkHours % 60}分
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">休憩時間</p>
                  <p className="font-medium">{workRule.breakMinutes}分</p>
                </div>
                {workRule.type === 'flextime' && workRule.coreTimeStart && workRule.coreTimeEnd && (
                  <>
                    <div>
                      <p className="text-muted-foreground">コアタイム</p>
                      <p className="font-medium">{workRule.coreTimeStart} - {workRule.coreTimeEnd}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">フレキシブルタイム</p>
                      <p className="font-medium">{workRule.flexTimeStart} - {workRule.flexTimeEnd}</p>
                    </div>
                  </>
                )}
                {(workRule.type === 'standard' || workRule.type === 'shift') && workRule.workStartTime && workRule.workEndTime && (
                  <div>
                    <p className="text-muted-foreground">勤務時間</p>
                    <p className="font-medium">{workRule.workStartTime} - {workRule.workEndTime}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              就業ルールが設定されていません
            </p>
          )}
        </CardContent>
      </Card>

      {/* 異動履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            <CardTitle className="text-base">異動履歴</CardTitle>
          </div>
          <CardDescription>予約管理 &gt; 異動で登録した履歴が反映されます</CardDescription>
        </CardHeader>
        <CardContent>
          {transferHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">異動履歴はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>発令日</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>異動前</TableHead>
                  <TableHead>異動後</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transferHistory.map((transfer) => {
                  const typeLabels: Record<string, string> = {
                    transfer: '異動',
                    promotion: '昇格',
                    demotion: '降格',
                    role_change: '役割変更',
                  };
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">
                        {new Date(transfer.effectiveDate).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[transfer.type] || transfer.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{transfer.fromUnitName}</div>
                          <div className="text-muted-foreground">{transfer.fromPosition}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{transfer.toUnitName}</div>
                          <div className="text-muted-foreground">{transfer.toPosition}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {transfer.reason || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 休職履歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PauseCircle className="h-4 w-4" />
              <CardTitle className="text-base">休職履歴</CardTitle>
            </div>
            {!isReadOnly && (
              <Button variant="outline" size="sm" onClick={() => setLeaveDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                追加
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {leaveHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">休職履歴はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>開始日</TableHead>
                  <TableHead>終了日</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>備考</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.startDate).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      {record.endDate
                        ? new Date(record.endDate).toLocaleDateString('ja-JP')
                        : <Badge variant="destructive">休職中</Badge>}
                    </TableCell>
                    <TableCell>
                      {leaveTypeOptions.find(o => o.value === record.leaveType)?.label || record.leaveType}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 就業ルール選択ダイアログ */}
      <Dialog open={workRuleDialogOpen} onOpenChange={setWorkRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>就業ルールの変更</DialogTitle>
            <DialogDescription>設定 &gt; 勤怠マスタ &gt; 就業ルールから選択してください</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
              <SelectTrigger>
                <SelectValue placeholder="就業ルールを選択" />
              </SelectTrigger>
              <SelectContent>
                {availableWorkRules.map(rule => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkRuleDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleWorkRuleSelect} disabled={isSaving}>
              {isSaving ? '適用中...' : '適用'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 休職履歴追加ダイアログ */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>休職履歴の追加</DialogTitle>
            <DialogDescription>休職情報を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>休職開始日 *</Label>
                <Input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>休職終了日</Label>
                <Input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>休職種別 *</Label>
                <Select value={leaveForm.leaveType} onValueChange={v => setLeaveForm(f => ({ ...f, leaveType: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="種別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>支給項目計算方法</Label>
                <Select value={leaveForm.payCalcMethod} onValueChange={v => setLeaveForm(f => ({ ...f, payCalcMethod: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="計算方法を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {payCalcMethodOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>メモ</Label>
              <Textarea
                value={leaveForm.notes}
                onChange={e => setLeaveForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="備考があれば入力"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAddLeaveHistory} disabled={isSaving}>
              {isSaving ? '追加中...' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
