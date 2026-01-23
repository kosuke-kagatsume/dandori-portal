'use client';

/**
 * テナント管理画面（DW社管理者用）
 *
 * - 統計ダッシュボード
 * - テナント一覧（カード/テーブル表示切替）
 * - 検索・フィルター機能
 */

import { useState } from 'react';
import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  DollarSign,
  Users,
  FileWarning,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Filter,
} from 'lucide-react';
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
import Link from 'next/link';

type ViewMode = 'card' | 'table';

export default function AdminTenantsPage() {
  const { tenants, getStats } = useAdminTenantStore();
  const stats = getStats();

  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // フィルター処理
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.settings?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">テナント管理</h1>
          <p className="text-muted-foreground mt-1">全テナントの管理と監視</p>
        </div>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          新規テナント追加
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">総テナント数</p>
              <p className="text-3xl font-bold mt-2">{stats.totalTenants}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge variant="outline" className="text-xs">
              有効: {stats.byStatus.active}
            </Badge>
            <Badge variant="outline" className="text-xs">
              試用: {stats.byStatus.trial}
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">月次収益</p>
              <p className="text-3xl font-bold mt-2">¥{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">全テナント合計（税込）</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">総ユーザー数</p>
              <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">アクティブユーザー合計</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">未払い請求書</p>
              <p className="text-3xl font-bold mt-2">{stats.unpaidInvoices}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <FileWarning className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          {stats.unpaidInvoices > 0 && (
            <Badge variant="destructive" className="mt-4 text-xs">
              要対応
            </Badge>
          )}
        </Card>
      </div>

      {/* 検索・フィルター・表示切替 */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="テナント名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="trial">試用中</SelectItem>
              <SelectItem value="active">有効</SelectItem>
              <SelectItem value="suspended">停止中</SelectItem>
              <SelectItem value="cancelled">解約済み</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* テナント一覧 */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold">{tenant.name}</h3>
                    <Badge
                      variant={
                        tenant.settings?.status === 'active'
                          ? 'default'
                          : tenant.settings?.status === 'trial'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="mt-1"
                    >
                      {tenant.settings?.status === 'active'
                        ? '有効'
                        : tenant.settings?.status === 'trial'
                        ? '試用中'
                        : tenant.settings?.status === 'suspended'
                        ? '停止中'
                        : '解約済み'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">アクティブユーザー</span>
                  <span className="font-medium">{tenant.activeUsers}名</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">月次収益</span>
                  <span className="font-medium">¥{(tenant.monthlyRevenue ?? 0).toLocaleString()}</span>
                </div>
                {(tenant.unpaidInvoices ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">未払い請求書</span>
                    <Badge variant="destructive" className="text-xs">
                      {tenant.unpaidInvoices}件
                    </Badge>
                  </div>
                )}
              </div>

              <Link href={`/dw-admin/tenants/${tenant.id}`}>
                <Button className="w-full" variant="outline">
                  詳細を見る
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テナント名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">ユーザー数</TableHead>
                <TableHead className="text-right">月次収益</TableHead>
                <TableHead className="text-right">未払い</TableHead>
                <TableHead className="text-right">契約期間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tenant.settings?.status === 'active'
                          ? 'default'
                          : tenant.settings?.status === 'trial'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {tenant.settings?.status === 'active'
                        ? '有効'
                        : tenant.settings?.status === 'trial'
                        ? '試用中'
                        : tenant.settings?.status === 'suspended'
                        ? '停止中'
                        : '解約済み'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{tenant.activeUsers}名</TableCell>
                  <TableCell className="text-right">
                    ¥{(tenant.monthlyRevenue ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(tenant.unpaidInvoices ?? 0) > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {tenant.unpaidInvoices}件
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {tenant.settings?.contractStartDate
                      ? `${new Date(tenant.settings.contractStartDate).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}`
                      : 'トライアル'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dw-admin/tenants/${tenant.id}`}>
                      <Button variant="ghost" size="sm">
                        詳細
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredTenants.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">条件に一致するテナントが見つかりませんでした</p>
        </Card>
      )}
    </div>
  );
}
