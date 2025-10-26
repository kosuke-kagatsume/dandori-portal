'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  UserCog,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { useOrganizationStore } from '@/lib/store/organization-store';
import type { TransferHistory } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TransferHistoryPanelProps {
  onAddTransfer?: () => void;
}

export function TransferHistoryPanel({ onAddTransfer }: TransferHistoryPanelProps) {
  const { getAllTransferHistories, getTransferHistoriesByUser } = useOrganizationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'transfer' | 'promotion' | 'demotion' | 'role_change'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all');

  // 異動履歴の取得とフィルター
  const allTransfers = getAllTransferHistories();

  const filteredTransfers = allTransfers.filter(transfer => {
    // 検索クエリでフィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !transfer.userName.toLowerCase().includes(query) &&
        !transfer.fromUnitName.toLowerCase().includes(query) &&
        !transfer.toUnitName.toLowerCase().includes(query) &&
        !transfer.fromPosition.toLowerCase().includes(query) &&
        !transfer.toPosition.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // タイプでフィルター
    if (filterType !== 'all' && transfer.type !== filterType) {
      return false;
    }

    // 期間でフィルター
    if (filterPeriod !== 'all') {
      const effectiveDate = new Date(transfer.effectiveDate);
      const now = new Date();
      const monthsAgo = {
        '1month': 1,
        '3months': 3,
        '6months': 6,
        '1year': 12
      }[filterPeriod] || 0;

      const cutoffDate = new Date(now);
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsAgo);

      if (effectiveDate < cutoffDate) {
        return false;
      }
    }

    return true;
  });

  // 異動タイプの表示名
  const transferTypeLabels: Record<TransferHistory['type'], string> = {
    transfer: '部門異動',
    promotion: '昇格',
    demotion: '降格',
    role_change: '役割変更'
  };

  // 異動タイプのアイコン
  const getTransferIcon = (type: TransferHistory['type']) => {
    switch (type) {
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4" />;
      case 'promotion':
        return <TrendingUp className="h-4 w-4" />;
      case 'demotion':
        return <TrendingDown className="h-4 w-4" />;
      case 'role_change':
        return <UserCog className="h-4 w-4" />;
    }
  };

  // 異動タイプのバッジ色
  const getTransferBadgeVariant = (type: TransferHistory['type']): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'transfer':
        return 'default';
      case 'promotion':
        return 'default';
      case 'demotion':
        return 'secondary';
      case 'role_change':
        return 'outline';
      default:
        return 'default';
    }
  };

  // CSV出力
  const handleExportCSV = () => {
    const headers = ['氏名', '異動タイプ', '異動前部門', '異動後部門', '異動前役職', '異動後役職', '発効日', '理由', '承認者', '登録者', '登録日'];
    const rows = filteredTransfers.map(t => [
      t.userName,
      transferTypeLabels[t.type],
      t.fromUnitName,
      t.toUnitName,
      t.fromPosition,
      t.toPosition,
      t.effectiveDate,
      t.reason || '',
      t.approvedByName || '',
      t.createdByName,
      t.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `異動履歴_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* フィルターとアクション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ArrowRightLeft className="h-5 w-5" />
              <span>異動履歴</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV出力
              </Button>
              {onAddTransfer && (
                <Button size="sm" onClick={onAddTransfer}>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  異動登録
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="氏名・部門・役職で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* タイプフィルター */}
            <Select value={filterType} onValueChange={(value) => setFilterType(value as 'all' | 'transfer' | 'promotion' | 'demotion' | 'role_change')}>
              <SelectTrigger>
                <SelectValue placeholder="異動タイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="transfer">部門異動</SelectItem>
                <SelectItem value="promotion">昇格</SelectItem>
                <SelectItem value="demotion">降格</SelectItem>
                <SelectItem value="role_change">役割変更</SelectItem>
              </SelectContent>
            </Select>

            {/* 期間フィルター */}
            <Select value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as 'all' | '1month' | '3months' | '6months' | '1year')}>
              <SelectTrigger>
                <SelectValue placeholder="期間" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全期間</SelectItem>
                <SelectItem value="1month">1ヶ月以内</SelectItem>
                <SelectItem value="3months">3ヶ月以内</SelectItem>
                <SelectItem value="6months">6ヶ月以内</SelectItem>
                <SelectItem value="1year">1年以内</SelectItem>
              </SelectContent>
            </Select>

            {/* 件数表示 */}
            <div className="flex items-center justify-end">
              <Badge variant="secondary">
                {filteredTransfers.length}件
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 異動履歴テーブル */}
      <Card>
        <CardContent className="p-0">
          {filteredTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowRightLeft className="h-12 w-12 mb-4 opacity-20" />
              <p>異動履歴がありません</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>異動タイプ</TableHead>
                  <TableHead>異動前</TableHead>
                  <TableHead>異動後</TableHead>
                  <TableHead>発効日</TableHead>
                  <TableHead>理由</TableHead>
                  <TableHead>承認者</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.userName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTransferBadgeVariant(transfer.type)} className="flex items-center space-x-1 w-fit">
                        {getTransferIcon(transfer.type)}
                        <span>{transferTypeLabels[transfer.type]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{transfer.fromUnitName}</div>
                        <div className="text-xs text-muted-foreground">{transfer.fromPosition}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{transfer.toUnitName}</div>
                        <div className="text-xs text-muted-foreground">{transfer.toPosition}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(transfer.effectiveDate), 'yyyy年M月d日', { locale: ja })}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm truncate" title={transfer.reason}>
                        {transfer.reason || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transfer.approvedByName || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
