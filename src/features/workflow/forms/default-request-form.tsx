'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { WorkflowType } from '@/lib/workflow-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function DefaultRequestForm({ form }: { form: UseFormReturn; onFlowUpdate?: (type: WorkflowType, details: Record<string, unknown>) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>申請内容</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            placeholder="申請のタイトルを入力"
            {...form.register('title')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">詳細</Label>
          <Textarea
            id="description"
            placeholder="申請の詳細を入力してください"
            {...form.register('description')}
            rows={5}
          />
        </div>
      </CardContent>
    </Card>
  );
}
