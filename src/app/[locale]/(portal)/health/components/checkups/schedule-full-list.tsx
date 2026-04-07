'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Download, ArrowUpDown, Plus, MoreHorizontal, FileText, XCircle, ClipboardEdit } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { HealthCheckupSchedule, ScheduleStatus } from '@/types/health';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import { getCurrentFiscalYear } from '@/lib/utils';
import { ScheduleDialog } from './schedule-dialog';

export interface EnrichedSchedule extends HealthCheckupSchedule {
  birthDate?: string | null;
  birthDateWareki?: string;
  age?: number;
  gender?: string | null;
  insuranceNumber?: string | null;
  postalCode?: string | null;
  address?: string | null;
  phone?: string | null;
  institutionName?: string | null;
  optionNames?: string[];
  basePrice?: number | null;
}

interface ScheduleFullListProps {
  schedules: HealthCheckupSchedule[];
  departments: string[];
  onRefreshSchedules?: () => void;
  onUpdateScheduleStatus?: (id: string, status: ScheduleStatus) => Promise<void>;
  onRegisterResult?: (schedule: EnrichedSchedule) => void;
}

// 年度リスト生成（現在年度 ± 2年）
function getFiscalYearOptions(): number[] {
  const current = getCurrentFiscalYear();
  return [current + 1, current, current - 1, current - 2];
}

