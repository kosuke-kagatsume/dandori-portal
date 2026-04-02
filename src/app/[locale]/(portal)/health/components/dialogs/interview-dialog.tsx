'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { InterviewRecord } from '@/lib/health/health-helpers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string | undefined;
  record: Partial<InterviewRecord>;
  onRecordChange: (record: Partial<InterviewRecord>) => void;
  onSave: () => void;
}

export function InterviewDialog({ open, onOpenChange, userName, record, onRecordChange, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>面談記録</DialogTitle>
          <DialogDescription>
            {userName} さんとの面談内容を記録します
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>面談日</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !record.interviewDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {record.interviewDate ? format(record.interviewDate, 'yyyy年MM月dd日', { locale: ja }) : '日付を選択'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={record.interviewDate}
                  onSelect={(date) => onRecordChange({ ...record, interviewDate: date })}
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>面談種別</Label>
            <Select
              value={record.interviewType}
              onValueChange={(value: 'stress_interview' | 'health_guidance' | 'return_to_work') =>
                onRecordChange({ ...record, interviewType: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stress_interview">ストレスチェック面談</SelectItem>
                <SelectItem value="health_guidance">保健指導</SelectItem>
                <SelectItem value="return_to_work">復職面談</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>担当医師・保健師名</Label>
            <Input
              placeholder="担当者名を入力"
              value={record.doctorName}
              onChange={(e) => onRecordChange({ ...record, doctorName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>面談内容</Label>
            <Textarea
              placeholder="面談の内容を記録してください..."
              value={record.notes}
              onChange={(e) => onRecordChange({ ...record, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>面談結果・所見</Label>
            <Textarea
              placeholder="面談の結果や所見を記録してください..."
              value={record.outcome}
              onChange={(e) => onRecordChange({ ...record, outcome: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>今後の対応・アクション</Label>
            <Textarea
              placeholder="今後必要な対応やアクションを記録してください..."
              value={record.nextAction}
              onChange={(e) => onRecordChange({ ...record, nextAction: e.target.value })}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
