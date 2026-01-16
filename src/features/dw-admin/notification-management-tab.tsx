'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import {
  useNotificationHistoryStore,
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
  type NotificationStatus,
} from '@/lib/store/notification-history-store';

export function NotificationManagementTab() {
  const router = useRouter();
  const {
    getAllNotifications,
    getStats,
  } = useNotificationHistoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'all'>('all');

  const stats = getStats();
  const allNotifications = getAllNotifications();

  // フィルタリング
  const filteredNotifications = useMemo(() => {
    let filtered = allNotifications;

    // タイプフィルタ
    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    // ステータスフィルタ
    if (statusFilter !== 'all') {
      filtered = filtered.filter((n) => n.status === statusFilter);
    }

    // 検索フィルタ
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.tenantName.toLowerCase().includes(term) ||
          n.recipientEmail.toLowerCase().includes(term) ||
          n.subject.toLowerCase().includes(term) ||
          (n.invoiceNumber && n.invoiceNumber.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [allNotifications, typeFilter, statusFilter, searchTerm]);

  // ステータスバッジ
  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            送信済み
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            失敗
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            送信待ち
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総送信数</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground mt-1">送信済み通知</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">送信失敗</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
            <p className="text-xs text-muted-foreground mt-1">エラー件数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">送信待ち</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground mt-1">ペンディング</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">請求書発行</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.invoice_sent}</div>
            <p className="text-xs text-muted-foreground mt-1">発行通知数</p>
          </CardContent>
        </Card>
      </div>

      {/* 通知タイプ別統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            通知タイプ別送信数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{count}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {NOTIFICATION_TYPE_LABELS[type as NotificationType]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* フィルタ・検索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            通知履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* 検索 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="テナント名、メールアドレス、件名、請求書番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* タイプフィルタ */}
            <Select value={typeFilter} onValueChange={(v: NotificationType | 'all') => setTypeFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="通知タイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのタイプ</SelectItem>
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ステータスフィルタ */}
            <Select value={statusFilter} onValueChange={(v: NotificationStatus | 'all') => setStatusFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="sent">送信済み</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
                <SelectItem value="pending">送信待ち</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 通知履歴テーブル */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>送信日時</TableHead>
                  <TableHead>通知タイプ</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead>受信者</TableHead>
                  <TableHead>件名</TableHead>
                  <TableHead>請求書番号</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      該当する通知履歴がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(notification.sentAt).toLocaleString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {NOTIFICATION_TYPE_LABELS[notification.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {notification.tenantName}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {notification.recipientEmail}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {notification.subject}
                      </TableCell>
                      <TableCell>
                        {notification.invoiceNumber ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {notification.invoiceNumber}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(notification.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dw-admin/notifications/${notification.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 結果件数 */}
          <div className="mt-4 text-sm text-muted-foreground">
            {filteredNotifications.length} 件の通知履歴
            {(typeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
              <span className="ml-2">
                （全 {allNotifications.length} 件中）
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
