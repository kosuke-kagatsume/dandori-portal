'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3,
  Clock,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

// 就業ルールタイプ
type WorkRuleType = 'fixed' | 'hourly' | 'variable' | 'flex';

// 勤怠一覧のレコード型（page.tsxのmonthlyListRecordsと同じ）
interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'remote';
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;
  workHours: number;
  scheduledHours: number;
  overtime: number;
  legalOvertime: number;
  scheduledOvertime: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  nightScheduled: number;
  nightOvertime: number;
  nightLegalOvertime: number;
  deemedScheduled: number;
  deemedOvertime: number;
  deemedLegalOvertime: number;
  workLocation?: 'office' | 'home' | 'client' | 'other';
  workPattern?: string;
  note?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  punchHistory?: any;
}

interface AttendanceSummaryTabProps {
  workRuleType?: WorkRuleType;
  records?: AttendanceRecord[];
  onMonthChange?: (startDate: string, endDate: string) => void;
}

// 時間集計の初期値
const emptyTimeSummary = () => ({
  total: 0,
  scheduled: 0,
  overtime: 0,
  legalOvertime: 0,
  nightScheduled: 0,
  nightOvertime: 0,
  nightLegalOvertime: 0,
  late: 0,
  earlyLeave: 0,
  break: 0,
  deemedScheduled: 0,
  deemedOvertime: 0,
  deemedLegalOvertime: 0,
});

// 日付が平日/所定休日/法定休日のどれかを判定（土=所定休日, 日=法定休日, 他=平日）
function getDayCategory(dateStr: string): 'weekday' | 'scheduledHoliday' | 'legalHoliday' {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  if (dow === 0) return 'legalHoliday';
  if (dow === 6) return 'scheduledHoliday';
  return 'weekday';
}

// 1ヶ月単位変形労働制のデモデータ（実データ接続は将来対応）
const DEMO_VARIABLE_WORKING = {
  monthly: {
    standardHours: 177.1,
    legalTotal: 177.1,
    accumulatedExcludingLegal: 165.0,
  },
  weekly: [
    { week: 1, standard: 40, scheduled: 40, legalTotal: 40 },
    { week: 2, standard: 40, scheduled: 40, legalTotal: 40 },
    { week: 3, standard: 40, scheduled: 40, legalTotal: 40 },
    { week: 4, standard: 40, scheduled: 40, legalTotal: 40 },
    { week: 5, standard: 17.1, scheduled: 17.1, legalTotal: 17.1 },
  ],
};

// フレックス制のデモデータ（実データ接続は将来対応）
const DEMO_FLEX_TIME = {
  totalWorking: 165.0,
  scheduledTotal: 160.0,
  settlementPeriodTotal: 160.0,
  deductionCarryoverLimit: 0,
  deductionCarryover: 0,
  deductionCarryoverExcess: 0,
};

