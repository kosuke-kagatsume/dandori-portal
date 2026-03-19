'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  MinusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Eye,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO, getDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';
import { useUserStore } from '@/lib/store/user-store';
import { useOrganizationStore } from '@/lib/store/organization-store';

interface TeamMember {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  employeeNumber?: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  totalBreakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  workLocation: string | null;
  workPatternName: string | null;
  status: string;
  memo: string | null;
  approvalStatus?: string | null;
  punches?: Array<{
    id: string;
    punchType: string;
    punchTime: string;
    punchOrder: number;
  }>;
}

interface MemberMonthlyData {
  memberId: string;
  memberName: string;
  department: string;
  closingRequested: boolean;
  managerApproved: boolean;
  attendanceClosed: boolean;
  dailyRecords: Map<string, {
    checkIn: string | null;
    checkOut: string | null;
    breakStart: string | null;
    breakEnd: string | null;
    totalBreakMinutes: number;
    workMinutes: number;
    overtimeMinutes: number;
    workLocation: string | null;
    workPatternName: string | null;
    status: string;
    memo: string | null;
    approvalStatus?: string | null;
    punchPairs?: Array<{ checkIn: string | null; checkOut: string | null }>;
  }>;
  summary: {
    workDays: number;
    presentDays: number;
    remoteDays: number;
    absentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    totalWorkHours: number;
    totalOvertimeHours: number;
  };
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// ISO文字列をJST HH:mm形式に変換
function toHHmm(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{1,2}:\d{2}$/.test(value)) return value;
  try {
    return new Date(value).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    });
  } catch {
    return value;
  }
}

