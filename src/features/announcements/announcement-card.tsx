'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Calendar,
  Target,
} from 'lucide-react';
import {
  useAnnouncementsStore,
  priorityLabels,
  typeLabels,
  priorityColors,
  typeColors,
  type Announcement,
} from '@/lib/store/announcements-store';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function AnnouncementCard() {
  const currentUser = useUserStore((state) => state.currentUser);
  const {
    getPendingAnnouncements,
    getUnreadAnnouncements,
    markAsRead,
    markAsCompleted,
  } = useAnnouncementsStore();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (!currentUser) return null;

  const userId = currentUser.id;
  const userRoles = currentUser.roles || [];

  // 対応が必要なアナウンス（優先）
  const pendingAnnouncements = getPendingAnnouncements(userId, userRoles);
  // 未読のアナウンス（確認のみ）
  const unreadAnnouncements = getUnreadAnnouncements(userId, userRoles).filter(
    (a) => !a.requiresAction
  );

  // 優先度順にソート（urgent > high > normal > low）
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  const sortedPendingAnnouncements = [...pendingAnnouncements].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
  const sortedUnreadAnnouncements = [...unreadAnnouncements].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const allAnnouncements = [...sortedPendingAnnouncements, ...sortedUnreadAnnouncements];

  if (allAnnouncements.length === 0) {
    return null; // アナウンスがない場合は何も表示しない
  }

  // 期限が近いかチェック（3日以内）
  const isDeadlineNear = (announcement: Announcement) => {
    if (!announcement.actionDeadline) return false;

    const deadline = new Date(announcement.actionDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  // 期限切れかチェック
  const isOverdue = (announcement: Announcement) => {
    if (!announcement.actionDeadline) return false;

    const deadline = new Date(announcement.actionDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return deadline < today;
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 確認済みボタンクリック
  const handleMarkAsRead = (announcementId: string) => {
    markAsRead(announcementId, userId);
  };

  // 対応完了ボタンクリック
  const handleMarkAsCompleted = (announcementId: string) => {
    markAsCompleted(announcementId, userId);
  };

  // アクションボタンクリック
  const handleAction = (announcement: Announcement) => {
    if (announcement.actionUrl) {
      if (announcement.actionUrl.startsWith('http')) {
        window.open(announcement.actionUrl, '_blank');
      } else {
        window.location.href = announcement.actionUrl;
      }
    }
  };

  return (
    <Card className="mb-6 border-2 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">お知らせ・掲示板</CardTitle>
          {allAnnouncements.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {allAnnouncements.length}件
            </Badge>
          )}
        </div>
        <CardDescription>
          対応が必要なお知らせがあります。内容を確認してください。
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Accordion
          type="multiple"
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="space-y-3"
        >
          {allAnnouncements.map((announcement) => {
            const userState = announcement.userStates.find((s) => s.userId === userId);
            const isRead = userState && userState.status !== 'unread';
            const isCompleted = userState && userState.status === 'completed';
            const deadlineNear = isDeadlineNear(announcement);
            const overdue = isOverdue(announcement);

            return (
              <AccordionItem
                key={announcement.id}
                value={announcement.id}
                className={cn(
                  'border rounded-lg',
                  priorityColors[announcement.priority],
                  overdue && 'border-red-500 border-2',
                  deadlineNear && !overdue && 'border-orange-400 border-2'
                )}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex flex-col items-start gap-2 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={typeColors[announcement.type]}>
                        {typeLabels[announcement.type]}
                      </Badge>
                      <Badge variant="outline">
                        {priorityLabels[announcement.priority]}
                      </Badge>
                      {announcement.requiresAction && (
                        <Badge variant="outline" className="gap-1">
                          <Target className="h-3 w-3" />
                          対応必要
                        </Badge>
                      )}
                      {overdue && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          期限切れ
                        </Badge>
                      )}
                      {deadlineNear && !overdue && (
                        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
                          <Clock className="h-3 w-3" />
                          締切間近
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold">{announcement.title}</div>
                    {announcement.actionDeadline && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        期限: {formatDate(announcement.actionDeadline)}
                      </div>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* 本文 */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm">{announcement.content}</div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {announcement.requiresAction ? (
                        <>
                          {announcement.actionUrl && (
                            <Button
                              size="sm"
                              onClick={() => handleAction(announcement)}
                              className="gap-2"
                            >
                              {announcement.actionUrl.startsWith('http') ? (
                                <ExternalLink className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {announcement.actionLabel || '詳細を見る'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsCompleted(announcement.id)}
                            className="gap-2"
                            disabled={isCompleted}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {isCompleted ? '対応完了済み' : '対応完了'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(announcement.id)}
                          className="gap-2"
                          disabled={isRead}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isRead ? '確認済み' : '確認済みにする'}
                        </Button>
                      )}
                    </div>

                    {/* 完了済みメッセージ */}
                    {isCompleted && (
                      <Alert className="bg-green-50 border-green-200 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-900 dark:text-green-100">
                          対応完了済みです。
                          {userState?.completedAt &&
                            ` (${new Date(userState.completedAt).toLocaleString('ja-JP')})`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
