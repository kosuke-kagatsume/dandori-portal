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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types';

interface RetireUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onConfirm: (retiredDate: string, reason: string) => Promise<void>;
}

export function RetireUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: RetireUserDialogProps) {
  const [retiredDate, setRetiredDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState<string>('voluntary');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      await onConfirm(retiredDate, reason);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to retire user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const reasonLabels = {
    voluntary: '自己都合退職',
    company: '会社都合退職',
    contract_end: '契約期間満了',
    retirement_age: '定年退職',
    other: 'その他',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>退職処理</DialogTitle>
          <DialogDescription>
            {user?.name} さんの退職処理を行います。退職日と退職理由を入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="retiredDate">退職日 *</Label>
            <Input
              id="retiredDate"
              type="date"
              value={retiredDate}
              onChange={(e) => setRetiredDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">退職理由 *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reasonLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !retiredDate}
            variant="destructive"
          >
            {submitting ? '処理中...' : '退職処理を実行'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
