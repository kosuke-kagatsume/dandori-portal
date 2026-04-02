'use client';

import type { WorkflowRequest } from '@/lib/workflow-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { CheckCheck, XCircle, UserX, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  getWorkflowTypeLabel, getStatusLabel, getStatusColor,
  getPriorityLabel, getPriorityColor, getApproverRoleLabel, calculateProgress,
} from '@/lib/workflow/workflow-helpers';

// ── 承認/却下ダイアログ ──────────────────────────────────────────

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: WorkflowRequest | null;
  action: 'approve' | 'reject';
  comment: string;
  onCommentChange: (value: string) => void;
  onConfirm: () => void;
}

export function ApprovalDialog({
  open, onOpenChange, request, action, comment, onCommentChange, onConfirm,
}: ApprovalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action === 'approve' ? '申請を承認' : '申請を却下'}</DialogTitle>
          <DialogDescription>
            {request && (
              <div className="space-y-2 text-left mt-4">
                <p>申請者: {request.requesterName}</p>
                <p>申請種別: {getWorkflowTypeLabel(request.type)}</p>
                <p>申請日: {format(new Date(request.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">
              コメント {action === 'reject' && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="comment"
              placeholder={action === 'approve' ? '承認理由やコメントをご入力ください（任意）' : '却下理由をご入力ください（必須）'}
              value={comment} onChange={(e) => onCommentChange(e.target.value)} rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button
            onClick={onConfirm}
            disabled={action === 'reject' && !comment}
            className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            variant={action === 'reject' ? 'destructive' : 'default'}
          >
            {action === 'approve' ? '承認する' : '却下する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 代理承認ダイアログ ──────────────────────────────────────────

interface DelegateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delegateUserId: string;
  onDelegateUserIdChange: (value: string) => void;
  delegateReason: string;
  onDelegateReasonChange: (value: string) => void;
  onConfirm: () => void;
}

export function DelegateDialog({
  open, onOpenChange, delegateUserId, onDelegateUserIdChange,
  delegateReason, onDelegateReasonChange, onConfirm,
}: DelegateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>承認を委任</DialogTitle>
          <DialogDescription>他の承認者に承認を委任します</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delegate-user">委任先 <span className="text-red-500">*</span></Label>
            <Select value={delegateUserId} onValueChange={onDelegateUserIdChange}>
              <SelectTrigger><SelectValue placeholder="委任先を選択" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="4">佐藤副部長</SelectItem>
                <SelectItem value="5">高橋課長</SelectItem>
                <SelectItem value="6">渡辺主任</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delegate-reason">委任理由 <span className="text-red-500">*</span></Label>
            <Textarea
              id="delegate-reason" placeholder="委任理由を入力してください"
              value={delegateReason} onChange={(e) => onDelegateReasonChange(e.target.value)} rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={onConfirm} disabled={!delegateUserId || !delegateReason}>委任する</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 詳細ダイアログ ──────────────────────────────────────────

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: WorkflowRequest | null;
}

export function DetailDialog({ open, onOpenChange, request }: DetailDialogProps) {
  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>申請詳細</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">申請者</Label>
                <p className="font-medium">{request.requesterName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">部署</Label>
                <p className="font-medium">{request.department}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">申請種別</Label>
                <p className="font-medium">{getWorkflowTypeLabel(request.type)}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">優先度</Label>
                <Badge className={getPriorityColor(request.priority)}>{getPriorityLabel(request.priority)}</Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">ステータス</Label>
                <Badge className={getStatusColor(request.status)}>{getStatusLabel(request.status)}</Badge>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">申請日</Label>
                <p className="font-medium">{format(new Date(request.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
              </div>
            </div>

            {/* 説明 */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">説明</Label>
              <p className="text-sm">{request.description}</p>
            </div>

            {/* 承認フロー */}
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">承認フロー</Label>
              <div className="space-y-4">
                {request.approvalSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.status === 'approved' ? 'bg-green-100 text-green-600' :
                      step.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      step.status === 'skipped' ? 'bg-gray-100 text-gray-400' :
                      index === request.currentStep ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {step.status === 'approved' ? <CheckCheck className="h-5 w-5" /> :
                       step.status === 'rejected' ? <XCircle className="h-5 w-5" /> :
                       step.status === 'skipped' ? <UserX className="h-5 w-5" /> :
                       step.order}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{step.approverName}</span>
                        <Badge variant="outline" className="text-xs">{getApproverRoleLabel(step.approverRole)}</Badge>
                        {step.delegatedTo && (
                          <Badge className="text-xs bg-purple-100 text-purple-800">委任: {step.delegatedTo.name}</Badge>
                        )}
                        {step.status === 'approved' && <Badge className="text-xs bg-green-100 text-green-800">承認済み</Badge>}
                        {step.status === 'rejected' && <Badge className="text-xs" variant="destructive">却下</Badge>}
                        {step.status === 'pending' && index === request.currentStep && <Badge className="text-xs">承認待ち</Badge>}
                      </div>
                      {step.actionDate && (
                        <p className="text-sm text-muted-foreground">{format(new Date(step.actionDate), 'MM/dd HH:mm', { locale: ja })}</p>
                      )}
                      {step.comments && <p className="text-sm mt-1 p-2 bg-muted rounded">{step.comments}</p>}
                      {step.delegatedTo && (
                        <p className="text-sm mt-1 p-2 bg-purple-50 rounded text-purple-800">委任理由: {step.delegatedTo.reason}</p>
                      )}
                      {step.escalationDeadline && step.status === 'pending' && (
                        <p className="text-sm mt-1 text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          期限: {format(new Date(step.escalationDeadline), 'MM/dd', { locale: ja })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* タイムライン */}
            <div>
              <Label className="text-sm text-muted-foreground mb-3 block">履歴</Label>
              <div className="space-y-2">
                {request.timeline.map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-24">{format(new Date(event.timestamp), 'MM/dd HH:mm')}</span>
                    <span className="flex-1">
                      <span className="font-medium">{event.userName}</span>
                      {' '}が{event.action}
                      {event.comments && <span className="text-muted-foreground"> - {event.comments}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 進捗バー */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Progress value={calculateProgress(request)} className="flex-1" />
              <span className="text-sm text-muted-foreground">進捗: {calculateProgress(request).toFixed(0)}%</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
