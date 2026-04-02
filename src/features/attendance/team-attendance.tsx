'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, Clock, CheckCircle, AlertCircle, MinusCircle, Search,
  ChevronLeft, ChevronRight, Loader2, FileText, Eye,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO, getDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';
import { useUserStore } from '@/lib/store/user-store';
import { useOrganizationStore } from '@/lib/store/organization-store';
import type {
  TeamMember, TeamAttendanceRecord, MemberMonthlyData, DayDetail, ActionType,
} from '@/lib/attendance/team-attendance-helpers';
import { TEAM_WEEKDAY_LABELS, ACTION_LABELS, toHHmm } from '@/lib/attendance/team-attendance-helpers';
import { MemberDetailDialog, ActionDialog, DayDetailDialog } from './team-attendance-dialogs';

export function TeamAttendance() {
  const { currentTenant } = useTenantStore();
  const { currentUser } = useUserStore();
  const tenantId = currentTenant?.id;
  const currentUserRoles = currentUser?.roles || ['employee'];

  const isHR = currentUserRoles.some((role: string) => ['hr', 'executive', 'system_admin'].includes(role));
  const isManager = currentUserRoles.some((role: string) => ['manager', 'hr', 'executive'].includes(role));
  const { getTeamMembersForManager } = useOrganizationStore();

  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [closingFilter, setClosingFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [memberDetailDialogOpen, setMemberDetailDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [dayDetailDialogOpen, setDayDetailDialogOpen] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayDetail | null>(null);
  const [actionMemo, setActionMemo] = useState('');

  // API data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeamAttendanceRecord[]>([]);
  const [approvalState, setApprovalState] = useState<Record<string, {
    closingRequested: boolean;
    managerApproved: boolean;
    attendanceClosed: boolean;
  }>>({});

  useEffect(() => { setCurrentDate(new Date()); }, []);

  const monthDays = useMemo(() => {
    if (!currentDate) return [];
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }, [currentDate]);

  const periodDisplay = useMemo(() => {
    if (!currentDate) return '';
    return `${format(startOfMonth(currentDate), 'yyyy/MM/dd')} ～ ${format(endOfMonth(currentDate), 'yyyy/MM/dd')}`;
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
            id: u.id, name: u.name, department: u.department || '', position: u.position || '',
            employeeNumber: u.employeeNumber || `EMP${u.id.slice(0, 6)}`,
          })));
        }
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        if (attendanceData.success) {
          setAttendanceRecords(attendanceData.data);
          const memberIdsWithRecords = new Set<string>(
            attendanceData.data.map((r: TeamAttendanceRecord) => r.userId)
          );
          const initialApproval: Record<string, { closingRequested: boolean; managerApproved: boolean; attendanceClosed: boolean }> = {};
          memberIdsWithRecords.forEach((id: string) => {
            initialApproval[id] = { closingRequested: true, managerApproved: false, attendanceClosed: false };
          });
          setApprovalState(prev => {
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
    if (tenantId && currentDate) fetchData();
  }, [tenantId, currentDate, fetchData]);

  // Build monthly data
  const memberMonthlyData: MemberMonthlyData[] = useMemo(() => {
    if (!currentDate) return [];
    const workDays = monthDays.filter(d => !isWeekend(d)).length;
    const today = new Date();

    return teamMembers.map(member => {
      const memberRecords = attendanceRecords.filter(r => r.userId === member.id);
      const dailyRecords = new Map<string, MemberMonthlyData['dailyRecords'] extends Map<string, infer V> ? V : never>();

      let presentDays = 0, remoteDays = 0, absentDays = 0, lateDays = 0, earlyLeaveDays = 0;
      let totalWorkHours = 0, totalOvertimeHours = 0;

      memberRecords.forEach(record => {
        const dateKey = record.date.includes('T') ? record.date.split('T')[0] : record.date;

        let punchPairs: Array<{ checkIn: string | null; checkOut: string | null }> | undefined;
        if (record.punches && record.punches.length > 0) {
          const checkIns = record.punches.filter(p => p.punchType === 'check_in').sort((a, b) => a.punchOrder - b.punchOrder || a.punchTime.localeCompare(b.punchTime));
          const checkOuts = record.punches.filter(p => p.punchType === 'check_out').sort((a, b) => a.punchOrder - b.punchOrder || a.punchTime.localeCompare(b.punchTime));
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
          checkIn: toHHmm(record.checkIn), checkOut: toHHmm(record.checkOut),
          breakStart: toHHmm(record.breakStart), breakEnd: toHHmm(record.breakEnd),
          totalBreakMinutes: record.totalBreakMinutes || 0, workMinutes: record.workMinutes || 0,
          overtimeMinutes: record.overtimeMinutes || 0, workLocation: record.workLocation,
          workPatternName: record.workPatternName, status: record.status, memo: record.memo,
          approvalStatus: record.approvalStatus, punchPairs,
        });

        const recordDate = parseISO(record.date);
        if (isWeekend(recordDate)) return;
        if (record.status === 'absent') { absentDays++; return; }

        if (record.checkIn) {
          const isRemote = record.workLocation === 'home' || record.workLocation === 'remote';
          if (isRemote) remoteDays++; else presentDays++;
          const inTimeStr = toHHmm(record.checkIn) || '';
          if (inTimeStr > '09:30') lateDays++;
          const outTimeStr = toHHmm(record.checkOut);
          if (outTimeStr && outTimeStr < '17:00') earlyLeaveDays++;

          if (record.checkIn && record.checkOut) {
            const inTime = toHHmm(record.checkIn) || '0:00';
            const outTime = toHHmm(record.checkOut) || '0:00';
            const [inH, inM] = inTime.split(':').map(Number);
            const [outH, outM] = outTime.split(':').map(Number);
            const hours = (!isNaN(inH) && !isNaN(outH)) ? (outH * 60 + outM - inH * 60 - inM) / 60 : 0;
            totalWorkHours += hours;
            if (hours > 8) totalOvertimeHours += hours - 8;
          }
        }
      });

      const workedOrAbsent = presentDays + remoteDays + absentDays;
      const daysUntilToday = monthDays.filter(d => !isWeekend(d) && d <= today).length;
      absentDays = Math.max(0, daysUntilToday - workedOrAbsent);

      const memberApproval = approvalState[member.id];
      return {
        memberId: member.id, memberName: member.name, department: member.department || '',
        closingRequested: memberApproval?.closingRequested ?? false,
        managerApproved: memberApproval?.managerApproved ?? false,
        attendanceClosed: memberApproval?.attendanceClosed ?? false,
        dailyRecords,
        summary: { workDays, presentDays, remoteDays, absentDays, lateDays, earlyLeaveDays, totalWorkHours, totalOvertimeHours },
      };
    });
  }, [teamMembers, attendanceRecords, currentDate, monthDays, approvalState]);

  const displayMembers = useMemo(() => {
    if (isHR) return memberMonthlyData;
    if (isManager && currentUser) {
      const subordinateIds = getTeamMembersForManager(currentUser.id).map(m => m.id);
      return memberMonthlyData.filter(m => subordinateIds.includes(m.memberId));
    }
    return [];
  }, [memberMonthlyData, isHR, isManager, currentUser, getTeamMembersForManager]);

  const filteredData = useMemo(() => {
    return displayMembers.filter(member => {
      const matchesSearch = member.memberName.includes(searchQuery) || member.department.includes(searchQuery);
      const matchesClosing = closingFilter === 'all' ||
        (closingFilter === 'open' && !member.closingRequested) ||
        (closingFilter === 'pending' && member.closingRequested && !member.managerApproved) ||
        (closingFilter === 'approved' && member.managerApproved);
      return matchesSearch && matchesClosing;
    });
  }, [displayMembers, searchQuery, closingFilter]);

  const goToPreviousMonth = () => setCurrentDate(prev => new Date((prev || new Date()).getFullYear(), (prev || new Date()).getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(prev => new Date((prev || new Date()).getFullYear(), (prev || new Date()).getMonth() + 1, 1));

  const handleAction = (memberId: string, action: ActionType) => {
    setSelectedMemberId(memberId);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const executeAction = () => {
    if (actionType && selectedMemberId) {
      const prev = approvalState[selectedMemberId] || { closingRequested: false, managerApproved: false, attendanceClosed: false };
      let updated = { ...prev };
      switch (actionType) {
        case 'approve': updated = { ...prev, managerApproved: true }; break;
        case 'reject': updated = { closingRequested: false, managerApproved: false, attendanceClosed: false }; break;
        case 'close': updated = { ...prev, attendanceClosed: true }; break;
        case 'unlock': updated = { ...prev, attendanceClosed: false }; break;
        case 'cancel_approval': updated = { ...prev, managerApproved: false }; break;
        case 'proxy_close_request': updated = { ...prev, closingRequested: true }; break;
      }
      setApprovalState(s => ({ ...s, [selectedMemberId]: updated }));
      toast.success(`${ACTION_LABELS[actionType]}を実行しました`);
    }
    setActionDialogOpen(false);
    setSelectedMemberId(null);
    setActionType(null);
  };

  const getClosingBadge = (member: MemberMonthlyData) => {
    if (member.attendanceClosed) return <Badge className="bg-green-500">締め済み</Badge>;
    if (member.managerApproved) return <Badge variant="default">承認済み</Badge>;
    if (member.closingRequested) return <Badge variant="secondary">承認待ち</Badge>;
    return <Badge variant="outline">未締め</Badge>;
  };

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="min-w-[220px] text-center font-medium text-lg">{periodDisplay}</span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info('PDF出力機能は準備中です')}>
                <FileText className="h-4 w-4 mr-2" />PDF出力
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="名前・部署で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={closingFilter} onValueChange={setClosingFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="ステータス" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="open">未締め</SelectItem>
                <SelectItem value="pending">承認待ち</SelectItem>
                <SelectItem value="approved">承認済み</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="punch" className="space-y-4">
            <TabsList>
              <TabsTrigger value="punch" className="flex items-center gap-2"><Clock className="h-4 w-4" />打刻状況</TabsTrigger>
              {(isHR || isManager) && (
                <TabsTrigger value="summary" className="flex items-center gap-2"><Users className="h-4 w-4" />勤怠項目別集計</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="punch">
              <div className="w-full max-h-[calc(100vh-320px)] overflow-auto">
                <div className="min-w-[1600px]">
                  <Table containerClassName="overflow-visible">
                    <TableHeader className="sticky top-0 z-50 bg-muted shadow-md">
                      <TableRow className="bg-muted">
                        <TableHead className="w-[120px] min-w-[120px] sticky left-0 bg-muted z-30">氏名</TableHead>
                        <TableHead className="w-[50px] min-w-[50px] text-center sticky left-[120px] bg-muted z-30">一覧</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center sticky left-[170px] bg-muted z-30">承認申請</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center sticky left-[240px] bg-muted z-30">上長承認</TableHead>
                        <TableHead className="w-[70px] min-w-[70px] text-center sticky left-[310px] bg-muted z-30">勤怠締め</TableHead>
                        {monthDays.map(day => {
                          const dayOfWeek = getDay(day);
                          return (
                            <TableHead key={day.toISOString()} className={cn(
                              'w-[50px] text-center text-xs p-1',
                              dayOfWeek === 0 && 'text-red-500',
                              dayOfWeek === 6 && 'text-blue-500',
                              isToday(day) && 'bg-primary/10'
                            )}>
                              <div>{format(day, 'd')}</div>
                              <div className="text-[10px]">{TEAM_WEEKDAY_LABELS[dayOfWeek]}</div>
                            </TableHead>
                          );
                        })}
                        {(isHR || isManager) && <TableHead className="w-[320px] text-center">アクション</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6 + monthDays.length + (isHR || isManager ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                            メンバーが見つかりません
                          </TableCell>
                        </TableRow>
                      ) : filteredData.map(member => (
                        <TableRow key={member.memberId}>
                          <TableCell className="w-[120px] min-w-[120px] font-medium sticky left-0 bg-background z-10">
                            <div className="truncate">{member.memberName}</div>
                            <div className="text-xs text-muted-foreground truncate">{member.department}</div>
                          </TableCell>
                          <TableCell className="w-[50px] min-w-[50px] text-center sticky left-[120px] bg-background z-10">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedMemberId(member.memberId); setMemberDetailDialogOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="w-[70px] min-w-[70px] text-center sticky left-[170px] bg-background z-10">
                            {member.closingRequested ? <CheckCircle className="h-4 w-4 text-yellow-500 mx-auto" /> : <MinusCircle className="h-4 w-4 text-gray-300 mx-auto" />}
                          </TableCell>
                          <TableCell className="w-[70px] min-w-[70px] text-center sticky left-[240px] bg-background z-10">
                            {member.managerApproved ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : member.closingRequested ? <AlertCircle className="h-4 w-4 text-yellow-500 mx-auto" /> : <MinusCircle className="h-4 w-4 text-gray-300 mx-auto" />}
                          </TableCell>
                          <TableCell className="w-[70px] min-w-[70px] text-center sticky left-[310px] bg-background z-10">
                            {member.attendanceClosed ? <CheckCircle className="h-4 w-4 text-blue-500 mx-auto" /> : member.managerApproved ? <AlertCircle className="h-4 w-4 text-green-500 mx-auto" /> : <MinusCircle className="h-4 w-4 text-gray-300 mx-auto" />}
                          </TableCell>
                          {monthDays.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const record = member.dailyRecords.get(dateStr);
                            const dayOfWeek = getDay(day);
                            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
                            return (
                              <TableCell key={day.toISOString()} className={cn(
                                'text-center p-1 text-[10px] font-mono',
                                isWeekendDay && 'bg-gray-50 dark:bg-gray-900',
                                isToday(day) && 'bg-primary/10',
                                record && !isWeekendDay && 'cursor-pointer hover:bg-muted/50'
                              )} onClick={() => {
                                if (record && !isWeekendDay) {
                                  setSelectedDayDetail({ memberName: member.memberName, date: dateStr, checkIn: record.checkIn, checkOut: record.checkOut, status: record.status });
                                  setDayDetailDialogOpen(true);
                                }
                              }}>
                                {record && !isWeekendDay ? (
                                  <div className="space-y-0.5">
                                    {record.punchPairs ? record.punchPairs.map((pair, idx) => (
                                      <div key={idx} className={cn(idx > 0 && 'border-t border-dashed pt-0.5')}>
                                        <div className={cn(pair.checkIn && pair.checkIn > '09:30' && idx === 0 && 'text-orange-600')}>{pair.checkIn || '-'}</div>
                                        <div>{pair.checkOut || '-'}</div>
                                      </div>
                                    )) : (
                                      <>
                                        <div className={cn(record.checkIn && record.checkIn > '09:30' && 'text-orange-600')}>{record.checkIn || '-'}</div>
                                        <div>{record.checkOut || '-'}</div>
                                      </>
                                    )}
                                  </div>
                                ) : isWeekendDay ? <span className="text-gray-400">-</span> : <span className="text-gray-300">-</span>}
                              </TableCell>
                            );
                          })}
                          {(isHR || isManager) && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(member.memberId, 'reject')} disabled={!(member.closingRequested && !member.managerApproved)}>差し戻し</Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(member.memberId, 'approve')} disabled={!(member.closingRequested && !member.managerApproved)}>承認</Button>
                                {isHR && (
                                  <>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(member.memberId, 'cancel_approval')} disabled={!(member.managerApproved && !member.attendanceClosed)}>承認解除</Button>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(member.memberId, 'close')} disabled={!(member.managerApproved && !member.attendanceClosed)}>勤怠締め</Button>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(member.memberId, 'unlock')} disabled={!member.attendanceClosed}>締め解除</Button>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(member.memberId, 'proxy_close_request')} disabled={member.closingRequested || member.attendanceClosed}>代理締め</Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {(isHR || isManager) && (
              <TabsContent value="summary">
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-50 bg-muted shadow-md">
                        <TableRow className="bg-muted">
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
                            <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">メンバーが見つかりません</TableCell>
                          </TableRow>
                        ) : filteredData.map(member => (
                          <TableRow key={member.memberId}>
                            <TableCell className="font-medium">{member.memberName}</TableCell>
                            <TableCell>{member.department}</TableCell>
                            <TableCell className="text-right">{member.summary.workDays}日</TableCell>
                            <TableCell className="text-right">{member.summary.presentDays}日</TableCell>
                            <TableCell className="text-right">{member.summary.remoteDays}日</TableCell>
                            <TableCell className="text-right">
                              {member.summary.absentDays > 0 ? <span className="text-red-600 font-medium">{member.summary.absentDays}日</span> : '0日'}
                            </TableCell>
                            <TableCell className="text-right">
                              {member.summary.lateDays > 0 ? <span className="text-orange-600">{member.summary.lateDays}回</span> : '0回'}
                            </TableCell>
                            <TableCell className="text-right">
                              {member.summary.earlyLeaveDays > 0 ? <span className="text-yellow-600">{member.summary.earlyLeaveDays}回</span> : '0回'}
                            </TableCell>
                            <TableCell className="text-right font-mono">{member.summary.totalWorkHours.toFixed(1)}h</TableCell>
                            <TableCell className="text-right font-mono">
                              {member.summary.totalOvertimeHours > 0 ? (
                                <span className={cn(
                                  member.summary.totalOvertimeHours > 40 ? 'text-red-600 font-medium' :
                                  member.summary.totalOvertimeHours > 30 ? 'text-orange-600' : ''
                                )}>{member.summary.totalOvertimeHours.toFixed(1)}h</span>
                              ) : '0h'}
                            </TableCell>
                            <TableCell>{getClosingBadge(member)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <MemberDetailDialog
        open={memberDetailDialogOpen}
        onOpenChange={setMemberDetailDialogOpen}
        member={selectedMember}
        monthDays={monthDays}
        periodDisplay={periodDisplay}
      />

      <ActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        actionType={actionType}
        memberName={selectedMember?.memberName}
        actionMemo={actionMemo}
        onActionMemoChange={setActionMemo}
        onExecute={executeAction}
      />

      <DayDetailDialog
        open={dayDetailDialogOpen}
        onOpenChange={setDayDetailDialogOpen}
        detail={selectedDayDetail}
      />
    </>
  );
}
