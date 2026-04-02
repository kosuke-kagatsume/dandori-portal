'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { WorkRuleType } from '@/features/users/user-attendance-tab';
import {
  type WorkRuleFormData, type WorkPatternFormData, type ScheduleRow,
  workRuleTypes, attendanceCategories, weekdayOptions,
  showSection,
} from '@/lib/attendance/work-rule-types';

// ── UIユーティリティ ────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <Separator className="mt-1 mb-3" />
    </div>
  );
}

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

// ── Props ────────────────────────────

interface Props {
  formData: WorkRuleFormData;
  updateForm: (partial: Partial<WorkRuleFormData>) => void;
  updateScheduleRow: (index: number, field: keyof ScheduleRow, value: string) => void;
  onEditPattern: (pattern: WorkPatternFormData) => void;
  onAddPattern: () => void;
  onDeletePattern: (id: string) => void;
  substituteHolidayPatterns: { id: string; name: string }[];
  compensatoryDayOffPatterns: { id: string; name: string }[];
}

// ── メインコンポーネント ────────────────────────────

export function WorkRuleFormSections({
  formData, updateForm, updateScheduleRow,
  onEditPattern, onAddPattern, onDeletePattern,
  substituteHolidayPatterns, compensatoryDayOffPatterns,
}: Props) {
  const t = formData.type;

  return (
    <>
      {/* ━━━ A1: ルール名 + 種別 ━━━ */}
      <SectionHeader title="就業ルール名" />
      <FormField label="種別" required>
        <Select value={formData.type} onValueChange={(value: WorkRuleType) => updateForm({ type: value })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {workRuleTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="ルール名" required>
        <Input value={formData.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="基本勤務（9:00-18:00）" />
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

      {/* ━━━ B: 裁量労働制 ━━━ */}
      {showSection(t, 'discretionaryScope') && (
        <>
          <SectionHeader title="裁量労働制" />
          <FormField label="適用範囲">
            <Select value={formData.discretionaryScope} onValueChange={(v) => updateForm({ discretionaryScope: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekday_only">平日のみ</SelectItem>
                <SelectItem value="weekday_and_scheduled_holiday">平日と所定休日のみ</SelectItem>
                <SelectItem value="weekday_and_all_holiday">平日と所定休日と法定休日</SelectItem>
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
                <RadioGroupItem value="standard_days" id="ftw-std" />
                <Label htmlFor="ftw-std" className="text-sm">1日の標準労働時間×清算期間の所定労働日数</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specify" id="ftw-spec" />
                <Label htmlFor="ftw-spec" className="text-sm">指定する</Label>
              </div>
            </RadioGroup>
            {formData.flexTotalWorkCalc === 'specify' && (
              <div className="flex items-center gap-2 mt-2 ml-6">
                <Label className="text-sm whitespace-nowrap">総労働時間</Label>
                <Input value={formData.flexTotalWorkHours} onChange={(e) => updateForm({ flexTotalWorkHours: e.target.value })} className="w-24" placeholder="160:00" />
              </div>
            )}
          </FormField>
          <FormField label="法定総枠計算方法">
            <Select value={formData.flexLegalFrameCalc} onValueChange={(v) => updateForm({ flexLegalFrameCalc: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="principle">原則通り（暦日）</SelectItem>
                <SelectItem value="workday_8h">所定労働日数×8時間</SelectItem>
                <SelectItem value="overtime_at_excess">所定超過時点で時間外労働とする</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="不足時間取扱">
            <Select value={formData.flexDeficiencyHandling} onValueChange={(v) => updateForm({ flexDeficiencyHandling: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="settle_at_end">清算期間終了時に精算</SelectItem>
                <SelectItem value="carry_over_unlimited">翌清算期間に繰り越し（上限なし）</SelectItem>
                <SelectItem value="carry_over">翌清算期間に繰り越し（上限あり）</SelectItem>
                <SelectItem value="carry_over_legal_limit">翌清算期間の法定労働時間を上限として繰り越し</SelectItem>
              </SelectContent>
            </Select>
            {formData.flexDeficiencyHandling === 'carry_over' && (
              <div className="flex items-center gap-2 mt-2 ml-2">
                <Label className="text-sm whitespace-nowrap">繰越上限</Label>
                <Input value={formData.flexDeficiencyCarryOverLimit} onChange={(e) => updateForm({ flexDeficiencyCarryOverLimit: e.target.value })} className="w-24" placeholder="06:00" />
              </div>
            )}
          </FormField>
        </>
      )}

      {showSection(t, 'flexScope') && (
        <>
          <FormField label="適用範囲">
            <Select value={formData.flexScope} onValueChange={(v) => updateForm({ flexScope: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekday_only">平日のみ</SelectItem>
                <SelectItem value="weekday_and_scheduled_holiday">平日と所定休日のみ</SelectItem>
                <SelectItem value="weekday_and_all_holiday">平日と所定休日と法定休日</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="1日標準労働時間">
            <Input type="time" value={formData.flexStandardWorkTime} onChange={(e) => updateForm({ flexStandardWorkTime: e.target.value })} className="w-32" />
          </FormField>
          <FormField label="1日休暇みなし労働時間">
            <Input type="time" value={formData.flexDayOffDeemedTime} onChange={(e) => updateForm({ flexDayOffDeemedTime: e.target.value })} className="w-32" />
          </FormField>
        </>
      )}

      {/* ━━━ B: 変形労働制 ━━━ */}
      {showSection(t, 'variablePeriod') && (
        <>
          <SectionHeader title="変形労働制" />
          {t === 'monthly_variable' && (
            <FormField label="毎月起算日">
              <Select value={formData.monthlyStartDay} onValueChange={(v) => updateForm({ monthlyStartDay: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
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
                <SelectItem value="proportional">原則通り（端数週の暦日数÷7×法定労働時間）</SelectItem>
                <SelectItem value="period_start">変形期間の初日から週を起算</SelectItem>
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
              <SelectItem value="weekday_only">平日のみ</SelectItem>
              <SelectItem value="weekday_and_scheduled">平日と所定休日のみ</SelectItem>
              <SelectItem value="weekday_and_all_holidays">平日と所定休日と法定休日</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      )}

      {/* ━━━ 勤務時間 ━━━ */}
      {showSection(t, 'workTime') && (
        <>
          <SectionHeader title="勤務時間" />
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
          {(t === 'standard' || t === 'shift') && (
            <>
              <FormField label="所定労働時間">
                <div className="flex items-center gap-2">
                  <Input type="number" value={Math.floor(formData.standardWorkHours / 60)} onChange={(e) => updateForm({ standardWorkHours: parseInt(e.target.value || '0') * 60 + (formData.standardWorkHours % 60) })} className="w-20" />
                  <span className="text-sm">時間</span>
                  <Input type="number" value={formData.standardWorkHours % 60} onChange={(e) => updateForm({ standardWorkHours: Math.floor(formData.standardWorkHours / 60) * 60 + parseInt(e.target.value || '0') })} className="w-20" />
                  <span className="text-sm">分</span>
                </div>
              </FormField>
              <FormField label="休憩時間">
                <div className="flex items-center gap-2">
                  <Input type="number" value={formData.breakMinutes} onChange={(e) => updateForm({ breakMinutes: parseInt(e.target.value || '0') })} className="w-20" />
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
                    <span className="text-xs text-muted-foreground ml-2">{wp.contractStartTime} - {wp.contractEndTime}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditPattern(wp)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeletePattern(wp.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onAddPattern}>
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
                <RadioGroupItem value="contract_range_only" id="str-cro" />
                <Label htmlFor="str-cro" className="text-sm">勤務パターンの契約時間の開始〜終了の範囲のみ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contract_hours_limit" id="str-chl" />
                <Label htmlFor="str-chl" className="text-sm">勤務パターンの契約時間の開始〜終了までの時間数分を上限とする</Label>
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
                <RadioGroupItem value="specify_both" id="lhd-both" />
                <Label htmlFor="lhd-both" className="text-sm">所定休日と法定休日を指定</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly_1" id="lhd-w1" />
                <Label htmlFor="lhd-w1" className="text-sm">指定せず1週1休</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly_4" id="lhd-m4" />
                <Label htmlFor="lhd-m4" className="text-sm">指定せず4週4休</Label>
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
                      <Select value={row.patternId || "__none__"} onValueChange={(v) => updateScheduleRow(i, 'patternId', v === "__none__" ? "" : v)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="なし" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">なし</SelectItem>
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
            <Select value={formData.paidLeavePattern || "__none__"} onValueChange={(v) => updateForm({ paidLeavePattern: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未設定</SelectItem>
                <SelectItem value="standard">標準</SelectItem>
                <SelectItem value="proportional">比例付与</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="週契約日数">
            <Select value={formData.weeklyContractDays} onValueChange={(v) => updateForm({ weeklyContractDays: v })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1日</SelectItem>
                <SelectItem value="2">2日</SelectItem>
                <SelectItem value="3">3日</SelectItem>
                <SelectItem value="4">4日</SelectItem>
                <SelectItem value="5_plus">5日以上</SelectItem>
                <SelectItem value="auto">勤務実績から自動判別</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="時間単位有給">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox checked={formData.paidLeaveHourlyUnit} onCheckedChange={(v) => updateForm({ paidLeaveHourlyUnit: v === true })} />
                <span className="text-sm">時間単位で取得可能</span>
              </div>
              {formData.paidLeaveHourlyUnit && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-sm text-muted-foreground">1日分</span>
                  <Select value={formData.paidLeaveHourlyHours} onValueChange={(v) => updateForm({ paidLeaveHourlyHours: v })}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">時間</span>
                </div>
              )}
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
            <Select value={formData.holidayPattern || "__none__"} onValueChange={(v) => updateForm({ holidayPattern: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未設定</SelectItem>
                <SelectItem value="japan_standard">日本の祝日</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="振替休日パターン">
            <Select value={formData.substituteHolidayPattern || "__none__"} onValueChange={(v) => updateForm({ substituteHolidayPattern: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未設定</SelectItem>
                {substituteHolidayPatterns.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {showSection(t, 'compensatoryDayOff') && (
            <>
              <FormField label="代休パターン">
                <Select value={formData.compensatoryDayOffPattern || "__none__"} onValueChange={(v) => updateForm({ compensatoryDayOffPattern: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">未設定</SelectItem>
                    {compensatoryDayOffPatterns.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
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
        </>
      )}

      {/* ━━━ A16: 36協定 ━━━ */}
      {showSection(t, 'agreement36') && (
        <>
          <SectionHeader title="36協定" />
          <FormField label="36協定名">
            <Select value={formData.agreement36Name || "__none__"} onValueChange={(v) => updateForm({ agreement36Name: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未設定</SelectItem>
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
          {(['unapprovedEarlyWork', 'unapprovedLateArrival', 'unapprovedEarlyLeave', 'unapprovedOvertime'] as const).map((field) => {
            const labels: Record<string, string> = {
              unapprovedEarlyWork: '早出',
              unapprovedLateArrival: '遅刻',
              unapprovedEarlyLeave: '早退',
              unapprovedOvertime: '残業',
            };
            const prefix = field.replace('unapproved', '').toLowerCase().slice(0, 3);
            return (
              <FormField key={field} label={labels[field]}>
                <RadioGroup value={formData[field]} onValueChange={(v) => updateForm({ [field]: v })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="discard" id={`${prefix}-discard`} />
                    <Label htmlFor={`${prefix}-discard`} className="text-sm">切り捨て</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="round" id={`${prefix}-round`} />
                    <Label htmlFor={`${prefix}-round`} className="text-sm">丸め</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="as_is" id={`${prefix}-asis`} />
                    <Label htmlFor={`${prefix}-asis`} className="text-sm">そのまま</Label>
                  </div>
                </RadioGroup>
              </FormField>
            );
          })}
        </>
      )}
    </>
  );
}
