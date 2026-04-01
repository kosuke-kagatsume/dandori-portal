'use client';

import React, { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FormComponentProps, LeaveRequestFormData } from '@/lib/workflow/schemas';

export function LeaveRequestForm({ form, onFlowUpdate }: FormComponentProps<LeaveRequestFormData>) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(tomorrow);

  // 初期値を設定
  React.useEffect(() => {
    form.setValue('leaveType', 'paid_leave');
    form.setValue('startDate', today);
    form.setValue('endDate', tomorrow);
    form.setValue('reason', 'テスト用の休暇申請です');
    form.setValue('handover', '業務は同僚に引き継ぎ済みです');
    onFlowUpdate('leave_request', { days: 2 });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          休暇申請
        </CardTitle>
        <CardDescription>
          休暇の申請を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">休暇種別</Label>
          <RadioGroup defaultValue="paid_leave" onValueChange={(value) => form.setValue('leaveType', value as 'paid_leave' | 'sick_leave' | 'special_leave' | 'compensatory' | 'half_day')} className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="paid_leave" id="paid_leave" />
              <Label htmlFor="paid_leave" className="cursor-pointer">有給休暇</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="sick_leave" id="sick_leave" />
              <Label htmlFor="sick_leave" className="cursor-pointer">病気休暇</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="special_leave" id="special_leave" />
              <Label htmlFor="special_leave" className="cursor-pointer">特別休暇</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="half_day" id="half_day" />
              <Label htmlFor="half_day" className="cursor-pointer">半休</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="compensatory" id="compensatory" />
              <Label htmlFor="compensatory" className="cursor-pointer">代休</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-3 block">休暇期間</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm">開始日</Label>
              <Input
                id="startDate"
                type="date"
                className="w-full"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setStartDate(date);
                  form.setValue('startDate', date);
                  if (endDate) {
                    const days = differenceInDays(endDate, date) + 1;
                    onFlowUpdate('leave_request', { days });
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm">終了日</Label>
              <Input
                id="endDate"
                type="date"
                className="w-full"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setEndDate(date);
                  form.setValue('endDate', date);
                  if (startDate && date) {
                    const days = differenceInDays(date, startDate) + 1;
                    onFlowUpdate('leave_request', { days });
                  }
                }}
                min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        {startDate && endDate && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              申請日数: {differenceInDays(endDate, startDate) + 1}日間
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">理由 <span className="text-red-500">*</span></Label>
            <Textarea
              id="reason"
              placeholder="休暇を取得する理由を具体的に入力してください（最低10文字）"
              {...form.register('reason')}
              rows={3}
              className="resize-none"
              defaultValue="テスト用の休暇申請です"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="handover" className="text-sm font-medium">引き継ぎ事項 <span className="text-red-500">*</span></Label>
            <Textarea
              id="handover"
              placeholder="不在中の業務引き継ぎや対応者について記載してください（最低10文字）"
              {...form.register('handover')}
              rows={3}
              className="resize-none"
              defaultValue="業務は同僚に引き継ぎ済みです"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact" className="text-sm font-medium">緊急連絡先 <span className="text-gray-500">（任意）</span></Label>
            <Input
              id="emergencyContact"
              placeholder="例：080-1234-5678"
              {...form.register('emergencyContact')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
