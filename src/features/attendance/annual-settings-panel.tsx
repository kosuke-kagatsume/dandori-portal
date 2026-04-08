'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  HolidaySetting, RegularHoliday, AnnualHoliday, CompanyHoliday, WorkRule, PayrollMonth, PlannedLeaveDate,
} from '@/lib/attendance/annual-settings-helpers';
import {
  DAY_LABELS, DAY_TYPE_LABELS, MONTH_NAMES, defaultHolidaySettings, calculateMonthlyDays,
} from '@/lib/attendance/annual-settings-helpers';
import { HolidaySettingsDialog, CustomHolidayDialog, DailyHoursDialog, PlannedLeaveDialog } from '@/features/attendance/annual-settings-dialogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Edit, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const currentYear = new Date().getFullYear();

export function AnnualSettingsPanel() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [holidaySettings, setHolidaySettings] = useState<HolidaySetting[]>(defaultHolidaySettings);
  const [regularHolidays, setRegularHolidays] = useState<RegularHoliday[]>([]);
  const [annualHolidays, setAnnualHolidays] = useState<AnnualHoliday[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>([]);
  const [dailyWorkHours, setDailyWorkHours] = useState(8.0);
  const [workRules, setWorkRules] = useState<WorkRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 休日設定ダイアログ
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [tempHolidaySettings, setTempHolidaySettings] = useState<HolidaySetting[]>([]);

  // 独自休日ダイアログ
  const [customHolidayDialogOpen, setCustomHolidayDialogOpen] = useState(false);
  const [regularForm, setRegularForm] = useState({ startMonth: '', startDay: '', endMonth: '', endDay: '', name: '' });
  const [annualForm, setAnnualForm] = useState({ date: '', name: '' });

  // 計画的付与
  const [plannedLeaveDates, setPlannedLeaveDates] = useState<PlannedLeaveDate[]>([]);
  const [plannedLeaveDialogOpen, setPlannedLeaveDialogOpen] = useState(false);
  const [plannedLeaveForm, setPlannedLeaveForm] = useState({ date: '', name: '' });

  // 1日の所定労働時間ダイアログ
  const [dailyHoursDialogOpen, setDailyHoursDialogOpen] = useState(false);
  const [tempDailyHours, setTempDailyHours] = useState(8.0);

  // holidays API から取得
  const fetchHolidays = useCallback(async (year: number) => {
    try {
      const res = await fetch(`/api/attendance-master/holidays?fiscalYear=${year}`);
      const json = await res.json();
      if (json.success && json.data?.holidays) {
        setCompanyHolidays(json.data.holidays);
        const regular: RegularHoliday[] = [];
        const annual: AnnualHoliday[] = [];
        for (const h of json.data.holidays as CompanyHoliday[]) {
          if (h.isRecurring) {
            const d = new Date(h.date);
            regular.push({ id: h.id, month: d.getMonth() + 1, day: d.getDate(), name: h.name });
          } else if (h.type === 'company') {
            annual.push({ id: h.id, date: new Date(h.date).toISOString().split('T')[0], name: h.name });
          }
        }
        setRegularHolidays(regular);
        setAnnualHolidays(annual);
      }
    } catch {
      // フォールバック
    }
  }, []);

  // 計画的付与日取得
  const fetchPlannedLeave = useCallback(async (year: number) => {
    try {
      const res = await fetch(`/api/attendance-master/planned-leave?fiscalYear=${year}`);
      const json = await res.json();
      if (json.success && json.data?.dates) {
        setPlannedLeaveDates(json.data.dates.map((d: Record<string, unknown>) => ({
          id: d.id as string,
          date: new Date(d.date as string).toISOString().split('T')[0],
          name: d.name as string,
          fiscalYear: d.fiscalYear as number,
        })));
      }
    } catch {
      // フォールバック
    }
  }, []);

  // 就業ルール取得
  const fetchWorkRules = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance-master/work-rules?activeOnly=true');
      const json = await res.json();
      if (json.success && json.data?.workRules) {
        setWorkRules(json.data.workRules.map((r: Record<string, unknown>) => ({
          id: r.id as string, name: r.name as string, type: r.type as string || 'fixed',
          dailyWorkHours: (r.dailyWorkHours as number) || 8, weeklyWorkHours: (r.weeklyWorkHours as number) || 40,
          isActive: r.isActive as boolean,
        })));
      }
    } catch {
      // フォールバック
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchHolidays(selectedYear), fetchPlannedLeave(selectedYear), fetchWorkRules()]).finally(() => setIsLoading(false));
  }, [fetchHolidays, fetchPlannedLeave, fetchWorkRules, selectedYear]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setIsLoading(true);
    Promise.all([fetchHolidays(year), fetchPlannedLeave(year)]).finally(() => setIsLoading(false));
  };

  const monthlyDays = useMemo(() =>
    calculateMonthlyDays(selectedYear, holidaySettings, regularHolidays, annualHolidays, companyHolidays),
    [selectedYear, holidaySettings, regularHolidays, annualHolidays, companyHolidays]
  );

  const payrollMonths = useMemo<PayrollMonth[]>(() =>
    MONTH_NAMES.map((_, i) => ({
      month: i + 1,
      closingDate: `${i === 11 ? selectedYear + 1 : selectedYear}/${String(i === 11 ? 1 : i + 2).padStart(2, '0')}/末`,
      paymentDate: `${i === 11 ? selectedYear + 1 : selectedYear}/${String(i === 11 ? 1 : i + 2).padStart(2, '0')}/25`,
      publicDate: `${i === 11 ? selectedYear + 1 : selectedYear}/${String(i === 11 ? 1 : i + 2).padStart(2, '0')}/24`,
      workDays: monthlyDays[i]?.workDays || 0,
      status: 'unconfirmed' as const,
    })),
    [selectedYear, monthlyDays]
  );

  // ダイアログハンドラー
  const openHolidayDialog = () => { setTempHolidaySettings([...holidaySettings]); setHolidayDialogOpen(true); };
  const saveHolidaySettings = () => { setHolidaySettings(tempHolidaySettings); setHolidayDialogOpen(false); };
  const openDailyHoursDialog = () => { setTempDailyHours(dailyWorkHours); setDailyHoursDialogOpen(true); };
  const saveDailyHours = () => { setDailyWorkHours(tempDailyHours); setDailyHoursDialogOpen(false); };

  // 定期休日 CRUD
  const addRegularHoliday = async () => {
    const sm = parseInt(regularForm.startMonth);
    const sd = parseInt(regularForm.startDay);
    const em = parseInt(regularForm.endMonth);
    const ed = parseInt(regularForm.endDay);
    if (!sm || !sd || !em || !ed || !regularForm.name.trim()) return;

    const entries: { month: number; day: number }[] = [];
    const startYear = 2024;
    const endYear = em < sm || (em === sm && ed < sd) ? 2025 : 2024;
    const current = new Date(startYear, sm - 1, sd);
    const end = new Date(endYear, em - 1, ed);
    while (current <= end) {
      entries.push({ month: current.getMonth() + 1, day: current.getDate() });
      current.setDate(current.getDate() + 1);
    }

    const holidays = entries.map(e => ({
      date: `${selectedYear}-${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`,
      name: regularForm.name.trim(), type: 'company', fiscalYear: selectedYear, isRecurring: true,
    }));

    try {
      const res = await fetch('/api/attendance-master/holidays', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holidays }),
      });
      const json = await res.json();
      if (json.success) { toast.success(`${holidays.length}件の定期休日を登録しました`); fetchHolidays(selectedYear); }
    } catch { toast.error('保存に失敗しました'); }
    setRegularForm({ startMonth: '', startDay: '', endMonth: '', endDay: '', name: '' });
  };

  const removeRegularHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance-master/holidays?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setRegularHolidays(prev => prev.filter(h => h.id !== id)); toast.success('削除しました'); }
    } catch { toast.error('削除に失敗しました'); }
  };

  const addAnnualHoliday = async () => {
    if (!annualForm.date || !annualForm.name.trim()) return;
    try {
      const res = await fetch('/api/attendance-master/holidays', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: annualForm.date, name: annualForm.name.trim(), type: 'company', fiscalYear: selectedYear, isRecurring: false }),
      });
      const json = await res.json();
      if (json.success) { toast.success('年度休日を登録しました'); fetchHolidays(selectedYear); }
      else { toast.error(json.error || '保存に失敗しました'); }
    } catch { toast.error('保存に失敗しました'); }
    setAnnualForm({ date: '', name: '' });
  };

  const removeAnnualHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance-master/holidays?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setAnnualHolidays(prev => prev.filter(h => h.id !== id)); toast.success('削除しました'); }
    } catch { toast.error('削除に失敗しました'); }
  };

  // 計画的付与日 CRUD
  const addPlannedLeave = async () => {
    if (!plannedLeaveForm.date || !plannedLeaveForm.name.trim()) return;
    try {
      const res = await fetch('/api/attendance-master/planned-leave', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: plannedLeaveForm.date, name: plannedLeaveForm.name.trim(), fiscalYear: selectedYear }),
      });
      const json = await res.json();
      if (json.success) { toast.success('計画的付与日を登録しました'); fetchPlannedLeave(selectedYear); }
      else { toast.error(json.error || '保存に失敗しました'); }
    } catch { toast.error('保存に失敗しました'); }
    setPlannedLeaveForm({ date: '', name: '' });
  };

  const removePlannedLeave = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance-master/planned-leave?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setPlannedLeaveDates(prev => prev.filter(d => d.id !== id)); toast.success('削除しました'); }
    } catch { toast.error('削除に失敗しました'); }
  };

  const totalWorkDays = monthlyDays.reduce((sum, m) => sum + m.workDays, 0);
  const totalHolidays = monthlyDays.reduce((sum, m) => sum + m.holidays, 0);
  const totalCalendarDays = monthlyDays.reduce((sum, m) => sum + m.calendarDays, 0);
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* 年度選択 */}
      <div className="flex items-center gap-3">
        <Select value={String(selectedYear)} onValueChange={(v) => handleYearChange(parseInt(v))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {yearOptions.map(y => (<SelectItem key={y} value={String(y)}>{y}年</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* 休日設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">休日設定</CardTitle>
              <CardDescription>曜日ごとの平日・休日区分を設定します</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={openHolidayDialog}><Edit className="w-4 h-4 mr-2" />編集</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>{DAY_LABELS.map(day => (<TableHead key={day} className="text-center">{day}</TableHead>))}</TableRow></TableHeader>
            <TableBody>
              <TableRow>
                {holidaySettings.map(setting => (
                  <TableCell key={setting.day} className="text-center">
                    <Badge variant={setting.type === 'legal_holiday' ? 'destructive' : setting.type === 'prescribed_holiday' ? 'secondary' : 'default'}>
                      {DAY_TYPE_LABELS[setting.type]}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 独自休日設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">独自休日設定</CardTitle>
              <CardDescription>事業所独自の休日を設定します</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCustomHolidayDialogOpen(true)}><Edit className="w-4 h-4 mr-2" />編集</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">定期休日設定</h4>
            {regularHolidays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">定期休日が登録されていません。</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>月日</TableHead><TableHead>名称</TableHead></TableRow></TableHeader>
                <TableBody>
                  {regularHolidays.sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day).map(h => (
                    <TableRow key={h.id}><TableCell>{h.month}/{h.day}</TableCell><TableCell>{h.name}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">年度休日設定</h4>
            {annualHolidays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">年度休日が登録されていません。</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>日付</TableHead><TableHead>名称</TableHead></TableRow></TableHeader>
                <TableBody>
                  {annualHolidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}</TableCell>
                      <TableCell>{h.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 計画的付与設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">計画的付与設定</CardTitle>
              <CardDescription>会社が指定する有給休暇（年5日分）を設定します</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPlannedLeaveDialogOpen(true)}><Edit className="w-4 h-4 mr-2" />編集</Button>
          </div>
        </CardHeader>
        <CardContent>
          {plannedLeaveDates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">計画的付与日が登録されていません。</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>月日</TableHead><TableHead>名称</TableHead></TableRow></TableHeader>
              <TableBody>
                {plannedLeaveDates
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(d => (
                    <TableRow key={d.id}>
                      <TableCell>{new Date(d.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</TableCell>
                      <TableCell>{d.name}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 休日判定の優先順位 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <div>
              <CardTitle className="text-base">休日判定の優先順位</CardTitle>
              <CardDescription>休日が重複する場合、上位のルールが優先されます</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {[
              { rank: '1', label: '就業ルール', desc: '就業ルールに曜日設定が存在する場合、勤怠マスタの曜日設定より優先' },
              { rank: '2', label: '個別休日', desc: '従業員ごとに設定された個別の休日' },
              { rank: '3', label: '定期休日', desc: '毎年固定の定期休日（年末年始・夏季休暇等）' },
              { rank: '4', label: '祝日', desc: 'APIにより自動取得される国民の祝日' },
              { rank: '5', label: '曜日設定', desc: '上記の休日設定で定義された曜日ごとの休日区分' },
            ].map(item => (
              <li key={item.rank} className="flex items-start gap-3">
                <span className="font-bold text-primary min-w-[24px]">{item.rank}.</span>
                <div><span className="font-medium">{item.label}</span><p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p></div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* 1日の所定労働時間 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">1日の所定労働時間</CardTitle>
            <Button variant="outline" size="sm" onClick={openDailyHoursDialog}><Edit className="w-4 h-4 mr-2" />編集</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">1日の所定労働時間</span>
            <span className="font-medium">{dailyWorkHours}時間</span>
          </div>
        </CardContent>
      </Card>

      {/* 所定労働時間（就業ルール連動・自動算出） */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">所定労働時間</CardTitle>
            <CardDescription>月別日数表および就業ルールに基づき、就業ルールごとに自動算出する</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {workRules.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground text-center py-4">就業ルールが登録されていません。就業ルールマスタから登録してください。</p>
              {(() => {
                const stdDays = Math.round((totalWorkDays / 12) * 10) / 10;
                const stdHours = Math.round((stdDays * dailyWorkHours) * 10) / 10;
                const weeklyHours = 40;
                const varHours = Math.round((weeklyHours * 52 / 12) * 10) / 10;
                const varDays = Math.round((varHours / dailyWorkHours) * 10) / 10;
                return [
                  { label: 'フレックス', days: stdDays, hours: stdHours },
                  { label: '1ヶ月単位変形労働制', days: varDays, hours: varHours },
                  { label: '固定時間制', days: stdDays, hours: stdHours },
                ].map(cat => (
                  <div key={cat.label} className="rounded-lg border p-3">
                    <h4 className="text-sm font-semibold text-primary mb-2">{cat.label}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-muted-foreground">所定労働日数（月平均）</p><p className="font-medium">{cat.days}日</p></div>
                      <div><p className="text-xs text-muted-foreground">所定労働時間（月平均）</p><p className="font-medium">{cat.hours}時間</p></div>
                    </div>
                  </div>
                ));
              })()}
            </>
          ) : (
            workRules.map(rule => {
              let days: number;
              let hours: number;
              if (rule.type === 'monthly_variable' || rule.type === 'yearly_variable') {
                hours = Math.round((rule.weeklyWorkHours * 52 / 12) * 10) / 10;
                days = Math.round((hours / (rule.dailyWorkHours || dailyWorkHours)) * 10) / 10;
              } else {
                days = Math.round((totalWorkDays / 12) * 10) / 10;
                hours = Math.round((days * (rule.dailyWorkHours || dailyWorkHours)) * 10) / 10;
              }
              return (
                <div key={rule.id} className="rounded-lg border p-3">
                  <h4 className="text-sm font-semibold text-primary mb-2">{rule.name}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground">所定労働日数（月平均）</p><p className="font-medium">{days}日</p></div>
                    <div><p className="text-xs text-muted-foreground">所定労働時間（月平均）</p><p className="font-medium">{hours}時間</p></div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 月別日数表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <div>
              <CardTitle className="text-base">月別日数表</CardTitle>
              <CardDescription>休日設定・独自休日設定をもとに算出された{selectedYear}年の月別の労働日数・休日数</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10" />
                  {MONTH_NAMES.map(m => (<TableHead key={m} className="text-center min-w-[60px]">{m}</TableHead>))}
                  <TableHead className="text-center min-w-[70px] font-bold">合計</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">所定労働日数</TableCell>
                  {monthlyDays.map(m => (<TableCell key={m.month} className="text-center">{m.workDays}日</TableCell>))}
                  <TableCell className="text-center font-bold">{totalWorkDays}日</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">休日数</TableCell>
                  {monthlyDays.map(m => (<TableCell key={m.month} className="text-center">{m.holidays}日</TableCell>))}
                  <TableCell className="text-center font-bold">{totalHolidays}日</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">暦日数</TableCell>
                  {monthlyDays.map(m => (<TableCell key={m.month} className="text-center">{m.calendarDays}日</TableCell>))}
                  <TableCell className="text-center font-bold">{totalCalendarDays}日</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 給与月度 */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">給与月度</CardTitle>
            <CardDescription>締め日グループの設定に基づく給与月度が表示されます</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10" />
                  {MONTH_NAMES.map(m => (<TableHead key={m} className="text-center min-w-[90px]">{m}</TableHead>))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {['締め日', '支給日', '公開日'].map((label) => {
                  const key = label === '締め日' ? 'closingDate' : label === '支給日' ? 'paymentDate' : 'publicDate';
                  return (
                    <TableRow key={label}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">{label}</TableCell>
                      {payrollMonths.map(m => (<TableCell key={m.month} className="text-center text-xs">{m[key]}</TableCell>))}
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">所定労働日数</TableCell>
                  {payrollMonths.map(m => (<TableCell key={m.month} className="text-center">{m.workDays}日</TableCell>))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">ステータス</TableCell>
                  {payrollMonths.map(m => (
                    <TableCell key={m.month} className="text-center">
                      <Badge variant={m.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                        {m.status === 'confirmed' ? '確定済' : '未確定'}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ダイアログ群 */}
      <HolidaySettingsDialog
        open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}
        settings={tempHolidaySettings} onSettingsChange={setTempHolidaySettings} onSave={saveHolidaySettings}
      />
      <CustomHolidayDialog
        open={customHolidayDialogOpen} onOpenChange={setCustomHolidayDialogOpen}
        regularHolidays={regularHolidays} annualHolidays={annualHolidays}
        regularForm={regularForm} annualForm={annualForm}
        onRegularFormChange={setRegularForm} onAnnualFormChange={setAnnualForm}
        onAddRegular={addRegularHoliday} onRemoveRegular={removeRegularHoliday}
        onAddAnnual={addAnnualHoliday} onRemoveAnnual={removeAnnualHoliday}
      />
      <DailyHoursDialog
        open={dailyHoursDialogOpen} onOpenChange={setDailyHoursDialogOpen}
        hours={tempDailyHours} onHoursChange={setTempDailyHours} onSave={saveDailyHours}
      />
      <PlannedLeaveDialog
        open={plannedLeaveDialogOpen} onOpenChange={setPlannedLeaveDialogOpen}
        plannedLeaveDates={plannedLeaveDates}
        form={plannedLeaveForm} onFormChange={setPlannedLeaveForm}
        onAdd={addPlannedLeave} onRemove={removePlannedLeave}
      />
    </div>
  );
}
