'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useShiftStore } from '@/lib/store/shift-store';
import { useUserStore } from '@/lib/store/user-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Download,
  Upload,
  FileText,
  Table as TableIcon,
  GanttChart,
  Trash2,
  Wand2,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWeekend } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTenantStore } from '@/lib/store';
import { useOrganizationStore } from '@/lib/store/organization-store';

interface TeamMember {
  id: string;
  name: string;
  department: string;
}

// API取得したシフト割り当て
interface ApiShiftAssignment {
  id: string;
  tenantId: string;
  userId: string;
  date: string;
  patternId: string;
  attendanceType: string;
  memo?: string;
}

// API取得した勤務パターン
interface ApiWorkPattern {
  id: string;
  name: string;
  code: string;
  workStartTime: string;
  workEndTime: string;
  breakDurationMinutes: number;
  workingMinutes: number;
  isNightShift: boolean;
  isActive: boolean;
  sortOrder: number;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const DEPARTMENTS = [
  { value: 'all', label: 'すべての部署' },
  { value: 'sales', label: '営業部' },
  { value: 'engineering', label: '開発部' },
  { value: 'hr', label: '人事部' },
  { value: 'general', label: '総務部' },
];

const ATTENDANCE_TYPES = [
  { value: 'weekday', label: '平日' },
  { value: 'prescribed_holiday', label: '所定休日' },
  { value: 'legal_holiday', label: '法定休日' },
];

// パターン色のデフォルト（APIのパターンに色がない場合用）
const PATTERN_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16',
];

