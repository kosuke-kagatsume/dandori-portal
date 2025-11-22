'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Search,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { RecordPaymentDialog } from '@/features/billing/record-payment-dialog';
import { InvoiceDetailModal } from '@/features/billing/invoice-detail-modal';
import { downloadReceiptPDF } from '@/lib/pdf/receipt-pdf';
import type { InvoiceData } from '@/lib/billing/invoice-generator';
import { toast } from 'sonner';

export function PaymentManagementTab() {
  const { getAllInvoices, getStats, initializeInvoices } = useInvoiceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'paid' | 'overdue'>('all');
  const [recordPaymentDialogOpen, setRecordPaymentDialogOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  // 初期化
  useEffect(() => {
    initializeInvoices();
  }, [initializeInvoices]);

  // 全請求書を取得
  const allInvoices = getAllInvoices();

  // フィルタリング
  const filteredInvoices = allInvoices.filter((invoice) => {
    // 検索フィルター
    const matchesSearch =
      invoice.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    // ステータスフィルター
    const today = new Date();
    const isOverdue = invoice.status !== 'paid' && new Date(invoice.dueDate) < today;

    let matchesStatus = true;
    if (statusFilter === 'overdue') {
      matchesStatus = isOverdue;
    } else if (statusFilter !== 'all') {
      matchesStatus = invoice.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // 統計
  const stats = getStats();
  const overdueInvoices = allInvoices.filter((inv) => {
    const isOverdue = inv.status !== 'paid' && new Date(inv.dueDate) < new Date();
    return isOverdue;
  });

  const handleRecordPayment = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setRecordPaymentDialogOpen(true);
  };

  const handleViewDetail = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setDetailModalOpen(true);
  };

  const handleDownloadReceipt = async (invoice: InvoiceData) => {
    if (invoice.status !== 'paid') {
      toast.error('支払い済みの請求書のみ領収書を発行できます');
      return;
    }

    try {
      await downloadReceiptPDF(invoice);
      toast.success('領収書をダウンロードしました');
    } catch (error) {
      toast.error('領収書のダウンロードに失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold">支払い管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          全テナントの支払い状況と入金確認
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総請求書数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
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
              ¥{stats.unpaidAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              期限超過件数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueInvoices.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総回収額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{(stats.totalAmount - stats.unpaidAmount).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="テナント名または請求書番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全ステータス</SelectItem>
            <SelectItem value="sent">送信済み</SelectItem>
            <SelectItem value="paid">支払済み</SelectItem>
            <SelectItem value="overdue">期限超過</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 請求書一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>請求書一覧</CardTitle>
          <CardDescription>
            全{filteredInvoices.length}件の請求書
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>請求書番号</TableHead>
                <TableHead>テナント</TableHead>
                <TableHead>請求月</TableHead>
                <TableHead>金額（税込）</TableHead>
                <TableHead>支払い期限</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    請求書が見つかりませんでした
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const isOverdue =
                    invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date();

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {invoice.invoiceNumber}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{invoice.tenantName}</TableCell>
                      <TableCell>
                        {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        ¥{invoice.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                          {isOverdue && <AlertCircle className="inline ml-1 h-3 w-3" />}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isOverdue ? (
                          <Badge variant="destructive">期限超過</Badge>
                        ) : invoice.status === 'paid' ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            支払済み
                          </Badge>
                        ) : invoice.status === 'sent' ? (
                          <Badge variant="default">送信済み</Badge>
                        ) : (
                          <Badge variant="secondary">下書き</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(invoice)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            詳細
                          </Button>
                          {invoice.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleRecordPayment(invoice)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              入金確認
                            </Button>
                          )}
                          {invoice.status === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReceipt(invoice)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              領収書
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 支払い記録ダイアログ */}
      <RecordPaymentDialog
        invoice={selectedInvoice}
        open={recordPaymentDialogOpen}
        onClose={() => {
          setRecordPaymentDialogOpen(false);
          setSelectedInvoice(null);
        }}
      />

      {/* 請求書詳細モーダル */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedInvoice(null);
        }}
        readOnly={false}
      />
    </div>
  );
}