export function ScheduleFullList({
  schedules,
  departments,
  onRefreshSchedules,
  onUpdateScheduleStatus,
  onRegisterResult,
}: ScheduleFullListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterInstitution, setFilterInstitution] = useState('all');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(String(getCurrentFiscalYear()));
  const [sortBy, setSortBy] = useState<string>('scheduledDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // enrichedデータ取得
  const [enrichedSchedules, setEnrichedSchedules] = useState<EnrichedSchedule[]>([]);
  const [isLoadingEnriched, setIsLoadingEnriched] = useState(false);

  const fetchEnriched = useCallback(async () => {
    setIsLoadingEnriched(true);
    try {
      const res = await fetch(`/api/health/schedules?fiscalYear=${selectedFiscalYear}&enrich=true`);
      if (res.ok) {
        const data = await res.json();
        setEnrichedSchedules(data.data || []);
      }
    } catch {
      // fallback to non-enriched
    } finally {
      setIsLoadingEnriched(false);
    }
  }, [selectedFiscalYear]);

  useEffect(() => {
    fetchEnriched();
  }, [fetchEnriched]);

  // enrichedデータがなければschedulesをフォールバック
  const displaySchedules: EnrichedSchedule[] = useMemo(() => {
    if (enrichedSchedules.length > 0) return enrichedSchedules;
    // 非enrichedフォールバック: ローカルで名前解決
    return schedules.filter(s => String(s.fiscalYear) === selectedFiscalYear);
  }, [enrichedSchedules, schedules, selectedFiscalYear]);

  const { getActiveMedicalInstitutions } = useHealthMasterStore();
  const institutions = getActiveMedicalInstitutions();

  // 医療機関一覧
  const institutionNames = useMemo(() => {
    const map = new Map<string, string>();
    displaySchedules.forEach(s => {
      if (s.medicalInstitutionId) {
        const name = s.institutionName || institutions.find(i => i.id === s.medicalInstitutionId)?.name || s.medicalInstitutionId;
        map.set(s.medicalInstitutionId, name);
      }
    });
    return Array.from(map.entries());
  }, [displaySchedules, institutions]);

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
    const filtered = displaySchedules.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        s.userName.toLowerCase().includes(q) ||
        (s.departmentName?.toLowerCase().includes(q) ?? false) ||
        (s.scheduledDate && format(new Date(s.scheduledDate), 'yyyy/MM/dd').includes(q));
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
        case 'age':
          return dir * ((a.age || 0) - (b.age || 0));
        default:
          return 0;
      }
    });
  }, [displaySchedules, searchQuery, filterDepartment, filterInstitution, sortBy, sortOrder]);

  // CSV出力（B-6: 19列対応）
  const handleExportCSV = useCallback(() => {
    const headers = [
      '氏名', '部署', '生年月日(和暦)', '年齢', '性別', '被保険者整理番号',
      '郵便番号', '住所', '連絡先', '地域', '医療機関', '健診種類',
      '受診日', '時間', 'オプション', '基本料金', '会社負担オプション代',
      '合計', 'ステータス', '備考',
    ];
    const rows = filteredSchedules.map(s => [
      s.userName,
      s.departmentName || '',
      s.birthDateWareki || '',
      s.age != null ? String(s.age) : '',
      s.gender === 'male' ? '男' : s.gender === 'female' ? '女' : s.gender || '',
      s.insuranceNumber || '',
      s.postalCode || '',
      s.address || '',
      s.phone || '',
      s.region || '',
      s.institutionName || '',
      s.checkupTypeName,
      format(new Date(s.scheduledDate), 'yyyy/MM/dd'),
      s.scheduledTime || '',
      s.optionNames?.join('、') || '',
      s.basePrice != null ? String(s.basePrice) : '',
      s.companyPaidOptionCost != null ? String(s.companyPaidOptionCost) : '',
      s.totalCost != null ? String(s.totalCost) : '',
      s.status === 'scheduled' ? '予定' : s.status === 'completed' ? '完了' : 'キャンセル',
      s.notes || '',
    ]);

    const bom = '\uFEFF';
    const csvContent = bom + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `健診予定一覧_${selectedFiscalYear}年度_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [filteredSchedules, selectedFiscalYear]);

  const handleCancelSchedule = async (id: string) => {
    if (onUpdateScheduleStatus) {
      await onUpdateScheduleStatus(id, 'cancelled');
      fetchEnriched();
    }
  };

  const SortableHeader = ({ field, children, className }: { field: string; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 whitespace-nowrap ${className || ''}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortBy === field ? 'opacity-100' : 'opacity-30'}`} />
      </div>
    </TableHead>
  );

  // ステータス表示ロジック
  const getStatusDisplay = (schedule: EnrichedSchedule): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (schedule.status === 'cancelled') {
      return { label: 'キャンセル', variant: 'destructive' };
    }
    if (schedule.status === 'completed') {
      return { label: '受診済', variant: 'secondary' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(schedule.scheduledDate);
    scheduledDate.setHours(0, 0, 0, 0);
    if (scheduledDate <= today) {
      return { label: '受診済', variant: 'secondary' };
    }
    return { label: '予約済', variant: 'default' };
  };

  const fiscalYearOptions = getFiscalYearOptions();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>予定一覧（管理用）</CardTitle>
          <CardDescription>
            {selectedFiscalYear}年度 全従業員の健診予定 {filteredSchedules.length}件
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV出力
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            予定登録
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* B-2: 年度切替 */}
          <Select value={selectedFiscalYear} onValueChange={setSelectedFiscalYear}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fiscalYearOptions.map(y => (
                <SelectItem key={y} value={String(y)}>{y}年度</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* B-4: 検索 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="氏名・部署・受診日で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* B-5: フィルタ */}
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="部署" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての部署</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {institutionNames.length > 0 && (
            <Select value={filterInstitution} onValueChange={setFilterInstitution}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="医療機関" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての医療機関</SelectItem>
                {institutionNames.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 19列テーブル */}
        <ScrollArea className="w-full">
          <div className="min-w-[1800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="userName">氏名</SortableHeader>
                  <TableHead className="whitespace-nowrap">ステータス</TableHead>
                  <SortableHeader field="departmentName">部署</SortableHeader>
                  <TableHead className="whitespace-nowrap">生年月日</TableHead>
                  <SortableHeader field="age">年齢</SortableHeader>
                  <TableHead className="whitespace-nowrap">性別</TableHead>
                  <TableHead className="whitespace-nowrap">被保険者番号</TableHead>
                  <TableHead className="whitespace-nowrap">郵便番号</TableHead>
                  <TableHead className="whitespace-nowrap">住所</TableHead>
                  <TableHead className="whitespace-nowrap">連絡先</TableHead>
                  <TableHead className="whitespace-nowrap">地域</TableHead>
                  <TableHead className="whitespace-nowrap">医療機関</TableHead>
                  <TableHead className="whitespace-nowrap">健診種類</TableHead>
                  <SortableHeader field="scheduledDate">受診日</SortableHeader>
                  <TableHead className="whitespace-nowrap">時間</TableHead>
                  <TableHead className="whitespace-nowrap">オプション</TableHead>
                  <TableHead className="text-right whitespace-nowrap">料金</TableHead>
                  <TableHead className="text-right whitespace-nowrap">会社負担OP</TableHead>
                  <TableHead className="text-right whitespace-nowrap">合計</TableHead>
                  <TableHead className="whitespace-nowrap">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEnriched ? (
                  <TableRow>
                    <TableCell colSpan={20} className="text-center py-8 text-muted-foreground">
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={20} className="text-center text-muted-foreground py-8">
                      該当する予定がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium whitespace-nowrap">{s.userName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {(() => {
                          const st = getStatusDisplay(s);
                          return <Badge variant={st.variant}>{st.label}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{s.departmentName || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.birthDate ? (() => { const d = new Date(s.birthDate); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`; })() : '-'}</TableCell>
                      <TableCell className="text-right">{s.age != null ? s.age : '-'}</TableCell>
                      <TableCell>{s.gender === 'male' ? '男' : s.gender === 'female' ? '女' : s.gender || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.insuranceNumber || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.postalCode || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{s.address || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.phone || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.region || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.institutionName || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{s.checkupTypeName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(s.scheduledDate), 'yyyy/MM/dd', { locale: ja })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{s.scheduledTime || '-'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {s.optionNames && s.optionNames.length > 0 ? s.optionNames.join('、') : '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {s.basePrice != null ? `¥${s.basePrice.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {s.companyPaidOptionCost != null ? `¥${s.companyPaidOptionCost.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {s.totalCost != null ? `¥${s.totalCost.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              詳細表示
                            </DropdownMenuItem>
                            {onRegisterResult && (
                              <DropdownMenuItem onClick={() => onRegisterResult(s)}>
                                <ClipboardEdit className="mr-2 h-4 w-4" />
                                結果登録
                              </DropdownMenuItem>
                            )}
                            {s.status === 'scheduled' && (
                              <DropdownMenuItem onClick={() => handleCancelSchedule(s.id)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                キャンセル
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>

      {/* C-1: 予定登録ボタンから起動 */}
      <ScheduleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          onRefreshSchedules?.();
          fetchEnriched();
        }}
      />
    </Card>
  );
}
