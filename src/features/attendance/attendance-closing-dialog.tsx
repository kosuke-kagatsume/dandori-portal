'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AttendanceClosingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  onSubmit?: (data: { year: number; month: number; note?: string }) => Promise<void>;
  closingStatus?: 'open' | 'pending' | 'approved' | 'rejected';
  summary?: {
    scheduledWorkDays: number;
    actualWorkDays: number;
    scheduledHours: number;
    actualHours: number;
    overtimeHours: number;
    lateCount: number;
    earlyLeaveCount: number;
    absenceCount: number;
    leaveCount: number;
    remoteWorkDays: number;
  };
}

export function AttendanceClosingDialog({
  open,
  onOpenChange,
  year,
  month,
  onSubmit,
  closingStatus = 'open',
  summary = {
    scheduledWorkDays: 20,
    actualWorkDays: 18,
    scheduledHours: 160,
    actualHours: 162.5,
    overtimeHours: 28.5,
    lateCount: 1,
    earlyLeaveCount: 0,
    absenceCount: 0,
    leaveCount: 2,
    remoteWorkDays: 8,
  },
}: AttendanceClosingDialogProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetDate = new Date(year, month - 1, 1);
  const periodStart = format(startOfMonth(targetDate), 'yyyy年M月d日', { locale: ja });
  const periodEnd = format(endOfMonth(targetDate), 'yyyy年M月d日', { locale: ja });

  const handleSubmit = async () => {
    if (closingStatus !== 'open') return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ year, month, note: note || undefined });
      }
      toast.success('勤怠締め申請を送信しました', {
        description: '承認者に通知されました',
      });
      onOpenChange(false);
      setNote('');
    } catch {
      toast.error('申請に失敗しました', {
        description: 'もう一度お試しください',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (closingStatus) {
      case 'open':
        return <Badge variant="secondary">未締め</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">承認待ち</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">承認済み</Badge>;
      case 'rejected':
        return <Badge variant="destructive">差し戻し</Badge>;
      default:
        return null;
    }
  };

  const attendanceRate = (summary.actualWorkDays / summary.scheduledWorkDays) * 100;
  const workHoursRate = (summary.actualHours / summary.scheduledHours) * 100;

  // Check for warnings
  const hasWarnings = summary.lateCount > 0 || summary.earlyLeaveCount > 0 || summary.absenceCount > 0;
  const hasOvertimeWarning = summary.overtimeHours >= 40;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            勤怠締め申請
          </DialogTitle>
          <DialogDescription>
            {year}年{month}月の勤怠を確認して締め申請を行います
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period and Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {periodStart} ～ {periodEnd}
              </span>
            </div>
            {getStatusBadge()}
          </div>

          <Separator />

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">出勤日数</div>
              <div className="text-lg font-bold">
                {summary.actualWorkDays} / {summary.scheduledWorkDays}日
              </div>
              <Progress value={attendanceRate} className="h-1 mt-2" />
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">実働時間</div>
              <div className="text-lg font-bold">
                {summary.actualHours}h
              </div>
              <Progress value={workHoursRate} className="h-1 mt-2" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">所定労働時間</span>
              <span>{summary.scheduledHours}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">残業時間</span>
              <span className={cn(
                'font-medium',
                hasOvertimeWarning && 'text-orange-600'
              )}>
                {summary.overtimeHours}h
                {hasOvertimeWarning && (
                  <AlertTriangle className="inline ml-1 h-3 w-3" />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">休暇取得</span>
              <span>{summary.leaveCount}日</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">在宅勤務</span>
              <span>{summary.remoteWorkDays}日</span>
            </div>
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500 text-sm font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                確認事項
              </div>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                {summary.lateCount > 0 && (
                  <li>・遅刻: {summary.lateCount}回</li>
                )}
                {summary.earlyLeaveCount > 0 && (
                  <li>・早退: {summary.earlyLeaveCount}回</li>
                )}
                {summary.absenceCount > 0 && (
                  <li>・欠勤: {summary.absenceCount}日</li>
                )}
              </ul>
            </div>
          )}

          {/* Note */}
          {closingStatus === 'open' && (
            <div className="space-y-2">
              <Label htmlFor="closing-note">備考（任意）</Label>
              <Textarea
                id="closing-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="承認者への連絡事項があれば入力してください"
                rows={3}
              />
            </div>
          )}

          {/* Status Messages */}
          {closingStatus === 'pending' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                <Clock className="h-4 w-4" />
                承認待ちです。承認者の対応をお待ちください。
              </div>
            </div>
          )}

          {closingStatus === 'approved' && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                この月の勤怠は承認済みです。
              </div>
            </div>
          )}

          {closingStatus === 'rejected' && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                差し戻されました。勤怠を修正して再申請してください。
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          {closingStatus === 'open' && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? '送信中...' : '締め申請する'}
            </Button>
          )}
          {closingStatus === 'rejected' && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? '送信中...' : '再申請する'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
