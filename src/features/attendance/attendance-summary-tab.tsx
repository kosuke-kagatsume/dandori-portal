'use client';

import { useState, useMemo, useEffect } from 'react';
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

interface AttendanceSummaryTabProps {
  workRuleType?: WorkRuleType;
}

// デモデータ
const DEMO_DAY_COUNTS = {
  weekday: { attendance: 18, absence: 1, late: 1, earlyLeave: 0 },
  scheduledHoliday: { attendance: 0, absence: 0, late: 0, earlyLeave: 0 },
  legalHoliday: { attendance: 0, absence: 0, late: 0, earlyLeave: 0 },
};

const DEMO_LEAVE_COUNTS = {
  paidLeave: 2,
  sickLeave: 0,
  specialLeave: 0,
  compensatoryLeave: 1,
  otherLeave: 0,
};

const DEMO_TIME_SUMMARY = {
  weekday: {
    total: 144.0,
    scheduled: 136.0,
    overtime: 8.0,
    legalOvertime: 4.0,
    nightScheduled: 0,
    nightOvertime: 2.5,
    nightLegalOvertime: 0,
    late: 0.5,
    earlyLeave: 0,
    break: 18.0,
    deemedScheduled: 0,
    deemedOvertime: 0,
    deemedLegalOvertime: 0,
  },
  scheduledHoliday: {
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
  },
  legalHoliday: {
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
  },
};

// 1ヶ月単位変形労働制のデモデータ
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

// フレックス制のデモデータ
const DEMO_FLEX_TIME = {
  totalWorking: 165.0,
  scheduledTotal: 160.0,
  settlementPeriodTotal: 160.0,
  deductionCarryoverLimit: 0,
  deductionCarryover: 0,
  deductionCarryoverExcess: 0,
};

export function AttendanceSummaryTab({ workRuleType = 'fixed' }: AttendanceSummaryTabProps) {
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

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const date = prev || new Date();
      return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const date = prev || new Date();
      return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    });
  };

  const handleExportPDF = () => {
    toast.info('PDF出力機能は準備中です');
  };

  const formatHours = (hours: number): string => {
    return hours.toFixed(2);
  };

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
                <TableCell className="text-center">{DEMO_DAY_COUNTS.weekday.attendance}日</TableCell>
                <TableCell className="text-center">{DEMO_DAY_COUNTS.weekday.absence}日</TableCell>
                <TableCell className="text-center">{DEMO_DAY_COUNTS.weekday.late}日</TableCell>
                <TableCell className="text-center">{DEMO_DAY_COUNTS.weekday.earlyLeave}日</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">所定休日</TableCell>
                <TableCell className="text-center">
                  {DEMO_DAY_COUNTS.scheduledHoliday.attendance}日
                </TableCell>
                <TableCell className="text-center">
                  {DEMO_DAY_COUNTS.scheduledHoliday.absence}日
                </TableCell>
                <TableCell className="text-center">{DEMO_DAY_COUNTS.scheduledHoliday.late}日</TableCell>
                <TableCell className="text-center">
                  {DEMO_DAY_COUNTS.scheduledHoliday.earlyLeave}日
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">法定休日</TableCell>
                <TableCell className="text-center">{DEMO_DAY_COUNTS.legalHoliday.attendance}日</TableCell>
                <TableCell className="text-center">{DEMO_DAY_COUNTS.legalHoliday.absence}日</TableCell>
                <TableCell className="text-center">{DEMO_DAY_COUNTS.legalHoliday.late}日</TableCell>
                <TableCell className="text-center">
                  {DEMO_DAY_COUNTS.legalHoliday.earlyLeave}日
                </TableCell>
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
              <div className="text-xl font-bold">{DEMO_LEAVE_COUNTS.paidLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">病気休暇</div>
              <div className="text-xl font-bold">{DEMO_LEAVE_COUNTS.sickLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">特別休暇</div>
              <div className="text-xl font-bold">{DEMO_LEAVE_COUNTS.specialLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">代休</div>
              <div className="text-xl font-bold">{DEMO_LEAVE_COUNTS.compensatoryLeave}日</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-xs text-muted-foreground mb-1">その他休暇</div>
              <div className="text-xl font-bold">{DEMO_LEAVE_COUNTS.otherLeave}日</div>
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
                  <TableHead className="text-right">休憩みなし所定</TableHead>
                  <TableHead className="text-right">休憩みなし所定外</TableHead>
                  <TableHead className="text-right">休憩みなし法定外</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">平日</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.scheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.overtime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.legalOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.nightScheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.nightOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.nightLegalOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.late)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.earlyLeave)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.break)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.deemedScheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.deemedOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.weekday.deemedLegalOvertime)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">所定休日</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.scheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.overtime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.legalOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.nightScheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.nightOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.nightLegalOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.late)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.earlyLeave)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.break)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.deemedScheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.deemedOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.scheduledHoliday.deemedLegalOvertime)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">法定休日</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.total)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.scheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.overtime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.legalOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.nightScheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.nightOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.nightLegalOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.late)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.earlyLeave)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.break)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.deemedScheduled)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.deemedOvertime)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatHours(DEMO_TIME_SUMMARY.legalHoliday.deemedLegalOvertime)}
                  </TableCell>
                </TableRow>
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
                {formatHours(DEMO_TIME_SUMMARY.weekday.legalOvertime)}h
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">60時間超法定外（平日・所定休日）</div>
              <div className="text-2xl font-bold">0.00h</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">月間残業時間</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatHours(DEMO_TIME_SUMMARY.weekday.overtime)}h
              </div>
              <div className="text-xs text-muted-foreground">36協定上限: 45h</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">年間残業累計</div>
              <div className="text-2xl font-bold">180.00h</div>
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
