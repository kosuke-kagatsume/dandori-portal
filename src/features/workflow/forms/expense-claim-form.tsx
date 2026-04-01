'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/camera/image-upload';
import type { FormComponentProps, ExpenseClaimFormData } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ExpenseClaimForm({ form, onFlowUpdate }: FormComponentProps<ExpenseClaimFormData>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expenseDate, setExpenseDate] = useState<Date>();
  const [amount, setAmount] = useState<number>(0);
  const [receiptImages, setReceiptImages] = useState<string[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          経費申請
        </CardTitle>
        <CardDescription>
          業務に関連する経費の申請を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>経費種別</Label>
          <Select onValueChange={(value) => form.setValue('expenseType', value as 'transportation' | 'accommodation' | 'entertainment' | 'supplies' | 'other')}>
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transportation">交通費</SelectItem>
              <SelectItem value="accommodation">宿泊費</SelectItem>
              <SelectItem value="entertainment">接待費</SelectItem>
              <SelectItem value="supplies">消耗品費</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-3 block">経費詳細</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm">金額 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="amount"
                  type="number"
                  className="pl-8"
                  placeholder="例：5000"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setAmount(value);
                    form.setValue('amount', value);
                    onFlowUpdate('expense_claim', { amount: value });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDate" className="text-sm">支出日 <span className="text-red-500">*</span></Label>
              <Input
                id="expenseDate"
                type="date"
                className="w-full"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setExpenseDate(date);
                  form.setValue('expenseDate', date);
                }}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">用途・目的</Label>
          <Textarea
            id="purpose"
            placeholder="経費の用途や目的を詳しく入力してください"
            {...form.register('purpose')}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">取引先（任意）</Label>
            <Input
              id="client"
              placeholder="〇〇株式会社"
              {...form.register('client')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectCode">プロジェクトコード（任意）</Label>
            <Input
              id="projectCode"
              placeholder="PRJ-2024-001"
              {...form.register('projectCode')}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hasReceipt"
            className="rounded"
            {...form.register('hasReceipt')}
          />
          <Label htmlFor="hasReceipt">領収書あり</Label>
        </div>

        {/* 領収書画像アップロード */}
        <div className="border-t pt-4">
          <ImageUpload
            value={receiptImages}
            onChange={(images) => {
              setReceiptImages(images);
              form.setValue('receiptImages', images);
            }}
            maxImages={5}
            maxSizeKB={2048}
            label="領収書・レシート画像"
            description="カメラで撮影するか、ファイルを選択してください（最大5枚、各2MB以下）"
          />
        </div>

        {amount > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              申請金額: ¥{amount.toLocaleString()}
            </p>
            {amount > 100000 && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                ※ 10万円を超える申請は部門長の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
