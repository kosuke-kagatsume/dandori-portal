'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormComponentProps } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PurchaseRequestForm({ form, onFlowUpdate }: FormComponentProps) {
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-pink-600" />
          購買申請
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="itemName">購入品名</Label>
          <Input
            id="itemName"
            placeholder="例：ノートPC、事務用品"
            {...form.register('itemName')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">数量</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="1"
              {...form.register('quantity')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedCost">概算金額</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <Input
                id="estimatedCost"
                type="number"
                className="pl-8"
                placeholder="0"
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setEstimatedCost(value);
                  form.setValue('estimatedCost', value);
                  onFlowUpdate('purchase_request', { estimatedCost: value });
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">購入目的</Label>
          <Textarea
            id="purpose"
            placeholder="購入の目的や必要性を入力してください"
            {...form.register('purpose')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">購入先（任意）</Label>
          <Input
            id="vendor"
            placeholder="〇〇株式会社"
            {...form.register('vendor')}
          />
        </div>

        {estimatedCost > 0 && (
          <div className="p-3 bg-pink-50 dark:bg-pink-950/50 rounded-lg">
            <p className="text-sm font-medium text-pink-900 dark:text-pink-100">
              概算金額: ¥{estimatedCost.toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
