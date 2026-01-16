'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Search,
  Download,
  Filter,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle,
  // Calendar, // 日付ピッカーで使用予定
  User,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useAuditStore, type AuditCategory, type AuditAction } from '@/lib/store/audit-store';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function AuditPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logs: _logs, getLogs, getStats, clearLogs } = useAuditStore(); // logsは直接使用せずgetLogsでフィルタリング

  // フィルター状態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'info' | 'warning' | 'error' | 'critical'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // フィルタリングされたログ
  const filteredLogs = useMemo(() => {
    return getLogs({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      action: selectedAction !== 'all' ? selectedAction : undefined,
      severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      searchQuery: searchQuery || undefined,
    });
  }, [getLogs, selectedCategory, selectedAction, selectedSeverity, startDate, endDate, searchQuery]);

  // 統計データ
  const stats = getStats();

  // Severity アイコン
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Severity バッジバリアント（将来的にバッジ色変更で使用予定）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getSeverityVariant = (severity: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'info':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // CSV エクスポート
  const handleExportCSV = () => {
    const headers = ['タイムスタンプ', 'ユーザー', '操作', 'カテゴリ', '対象', '説明', '重要度', 'IPアドレス'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ja }),
      log.userName,
      log.action,
      log.category,
      log.targetType,
      log.description,
      log.severity,
      log.ipAddress || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`;
    link.click();
  };

  // ログクリア
  const handleClearLogs = () => {
    if (confirm('30日以前のログを削除しますか？')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      clearLogs(thirtyDaysAgo.toISOString());
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            監査ログ
          </h1>
          <p className="text-muted-foreground mt-2">
            システムの操作履歴とセキュリティイベントを管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV出力
          </Button>
          <Button variant="destructive" onClick={handleClearLogs}>
            30日以前を削除
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ログ数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">全期間</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">重大イベント</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.bySeverity.critical || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">緊急対応が必要</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">エラー</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.bySeverity.error || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">要確認</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">警告</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.bySeverity.warning || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">注意が必要</p>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as AuditCategory | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全カテゴリ</SelectItem>
                <SelectItem value="auth">認証</SelectItem>
                <SelectItem value="user">ユーザー</SelectItem>
                <SelectItem value="attendance">勤怠</SelectItem>
                <SelectItem value="leave">休暇</SelectItem>
                <SelectItem value="workflow">ワークフロー</SelectItem>
                <SelectItem value="payroll">給与</SelectItem>
                <SelectItem value="organization">組織</SelectItem>
                <SelectItem value="settings">設定</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
                <SelectItem value="assets">資産</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedAction} onValueChange={(v) => setSelectedAction(v as AuditAction | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全操作</SelectItem>
                <SelectItem value="login">ログイン</SelectItem>
                <SelectItem value="logout">ログアウト</SelectItem>
                <SelectItem value="create">作成</SelectItem>
                <SelectItem value="update">更新</SelectItem>
                <SelectItem value="delete">削除</SelectItem>
                <SelectItem value="approve">承認</SelectItem>
                <SelectItem value="reject">却下</SelectItem>
                <SelectItem value="export">エクスポート</SelectItem>
                <SelectItem value="import">インポート</SelectItem>
                <SelectItem value="access">アクセス</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSeverity} onValueChange={(v) => setSelectedSeverity(v as 'all' | 'info' | 'warning' | 'error' | 'critical')}>
              <SelectTrigger>
                <SelectValue placeholder="重要度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="info">情報</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="error">エラー</SelectItem>
                <SelectItem value="critical">重大</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="開始日"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="終了日"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ログテーブル */}
      <Card>
        <CardHeader>
          <CardTitle>操作履歴</CardTitle>
          <CardDescription>
            {filteredLogs.length.toLocaleString()} 件のログ（全 {stats.totalLogs.toLocaleString()} 件中）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">重要度</TableHead>
                <TableHead className="w-[180px]">タイムスタンプ</TableHead>
                <TableHead>ユーザー</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>対象</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="w-[140px]">IPアドレス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    該当するログがありません
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {getSeverityIcon(log.severity)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ja })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{log.userName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{log.userRole}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{log.targetType}</div>
                      {log.targetName && (
                        <div className="text-xs text-muted-foreground">{log.targetName}</div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={log.description}>
                        {log.description}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* カテゴリ別統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            カテゴリ別統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium capitalize">{category}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
