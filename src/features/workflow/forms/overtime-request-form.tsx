'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormComponentProps, OvertimeRequestFormData } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function OvertimeRequestForm({ form, onFlowUpdate }: FormComponentProps<OvertimeRequestFormData>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [overtimeDate, setOvertimeDate] = useState<Date>();
  const [hours, setHours] = useState<number>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          残業申請
        </CardTitle>
        <CardDescription>
          時間外勤務の申請を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-3 block">残業詳細</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overtimeDate" className="text-sm">残業日 <span className="text-red-500">*</span></Label>
              <Input
                id="overtimeDate"
                type="date"
                className="w-full"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setOvertimeDate(date);
                  form.setValue('overtimeDate', date);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours" className="text-sm">残業時間 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  placeholder="例：2.5"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setHours(value);
                    form.setValue('hours', value);
                    onFlowUpdate('overtime_request', { hours: value });
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  時間
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">開始時刻</Label>
            <Input
              id="startTime"
              type="time"
              {...form.register('startTime')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">終了時刻</Label>
            <Input
              id="endTime"
              type="time"
              {...form.register('endTime')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">残業理由</Label>
          <Textarea
            id="reason"
            placeholder="残業が必要な理由を入力してください"
            {...form.register('reason')}
            rows={3}
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

        {hours > 0 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
              残業時間: {hours}時間
            </p>
            {hours > 20 && (
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                ※ 月20時間を超える残業は部門長と人事部の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