export function ShiftManagement() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;
  const currentUserRoles = currentUser?.roles || ['employee'];

  const isHR = currentUserRoles.some((role: string) => ['hr', 'executive', 'system_admin'].includes(role));
  const isManager = currentUserRoles.some((role: string) => ['manager', 'hr', 'executive'].includes(role));
  const canEdit = isHR || isManager;

  const { getTeamMembersForManager } = useOrganizationStore();

  // ローカルストアのパターンもフォールバック用に取得
  const { getActiveWorkPatterns } = useShiftStore();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pattern');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // API取得データ
  const [apiShifts, setApiShifts] = useState<ApiShiftAssignment[]>([]);
  const [apiPatterns, setApiPatterns] = useState<ApiWorkPattern[]>([]);

  // 編集ダイアログ
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ userId: string; userName: string; date: string } | null>(null);
  const [editPatternId, setEditPatternId] = useState<string>('');
  const [editAttendanceType, setEditAttendanceType] = useState<string>('weekday');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }, []);

  // チームメンバー取得
  const fetchTeamMembers = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      let allUsers: Array<{ id: string; name: string; department: string | null }> = [];
      let page = 1;
      const pageLimit = 200;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/users?tenantId=${tenantId}&limit=${pageLimit}&page=${page}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            allUsers = allUsers.concat(data.data);
            hasMore = data.data.length >= pageLimit;
            page++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      if (allUsers.length > 0) {
        setTeamMembers(allUsers.map((u) => ({
          id: u.id,
          name: u.name,
          department: u.department || '未設定',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // APIからシフトデータ取得
  const fetchShifts = useCallback(async () => {
    if (!currentDate) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    try {
      const res = await fetch(`/api/attendance/shifts?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setApiShifts(data.data.shifts || []);
          setApiPatterns(data.data.patterns || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // 勤務パターン（API優先、ローカルストアフォールバック）
  const localPatterns = useMemo(() => getActiveWorkPatterns(), [getActiveWorkPatterns]);

  const workPatterns = useMemo(() => {
    if (apiPatterns.length > 0) {
      return apiPatterns.map((p, i) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        startTime: p.workStartTime,
        endTime: p.workEndTime,
        breakMinutes: p.breakDurationMinutes,
        workMinutes: p.workingMinutes,
        color: PATTERN_COLORS[i % PATTERN_COLORS.length],
        isNightShift: p.isNightShift,
      }));
    }
    return localPatterns.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      startTime: p.startTime,
      endTime: p.endTime,
      breakMinutes: p.breakMinutes,
      workMinutes: p.workMinutes,
      color: p.color,
      isNightShift: false,
    }));
  }, [apiPatterns, localPatterns]);

  const monthDays = useMemo(() => {
    if (!currentDate) return [];
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }, [currentDate]);

  const periodDisplay = useMemo(() => {
    if (!currentDate) return '';
    return `${format(startOfMonth(currentDate), 'yyyy/MM/dd')} ～ ${format(endOfMonth(currentDate), 'yyyy/MM/dd')}`;
  }, [currentDate]);

  // シフトマップ（API優先）
  const shiftMap = useMemo(() => {
    const map = new Map<string, { patternId: string; attendanceType: string }>();
    apiShifts.forEach((s) => {
      const dateStr = typeof s.date === 'string' ? s.date.split('T')[0] : format(new Date(s.date), 'yyyy-MM-dd');
      map.set(`${s.userId}-${dateStr}`, { patternId: s.patternId, attendanceType: s.attendanceType });
    });
    return map;
  }, [apiShifts]);

  // 権限フィルタ
  const roleFilteredMembers = useMemo(() => {
    if (isHR) return teamMembers;
    if (isManager && currentUser) {
      const subordinateIds = getTeamMembersForManager(currentUser.id).map(m => m.id);
      return teamMembers.filter(m => subordinateIds.includes(m.id));
    }
    return teamMembers.filter(m => m.department === (currentUser as { department?: string } | null)?.department);
  }, [teamMembers, isHR, isManager, currentUser, getTeamMembersForManager]);

  const filteredMembers = useMemo(() => {
    if (departmentFilter === 'all') return roleFilteredMembers;
    return roleFilteredMembers.filter(m => m.department === DEPARTMENTS.find(d => d.value === departmentFilter)?.label);
  }, [roleFilteredMembers, departmentFilter]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const date = prev || new Date();
      return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const date = prev || new Date();
      return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    });
  };

  const getDefaultAttendanceType = (date: Date) => {
    const dayOfWeek = getDay(date);
    if (dayOfWeek === 0) return 'legal_holiday';
    if (dayOfWeek === 6) return 'prescribed_holiday';
    return 'weekday';
  };

  // セルクリック → 編集ダイアログ
  const handleCellClick = (member: TeamMember, day: Date) => {
    if (!canEdit) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = shiftMap.get(`${member.id}-${dateStr}`);

    setEditTarget({ userId: member.id, userName: member.name, date: dateStr });
    setEditPatternId(existing?.patternId || '');
    setEditAttendanceType(existing?.attendanceType || getDefaultAttendanceType(day));
    setEditDialogOpen(true);
  };

  // 保存
  const handleSaveShift = async () => {
    if (!editTarget || !editPatternId) {
      toast.error('勤務パターンを選択してください');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/attendance/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editTarget.userId,
          date: editTarget.date,
          patternId: editPatternId,
          attendanceType: editAttendanceType,
        }),
      });

      if (res.ok) {
        toast.success('シフトを登録しました');
        setEditDialogOpen(false);
        await fetchShifts(); // リロード
      } else {
        const err = await res.json();
        toast.error(`登録失敗: ${err.error || '不明なエラー'}`);
      }
    } catch {
      toast.error('シフト登録に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 削除
  const handleDeleteShift = async () => {
    if (!editTarget) return;

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/attendance/shifts?userId=${editTarget.userId}&date=${editTarget.date}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('シフトを削除しました');
        setEditDialogOpen(false);
        await fetchShifts();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch {
      toast.error('シフト削除に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 自動シフト生成
  const handleAutoGenerate = async () => {
    if (!currentDate) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
      const res = await fetch('/api/attendance/shifts/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, overwrite: false }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.data.message);
        await fetchShifts();
      } else {
        toast.error('自動生成に失敗しました');
      }
    } catch {
      toast.error('自動生成に失敗しました');
    }
  };

  const handleExportCSV = () => toast.info('CSV出力機能は準備中です');
  const handleImportCSV = () => toast.info('CSV取込機能は準備中です');
  const handleExportPDF = () => toast.info('PDF出力機能は準備中です');

  // 時間帯シフト用
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
  };

  const getTimeWidth = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (((endH * 60 + endM) - (startH * 60 + startM)) / (24 * 60)) * 100;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">シフトデータを読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pattern" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            パターンシフト表
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <GanttChart className="h-4 w-4" />
            時間帯シフト
          </TabsTrigger>
        </TabsList>

        {/* パターンシフト表 */}
        <TabsContent value="pattern" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[220px] text-center font-medium text-lg">
                    {periodDisplay}
                  </span>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="部署" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV出力
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleImportCSV}>
                        <Upload className="h-4 w-4 mr-2" />
                        CSV取込
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <FileText className="h-4 w-4 mr-2" />
                        PDF出力
                      </Button>
                      <Button size="sm" onClick={handleAutoGenerate}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        自動生成
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full max-h-[calc(100vh-250px)] overflow-auto">
                <div className="min-w-[1600px]">
                  <Table containerClassName="overflow-visible">
                    <TableHeader className="sticky top-0 z-40 bg-background shadow-sm">
                      <TableRow className="bg-muted">
                        <TableHead className="w-[120px] min-w-[120px] sticky left-0 bg-muted z-50">氏名</TableHead>
                        {monthDays.map(day => {
                          const dayOfWeek = getDay(day);
                          const isSunday = dayOfWeek === 0;
                          const isSaturday = dayOfWeek === 6;

                          return (
                            <TableHead
                              key={day.toISOString()}
                              className={cn(
                                'w-[55px] text-center text-xs p-1',
                                isSunday && 'text-red-500 bg-red-50 dark:bg-red-950/20',
                                isSaturday && 'text-blue-500 bg-blue-50 dark:bg-blue-950/20'
                              )}
                            >
                              <div>{format(day, 'd')}</div>
                              <div className="text-[10px]">{WEEKDAY_LABELS[dayOfWeek]}</div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={1 + monthDays.length} className="text-center py-8 text-muted-foreground">
                            メンバーが見つかりません
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMembers.map(member => (
                          <TableRow key={member.id}>
                            <TableCell className="w-[120px] min-w-[120px] font-medium sticky left-0 bg-background z-10">
                              <div className="truncate">{member.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{member.department}</div>
                            </TableCell>
                            {monthDays.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const shift = shiftMap.get(`${member.id}-${dateStr}`);
                              const dayOfWeek = getDay(day);
                              const isWeekendDay = isWeekend(day);
                              const pattern = shift
                                ? workPatterns.find(p => p.id === shift.patternId)
                                : null;

                              return (
                                <TableCell
                                  key={dateStr}
                                  className={cn(
                                    'text-center p-1 text-[10px]',
                                    dayOfWeek === 0 && 'bg-red-50 dark:bg-red-950/20',
                                    dayOfWeek === 6 && 'bg-blue-50 dark:bg-blue-950/20',
                                    canEdit && 'cursor-pointer hover:bg-muted/50 transition-colors'
                                  )}
                                  onClick={() => handleCellClick(member, day)}
                                >
                                  {pattern ? (
                                    <div className="space-y-0.5">
                                      <div className={cn(
                                        'text-[9px] text-muted-foreground',
                                        isWeekendDay && 'text-gray-400'
                                      )}>
                                        {ATTENDANCE_TYPES.find(t => t.value === (shift?.attendanceType || getDefaultAttendanceType(day)))?.label}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-normal px-1 py-0"
                                        style={{
                                          backgroundColor: pattern.color,
                                          color: 'white',
                                          borderColor: pattern.color,
                                        }}
                                      >
                                        {pattern.code || pattern.name.slice(0, 2)}
                                      </Badge>
                                    </div>
                                  ) : isWeekendDay ? (
                                    <span className="text-gray-400">-</span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 凡例 */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  勤務パターン:
                </div>
                {workPatterns.slice(0, 8).map((pattern) => (
                  <div key={pattern.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: pattern.color }}
                    />
                    <span className="text-sm">{pattern.code || pattern.name.slice(0, 2)}: {pattern.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 時間帯シフト */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[200px] justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {selectedDate ? format(selectedDate, 'yyyy年MM月dd日', { locale: ja }) : '日付を選択'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate || undefined}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(prev => {
                      if (!prev) return new Date();
                      const newDate = new Date(prev);
                      newDate.setDate(newDate.getDate() - 1);
                      return newDate;
                    })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(prev => {
                      if (!prev) return new Date();
                      const newDate = new Date(prev);
                      newDate.setDate(newDate.getDate() + 1);
                      return newDate;
                    })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="部署" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF出力
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full max-h-[calc(100vh-250px)] overflow-auto">
                <div className="min-w-[1200px]">
                  {/* タイムライン軸 */}
                  <div className="flex border-b mb-2 sticky top-0 z-20 bg-background">
                    <div className="w-[120px] flex-shrink-0 px-2 py-1 font-medium text-sm sticky left-0 bg-background z-30">
                      氏名
                    </div>
                    <div className="flex-1 flex relative">
                      {timeSlots.map((time, index) => (
                        <div
                          key={time}
                          className={cn(
                            'flex-1 text-center text-xs border-l py-1',
                            index % 6 === 0 ? 'border-gray-300 font-medium' : 'border-gray-200'
                          )}
                        >
                          {index % 2 === 0 && time}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* メンバー行 */}
                  {filteredMembers.map(member => {
                    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
                    const shift = shiftMap.get(`${member.id}-${dateStr}`);
                    const pattern = shift
                      ? workPatterns.find(p => p.id === shift.patternId)
                      : null;

                    return (
                      <div key={member.id} className="flex border-b hover:bg-muted/30">
                        <div className="w-[120px] flex-shrink-0 px-2 py-2 sticky left-0 bg-background z-10">
                          <div className="text-sm font-medium truncate">{member.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{member.department}</div>
                        </div>
                        <div className="flex-1 relative h-[50px] bg-gray-50 dark:bg-gray-900">
                          {/* 時間グリッド */}
                          <div className="absolute inset-0 flex">
                            {timeSlots.map((time, index) => (
                              <div
                                key={time}
                                className={cn(
                                  'flex-1 border-l',
                                  index % 6 === 0 ? 'border-gray-300' : 'border-gray-100'
                                )}
                              />
                            ))}
                          </div>

                          {/* シフトバー */}
                          {pattern && pattern.startTime && pattern.endTime && pattern.workMinutes > 0 && (
                            <div
                              className="absolute top-2 bottom-2 rounded flex items-center justify-center text-white text-xs font-medium shadow-sm"
                              style={{
                                left: `${getTimePosition(pattern.startTime)}%`,
                                width: `${getTimeWidth(pattern.startTime, pattern.endTime)}%`,
                                backgroundColor: pattern.color,
                              }}
                            >
                              <span className="truncate px-1">
                                {pattern.startTime}-{pattern.endTime}
                              </span>
                            </div>
                          )}

                          {/* 未設定 */}
                          {!shift && !isWeekend(selectedDate || new Date()) && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                              未設定
                            </div>
                          )}

                          {/* 休日 */}
                          {isWeekend(selectedDate || new Date()) && !shift && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                              休日
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      メンバーが見つかりません
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 凡例 */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  勤務パターン:
                </div>
                {workPatterns.filter(p => p.workMinutes > 0).slice(0, 6).map((pattern) => (
                  <div key={pattern.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: pattern.color }}
                    />
                    <span className="text-sm">
                      {pattern.name} ({pattern.startTime}-{pattern.endTime})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* シフト編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>シフト登録</DialogTitle>
            <DialogDescription>
              {editTarget && `${editTarget.userName} - ${editTarget.date}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 勤務パターン選択 */}
            <div className="space-y-2">
              <Label className="font-medium">勤務パターン</Label>
              <RadioGroup value={editPatternId} onValueChange={setEditPatternId}>
                <div className="space-y-2 max-h-[200px] overflow-auto">
                  {workPatterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted"
                    >
                      <RadioGroupItem value={pattern.id} id={`pattern-${pattern.id}`} />
                      <Label
                        htmlFor={`pattern-${pattern.id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: pattern.color }}
                        />
                        <span>{pattern.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {pattern.startTime}-{pattern.endTime}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* 勤怠区分選択 */}
            <div className="space-y-2">
              <Label className="font-medium">勤怠区分</Label>
              <Select value={editAttendanceType} onValueChange={setEditAttendanceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {shiftMap.has(`${editTarget?.userId}-${editTarget?.date}`) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteShift}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSaveShift} disabled={isSaving || !editPatternId}>
                {isSaving ? '保存中...' : '登録'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
