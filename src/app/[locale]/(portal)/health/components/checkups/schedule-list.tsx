'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Check, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { HealthCheckupSchedule, ScheduleStatus } from '@/types/health';
import { ScheduleDialog } from './schedule-dialog';

interface ScheduleListProps {
  schedules: HealthCheckupSchedule[];
  departments: string[];
  searchQuery: string;
  filterDepartment: string;
  onSearchQueryChange: (query: string) => void;
  onFilterDepartmentChange: (dept: string) => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

const getStatusBadge = (status: ScheduleStatus) => {
  switch (status) {
    case 'scheduled':
      return <Badge variant="outline" className="border-blue-500 text-blue-600">予定</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">完了</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">キャンセル</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function ScheduleList({
  schedules,
  departments,
  searchQuery,
  filterDepartment,
  onSearchQueryChange,
  onFilterDepartmentChange,
  onRefresh,
  isAdmin,
}: ScheduleListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // フィルタリングされた予定一覧
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesSearch =
        schedule.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (schedule.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesDepartment =
        filterDepartment === 'all' || schedule.departmentName === filterDepartment;
      const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [schedules, searchQuery, filterDepartment, filterStatus]);

  // 統計
  const stats = useMemo(() => {
    const total = schedules.length;
    const scheduled = schedules.filter((s) => s.status === 'scheduled').length;
    const completed = schedules.filter((s) => s.status === 'completed').length;
    return { total, scheduled, completed };
  }, [schedules]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>健康診断予定一覧</CardTitle>
            <CardDescription>
              {stats.total}件中 {stats.scheduled}件が予定中、{stats.completed}件が完了
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              更新
            </Button>
            {isAdmin && (
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                予定登録
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="氏名・部署で検索..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDepartment} onValueChange={onFilterDepartmentChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="部署" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての部署</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="scheduled">予定</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="cancelled">キャンセル</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* テーブル */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>部署</TableHead>
                <TableHead>健診種別</TableHead>
                <TableHead>予定日</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.userName}</TableCell>
                  <TableCell>{schedule.departmentName || '-'}</TableCell>
                  <TableCell>{schedule.checkupTypeName}</TableCell>
                  <TableCell>
                    {format(new Date(schedule.scheduledDate), 'yyyy/MM/dd', { locale: ja })}
                  </TableCell>
                  <TableCell>{schedule.scheduledTime || '-'}</TableCell>
                  <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin && schedule.status === 'scheduled' && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="完了にする">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" title="キャンセル">
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredSchedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    該当する予定がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* 予定登録ダイアログ */}
      <ScheduleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={onRefresh}
      />
    </Card>
  );
}