export function AttendanceSummaryTab({ workRuleType = 'fixed', records = [], onMonthChange }: AttendanceSummaryTabProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Get period display string
  const periodDisplay = useMemo(() => {
    if (!currentDate) return '';
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return `${format(start, 'yyyy/MM/dd')} ～ ${format(end, 'yyyy/MM/dd')}`;
  }, [currentDate]);

  // 月変更時にデータを再取得
  const changeMonth = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
    if (onMonthChange) {
      const start = startOfMonth(newDate);
      const end = endOfMonth(newDate);
      onMonthChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    }
  }, [onMonthChange]);

  const goToPreviousMonth = () => {
    const date = currentDate || new Date();
    changeMonth(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const date = currentDate || new Date();
    changeMonth(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  };

  const handleExportPDF = () => {
    toast.info('PDF出力機能は準備中です');
  };

  const formatHours = (hours: number): string => {
    return hours.toFixed(2);
  };

  // レコードから日数集計を算出
  const dayCounts = useMemo(() => {
    const counts = {
      weekday: { attendance: 0, absence: 0, late: 0, earlyLeave: 0 },
      scheduledHoliday: { attendance: 0, absence: 0, late: 0, earlyLeave: 0 },
      legalHoliday: { attendance: 0, absence: 0, late: 0, earlyLeave: 0 },
    };

    for (const r of records) {
      const cat = getDayCategory(r.date);
      switch (r.status) {
        case 'present':
        case 'remote':
          counts[cat].attendance++;
          break;
        case 'absent':
          counts[cat].absence++;
          break;
        case 'late':
          counts[cat].attendance++;
          counts[cat].late++;
          break;
        case 'early_leave':
          counts[cat].attendance++;
          counts[cat].earlyLeave++;
          break;
      }
    }
    return counts;
  }, [records]);

  // レコードから休暇集計を算出（現状はステータスベースでカウント）
  const leaveCounts = useMemo(() => {
    let totalLeave = 0;
    for (const r of records) {
      if (r.status === 'absent') totalLeave++;
    }
    return {
      paidLeave: totalLeave,
      sickLeave: 0,
      specialLeave: 0,
      compensatoryLeave: 0,
      otherLeave: 0,
    };
  }, [records]);

  // レコードから時間集計を算出
  const timeSummary = useMemo(() => {
    const summary = {
      weekday: emptyTimeSummary(),
      scheduledHoliday: emptyTimeSummary(),
      legalHoliday: emptyTimeSummary(),
    };

    for (const r of records) {
      if (r.status === 'absent') continue;
      const cat = getDayCategory(r.date);
      const s = summary[cat];
      s.total += r.workHours || 0;
      s.scheduled += r.scheduledHours || 0;
      s.overtime += r.overtime || 0;
      s.legalOvertime += r.legalOvertime || 0;
      s.nightScheduled += r.nightScheduled || 0;
      s.nightOvertime += r.nightOvertime || 0;
      s.nightLegalOvertime += r.nightLegalOvertime || 0;
      s.late += (r.lateMinutes || 0) / 60;
      s.earlyLeave += (r.earlyLeaveMinutes || 0) / 60;
      s.break += (r.breakMinutes || 0) / 60;
      s.deemedScheduled += r.deemedScheduled || 0;
      s.deemedOvertime += r.deemedOvertime || 0;
      s.deemedLegalOvertime += r.deemedLegalOvertime || 0;
    }

    return summary;
  }, [records]);

  // 法定外の合計
  const totalLegalOvertime = useMemo(() => {
    return timeSummary.weekday.legalOvertime + timeSummary.scheduledHoliday.legalOvertime;
  }, [timeSummary]);

  const totalOvertime = useMemo(() => {
    return timeSummary.weekday.overtime + timeSummary.scheduledHoliday.overtime + timeSummary.legalHoliday.overtime;
  }, [timeSummary]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 期間表示 */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[220px] text-center font-medium text-lg">{periodDisplay}</span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF出力
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 日数集計 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            日数集計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[120px]">区分</TableHead>
                <TableHead className="text-center">出勤</TableHead>
                <TableHead className="text-center">欠勤</TableHead>
                <TableHead className="text-center">遅刻</TableHead>
                <TableHead className="text-center">早退</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">平日</TableCell>
                <TableCell className="text-center">{dayCounts.weekday.attendance}日</TableCell>
                <TableCell className="text-center">{dayCounts.weekday.absence}日</TableCell>
                <TableCell className="text-center">{dayCounts.weekday.late}日</TableCell>
                <TableCell className="text-center">{dayCounts.weekday.earlyLeave}日</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">所定休日</TableCell>
                <TableCell className="text-center">{dayCounts.scheduledHoliday.attendance}日</TableCell>
                <TableCell className="text-center">{dayCounts.scheduledHoliday.absence}日</TableCell>
                <TableCell className="text-center">{dayCounts.scheduledHoliday.late}日</TableCell>
                <TableCell className="text-center">{dayCounts.scheduledHoliday.earlyLeave}日</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">法定休日</TableCell>
                <TableCell className="text-center">{dayCounts.legalHoliday.attendance}日</TableCell>
                <TableCell className="text-center">{dayCounts.legalHoliday.absence}日</TableCell>
                <TableCell className="text-center">{dayCounts.legalHoliday.late}日</TableCell>
                <TableCell className="text-center">{dayCounts.legalHoliday.earlyLeave}日</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 休暇集計 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            休暇集計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">有給休暇</div>
              <div className="text-xl font-bold">{leaveCounts.paidLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">病気休暇</div>
              <div className="text-xl font-bold">{leaveCounts.sickLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">特別休暇</div>
              <div className="text-xl font-bold">{leaveCounts.specialLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">代休</div>
              <div className="text-xl font-bold">{leaveCounts.compensatoryLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">その他休暇</div>
              <div className="text-xl font-bold">{leaveCounts.otherLeave}日</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 時間集計 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            時間集計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">区分</TableHead>
                  <TableHead className="text-right">総労働</TableHead>
                  <TableHead className="text-right">所定</TableHead>
                  <TableHead className="text-right">所定外</TableHead>
                  <TableHead className="text-right">法定外</TableHead>
                  <TableHead className="text-right">深夜所定</TableHead>
                  <TableHead className="text-right">深夜所定外</TableHead>
                  <TableHead className="text-right">深夜法定外</TableHead>
                  <TableHead className="text-right">遅刻</TableHead>
                  <TableHead className="text-right">早退</TableHead>
                  <TableHead className="text-right">休憩</TableHead>
                  <TableHead className="text-right">みなし所定</TableHead>
                  <TableHead className="text-right">みなし所定外</TableHead>
                  <TableHead className="text-right">みなし法定外</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(['weekday', 'scheduledHoliday', 'legalHoliday'] as const).map((cat) => {
                  const label = cat === 'weekday' ? '平日' : cat === 'scheduledHoliday' ? '所定休日' : '法定休日';
                  const s = timeSummary[cat];
                  return (
                    <TableRow key={cat}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.total)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.scheduled)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.overtime)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.legalOvertime)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.nightScheduled)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.nightOvertime)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.nightLegalOvertime)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.late)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.earlyLeave)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.break)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.deemedScheduled)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.deemedOvertime)}</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(s.deemedLegalOvertime)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 法定外集計 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            法定外集計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">法定外（平日・所定休日）</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatHours(totalLegalOvertime)}h
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">60時間超法定外（平日・所定休日）</div>
              <div className="text-2xl font-bold">
                {formatHours(Math.max(0, totalLegalOvertime - 60))}h
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">月間残業時間</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatHours(totalOvertime)}h
              </div>
              <div className="text-xs text-muted-foreground">36協定上限: 45h</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">年間残業累計</div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-xs text-muted-foreground">36協定上限: 360h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1ヶ月単位変形労働制セクション */}
      {workRuleType === 'variable' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              1ヶ月単位変形労働制
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 月毎 */}
            <div>
              <h4 className="text-sm font-medium mb-3">月毎</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">基準時間</div>
                  <div className="text-xl font-bold">
                    {formatHours(DEMO_VARIABLE_WORKING.monthly.standardHours)}h
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">法定労働時間総枠</div>
                  <div className="text-xl font-bold">
                    {formatHours(DEMO_VARIABLE_WORKING.monthly.legalTotal)}h
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">前月までの法定外除く労働時間合計</div>
                  <div className="text-xl font-bold">
                    {formatHours(DEMO_VARIABLE_WORKING.monthly.accumulatedExcludingLegal)}h
                  </div>
                </div>
              </div>
            </div>

            {/* 週毎 */}
            <div>
              <h4 className="text-sm font-medium mb-3">週毎</h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>週</TableHead>
                    <TableHead className="text-right">基準時間</TableHead>
                    <TableHead className="text-right">所定労働時間</TableHead>
                    <TableHead className="text-right">法定労働時間総枠</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_VARIABLE_WORKING.weekly.map((week) => (
                    <TableRow key={week.week}>
                      <TableCell className="font-medium">第{week.week}週</TableCell>
                      <TableCell className="text-right font-mono">{formatHours(week.standard)}h</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatHours(week.scheduled)}h
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatHours(week.legalTotal)}h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* フレックス制セクション */}
      {workRuleType === 'flex' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              フレックス制時間集計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">総労働時間</div>
                <div className="text-xl font-bold">{formatHours(DEMO_FLEX_TIME.totalWorking)}h</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">所定労働時間の総枠</div>
                <div className="text-xl font-bold">{formatHours(DEMO_FLEX_TIME.scheduledTotal)}h</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">清算期間における総労働時間</div>
                <div className="text-xl font-bold">{formatHours(DEMO_FLEX_TIME.settlementPeriodTotal)}h</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">控除繰越限度時間</div>
                <div className="text-xl font-bold">{formatHours(DEMO_FLEX_TIME.deductionCarryoverLimit)}h</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">控除繰越時間</div>
                <div className="text-xl font-bold">{formatHours(DEMO_FLEX_TIME.deductionCarryover)}h</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">控除繰越限度超過時間</div>
                <div className="text-xl font-bold">
                  {formatHours(DEMO_FLEX_TIME.deductionCarryoverExcess)}h
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
