'use client';

import { FileText } from 'lucide-react';
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
import type { FormComponentProps } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DocumentApprovalForm({ form, onFlowUpdate }: FormComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          書類承認
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentTitle">書類タイトル</Label>
          <Input
            id="documentTitle"
            placeholder="例：契約書、提案書"
            {...form.register('documentTitle')}
          />
        </div>

        <div className="space-y-2">
          <Label>書類種別</Label>
          <Select onValueChange={(value) => form.setValue('documentType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">契約書</SelectItem>
              <SelectItem value="proposal">提案書</SelectItem>
              <SelectItem value="report">報告書</SelectItem>
              <SelectItem value="policy">規定・ポリシー</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            placeholder="書類の内容や承認が必要な理由を入力してください"
            {...form.register('description')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">承認期限（任意）</Label>
          <Input
            id="deadline"
            type="date"
            {...form.register('deadline')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
