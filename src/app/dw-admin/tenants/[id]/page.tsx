'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  Building2,
  DollarSign,
  FileText,
  Mail,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { useNotificationHistoryStore } from '@/lib/store/notification-history-store';
import { useIsMounted } from '@/hooks/useIsMounted';
import { toast } from 'sonner';

export default function TenantDetailPage() {
  const mounted = useIsMounted();
  const params = useParams();
  const tenantId = params?.id as string;
  const router = useRouter();
  const { tenants, updateTenant } = useAdminTenantStore();
  const { getInvoicesByTenant } = useInvoiceStore();
  const { getNotificationsByTenant } = useNotificationHistoryStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    contactEmail: '',
    billingEmail: '',
    phone: '',
    address: '',
    plan: 'basic' as const,
    maxUsers: 10,
    contractStartDate: '',
    contractEndDate: '',
  });

  // テナント情報を取得
  const tenant = useMemo(() => {
    return tenants.find((t) => t.id === tenantId);
  }, [tenants, tenantId]);

  // 請求書履歴を取得
  const invoices = useMemo(() => {
    if (!tenant) return [];
    return getInvoicesByTenant(tenant.id);
  }, [tenant, getInvoicesByTenant]);

  // 通知履歴を取得
  const notifications = useMemo(() => {
    if (!tenant) return [];
    return getNotificationsByTenant(tenant.id);
  }, [tenant, getNotificationsByTenant]);

  // 支払い履歴（支払済み請求書のみ）
  const paymentHistory = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'paid' && inv.paidDate)
      .sort((a, b) => {
        const dateA = new Date(a.paidDate!);
        const dateB = new Date(b.paidDate!);
        return dateB.getTime() - dateA.getTime();
      });
  }, [invoices]);

  // 統計計算
  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const unpaidAmount = invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;

    return { totalRevenue, unpaidAmount, totalInvoices, paidInvoices };
  }, [invoices]);

  // テナントが見つからない場合
  if (!tenant) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/dw-admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">テナントが見つかりませんでした</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 編集開始
  const handleStartEdit = () => {
    setEditForm({
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      billingEmail: tenant.billingEmail || '',
      phone: tenant.phone || '',
      address: tenant.address || '',
      plan: tenant.plan,
      maxUsers: tenant.maxUsers,
      contractStartDate: tenant.contractStartDate,
      contractEndDate: tenant.contractEndDate || '',
    });
    setIsEditing(true);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 保存
  const handleSave = () => {
    updateTenant(tenant.id, {
      name: editForm.name,
      contactEmail: editForm.contactEmail,
      billingEmail: editForm.billingEmail || undefined,
      phone: editForm.phone || undefined,
      address: editForm.address || undefined,
      plan: editForm.plan,
      maxUsers: editForm.maxUsers,
      contractStartDate: editForm.contractStartDate,
      contractEndDate: editForm.contractEndDate || undefined,
    });
    setIsEditing(false);
    toast.success('テナント情報を更新しました');
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dw-admin/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          ダッシュボードに戻る
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{tenant.name}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            テナント詳細情報と管理
          </p>
        </div>
        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
          {tenant.status === 'active' ? 'アクティブ' : '無効'}
        </Badge>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総収益</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">支払済み請求書の合計</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未払い金額</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ¥{stats.unpaidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">未払い請求書の合計</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">請求書数</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              支払済み: {stats.paidInvoices}件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ユーザー数</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{tenant.currentUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              最大: {tenant.maxUsers}ユーザー
            </p>
          </CardContent>
        </Card>
      </div>

      {/* タブ */}
      <Tabs defaultValue="info" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">
            <Building2 className="w-4 h-4 mr-2" />
            基本情報
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="w-4 h-4 mr-2" />
            請求書履歴
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CheckCircle className="w-4 h-4 mr-2" />
            支払履歴
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="w-4 h-4 mr-2" />
            通知履歴
          </TabsTrigger>
        </TabsList>

        {/* タブ1: 基本情報 */}
        <TabsContent value="info">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>テナント基本情報</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    キャンセル
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">テナント名</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">プラン</Label>
                  {isEditing ? (
                    <select
                      id="plan"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editForm.plan}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          plan: e.target.value as 'basic' | 'standard' | 'premium' | 'enterprise',
                        })
                      }
                    >
                      <option value="basic">Basic</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium capitalize">{tenant.plan}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">連絡先メール</Label>
                  {isEditing ? (
                    <Input
                      id="contactEmail"
                      type="email"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingEmail">請求書送付先メール</Label>
                  {isEditing ? (
                    <Input
                      id="billingEmail"
                      type="email"
                      value={editForm.billingEmail}
                      onChange={(e) => setEditForm({ ...editForm, billingEmail: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.billingEmail || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">電話番号</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.phone || '-'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsers">最大ユーザー数</Label>
                  {isEditing ? (
                    <Input
                      id="maxUsers"
                      type="number"
                      value={editForm.maxUsers}
                      onChange={(e) =>
                        setEditForm({ ...editForm, maxUsers: parseInt(e.target.value, 10) })
                      }
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.maxUsers}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractStartDate">契約開始日</Label>
                  {isEditing ? (
                    <Input
                      id="contractStartDate"
                      type="date"
                      value={editForm.contractStartDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, contractStartDate: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {new Date(tenant.contractStartDate).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractEndDate">契約終了日</Label>
                  {isEditing ? (
                    <Input
                      id="contractEndDate"
                      type="date"
                      value={editForm.contractEndDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, contractEndDate: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {tenant.contractEndDate
                        ? new Date(tenant.contractEndDate).toLocaleDateString('ja-JP')
                        : '-'}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">住所</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{tenant.address || '-'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* タブ2: 請求書履歴 */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>請求書履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>請求書番号</TableHead>
                      <TableHead>請求月</TableHead>
                      <TableHead>発行日</TableHead>
                      <TableHead>期限</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          請求書がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
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
                          <TableCell className="font-mono text-sm">
                            {new Date(invoice.issueDate).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            {invoice.status === 'paid' ? (
                              <Badge variant="default" className="bg-green-600">
                                支払済み
                              </Badge>
                            ) : invoice.status === 'sent' ? (
                              <Badge variant="outline">送信済み</Badge>
                            ) : (
                              <Badge variant="secondary">下書き</Badge>
                            )}
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
        </TabsContent>

        {/* タブ3: 支払履歴 */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>支払履歴タイムライン</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">支払履歴がありません</p>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((invoice) => (
                    <div key={invoice.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 bg-green-100 dark:bg-green-950 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="w-px h-full bg-border"></div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {new Date(invoice.paidDate!).toLocaleDateString('ja-JP')}
                          </span>
                          <Badge variant="default" className="bg-green-600">
                            支払完了
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          請求書番号: {invoice.invoiceNumber}
                        </p>
                        <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">請求月</p>
                            <p className="font-medium">
                              {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">支払金額</p>
                            <p className="text-lg font-bold text-green-600">
                              ¥{invoice.total.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {invoice.paymentMethod && (
                          <p className="text-xs text-muted-foreground mt-2">
                            支払方法: {invoice.paymentMethod === 'bank_transfer' ? '銀行振込' : 'クレジットカード'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* タブ4: 通知履歴 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知履歴</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>送信日時</TableHead>
                      <TableHead>種類</TableHead>
                      <TableHead>件名</TableHead>
                      <TableHead>宛先</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          通知履歴がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(notification.sentAt).toLocaleString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {notification.type === 'invoice_sent'
                                ? '請求書発行'
                                : notification.type === 'payment_reminder'
                                  ? 'リマインダー'
                                  : notification.type === 'payment_overdue'
                                    ? '期限超過'
                                    : notification.type === 'payment_received'
                                      ? '入金確認'
                                      : '領収書'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{notification.subject}</TableCell>
                          <TableCell className="text-sm">{notification.recipientEmail}</TableCell>
                          <TableCell>
                            {notification.status === 'sent' ? (
                              <Badge variant="default" className="bg-green-600">
                                送信成功
                              </Badge>
                            ) : notification.status === 'failed' ? (
                              <Badge variant="destructive">送信失敗</Badge>
                            ) : (
                              <Badge variant="secondary">保留中</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
