'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// ── 定数定義 ──────────────────────────────────────────

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

const weekdays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'] as const;

const attendanceCategories = ['出勤', '法定休日', '所定休日'] as const;

const weekdayOptions = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'] as const;

// ── 型定義 ──────────────────────────────────────────

interface WorkPatternFormData {
  id: string;
  name: string;
  punchDeemedType: string;
  contractStartTime: string;
  contractEndTime: string;
  autoBreak: boolean;
  amLeaveContractStart: string;
  amLeaveDeemedTime: string;
  pmLeaveContractEnd: string;
  pmLeaveDeemedTime: string;
}

interface ScheduleRow {
  weekday: string;
  category: string;
  patternId: string;
}

interface WorkRuleFormData {
  // A1: ルール名 + 種別
  type: WorkRuleType;
  name: string;
  // A2: 締め日/起算日
  dateChangeHour: string;
  dateChangeMinute: string;
  closingDay: string;
  weekStartDay: string;
  yearStartMonth: string;
  yearStartDay: string;
  overtimeLimitYearStartMonth: string;
  overtimeLimitYearStartDay: string;
  // A7: 勤務日の判定方法
  workDayJudgment: string;
  // A8: 勤務パターン
  workPatterns: WorkPatternFormData[];
  // A9: 勤務スケジュール
  scheduleRows: ScheduleRow[];
  // A10: 休憩打刻
  breakPunch: string;
  // A11-15: 休暇・休日
  paidLeaveAutoGrant: boolean;
  paidLeavePattern: string;
  weeklyContractDays: string;
  paidLeaveHourlyUnit: boolean;
  leaveNursingCare: boolean;
  leaveChildCare: boolean;
  leaveYearEnd: boolean;
  leaveCongratulatory: boolean;
  holidayPattern: string;
  substituteHolidayPattern: string;
  compensatoryDayOffPattern: string;
  compensatoryDayOffAutoGrant: string;
  // A16: 36協定
  agreement36Name: string;
  // A17: 未申請打刻の取り扱い
  unapprovedEarlyWork: string;
  unapprovedLateArrival: string;
  unapprovedEarlyLeave: string;
  unapprovedOvertime: string;
  // 勤務時間（共通）
  standardWorkHours: number;
  breakMinutes: number;
  workStartTime: string;
  workEndTime: string;
  // B: 基本勤務制 / シフト制
  lateEarlyTally: string;
  scheduledTallyRange: string;
  legalHolidayDesignation: string;
  // B: 管理監督者
  managerDayOffDeemedHour: string;
  managerDayOffDeemedMinute: string;
  // B: 裁量労働制
  discretionaryScope: string;
  discretionaryPrescribedHour: string;
  discretionaryPrescribedMinute: string;
  discretionaryDeemedHour: string;
  discretionaryDeemedMinute: string;
  discretionaryDayOffDeemedHour: string;
  discretionaryDayOffDeemedMinute: string;
  // B: フレックスタイム制
  flexSettlementPeriod: string;
  flexTotalWorkCalc: string;
  flexLegalFrameCalc: string;
  flexDeficiencyHandling: string;
  flexScope: string;
  flexStandardWorkTime: string;
  flexDayOffDeemedTime: string;
  coreTimeStart: string;
  coreTimeEnd: string;
  flexTimeStart: string;
  flexTimeEnd: string;
  // B: 1ヶ月単位変形
  monthlyStartDay: string;
  monthlyFractionWeekHandling: string;
  monthlyScope: string;
  // B: 1年単位変形
  yearlyStartMonth: string;
  yearlyStartDay: string;
  yearlyFractionWeekHandling: string;
  yearlyScope: string;
}

const defaultWorkPattern: WorkPatternFormData = {
  id: '',
  name: '',
  punchDeemedType: 'none',
  contractStartTime: '09:00',
  contractEndTime: '18:00',
  autoBreak: false,
  amLeaveContractStart: '09:00',
  amLeaveDeemedTime: '04:00',
  pmLeaveContractEnd: '18:00',
  pmLeaveDeemedTime: '04:00',
};

const defaultScheduleRows: ScheduleRow[] = weekdays.map((day) => ({
  weekday: day,
  category: day === '土曜日' || day === '日曜日' ? '所定休日' : '出勤',
  patternId: '',
}));

