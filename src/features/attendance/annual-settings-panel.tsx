'use client';

import { useState } from 'react';
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
import { CalendarDays, Plus, Trash2, Edit } from 'lucide-react';

type DayType = 'weekday' | 'prescribed_holiday' | 'legal_holiday';

interface HolidaySetting {
  day: string; // 月曜日〜祝日
  type: DayType;
}

interface CustomHoliday {
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

const DAY_LABELS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日', '祝日'];

const DAY_TYPE_LABELS: Record<DayType, string> = {
  weekday: '平日',
  prescribed_holiday: '所定休日',
  legal_holiday: '法定休日',
};

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

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

const defaultMonthlyDays: MonthlyDays[] = MONTH_NAMES.map((_, i) => ({
  month: i + 1,
  workDays: i === 1 ? 19 : i === 3 || i === 10 ? 20 : i === 4 || i === 8 ? 22 : 21,
  holidays: i === 1 ? 9 : i === 4 ? 8 : i === 8 ? 9 : 10,
  calendarDays: i === 1 ? 28 : [3, 5, 8, 10].includes(i) ? 30 : 31,
}));

const defaultPayrollMonths: PayrollMonth[] = MONTH_NAMES.map((_, i) => ({
  month: i + 1,
  closingDate: `${i === 11 ? currentYear + 1 : currentYear}/${String(i === 11 ? 1 : i + 2).padStart(2, '0')}/末`,
  paymentDate: `${i === 11 ? currentYear + 1 : currentYear}/${String(i === 11 ? 1 : i + 2).padStart(2, '0')}/25`,
  publicDate: `${i === 11 ? currentYear + 1 : currentYear}/${String(i === 11 ? 1 : i + 2).padStart(2, '0')}/24`,
  workDays: i === 1 ? 19 : i === 3 || i === 10 ? 20 : i === 4 || i === 8 ? 22 : 21,
  status: 'unconfirmed' as const,
}));

export function AnnualSettingsPanel() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [holidaySettings, setHolidaySettings] = useState<HolidaySetting[]>(defaultHolidaySettings);
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [dailyWorkHours, setDailyWorkHours] = useState(8.0);
  const [monthlyAvgDays, setMonthlyAvgDays] = useState(20.33);
  const [monthlyAvgHours, setMonthlyAvgHours] = useState(162.66);
  const [monthlyDays] = useState<MonthlyDays[]>(defaultMonthlyDays);
  const [payrollMonths] = useState<PayrollMonth[]>(defaultPayrollMonths);

  // 休日設定ダイアログ
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [tempHolidaySettings, setTempHolidaySettings] = useState<HolidaySetting[]>([]);

  // 独自休日ダイアログ
  const [customHolidayDialogOpen, setCustomHolidayDialogOpen] = useState(false);
  const [customHolidayForm, setCustomHolidayForm] = useState({ date: '', name: '' });

  // 1日の所定労働時間ダイアログ
  const [dailyHoursDialogOpen, setDailyHoursDialogOpen] = useState(false);
  const [tempDailyHours, setTempDailyHours] = useState(8.0);

  // 所定労働時間ダイアログ
  const [stdHoursDialogOpen, setStdHoursDialogOpen] = useState(false);
  const [tempAvgDays, setTempAvgDays] = useState(20.33);
  const [tempAvgHours, setTempAvgHours] = useState(162.66);

  const openHolidayDialog = () => {
    setTempHolidaySettings([...holidaySettings]);
    setHolidayDialogOpen(true);
  };

  const saveHolidaySettings = () => {
    setHolidaySettings(tempHolidaySettings);
    setHolidayDialogOpen(false);
  };

  const addCustomHoliday = () => {
    if (!customHolidayForm.date || !customHolidayForm.name) return;
    setCustomHolidays(prev => [...prev, {
      id: crypto.randomUUID(),
      ...customHolidayForm,
    }]);
    setCustomHolidayForm({ date: '', name: '' });
    setCustomHolidayDialogOpen(false);
  };

  const removeCustomHoliday = (id: string) => {
    setCustomHolidays(prev => prev.filter(h => h.id !== id));
  };

  const openDailyHoursDialog = () => {
    setTempDailyHours(dailyWorkHours);
    setDailyHoursDialogOpen(true);
  };

  const saveDailyHours = () => {
    setDailyWorkHours(tempDailyHours);
    setDailyHoursDialogOpen(false);
  };

  const openStdHoursDialog = () => {
    setTempAvgDays(monthlyAvgDays);
    setTempAvgHours(monthlyAvgHours);
    setStdHoursDialogOpen(true);
  };

  const saveStdHours = () => {
    setMonthlyAvgDays(tempAvgDays);
    setMonthlyAvgHours(tempAvgHours);
    setStdHoursDialogOpen(false);
  };

  const totalWorkDays = monthlyDays.reduce((sum, m) => sum + m.workDays, 0);
  const totalHolidays = monthlyDays.reduce((sum, m) => sum + m.holidays, 0);
  const totalCalendarDays = monthlyDays.reduce((sum, m) => sum + m.calendarDays, 0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* 年度選択 */}
      <div className="flex items-center gap-3">
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
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
        <CardContent>
          {customHolidays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              独自休日情報がありません。<br />編集ボタンから独自休日情報を登録してください。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customHolidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => (
                  <TableRow key={h.id}>
                    <TableCell>
                      {new Date(h.date).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })}
                    </TableCell>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeCustomHoliday(h.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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

      {/* 所定労働時間 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">所定労働時間</CardTitle>
            <Button variant="outline" size="sm" onClick={openStdHoursDialog}>
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">所定労働日数（月平均）</p>
              <p className="font-medium">{monthlyAvgDays}日</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">所定労働時間（月平均）</p>
              <p className="font-medium">{monthlyAvgHours}時間</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 月別日数表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <div>
              <CardTitle className="text-base">月別日数表</CardTitle>
              <CardDescription>休日設定・独自休日設定をもとに算出された月別の労働日数・休日数</CardDescription>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>独自休日設定</DialogTitle>
            <DialogDescription>事業所独自の休日を入力し「追加」をクリックしてください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {customHolidays.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {customHolidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{h.date}</span>
                      <span className="text-sm font-medium">{h.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeCustomHoliday(h.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-[140px_1fr_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">休日</Label>
                <Input
                  type="date"
                  value={customHolidayForm.date}
                  onChange={e => setCustomHolidayForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">名称</Label>
                <Input
                  value={customHolidayForm.name}
                  onChange={e => setCustomHolidayForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例: 年末年始休暇"
                />
              </div>
              <Button onClick={addCustomHoliday} size="sm" disabled={!customHolidayForm.date || !customHolidayForm.name}>
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCustomHolidayDialogOpen(false)}>閉じる</Button>
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
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={tempDailyHours}
                onChange={e => setTempDailyHours(parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">時間</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDailyHoursDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveDailyHours}>更新する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 所定労働時間ダイアログ */}
      <Dialog open={stdHoursDialogOpen} onOpenChange={setStdHoursDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>所定労働時間</DialogTitle>
            <DialogDescription>1ヶ月の所定労働日数・所定労働時間を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">所定労働日数（月平均）</Label>
              <Input
                type="number"
                min={0}
                max={31}
                step={0.01}
                value={tempAvgDays}
                onChange={e => setTempAvgDays(parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">日</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">所定労働時間（月平均）</Label>
              <Input
                type="number"
                min={0}
                max={250}
                step={0.01}
                value={tempAvgHours}
                onChange={e => setTempAvgHours(parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">時間</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStdHoursDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveStdHours}>更新する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
