'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  Calendar,
  User,
  FileText,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
} from 'lucide-react';
import {
  useNotificationHistoryStore,
  NOTIFICATION_TYPE_LABELS,
  type NotificationStatus,
} from '@/lib/store/notification-history-store';
import { toast } from 'sonner';

// 通知メタデータの型定義
interface NotificationMetadata {
  invoiceId?: string;
  invoiceNumber?: string;
  amount?: number;
  paidDate?: string;
  dueDate?: string;
}

// メタデータを安全に取得するヘルパー
function getMetadata(metadata: Record<string, unknown> | undefined): NotificationMetadata {
  if (!metadata) return {};
  return metadata as NotificationMetadata;
}

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.id as string;
  const { getNotificationById, resendNotification } = useNotificationHistoryStore();

  const notification = useMemo(() => {
    return getNotificationById(notificationId);
  }, [notificationId, getNotificationById]);

  if (!notification) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">通知が見つかりません</h2>
          <Button onClick={() => router.push('/dw-admin/dashboard?tab=notifications')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            通知一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  // ステータスバッジ
  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            送信済み
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="mr-1 h-3 w-3" />
            送信失敗
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            送信待ち
          </Badge>
        );
    }
  };

  // 再送信ハンドラー
  const handleResend = () => {
    resendNotification(notification.id);
    toast.success('通知を再送信しました');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dw-admin/dashboard?tab=notifications')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            通知一覧に戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="h-8 w-8" />
              通知詳細
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              通知ID: <code className="bg-muted px-2 py-1 rounded text-xs">{notification.id}</code>
            </p>
          </div>
        </div>
        {getStatusBadge(notification.status ?? 'pending')}
      </div>

      {/* アクション */}
      <Card>
        <CardHeader>
          <CardTitle>アクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {notification.status === 'failed' || notification.status === 'pending' ? (
              <Button onClick={handleResend}>
                <Send className="mr-2 h-4 w-4" />
                再送信
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">送信完了</span>
              </div>
            )}
            {getMetadata(notification.metadata)?.invoiceId && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dw-admin/invoices/${getMetadata(notification.metadata)?.invoiceId}`)
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                関連請求書を表示
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">通知タイプ</div>
                <div className="font-medium">{NOTIFICATION_TYPE_LABELS[notification.type]}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">テナント</div>
                <div className="font-medium">{notification.tenantName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">送信先</div>
                <div className="font-medium">{notification.recipientEmail}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">送信日時</div>
                <div className="font-medium">
                  {notification.sentAt
                    ? new Date(notification.sentAt).toLocaleString('ja-JP')
                    : '-'}
                </div>
              </div>
            </div>

            {notification.invoiceNumber && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">請求書番号</div>
                  <div className="font-medium">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {notification.invoiceNumber}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* メタデータ */}
        {notification.metadata && Object.keys(notification.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>追加情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const meta = getMetadata(notification.metadata);
                return (
                  <>
                    {meta.invoiceNumber && (
                      <div>
                        <div className="text-sm text-muted-foreground">請求書番号</div>
                        <div className="font-medium">
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {meta.invoiceNumber}
                          </code>
                        </div>
                      </div>
                    )}
                    {meta.amount !== undefined && meta.amount !== null && (
                      <div>
                        <div className="text-sm text-muted-foreground">金額</div>
                        <div className="font-medium text-green-600">
                          ¥{meta.amount.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {meta.paidDate && (
                      <div>
                        <div className="text-sm text-muted-foreground">支払日</div>
                        <div className="font-medium">
                          {new Date(meta.paidDate).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    )}
                    {meta.dueDate && (
                      <div>
                        <div className="text-sm text-muted-foreground">支払期限</div>
                        <div className="font-medium">
                          {new Date(meta.dueDate).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* メール内容 */}
      <Card>
        <CardHeader>
          <CardTitle>メール内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">件名</div>
            <div className="font-medium text-lg">{notification.subject}</div>
          </div>

          <Separator />

          <div>
            <div className="text-sm text-muted-foreground mb-2">本文</div>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">{notification.body}</div>
          </div>
        </CardContent>
      </Card>

      {/* エラー情報（失敗時のみ） */}
      {notification.status === 'failed' && notification.error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              エラー情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 p-4 rounded-lg text-red-900">{notification.error}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