const defaultFormData: WorkRuleFormData = {
  type: 'standard',
  name: '',
  dateChangeHour: '0',
  dateChangeMinute: '0',
  closingDay: 'month_end',
  weekStartDay: '日曜日',
  yearStartMonth: '4',
  yearStartDay: '1',
  overtimeLimitYearStartMonth: '4',
  overtimeLimitYearStartDay: '1',
  workDayJudgment: 'company',
  workPatterns: [],
  scheduleRows: defaultScheduleRows,
  breakPunch: 'accept',
  paidLeaveAutoGrant: false,
  paidLeavePattern: '',
  weeklyContractDays: '5',
  paidLeaveHourlyUnit: false,
  leaveNursingCare: false,
  leaveChildCare: false,
  leaveYearEnd: false,
  leaveCongratulatory: false,
  holidayPattern: '',
  substituteHolidayPattern: '',
  compensatoryDayOffPattern: '',
  compensatoryDayOffAutoGrant: 'none',
  agreement36Name: '',
  unapprovedEarlyWork: 'discard',
  unapprovedLateArrival: 'discard',
  unapprovedEarlyLeave: 'discard',
  unapprovedOvertime: 'discard',
  standardWorkHours: 480,
  breakMinutes: 60,
  workStartTime: '09:00',
  workEndTime: '18:00',
  lateEarlyTally: 'count',
  scheduledTallyRange: 'within_scheduled',
  legalHolidayDesignation: 'auto',
  managerDayOffDeemedHour: '8',
  managerDayOffDeemedMinute: '0',
  discretionaryScope: 'all',
  discretionaryPrescribedHour: '8',
  discretionaryPrescribedMinute: '0',
  discretionaryDeemedHour: '8',
  discretionaryDeemedMinute: '0',
  discretionaryDayOffDeemedHour: '8',
  discretionaryDayOffDeemedMinute: '0',
  flexSettlementPeriod: '1month',
  flexTotalWorkCalc: 'calendar',
  flexLegalFrameCalc: 'auto',
  flexDeficiencyHandling: 'carry_forward',
  flexScope: 'all',
  flexStandardWorkTime: '08:00',
  flexDayOffDeemedTime: '08:00',
  coreTimeStart: '10:00',
  coreTimeEnd: '15:00',
  flexTimeStart: '07:00',
  flexTimeEnd: '22:00',
  monthlyStartDay: '1',
  monthlyFractionWeekHandling: 'proportional',
  monthlyScope: 'all',
  yearlyStartMonth: '4',
  yearlyStartDay: '1',
  yearlyFractionWeekHandling: 'proportional',
  yearlyScope: 'all',
};

// ── デモデータ ──────────────────────────────────────

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

// ── セクション表示ヘルパー ────────────────────────────

