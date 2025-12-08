'use client';

import { useState } from 'react';
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
  Search,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { useInvoices, createPayment, type Invoice } from '@/hooks/use-dw-admin-api';
import { toast } from 'sonner';

export function PaymentManagementTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // APIからデータ取得
  const { data: invoicesData, isLoading, error, mutate } = useInvoices();

  // データ取得中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  // エラー
  if (error) {
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

  const invoices = invoicesData?.data?.invoices || [];
  const summary = invoicesData?.data?.summary || {
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    overdueCount: 0,
  };

  // フィルタリング
  const filteredInvoices = invoices.filter((invoice) => {
    // 検索フィルター
    const matchesSearch =
      (invoice.tenantName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
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

  const handleRecordPayment = async (invoice: Invoice) => {
    try {
      await createPayment({
        invoiceId: invoice.id,
        amount: invoice.total,
        paymentMethod: 'bank_transfer',
      });
      toast.success('支払いを記録しました');
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '支払いの記録に失敗しました');
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
            <div className="text-2xl font-bold">{invoices.length}</div>
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
              ¥{summary.unpaidAmount.toLocaleString()}
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
              {summary.overdueCount}
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
              ¥{summary.paidAmount.toLocaleString()}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV出力
          </Button>
          <Button variant="outline" disabled>
            <FileText className="h-4 w-4 mr-2" />
            明細CSV
          </Button>
        </div>
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
                      <TableCell className="font-medium">{invoice.tenantName || '-'}</TableCell>
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
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            詳細
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
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
                              disabled
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
    </div>
  );
}
