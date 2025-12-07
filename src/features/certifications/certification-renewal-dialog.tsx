'use client';

import { useState } from 'react';
import { RefreshCw, Upload, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCertificationRenewals } from '@/hooks/use-certification-notifications';
import { format } from 'date-fns';

interface CertificationRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification: {
    id: string;
    name: string;
    organization: string;
    expiryDate?: string;
    daysUntilExpiry?: number;
  };
  onSuccess?: () => void;
}

export function CertificationRenewalDialog({
  open,
  onOpenChange,
  certification,
  onSuccess,
}: CertificationRenewalDialogProps) {
  const { submitRenewal, submitting } = useCertificationRenewals();
  const [formData, setFormData] = useState({
    newIssueDate: format(new Date(), 'yyyy-MM-dd'),
    newExpiryDate: '',
    newCredentialId: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.newIssueDate) {
      setError('新しい発行日を入力してください');
      return;
    }

    const result = await submitRenewal({
      certificationId: certification.id,
      newIssueDate: formData.newIssueDate,
      newExpiryDate: formData.newExpiryDate || undefined,
      newCredentialId: formData.newCredentialId || undefined,
      notes: formData.notes || undefined,
    });

    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
      // フォームをリセット
      setFormData({
        newIssueDate: format(new Date(), 'yyyy-MM-dd'),
        newExpiryDate: '',
        newCredentialId: '',
        notes: '',
      });
    } else {
      setError(result.error || '申請に失敗しました');
    }
  };

  const daysLabel = certification.daysUntilExpiry !== undefined
    ? certification.daysUntilExpiry < 0
      ? '期限切れ'
      : `残り${certification.daysUntilExpiry}日`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            資格更新申請
          </DialogTitle>
          <DialogDescription>
            資格を更新した場合は、新しい情報を入力して申請してください。
            管理者の承認後、資格情報が更新されます。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* 対象資格情報 */}
          <div className="mb-6 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{certification.name}</p>
                <p className="text-sm text-muted-foreground">{certification.organization}</p>
              </div>
              {daysLabel && (
                <Badge variant={certification.daysUntilExpiry !== undefined && certification.daysUntilExpiry < 0 ? 'destructive' : 'secondary'}>
                  {daysLabel}
                </Badge>
              )}
            </div>
            {certification.expiryDate && (
              <p className="mt-2 text-sm text-muted-foreground">
                現在の有効期限: {format(new Date(certification.expiryDate), 'yyyy/MM/dd')}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* 新しい発行日 */}
            <div className="space-y-2">
              <Label htmlFor="newIssueDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                新しい発行日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newIssueDate"
                type="date"
                value={formData.newIssueDate}
                onChange={(e) => setFormData({ ...formData, newIssueDate: e.target.value })}
                required
              />
            </div>

            {/* 新しい有効期限 */}
            <div className="space-y-2">
              <Label htmlFor="newExpiryDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                新しい有効期限
              </Label>
              <Input
                id="newExpiryDate"
                type="date"
                value={formData.newExpiryDate}
                onChange={(e) => setFormData({ ...formData, newExpiryDate: e.target.value })}
                min={formData.newIssueDate}
              />
              <p className="text-xs text-muted-foreground">
                無期限の資格の場合は空欄のままにしてください
              </p>
            </div>

            {/* 認定番号 */}
            <div className="space-y-2">
              <Label htmlFor="newCredentialId" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                認定番号
              </Label>
              <Input
                id="newCredentialId"
                type="text"
                value={formData.newCredentialId}
                onChange={(e) => setFormData({ ...formData, newCredentialId: e.target.value })}
                placeholder="変更がある場合のみ入力"
              />
            </div>

            {/* 証明書ファイル（将来実装） */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                証明書ファイル
              </Label>
              <div className="flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-4 py-6">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    ファイルアップロード機能は準備中です
                  </p>
                </div>
              </div>
            </div>

            {/* 備考 */}
            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="補足情報があれば入力してください"
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  送信中...
                </>
              ) : (
                '申請する'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
