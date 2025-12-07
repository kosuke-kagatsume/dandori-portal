'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Building,
  User,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCertificationRenewals } from '@/hooks/use-certification-notifications';
import { useUserStore } from '@/lib/store';
import { format } from 'date-fns';

interface CertificationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewal: {
    id: string;
    certificationId: string;
    userId: string;
    newIssueDate: string;
    newExpiryDate?: string;
    newCredentialId?: string;
    newDocumentUrl?: string;
    newDocumentName?: string;
    notes?: string;
    status: string;
    documentVerified: boolean;
    dateVerified: boolean;
    organizationVerified: boolean;
    certification: {
      id: string;
      name: string;
      organization: string;
      issueDate: string;
      expiryDate?: string;
    };
    user?: {
      id: string;
      name: string;
      department?: string;
    };
  };
  onSuccess?: () => void;
}

export function CertificationReviewDialog({
  open,
  onOpenChange,
  renewal,
  onSuccess,
}: CertificationReviewDialogProps) {
  const { reviewRenewal, submitting } = useCertificationRenewals();
  const { currentUser } = useUserStore();
  const [checklist, setChecklist] = useState({
    documentVerified: renewal.documentVerified,
    dateVerified: renewal.dateVerified,
    organizationVerified: renewal.organizationVerified,
  });
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const allChecked = checklist.documentVerified && checklist.dateVerified && checklist.organizationVerified;

  const handleApprove = async () => {
    setError(null);

    if (!allChecked) {
      setError('すべての確認項目にチェックを入れてください');
      return;
    }

    const result = await reviewRenewal(renewal.id, 'approve', {
      reviewedBy: currentUser?.id,
      reviewedByName: currentUser?.name,
      reviewComment,
      ...checklist,
    });

    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(result.error || '承認に失敗しました');
    }
  };

  const handleReject = async () => {
    setError(null);

    if (!reviewComment.trim()) {
      setError('却下理由を入力してください');
      return;
    }

    const result = await reviewRenewal(renewal.id, 'reject', {
      reviewedBy: currentUser?.id,
      reviewedByName: currentUser?.name,
      reviewComment,
    });

    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(result.error || '却下に失敗しました');
    }
  };

  const handleStartReview = async () => {
    if (renewal.status === 'pending') {
      await reviewRenewal(renewal.id, 'start_review');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            資格更新申請 審査
          </DialogTitle>
          <DialogDescription>
            申請内容を確認し、承認または却下してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 申請者情報 */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{renewal.user?.name || '不明'}</p>
                <p className="text-sm text-muted-foreground">
                  {renewal.user?.department || '-'}
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {renewal.status === 'pending' ? '未処理' : '審査中'}
              </Badge>
            </div>
          </div>

          {/* 資格情報比較 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 現在の情報 */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 font-medium text-muted-foreground">現在の情報</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{renewal.certification.name}</p>
                    <p className="text-muted-foreground">{renewal.certification.organization}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    発行日: {format(new Date(renewal.certification.issueDate), 'yyyy/MM/dd')}
                  </span>
                </div>
                {renewal.certification.expiryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      有効期限: {format(new Date(renewal.certification.expiryDate), 'yyyy/MM/dd')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 申請された新しい情報 */}
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
              <h4 className="mb-3 font-medium text-primary">申請された新しい情報</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    新発行日: {format(new Date(renewal.newIssueDate), 'yyyy/MM/dd')}
                  </span>
                </div>
                {renewal.newExpiryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      新有効期限: {format(new Date(renewal.newExpiryDate), 'yyyy/MM/dd')}
                    </span>
                  </div>
                )}
                {renewal.newCredentialId && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>認定番号: {renewal.newCredentialId}</span>
                  </div>
                )}
                {renewal.notes && (
                  <div className="mt-2 rounded bg-background/50 p-2">
                    <p className="text-xs text-muted-foreground">備考:</p>
                    <p>{renewal.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* 確認チェックリスト */}
          <div className="space-y-4">
            <h4 className="font-medium">確認チェックリスト</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="documentVerified"
                  checked={checklist.documentVerified}
                  onCheckedChange={(checked) =>
                    setChecklist({ ...checklist, documentVerified: !!checked })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="documentVerified" className="cursor-pointer">
                    証明書の真正性を確認しました
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    添付された証明書が正当なものであることを確認してください
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="dateVerified"
                  checked={checklist.dateVerified}
                  onCheckedChange={(checked) =>
                    setChecklist({ ...checklist, dateVerified: !!checked })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="dateVerified" className="cursor-pointer">
                    発行日・有効期限が証明書と一致しています
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    申請された日付が証明書に記載の日付と一致することを確認してください
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="organizationVerified"
                  checked={checklist.organizationVerified}
                  onCheckedChange={(checked) =>
                    setChecklist({ ...checklist, organizationVerified: !!checked })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="organizationVerified" className="cursor-pointer">
                    発行機関が正しいことを確認しました
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    発行元が正規の認定機関であることを確認してください
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* コメント */}
          <div className="space-y-2">
            <Label htmlFor="reviewComment">コメント</Label>
            <Textarea
              id="reviewComment"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="審査コメントを入力（却下の場合は必須）"
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            <XCircle className="mr-2 h-4 w-4" />
            却下
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={submitting || !allChecked}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                処理中...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                承認
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
