'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { InvoiceData } from '@/lib/billing/invoice-generator';
import {
  FileText,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: InvoiceData | null;
  open: boolean;
  onClose: () => void;
  onDownloadPDF?: (invoice: InvoiceData) => void;
  onMarkAsSent?: (invoice: InvoiceData) => void;
  onMarkAsPaid?: (invoice: InvoiceData) => void;
  readOnly?: boolean; // 閲覧専用モード（テナント管理者用）
}

export function InvoiceDetailModal({
  invoice,
  open,
  onClose,
  onDownloadPDF,
  onMarkAsSent,
  onMarkAsPaid,
  readOnly = false,
}: InvoiceDetailModalProps) {
  if (!invoice) return null;

  const isOverdue =
    invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date();

  const getStatusBadge = () => {
    // 閲覧専用モード（テナント管理者）の場合
    if (readOnly) {
      if (invoice.status === 'paid') {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">支払済み</Badge>;
      }
      if (isOverdue) {
        return <Badge variant="destructive">期限超過</Badge>;
      }
      return <Badge variant="default">未払い</Badge>;
    }

    // DW社管理者モードの場合
    if (isOverdue) {
      return <Badge variant="destructive">期限超過</Badge>;
    }

    switch (invoice.status) {
      case 'draft':
        return <Badge variant="secondary">下書き</Badge>;
      case 'sent':
        return <Badge variant="default">送信済み</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">支払済み</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              請求書詳細
            </DialogTitle>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本情報 */}
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">請求書番号</p>
                <p className="text-lg font-bold font-mono">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">請求月</p>
                <p className="text-lg font-bold">
                  {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">テナント名</p>
                <p className="text-lg font-medium">{invoice.tenantName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">請求先メール</p>
                <p className="text-sm">{invoice.billingEmail}</p>
              </div>
            </div>
          </Card>

          {/* 日付情報 */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              日付情報
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">支払い期限</p>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                  {isOverdue && <AlertCircle className="inline ml-2 h-4 w-4" />}
                </p>
              </div>
              {invoice.sentDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">送信日</p>
                  <p className="font-medium">
                    {new Date(invoice.sentDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}
              {invoice.paidDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">支払日</p>
                  <p className="font-medium text-green-600">
                    {new Date(invoice.paidDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 請求明細 */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">請求明細</h3>
            <div className="space-y-2">
              {invoice.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    {item.period && (
                      <p className="text-sm text-muted-foreground mt-1">
                        期間: {item.period}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥{item.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}名 × ¥{item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 合計 */}
            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">小計（税抜）</span>
                <span className="font-medium">¥{invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">消費税（10%）</span>
                <span className="font-medium">¥{invoice.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>合計（税込）</span>
                <span>¥{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* メモ */}
          {invoice.memo && (
            <Card className="p-6">
              <h3 className="font-bold mb-2">メモ</h3>
              <p className="text-sm text-muted-foreground">{invoice.memo}</p>
            </Card>
          )}

          {/* アクション */}
          <div className="flex gap-3">
            <Button
              onClick={() => onDownloadPDF?.(invoice)}
              variant="outline"
              className={readOnly ? 'w-full' : 'flex-1'}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF出力
            </Button>

            {!readOnly && invoice.status === 'draft' && (
              <Button
                onClick={() => onMarkAsSent?.(invoice)}
                variant="default"
                className="flex-1"
              >
                <Send className="mr-2 h-4 w-4" />
                送信済みにする
              </Button>
            )}

            {!readOnly && invoice.status === 'sent' && (
              <Button
                onClick={() => onMarkAsPaid?.(invoice)}
                variant="default"
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                支払済みにする
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
