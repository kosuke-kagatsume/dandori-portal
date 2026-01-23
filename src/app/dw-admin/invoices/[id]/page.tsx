'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FileText, Building2, Calendar, Send, CheckCircle, Trash2, AlertCircle, CreditCard, Landmark } from 'lucide-react';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { useNotificationHistoryStore } from '@/lib/store/notification-history-store';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const { getAllInvoices, updateInvoice, deleteInvoice } = useInvoiceStore();
  const { addNotification } = useNotificationHistoryStore();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paidDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'credit_card',
  });

  const invoice = useMemo(() => {
    const allInvoices = getAllInvoices();
    return allInvoices.find((inv) => inv.id === invoiceId);
  }, [invoiceId, getAllInvoices]);

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">請求書が見つかりません</h2>
          <Button onClick={() => router.push('/dw-admin/dashboard?tab=tenants')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            テナント管理に戻る
          </Button>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    updateInvoice(invoice.id, { status: 'sent', sentDate: new Date().toISOString() });
    addNotification({
      type: 'invoice_sent',
      title: `請求書発行: ${invoice.tenantName}`,
      priority: 'normal',
      tenantId: invoice.tenantId,
      tenantName: invoice.tenantName,
      invoiceId: invoice.id,
      amount: invoice.total,
      recipientEmail: invoice.billingEmail ?? '',
      subject: `【請求書発行】${new Date(invoice.billingMonth).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}分`,
      body: `請求書を発行しました`,
      metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, amount: invoice.total },
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
    toast.success('請求書を送信しました');
  };

  const handlePayment = () => {
    updateInvoice(invoice.id, {
      status: 'paid',
      paidDate: new Date(paymentForm.paidDate).toISOString(),
      paymentMethod: paymentForm.paymentMethod,
    });
    addNotification({
      type: 'payment_received',
      title: `入金確認: ${invoice.tenantName}`,
      priority: 'normal',
      tenantId: invoice.tenantId,
      tenantName: invoice.tenantName,
      invoiceId: invoice.id,
      amount: invoice.total,
      recipientEmail: invoice.billingEmail ?? '',
      subject: `【入金確認】${new Date(invoice.billingMonth).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}分`,
      body: `ご入金を確認しました`,
      metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, amount: invoice.total, paidDate: paymentForm.paidDate },
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
    setPaymentDialogOpen(false);
    toast.success('支払い処理を完了しました');
  };

  const handleDelete = () => {
    if (confirm('この請求書を削除してもよろしいですか？')) {
      deleteInvoice(invoice.id);
      toast.success('請求書を削除しました');
      router.push(`/dw-admin/tenants/${invoice.tenantId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return '支払済み';
      case 'sent': return '送信済み';
      default: return '下書き';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push(`/dw-admin/tenants/${invoice.tenantId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            テナント詳細に戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              請求書詳細
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              請求書番号: <code className="bg-muted px-2 py-1 rounded text-xs">{invoice.invoiceNumber}</code>
            </p>
          </div>
        </div>
        <Badge variant={getStatusColor(invoice.status)} className="text-base px-4 py-2">
          {getStatusLabel(invoice.status)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>アクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {invoice.status === 'draft' && (
              <>
                <Button onClick={handleSend}>
                  <Send className="mr-2 h-4 w-4" />
                  送信
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  削除
                </Button>
              </>
            )}
            {invoice.status === 'sent' && (
              <Button onClick={() => setPaymentDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                支払い処理
              </Button>
            )}
            {invoice.status === 'paid' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">支払い済み</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>請求先情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">テナント名</div>
                <div className="font-medium">{invoice.tenantName}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">請求月</div>
                <div className="font-medium">
                  {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支払い情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">発行日</div>
              <div className="font-medium">{new Date(invoice.issueDate as string).toLocaleDateString('ja-JP')}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">支払期限</div>
              <div className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('ja-JP')}</div>
            </div>
            {invoice.paidDate && (
              <div>
                <div className="text-sm text-muted-foreground">支払日</div>
                <div className="font-medium text-green-600">
                  {new Date(invoice.paidDate).toLocaleDateString('ja-JP')}
                </div>
              </div>
            )}
            {invoice.paymentMethod && (
              <div>
                <div className="text-sm text-muted-foreground">支払方法</div>
                <div className="font-medium flex items-center gap-2">
                  {invoice.paymentMethod === 'bank_transfer' ? (
                    <><Landmark className="h-4 w-4" />銀行振込</>
                  ) : (
                    <><CreditCard className="h-4 w-4" />クレジットカード</>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>請求明細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>項目</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">単価</TableHead>
                <TableHead className="text-right">金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.items ?? []).map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">¥{item.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">小計</TableCell>
                <TableCell className="text-right font-medium">¥{invoice.subtotal.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">消費税 (10%)</TableCell>
                <TableCell className="text-right font-medium">¥{invoice.tax.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={3} className="text-right font-bold text-lg">合計金額</TableCell>
                <TableCell className="text-right font-bold text-lg text-green-600">
                  ¥{invoice.total.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {invoice.memo && (
            <>
              <Separator className="my-4" />
              <div>
                <div className="text-sm text-muted-foreground mb-2">備考</div>
                <div className="text-sm bg-muted p-3 rounded-lg">{invoice.memo}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>支払い処理</DialogTitle>
            <DialogDescription>支払い日と支払い方法を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paidDate">支払日</Label>
              <Input
                id="paidDate"
                type="date"
                value={paymentForm.paidDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">支払方法</Label>
              <select
                id="paymentMethod"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as 'bank_transfer' | 'credit_card' })}
              >
                <option value="bank_transfer">銀行振込</option>
                <option value="credit_card">クレジットカード</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handlePayment}>
              <CheckCircle className="mr-2 h-4 w-4" />
              支払い完了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
