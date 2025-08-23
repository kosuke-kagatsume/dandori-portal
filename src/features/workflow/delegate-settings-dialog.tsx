'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { useUserStore } from '@/lib/store/user-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DelegateSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function DelegateSettingsDialog({
  open,
  onOpenChange,
  userId,
}: DelegateSettingsDialogProps) {
  const { setDelegateApprover, getActiveDelegateFor } = useWorkflowStore();
  const currentDelegate = getActiveDelegateFor(userId);
  
  const [delegateToId, setDelegateToId] = useState(currentDelegate?.delegateToId || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    currentDelegate ? new Date(currentDelegate.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentDelegate ? new Date(currentDelegate.endDate) : undefined
  );
  const [reason, setReason] = useState(currentDelegate?.reason || '');

  // デモ用の承認者リスト
  const approvers = [
    { id: 'user2', name: '佐藤花子' },
    { id: 'user3', name: '鈴木一郎' },
    { id: 'user4', name: '高橋美咲' },
    { id: 'user5', name: '山田次郎' },
    { id: 'manager1', name: '部長 - 田中太郎' },
  ];

  const handleSave = () => {
    if (!delegateToId || !startDate || !endDate || !reason) {
      toast.error('すべての項目を入力してください');
      return;
    }

    if (startDate > endDate) {
      toast.error('終了日は開始日より後に設定してください');
      return;
    }

    const delegateName = approvers.find(a => a.id === delegateToId)?.name || '';
    
    setDelegateApprover({
      userId,
      delegateToId,
      delegateName,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason,
    });

    toast.success('代理承認者を設定しました');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            代理承認者の設定
          </DialogTitle>
          <DialogDescription>
            不在期間中の承認を他の方に委任します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="delegate">代理承認者</Label>
            <Select value={delegateToId} onValueChange={setDelegateToId}>
              <SelectTrigger id="delegate">
                <SelectValue placeholder="承認者を選択" />
              </SelectTrigger>
              <SelectContent>
                {approvers.map((approver) => (
                  <SelectItem key={approver.id} value={approver.id}>
                    {approver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>開始日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, 'yyyy/MM/dd', { locale: ja })
                    ) : (
                      '開始日を選択'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>終了日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, 'yyyy/MM/dd', { locale: ja })
                    ) : (
                      '終了日を選択'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate || date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">理由</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：有給休暇のため"
              rows={3}
            />
          </div>

          {currentDelegate && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-3 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                現在の設定
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                {currentDelegate.delegateName}に
                {format(new Date(currentDelegate.startDate), 'MM/dd')}〜
                {format(new Date(currentDelegate.endDate), 'MM/dd')}まで委任中
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>設定を保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}