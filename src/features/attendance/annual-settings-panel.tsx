'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarDays, Plus, Trash2, Edit, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type DayType = 'weekday' | 'prescribed_holiday' | 'legal_holiday';

interface HolidaySetting {
  day: string;
  type: DayType;
}

interface RegularHoliday {
  id: string;
  month: number;
  day: number;
  name: string;
}

interface AnnualHoliday {
  id: string;
  date: string;
  name: string;
}

interface MonthlyDays {
  month: number;
  workDays: number;
  holidays: number;
  calendarDays: number;
}

interface PayrollMonth {
  month: number;
  closingDate: string;
  paymentDate: string;
  publicDate: string;
  workDays: number;
  status: 'confirmed' | 'unconfirmed';
}

interface CompanyHoliday {
  id: string;
  date: string;
  name: string;
  type: string;
  fiscalYear: number;
  isRecurring: boolean;
}

interface WorkRule {
  id: string;
  name: string;
  type: string;
  dailyWorkHours: number;
  weeklyWorkHours: number;
  isActive: boolean;
}

const DAY_LABELS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日', '祝日'];

const DAY_TYPE_LABELS: Record<DayType, string> = {
  weekday: '平日',
  prescribed_holiday: '所定休日',
  legal_holiday: '法定休日',
};

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 日本の祝日（国民の祝日に関する法律）
const NATIONAL_HOLIDAYS: Record<string, string> = {
  '01-01': '元日', '01-13': '成人の日', '02-11': '建国記念の日', '02-23': '天皇誕生日',
  '03-20': '春分の日', '04-29': '昭和の日', '05-03': '憲法記念日', '05-04': 'みどりの日',
  '05-05': 'こどもの日', '07-21': '海の日', '08-11': '山の日', '09-15': '敬老の日',
  '09-23': '秋分の日', '10-13': 'スポーツの日', '11-03': '文化の日', '11-23': '勤労感謝の日',
};

const currentYear = new Date().getFullYear();

const defaultHolidaySettings: HolidaySetting[] = [
  { day: '月曜日', type: 'weekday' },
  { day: '火曜日', type: 'weekday' },
  { day: '水曜日', type: 'weekday' },
  { day: '木曜日', type: 'weekday' },
  { day: '金曜日', type: 'weekday' },
  { day: '土曜日', type: 'prescribed_holiday' },
  { day: '日曜日', type: 'legal_holiday' },
  { day: '祝日', type: 'prescribed_holiday' },
];

