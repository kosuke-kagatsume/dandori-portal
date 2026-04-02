'use client';

import { Button } from '@/components/ui/button';
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
import type { FollowUpRecord } from '@/lib/health/health-helpers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string | undefined;
  record: Partial<FollowUpRecord>;
  onRecordChange: (record: Partial<FollowUpRecord>) => void;
  onSave: () => void;
}

export function FollowUpDialog({ open, onOpenChange, userName, record, onRecordChange, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>フォロー記録</DialogTitle>
          <DialogDescription>
            {userName} さんのフォロー状況を記録します
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>フォロー日</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !record.followUpDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {record.followUpDate ? format(record.followUpDate, 'yyyy年MM月dd日', { locale: ja }) : '日付を選択'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={record.followUpDate}
                  onSelect={(date) => onRecordChange({ ...record, followUpDate: date })}
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>ステータス</Label>
            <Select
              value={record.status}
              onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') => onRecordChange({ ...record, status: value })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">予定</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>フォロー内容・メモ</Label>
            <Textarea
              placeholder="フォローの内容を記録してください..."
              value={record.notes}
              onChange={(e) => onRecordChange({ ...record, notes: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>次回フォロー予定日</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !record.nextFollowUpDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {record.nextFollowUpDate ? format(record.nextFollowUpDate, 'yyyy年MM月dd日', { locale: ja }) : '日付を選択（任意）'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={record.nextFollowUpDate}
                  onSelect={(date) => onRecordChange({ ...record, nextFollowUpDate: date })}
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
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
