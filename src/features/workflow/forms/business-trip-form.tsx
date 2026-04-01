'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { FormComponentProps, BusinessTripFormData } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BusinessTripForm({ form, onFlowUpdate }: FormComponentProps<BusinessTripFormData>) {
  const [startDate, setStartDate] = useState<Date>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [endDate, setEndDate] = useState<Date>();
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-purple-600" />
          出張申請
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="destination">出張先</Label>
          <Input
            id="destination"
            placeholder="例：大阪支社、〇〇株式会社本社"
            {...form.register('destination')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessStartDate">開始日</Label>
            <Input
              id="businessStartDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setStartDate(date);
                form.setValue('startDate', date);
              }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessEndDate">終了日</Label>
            <Input
              id="businessEndDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setEndDate(date);
                form.setValue('endDate', date);
              }}
              min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">出張目的</Label>
          <Textarea
            id="purpose"
            placeholder="出張の目的を詳しく入力してください"
            {...form.register('purpose')}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>交通手段</Label>
            <Select onValueChange={(value) => {
              form.setValue('transportation', value as 'train' | 'airplane' | 'car' | 'other');
              onFlowUpdate('business_trip', { transportation: value, estimatedCost });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="train">電車</SelectItem>
                <SelectItem value="airplane">飛行機</SelectItem>
                <SelectItem value="car">自動車</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedCost">概算費用</Label>
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
                  onFlowUpdate('business_trip', { estimatedCost: value });
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">訪問先企業（任意）</Label>
          <Input
            id="client"
            placeholder="〇〇株式会社"
            {...form.register('client')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="accommodation"
            className="rounded"
            {...form.register('accommodation')}
          />
          <Label htmlFor="accommodation">宿泊あり</Label>
        </div>

        {estimatedCost > 0 && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              概算費用: ¥{estimatedCost.toLocaleString()}
            </p>
            {estimatedCost > 200000 && (
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                ※ 20万円を超える出張は役員の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
