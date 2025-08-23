'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCheck, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface BulkApprovalBarProps {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkApprovalBar({ selectedIds, onClear }: BulkApprovalBarProps) {
  const { bulkApprove, bulkReject } = useWorkflowStore();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  if (selectedIds.length === 0) return null;

  const handleBulkApprove = () => {
    bulkApprove(selectedIds, comments);
    toast.success(`${selectedIds.length}件の申請を承認しました`);
    setShowApproveDialog(false);
    setComments('');
    onClear();
  };

  const handleBulkReject = () => {
    if (!rejectReason.trim()) {
      toast.error('却下理由を入力してください');
      return;
    }
    bulkReject(selectedIds, rejectReason);
    toast.success(`${selectedIds.length}件の申請を却下しました`);
    setShowRejectDialog(false);
    setRejectReason('');
    onClear();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-4 flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {selectedIds.length}件選択中
          </Badge>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              一括承認
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              一括却下
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClear}
            >
              選択解除
            </Button>
          </div>
        </div>
      </div>

      {/* 一括承認ダイアログ */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-green-600" />
              一括承認の確認
            </DialogTitle>
            <DialogDescription>
              {selectedIds.length}件の申請を承認します
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                コメント（任意）
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="承認コメントを入力..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              キャンセル
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleBulkApprove}
            >
              承認する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 一括却下ダイアログ */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              一括却下の確認
            </DialogTitle>
            <DialogDescription>
              {selectedIds.length}件の申請を却下します
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-red-600">
                <MessageSquare className="h-4 w-4" />
                却下理由（必須）
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="却下理由を入力してください..."
                rows={3}
                className="border-red-200 focus:border-red-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkReject}
            >
              却下する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}