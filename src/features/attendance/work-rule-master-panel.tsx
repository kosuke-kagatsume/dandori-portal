'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Briefcase, Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store/tenant-store';
import { useLeaveTypeStore } from '@/lib/store/leave-type-store';
import type { WorkRule } from '@/features/users/user-attendance-tab';

import {
  type WorkRuleFormData, type WorkPatternFormData, type ScheduleRow,
  workRuleTypes, workRuleTypeLabels, defaultFormData, defaultScheduleRows,
  formatHoursMinutes,
} from '@/lib/attendance/work-rule-types';
import { WorkPatternDialog } from '@/features/attendance/work-pattern-dialog';
import { WorkRuleFormSections } from '@/features/attendance/work-rule-form-sections';

// ── 後方互換マイグレーション ──────────────────────────────

function migrateSettings(saved: Partial<WorkRuleFormData>): Partial<WorkRuleFormData> {
  const migrate = (v: string | undefined, map: Record<string, string>, fallback: string) => {
    if (!v) return fallback;
    return map[v] ?? v;
  };

  return {
    ...saved,
    scheduledTallyRange: migrate(saved.scheduledTallyRange, {
      within_scheduled: 'contract_range_only',
      include_overtime: 'contract_hours_limit',
    }, defaultFormData.scheduledTallyRange),
    legalHolidayDesignation: migrate(saved.legalHolidayDesignation, {
      auto: 'weekly_1',
      schedule: 'specify_both',
    }, defaultFormData.legalHolidayDesignation),
    weeklyContractDays: migrate(saved.weeklyContractDays, {
      '5': '5_plus', '6': '5_plus', '7': '5_plus',
    }, defaultFormData.weeklyContractDays),
    discretionaryScope: migrate(saved.discretionaryScope, {
      all: 'weekday_and_all_holiday',
      workday_only: 'weekday_only',
    }, 'weekday_only'),
    flexTotalWorkCalc: migrate(saved.flexTotalWorkCalc, {
      calendar: 'standard_days',
      manual: 'standard_days',
    }, defaultFormData.flexTotalWorkCalc),
    flexLegalFrameCalc: migrate(saved.flexLegalFrameCalc, {
      auto: 'principle',
      manual: 'principle',
      principle_with_override: 'overtime_at_excess',
    }, defaultFormData.flexLegalFrameCalc),
    flexDeficiencyHandling: migrate(saved.flexDeficiencyHandling, {
      carry_forward: 'carry_over',
      deduct: 'settle_at_end',
      deduct_monthly: 'settle_at_end',
      no_deduction: 'settle_at_end',
    }, defaultFormData.flexDeficiencyHandling),
    flexScope: migrate(saved.flexScope, {
      all: 'weekday_and_all_holiday',
      all_days: 'weekday_and_all_holiday',
      workday_only: 'weekday_only',
      include_holiday_work: 'weekday_and_scheduled_holiday',
    }, defaultFormData.flexScope),
  };
}

// ── 型 ──────────────────────────────────────────

interface WorkRuleRecord extends WorkRule {
  id: string;
  assignedCount: number;
  settings?: Record<string, unknown> | null;
}

// ── メインコンポーネント ──────────────────────────────────

