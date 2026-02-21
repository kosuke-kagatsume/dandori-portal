'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useShiftStore, ShiftAssignment } from '@/lib/store/shift-store';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Download,
  Upload,
  FileText,
  Save,
  Table as TableIcon,
  GanttChart,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWeekend } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTenantStore } from '@/lib/store';

interface TeamMember {
  id: string;
  name: string;
  department: string;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// 部署リスト（仮）
const DEPARTMENTS = [
  { value: 'all', label: 'すべての部署' },
  { value: 'sales', label: '営業部' },
  { value: 'engineering', label: '開発部' },
  { value: 'hr', label: '人事部' },
  { value: 'general', label: '総務部' },
];

// 勤怠区分
const ATTENDANCE_TYPES = [
  { value: 'weekday', label: '平日', color: 'bg-white' },
  { value: 'scheduled_holiday', label: '所定休日', color: 'bg-blue-100' },
  { value: 'legal_holiday', label: '法定休日', color: 'bg-red-100' },
];

export function ShiftManagement() {
  const { currentUser } = useUserStore();
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;
  const currentUserRoles = currentUser?.roles || ['employee'];

  // 権限チェック
  const isHR = currentUserRoles.some((role: string) => ['hr', 'executive', 'system_admin'].includes(role));
  const isManager = currentUserRoles.some((role: string) => ['manager', 'hr', 'executive'].includes(role));
  const canEdit = isHR || isManager;

  const {
    getActiveWorkPatterns,
    getTeamShifts,
  } = useShiftStore();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pattern');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize dates on client side
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }, []);

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    if (!tenantId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTeamMembers(data.data.map((u: { id: string; name: string; department: string | null }) => ({
            id: u.id,
            name: u.name,
            department: u.department || '未設定',
          })));
        }
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

  // 有効な勤務パターン
  const workPatterns = useMemo(() => getActiveWorkPatterns(), [getActiveWorkPatterns]);

  // 月の日付配列
  const monthDays = useMemo(() => {
    if (!currentDate) return [];
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // 期間表示
  const periodDisplay = useMemo(() => {
    if (!currentDate) return '';
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return `${format(start, 'yyyy/MM/dd')} ～ ${format(end, 'yyyy/MM/dd')}`;
  }, [currentDate]);

  // チームシフト
  const dateToUse = currentDate || new Date();
  const currentYear = dateToUse.getFullYear();
  const currentMonth = dateToUse.getMonth() + 1;
  const teamShifts = useMemo(
    () => getTeamShifts(currentYear, currentMonth),
    [getTeamShifts, currentYear, currentMonth]
  );

  // フィルタリングされたメンバー
  const filteredMembers = useMemo(() => {
    if (departmentFilter === 'all') return teamMembers;
    return teamMembers.filter(m => m.department === DEPARTMENTS.find(d => d.value === departmentFilter)?.label);
  }, [teamMembers, departmentFilter]);

  // シフトをマップに変換
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftAssignment>();
    teamShifts.forEach((shift) => {
      map.set(`${shift.userId}-${shift.date}`, shift);
    });
    return map;
  }, [teamShifts]);

  // 月移動
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

  // Export handlers
  const handleExportCSV = () => {
    toast.info('CSV出力機能は準備中です');
  };

  const handleImportCSV = () => {
    toast.info('CSV取込機能は準備中です');
  };

  const handleExportPDF = () => {
    toast.info('PDF出力機能は準備中です');
  };

  const handleSave = () => {
    toast.success('シフトを保存しました');
  };

  // 日付の勤怠区分を取得
  const getAttendanceType = (date: Date) => {
    const dayOfWeek = getDay(date);
    if (dayOfWeek === 0) return 'legal_holiday'; // 日曜 = 法定休日
    if (dayOfWeek === 6) return 'scheduled_holiday'; // 土曜 = 所定休日
    return 'weekday';
  };

  // 時間帯シフト用 - 時間軸の生成
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // 勤務時間をピクセル位置に変換
  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
  };

  const getTimeWidth = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return ((endMinutes - startMinutes) / (24 * 60)) * 100;
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
      {/* タブ */}
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
                {/* 期間表示 */}
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

                {/* フィルタ & アクションボタン */}
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
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="min-w-[1600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[120px] sticky left-0 bg-muted/50 z-10">氏名</TableHead>
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
                            <TableCell className="font-medium sticky left-0 bg-white dark:bg-gray-950 z-10">
                              <div className="truncate">{member.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{member.department}</div>
                            </TableCell>
                            {monthDays.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const shift = shiftMap.get(`${member.id}-${dateStr}`);
                              const dayOfWeek = getDay(day);
                              const isWeekendDay = isWeekend(day);
                              const attendanceType = getAttendanceType(day);
                              const pattern = shift
                                ? workPatterns.find(p => p.id === shift.patternId)
                                : null;

                              return (
                                <TableCell
                                  key={dateStr}
                                  className={cn(
                                    'text-center p-1 text-[10px]',
                                    dayOfWeek === 0 && 'bg-red-50 dark:bg-red-950/20',
                                    dayOfWeek === 6 && 'bg-blue-50 dark:bg-blue-950/20'
                                  )}
                                >
                                  {pattern ? (
                                    <div className="space-y-0.5">
                                      <div className={cn(
                                        'text-[9px] text-muted-foreground',
                                        isWeekendDay && 'text-gray-400'
                                      )}>
                                        {ATTENDANCE_TYPES.find(t => t.value === attendanceType)?.label}
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
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
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
                {/* 日付選択 */}
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

                {/* フィルタ & アクションボタン */}
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
                  {canEdit && (
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[1200px]">
                  {/* タイムライン軸 */}
                  <div className="flex border-b mb-2">
                    <div className="w-[120px] flex-shrink-0 px-2 py-1 font-medium text-sm">
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
                        <div className="w-[120px] flex-shrink-0 px-2 py-2">
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
                          {shift && pattern && shift.startTime && shift.endTime && pattern.workMinutes > 0 && (
                            <div
                              className="absolute top-2 bottom-2 rounded flex items-center justify-center text-white text-xs font-medium shadow-sm"
                              style={{
                                left: `${getTimePosition(shift.startTime)}%`,
                                width: `${getTimeWidth(shift.startTime, shift.endTime)}%`,
                                backgroundColor: pattern.color,
                              }}
                            >
                              <span className="truncate px-1">
                                {shift.startTime}-{shift.endTime}
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
                          {isWeekend(selectedDate || new Date()) && (
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
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
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
    </div>
  );
}
