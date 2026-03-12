'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, Download, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { HealthCheckupSchedule, ScheduleStatus } from '@/types/health';

interface ScheduleFullListProps {
  schedules: HealthCheckupSchedule[];
  departments: string[];
  onEditSchedule?: (schedule: HealthCheckupSchedule) => void;
  onDeleteSchedule?: (id: string) => void;
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

export function ScheduleFullList({
  schedules,
  departments,
  onEditSchedule,
  onDeleteSchedule,
}: ScheduleFullListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterInstitution, setFilterInstitution] = useState('all');
  const [sortBy, setSortBy] = useState<string>('scheduledDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 医療機関リスト（スケジュールデータから取得）
  const institutions = useMemo(() => {
    const instSet = new Map<string, string>();
    schedules.forEach(s => {
      if (s.medicalInstitutionId) {
        instSet.set(s.medicalInstitutionId, s.medicalInstitutionId);
      }
    });
    return Array.from(instSet.entries());
  }, [schedules]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // フィルタリング + ソート
  const filteredSchedules = useMemo(() => {
    const filtered = schedules.filter((s) => {
      const matchesSearch =
        s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesDepartment = filterDepartment === 'all' || s.departmentName === filterDepartment;
      const matchesInstitution = filterInstitution === 'all' || s.medicalInstitutionId === filterInstitution;
      return matchesSearch && matchesDepartment && matchesInstitution;
    });

    return filtered.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'userName':
          return dir * a.userName.localeCompare(b.userName, 'ja');
        case 'departmentName':
          return dir * (a.departmentName || '').localeCompare(b.departmentName || '', 'ja');
        case 'scheduledDate':
          return dir * (new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
        case 'checkupTypeName':
          return dir * a.checkupTypeName.localeCompare(b.checkupTypeName, 'ja');
        case 'status':
          return dir * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [schedules, searchQuery, filterDepartment, filterInstitution, sortBy, sortOrder]);

  // CSV出力
  const handleExportCSV = useCallback(() => {
    const headers = ['氏名', '部署', '受診日', '時間', '医療機関', '健診種類', 'ステータス', '備考'];
    const rows = filteredSchedules.map(s => [
      s.userName,
      s.departmentName || '',
      format(new Date(s.scheduledDate), 'yyyy/MM/dd'),
      s.scheduledTime || '',
      s.medicalInstitutionId || '',
      s.checkupTypeName,
      s.status === 'scheduled' ? '予定' : s.status === 'completed' ? '完了' : 'キャンセル',
      s.notes || '',
    ]);

    const bom = '\uFEFF';
    const csvContent = bom + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `健診予定一覧_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [filteredSchedules]);

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortBy === field ? 'opacity-100' : 'opacity-30'}`} />
      </div>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>予定一覧（管理用）</CardTitle>
          <CardDescription>全従業員の健診予定 {filteredSchedules.length}件</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1" />
          CSV出力
        </Button>
      </CardHeader>
      <CardContent>
        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="氏名・部署で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
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
          {institutions.length > 0 && (
            <Select value={filterInstitution} onValueChange={setFilterInstitution}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="医療機関" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての機関</SelectItem>
                {institutions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* テーブル */}
        <ScrollArea className="w-full">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="userName">氏名</SortableHeader>
                  <SortableHeader field="departmentName">部署</SortableHeader>
                  <SortableHeader field="scheduledDate">受診日</SortableHeader>
                  <TableHead className="whitespace-nowrap">時間</TableHead>
                  <TableHead className="whitespace-nowrap">医療機関</TableHead>
                  <SortableHeader field="checkupTypeName">健診種類</SortableHeader>
                  <TableHead className="whitespace-nowrap">備考</TableHead>
                  <SortableHeader field="status">ステータス</SortableHeader>
                  <TableHead className="text-right whitespace-nowrap">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium whitespace-nowrap">{schedule.userName}</TableCell>
                    <TableCell className="whitespace-nowrap">{schedule.departmentName || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(schedule.scheduledDate), 'yyyy/MM/dd', { locale: ja })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{schedule.scheduledTime || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{schedule.medicalInstitutionId || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{schedule.checkupTypeName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{schedule.notes || '-'}</TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {onEditSchedule && (
                          <Button variant="ghost" size="sm" onClick={() => onEditSchedule(schedule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteSchedule && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSchedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      該当する予定がありません
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
