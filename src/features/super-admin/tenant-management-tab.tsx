'use client';

import { useState, useEffect } from 'react';
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
import { Building2, Plus, Search, Users, DollarSign, Calendar } from 'lucide-react';
import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { CreateTenantDialog } from '@/features/billing/create-tenant-dialog';

export function TenantManagementTab() {
  const router = useRouter();
  const { tenants, initializeTenants } = useAdminTenantStore();
  const { getInvoicesByTenant, getStats, initializeInvoices } = useInvoiceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // 初期化
  useEffect(() => {
    initializeTenants();
    initializeInvoices();
  }, [initializeTenants, initializeInvoices]);

  // 検索フィルター
  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 各テナントの統計を取得
  const getTenantStats = (tenantId: string) => {
    const invoices = getInvoicesByTenant(tenantId);
    const stats = getStats(tenantId);
    const latestInvoice = invoices[0]; // 最新の請求書

    return {
      invoiceCount: stats.totalInvoices,
      totalAmount: stats.totalAmount,
      unpaidAmount: stats.unpaidAmount,
      overdueCount: stats.overdueCount,
      latestInvoiceDate: latestInvoice?.billingMonth,
    };
  };

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
        <Button onClick={() => setCreateDialogOpen(true)}>
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
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総請求額（今月）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{tenants.reduce((sum, tenant) => {
                const stats = getStats(tenant.id);
                return sum + stats.totalAmount;
              }, 0).toLocaleString()}
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
              ¥{tenants.reduce((sum, tenant) => {
                const stats = getStats(tenant.id);
                return sum + stats.unpaidAmount;
              }, 0).toLocaleString()}
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
              {tenants.filter(tenant => {
                const stats = getStats(tenant.id);
                return stats.overdueCount > 0;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="テナント名またはIDで検索..."
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
                <TableHead>テナントID</TableHead>
                <TableHead>請求書</TableHead>
                <TableHead>総請求額</TableHead>
                <TableHead>未払い額</TableHead>
                <TableHead>最新請求月</TableHead>
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
                  const stats = getTenantStats(tenant.id);
                  const hasOverdue = stats.overdueCount > 0;
                  const hasUnpaid = stats.unpaidAmount > 0;

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
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tenant.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        {stats.invoiceCount}件
                      </TableCell>
                      <TableCell>
                        ¥{stats.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={hasUnpaid ? 'text-yellow-600 font-medium' : ''}>
                          ¥{stats.unpaidAmount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {stats.latestInvoiceDate ? (
                          new Date(stats.latestInvoiceDate).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                          })
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasOverdue ? (
                          <Badge variant="destructive">期限超過</Badge>
                        ) : hasUnpaid ? (
                          <Badge variant="default">未払いあり</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            正常
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
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}
