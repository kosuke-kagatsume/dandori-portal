'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Building2, Plus, Search, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { useTenants, useTenantStats } from '@/hooks/use-dw-admin-api';
import { CreateTenantDialog } from '@/features/billing/create-tenant-dialog';

export function TenantManagementTab() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // APIからデータ取得
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError, mutate } = useTenants();
  const { data: statsData } = useTenantStats();

  // ローディング中
  if (tenantsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  // エラー
  if (tenantsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">データの取得に失敗しました</p>
        <Button variant="outline" className="mt-4" onClick={() => mutate()}>
          再読み込み
        </Button>
      </div>
    );
  }

  // fetcherはAPIレスポンスのdataプロパティを直接返すので、
  // tenantsDataには{ tenants: [...], summary: {...}, pagination: {...} }が入っている
  const tenants = tenantsData?.tenants || [];
  const stats = statsData;

  // 検索フィルター
  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tenant.subdomain && tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 統計計算
  const totalAmount = tenants.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const unpaidAmount = tenants.reduce((sum, t) => sum + (t.unpaidAmount || 0), 0);
  const overdueTenantsCount = tenants.filter((t) => (t.overdueCount || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">テナント管理</h2>
          <p className="text-sm text-muted-foreground mt-1">
            全テナントの管理と請求状況の確認
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規テナント作成
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総テナント数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overview?.totalTenants || tenants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総請求額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              未払い総額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ¥{unpaidAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              期限超過テナント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueTenantsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="テナント名またはサブドメインで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* テナント一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>テナント一覧</CardTitle>
          <CardDescription>
            全{filteredTenants.length}件のテナント
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>テナント</TableHead>
                <TableHead>サブドメイン</TableHead>
                <TableHead>ユーザー数</TableHead>
                <TableHead>請求書</TableHead>
                <TableHead>総請求額</TableHead>
                <TableHead>未払い額</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    テナントが見つかりませんでした
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => {
                  const hasOverdue = tenant.overdueCount > 0;
                  const hasUnpaid = tenant.unpaidAmount > 0;

                  return (
                    <TableRow
                      key={tenant.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dw-admin/tenants/${tenant.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tenant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.subdomain ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <span>{tenant.subdomain}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tenant.userCount}名
                      </TableCell>
                      <TableCell>
                        {tenant.invoiceCount}件
                      </TableCell>
                      <TableCell>
                        ¥{tenant.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={hasUnpaid ? 'text-yellow-600 font-medium' : ''}>
                          ¥{tenant.unpaidAmount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {hasOverdue ? (
                          <Badge variant="destructive">期限超過</Badge>
                        ) : hasUnpaid ? (
                          <Badge variant="default">未払いあり</Badge>
                        ) : tenant.settings?.status === 'trial' ? (
                          <Badge variant="secondary">トライアル</Badge>
                        ) : tenant.settings?.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            正常
                          </Badge>
                        ) : tenant.settings?.status === 'suspended' ? (
                          <Badge variant="destructive">停止中</Badge>
                        ) : (
                          <Badge variant="outline">
                            {tenant.settings?.status || '不明'}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* テナント作成ダイアログ */}
      <CreateTenantDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          mutate(); // テナント一覧を再取得
        }}
      />
    </div>
  );
}
