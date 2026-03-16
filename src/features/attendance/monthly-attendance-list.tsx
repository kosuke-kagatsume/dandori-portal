'use client';

import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Edit,
  FileText,
  Download,
  FileCheck,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store/user-store';
import { useRouter } from 'next/navigation';
import type { PunchRecord, PunchMethod } from '@/lib/store/attendance-history-store';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'remote' | 'holiday' | 'weekend' | 'late' | 'early_leave';
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;
  workHours?: number;
  overtime?: number;
  workLocation?: 'office' | 'home' | 'client' | 'other';
  workPattern?: string;
  note?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  // 追加フィールド（Phase 2要件）
  attendanceType?: string; // 勤怠区分
  scheduledHours?: number; // 所定
  scheduledOvertime?: number; // 所定外
  legalOvertime?: number; // 法定外
  nightScheduled?: number; // 深夜所定
  nightOvertime?: number; // 深夜所定外
  nightLegalOvertime?: number; // 深夜法定外
  lateMinutes?: number; // 遅刻（分）
  earlyLeaveMinutes?: number; // 早退（分）
  deemedScheduled?: number; // 休憩みなし所定
  deemedOvertime?: number; // 休憩みなし所定外
  deemedLegalOvertime?: number; // 休憩みなし法定外
  punchHistory?: PunchRecord[];
}

