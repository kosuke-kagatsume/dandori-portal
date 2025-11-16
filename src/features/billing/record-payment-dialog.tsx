'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { CheckCircle, CreditCard, Building2, FileText, Info } from 'lucide-react';
import type { InvoiceData } from '@/lib/billing/invoice-generator';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { toast } from 'sonner';

interface RecordPaymentDialogProps {
  invoice: InvoiceData | null;
  open: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: '銀行振込', icon: Building2 },
  { value: 'credit_card', label: 'クレジットカード', icon: CreditCard },
  { value: 'invoice', label: '請求書払い', icon: FileText },
  { value: 'other', label: 'その他', icon: Info },
] as const;

export function RecordPaymentDialog({ invoice, open, onClose }: RecordPaymentDialogProps) {
  const { markAsPaid } = useInvoiceStore();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'invoice' | 'other'>('bank_transfer');

  if (!invoice) return null;

  const handleRecordPayment = () => {
    try {
      const paidDate = new Date(paymentDate);

      // 支払い日が未来の日付でないかチェック
      if (paidDate > new Date()) {
        toast.error('支払い日は現在日時より前の日付を指定してください');
        return;
      }

      // 支払い記録（支払い方法も含む）
      markAsPaid(invoice.id, paidDate, paymentMethod);

      toast.success(`請求書「${invoice.invoiceNumber}」を支払済みにしました`);
      onClose();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error('支払い記録に失敗しました');
    }
  };

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod);
  const Icon = selectedMethod?.icon || Building2;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            支払い記録
          </DialogTitle>
          <DialogDescription>
            請求書の支払い情報を記録します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 請求書情報 */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">請求書番号</span>
                <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">テナント名</span>
                <span className="font-medium">{invoice.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">請求月</span>
                <span className="font-medium">
                  {new Date(invoice.billingMonth).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">支払金額（税込）</span>
                <span className="text-lg font-bold text-primary">
                  ¥{invoice.total.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* 支払い日 */}
          <div>
            <Label htmlFor="paymentDate">支払い日 *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              実際に入金が確認された日付を入力してください
            </p>
          </div>

          {/* 支払い方法 */}
          <div>
            <Label htmlFor="paymentMethod">支払い方法 *</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger className="mt-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => {
                  const MethodIcon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <MethodIcon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 確認メッセージ */}
          <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  支払い記録を登録します
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  請求書のステータスが「支払済み」に更新され、領収書の発行が可能になります。
                </p>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleRecordPayment} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            支払い記録を登録
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
