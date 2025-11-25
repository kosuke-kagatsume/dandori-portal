'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Paperclip,
  Download,
  ExternalLink,
} from 'lucide-react';
import { LeaveRequest, LeaveType } from '@/lib/store/leave-management-store';

interface LeaveDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LeaveRequest | null;
}

export function LeaveDetailDialog({ open, onOpenChange, request }: LeaveDetailDialogProps) {
  if (!request) return null;

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const config = {
      draft: { label: '下書き', variant: 'secondary' as const, icon: FileText },
      pending: { label: '承認待ち', variant: 'outline' as const, icon: Clock },
      approved: { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '却下', variant: 'destructive' as const, icon: XCircle },
      cancelled: { label: 'キャンセル', variant: 'secondary' as const, icon: AlertCircle },
    };

    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getTypeLabel = (type: LeaveType) => {
    const labels: Record<LeaveType, string> = {
      paid: '年次有給',
      sick: '病気休暇',
      special: '特別休暇',
      compensatory: '代休',
      half_day_am: '午前半休',
      half_day_pm: '午後半休',
    };
    return labels[type];
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>休暇申請詳細</DialogTitle>
            {getStatusBadge(request.status)}
          </div>
          <DialogDescription>
            申請ID: {request.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 基本情報 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">申請者</Label>
                  <p className="font-medium">{request.userName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">休暇種別</Label>
                  <p className="font-medium">{getTypeLabel(request.type)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 期間・日数 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                期間・日数
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">開始日</Label>
                  <p className="font-medium">
                    {format(new Date(request.startDate), 'yyyy年MM月dd日 (E)', { locale: ja })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">終了日</Label>
                  <p className="font-medium">
                    {format(new Date(request.endDate), 'yyyy年MM月dd日 (E)', { locale: ja })}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">取得日数</Label>
                <p className="text-2xl font-bold text-blue-600">{request.days}日</p>
              </div>
            </CardContent>
          </Card>

          {/* 理由 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                申請理由
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{request.reason}</p>
            </CardContent>
          </Card>

          {/* 添付ファイル */}
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  添付ファイル ({request.attachments.length}件)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • {format(new Date(file.uploadedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            link.click();
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 承認情報 */}
          {(request.status === 'approved' || request.status === 'rejected') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  承認情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">承認者</Label>
                    <p className="font-medium">{request.approver || '-'}</p>
                  </div>
                  {request.approvedDate && (
                    <div>
                      <Label className="text-sm text-muted-foreground">承認日時</Label>
                      <p className="font-medium">
                        {format(new Date(request.approvedDate), 'yyyy/MM/dd HH:mm', { locale: ja })}
                      </p>
                    </div>
                  )}
                </div>
                {request.rejectedReason && (
                  <div>
                    <Label className="text-sm text-muted-foreground">却下理由</Label>
                    <p className="text-sm text-red-600">{request.rejectedReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* タイムスタンプ */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label className="text-xs">作成日時</Label>
                  <p>{format(new Date(request.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                </div>
                <div>
                  <Label className="text-xs">更新日時</Label>
                  <p>{format(new Date(request.updatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
