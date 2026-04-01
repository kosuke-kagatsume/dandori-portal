'use client';

import { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FormComponentProps, RemoteWorkFormData } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RemoteWorkForm({ form, onFlowUpdate }: FormComponentProps<RemoteWorkFormData>) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-indigo-600" />
          リモートワーク申請
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="remoteStartDate">開始日</Label>
            <Input
              id="remoteStartDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setStartDate(date);
                form.setValue('startDate', date);
                if (date && endDate) {
                  onFlowUpdate('remote_work', { startDate: date, endDate });
                }
              }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remoteEndDate">終了日</Label>
            <Input
              id="remoteEndDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setEndDate(date);
                form.setValue('endDate', date);
                if (startDate && date) {
                  onFlowUpdate('remote_work', { startDate, endDate: date });
                }
              }}
              min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>勤務場所</Label>
          <RadioGroup defaultValue="home" onValueChange={(value) => form.setValue('workLocation', value as 'home' | 'satellite_office' | 'other')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="home" id="home" />
              <Label htmlFor="home">自宅</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="satellite_office" id="satellite_office" />
              <Label htmlFor="satellite_office">サテライトオフィス</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">その他</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationDetail">勤務場所詳細（その他の場合）</Label>
          <Input
            id="locationDetail"
            placeholder="具体的な場所を入力"
            {...form.register('locationDetail')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">理由</Label>
          <Textarea
            id="reason"
            placeholder="リモートワークが必要な理由を入力してください"
            {...form.register('reason')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityMeasures">セキュリティ対策</Label>
          <Textarea
            id="securityMeasures"
            placeholder="在宅勤務時のセキュリティ対策について記載してください"
            {...form.register('securityMeasures')}
            rows={3}
          />
        </div>

        {startDate && endDate && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              申請期間: {differenceInDays(endDate, startDate) + 1}日間
            </p>
            {differenceInDays(endDate, startDate) > 30 && (
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                ※ 30日を超えるリモートワークは部門長と人事部の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
