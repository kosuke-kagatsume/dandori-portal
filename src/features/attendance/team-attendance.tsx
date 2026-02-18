'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertTriangle,
  Home,
  Building2,
  Search,
  Check,
  FileCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';

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
  workLocation: string | null;
  status: string;
}

interface TeamMemberAttendance {
  memberId: string;
  memberName: string;
  department: string;
  position: string;
  employeeNumber: string;
  status: 'present' | 'remote' | 'absent' | 'late' | 'early_leave' | 'weekend' | 'not_checked_in';
  checkIn: string | null;
  checkOut: string | null;
  workLocation?: string;
  workHours?: number;
  overtime?: number;
  closingStatus: 'open' | 'pending' | 'approved';
  alerts: string[];
}

interface TeamAttendanceSummary {
  memberId: string;
  memberName: string;
  department: string;
  workDays: number;
  presentDays: number;
  remoteDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  closingStatus: 'open' | 'pending' | 'approved';
}

export function TeamAttendance() {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id || 'tenant-1';
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closingFilter, setClosingFilter] = useState<string>('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'approve' | 'close' | 'reopen' | null>(null);

  // API data states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize date on client side
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Fetch team members and attendance data
  const fetchData = useCallback(async () => {
    if (!tenantId || !currentDate) return;

    setIsLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Fetch users and attendance in parallel
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

  const today = new Date();

  // Transform attendance data for today
  const teamAttendanceData: TeamMemberAttendance[] = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');

    return teamMembers.map(member => {
      const record = attendanceRecords.find(
        r => r.userId === member.id && r.date === todayStr
      );

      const alerts: string[] = [];
      let status: TeamMemberAttendance['status'] = 'not_checked_in';

      if (isWeekend(today)) {
        status = 'weekend';
      } else if (record) {
        if (record.status === 'absent') {
          status = 'absent';
        } else if (record.checkIn) {
          const checkInTime = record.checkIn;
          const isLate = checkInTime > '09:30';
          const isRemote = record.workLocation === 'home' || record.workLocation === 'remote';

          if (isLate) {
            status = 'late';
            alerts.push('遅刻');
          } else if (isRemote) {
            status = 'remote';
          } else {
            status = 'present';
          }

          if (!record.checkOut && record.checkIn) {
            alerts.push('未退勤');
          }
        }
      }

      // Calculate work hours if both checkIn and checkOut exist
      let workHours: number | undefined;
      if (record?.checkIn && record?.checkOut) {
        const [inH, inM] = record.checkIn.split(':').map(Number);
        const [outH, outM] = record.checkOut.split(':').map(Number);
        workHours = (outH * 60 + outM - inH * 60 - inM) / 60;
      }

      return {
        memberId: member.id,
        memberName: member.name,
        department: member.department || '',
        position: member.position || '',
        employeeNumber: member.employeeNumber || '',
        status,
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        workLocation: record?.workLocation || undefined,
        workHours,
        overtime: workHours && workHours > 8 ? workHours - 8 : 0,
        closingStatus: 'open' as const, // TODO: get from API
        alerts,
      };
    });
  }, [teamMembers, attendanceRecords, today]);

  // Monthly summary data
  const teamSummaryData: TeamAttendanceSummary[] = useMemo(() => {
    if (!currentDate) return [];

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const workDays = daysInMonth.filter(d => !isWeekend(d)).length;

    return teamMembers.map(member => {
      const memberRecords = attendanceRecords.filter(r => r.userId === member.id);

      let presentDays = 0;
      let remoteDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let earlyLeaveDays = 0;
      let totalWorkHours = 0;
      let totalOvertimeHours = 0;

      memberRecords.forEach(record => {
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

          if (record.checkIn > '09:30') {
            lateDays++;
          }

          if (record.checkOut && record.checkOut < '17:00') {
            earlyLeaveDays++;
          }

          // Calculate hours
          if (record.checkIn && record.checkOut) {
            const [inH, inM] = record.checkIn.split(':').map(Number);
            const [outH, outM] = record.checkOut.split(':').map(Number);
            const hours = (outH * 60 + outM - inH * 60 - inM) / 60;
            totalWorkHours += hours;
            if (hours > 8) {
              totalOvertimeHours += hours - 8;
            }
          }
        }
      });

      // Calculate absent days for days without records
      const workedOrAbsent = presentDays + remoteDays + absentDays;
      const daysUntilToday = daysInMonth.filter(d => !isWeekend(d) && d <= today).length;
      absentDays = Math.max(0, daysUntilToday - workedOrAbsent);

      return {
        memberId: member.id,
        memberName: member.name,
        department: member.department || '',
        workDays,
        presentDays,
        remoteDays,
        absentDays,
        lateDays,
        earlyLeaveDays,
        totalWorkHours,
        totalOvertimeHours,
        closingStatus: 'open' as const, // TODO: get from API
      };
    });
  }, [teamMembers, attendanceRecords, currentDate, today]);

  // Filtering
  const filteredAttendance = useMemo(() => {
    return teamAttendanceData.filter(member => {
      const matchesSearch = member.memberName.includes(searchQuery) ||
                           member.department.includes(searchQuery) ||
                           member.employeeNumber.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesClosing = closingFilter === 'all' || member.closingStatus === closingFilter;
      return matchesSearch && matchesStatus && matchesClosing;
    });
  }, [teamAttendanceData, searchQuery, statusFilter, closingFilter]);

  const filteredSummary = useMemo(() => {
    return teamSummaryData.filter(member => {
      const matchesSearch = member.memberName.includes(searchQuery) ||
                           member.department.includes(searchQuery);
      const matchesClosing = closingFilter === 'all' || member.closingStatus === closingFilter;
      return matchesSearch && matchesClosing;
    });
  }, [teamSummaryData, searchQuery, closingFilter]);

  // Selection controls
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedMembers.length === filteredAttendance.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredAttendance.map(m => m.memberId));
    }
  };

  // Bulk actions
  const handleBulkAction = (action: 'approve' | 'close' | 'reopen') => {
    if (selectedMembers.length === 0) {
      toast.error('メンバーを選択してください');
      return;
    }
    setBulkActionType(action);
    setBulkActionDialogOpen(true);
  };

  const executeBulkAction = () => {
    const actionLabels = {
      approve: '承認',
      close: '勤怠締め',
      reopen: '勤怠締め解除',
    };

    toast.success(`${selectedMembers.length}名の${actionLabels[bulkActionType!]}を実行しました`);
    setBulkActionDialogOpen(false);
    setSelectedMembers([]);
    setBulkActionType(null);
  };

  // Status badge
  const getStatusBadge = (status: TeamMemberAttendance['status']) => {
    const config = {
      present: { label: '出勤', variant: 'default' as const, className: 'bg-green-500' },
      remote: { label: '在宅', variant: 'secondary' as const, className: 'bg-blue-500 text-white' },
      absent: { label: '欠勤', variant: 'destructive' as const, className: '' },
      late: { label: '遅刻', variant: 'outline' as const, className: 'border-orange-500 text-orange-600' },
      early_leave: { label: '早退', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
      weekend: { label: '休日', variant: 'outline' as const, className: '' },
      not_checked_in: { label: '未出勤', variant: 'outline' as const, className: 'border-gray-400 text-gray-500' },
    };
    const { label, variant, className } = config[status];
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  const getClosingBadge = (status: 'open' | 'pending' | 'approved') => {
    const config = {
      open: { label: '未締め', variant: 'outline' as const },
      pending: { label: '承認待ち', variant: 'secondary' as const },
      approved: { label: '承認済み', variant: 'default' as const },
    };
    const { label, variant } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

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

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">チーム勤怠データを読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              チーム勤怠
            </CardTitle>
            <CardDescription>チームメンバーの勤怠状況を確認・管理</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center font-medium">
              {format(currentDate || new Date(), 'yyyy年M月', { locale: ja })}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
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
              placeholder="名前・部署・社員番号で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="present">出勤</SelectItem>
              <SelectItem value="remote">在宅</SelectItem>
              <SelectItem value="absent">欠勤</SelectItem>
              <SelectItem value="late">遅刻</SelectItem>
              <SelectItem value="not_checked_in">未出勤</SelectItem>
            </SelectContent>
          </Select>
          <Select value={closingFilter} onValueChange={setClosingFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="勤怠締め" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="open">未締め</SelectItem>
              <SelectItem value="pending">承認待ち</SelectItem>
              <SelectItem value="approved">承認済み</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk action buttons */}
        {selectedMembers.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">{selectedMembers.length}名選択中</span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('approve')}
            >
              <Check className="mr-1 h-4 w-4" />
              承認
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('close')}
            >
              <FileCheck className="mr-1 h-4 w-4" />
              勤怠締め
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('reopen')}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              締め解除
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="punch" className="space-y-4">
          <TabsList>
            <TabsTrigger value="punch" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              打刻状況
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              勤怠項目別集計
            </TabsTrigger>
          </TabsList>

          {/* Punch status tab */}
          <TabsContent value="punch">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMembers.length === filteredAttendance.length && filteredAttendance.length > 0}
                        onCheckedChange={toggleAllSelection}
                      />
                    </TableHead>
                    <TableHead>社員番号</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>出勤</TableHead>
                    <TableHead>退勤</TableHead>
                    <TableHead>勤務場所</TableHead>
                    <TableHead>勤怠締め</TableHead>
                    <TableHead>アラート</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        チームメンバーが見つかりません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendance.map((member) => (
                      <TableRow key={member.memberId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.includes(member.memberId)}
                            onCheckedChange={() => toggleMemberSelection(member.memberId)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{member.employeeNumber}</TableCell>
                        <TableCell className="font-medium">{member.memberName}</TableCell>
                        <TableCell>{member.department}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>
                          {member.checkIn ? (
                            <span className="font-mono">{member.checkIn}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.checkOut ? (
                            <span className="font-mono">{member.checkOut}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.workLocation === 'home' || member.workLocation === 'remote' ? (
                            <div className="flex items-center gap-1">
                              <Home className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">在宅</span>
                            </div>
                          ) : member.workLocation === 'office' ? (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span className="text-sm">オフィス</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getClosingBadge(member.closingStatus)}</TableCell>
                        <TableCell>
                          {member.alerts.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-xs text-orange-600">{member.alerts.join(', ')}</span>
                            </div>
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Monthly summary tab */}
          <TabsContent value="summary">
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedMembers.length === filteredSummary.length && filteredSummary.length > 0}
                          onCheckedChange={toggleAllSelection}
                        />
                      </TableHead>
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
                    {filteredSummary.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                          チームメンバーが見つかりません
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSummary.map((member) => (
                        <TableRow key={member.memberId}>
                          <TableCell>
                            <Checkbox
                              checked={selectedMembers.includes(member.memberId)}
                              onCheckedChange={() => toggleMemberSelection(member.memberId)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{member.memberName}</TableCell>
                          <TableCell>{member.department}</TableCell>
                          <TableCell className="text-right">{member.workDays}日</TableCell>
                          <TableCell className="text-right">{member.presentDays}日</TableCell>
                          <TableCell className="text-right">{member.remoteDays}日</TableCell>
                          <TableCell className="text-right">
                            {member.absentDays > 0 ? (
                              <span className="text-red-600 font-medium">{member.absentDays}日</span>
                            ) : (
                              '0日'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {member.lateDays > 0 ? (
                              <span className="text-orange-600">{member.lateDays}回</span>
                            ) : (
                              '0回'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {member.earlyLeaveDays > 0 ? (
                              <span className="text-yellow-600">{member.earlyLeaveDays}回</span>
                            ) : (
                              '0回'
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {member.totalWorkHours.toFixed(1)}h
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {member.totalOvertimeHours > 0 ? (
                              <span className={cn(
                                member.totalOvertimeHours > 40 ? 'text-red-600 font-medium' :
                                member.totalOvertimeHours > 30 ? 'text-orange-600' : ''
                              )}>
                                {member.totalOvertimeHours.toFixed(1)}h
                              </span>
                            ) : (
                              '0h'
                            )}
                          </TableCell>
                          <TableCell>{getClosingBadge(member.closingStatus)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">出勤: {teamAttendanceData.filter(m => m.status === 'present').length}名</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">在宅: {teamAttendanceData.filter(m => m.status === 'remote').length}名</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm">未出勤: {teamAttendanceData.filter(m => m.status === 'not_checked_in').length}名</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">欠勤: {teamAttendanceData.filter(m => m.status === 'absent').length}名</span>
          </div>
        </div>
      </CardContent>

      {/* Bulk action confirmation dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkActionType === 'approve' && '一括承認'}
              {bulkActionType === 'close' && '一括勤怠締め'}
              {bulkActionType === 'reopen' && '一括勤怠締め解除'}
            </DialogTitle>
            <DialogDescription>
              選択した{selectedMembers.length}名に対して操作を実行します。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">対象メンバー:</p>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {selectedMembers.map(id => {
                const member = teamMembers.find(m => m.id === id);
                return member ? (
                  <div key={id} className="text-sm">
                    {member.name} ({member.department})
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={executeBulkAction}>
              実行する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