export function WorkRuleMasterPanel() {
  const [workRules, setWorkRules] = useState<WorkRuleRecord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkRuleRecord | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkRuleFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;
  const { compensatoryDayOffPatterns, substituteHolidayPatterns } = useLeaveTypeStore();

  // 勤務パターンサブダイアログ
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<WorkPatternFormData | null>(null);

  // ── データ取得 ──────────────────────────────────

  const fetchWorkRules = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/attendance-master/work-rules?tenantId=${tenantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setWorkRules(json.data);
        }
      }
    } catch {
      toast.error('就業ルールの取得に失敗しました');
    }
  }, [tenantId]);

  useEffect(() => { fetchWorkRules(); }, [fetchWorkRules]);

  // ── ダイアログ操作 ──────────────────────────────────

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({ ...defaultFormData, scheduleRows: defaultScheduleRows.map(r => ({ ...r })) });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (rule: WorkRuleRecord) => {
    setEditingRule(rule);
    const savedSettings = (rule.settings ?? {}) as Partial<WorkRuleFormData>;
    const migrated = migrateSettings(savedSettings);

    setFormData({
      ...defaultFormData,
      ...migrated,
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
      paidLeaveHourlyHours: savedSettings.paidLeaveHourlyHours || defaultFormData.paidLeaveHourlyHours,
      scheduleRows: (savedSettings.scheduleRows as ScheduleRow[] | undefined) || defaultScheduleRows.map(r => ({ ...r })),
      workPatterns: (savedSettings.workPatterns as WorkPatternFormData[] | undefined) || [],
    });
    setIsDialogOpen(true);
  };

  // ── 保存・削除 ──────────────────────────────────

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('就業ルール名を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const t = formData.type;
      const hasWorkTime = t === 'standard' || t === 'shift' || t === 'monthly_variable' || t === 'yearly_variable';
      const payload = {
        type: t,
        name: formData.name,
        standardWorkHours: formData.standardWorkHours,
        breakMinutes: formData.breakMinutes,
        workStartTime: hasWorkTime ? formData.workStartTime : null,
        workEndTime: hasWorkTime ? formData.workEndTime : null,
        coreTimeStart: t === 'flextime' ? formData.coreTimeStart : null,
        coreTimeEnd: t === 'flextime' ? formData.coreTimeEnd : null,
        flexTimeStart: t === 'flextime' ? formData.flexTimeStart : null,
        flexTimeEnd: t === 'flextime' ? formData.flexTimeEnd : null,
        settings: formData,
      };

      const url = editingRule
        ? `/api/attendance-master/work-rules?id=${editingRule.id}`
        : '/api/attendance-master/work-rules';
      const method = editingRule ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || (editingRule ? '更新に失敗しました' : '作成に失敗しました'));
      }
      toast.success(editingRule ? '就業ルールを更新しました' : '就業ルールを作成しました');

      await fetchWorkRules();
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingRule(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRuleId) return;
    try {
      const res = await fetch(`/api/attendance-master/work-rules?id=${deletingRuleId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '削除に失敗しました');
      }
      toast.success('就業ルールを削除しました');
      await fetchWorkRules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました');
    }
    setIsDeleteDialogOpen(false);
    setDeletingRuleId(null);
  };

  // ── フォーム更新ヘルパー ──────────────────────────────────

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
      const idx = prev.workPatterns.findIndex(p => p.id === data.id);
      if (idx >= 0) {
        const patterns = [...prev.workPatterns];
        patterns[idx] = data;
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

  // ── 描画 ──────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ルール一覧 */}
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
                    <TableCell>{formatHoursMinutes(rule.standardWorkHours)}</TableCell>
                    <TableCell>{rule.breakMinutes}分</TableCell>
                    <TableCell>
                      {rule.type === 'flextime' && rule.coreTimeStart && rule.coreTimeEnd ? (
                        <span className="text-sm">コア: {rule.coreTimeStart} - {rule.coreTimeEnd}</span>
                      ) : rule.workStartTime && rule.workEndTime ? (
                        <span className="text-sm">{rule.workStartTime} - {rule.workEndTime}</span>
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
                          onClick={() => { setDeletingRuleId(rule.id); setIsDeleteDialogOpen(true); }}
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] !flex !flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>{editingRule ? '就業ルールを編集' : '就業ルールを作成'}</DialogTitle>
            <DialogDescription>{selectedTypeConfig?.description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <div className="grid gap-4 py-4">
              <WorkRuleFormSections
                formData={formData}
                updateForm={updateForm}
                updateScheduleRow={updateScheduleRow}
                onEditPattern={(pattern) => { setEditingPattern(pattern); setIsPatternDialogOpen(true); }}
                onAddPattern={() => { setEditingPattern(null); setIsPatternDialogOpen(true); }}
                onDeletePattern={handlePatternDelete}
                substituteHolidayPatterns={substituteHolidayPatterns}
                compensatoryDayOffPatterns={compensatoryDayOffPatterns}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '保存中...' : editingRule ? '更新' : '作成'}
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
        workRuleType={formData.type}
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
