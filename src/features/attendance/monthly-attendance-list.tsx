'use client';

import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft, ChevronRight, Eye, Edit, FileText, Download, FileCheck, ChevronDown,
  AlertCircle, CheckCircle2, XCircle, MinusCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store/user-store';
import { useRouter } from 'next/navigation';
import type { PunchRecord } from '@/lib/store/attendance-history-store';
import type { MonthlyAttendanceListProps, AttendanceRecord } from '@/lib/attendance/monthly-attendance-helpers';
import {
  WEEKDAY_LABELS, DEFAULT_WORK_PATTERNS, APPLICATION_TYPES,
  extractPunchPairs, getAttendanceStatusLabel, formatMinutesToTime, formatHours,
} from '@/lib/attendance/monthly-attendance-helpers';
import {
  AttendanceDetailDialog, AttendanceEditDialog, AttendanceClosingDialog,
} from './monthly-attendance-dialogs';

export type { AttendanceRecord, MonthlyAttendanceListProps };

export function MonthlyAttendanceList({ records, onRecordUpdate, onMonthChange }: MonthlyAttendanceListProps) {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const currentUserRoles = currentUser?.roles || ['employee'];
  const isHR = currentUserRoles.some((role: string) => ['hr', 'executive', 'system_admin'].includes(role));

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // B3: APIから勤務パターンを取得
  const [workPatterns, setWorkPatterns] = useState<Array<{ value: string; label: string }>>([]);
  useEffect(() => {
    fetch('/api/attendance-master/work-patterns?activeOnly=true')
      .then(res => res.json())
      .then(result => {
        const patterns = result.data?.patterns;
        if (patterns && patterns.length > 0) {
          setWorkPatterns(patterns.map((p: { id: string; name: string }) => ({ value: p.id, label: p.name })));
        } else {
          setWorkPatterns(DEFAULT_WORK_PATTERNS);
        }
      })
      .catch(() => setWorkPatterns(DEFAULT_WORK_PATTERNS));
  }, []);

  useEffect(() => { setCurrentDate(new Date()); }, []);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editPunchPairs, setEditPunchPairs] = useState<Array<{checkIn: string; checkOut: string; breakStart: string; breakEnd: string}>>([]);

  const monthDays = useMemo(() => {
    const date = currentDate || new Date();
    return eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
  }, [currentDate]);

  const periodDisplay = useMemo(() => {
    if (!currentDate) return '';
    return `${format(startOfMonth(currentDate), 'yyyy/MM/dd')} ～ ${format(endOfMonth(currentDate), 'yyyy/MM/dd')}`;
  }, [currentDate]);

  const getRecordForDate = (date: Date): AttendanceRecord | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find(r => r.date === dateStr || r.date.startsWith(dateStr));
  };

  const notifyMonthChange = useCallback((newDate: Date) => {
    if (!onMonthChange) return;
    const y = newDate.getFullYear();
    const m = newDate.getMonth();
    const startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const endDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    onMonthChange(startDate, endDate);
  }, [onMonthChange]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const date = prev || new Date();
      const newDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      notifyMonthChange(newDate);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const date = prev || new Date();
      const newDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      notifyMonthChange(newDate);
      return newDate;
    });
  };

  const handleDetailClick = (date: Date) => {
    setSelectedDate(date);
    const record = getRecordForDate(date);
    setEditingRecord(record || { date: format(date, 'yyyy-MM-dd'), status: isWeekend(date) ? 'weekend' : 'absent' });
    setDetailDialogOpen(true);
  };

  // C3: Handle edit click - APIから最新の打刻履歴を取得
  const handleEditClick = async (date: Date) => {
    setSelectedDate(date);
    const record = getRecordForDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');

    if (record) {
      setEditingRecord(record);

      let pairs = extractPunchPairs(record.punchHistory);
      if (pairs.length === 0 && currentUser?.id) {
        try {
          const res = await fetch(`/api/attendance/punches?userId=${currentUser.id}&date=${dateStr}`);
          if (res.ok) {
            const result = await res.json();
            const punches = result.data?.punches || [];
            if (punches.length > 0) {
              const punchRecords: PunchRecord[] = punches.map((p: { id: string; punchType: string; punchTime: string }) => ({
                id: p.id,
                type: p.punchType as PunchRecord['type'],
                time: new Date(p.punchTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }),
                method: 'web' as const,
                createdAt: p.punchTime,
              }));
              pairs = extractPunchPairs(punchRecords);
            }
          }
        } catch {
          // APIエラーはフォールバック
        }
      }

      if (pairs.length > 0) {
        setEditPunchPairs(pairs.map(p => ({
          checkIn: p.checkIn?.time || '',
          checkOut: p.checkOut?.time || '',
          breakStart: p.breakStart?.time || '',
          breakEnd: p.breakEnd?.time || '',
        })));
      } else {
        setEditPunchPairs([{
          checkIn: record.checkIn || '',
          checkOut: record.checkOut || '',
          breakStart: record.breakStart || '',
          breakEnd: record.breakEnd || '',
        }]);
      }
    } else {
      setEditingRecord({ date: dateStr, status: isWeekend(date) ? 'weekend' : 'absent' });
      setEditPunchPairs([{ checkIn: '', checkOut: '', breakStart: '', breakEnd: '' }]);
    }
    setEditDialogOpen(true);
  };

  const handleApplicationClick = (date: Date, applicationType: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/workflow?type=${applicationType}&date=${dateStr}`);
  };

  const handleSaveEdit = async () => {
    if (editingRecord && onRecordUpdate) {
      const punchHistory: PunchRecord[] = editPunchPairs.flatMap((pair, idx) => {
        const punchRecords: PunchRecord[] = [];
        const now = new Date().toISOString();
        if (pair.checkIn) punchRecords.push({ id: `edit-${Date.now()}-ci-${idx}`, type: 'check_in', time: pair.checkIn, method: 'manual', createdAt: now });
        if (pair.checkOut) punchRecords.push({ id: `edit-${Date.now()}-co-${idx}`, type: 'check_out', time: pair.checkOut, method: 'manual', createdAt: now });
        if (pair.breakStart) punchRecords.push({ id: `edit-${Date.now()}-bs-${idx}`, type: 'break_start', time: pair.breakStart, method: 'manual', createdAt: now });
        if (pair.breakEnd) punchRecords.push({ id: `edit-${Date.now()}-be-${idx}`, type: 'break_end', time: pair.breakEnd, method: 'manual', createdAt: now });
        return punchRecords;
      });

      try {
        const selectedPattern = workPatterns.find(p => p.value === editingRecord.workPattern || p.label === editingRecord.workPattern);
        await onRecordUpdate(editingRecord.date, {
          ...editingRecord,
          checkIn: editPunchPairs[0]?.checkIn || undefined,
          checkOut: editPunchPairs[0]?.checkOut || undefined,
          breakStart: editPunchPairs[0]?.breakStart || '',
          breakEnd: editPunchPairs[0]?.breakEnd || '',
          punchHistory,
          ...(selectedPattern && {
            workPatternId: selectedPattern.value,
            workPatternName: selectedPattern.label,
          }),
        } as Partial<AttendanceRecord> & { workPatternId?: string; workPatternName?: string });
        toast.success('勤怠記録を更新しました');
      } catch {
        toast.error('勤怠記録の更新に失敗しました');
        return;
      }
    }
    setEditDialogOpen(false);
    setEditingRecord(null);
  };

  const getApprovalIcon = (status?: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <MinusCircle className="h-4 w-4 text-gray-300" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth} aria-label="前月を表示">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[220px] text-center font-medium text-lg">{periodDisplay}</span>
              <Button variant="outline" size="icon" onClick={goToNextMonth} aria-label="次月を表示">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info('PDF出力機能は準備中です')}>
                <FileText className="h-4 w-4 mr-2" />PDF出力
              </Button>
              {isHR && (
                <Button variant="outline" size="sm" onClick={() => toast.info('CSV出力機能は準備中です')}>
                  <Download className="h-4 w-4 mr-2" />CSV出力
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => toast.info('一括編集機能は準備中です')}>
                <Edit className="h-4 w-4 mr-2" />一括編集
              </Button>
              <Button variant="outline" size="sm" onClick={() => setClosingDialogOpen(true)}>
                <FileCheck className="h-4 w-4 mr-2" />締め申請
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full max-h-[calc(100vh-280px)] overflow-auto">
            <div className="min-w-[1800px]">
              <Table containerClassName="overflow-visible">
                <TableHeader className="sticky top-0 z-20 bg-background">
                  <TableRow className="bg-muted/50">
                    <TableHead scope="col" className="w-[50px] min-w-[50px] max-w-[50px] text-center sticky left-0 bg-muted z-30">詳細</TableHead>
                    <TableHead scope="col" className="w-[50px] min-w-[50px] max-w-[50px] text-center sticky left-[50px] bg-muted z-30">編集</TableHead>
                    <TableHead scope="col" className="w-[50px] min-w-[50px] max-w-[50px] text-center sticky left-[100px] bg-muted z-30">申請</TableHead>
                    <TableHead scope="col" className="w-[100px] min-w-[100px] max-w-[100px] sticky left-[150px] bg-muted z-30">日付</TableHead>
                    <TableHead scope="col" className="w-[80px] bg-muted/50">勤怠区分</TableHead>
                    <TableHead scope="col" className="w-[80px] text-center">申請状況</TableHead>
                    <TableHead scope="col" className="w-[100px]">勤務パターン</TableHead>
                    <TableHead scope="col" className="w-[60px] text-center">出勤</TableHead>
                    <TableHead scope="col" className="w-[60px] text-center">退勤</TableHead>
                    <TableHead scope="col" className="w-[60px] text-center">休憩入り</TableHead>
                    <TableHead scope="col" className="w-[60px] text-center">休憩戻り</TableHead>
                    <TableHead scope="col" className="w-[60px] text-right">総労働</TableHead>
                    <TableHead scope="col" className="w-[60px] text-right">所定</TableHead>
                    <TableHead scope="col" className="w-[60px] text-right">所定外</TableHead>
                    <TableHead scope="col" className="w-[60px] text-right">法定外</TableHead>
                    <TableHead scope="col" className="w-[70px] text-right">深夜所定</TableHead>
                    <TableHead scope="col" className="w-[80px] text-right">深夜所定外</TableHead>
                    <TableHead scope="col" className="w-[80px] text-right">深夜法定外</TableHead>
                    <TableHead scope="col" className="w-[60px] text-right">遅刻</TableHead>
                    <TableHead scope="col" className="w-[60px] text-right">早退</TableHead>
                    <TableHead scope="col" className="w-[60px] text-right">休憩</TableHead>
                    <TableHead scope="col" className="w-[90px] text-right">休憩みなし所定</TableHead>
                    <TableHead scope="col" className="w-[100px] text-right">休憩みなし所定外</TableHead>
                    <TableHead scope="col" className="w-[100px] text-right">休憩みなし法定外</TableHead>
                    <TableHead scope="col" className="w-[150px]">備考</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthDays.map(day => {
                    const record = getRecordForDate(day);
                    const dayOfWeek = getDay(day);
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;
                    const isWeekendDay = isSunday || isSaturday;
                    const punchPairs = extractPunchPairs(record?.punchHistory);
                    const hasPunchPairs = punchPairs.length > 0;

                    const stickyBg = cn(
                      'bg-background',
                      isToday(day) && 'bg-blue-50 dark:bg-blue-950/20',
                      (isSunday || record?.status === 'holiday') && 'bg-red-50 dark:bg-red-950/20',
                      isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                    );

                    return (
                      <Fragment key={day.toISOString()}>
                      <TableRow
                        className={cn(
                          'hover:bg-muted/30',
                          isToday(day) && 'bg-primary/5',
                          (isSunday || record?.status === 'holiday') && 'bg-red-50 dark:bg-red-950/20',
                          isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                        )}
                      >
                        <TableCell className={cn("w-[50px] min-w-[50px] max-w-[50px] text-center sticky left-0 z-10", stickyBg)}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDetailClick(day)} aria-label={`${format(day, 'M月d日')}の詳細を表示`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className={cn("w-[50px] min-w-[50px] max-w-[50px] text-center sticky left-[50px] z-10", stickyBg)}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(day)} aria-label={`${format(day, 'M月d日')}を編集`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className={cn("w-[50px] min-w-[50px] max-w-[50px] text-center sticky left-[100px] z-10", stickyBg)}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${format(day, 'M月d日')}の申請メニュー`}>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {APPLICATION_TYPES.map(app => (
                                <DropdownMenuItem key={app.value} onClick={() => handleApplicationClick(day, app.value)}>
                                  <span className="mr-2">{app.icon}</span>{app.label}申請
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className={cn("w-[100px] min-w-[100px] max-w-[100px] sticky left-[150px] z-10", stickyBg)}>
                          <div className={cn('font-medium', isSunday && 'text-red-500', isSaturday && 'text-blue-500')}>
                            {format(day, 'MM/dd')}（{WEEKDAY_LABELS[dayOfWeek]}）
                          </div>
                        </TableCell>
                        <TableCell className={cn("z-10", stickyBg)}>
                          <Badge variant="outline" className={cn(
                            'text-xs',
                            record?.status === 'present' && 'border-green-500 text-green-600',
                            record?.status === 'remote' && 'border-blue-500 text-blue-600',
                            record?.status === 'late' && 'border-orange-500 text-orange-600',
                            record?.status === 'early_leave' && 'border-yellow-600 text-yellow-700',
                            record?.status === 'absent' && 'border-red-500 text-red-600',
                            record?.status === 'holiday' && 'border-purple-500 text-purple-600',
                            isWeekendDay && !record?.status && 'border-gray-400 text-gray-500'
                          )}>
                            {getAttendanceStatusLabel(record?.status) || (isWeekendDay ? '休日' : '-')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{getApprovalIcon(record?.approvalStatus)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record?.workPattern || workPatterns.find(p => p.value === record?.workPattern)?.label || '-'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {hasPunchPairs ? (
                            <span><span className="text-xs text-muted-foreground">{punchPairs[0].checkIn?.method}</span> {punchPairs[0].checkIn?.time || '-'}</span>
                          ) : (record?.checkIn || '-')}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {hasPunchPairs ? (
                            <span><span className="text-xs text-muted-foreground">{punchPairs[0].checkOut?.method}</span> {punchPairs[0].checkOut?.time || '-'}</span>
                          ) : (record?.checkOut || '-')}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">{record?.breakStart || '-'}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{record?.breakEnd || '-'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.workHours)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.scheduledHours)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.overtime)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.legalOvertime)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.nightScheduled)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.nightOvertime)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.nightLegalOvertime)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatMinutesToTime(record?.lateMinutes)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatMinutesToTime(record?.earlyLeaveMinutes)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatMinutesToTime(record?.breakMinutes)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.deemedScheduled)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.deemedOvertime)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatHours(record?.deemedLegalOvertime)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{record?.note || '-'}</TableCell>
                      </TableRow>
                      {punchPairs.slice(1).map((pair, idx) => (
                        <TableRow
                          key={`${day.toISOString()}-pair-${idx}`}
                          className={cn(
                            'hover:bg-muted/30',
                            (isSunday || record?.status === 'holiday') && 'bg-red-50 dark:bg-red-950/20',
                            isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                          )}
                        >
                          <TableCell className={cn("w-[50px] min-w-[50px] max-w-[50px] sticky left-0 z-10", stickyBg)} />
                          <TableCell className={cn("w-[50px] min-w-[50px] max-w-[50px] sticky left-[50px] z-10", stickyBg)} />
                          <TableCell className={cn("w-[50px] min-w-[50px] max-w-[50px] sticky left-[100px] z-10", stickyBg)} />
                          <TableCell className={cn("w-[100px] min-w-[100px] max-w-[100px] sticky left-[150px] z-10", stickyBg)}>
                            <span className="text-xs text-muted-foreground">{idx + 2}回目</span>
                          </TableCell>
                          <TableCell className={cn("z-10", stickyBg)} />
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-center font-mono text-sm">
                            {pair.checkIn ? (
                              <span><span className="text-xs text-muted-foreground">{pair.checkIn.method}</span> {pair.checkIn.time}</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {pair.checkOut ? (
                              <span><span className="text-xs text-muted-foreground">{pair.checkOut.method}</span> {pair.checkOut.time}</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">{pair.breakStart?.time || '-'}</TableCell>
                          <TableCell className="text-center font-mono text-sm">{pair.breakEnd?.time || '-'}</TableCell>
                          {Array.from({ length: 14 }, (_, i) => (
                            <TableCell key={i} />
                          ))}
                        </TableRow>
                      ))}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        selectedDate={selectedDate}
        editingRecord={editingRecord}
        workPatterns={workPatterns}
        onEditClick={() => {
          setDetailDialogOpen(false);
          if (selectedDate) handleEditClick(selectedDate);
        }}
      />

      <AttendanceEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        selectedDate={selectedDate}
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        editPunchPairs={editPunchPairs}
        setEditPunchPairs={setEditPunchPairs}
        workPatterns={workPatterns}
        onSave={handleSaveEdit}
      />

      <AttendanceClosingDialog
        open={closingDialogOpen}
        onOpenChange={setClosingDialogOpen}
        currentDate={currentDate}
        periodDisplay={periodDisplay}
        records={records}
        onSubmit={() => {
          toast.success('締め申請を送信しました');
          setClosingDialogOpen(false);
        }}
      />
    </>
  );
}