export function TeamAttendance() {
  const { currentTenant } = useTenantStore();
  const { currentUser } = useUserStore();
  const tenantId = currentTenant?.id;
  const currentUserRoles = currentUser?.roles || ['employee'];

  // 権限チェック
  const isHR = currentUserRoles.some((role: string) => ['hr', 'executive', 'system_admin'].includes(role));
  const isManager = currentUserRoles.some((role: string) => ['manager', 'hr', 'executive'].includes(role));

  // 組織階層ベースのフィルタ
  const { getTeamMembersForManager } = useOrganizationStore();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [closingFilter, setClosingFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [memberDetailDialogOpen, setMemberDetailDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'close' | 'unlock' | 'cancel_approval' | 'proxy_close_request' | null>(null);
  const [dayDetailDialogOpen, setDayDetailDialogOpen] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ memberName: string; date: string; checkIn: string | null; checkOut: string | null; status: string } | null>(null);
  const [actionMemo, setActionMemo] = useState('');

  // API data states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // 承認/締め状態のローカル管理
  const [approvalState, setApprovalState] = useState<Record<string, {
    closingRequested: boolean;
    managerApproved: boolean;
    attendanceClosed: boolean;
  }>>({});

  // Initialize date on client side
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Month days
  const monthDays = useMemo(() => {
    if (!currentDate) return [];
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Period display
  const periodDisplay = useMemo(() => {
    if (!currentDate) return '';
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return `${format(start, 'yyyy/MM/dd')} ～ ${format(end, 'yyyy/MM/dd')}`;
  }, [currentDate]);

  // Fetch team members and attendance data
  const fetchData = useCallback(async () => {
    if (!tenantId || !currentDate) return;

    setIsLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const [usersRes, attendanceRes] = await Promise.all([
        fetch(`/api/users?tenantId=${tenantId}`),
        fetch(`/api/attendance?tenantId=${tenantId}&startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) {
          setTeamMembers(usersData.data.map((u: { id: string; name: string; department: string | null; position: string | null; employeeNumber?: string }) => ({
            id: u.id,
            name: u.name,
            department: u.department || '',
            position: u.position || '',
            employeeNumber: u.employeeNumber || `EMP${u.id.slice(0, 6)}`,
          })));
        }
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        if (attendanceData.success) {
          setAttendanceRecords(attendanceData.data);

          // 出勤記録があるメンバーを承認申請済みとして初期化
          const memberIdsWithRecords = new Set<string>(
            attendanceData.data.map((r: AttendanceRecord) => r.userId)
          );
          const initialApproval: Record<string, { closingRequested: boolean; managerApproved: boolean; attendanceClosed: boolean }> = {};
          memberIdsWithRecords.forEach((id: string) => {
            initialApproval[id] = {
              closingRequested: true,
              managerApproved: false,
              attendanceClosed: false,
            };
          });
          setApprovalState(prev => {
            // 既にローカルで操作済みならそちらを優先
            const merged = { ...initialApproval };
            for (const [key, val] of Object.entries(prev)) {
              if (val) merged[key] = val;
            }
            return merged;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch team attendance data:', error);
      toast.error('チーム勤怠データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, currentDate]);

  useEffect(() => {
    if (tenantId && currentDate) {
      fetchData();
    }
  }, [tenantId, currentDate, fetchData]);

  // Build monthly data for each member
  const memberMonthlyData: MemberMonthlyData[] = useMemo(() => {
    if (!currentDate) return [];

    const workDays = monthDays.filter(d => !isWeekend(d)).length;
    const today = new Date();

    return teamMembers.map(member => {
      const memberRecords = attendanceRecords.filter(r => r.userId === member.id);
      const dailyRecords = new Map<string, {
        checkIn: string | null; checkOut: string | null;
        breakStart: string | null; breakEnd: string | null;
        totalBreakMinutes: number; workMinutes: number; overtimeMinutes: number;
        workLocation: string | null; workPatternName: string | null;
        status: string; memo: string | null;
        approvalStatus?: string | null;
        punchPairs?: Array<{ checkIn: string | null; checkOut: string | null }>;
      }>();

      let presentDays = 0;
      let remoteDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let earlyLeaveDays = 0;
      let totalWorkHours = 0;
      let totalOvertimeHours = 0;

      memberRecords.forEach(record => {
        const dateKey = record.date.includes('T') ? record.date.split('T')[0] : record.date;

        // K3: punchesから複数打刻ペアを構築
        let punchPairs: Array<{ checkIn: string | null; checkOut: string | null }> | undefined;
        if (record.punches && record.punches.length > 0) {
          const checkIns = record.punches
            .filter(p => p.punchType === 'check_in')
            .sort((a, b) => a.punchOrder - b.punchOrder || a.punchTime.localeCompare(b.punchTime));
          const checkOuts = record.punches
            .filter(p => p.punchType === 'check_out')
            .sort((a, b) => a.punchOrder - b.punchOrder || a.punchTime.localeCompare(b.punchTime));
          const maxPairs = Math.max(checkIns.length, checkOuts.length);
          if (maxPairs > 1) {
            punchPairs = [];
            for (let i = 0; i < maxPairs; i++) {
              punchPairs.push({
                checkIn: checkIns[i] ? toHHmm(checkIns[i].punchTime) : null,
                checkOut: checkOuts[i] ? toHHmm(checkOuts[i].punchTime) : null,
              });
            }
          }
        }

        dailyRecords.set(dateKey, {
          checkIn: toHHmm(record.checkIn),
          checkOut: toHHmm(record.checkOut),
          breakStart: toHHmm(record.breakStart),
          breakEnd: toHHmm(record.breakEnd),
          totalBreakMinutes: record.totalBreakMinutes || 0,
          workMinutes: record.workMinutes || 0,
          overtimeMinutes: record.overtimeMinutes || 0,
          workLocation: record.workLocation,
          workPatternName: record.workPatternName,
          status: record.status,
          memo: record.memo,
          approvalStatus: record.approvalStatus,
          punchPairs,
        });

        const recordDate = parseISO(record.date);
        if (isWeekend(recordDate)) return;

        if (record.status === 'absent') {
          absentDays++;
          return;
        }

        if (record.checkIn) {
          const isRemote = record.workLocation === 'home' || record.workLocation === 'remote';
          if (isRemote) {
            remoteDays++;
          } else {
            presentDays++;
          }

          const inTimeStr = toHHmm(record.checkIn) || '';
          if (inTimeStr > '09:30') {
            lateDays++;
          }

          const outTimeStr = toHHmm(record.checkOut);
          if (outTimeStr && outTimeStr < '17:00') {
            earlyLeaveDays++;
          }

          if (record.checkIn && record.checkOut) {
            const inTime = toHHmm(record.checkIn) || '0:00';
            const outTime = toHHmm(record.checkOut) || '0:00';
            const [inH, inM] = inTime.split(':').map(Number);
            const [outH, outM] = outTime.split(':').map(Number);
            const hours = (!isNaN(inH) && !isNaN(outH)) ? (outH * 60 + outM - inH * 60 - inM) / 60 : 0;
            totalWorkHours += hours;
            if (hours > 8) {
              totalOvertimeHours += hours - 8;
            }
          }
        }
      });

      // Calculate absent days
      const workedOrAbsent = presentDays + remoteDays + absentDays;
      const daysUntilToday = monthDays.filter(d => !isWeekend(d) && d <= today).length;
      absentDays = Math.max(0, daysUntilToday - workedOrAbsent);

      const memberApproval = approvalState[member.id];
      return {
        memberId: member.id,
        memberName: member.name,
        department: member.department || '',
        closingRequested: memberApproval?.closingRequested ?? false,
        managerApproved: memberApproval?.managerApproved ?? false,
        attendanceClosed: memberApproval?.attendanceClosed ?? false,
        dailyRecords,
        summary: {
          workDays,
          presentDays,
          remoteDays,
          absentDays,
          lateDays,
          earlyLeaveDays,
          totalWorkHours,
          totalOvertimeHours,
        },
      };
    });
  }, [teamMembers, attendanceRecords, currentDate, monthDays, approvalState]);

  // 権限に応じたメンバー表示フィルタ
  const displayMembers = useMemo(() => {
    if (isHR) return memberMonthlyData;
    if (isManager && currentUser) {
      const subordinateIds = getTeamMembersForManager(currentUser.id).map(m => m.id);
      return memberMonthlyData.filter(m => subordinateIds.includes(m.memberId));
    }
    return [];
  }, [memberMonthlyData, isHR, isManager, currentUser, getTeamMembersForManager]);

  // Filtered data
  const filteredData = useMemo(() => {
    return displayMembers.filter(member => {
      const matchesSearch = member.memberName.includes(searchQuery) ||
                           member.department.includes(searchQuery);
      const matchesClosing = closingFilter === 'all' ||
        (closingFilter === 'open' && !member.closingRequested) ||
        (closingFilter === 'pending' && member.closingRequested && !member.managerApproved) ||
        (closingFilter === 'approved' && member.managerApproved);
      return matchesSearch && matchesClosing;
    });
  }, [displayMembers, searchQuery, closingFilter]);

  // Month navigation
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

  // Action handlers
  const handleViewMemberDetail = (memberId: string) => {
    setSelectedMemberId(memberId);
    setMemberDetailDialogOpen(true);
  };

  const handleAction = (memberId: string, action: typeof actionType) => {
    setSelectedMemberId(memberId);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const executeAction = () => {
    const actionLabels = {
      approve: '承認',
      reject: '差し戻し',
      close: '勤怠締め',
      unlock: '締め解除',
      cancel_approval: '承認解除',
      proxy_close_request: '代理締め申請',
    };

    if (actionType && selectedMemberId) {
      const prev = approvalState[selectedMemberId] || {
        closingRequested: false,
        managerApproved: false,
        attendanceClosed: false,
      };

      let updated = { ...prev };
      switch (actionType) {
        case 'approve':
          updated = { ...prev, managerApproved: true };
          break;
        case 'reject':
          updated = { closingRequested: false, managerApproved: false, attendanceClosed: false };
          break;
        case 'close':
          updated = { ...prev, attendanceClosed: true };
          break;
        case 'unlock':
          updated = { ...prev, attendanceClosed: false };
          break;
        case 'cancel_approval':
          updated = { ...prev, managerApproved: false };
          break;
        case 'proxy_close_request':
          updated = { ...prev, closingRequested: true };
          break;
      }

      setApprovalState(s => ({ ...s, [selectedMemberId]: updated }));
      toast.success(`${actionLabels[actionType]}を実行しました`);
    }
    setActionDialogOpen(false);
    setSelectedMemberId(null);
    setActionType(null);
  };

  // Export handlers
  const handleExportPDF = () => {
    toast.info('PDF出力機能は準備中です');
  };

  const getClosingBadge = (member: MemberMonthlyData) => {
    if (member.attendanceClosed) {
      return <Badge className="bg-green-500">締め済み</Badge>;
    } else if (member.managerApproved) {
      return <Badge variant="default">承認済み</Badge>;
    } else if (member.closingRequested) {
      return <Badge variant="secondary">承認待ち</Badge>;
    }
    return <Badge variant="outline">未締め</Badge>;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">勤怠承認データを読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedMember = memberMonthlyData.find(m => m.memberId === selectedMemberId);

  return (
    <>
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

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF出力
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="名前・部署で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={closingFilter} onValueChange={setClosingFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="open">未締め</SelectItem>
                <SelectItem value="pending">承認待ち</SelectItem>
                <SelectItem value="approved">承認済み</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="punch" className="space-y-4">
            <TabsList>
              <TabsTrigger value="punch" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                打刻状況
              </TabsTrigger>
              {(isHR || isManager) && (
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  勤怠項目別集計
                </TabsTrigger>
              )}
            </TabsList>

            {/* 打刻状況タブ - 1ヶ月横スクロール表示 */}
            <TabsContent value="punch">
              <div className="w-full max-h-[calc(100vh-320px)] overflow-auto">
                <div className="min-w-[1600px]">
                  <Table containerClassName="overflow-visible">
                    <TableHeader className="sticky top-0 z-20 bg-background">
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[120px] min-w-[120px] sticky left-0 bg-muted/50 z-30">氏名</TableHead>
                        <TableHead className="w-[50px] min-w-[50px] text-center sticky left-[120px] bg-muted/50 z-30">一覧</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center sticky left-[170px] bg-muted/50 z-30">承認申請</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center sticky left-[240px] bg-muted/50 z-30">上長承認</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center sticky left-[310px] bg-muted/50 z-30">勤怠締め</TableHead>
                        {monthDays.map(day => {
                          const dayOfWeek = getDay(day);
                          const isSunday = dayOfWeek === 0;
                          const isSaturday = dayOfWeek === 6;
                          return (
                            <TableHead
                              key={day.toISOString()}
                              className={cn(
                                'w-[50px] text-center text-xs p-1',
                                isSunday && 'text-red-500',
                                isSaturday && 'text-blue-500',
                                isToday(day) && 'bg-primary/10'
                              )}
                            >
                              <div>{format(day, 'd')}</div>
                              <div className="text-[10px]">{WEEKDAY_LABELS[dayOfWeek]}</div>
                            </TableHead>
                          );
                        })}
                        {/* アクションカラム（人事/マネージャーのみ） */}
                        {(isHR || isManager) && (
                          <TableHead className="w-[320px] text-center">アクション</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6 + monthDays.length + (isHR || isManager ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                            メンバーが見つかりません
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredData.map((member) => (
                          <TableRow key={member.memberId}>
                            {/* 氏名 */}
                            <TableCell className="w-[120px] min-w-[120px] font-medium sticky left-0 bg-background z-10">
                              <div className="truncate">{member.memberName}</div>
                              <div className="text-xs text-muted-foreground truncate">{member.department}</div>
                            </TableCell>

                            {/* 一覧リンク */}
                            <TableCell className="w-[50px] min-w-[50px] text-center sticky left-[120px] bg-background z-10">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleViewMemberDetail(member.memberId)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>

                            {/* 承認申請 */}
                            <TableCell className="w-[70px] min-w-[70px] text-center sticky left-[170px] bg-background z-10">
                              {member.closingRequested ? (
                                <CheckCircle className="h-4 w-4 text-yellow-500 mx-auto" />
                              ) : (
                                <MinusCircle className="h-4 w-4 text-gray-300 mx-auto" />
                              )}
                            </TableCell>

                            {/* 上長承認 */}
                            <TableCell className="w-[70px] min-w-[70px] text-center sticky left-[240px] bg-background z-10">
                              {member.managerApproved ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                              ) : member.closingRequested ? (
                                <AlertCircle className="h-4 w-4 text-yellow-500 mx-auto" />
                              ) : (
                                <MinusCircle className="h-4 w-4 text-gray-300 mx-auto" />
                              )}
                            </TableCell>

                            {/* 勤怠締め */}
                            <TableCell className="w-[70px] min-w-[70px] text-center sticky left-[310px] bg-background z-10">
                              {member.attendanceClosed ? (
                                <CheckCircle className="h-4 w-4 text-blue-500 mx-auto" />
                              ) : member.managerApproved ? (
                                <AlertCircle className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <MinusCircle className="h-4 w-4 text-gray-300 mx-auto" />
                              )}
                            </TableCell>

                            {/* 日次打刻（出勤/退勤 2段表示） */}
                            {monthDays.map(day => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const record = member.dailyRecords.get(dateStr);
                              const dayOfWeek = getDay(day);
                              const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

                              return (
                                <TableCell
                                  key={day.toISOString()}
                                  className={cn(
                                    'text-center p-1 text-[10px] font-mono',
                                    isWeekendDay && 'bg-gray-50 dark:bg-gray-900',
                                    isToday(day) && 'bg-primary/10',
                                    record && !isWeekendDay && 'cursor-pointer hover:bg-muted/50'
                                  )}
                                  onClick={() => {
                                    if (record && !isWeekendDay) {
                                      setSelectedDayDetail({
                                        memberName: member.memberName,
                                        date: dateStr,
                                        checkIn: record.checkIn,
                                        checkOut: record.checkOut,
                                        status: record.status,
                                      });
                                      setDayDetailDialogOpen(true);
                                    }
                                  }}
                                >
                                  {record && !isWeekendDay ? (
                                    <div className="space-y-0.5">
                                      {record.punchPairs ? (
                                        record.punchPairs.map((pair, idx) => (
                                          <div key={idx} className={cn(idx > 0 && 'border-t border-dashed pt-0.5')}>
                                            <div className={cn(
                                              pair.checkIn && pair.checkIn > '09:30' && idx === 0 && 'text-orange-600'
                                            )}>
                                              {pair.checkIn || '-'}
                                            </div>
                                            <div>{pair.checkOut || '-'}</div>
                                          </div>
                                        ))
                                      ) : (
                                        <>
                                          <div className={cn(
                                            record.checkIn && record.checkIn > '09:30' && 'text-orange-600'
                                          )}>
                                            {record.checkIn || '-'}
                                          </div>
                                          <div>{record.checkOut || '-'}</div>
                                        </>
                                      )}
                                    </div>
                                  ) : isWeekendDay ? (
                                    <span className="text-gray-400">-</span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                              );
                            })}

                            {/* アクションボタン */}
                            {(isHR || isManager) && (
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {/* マネージャー・人事: 差し戻し/承認 */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleAction(member.memberId, 'reject')}
                                    disabled={!(member.closingRequested && !member.managerApproved)}
                                  >
                                    差し戻し
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleAction(member.memberId, 'approve')}
                                    disabled={!(member.closingRequested && !member.managerApproved)}
                                  >
                                    承認
                                  </Button>

                                  {/* 人事のみ: 承認解除/承認/勤怠締め/締め解除 */}
                                  {isHR && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleAction(member.memberId, 'cancel_approval')}
                                        disabled={!(member.managerApproved && !member.attendanceClosed)}
                                      >
                                        承認解除
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleAction(member.memberId, 'close')}
                                        disabled={!(member.managerApproved && !member.attendanceClosed)}
                                      >
                                        勤怠締め
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleAction(member.memberId, 'unlock')}
                                        disabled={!member.attendanceClosed}
                                      >
                                        締め解除
                                      </Button>
                                      {/* D2: 代理締め申請 */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleAction(member.memberId, 'proxy_close_request')}
                                        disabled={member.closingRequested || member.attendanceClosed}
                                      >
                                        代理締め
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* 勤怠項目別集計タブ（管理者/人事のみ） */}
            {(isHR || isManager) && <TabsContent value="summary">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-20 bg-background">
                      <TableRow className="bg-muted/50">
                        <TableHead>氏名</TableHead>
                        <TableHead>部署</TableHead>
                        <TableHead className="text-right">所定日数</TableHead>
                        <TableHead className="text-right">出勤日数</TableHead>
                        <TableHead className="text-right">在宅日数</TableHead>
                        <TableHead className="text-right">欠勤日数</TableHead>
                        <TableHead className="text-right">遅刻</TableHead>
                        <TableHead className="text-right">早退</TableHead>
                        <TableHead className="text-right">総労働時間</TableHead>
                        <TableHead className="text-right">残業時間</TableHead>
                        <TableHead>勤怠締め</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                            メンバーが見つかりません
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredData.map((member) => (
                          <TableRow key={member.memberId}>
                            <TableCell className="font-medium">{member.memberName}</TableCell>
                            <TableCell>{member.department}</TableCell>
                            <TableCell className="text-right">{member.summary.workDays}日</TableCell>
                            <TableCell className="text-right">{member.summary.presentDays}日</TableCell>
                            <TableCell className="text-right">{member.summary.remoteDays}日</TableCell>
                            <TableCell className="text-right">
                              {member.summary.absentDays > 0 ? (
                                <span className="text-red-600 font-medium">{member.summary.absentDays}日</span>
                              ) : (
                                '0日'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {member.summary.lateDays > 0 ? (
                                <span className="text-orange-600">{member.summary.lateDays}回</span>
                              ) : (
                                '0回'
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {member.summary.earlyLeaveDays > 0 ? (
                                <span className="text-yellow-600">{member.summary.earlyLeaveDays}回</span>
                              ) : (
                                '0回'
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {member.summary.totalWorkHours.toFixed(1)}h
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {member.summary.totalOvertimeHours > 0 ? (
                                <span className={cn(
                                  member.summary.totalOvertimeHours > 40 ? 'text-red-600 font-medium' :
                                  member.summary.totalOvertimeHours > 30 ? 'text-orange-600' : ''
                                )}>
                                  {member.summary.totalOvertimeHours.toFixed(1)}h
                                </span>
                              ) : (
                                '0h'
                              )}
                            </TableCell>
                            <TableCell>{getClosingBadge(member)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>}
          </Tabs>
        </CardContent>
      </Card>

      {/* メンバー勤怠詳細ダイアログ */}
      <Dialog open={memberDetailDialogOpen} onOpenChange={setMemberDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedMember?.memberName}さんの勤怠一覧
            </DialogTitle>
            <DialogDescription>
              {periodDisplay}
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="flex-1 min-h-0 flex flex-col gap-4">
              {/* サマリー */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">出勤日数</div>
                  <div className="text-xl font-bold">{selectedMember.summary.presentDays}日</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">在宅日数</div>
                  <div className="text-xl font-bold">{selectedMember.summary.remoteDays}日</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">総労働時間</div>
                  <div className="text-xl font-bold">{selectedMember.summary.totalWorkHours.toFixed(1)}h</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground mb-1">残業時間</div>
                  <div className={cn(
                    'text-xl font-bold',
                    selectedMember.summary.totalOvertimeHours > 40 && 'text-red-600'
                  )}>
                    {selectedMember.summary.totalOvertimeHours.toFixed(1)}h
                  </div>
                </div>
              </div>

              {/* D1: 日次一覧（勤怠一覧と同じ項目） */}
              <div className="border rounded-lg overflow-hidden flex-1 min-h-0">
                <div className="w-full h-full overflow-auto">
                  <div className="min-w-[1600px]">
                    <Table containerClassName="overflow-visible">
                      <TableHeader className="sticky top-0 z-20 bg-background">
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[100px] sticky left-0 bg-muted/50 z-30">日付</TableHead>
                          <TableHead className="text-center w-[70px] sticky left-[100px] bg-muted/50 z-30">勤怠区分</TableHead>
                          <TableHead className="text-center w-[60px] sticky left-[170px] bg-muted/50 z-30">申請状況</TableHead>
                          <TableHead className="text-center w-[80px] sticky left-[230px] bg-muted/50 z-30">勤務パターン</TableHead>
                          <TableHead className="text-center w-[55px]">出勤</TableHead>
                          <TableHead className="text-center w-[55px]">退勤</TableHead>
                          <TableHead className="text-center w-[55px]">休憩入</TableHead>
                          <TableHead className="text-center w-[55px]">休憩戻</TableHead>
                          <TableHead className="text-right w-[55px]">総労働</TableHead>
                          <TableHead className="text-right w-[55px]">所定</TableHead>
                          <TableHead className="text-right w-[55px]">所定外</TableHead>
                          <TableHead className="text-right w-[55px]">法定外</TableHead>
                          <TableHead className="text-right w-[60px]">深夜所定</TableHead>
                          <TableHead className="text-right w-[70px]">深夜所定外</TableHead>
                          <TableHead className="text-right w-[70px]">深夜法定外</TableHead>
                          <TableHead className="text-right w-[50px]">遅刻</TableHead>
                          <TableHead className="text-right w-[50px]">早退</TableHead>
                          <TableHead className="text-right w-[50px]">休憩</TableHead>
                          <TableHead className="text-right w-[70px]">休憩みなし所定</TableHead>
                          <TableHead className="text-right w-[80px]">休憩みなし所定外</TableHead>
                          <TableHead className="text-right w-[80px]">休憩みなし法定外</TableHead>
                          <TableHead className="w-[100px]">備考</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthDays.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const record = selectedMember.dailyRecords.get(dateStr);
                          const dayOfWeek = getDay(day);
                          const isSunday = dayOfWeek === 0;
                          const isSaturday = dayOfWeek === 6;
                          const isWeekendDay = isSunday || isSaturday;
                          const workHours = record ? (record.workMinutes || 0) / 60 : 0;
                          const scheduledHours = record ? Math.min(workHours, 8) : 0;
                          const scheduledOvertimeHours = record ? Math.max(0, workHours - 8) : 0;
                          const legalOvertimeHours = record ? Math.max(0, workHours - 8) : 0;
                          const breakMinutes = record?.totalBreakMinutes || 0;
                          const dateStickyBg = cn(
                            'bg-background',
                            isToday(day) && 'bg-primary/5',
                            isSunday && 'bg-red-50 dark:bg-red-950/20',
                            isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                          );

                          return (
                            <TableRow
                              key={day.toISOString()}
                              className={cn(
                                isToday(day) && 'bg-primary/5',
                                isSunday && 'bg-red-50 dark:bg-red-950/20',
                                isSaturday && 'bg-blue-50 dark:bg-blue-950/20'
                              )}
                            >
                              <TableCell className={cn('font-medium text-sm sticky left-0 z-10', dateStickyBg, isSunday && 'text-red-500', isSaturday && 'text-blue-500')}>
                                {format(day, 'MM/dd')}（{WEEKDAY_LABELS[dayOfWeek]}）
                              </TableCell>
                              <TableCell className="text-center">
                                {isWeekendDay ? (
                                  <Badge variant="outline" className="text-xs">休日</Badge>
                                ) : record?.status === 'absent' ? (
                                  <Badge variant="destructive" className="text-xs">欠勤</Badge>
                                ) : record?.checkIn ? (
                                  <Badge className="bg-green-500 text-xs">出勤</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">未出勤</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {record?.approvalStatus === 'approved' ? '承認済' : record?.approvalStatus === 'rejected' ? '差戻' : '-'}
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {record?.workPatternName || '-'}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm">
                                {record?.checkIn || '-'}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm">
                                {record?.checkOut || '-'}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm">
                                {record?.breakStart || '-'}
                              </TableCell>
                              <TableCell className="text-center font-mono text-sm">
                                {record?.breakEnd || '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {workHours > 0 ? workHours.toFixed(1) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {scheduledHours > 0 ? scheduledHours.toFixed(1) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {scheduledOvertimeHours > 0 ? scheduledOvertimeHours.toFixed(1) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {legalOvertimeHours > 0 ? (
                                  <span className="text-orange-600">{legalOvertimeHours.toFixed(1)}</span>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {breakMinutes > 0 ? `${Math.floor(breakMinutes / 60)}:${String(breakMinutes % 60).padStart(2, '0')}` : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-sm">-</TableCell>
                              <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {record?.memo || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setMemberDetailDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* アクション確認ダイアログ */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && '承認の確認'}
              {actionType === 'reject' && '差し戻しの確認'}
              {actionType === 'close' && '勤怠締めの確認'}
              {actionType === 'unlock' && '締め解除の確認'}
              {actionType === 'cancel_approval' && '承認解除の確認'}
              {actionType === 'proxy_close_request' && '代理締め申請の確認'}
            </DialogTitle>
            <DialogDescription>
              {selectedMember?.memberName}さんに対して操作を実行します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              {actionType === 'approve' && 'この勤怠を承認してよろしいですか？'}
              {actionType === 'reject' && '差し戻しを実行すると、本人に再提出を依頼します。'}
              {actionType === 'close' && '勤怠を締めると、以降の修正ができなくなります。'}
              {actionType === 'unlock' && '締めを解除すると、修正が可能になります。'}
              {actionType === 'cancel_approval' && '承認を取り消して、承認待ち状態に戻します。'}
            </p>
            <div className="space-y-2">
              <Label htmlFor="action-memo">メモ（任意）</Label>
              <Textarea
                id="action-memo"
                placeholder={actionType === 'reject' ? '差し戻し理由を入力してください...' : 'コメントを入力...'}
                value={actionMemo}
                onChange={(e) => setActionMemo(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialogOpen(false); setActionMemo(''); }}>
              キャンセル
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={() => { executeAction(); setActionMemo(''); }}
            >
              実行する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 日次打刻詳細ダイアログ */}
      <Dialog open={dayDetailDialogOpen} onOpenChange={setDayDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              日次勤怠詳細
            </DialogTitle>
            <DialogDescription>
              {selectedDayDetail?.memberName}さん - {selectedDayDetail?.date}
            </DialogDescription>
          </DialogHeader>

          {selectedDayDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">出勤</div>
                  <div className="text-lg font-mono font-medium">{selectedDayDetail.checkIn || '-'}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">退勤</div>
                  <div className="text-lg font-mono font-medium">{selectedDayDetail.checkOut || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">ステータス</div>
                  <div className="text-sm font-medium">
                    {selectedDayDetail.status === 'present' ? '出勤' :
                     selectedDayDetail.status === 'absent' ? '欠勤' :
                     selectedDayDetail.status === 'late' ? '遅刻' :
                     selectedDayDetail.status === 'early' ? '早退' : selectedDayDetail.status}
                  </div>
                </div>
                {selectedDayDetail.checkIn && selectedDayDetail.checkOut && (() => {
                  const inTime = toHHmm(selectedDayDetail.checkIn) || '0:00';
                  const outTime = toHHmm(selectedDayDetail.checkOut) || '0:00';
                  const [inH, inM] = inTime.split(':').map(Number);
                  const [outH, outM] = outTime.split(':').map(Number);
                  const hours = (!isNaN(inH) && !isNaN(outH)) ? (outH * 60 + outM - inH * 60 - inM) / 60 : 0;
                  return (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">総労働時間</div>
                      <div className="text-lg font-mono font-medium">{hours.toFixed(1)}h</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDayDetailDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