interface MonthlyAttendanceListProps {
  records: AttendanceRecord[];
  onRecordUpdate?: (date: string, updates: Partial<AttendanceRecord>) => Promise<void> | void;
  onMonthChange?: (startDate: string, endDate: string) => void;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// B3: フォールバック用パターン（APIから取得できない場合）
const DEFAULT_WORK_PATTERNS = [
  { value: 'normal', label: '通常勤務' },
  { value: 'flex', label: 'フレックス' },
  { value: 'shift_early', label: '早番' },
  { value: 'shift_late', label: '遅番' },
  { value: 'remote', label: '在宅勤務' },
  { value: 'outside', label: '事業場外みなし' },
];

// 申請タイプ
const APPLICATION_TYPES = [
  { value: 'late', label: '遅刻', icon: '⏰' },
  { value: 'early_leave', label: '早退', icon: '🏃' },
  { value: 'overtime', label: '残業', icon: '💼' },
  { value: 'early_work', label: '早出', icon: '🌅' },
  { value: 'absence', label: '欠勤', icon: '❌' },
  { value: 'leave', label: '休暇', icon: '🏖️' },
  { value: 'holiday_work', label: '休日出勤', icon: '📅' },
];

// 打刻方法のラベル変換
const PUNCH_METHOD_LABELS: Record<PunchMethod, string> = {
  manual: '手動',
  web: 'PC',
  mobile: 'GPS',
  ic_card: 'IC',
  biometric: '生体',
};

// 打刻ペア表示用の型
interface PunchPairDisplay {
  checkIn?: { time: string; method: string };
  checkOut?: { time: string; method: string };
  breakStart?: { time: string; method: string };
  breakEnd?: { time: string; method: string };
  // C2: 複数休憩対応
  breaks?: Array<{ start?: { time: string; method: string }; end?: { time: string; method: string } }>;
}

// punchHistoryから打刻ペアを抽出
function extractPunchPairs(punchHistory?: PunchRecord[]): PunchPairDisplay[] {
  if (!punchHistory || punchHistory.length === 0) return [];

  const sorted = [...punchHistory].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const pairs: PunchPairDisplay[] = [];
  let currentPair: PunchPairDisplay | null = null;
  let currentBreak: { start?: { time: string; method: string }; end?: { time: string; method: string } } | null = null;

  for (const punch of sorted) {
    const label = PUNCH_METHOD_LABELS[punch.method] || punch.method;
    if (punch.type === 'check_in') {
      if (currentPair) {
        if (currentBreak) {
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
          currentBreak = null;
        }
        pairs.push(currentPair);
      }
      currentPair = { checkIn: { time: punch.time, method: label }, breaks: [] };
    } else if (currentPair) {
      if (punch.type === 'check_out') {
        if (currentBreak) {
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
          currentBreak = null;
        }
        currentPair.checkOut = { time: punch.time, method: label };
      } else if (punch.type === 'break_start') {
        if (currentBreak) {
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
        }
        currentBreak = { start: { time: punch.time, method: label } };
        // 最初の休憩はbreakStart/breakEndにも保存（後方互換）
        if (!currentPair.breakStart) {
          currentPair.breakStart = { time: punch.time, method: label };
        }
      } else if (punch.type === 'break_end') {
        if (currentBreak) {
          currentBreak.end = { time: punch.time, method: label };
          currentPair.breaks = currentPair.breaks || [];
          currentPair.breaks.push(currentBreak);
          currentBreak = null;
        }
        if (!currentPair.breakEnd) {
          currentPair.breakEnd = { time: punch.time, method: label };
        }
      }
    }
  }

  if (currentPair) {
    if (currentBreak) {
      currentPair.breaks = currentPair.breaks || [];
      currentPair.breaks.push(currentBreak);
    }
    pairs.push(currentPair);
  }
  return pairs;
}

export function MonthlyAttendanceList({ records, onRecordUpdate, onMonthChange }: MonthlyAttendanceListProps) {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const currentUserRoles = currentUser?.roles || ['employee'];

  // 人事権限チェック
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

  // Initialize date on client side to avoid SSR/CSR hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editPunchPairs, setEditPunchPairs] = useState<Array<{checkIn: string; checkOut: string; breakStart: string; breakEnd: string}>>([]);

  // Generate days for the current month
  const monthDays = useMemo(() => {
    const date = currentDate || new Date();
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get period display string
  const periodDisplay = useMemo(() => {
    if (!currentDate) return '';
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return `${format(start, 'yyyy/MM/dd')} ～ ${format(end, 'yyyy/MM/dd')}`;
  }, [currentDate]);

  // Get record for a specific date
  const getRecordForDate = (date: Date): AttendanceRecord | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return records.find(r => r.date === dateStr || r.date.startsWith(dateStr));
  };

  // Navigate months
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

  // Handle detail view click
  const handleDetailClick = (date: Date) => {
    setSelectedDate(date);
    const record = getRecordForDate(date);
    if (record) {
      setEditingRecord(record);
    } else {
      setEditingRecord({
        date: format(date, 'yyyy-MM-dd'),
        status: isWeekend(date) ? 'weekend' : 'absent',
      });
    }
    setDetailDialogOpen(true);
  };

  // C3: Handle edit click - APIから最新の打刻履歴を取得
  const handleEditClick = async (date: Date) => {
    setSelectedDate(date);
    const record = getRecordForDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');

    if (record) {
      setEditingRecord(record);

      // C3: ローカルにpunchHistoryがない場合はAPIから取得
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
      setEditingRecord({
        date: dateStr,
        status: isWeekend(date) ? 'weekend' : 'absent',
      });
      setEditPunchPairs([{ checkIn: '', checkOut: '', breakStart: '', breakEnd: '' }]);
    }
    setEditDialogOpen(true);
  };

  // Handle application click - navigate to workflow
  const handleApplicationClick = (date: Date, applicationType: string) => {
    // ワークフロー申請画面へ遷移
    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/workflow?type=${applicationType}&date=${dateStr}`);
  };

  // Save edits
  const handleSaveEdit = async () => {
    if (editingRecord && onRecordUpdate) {
      // 打刻ペアをpunchHistory形式に変換
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
        // B3: workPatternId/Name を含めて更新
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

  // Export handlers
  const handleExportPDF = () => {
    toast.info('PDF出力機能は準備中です');
  };

  const handleExportCSV = () => {
    toast.info('CSV出力機能は準備中です');
  };

  const handleClosingRequest = () => {
    setClosingDialogOpen(true);
  };


  const getStatusLabel = (status?: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return '出勤';
      case 'remote': return '在宅';
      case 'absent': return '欠勤';
      case 'late': return '遅刻';
      case 'early_leave': return '早退';
      case 'holiday': return '祝日';
      case 'weekend': return '休日';
      default: return '-';
    }
  };

  const getLocationLabel = (location?: string) => {
    switch (location) {
      case 'office': return 'オフィス';
      case 'home': return '在宅';
      case 'client': return '客先';
      case 'other': return 'その他';
      default: return '-';
    }
  };

  const getApprovalIcon = (status?: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <MinusCircle className="h-4 w-4 text-gray-300" />;
    }
  };

  // Format minutes to hours
  const formatMinutesToTime = (minutes?: number): string => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatHours = (hours?: number): string => {
    if (!hours && hours !== 0) return '-';
    return hours.toFixed(2);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 期間表示 */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth} aria-label="前月を表示">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[220px] text-center font-medium text-lg">
                {periodDisplay}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextMonth} aria-label="次月を表示">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF出力
              </Button>
              {isHR && (
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV出力
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => toast.info('一括編集機能は準備中です')} className="text-red-600 border-red-300 hover:bg-red-50">
                <Edit className="h-4 w-4 mr-2" />
                一括編集
              </Button>
              <Button variant="outline" size="sm" onClick={handleClosingRequest}>
                <FileCheck className="h-4 w-4 mr-2" />
                締め申請
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full max-h-[calc(100vh-280px)] overflow-auto">
            <div className="min-w-[1800px]">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-background">
                  <TableRow className="bg-muted/50">
                    <TableHead scope="col" className="w-[60px] text-center sticky left-0 bg-muted/50 z-30">詳細</TableHead>
                    <TableHead scope="col" className="w-[60px] text-center sticky left-[60px] bg-muted/50 z-30">編集</TableHead>
                    <TableHead scope="col" className="w-[60px] text-center sticky left-[120px] bg-muted/50 z-30">申請</TableHead>
                    <TableHead scope="col" className="w-[100px] sticky left-[180px] bg-muted/50 z-30">日付</TableHead>
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

                    // B4: sticky列の背景色を行の状態と一致させる
                    const stickyBg = cn(
                      'bg-background',
                      isToday(day) && 'bg-primary/5',
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
                        {/* 詳細 */}
                        <TableCell className={cn("text-center sticky left-0 z-10", stickyBg)}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDetailClick(day)}
                            aria-label={`${format(day, 'M月d日')}の詳細を表示`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>

                        {/* 編集 */}
                        <TableCell className={cn("text-center sticky left-[60px] z-10", stickyBg)}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditClick(day)}
                            aria-label={`${format(day, 'M月d日')}を編集`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>

                        {/* 申請 */}
                        <TableCell className={cn("text-center sticky left-[120px] z-10", stickyBg)}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${format(day, 'M月d日')}の申請メニュー`}>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {APPLICATION_TYPES.map(app => (
                                <DropdownMenuItem
                                  key={app.value}
                                  onClick={() => handleApplicationClick(day, app.value)}
                                >
                                  <span className="mr-2">{app.icon}</span>
                                  {app.label}申請
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

                        {/* 日付 */}
                        <TableCell className={cn("sticky left-[180px] z-10", stickyBg)}>
                          <div className={cn(
                            'font-medium',
                            isSunday && 'text-red-500',
                            isSaturday && 'text-blue-500'
                          )}>
                            {format(day, 'MM/dd')}（{WEEKDAY_LABELS[dayOfWeek]}）
                          </div>
                        </TableCell>

                        {/* 勤怠区分 */}
                        <TableCell className={cn("z-10", stickyBg)}>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              record?.status === 'present' && 'border-green-500 text-green-600',
                              record?.status === 'remote' && 'border-blue-500 text-blue-600',
                              record?.status === 'late' && 'border-orange-500 text-orange-600',
                              record?.status === 'early_leave' && 'border-yellow-600 text-yellow-700',
                              record?.status === 'absent' && 'border-red-500 text-red-600',
                              record?.status === 'holiday' && 'border-purple-500 text-purple-600',
                              isWeekendDay && !record?.status && 'border-gray-400 text-gray-500'
                            )}
                          >
                            {getStatusLabel(record?.status) || (isWeekendDay ? '休日' : '-')}
                          </Badge>
                        </TableCell>

                        {/* 勤怠申請状況 */}
                        <TableCell className="text-center">
                          {getApprovalIcon(record?.approvalStatus)}
                        </TableCell>

                        {/* 勤務パターン */}
                        <TableCell className="text-sm text-muted-foreground">
                          {record?.workPattern || workPatterns.find(p => p.value === record?.workPattern)?.label || '-'}
                        </TableCell>

                        {/* 出勤 */}
                        <TableCell className="text-center font-mono text-sm">
                          {hasPunchPairs ? (
                            <span><span className="text-xs text-muted-foreground">{punchPairs[0].checkIn?.method}</span> {punchPairs[0].checkIn?.time || '-'}</span>
                          ) : (
                            record?.checkIn || '-'
                          )}
                        </TableCell>

                        {/* 退勤 */}
                        <TableCell className="text-center font-mono text-sm">
                          {hasPunchPairs ? (
                            <span><span className="text-xs text-muted-foreground">{punchPairs[0].checkOut?.method}</span> {punchPairs[0].checkOut?.time || '-'}</span>
                          ) : (
                            record?.checkOut || '-'
                          )}
                        </TableCell>

                        {/* 休憩入り */}
                        <TableCell className="text-center font-mono text-sm">
                          {record?.breakStart || '-'}
                        </TableCell>

                        {/* 休憩戻り */}
                        <TableCell className="text-center font-mono text-sm">
                          {record?.breakEnd || '-'}
                        </TableCell>

                        {/* 総労働 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.workHours)}
                        </TableCell>

                        {/* 所定 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.scheduledHours)}
                        </TableCell>

                        {/* 所定外 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.overtime)}
                        </TableCell>

                        {/* 法定外 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.legalOvertime)}
                        </TableCell>

                        {/* 深夜所定 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.nightScheduled)}
                        </TableCell>

                        {/* 深夜所定外 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.nightOvertime)}
                        </TableCell>

                        {/* 深夜法定外 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.nightLegalOvertime)}
                        </TableCell>

                        {/* 遅刻 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatMinutesToTime(record?.lateMinutes)}
                        </TableCell>

                        {/* 早退 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatMinutesToTime(record?.earlyLeaveMinutes)}
                        </TableCell>

                        {/* 休憩 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatMinutesToTime(record?.breakMinutes)}
                        </TableCell>

                        {/* 休憩みなし所定 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.deemedScheduled)}
                        </TableCell>

                        {/* 休憩みなし所定外 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.deemedOvertime)}
                        </TableCell>

                        {/* 休憩みなし法定外 */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatHours(record?.deemedLegalOvertime)}
                        </TableCell>

                        {/* 備考 */}
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {record?.note || '-'}
                        </TableCell>
                      </TableRow>
                      {/* C4: 複数打刻の追加行 */}
                      {punchPairs.slice(1).map((pair, idx) => (
                        <TableRow
                          key={`${day.toISOString()}-pair-${idx}`}
                          className={cn(
                            'hover:bg-muted/30',
                            (isSunday || record?.status === 'holiday') && 'bg-red-50 dark:bg-red-950/20',
                            isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                          )}
                        >
                          <TableCell className={cn("sticky left-0 z-10", stickyBg)} />
                          <TableCell className={cn("sticky left-[60px] z-10", stickyBg)} />
                          <TableCell className={cn("sticky left-[120px] z-10", stickyBg)} />
                          <TableCell className={cn("sticky left-[180px] z-10", stickyBg)}>
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
                          <TableCell className="text-center font-mono text-sm">
                            {pair.breakStart?.time || '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {pair.breakEnd?.time || '-'}
                          </TableCell>
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              日次勤怠詳細
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4">
              {/* 就業ルール */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">就業ルール</span>
                <span className="text-sm font-medium">
                  {editingRecord.workPattern || workPatterns.find(p => p.value === editingRecord.workPattern)?.label || '通常勤務'}
                </span>
              </div>

              {/* 勤怠打刻 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  勤怠打刻
                </h4>
                {(() => {
                  const pairs = extractPunchPairs(editingRecord.punchHistory);
                  if (pairs.length > 0) {
                    return pairs.map((pair, idx) => (
                      <div key={idx} className="space-y-1">
                        {pairs.length > 1 && (
                          <div className="text-xs font-medium text-muted-foreground">{idx + 1}組目</div>
                        )}
                        <div className="border rounded-lg divide-y">
                          <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                            <div className="font-medium text-muted-foreground">打刻種別</div>
                            <div className="font-medium text-muted-foreground">打刻方法</div>
                            <div className="font-medium text-muted-foreground">打刻時間</div>
                          </div>
                          {pair.checkIn && (
                            <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                              <div>出勤</div>
                              <div>{pair.checkIn.method}</div>
                              <div className="font-mono">{pair.checkIn.time}</div>
                            </div>
                          )}
                          {pair.breakStart && (
                            <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                              <div>休憩入り</div>
                              <div>{pair.breakStart.method}</div>
                              <div className="font-mono">{pair.breakStart.time}</div>
                            </div>
                          )}
                          {pair.breakEnd && (
                            <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                              <div>休憩戻り</div>
                              <div>{pair.breakEnd.method}</div>
                              <div className="font-mono">{pair.breakEnd.time}</div>
                            </div>
                          )}
                          {pair.checkOut && (
                            <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                              <div>退勤</div>
                              <div>{pair.checkOut.method}</div>
                              <div className="font-mono">{pair.checkOut.time}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  }
                  // punchHistory がない場合は従来通り checkIn/checkOut から表示
                  return (
                    <div className="border rounded-lg divide-y">
                      <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                        <div className="font-medium text-muted-foreground">打刻種別</div>
                        <div className="font-medium text-muted-foreground">打刻方法</div>
                        <div className="font-medium text-muted-foreground">打刻時間</div>
                      </div>
                      {editingRecord.checkIn && (
                        <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                          <div>出勤</div>
                          <div>PC打刻</div>
                          <div className="font-mono">{editingRecord.checkIn}</div>
                        </div>
                      )}
                      {editingRecord.breakStart && (
                        <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                          <div>休憩入り</div>
                          <div>PC打刻</div>
                          <div className="font-mono">{editingRecord.breakStart}</div>
                        </div>
                      )}
                      {editingRecord.breakEnd && (
                        <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                          <div>休憩戻り</div>
                          <div>PC打刻</div>
                          <div className="font-mono">{editingRecord.breakEnd}</div>
                        </div>
                      )}
                      {editingRecord.checkOut && (
                        <div className="grid grid-cols-3 gap-4 p-3 text-sm">
                          <div>退勤</div>
                          <div>PC打刻</div>
                          <div className="font-mono">{editingRecord.checkOut}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* 勤怠項目 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">勤怠項目</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                    <span className="text-muted-foreground">勤怠区分</span>
                    <span>{getStatusLabel(editingRecord.status)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                    <span className="text-muted-foreground">勤務場所</span>
                    <span>{getLocationLabel(editingRecord.workLocation)}</span>
                  </div>
                </div>
              </div>

              {/* 勤務スケジュール */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">勤務スケジュール</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-muted-foreground text-xs">所定開始</div>
                    <div className="font-mono">09:00</div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-muted-foreground text-xs">所定終了</div>
                    <div className="font-mono">18:00</div>
                  </div>
                </div>
              </div>

              {/* 合計時間 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">合計時間</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-xs text-muted-foreground">総労働</div>
                    <div className="font-medium">{formatHours(editingRecord.workHours)}</div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-xs text-muted-foreground">所定</div>
                    <div className="font-medium">{formatHours(editingRecord.scheduledHours)}</div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-xs text-muted-foreground">休憩</div>
                    <div className="font-medium">{editingRecord.breakMinutes || 0}分</div>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <div className="text-xs text-muted-foreground">残業</div>
                    <div className={cn('font-medium', editingRecord.overtime && editingRecord.overtime > 0 && 'text-orange-600')}>
                      {formatHours(editingRecord.overtime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 備考 */}
              {editingRecord.note && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">備考</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                    {editingRecord.note}
                  </p>
                </div>
              )}

              {/* ワークフロー進行状況 */}
              {editingRecord.approvalStatus && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">ワークフロー進行状況</span>
                  <Badge variant={
                    editingRecord.approvalStatus === 'approved' ? 'default' :
                    editingRecord.approvalStatus === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {editingRecord.approvalStatus === 'approved' && '承認済み'}
                    {editingRecord.approvalStatus === 'pending' && '承認待ち'}
                    {editingRecord.approvalStatus === 'rejected' && '却下'}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              閉じる
            </Button>
            <Button onClick={() => {
              setDetailDialogOpen(false);
              if (selectedDate) handleEditClick(selectedDate);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              日次勤怠編集
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4">
              {/* 勤務パターン */}
              <div className="space-y-2">
                <Label>勤務パターン</Label>
                <Select
                  value={editingRecord.workPattern || 'normal'}
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, workPattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workPatterns.map(pattern => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  「事業場外みなし」を選択すると、所定労働時間が自動適用されます
                </p>
              </div>

              <Separator />

              {/* 打刻時刻 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">打刻時刻</h4>
                {editPunchPairs.map((pair, idx) => (
                  <div key={idx} className="space-y-3">
                    {idx > 0 && (
                      <div className="flex items-center gap-2">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">打刻 {idx + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditPunchPairs(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Separator className="flex-1" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{idx === 0 ? '出勤時刻' : `出勤時刻 ${idx + 1}`}</Label>
                        <Input
                          type="time"
                          value={pair.checkIn}
                          onChange={(e) => {
                            const updated = [...editPunchPairs];
                            updated[idx] = { ...updated[idx], checkIn: e.target.value };
                            setEditPunchPairs(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{idx === 0 ? '退勤時刻' : `退勤時刻 ${idx + 1}`}</Label>
                        <Input
                          type="time"
                          value={pair.checkOut}
                          onChange={(e) => {
                            const updated = [...editPunchPairs];
                            updated[idx] = { ...updated[idx], checkOut: e.target.value };
                            setEditPunchPairs(updated);
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>休憩開始</Label>
                        <Input
                          type="time"
                          value={pair.breakStart}
                          onChange={(e) => {
                            const updated = [...editPunchPairs];
                            updated[idx] = { ...updated[idx], breakStart: e.target.value };
                            setEditPunchPairs(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>休憩終了</Label>
                        <Input
                          type="time"
                          value={pair.breakEnd}
                          onChange={(e) => {
                            const updated = [...editPunchPairs];
                            updated[idx] = { ...updated[idx], breakEnd: e.target.value };
                            setEditPunchPairs(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setEditPunchPairs(prev => [...prev, { checkIn: '', checkOut: '', breakStart: '', breakEnd: '' }])}
                >
                  + 打刻を追加
                </Button>
              </div>

              <Separator />

              {/* 勤務スケジュール */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">勤務スケジュール</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>所定開始</Label>
                    <Input type="time" defaultValue="09:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>所定終了</Label>
                    <Input type="time" defaultValue="18:00" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 勤務場所 */}
              <div className="space-y-2">
                <Label>勤務場所</Label>
                <Select
                  value={editingRecord.workLocation || 'office'}
                  onValueChange={(value) => setEditingRecord({
                    ...editingRecord,
                    workLocation: value as AttendanceRecord['workLocation']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">オフィス</SelectItem>
                    <SelectItem value="home">在宅</SelectItem>
                    <SelectItem value="client">客先</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 備考 */}
              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea
                  value={editingRecord.note || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, note: e.target.value })}
                  placeholder="備考を入力..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 締め申請ダイアログ */}
      <Dialog open={closingDialogOpen} onOpenChange={setClosingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              勤怠締め申請
            </DialogTitle>
            <DialogDescription>
              {currentDate && format(currentDate, 'yyyy年M月', { locale: ja })}の勤怠を締め申請します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">対象期間</span>
                <span className="font-medium">{periodDisplay}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">出勤日数</span>
                <span className="font-medium">{records.filter(r => r.status === 'present' || r.status === 'remote').length}日</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">総労働時間</span>
                <span className="font-medium">{records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(1)}h</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>申請コメント（任意）</Label>
              <Textarea placeholder="コメントを入力..." rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClosingDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => {
              toast.success('締め申請を送信しました');
              setClosingDialogOpen(false);
            }}>
              申請する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
