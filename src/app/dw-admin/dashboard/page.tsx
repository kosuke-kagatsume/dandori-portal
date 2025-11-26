'use client';

import { useMemo, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Mail,
  FileText,
  Calendar,
  Building2,
  LayoutDashboard,
  Bell,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
import { useNotificationHistoryStore } from '@/lib/store/notification-history-store';
import { TenantManagementTab } from '@/features/dw-admin/tenant-management-tab';
import { PaymentManagementTab } from '@/features/dw-admin/payment-management-tab';
import { NotificationManagementTab } from '@/features/dw-admin/notification-management-tab';
import { PaymentReminderTab } from '@/features/dw-admin/payment-reminder-tab';
import { InvoiceAutoGenerationTab } from '@/features/dw-admin/invoice-auto-generation-tab';
import { useIsMounted } from '@/hooks/useIsMounted';
import { initializeDWAdminDemo } from '@/lib/demo-data/initialize-dw-admin-demo';
import { toast } from 'sonner';

function DWAdminDashboardPage() {
  const mounted = useIsMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAllInvoices, getStats, initializeInvoices } = useInvoiceStore();
  const { tenants, initializeTenants } = useAdminTenantStore();
  const { getStats: getNotificationStats, initializeNotifications } = useNotificationHistoryStore();
  const [isInitializing, setIsInitializing] = useState(false);

  // URLパラメータからタブを取得（デフォルトは 'dashboard'）
  const activeTab = searchParams.get('tab') || 'dashboard';

  // タブ変更ハンドラー
  const handleTabChange = (value: string) => {
    router.push(`/dw-admin/dashboard?tab=${value}`);
  };

  // 初期化
  useEffect(() => {
    initializeTenants();
    initializeInvoices();
    initializeNotifications();
  }, [initializeTenants, initializeInvoices, initializeNotifications]);

  // デモデータ初期化ハンドラー
  const handleInitializeDemo = () => {
    setIsInitializing(true);
    try {
      const result = initializeDWAdminDemo();
      toast.success(
        `デモデータを初期化しました！\nテナント: ${result.tenants}件\n請求書: ${result.invoices}件\n通知: ${result.notifications}件\nリマインダー: ${result.reminders}件`,
        { duration: 5000 }
      );
      // ページをリロードして最新データを表示
      window.location.reload();
    } catch (error) {
      console.error('Demo data initialization failed:', error);
      toast.error('デモデータの初期化に失敗しました');
    } finally {
      setIsInitializing(false);
    }
  };

  const allInvoices = mounted ? getAllInvoices() : [];
  const invoiceStats = mounted ? getStats() : {
    totalInvoices: 0,
    unpaidAmount: 0,
    overdueCount: 0,
    paidAmount: 0,
    paidCount: 0,
  };
  const notificationStats = mounted ? getNotificationStats() : {
    totalSent: 0,
    totalFailed: 0,
    byType: {
      invoice_sent: 0,
      payment_reminder: 0,
      payment_received: 0,
    },
  };

  // 最近の支払い状況（過去10件）
  const recentPayments = useMemo(() => {
    return allInvoices
      .filter((inv) => inv.status === 'paid' && inv.paidDate)
      .sort((a, b) => {
        const dateA = new Date(a.paidDate!);
        const dateB = new Date(b.paidDate!);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);
  }, [allInvoices]);

  // 未払い請求書（期限超過含む）
  const unpaidInvoices = useMemo(() => {
    const today = new Date();
    return allInvoices
      .filter((inv) => inv.status !== 'paid')
      .map((inv) => ({
        ...inv,
        isOverdue: new Date(inv.dueDate) < today,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10);
  }, [allInvoices]);

  // 総収益計算
  const totalRevenue = useMemo(() => {
    return allInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [allInvoices]);

  // 今月の収益
  const thisMonthRevenue = useMemo(() => {
    const today = new Date();
    return allInvoices
      .filter((inv) => {
        if (inv.status !== 'paid' || !inv.paidDate) return false;
        const paidDate = new Date(inv.paidDate);
        return (
          paidDate.getFullYear() === today.getFullYear() &&
          paidDate.getMonth() === today.getMonth()
        );
      })
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [allInvoices]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">DW管理者ダッシュボード</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            全テナントの収益状況と管理機能
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleInitializeDemo}
          disabled={isInitializing}
        >
          {isInitializing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              初期化中...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              デモデータ初期化
            </>
          )}
        </Button>
      </div>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            ダッシュボード
          </TabsTrigger>
          <TabsTrigger value="tenants">
            <Building2 className="w-4 h-4 mr-2" />
            テナント管理
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="w-4 h-4 mr-2" />
            支払い管理
          </TabsTrigger>
          <TabsTrigger value="auto-generation">
            <FileText className="w-4 h-4 mr-2" />
            自動生成
          </TabsTrigger>
          <TabsTrigger value="reminders">
            <Bell className="w-4 h-4 mr-2" />
            リマインダー
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="w-4 h-4 mr-2" />
            通知履歴
          </TabsTrigger>
        </TabsList>

        {/* タブ1: ダッシュボード */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 総収益 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総収益（累計）</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ¥{totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  全期間の支払済み請求書
                </p>
              </CardContent>
            </Card>

            {/* 今月の収益 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今月の収益</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ¥{thisMonthRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                </p>
              </CardContent>
            </Card>

            {/* テナント数 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">契約テナント数</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{tenants.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  アクティブなテナント
                </p>
              </CardContent>
            </Card>

            {/* 未払い金額 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">未払い金額</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ¥{invoiceStats.unpaidAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  期限超過: {invoiceStats.overdueCount}件
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 通知送信状況サマリー */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                通知送信状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {notificationStats.totalSent}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">送信成功</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {notificationStats.totalFailed}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">送信失敗</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {notificationStats.byType.invoice_sent}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">請求書発行</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <Calendar className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {notificationStats.byType.payment_reminder}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">リマインダー</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {notificationStats.byType.payment_received}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">入金確認</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 最近の支払い状況 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                最近の支払い状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>支払日</TableHead>
                      <TableHead>テナント</TableHead>
                      <TableHead>請求書番号</TableHead>
                      <TableHead>請求月</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          支払い履歴がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(invoice.paidDate!).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>{invoice.tenantName}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {invoice.invoiceNumber}
                            </code>
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                            })}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ¥{invoice.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* 未払い請求書（警告） */}
          {unpaidInvoices.length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="h-5 w-5" />
                  未払い請求書
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>期限</TableHead>
                        <TableHead>テナント</TableHead>
                        <TableHead>請求書番号</TableHead>
                        <TableHead>請求月</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidInvoices.map((invoice) => (
                        <TableRow
                          key={invoice.id}
                          className={invoice.isOverdue ? 'bg-red-50 dark:bg-red-950' : ''}
                        >
                          <TableCell className="font-mono text-sm">
                            {new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>{invoice.tenantName}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {invoice.invoiceNumber}
                            </code>
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                            })}
                          </TableCell>
                          <TableCell>
                            {invoice.isOverdue ? (
                              <Badge variant="destructive">期限超過</Badge>
                            ) : (
                              <Badge variant="outline">
                                {invoice.status === 'sent' ? '送信済み' : '下書き'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ¥{invoice.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* タブ2: テナント管理 */}
        <TabsContent value="tenants" suppressHydrationWarning>
          {mounted && <TenantManagementTab />}
        </TabsContent>

        {/* タブ3: 支払い管理 */}
        <TabsContent value="payments" suppressHydrationWarning>
          {mounted && <PaymentManagementTab />}
        </TabsContent>

        {/* タブ4: 請求書自動生成 */}
        <TabsContent value="auto-generation" suppressHydrationWarning>
          {mounted && <InvoiceAutoGenerationTab />}
        </TabsContent>

        {/* タブ5: リマインダー管理 */}
        <TabsContent value="reminders" suppressHydrationWarning>
          {mounted && <PaymentReminderTab />}
        </TabsContent>

        {/* タブ6: 通知履歴 */}
        <TabsContent value="notifications" suppressHydrationWarning>
          {mounted && <NotificationManagementTab />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DWAdminDashboardWithSuspense() {
  return (
    <Suspense fallback={<div className="p-6">読み込み中...</div>}>
      <DWAdminDashboardPage />
    </Suspense>
  );
}

export default DWAdminDashboardWithSuspense;
