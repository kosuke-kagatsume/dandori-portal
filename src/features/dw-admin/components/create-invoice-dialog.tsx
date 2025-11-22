'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileText, Send } from 'lucide-react';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { getNextInvoiceNumber, calculateDueDate } from '@/lib/billing/invoice-generator';
import type { InvoiceItem } from '@/lib/billing/invoice-generator';
import { toast } from 'sonner';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
  billingEmail: string;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  billingEmail,
}: CreateInvoiceDialogProps) {
  const { createInvoice, getAllInvoices, markAsSent } = useInvoiceStore();

  // 請求月（今月がデフォルト）
  const [billingMonth, setBillingMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // 請求項目（初期値: 1項目）
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `item-1`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    },
  ]);

  // 備考
  const [memo, setMemo] = useState('');

  // 請求項目の追加
  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${items.length + 1}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  // 請求項目の削除
  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error('最低1つの項目が必要です');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  // 請求項目の更新
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // 数量または単価が変更された場合、金額を再計算
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = updated.quantity * updated.unitPrice;
        }

        return updated;
      })
    );
  };

  // 小計・消費税・合計を計算
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  // 請求書を作成（下書き）
  const handleCreateDraft = () => {
    if (!validateForm()) return;

    const [year, month] = billingMonth.split('-').map(Number);
    const billingMonthDate = new Date(year, month - 1, 1);
    const allInvoices = getAllInvoices();

    const newInvoice = createInvoice({
      invoiceNumber: getNextInvoiceNumber(allInvoices, year, month),
      tenantId,
      tenantName,
      billingMonth: billingMonthDate,
      subtotal,
      tax,
      total,
      status: 'draft',
      dueDate: calculateDueDate(billingMonthDate),
      billingEmail,
      memo: memo || undefined,
      items: items.map((item) => ({
        ...item,
        period: `${year}-${String(month).padStart(2, '0')}`,
      })),
    });

    toast.success('請求書を下書き保存しました');
    resetForm();
    onOpenChange(false);
  };

  // 請求書を作成して即送信
  const handleCreateAndSend = () => {
    if (!validateForm()) return;

    const [year, month] = billingMonth.split('-').map(Number);
    const billingMonthDate = new Date(year, month - 1, 1);
    const allInvoices = getAllInvoices();

    const newInvoice = createInvoice({
      invoiceNumber: getNextInvoiceNumber(allInvoices, year, month),
      tenantId,
      tenantName,
      billingMonth: billingMonthDate,
      subtotal,
      tax,
      total,
      status: 'draft',
      dueDate: calculateDueDate(billingMonthDate),
      billingEmail,
      memo: memo || undefined,
      items: items.map((item) => ({
        ...item,
        period: `${year}-${String(month).padStart(2, '0')}`,
      })),
    });

    // 即送信
    markAsSent(newInvoice.id);

    toast.success('請求書を作成して送信しました');
    resetForm();
    onOpenChange(false);
  };

  // バリデーション
  const validateForm = () => {
    if (items.some((item) => !item.description.trim())) {
      toast.error('全ての項目に品目を入力してください');
      return false;
    }

    if (items.some((item) => item.quantity <= 0)) {
      toast.error('数量は1以上で入力してください');
      return false;
    }

    if (items.some((item) => item.unitPrice <= 0)) {
      toast.error('単価は0より大きい値で入力してください');
      return false;
    }

    return true;
  };

  // フォームリセット
  const resetForm = () => {
    const today = new Date();
    setBillingMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    setItems([
      {
        id: `item-1`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
    setMemo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規請求書作成</DialogTitle>
          <DialogDescription>
            {tenantName} の請求書を作成します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 請求月 */}
          <div className="space-y-2">
            <Label htmlFor="billingMonth">請求月</Label>
            <Input
              id="billingMonth"
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
            />
          </div>

          {/* 請求項目 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>請求項目</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                項目追加
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">項目 {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor={`desc-${item.id}`}>品目</Label>
                    <Input
                      id={`desc-${item.id}`}
                      placeholder="例: アクティブユーザー 50名"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`qty-${item.id}`}>数量</Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${item.id}`}>単価（円）</Label>
                    <Input
                      id={`price-${item.id}`}
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 text-sm">
                  <span className="text-muted-foreground">金額:</span>
                  <span className="font-semibold">¥{item.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 小計・税・合計 */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">小計（税抜）</span>
              <span className="font-medium">¥{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">消費税（10%）</span>
              <span className="font-medium">¥{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>合計金額</span>
              <span className="text-green-600">¥{total.toLocaleString()}</span>
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="memo">備考（オプション）</Label>
            <Textarea
              id="memo"
              placeholder="請求書に記載する備考を入力してください"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button variant="outline" onClick={handleCreateDraft}>
            <FileText className="mr-2 h-4 w-4" />
            下書き保存
          </Button>
          <Button onClick={handleCreateAndSend}>
            <Send className="mr-2 h-4 w-4" />
            作成して送信
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
