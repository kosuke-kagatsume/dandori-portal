'use client';

import { useMemo } from 'react';
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
import { Search, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { HealthCheckup, OverallResult, FollowUpStatus } from '@/types/health';

interface ResultsListProps {
  checkups: HealthCheckup[];
  departments: string[];
  searchQuery: string;
  filterDepartment: string;
  filterResult: string;
  onSearchQueryChange: (query: string) => void;
  onFilterDepartmentChange: (dept: string) => void;
  onFilterResultChange: (result: string) => void;
  onViewDetails: (checkup: HealthCheckup) => void;
}

// 結果バッジの色を取得
const getResultBadgeColor = (result: OverallResult) => {
  switch (result) {
    case 'A':
      return 'bg-green-100 text-green-800';
    case 'B':
      return 'bg-blue-100 text-blue-800';
    case 'C':
      return 'bg-yellow-100 text-yellow-800';
    case 'D':
      return 'bg-orange-100 text-orange-800';
    case 'E':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getResultLabel = (result: OverallResult) => {
  switch (result) {
    case 'A':
      return '異常なし';
    case 'B':
      return '軽度異常';
    case 'C':
      return '要経過観察';
    case 'D':
      return '要精密検査';
    case 'E':
      return '要治療';
    default:
      return result;
  }
};

const getFollowUpStatusLabel = (status: FollowUpStatus) => {
  switch (status) {
    case 'completed':
      return '完了';
    case 'scheduled':
      return '予定あり';
    case 'none':
    default:
      return 'なし';
  }
};

export function ResultsList({
  checkups,
  departments,
  searchQuery,
  filterDepartment,
  filterResult,
  onSearchQueryChange,
  onFilterDepartmentChange,
  onFilterResultChange,
  onViewDetails,
}: ResultsListProps) {
  // フィルタリングされた健康診断データ
  const filteredCheckups = useMemo(() => {
    return checkups.filter((checkup) => {
      const matchesSearch =
        checkup.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (checkup.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesResult = filterResult === 'all' || checkup.overallResult === filterResult;
      const matchesDepartment = filterDepartment === 'all' || checkup.department === filterDepartment;
      return matchesSearch && matchesResult && matchesDepartment;
    });
  }, [checkups, searchQuery, filterResult, filterDepartment]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>健康診断結果一覧</CardTitle>
        <CardDescription>{filteredCheckups.length}件の健康診断結果</CardDescription>
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
          <Select value={filterResult} onValueChange={onFilterResultChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="判定結果" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての結果</SelectItem>
              <SelectItem value="A">A: 異常なし</SelectItem>
              <SelectItem value="B">B: 軽度異常</SelectItem>
              <SelectItem value="C">C: 要経過観察</SelectItem>
              <SelectItem value="D">D: 要精密検査</SelectItem>
              <SelectItem value="E">E: 要治療</SelectItem>
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
                <TableHead>受診日</TableHead>
                <TableHead>総合判定</TableHead>
                <TableHead>所見</TableHead>
                <TableHead>フォロー状況</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCheckups.map((checkup) => (
                <TableRow key={checkup.id}>
                  <TableCell className="font-medium">{checkup.userName}</TableCell>
                  <TableCell>{checkup.department || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(checkup.checkupDate), 'yyyy/MM/dd', { locale: ja })}
                  </TableCell>
                  <TableCell>
                    <Badge className={getResultBadgeColor(checkup.overallResult)}>
                      {checkup.overallResult}: {getResultLabel(checkup.overallResult)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {checkup.requiresReexam && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          要再検査
                        </Badge>
                      )}
                      {checkup.requiresTreatment && (
                        <Badge variant="outline" className="border-red-500 text-red-600">
                          要治療
                        </Badge>
                      )}
                      {checkup.findings.slice(0, 2).map((finding, i) => (
                        <Badge key={i} variant="secondary">
                          {finding}
                        </Badge>
                      ))}
                      {checkup.findings.length > 2 && (
                        <Badge variant="secondary">+{checkup.findings.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        checkup.followUpStatus === 'completed'
                          ? 'default'
                          : checkup.followUpStatus === 'scheduled'
                          ? 'outline'
                          : 'secondary'
                      }
                    >
                      {getFollowUpStatusLabel(checkup.followUpStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(checkup)}>
                      <FileText className="h-4 w-4 mr-1" />
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCheckups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    該当する結果がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
