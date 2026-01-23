'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store/tenant-store';
import { useUserStore } from '@/lib/store/user-store';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import {
  calculateMonthlyPrice,
  calculateTax,
  simulateUserAddition,
  simulateDailyProration,
} from '@/lib/billing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Calculator,
  Calendar,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceDetailModal } from '@/features/billing/invoice-detail-modal';
import type { InvoiceData as StoreInvoiceData } from '@/lib/store/invoice-store';
import type { InvoiceData as GeneratorInvoiceData } from '@/lib/billing/invoice-generator';
import { downloadInvoicePDF } from '@/lib/pdf/invoice-pdf';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function BillingTab() {
  const currentTenant = useTenantStore((state) => state.currentTenant);
  const users = useUserStore((state) => state.users);
  const { getInvoicesByTenant, initializeInvoices } = useInvoiceStore();

  // 請求書詳細モーダル
  const [selectedInvoice, setSelectedInvoice] = useState<StoreInvoiceData | null>(null);

  // Store型からGenerator型への変換ヘルパー
  const convertToGeneratorInvoice = (invoice: StoreInvoiceData): GeneratorInvoiceData => {
    // statusの変換（overdue/cancelledはsent扱いにする）
    const convertStatus = (status: string): 'draft' | 'sent' | 'paid' => {
      if (status === 'paid') return 'paid';
      if (status === 'draft') return 'draft';
      return 'sent'; // overdue, cancelled, sentはすべてsent扱い
    };

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tenantId: invoice.tenantId,
      tenantName: invoice.tenantName,
      billingMonth: new Date(invoice.billingMonth),
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      status: convertStatus(invoice.status),
      dueDate: new Date(invoice.dueDate),
      paidDate: invoice.paidDate ? new Date(invoice.paidDate) : undefined,
      sentDate: invoice.sentDate ? new Date(invoice.sentDate) : undefined,
      paymentMethod: invoice.paymentMethod as 'bank_transfer' | 'credit_card' | 'invoice' | 'other' | undefined,
      billingEmail: invoice.billingEmail ?? '',
      memo: invoice.memo,
      items: invoice.items ?? [],
    };
  };
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 初期化
  useEffect(() => {
    initializeInvoices();
  }, [initializeInvoices]);

  // テナントの請求書を取得（送信済みと支払済みのみ表示）
  const allTenantInvoices = getInvoicesByTenant(currentTenant?.id || 'tenant_001');
  const tenantInvoices = allTenantInvoices.filter(
    (invoice) => invoice.status === 'sent' || invoice.status === 'paid'
  );

  // 現在のアクティブユーザー数
  const activeUsers = users.filter((u) => u.status === 'active').length;

  // 月額料金を計算
  const monthlyPricing = calculateMonthlyPrice(activeUsers);
  const monthlySubtotal = monthlyPricing.totalPrice;
  const monthlyTax = calculateTax(monthlySubtotal);
  const monthlyTotal = monthlySubtotal + monthlyTax;

  // シミュレーション用の状態
  const [simulationUsers, setSimulationUsers] = useState(5);
  const [simulationResult, setSimulationResult] = useState<ReturnType<
    typeof simulateUserAddition
  > | null>(null);
  const [prorationResult, setProrationResult] = useState<ReturnType<
    typeof simulateDailyProration
  > | null>(null);

  const handleSimulation = () => {
    const result = simulateUserAddition(activeUsers, simulationUsers);
    setSimulationResult(result);

    // 日割り計算（今日追加した場合）
    const proration = simulateDailyProration(activeUsers, simulationUsers);
    setProrationResult(proration);
  };

  const handleDownloadPDF = async (invoice: StoreInvoiceData | GeneratorInvoiceData) => {
    try {
      // 型によって変換するかどうかを判断
      const generatorInvoice = 'createdAt' in invoice
        ? convertToGeneratorInvoice(invoice as StoreInvoiceData)
        : invoice as GeneratorInvoiceData;
      await downloadInvoicePDF(generatorInvoice);
      toast.success('請求書PDFをダウンロードしました');
    } catch (error) {
      console.error('PDF出力エラー:', error);
      toast.error(`PDF出力に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  return (
    <>
      <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold">請求情報</h2>
        <p className="text-muted-foreground mt-1">
          現在の料金プランとご利用状況
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">アクティブユーザー</p>
              <p className="text-2xl font-bold">{activeUsers}名</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">月額料金（税抜）</p>
              <p className="text-2xl font-bold">¥{monthlySubtotal.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">月額料金（税込）</p>
              <p className="text-2xl font-bold">¥{monthlyTotal.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* タブ */}
      <Tabs defaultValue="current" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">現在の料金</TabsTrigger>
          <TabsTrigger value="simulation">料金シミュレーション</TabsTrigger>
          <TabsTrigger value="invoices">請求書履歴</TabsTrigger>
        </TabsList>

        {/* 現在の料金タブ */}
        <TabsContent value="current" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">料金内訳</h3>
            <div className="space-y-3">
              {monthlyPricing.breakdown.map((tier, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tier.tierName}</p>
                    <p className="text-sm text-muted-foreground">
                      {tier.usersInTier}名 × ¥{tier.pricePerUser.toLocaleString()}/名
                    </p>
                  </div>
                  <p className="text-lg font-bold">¥{tier.subtotal.toLocaleString()}</p>
                </div>
              ))}

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">小計</span>
                  <span className="font-medium">¥{monthlySubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">消費税（10%）</span>
                  <span className="font-medium">¥{monthlyTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>合計</span>
                  <span>¥{monthlyTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">料金について</h4>
                <p className="text-sm text-muted-foreground">
                  月の途中でユーザーを追加・削除した場合は、日割り計算で課金されます。
                  詳細は「料金シミュレーション」タブでご確認いただけます。
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 料金シミュレーションタブ */}
        <TabsContent value="simulation" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">ユーザー追加コストシミュレーション</h3>
                <p className="text-sm text-muted-foreground">
                  追加人数を入力して料金変動を確認
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="current-users">現在のユーザー数</Label>
                <Input
                  id="current-users"
                  type="number"
                  value={activeUsers}
                  disabled
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="additional-users">追加するユーザー数</Label>
                <Input
                  id="additional-users"
                  type="number"
                  min="1"
                  value={simulationUsers}
                  onChange={(e) => setSimulationUsers(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>

              <Button onClick={handleSimulation} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                シミュレーション実行
              </Button>
            </div>

            {simulationResult && prorationResult && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-bold mb-3">月額料金の変動</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">変更前</p>
                      <p className="text-2xl font-bold">
                        ¥{simulationResult.before.totalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeUsers}名（税抜）
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">変更後</p>
                      <p className="text-2xl font-bold">
                        ¥{simulationResult.after.totalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeUsers + simulationUsers}名（税抜）
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">差額（税込）</span>
                      <span className="text-xl font-bold text-green-600">
                        +¥{simulationResult.differenceWithTax.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    今日追加した場合の日割り料金
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {prorationResult.message}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-background rounded">
                      <span className="text-muted-foreground">月の日数</span>
                      <p className="font-bold">{prorationResult.daysInMonth}日</p>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <span className="text-muted-foreground">残り日数</span>
                      <p className="font-bold">{prorationResult.remainingDays}日</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-bold mb-2">料金内訳（変更後）</h4>
                  <div className="space-y-2">
                    {simulationResult.after.breakdown.map((tier, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{tier.tierName}</span>
                        <span>
                          {tier.usersInTier}名 × ¥{tier.pricePerUser.toLocaleString()} = ¥
                          {tier.subtotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 請求書履歴タブ */}
        <TabsContent value="invoices">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-bold">請求書履歴</h3>
              </div>
              <Badge variant="outline">{tenantInvoices.length}件</Badge>
            </div>

            {tenantInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">請求書がありません</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>請求書番号</TableHead>
                    <TableHead>請求月</TableHead>
                    <TableHead className="text-right">金額（税込）</TableHead>
                    <TableHead>支払い期限</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantInvoices.map((invoice) => {
                    const isOverdue =
                      invoice.status !== 'paid' &&
                      new Date(invoice.dueDate) < new Date();

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ¥{invoice.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                            {isOverdue && (
                              <AlertCircle className="inline ml-2 h-4 w-4" />
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {invoice.status === 'paid' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              支払済み
                            </Badge>
                          ) : isOverdue ? (
                            <Badge variant="destructive">期限超過</Badge>
                          ) : (
                            <Badge variant="default">未払い</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* 請求書詳細モーダル（閲覧専用） */}
      <InvoiceDetailModal
        invoice={selectedInvoice ? convertToGeneratorInvoice(selectedInvoice) : null}
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onDownloadPDF={(invoice) => handleDownloadPDF(invoice)}
        readOnly={true}
      />
    </>
  );
}
