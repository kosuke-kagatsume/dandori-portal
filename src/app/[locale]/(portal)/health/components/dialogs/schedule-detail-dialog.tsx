'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatDateForAPI } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { useHealthStore } from '@/lib/store/health-store';
import type { EnrichedSchedule } from '../checkups/schedule-full-list';

const statusOptions = [
  { value: 'scheduled', label: '予約済' },
  { value: 'completed', label: '受診済' },
  { value: 'cancelled', label: 'キャンセル' },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: EnrichedSchedule | null;
  onSuccess?: () => void;
}

export function ScheduleDetailDialog({ open, onOpenChange, schedule, onSuccess }: Props) {
  const { updateSchedule } = useHealthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editData, setEditData] = useState({
    scheduledDate: undefined as Date | undefined,
    scheduledTime: '',
    status: '' as string,
    notes: '',
  });

  useEffect(() => {
    if (schedule && open) {
      setEditData({
        scheduledDate: schedule.scheduledDate ? new Date(schedule.scheduledDate) : undefined,
        scheduledTime: schedule.scheduledTime || '',
        status: schedule.status,
        notes: schedule.notes || '',
      });
      setIsEditing(false);
    }
  }, [schedule, open]);

  const handleSave = async () => {
    if (!schedule) return;
    setIsSaving(true);
    try {
      await updateSchedule(schedule.id, {
        scheduledDate: editData.scheduledDate ? formatDateForAPI(editData.scheduledDate) : undefined,
        scheduledTime: editData.scheduledTime || undefined,
        status: editData.status as 'scheduled' | 'completed' | 'cancelled',
        notes: editData.notes || undefined,
      });
      toast.success('予定を更新しました');
      setIsEditing(false);
      onSuccess?.();
    } catch {
      toast.error('予定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800">予約済</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800">受診済</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-600">キャンセル</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>健診予定詳細</DialogTitle>
          <DialogDescription>
            {schedule?.userName} さんの健診予定
          </DialogDescription>
        </DialogHeader>
        {schedule && (
          <div className="space-y-4">
            {/* 基本情報（読み取り専用） */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">氏名</span>
                <span className="font-medium">{schedule.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">部署</span>
                <span>{schedule.departmentName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">健診種別</span>
                <span>{schedule.checkupTypeName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">医療機関</span>
                <span>{schedule.institutionName || '-'}</span>
              </div>
              {schedule.age != null && schedule.age > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">年齢</span>
                  <span>{schedule.age}歳</span>
                </div>
              )}
              {schedule.totalCost != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">費用</span>
                  <span>¥{schedule.totalCost.toLocaleString()}</span>
                </div>
              )}
              {schedule.optionNames && schedule.optionNames.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">オプション</span>
                  <span className="text-right">{schedule.optionNames.join(', ')}</span>
                </div>
              )}
            </div>

            <hr />

            {/* 編集可能セクション */}
            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>予定日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-full justify-start text-left font-normal', !editData.scheduledDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editData.scheduledDate ? format(editData.scheduledDate, 'yyyy年MM月dd日', { locale: ja }) : '日付を選択'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editData.scheduledDate}
                        onSelect={(date) => setEditData(prev => ({ ...prev, scheduledDate: date }))}
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label>時間</Label>
                  <Input
                    value={editData.scheduledTime}
                    onChange={(e) => setEditData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    placeholder="09:00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>ステータス</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(v) => setEditData(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>備考</Label>
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">予定日</span>
                  <span>{schedule.scheduledDate ? format(new Date(schedule.scheduledDate), 'yyyy年MM月dd日', { locale: ja }) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">時間</span>
                  <span>{schedule.scheduledTime || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ステータス</span>
                  {getStatusBadge(schedule.status)}
                </div>
                {schedule.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">備考</span>
                    <p className="mt-1 p-2 bg-muted rounded text-sm">{schedule.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>キャンセル</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? '保存中...' : '保存'}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
              <Button onClick={() => setIsEditing(true)}>編集</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