// 曜日インデックス: 0=日, 1=月, ..., 6=土
const daySettingMap: Record<string, number> = {
  '日曜日': 0, '月曜日': 1, '火曜日': 2, '水曜日': 3, '木曜日': 4, '金曜日': 5, '土曜日': 6,
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isNationalHoliday(year: number, month: number, day: number): boolean {
  const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (NATIONAL_HOLIDAYS[key]) return true;
  // 成人の日(1月第2月曜), 海の日(7月第3月曜), 敬老の日(9月第3月曜), スポーツの日(10月第2月曜)
  const date = new Date(year, month - 1, day);
  const dow = date.getDay(); // 0=Sun
  if (dow === 1) {
    const weekNum = Math.ceil(day / 7);
    if (month === 1 && weekNum === 2) return true;
    if (month === 7 && weekNum === 3) return true;
    if (month === 9 && weekNum === 3) return true;
    if (month === 10 && weekNum === 2) return true;
  }
  return false;
}

function calculateMonthlyDays(
  year: number,
  holidaySettings: HolidaySetting[],
  regularHolidays: RegularHoliday[],
  annualHolidays: AnnualHoliday[],
  companyHolidays: CompanyHoliday[],
): MonthlyDays[] {
  const result: MonthlyDays[] = [];
  const holidaySettingType = (dayName: string) => holidaySettings.find(h => h.day === dayName)?.type || 'weekday';

  for (let m = 1; m <= 12; m++) {
    const calendarDays = getDaysInMonth(year, m);
    let holidays = 0;
    for (let d = 1; d <= calendarDays; d++) {
      const date = new Date(year, m - 1, d);
      const dow = date.getDay();
      const dayNames = Object.entries(daySettingMap);
      const dayName = dayNames.find(([, idx]) => idx === dow)?.[0] || '';
      const dayType = holidaySettingType(dayName);

      // 祝日チェック
      const isHoliday = isNationalHoliday(year, m, d);
      const holidayType = isHoliday ? holidaySettingType('祝日') : null;

      // 独自休日チェック（regularHolidays）
      const isRegularHoliday = regularHolidays.some(h => h.month === m && h.day === d);

      // 年度休日チェック（annualHolidays）
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isAnnualHoliday = annualHolidays.some(h => h.date === dateStr);

      // DB company_holidays チェック
      const isCompanyHoliday = companyHolidays.some(h => {
        const hDate = new Date(h.date);
        return hDate.getFullYear() === year && hDate.getMonth() + 1 === m && hDate.getDate() === d;
      });

      if (isRegularHoliday || isAnnualHoliday || isCompanyHoliday) {
        holidays++;
      } else if (holidayType && holidayType !== 'weekday') {
        holidays++;
      } else if (dayType !== 'weekday') {
        holidays++;
      }
    }
    result.push({
      month: m,
      calendarDays,
      holidays,
      workDays: calendarDays - holidays,
    });
  }
  return result;
}

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
        // DB からローカルstate用に分類
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

  // 就業ルール取得
  const fetchWorkRules = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance-master/work-rules?activeOnly=true');
      const json = await res.json();
      if (json.success && json.data?.workRules) {
        setWorkRules(json.data.workRules.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.name as string,
          type: r.type as string || 'fixed',
          dailyWorkHours: (r.dailyWorkHours as number) || 8,
          weeklyWorkHours: (r.weeklyWorkHours as number) || 40,
          isActive: r.isActive as boolean,
        })));
      }
    } catch {
      // フォールバック
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchHolidays(selectedYear), fetchWorkRules()]).finally(() => setIsLoading(false));
  }, [fetchHolidays, fetchWorkRules, selectedYear]);

  // 年度変更時にholidays再取得
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setIsLoading(true);
    fetchHolidays(year).finally(() => setIsLoading(false));
  };

  // 月別日数表を動的算出
  const monthlyDays = useMemo(() =>
    calculateMonthlyDays(selectedYear, holidaySettings, regularHolidays, annualHolidays, companyHolidays),
    [selectedYear, holidaySettings, regularHolidays, annualHolidays, companyHolidays]
  );

  // 給与月度を動的算出
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

  const openHolidayDialog = () => {
    setTempHolidaySettings([...holidaySettings]);
    setHolidayDialogOpen(true);
  };

  const saveHolidaySettings = () => {
    setHolidaySettings(tempHolidaySettings);
    setHolidayDialogOpen(false);
  };

  // 定期休日: 開始〜終了の範囲を個別日付に展開して追加 → API保存
  const addRegularHoliday = async () => {
    const sm = parseInt(regularForm.startMonth);
    const sd = parseInt(regularForm.startDay);
    const em = parseInt(regularForm.endMonth);
    const ed = parseInt(regularForm.endDay);
    if (!sm || !sd || !em || !ed || !regularForm.name.trim()) return;

    const entries: { month: number; day: number; name: string }[] = [];
    const startYear = 2024;
    const endYear = em < sm || (em === sm && ed < sd) ? 2025 : 2024;
    const current = new Date(startYear, sm - 1, sd);
    const end = new Date(endYear, em - 1, ed);
    while (current <= end) {
      entries.push({ month: current.getMonth() + 1, day: current.getDate(), name: regularForm.name.trim() });
      current.setDate(current.getDate() + 1);
    }

    // API一括登録
    const holidays = entries.map(e => ({
      date: `${selectedYear}-${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`,
      name: e.name,
      type: 'company',
      fiscalYear: selectedYear,
      isRecurring: true,
    }));

    try {
      const res = await fetch('/api/attendance-master/holidays', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holidays }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${holidays.length}件の定期休日を登録しました`);
        fetchHolidays(selectedYear);
      }
    } catch {
      toast.error('保存に失敗しました');
    }
    setRegularForm({ startMonth: '', startDay: '', endMonth: '', endDay: '', name: '' });
  };

  const removeRegularHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance-master/holidays?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setRegularHolidays(prev => prev.filter(h => h.id !== id));
        toast.success('削除しました');
      }
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  // 年度休日
  const addAnnualHoliday = async () => {
    if (!annualForm.date || !annualForm.name.trim()) return;
    try {
      const res = await fetch('/api/attendance-master/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: annualForm.date,
          name: annualForm.name.trim(),
          type: 'company',
          fiscalYear: selectedYear,
          isRecurring: false,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('年度休日を登録しました');
        fetchHolidays(selectedYear);
      } else {
        toast.error(json.error || '保存に失敗しました');
      }
    } catch {
      toast.error('保存に失敗しました');
    }
    setAnnualForm({ date: '', name: '' });
  };

  const removeAnnualHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance-master/holidays?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setAnnualHolidays(prev => prev.filter(h => h.id !== id));
        toast.success('削除しました');
      }
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  const openDailyHoursDialog = () => {
    setTempDailyHours(dailyWorkHours);
    setDailyHoursDialogOpen(true);
  };

  const saveDailyHours = () => {
    setDailyWorkHours(tempDailyHours);
    setDailyHoursDialogOpen(false);
  };

  const totalWorkDays = monthlyDays.reduce((sum, m) => sum + m.workDays, 0);
  const totalHolidays = monthlyDays.reduce((sum, m) => sum + m.holidays, 0);
  const totalCalendarDays = monthlyDays.reduce((sum, m) => sum + m.calendarDays, 0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 年度選択 */}
      <div className="flex items-center gap-3">
        <Select value={String(selectedYear)} onValueChange={(v) => handleYearChange(parseInt(v))}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(y => (
              <SelectItem key={y} value={String(y)}>{y}年</SelectItem>
            ))}
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
            <Button variant="outline" size="sm" onClick={openHolidayDialog}>
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {DAY_LABELS.map(day => (
                  <TableHead key={day} className="text-center">{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {holidaySettings.map(setting => (
                  <TableCell key={setting.day} className="text-center">
                    <Badge variant={
                      setting.type === 'legal_holiday' ? 'destructive' :
                      setting.type === 'prescribed_holiday' ? 'secondary' : 'default'
                    }>
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
            <Button variant="outline" size="sm" onClick={() => setCustomHolidayDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 定期休日設定 */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">定期休日設定</h4>
            {regularHolidays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                定期休日が登録されていません。
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>月日</TableHead>
                    <TableHead>名称</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularHolidays
                    .sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day)
                    .map(h => (
                      <TableRow key={h.id}>
                        <TableCell>{h.month}/{h.day}</TableCell>
                        <TableCell>{h.name}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* 年度休日設定 */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-2">年度休日設定</h4>
            {annualHolidays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                年度休日が登録されていません。
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>名称</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {annualHolidays
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(h => (
                      <TableRow key={h.id}>
                        <TableCell>
                          {new Date(h.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                        </TableCell>
                        <TableCell>{h.name}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
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
                <div>
                  <span className="font-medium">{item.label}</span>
                  <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                </div>
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
            <Button variant="outline" size="sm" onClick={openDailyHoursDialog}>
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
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
            <p className="text-sm text-muted-foreground text-center py-4">
              就業ルールが登録されていません。就業ルールマスタから登録してください。
            </p>
          ) : (
            workRules.map(rule => {
              let days: number;
              let hours: number;
              if (rule.type === 'monthly_variable' || rule.type === 'yearly_variable') {
                // 変形労働時間制: 1週所定労働時間×52÷12
                hours = Math.round((rule.weeklyWorkHours * 52 / 12) * 10) / 10;
                days = Math.round((hours / (rule.dailyWorkHours || dailyWorkHours)) * 10) / 10;
              } else {
                // 通常勤務（固定時間制・フレックス等）: 年所定労働日数合計÷12 × 1日所定労働時間
                days = Math.round((totalWorkDays / 12) * 10) / 10;
                hours = Math.round((days * (rule.dailyWorkHours || dailyWorkHours)) * 10) / 10;
              }
              return (
                <div key={rule.id} className="rounded-lg border p-3">
                  <h4 className="text-sm font-semibold text-primary mb-2">{rule.name}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">所定労働日数（月平均）</p>
                      <p className="font-medium">{days}日</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">所定労働時間（月平均）</p>
                      <p className="font-medium">{hours}時間</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {workRules.length === 0 && (
            <>
              {/* フォールバック: デフォルト計算 */}
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
                      <div>
                        <p className="text-xs text-muted-foreground">所定労働日数（月平均）</p>
                        <p className="font-medium">{cat.days}日</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">所定労働時間（月平均）</p>
                        <p className="font-medium">{cat.hours}時間</p>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </>
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
                  {MONTH_NAMES.map(m => (
                    <TableHead key={m} className="text-center min-w-[60px]">{m}</TableHead>
                  ))}
                  <TableHead className="text-center min-w-[70px] font-bold">合計</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">所定労働日数</TableCell>
                  {monthlyDays.map(m => (
                    <TableCell key={m.month} className="text-center">{m.workDays}日</TableCell>
                  ))}
                  <TableCell className="text-center font-bold">{totalWorkDays}日</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">休日数</TableCell>
                  {monthlyDays.map(m => (
                    <TableCell key={m.month} className="text-center">{m.holidays}日</TableCell>
                  ))}
                  <TableCell className="text-center font-bold">{totalHolidays}日</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">暦日数</TableCell>
                  {monthlyDays.map(m => (
                    <TableCell key={m.month} className="text-center">{m.calendarDays}日</TableCell>
                  ))}
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
                  {MONTH_NAMES.map(m => (
                    <TableHead key={m} className="text-center min-w-[90px]">{m}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">締め日</TableCell>
                  {payrollMonths.map(m => (
                    <TableCell key={m.month} className="text-center text-xs">{m.closingDate}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">支給日</TableCell>
                  {payrollMonths.map(m => (
                    <TableCell key={m.month} className="text-center text-xs">{m.paymentDate}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">公開日</TableCell>
                  {payrollMonths.map(m => (
                    <TableCell key={m.month} className="text-center text-xs">{m.publicDate}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium whitespace-nowrap">所定労働日数</TableCell>
                  {payrollMonths.map(m => (
                    <TableCell key={m.month} className="text-center">{m.workDays}日</TableCell>
                  ))}
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

      {/* 休日設定ダイアログ */}
      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>休日設定</DialogTitle>
            <DialogDescription>基本的な出勤曜日を選択し、「更新する」をクリックしてください。</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {DAY_LABELS.map(day => (
                    <TableHead key={day} className="text-center text-xs px-2">{day}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {tempHolidaySettings.map((setting, idx) => (
                    <TableCell key={setting.day} className="text-center px-1">
                      <RadioGroup
                        value={setting.type}
                        onValueChange={(v) => {
                          const updated = [...tempHolidaySettings];
                          updated[idx] = { ...setting, type: v as DayType };
                          setTempHolidaySettings(updated);
                        }}
                        className="space-y-1"
                      >
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="weekday" id={`h-${idx}-w`} />
                          <Label htmlFor={`h-${idx}-w`} className="text-xs">平日</Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="prescribed_holiday" id={`h-${idx}-p`} />
                          <Label htmlFor={`h-${idx}-p`} className="text-xs">所定休日</Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="legal_holiday" id={`h-${idx}-l`} />
                          <Label htmlFor={`h-${idx}-l`} className="text-xs">法定休日</Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHolidayDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveHolidaySettings}>更新する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 独自休日ダイアログ */}
      <Dialog open={customHolidayDialogOpen} onOpenChange={setCustomHolidayDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] !flex !flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>独自休日設定</DialogTitle>
            <DialogDescription>事業所独自の休日を入力し「追加」をクリックしてください。</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-6 py-4">
            {/* 定期休日設定 */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">定期休日設定</h4>
              {regularHolidays.length > 0 && (
                <div className="space-y-1 max-h-[150px] overflow-y-auto mb-3">
                  {regularHolidays
                    .sort((a, b) => a.month !== b.month ? a.month - b.month : a.day - b.day)
                    .map(h => (
                      <div key={h.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{h.month}/{h.day}</span>
                          <span className="text-sm font-medium">{h.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRegularHoliday(h.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">開始</Label>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={1} max={12} placeholder="月" value={regularForm.startMonth} onChange={e => setRegularForm(f => ({ ...f, startMonth: e.target.value }))} className="w-16 h-9" />
                    <span className="text-xs">/</span>
                    <Input type="number" min={1} max={31} placeholder="日" value={regularForm.startDay} onChange={e => setRegularForm(f => ({ ...f, startDay: e.target.value }))} className="w-16 h-9" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">終了</Label>
                  <div className="flex items-center gap-1">
                    <Input type="number" min={1} max={12} placeholder="月" value={regularForm.endMonth} onChange={e => setRegularForm(f => ({ ...f, endMonth: e.target.value }))} className="w-16 h-9" />
                    <span className="text-xs">/</span>
                    <Input type="number" min={1} max={31} placeholder="日" value={regularForm.endDay} onChange={e => setRegularForm(f => ({ ...f, endDay: e.target.value }))} className="w-16 h-9" />
                  </div>
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">名称</Label>
                  <Input value={regularForm.name} onChange={e => setRegularForm(f => ({ ...f, name: e.target.value }))} placeholder="例: 年末年始休暇" className="h-9" />
                </div>
                <Button onClick={addRegularHoliday} size="sm" disabled={!regularForm.startMonth || !regularForm.startDay || !regularForm.endMonth || !regularForm.endDay || !regularForm.name}>
                  <Plus className="w-4 h-4 mr-1" />追加
                </Button>
              </div>
            </div>

            {/* 年度休日設定 */}
            <div>
              <h4 className="text-sm font-semibold text-primary mb-3">年度休日設定</h4>
              {annualHolidays.length > 0 && (
                <div className="space-y-1 max-h-[150px] overflow-y-auto mb-3">
                  {annualHolidays
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(h => (
                      <div key={h.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm">
                            {new Date(h.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                          </span>
                          <span className="text-sm font-medium">{h.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAnnualHoliday(h.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">休日</Label>
                  <Input type="date" value={annualForm.date} onChange={e => setAnnualForm(f => ({ ...f, date: e.target.value }))} className="h-9" />
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">名称</Label>
                  <Input value={annualForm.name} onChange={e => setAnnualForm(f => ({ ...f, name: e.target.value }))} placeholder="例: 年末年始休暇" className="h-9" />
                </div>
                <Button onClick={addAnnualHoliday} size="sm" disabled={!annualForm.date || !annualForm.name}>
                  <Plus className="w-4 h-4 mr-1" />追加
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setCustomHolidayDialogOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1日の所定労働時間ダイアログ */}
      <Dialog open={dailyHoursDialogOpen} onOpenChange={setDailyHoursDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>1日の所定労働時間</DialogTitle>
            <DialogDescription>基本的な1日の所定労働時間を入力し、「更新する」をクリックしてください。</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3">
              <Label>1日の所定労働時間</Label>
              <Input type="number" min={0} max={24} step={0.5} value={tempDailyHours} onChange={e => setTempDailyHours(parseFloat(e.target.value) || 0)} className="w-24" />
              <span className="text-sm text-muted-foreground">時間</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDailyHoursDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveDailyHours}>更新する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
