'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// デモ用チームメンバーデータ
const DEMO_TEAM_MEMBERS = [
  { id: '1', name: '田中太郎', department: '開発部', position: 'エンジニア', employeeNumber: 'EMP001' },
  { id: '2', name: '佐藤花子', department: '開発部', position: 'デザイナー', employeeNumber: 'EMP002' },
  { id: '3', name: '鈴木一郎', department: '営業部', position: '営業', employeeNumber: 'EMP003' },
  { id: '4', name: '高橋美咲', department: '開発部', position: 'PM', employeeNumber: 'EMP004' },
  { id: '5', name: '伊藤健太', department: '人事部', position: '人事担当', employeeNumber: 'EMP005' },
  { id: '6', name: '渡辺優子', department: '経理部', position: '経理担当', employeeNumber: 'EMP006' },
  { id: '7', name: '山本大輔', department: '開発部', position: 'エンジニア', employeeNumber: 'EMP007' },
  { id: '8', name: '中村真理', department: '営業部', position: '営業', employeeNumber: 'EMP008' },
];

// デモ用勤怠データ生成
const generateDemoAttendance = (memberId: string, date: Date) => {
  const rand = Math.random();
  const isWeekendDay = isWeekend(date);

  if (isWeekendDay) {
    return { status: 'weekend' as const, checkIn: null, checkOut: null };
  }

  if (rand < 0.1) {
    return { status: 'absent' as const, checkIn: null, checkOut: null };
  }

  const checkInHour = 8 + Math.floor(Math.random() * 2);
  const checkInMinute = Math.floor(Math.random() * 60);
  const checkOutHour = 17 + Math.floor(Math.random() * 3);
  const checkOutMinute = Math.floor(Math.random() * 60);

  const isLate = checkInHour >= 9 && checkInMinute > 30;
  const isRemote = rand > 0.7;

  return {
    status: isLate ? 'late' as const : isRemote ? 'remote' as const : 'present' as const,
    checkIn: `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}`,
    checkOut: rand > 0.2 ? `${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}` : null,
    workLocation: isRemote ? 'home' : 'office',
  };
};

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closingFilter, setClosingFilter] = useState<string>('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'approve' | 'close' | 'reopen' | null>(null);

  // 今日の日付
  const today = new Date();

  // チームメンバーの勤怠データを生成
  const teamAttendanceData: TeamMemberAttendance[] = useMemo(() => {
    return DEMO_TEAM_MEMBERS.map(member => {
      const attendance = generateDemoAttendance(member.id, today);
      const alerts: string[] = [];

      if (attendance.status === 'late') {
        alerts.push('遅刻');
      }
      if (!attendance.checkOut && attendance.checkIn) {
        alerts.push('未退勤');
      }

      return {
        memberId: member.id,
        memberName: member.name,
        department: member.department,
        position: member.position,
        employeeNumber: member.employeeNumber,
        status: attendance.checkIn ? attendance.status : 'not_checked_in',
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        workLocation: attendance.workLocation,
        workHours: attendance.checkIn && attendance.checkOut ? 8 + Math.random() * 2 : undefined,
        overtime: Math.random() > 0.7 ? Math.random() * 3 : 0,
        closingStatus: Math.random() > 0.7 ? 'approved' : Math.random() > 0.5 ? 'pending' : 'open',
        alerts,
      };
    });
  }, [today]);

  // 月間集計データを生成
  const teamSummaryData: TeamAttendanceSummary[] = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const workDays = daysInMonth.filter(d => !isWeekend(d)).length;

    return DEMO_TEAM_MEMBERS.map(member => {
      const presentDays = Math.floor(workDays * (0.85 + Math.random() * 0.15));
      const remoteDays = Math.floor(presentDays * (0.2 + Math.random() * 0.3));
      const absentDays = workDays - presentDays;
      const lateDays = Math.floor(Math.random() * 3);
      const earlyLeaveDays = Math.floor(Math.random() * 2);

      return {
        memberId: member.id,
        memberName: member.name,
        department: member.department,
        workDays,
        presentDays,
        remoteDays,
        absentDays,
        lateDays,
        earlyLeaveDays,
        totalWorkHours: presentDays * 8 + Math.random() * 20,
        totalOvertimeHours: Math.random() * 30,
        closingStatus: Math.random() > 0.7 ? 'approved' : Math.random() > 0.5 ? 'pending' : 'open',
      };
    });
  }, [currentDate]);

  // フィルタリング
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

  // 選択制御
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

  // 一括操作
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

  // ステータスバッジ
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

  // 月移動
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

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
              {format(currentDate, 'yyyy年M月', { locale: ja })}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* フィルター */}
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

        {/* 一括操作ボタン */}
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

        {/* タブ */}
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

          {/* 打刻状況タブ */}
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
                  {filteredAttendance.map((member) => (
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
                        {member.workLocation === 'home' ? (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 勤怠項目別集計タブ */}
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
                    {filteredSummary.map((member) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* サマリー */}
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

      {/* 一括操作確認ダイアログ */}
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
                const member = DEMO_TEAM_MEMBERS.find(m => m.id === id);
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