function showSection(type: WorkRuleType, section: string): boolean {
  const matrix: Record<string, WorkRuleType[]> = {
    closingDate: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    workDayJudgment: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    discretionaryScope: ['discretionary'],
    flexSettlement: ['flextime'],
    flexScope: ['flextime'],
    variablePeriod: ['monthly_variable', 'yearly_variable'],
    variableScope: ['monthly_variable', 'yearly_variable'],
    workTime: ['standard', 'shift', 'manager', 'monthly_variable', 'yearly_variable'],
    workPattern: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    lateEarlyTally: ['standard', 'shift', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    scheduledTallyRange: ['standard', 'shift', 'monthly_variable', 'yearly_variable'],
    legalHolidayDesignation: ['standard', 'shift', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    schedule: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    breakPunch: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    leave: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    agreement36: ['standard', 'shift', 'manager', 'discretionary', 'flextime', 'monthly_variable', 'yearly_variable'],
    unapprovedPunch: ['standard', 'shift', 'monthly_variable', 'yearly_variable'],
  };
  return matrix[section]?.includes(type) ?? false;
}

// ── 勤務パターンダイアログ ──────────────────────────────

function WorkPatternDialog({
  open,
  onOpenChange,
  pattern,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: WorkPatternFormData | null;
  onSave: (data: WorkPatternFormData) => void;
}) {
  const [form, setForm] = useState<WorkPatternFormData>(
    pattern ?? { ...defaultWorkPattern, id: `wp-${Date.now()}` }
  );

  useEffect(() => {
    if (open) {
      setForm(pattern ?? { ...defaultWorkPattern, id: `wp-${Date.now()}` });
    }
  }, [open, pattern]);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('勤務パターン名を入力してください');
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{pattern ? '勤務パターンを編集' : '勤務パターンを追加'}</DialogTitle>
          <DialogDescription>勤務時間や休憩の設定を定義します</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* パターン名 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm">パターン名 *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="通常勤務"
              className="col-span-3"
            />
          </div>
          {/* 打刻みなし時間の種類 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm">打刻みなし</Label>
            <div className="col-span-3">
              <Select value={form.punchDeemedType} onValueChange={(v) => setForm({ ...form, punchDeemedType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  <SelectItem value="clock_in_only">出勤のみ</SelectItem>
                  <SelectItem value="clock_out_only">退勤のみ</SelectItem>
                  <SelectItem value="both">出退勤</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* 契約時間 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm">契約時間</Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input type="time" value={form.contractStartTime} onChange={(e) => setForm({ ...form, contractStartTime: e.target.value })} className="w-32" />
              <span>〜</span>
              <Input type="time" value={form.contractEndTime} onChange={(e) => setForm({ ...form, contractEndTime: e.target.value })} className="w-32" />
            </div>
          </div>
          {/* 休憩時間自動適用 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm">休憩自動適用</Label>
            <div className="col-span-3 flex items-center gap-2">
              <Checkbox checked={form.autoBreak} onCheckedChange={(v) => setForm({ ...form, autoBreak: v === true })} />
              <span className="text-sm">休憩時間を自動適用する</span>
            </div>
          </div>
          <Separator />
          {/* 午前休 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm">午前休</Label>
            <div className="col-span-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">契約開始</span>
              <Input type="time" value={form.amLeaveContractStart} onChange={(e) => setForm({ ...form, amLeaveContractStart: e.target.value })} className="w-32" />
              <span className="text-sm text-muted-foreground">みなし</span>
              <Input type="time" value={form.amLeaveDeemedTime} onChange={(e) => setForm({ ...form, amLeaveDeemedTime: e.target.value })} className="w-32" />
            </div>
          </div>
          {/* 午後休 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-sm">午後休</Label>
            <div className="col-span-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">契約終了</span>
              <Input type="time" value={form.pmLeaveContractEnd} onChange={(e) => setForm({ ...form, pmLeaveContractEnd: e.target.value })} className="w-32" />
              <span className="text-sm text-muted-foreground">みなし</span>
              <Input type="time" value={form.pmLeaveDeemedTime} onChange={(e) => setForm({ ...form, pmLeaveDeemedTime: e.target.value })} className="w-32" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={handleSave}>{pattern ? '更新' : '追加'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── セクションヘッダー ──────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <Separator className="mt-1 mb-3" />
    </div>
  );
}

// ── フォームフィールドユーティリティ ────────────────────────

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="grid grid-cols-5 items-start gap-3">
      <Label className="text-right text-sm pt-2 col-span-2">
        {label}{required && ' *'}
      </Label>
      <div className="col-span-3">{children}</div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────

export function WorkRuleMasterPanel() {
  const [workRules, setWorkRules] = useState(demoWorkRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<(typeof demoWorkRules)[0] | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkRuleFormData>(defaultFormData);

  // 勤務パターンダイアログ
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<WorkPatternFormData | null>(null);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({ ...defaultFormData, scheduleRows: defaultScheduleRows.map(r => ({ ...r })) });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (rule: (typeof demoWorkRules)[0]) => {
    setEditingRule(rule);
    setFormData({
      ...defaultFormData,
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
      scheduleRows: defaultScheduleRows.map(r => ({ ...r })),
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('就業ルール名を入力してください');
      return;
    }

    const t = formData.type;
    const newRule: WorkRule & { id: string; assignedCount: number } = {
      id: editingRule?.id || `rule-${Date.now()}`,
      type: t,
      name: formData.name,
      standardWorkHours: formData.standardWorkHours,
      breakMinutes: formData.breakMinutes,
      workStartTime: (t === 'standard' || t === 'shift' || t === 'monthly_variable' || t === 'yearly_variable') ? formData.workStartTime : undefined,
      workEndTime: (t === 'standard' || t === 'shift' || t === 'monthly_variable' || t === 'yearly_variable') ? formData.workEndTime : undefined,
      coreTimeStart: t === 'flextime' ? formData.coreTimeStart : undefined,
      coreTimeEnd: t === 'flextime' ? formData.coreTimeEnd : undefined,
      flexTimeStart: t === 'flextime' ? formData.flexTimeStart : undefined,
      flexTimeEnd: t === 'flextime' ? formData.flexTimeEnd : undefined,
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

  const updateForm = (partial: Partial<WorkRuleFormData>) => {
    setFormData(prev => ({ ...prev, ...partial }));
  };

  const updateScheduleRow = (index: number, field: keyof ScheduleRow, value: string) => {
    setFormData(prev => {
      const rows = [...prev.scheduleRows];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, scheduleRows: rows };
    });
  };

  const handlePatternSave = (data: WorkPatternFormData) => {
    setFormData(prev => {
      const exists = prev.workPatterns.findIndex(p => p.id === data.id);
      if (exists >= 0) {
        const patterns = [...prev.workPatterns];
        patterns[exists] = data;
        return { ...prev, workPatterns: patterns };
      }
      return { ...prev, workPatterns: [...prev.workPatterns, data] };
    });
  };

  const handlePatternDelete = (id: string) => {
    setFormData(prev => ({
      ...prev,
      workPatterns: prev.workPatterns.filter(p => p.id !== id),
    }));
  };

  const selectedTypeConfig = workRuleTypes.find(t => t.value === formData.type);
  const t = formData.type;

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

      {/* ── 作成・編集ダイアログ（全セクション） ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              {editingRule ? '就業ルールを編集' : '就業ルールを作成'}
            </DialogTitle>
            <DialogDescription>
              {selectedTypeConfig?.description}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="grid gap-4 py-4 pr-4">

              {/* ━━━ A1: ルール名 + 種別 ━━━ */}
              <SectionHeader title="就業ルール名" />
              <FormField label="種別" required>
                <Select
                  value={formData.type}
                  onValueChange={(value: WorkRuleType) => updateForm({ type: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {workRuleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="ルール名" required>
                <Input
                  value={formData.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="基本勤務（9:00-18:00）"
                />
              </FormField>

              {/* ━━━ A2: 締め日/起算日 ━━━ */}
              {showSection(t, 'closingDate') && (
                <>
                  <SectionHeader title="締め日/起算日" />
                  <FormField label="日付変更時間">
                    <div className="flex items-center gap-2">
                      <Input type="number" min="0" max="23" value={formData.dateChangeHour} onChange={(e) => updateForm({ dateChangeHour: e.target.value })} className="w-20" />
                      <span className="text-sm">時</span>
                      <Input type="number" min="0" max="59" value={formData.dateChangeMinute} onChange={(e) => updateForm({ dateChangeMinute: e.target.value })} className="w-20" />
                      <span className="text-sm">分</span>
                    </div>
                  </FormField>
                  <FormField label="勤怠締め日">
                    <Select value={formData.closingDay} onValueChange={(v) => updateForm({ closingDay: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month_end">月末</SelectItem>
                        {Array.from({ length: 28 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}日</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="一週間の起算曜日">
                    <Select value={formData.weekStartDay} onValueChange={(v) => updateForm({ weekStartDay: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {weekdayOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="一年の起算日">
                    <div className="flex items-center gap-2">
                      <Select value={formData.yearStartMonth} onValueChange={(v) => updateForm({ yearStartMonth: v })}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={formData.yearStartDay} onValueChange={(v) => updateForm({ yearStartDay: v })}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}日</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormField>
                  <FormField label="残業上限管理の起算日">
                    <div className="flex items-center gap-2">
                      <Select value={formData.overtimeLimitYearStartMonth} onValueChange={(v) => updateForm({ overtimeLimitYearStartMonth: v })}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={formData.overtimeLimitYearStartDay} onValueChange={(v) => updateForm({ overtimeLimitYearStartDay: v })}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}日</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormField>
                </>
              )}

              {/* ━━━ A7: 勤務日の判定方法 ━━━ */}
              {showSection(t, 'workDayJudgment') && (
                <>
                  <SectionHeader title="勤務日の判定方法" />
                  <FormField label="判定方法">
                    <RadioGroup value={formData.workDayJudgment} onValueChange={(v) => updateForm({ workDayJudgment: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="wdj-company" />
                        <Label htmlFor="wdj-company" className="text-sm">事業者情報に基づく</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual_48h" id="wdj-48h" />
                        <Label htmlFor="wdj-48h" className="text-sm">個別設定（48時間以内）</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual_date_change" id="wdj-dc" />
                        <Label htmlFor="wdj-dc" className="text-sm">個別設定（日付変更時間）</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                </>
              )}

              {/* ━━━ B: 裁量労働制の適用範囲・勤務時間 ━━━ */}
              {showSection(t, 'discretionaryScope') && (
                <>
                  <SectionHeader title="裁量労働制" />
                  <FormField label="適用範囲">
                    <Select value={formData.discretionaryScope} onValueChange={(v) => updateForm({ discretionaryScope: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全日</SelectItem>
                        <SelectItem value="workday_only">所定労働日のみ</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="所定労働時間">
                    <div className="flex items-center gap-2">
                      <Input type="number" min="0" max="23" value={formData.discretionaryPrescribedHour} onChange={(e) => updateForm({ discretionaryPrescribedHour: e.target.value })} className="w-20" />
                      <span className="text-sm">時間</span>
                      <Input type="number" min="0" max="59" value={formData.discretionaryPrescribedMinute} onChange={(e) => updateForm({ discretionaryPrescribedMinute: e.target.value })} className="w-20" />
                      <span className="text-sm">分</span>
                    </div>
                  </FormField>
                  <FormField label="みなし労働時間">
                    <div className="flex items-center gap-2">
                      <Input type="number" min="0" max="23" value={formData.discretionaryDeemedHour} onChange={(e) => updateForm({ discretionaryDeemedHour: e.target.value })} className="w-20" />
                      <span className="text-sm">時間</span>
                      <Input type="number" min="0" max="59" value={formData.discretionaryDeemedMinute} onChange={(e) => updateForm({ discretionaryDeemedMinute: e.target.value })} className="w-20" />
                      <span className="text-sm">分</span>
                    </div>
                  </FormField>
                  <FormField label="1日休暇みなし労働時間">
                    <div className="flex items-center gap-2">
                      <Input type="number" min="0" max="23" value={formData.discretionaryDayOffDeemedHour} onChange={(e) => updateForm({ discretionaryDayOffDeemedHour: e.target.value })} className="w-20" />
                      <span className="text-sm">時間</span>
                      <Input type="number" min="0" max="59" value={formData.discretionaryDayOffDeemedMinute} onChange={(e) => updateForm({ discretionaryDayOffDeemedMinute: e.target.value })} className="w-20" />
                      <span className="text-sm">分</span>
                    </div>
                  </FormField>
                </>
              )}

              {/* ━━━ B: フレックスタイム制 ━━━ */}
              {showSection(t, 'flexSettlement') && (
                <>
                  <SectionHeader title="フレックスタイム制" />
                  <FormField label="清算期間">
                    <Select value={formData.flexSettlementPeriod} onValueChange={(v) => updateForm({ flexSettlementPeriod: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1month">1ヶ月</SelectItem>
                        <SelectItem value="2month">2ヶ月</SelectItem>
                        <SelectItem value="3month">3ヶ月</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="総労働時間計算方法">
                    <RadioGroup value={formData.flexTotalWorkCalc} onValueChange={(v) => updateForm({ flexTotalWorkCalc: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="calendar" id="ftw-cal" />
                        <Label htmlFor="ftw-cal" className="text-sm">暦日数から計算</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="ftw-man" />
                        <Label htmlFor="ftw-man" className="text-sm">手動設定</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                  <FormField label="法定総枠計算方法">
                    <Select value={formData.flexLegalFrameCalc} onValueChange={(v) => updateForm({ flexLegalFrameCalc: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">自動計算</SelectItem>
                        <SelectItem value="manual">手動設定</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="不足時間取扱">
                    <Select value={formData.flexDeficiencyHandling} onValueChange={(v) => updateForm({ flexDeficiencyHandling: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carry_forward">翌月繰越</SelectItem>
                        <SelectItem value="deduct">控除</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </>
              )}

              {showSection(t, 'flexScope') && (
                <>
                  <FormField label="適用範囲">
                    <Select value={formData.flexScope} onValueChange={(v) => updateForm({ flexScope: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全日</SelectItem>
                        <SelectItem value="workday_only">所定労働日のみ</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="1日標準労働時間">
                    <Input type="time" value={formData.flexStandardWorkTime} onChange={(e) => updateForm({ flexStandardWorkTime: e.target.value })} className="w-32" />
                  </FormField>
                  <FormField label="1日休暇みなし労働時間">
                    <Input type="time" value={formData.flexDayOffDeemedTime} onChange={(e) => updateForm({ flexDayOffDeemedTime: e.target.value })} className="w-32" />
                  </FormField>
                  <FormField label="コアタイム">
                    <div className="flex items-center gap-2">
                      <Input type="time" value={formData.coreTimeStart} onChange={(e) => updateForm({ coreTimeStart: e.target.value })} className="w-32" />
                      <span>〜</span>
                      <Input type="time" value={formData.coreTimeEnd} onChange={(e) => updateForm({ coreTimeEnd: e.target.value })} className="w-32" />
                    </div>
                  </FormField>
                  <FormField label="フレキシブルタイム">
                    <div className="flex items-center gap-2">
                      <Input type="time" value={formData.flexTimeStart} onChange={(e) => updateForm({ flexTimeStart: e.target.value })} className="w-32" />
                      <span>〜</span>
                      <Input type="time" value={formData.flexTimeEnd} onChange={(e) => updateForm({ flexTimeEnd: e.target.value })} className="w-32" />
                    </div>
                  </FormField>
                </>
              )}

              {/* ━━━ B: 変形労働制（1ヶ月/1年共通） ━━━ */}
              {showSection(t, 'variablePeriod') && (
                <>
                  <SectionHeader title="変形労働制" />
                  {t === 'monthly_variable' && (
                    <FormField label="毎月起算日">
                      <Select value={formData.monthlyStartDay} onValueChange={(v) => updateForm({ monthlyStartDay: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}日</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}
                  {t === 'yearly_variable' && (
                    <FormField label="毎年起算日">
                      <div className="flex items-center gap-2">
                        <Select value={formData.yearlyStartMonth} onValueChange={(v) => updateForm({ yearlyStartMonth: v })}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}月</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={formData.yearlyStartDay} onValueChange={(v) => updateForm({ yearlyStartDay: v })}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}日</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormField>
                  )}
                  <FormField label="端数週の取扱">
                    <Select
                      value={t === 'monthly_variable' ? formData.monthlyFractionWeekHandling : formData.yearlyFractionWeekHandling}
                      onValueChange={(v) => updateForm(t === 'monthly_variable' ? { monthlyFractionWeekHandling: v } : { yearlyFractionWeekHandling: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proportional">按分</SelectItem>
                        <SelectItem value="round_up">切り上げ</SelectItem>
                        <SelectItem value="round_down">切り捨て</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </>
              )}

              {showSection(t, 'variableScope') && (
                <FormField label="適用範囲">
                  <Select
                    value={t === 'monthly_variable' ? formData.monthlyScope : formData.yearlyScope}
                    onValueChange={(v) => updateForm(t === 'monthly_variable' ? { monthlyScope: v } : { yearlyScope: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全日</SelectItem>
                      <SelectItem value="workday_only">所定労働日のみ</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}

              {/* ━━━ 勤務時間 ━━━ */}
              {showSection(t, 'workTime') && (
                <>
                  <SectionHeader title="勤務時間" />
                  {/* 管理監督者: 1日休暇みなし労働時間のみ */}
                  {t === 'manager' && (
                    <FormField label="1日休暇みなし労働時間">
                      <div className="flex items-center gap-2">
                        <Input type="number" min="0" max="23" value={formData.managerDayOffDeemedHour} onChange={(e) => updateForm({ managerDayOffDeemedHour: e.target.value })} className="w-20" />
                        <span className="text-sm">時間</span>
                        <Input type="number" min="0" max="59" value={formData.managerDayOffDeemedMinute} onChange={(e) => updateForm({ managerDayOffDeemedMinute: e.target.value })} className="w-20" />
                        <span className="text-sm">分</span>
                      </div>
                    </FormField>
                  )}
                  {/* 裁量・フレックスは制度別セクションで表示済み */}
                  {/* 基本/シフト/1ヶ月変形/1年変形: 所定労働時間+休憩+始業終業 */}
                  {(t === 'standard' || t === 'shift' || t === 'monthly_variable' || t === 'yearly_variable') && (
                    <>
                      <FormField label="所定労働時間">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={Math.floor(formData.standardWorkHours / 60)}
                            onChange={(e) => updateForm({ standardWorkHours: parseInt(e.target.value || '0') * 60 + (formData.standardWorkHours % 60) })}
                            className="w-20"
                          />
                          <span className="text-sm">時間</span>
                          <Input
                            type="number"
                            value={formData.standardWorkHours % 60}
                            onChange={(e) => updateForm({ standardWorkHours: Math.floor(formData.standardWorkHours / 60) * 60 + parseInt(e.target.value || '0') })}
                            className="w-20"
                          />
                          <span className="text-sm">分</span>
                        </div>
                      </FormField>
                      <FormField label="休憩時間">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={formData.breakMinutes}
                            onChange={(e) => updateForm({ breakMinutes: parseInt(e.target.value || '0') })}
                            className="w-20"
                          />
                          <span className="text-sm">分</span>
                        </div>
                      </FormField>
                      <FormField label="始業時刻">
                        <Input type="time" value={formData.workStartTime} onChange={(e) => updateForm({ workStartTime: e.target.value })} className="w-32" />
                      </FormField>
                      <FormField label="終業時刻">
                        <Input type="time" value={formData.workEndTime} onChange={(e) => updateForm({ workEndTime: e.target.value })} className="w-32" />
                      </FormField>
                    </>
                  )}
                </>
              )}

              {/* ━━━ 勤務パターン ━━━ */}
              {showSection(t, 'workPattern') && (
                <>
                  <SectionHeader title="勤務パターン" />
                  {formData.workPatterns.length > 0 && (
                    <div className="space-y-2">
                      {formData.workPatterns.map((wp) => (
                        <div key={wp.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div>
                            <span className="text-sm font-medium">{wp.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {wp.contractStartTime} - {wp.contractEndTime}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingPattern(wp); setIsPatternDialogOpen(true); }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePatternDelete(wp.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setEditingPattern(null); setIsPatternDialogOpen(true); }}>
                    <Plus className="mr-1 h-3 w-3" />
                    勤務パターンを追加
                  </Button>
                </>
              )}

              {/* ━━━ 遅刻・早退の集計 ━━━ */}
              {showSection(t, 'lateEarlyTally') && (
                <>
                  <SectionHeader title="遅刻・早退の集計" />
                  <FormField label="集計方法">
                    <RadioGroup value={formData.lateEarlyTally} onValueChange={(v) => updateForm({ lateEarlyTally: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="count" id="let-count" />
                        <Label htmlFor="let-count" className="text-sm">回数で集計</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="time" id="let-time" />
                        <Label htmlFor="let-time" className="text-sm">時間で集計</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="let-none" />
                        <Label htmlFor="let-none" className="text-sm">集計しない</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                </>
              )}

              {/* ━━━ 所定集計範囲 ━━━ */}
              {showSection(t, 'scheduledTallyRange') && (
                <>
                  <SectionHeader title="所定集計範囲" />
                  <FormField label="集計範囲">
                    <RadioGroup value={formData.scheduledTallyRange} onValueChange={(v) => updateForm({ scheduledTallyRange: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="within_scheduled" id="str-ws" />
                        <Label htmlFor="str-ws" className="text-sm">所定内のみ</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="include_overtime" id="str-io" />
                        <Label htmlFor="str-io" className="text-sm">残業含む</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                </>
              )}

              {/* ━━━ 法定休日指定方法 ━━━ */}
              {showSection(t, 'legalHolidayDesignation') && (
                <>
                  <SectionHeader title="法定休日指定方法" />
                  <FormField label="指定方法">
                    <RadioGroup value={formData.legalHolidayDesignation} onValueChange={(v) => updateForm({ legalHolidayDesignation: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="lhd-auto" />
                        <Label htmlFor="lhd-auto" className="text-sm">自動判定</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="schedule" id="lhd-sched" />
                        <Label htmlFor="lhd-sched" className="text-sm">スケジュールに基づく</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                </>
              )}

              {/* ━━━ A9: 勤務スケジュール ━━━ */}
              {showSection(t, 'schedule') && (
                <>
                  <SectionHeader title="勤務スケジュール" />
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">曜日</TableHead>
                          <TableHead>勤怠区分</TableHead>
                          <TableHead>勤務パターン</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.scheduleRows.map((row, i) => (
                          <TableRow key={row.weekday}>
                            <TableCell className="text-sm font-medium">{row.weekday}</TableCell>
                            <TableCell>
                              <Select value={row.category} onValueChange={(v) => updateScheduleRow(i, 'category', v)}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {attendanceCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select value={row.patternId} onValueChange={(v) => updateScheduleRow(i, 'patternId', v)}>
                                <SelectTrigger className="h-8"><SelectValue placeholder="なし" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">なし</SelectItem>
                                  {formData.workPatterns.map(wp => (
                                    <SelectItem key={wp.id} value={wp.id}>{wp.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* ━━━ A10: 休憩打刻 ━━━ */}
              {showSection(t, 'breakPunch') && (
                <>
                  <SectionHeader title="休憩打刻" />
                  <FormField label="休憩打刻">
                    <RadioGroup value={formData.breakPunch} onValueChange={(v) => updateForm({ breakPunch: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="accept" id="bp-accept" />
                        <Label htmlFor="bp-accept" className="text-sm">受け付ける</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reject" id="bp-reject" />
                        <Label htmlFor="bp-reject" className="text-sm">受け付けない</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                </>
              )}

              {/* ━━━ A11-15: 休暇・休日 ━━━ */}
              {showSection(t, 'leave') && (
                <>
                  <SectionHeader title="休暇・休日" />
                  <FormField label="有給休暇自動付与">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={formData.paidLeaveAutoGrant} onCheckedChange={(v) => updateForm({ paidLeaveAutoGrant: v === true })} />
                      <span className="text-sm">自動付与する</span>
                    </div>
                  </FormField>
                  <FormField label="有給パターン">
                    <Select value={formData.paidLeavePattern} onValueChange={(v) => updateForm({ paidLeavePattern: v })}>
                      <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">未設定</SelectItem>
                        <SelectItem value="standard">標準</SelectItem>
                        <SelectItem value="proportional">比例付与</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="週契約日数">
                    <Select value={formData.weeklyContractDays} onValueChange={(v) => updateForm({ weeklyContractDays: v })}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                          <SelectItem key={d} value={String(d)}>{d}日</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="時間単位有給">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={formData.paidLeaveHourlyUnit} onCheckedChange={(v) => updateForm({ paidLeaveHourlyUnit: v === true })} />
                      <span className="text-sm">時間単位で取得可能</span>
                    </div>
                  </FormField>
                  <Separator className="my-2" />
                  <FormField label="その他休日/休暇">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.leaveNursingCare} onCheckedChange={(v) => updateForm({ leaveNursingCare: v === true })} />
                        <span className="text-sm">介護休暇</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.leaveChildCare} onCheckedChange={(v) => updateForm({ leaveChildCare: v === true })} />
                        <span className="text-sm">看護休暇</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.leaveYearEnd} onCheckedChange={(v) => updateForm({ leaveYearEnd: v === true })} />
                        <span className="text-sm">年末年始</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.leaveCongratulatory} onCheckedChange={(v) => updateForm({ leaveCongratulatory: v === true })} />
                        <span className="text-sm">慶弔休暇</span>
                      </div>
                    </div>
                  </FormField>
                  <FormField label="祝日パターン">
                    <Select value={formData.holidayPattern} onValueChange={(v) => updateForm({ holidayPattern: v })}>
                      <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">未設定</SelectItem>
                        <SelectItem value="japan_standard">日本の祝日</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="振替休日パターン">
                    <Select value={formData.substituteHolidayPattern} onValueChange={(v) => updateForm({ substituteHolidayPattern: v })}>
                      <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">未設定</SelectItem>
                        <SelectItem value="auto">自動</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="代休パターン">
                    <Select value={formData.compensatoryDayOffPattern} onValueChange={(v) => updateForm({ compensatoryDayOffPattern: v })}>
                      <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">未設定</SelectItem>
                        <SelectItem value="standard">標準</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="代休自動付与">
                    <RadioGroup value={formData.compensatoryDayOffAutoGrant} onValueChange={(v) => updateForm({ compensatoryDayOffAutoGrant: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="cdag-none" />
                        <Label htmlFor="cdag-none" className="text-sm">なし</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="cdag-auto" />
                        <Label htmlFor="cdag-auto" className="text-sm">自動付与する</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                </>
              )}

              {/* ━━━ A16: 36協定 ━━━ */}
              {showSection(t, 'agreement36') && (
                <>
                  <SectionHeader title="36協定" />
                  <FormField label="36協定名">
                    <Select value={formData.agreement36Name} onValueChange={(v) => updateForm({ agreement36Name: v })}>
                      <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">未設定</SelectItem>
                        <SelectItem value="standard_36">標準36協定</SelectItem>
                        <SelectItem value="special_36">特別条項付き36協定</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </>
              )}

              {/* ━━━ A17: 未申請打刻の取り扱い ━━━ */}
              {showSection(t, 'unapprovedPunch') && (
                <>
                  <SectionHeader title="未申請打刻の取り扱い" />
                  <FormField label="早出">
                    <RadioGroup value={formData.unapprovedEarlyWork} onValueChange={(v) => updateForm({ unapprovedEarlyWork: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="discard" id="ue-discard" />
                        <Label htmlFor="ue-discard" className="text-sm">切り捨て</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round" id="ue-round" />
                        <Label htmlFor="ue-round" className="text-sm">丸め</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="as_is" id="ue-asis" />
                        <Label htmlFor="ue-asis" className="text-sm">そのまま</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                  <FormField label="遅刻">
                    <RadioGroup value={formData.unapprovedLateArrival} onValueChange={(v) => updateForm({ unapprovedLateArrival: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="discard" id="ul-discard" />
                        <Label htmlFor="ul-discard" className="text-sm">切り捨て</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round" id="ul-round" />
                        <Label htmlFor="ul-round" className="text-sm">丸め</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="as_is" id="ul-asis" />
                        <Label htmlFor="ul-asis" className="text-sm">そのまま</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                  <FormField label="早退">
                    <RadioGroup value={formData.unapprovedEarlyLeave} onValueChange={(v) => updateForm({ unapprovedEarlyLeave: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="discard" id="uel-discard" />
                        <Label htmlFor="uel-discard" className="text-sm">切り捨て</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round" id="uel-round" />
                        <Label htmlFor="uel-round" className="text-sm">丸め</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="as_is" id="uel-asis" />
                        <Label htmlFor="uel-asis" className="text-sm">そのまま</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                  <FormField label="残業">
                    <RadioGroup value={formData.unapprovedOvertime} onValueChange={(v) => updateForm({ unapprovedOvertime: v })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="discard" id="uo-discard" />
                        <Label htmlFor="uo-discard" className="text-sm">切り捨て</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round" id="uo-round" />
                        <Label htmlFor="uo-round" className="text-sm">丸め</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="as_is" id="uo-asis" />
                        <Label htmlFor="uo-asis" className="text-sm">そのまま</Label>
                      </div>
                    </RadioGroup>
                  </FormField>
                </>
              )}

            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              {editingRule ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 勤務パターンサブダイアログ */}
      <WorkPatternDialog
        open={isPatternDialogOpen}
        onOpenChange={setIsPatternDialogOpen}
        pattern={editingPattern}
        onSave={handlePatternSave}
      />

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
