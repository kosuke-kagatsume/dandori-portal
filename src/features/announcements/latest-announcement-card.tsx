'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  useAnnouncementsStore,
  priorityLabels,
  typeLabels,
  type Announcement,
} from '@/lib/store/announcements-store';
import { useUserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function LatestAnnouncementCard() {
  const currentUser = useUserStore((state) => state.currentUser);
  const { getAnnouncements } = useAnnouncementsStore();

  // SSR/CSR完全一致のため、マウント後のみレンダリング
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // クライアント専用のstate（SSR/CSR一致のため）
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [otherAnnouncementsCount, setOtherAnnouncementsCount] = useState<number>(0);

  // すべてのアナウンスを取得
  const allAnnouncements = getAnnouncements();

  // マウントフラグを立てる（SSR/CSR一致のため）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // クライアント側でのみフィルタリング・ソート処理を実行
  useEffect(() => {
    try {
      if (!currentUser || !allAnnouncements || !Array.isArray(allAnnouncements)) {
        setLatestAnnouncement(null);
        setOtherAnnouncementsCount(0);
        return;
      }

    const userRoles = currentUser.roles || [];

    // 公開中かつ対象ロールに該当するアナウンスをフィルタリング
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻をリセット

    const validAnnouncements = allAnnouncements.filter((announcement) => {
      // データの存在確認
      if (!announcement || !announcement.startDate) {
        return false;
      }

      const startDate = new Date(announcement.startDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = announcement.endDate ? new Date(announcement.endDate) : null;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      // 公開期間チェック
      const isPublished = startDate <= today && (!endDate || endDate >= today);

      // published フラグのチェック
      if (!announcement.published) {
        return false;
      }

      // ロールチェック
      const hasAccess =
        announcement.target === 'all' ||
        (announcement.targetRoles && announcement.targetRoles.length === 0) ||
        (announcement.targetRoles && announcement.targetRoles.some((role) => userRoles.includes(role)));

      return isPublished && hasAccess;
    });

    // 掲載開始日の新しい順にソート
    const sortedAnnouncements = [...validAnnouncements].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // 最新1件を取得
    const latest = sortedAnnouncements[0];

    if (!latest || !latest.content || !latest.title) {
      setLatestAnnouncement(null);
      setOtherAnnouncementsCount(0);
      return;
    }

    setLatestAnnouncement(latest);

    // 他のお知らせ件数を保存
    setOtherAnnouncementsCount(sortedAnnouncements.length - 1);

      // 日付フォーマット（クライアント側でのみ実行）
      const formatted = new Date(latest.startDate).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setFormattedDate(formatted);
    } catch (error) {
      // Supabase APIエラーなどを握りつぶす
      console.warn('Failed to load latest announcement:', error);
      setLatestAnnouncement(null);
      setOtherAnnouncementsCount(0);
    }
  }, [currentUser, allAnnouncements]);

  // SSR/CSR完全一致: マウント前は何も表示しない
  if (!isMounted) {
    return null;
  }

  // データ未取得時は何も表示しない
  if (!latestAnnouncement) {
    return null;
  }

  // 本文のプレビュー（最初の100文字）
  const content = latestAnnouncement.content || '';
  const contentPreview =
    content.length > 100
      ? `${content.substring(0, 100)}...`
      : content;

  // 優先度に応じたアイコンと色
  const getPriorityIcon = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <Bell className="h-5 w-5 text-orange-600" />;
      case 'normal':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColorClass = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'normal':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'low':
        return 'border-gray-300 bg-gray-50 dark:bg-gray-900';
    }
  };

  return (
    <Card
      className={cn(
        'border-l-4 shadow-md hover:shadow-lg transition-all',
        getPriorityColorClass(latestAnnouncement.priority)
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          {/* ヘッダー */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              {getPriorityIcon(latestAnnouncement.priority)}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {typeLabels[latestAnnouncement.type]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {priorityLabels[latestAnnouncement.priority]}
                  </Badge>
                </div>
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  {latestAnnouncement.title}
                </h3>
              </div>
            </div>
          </div>

          {/* 掲載開始日 */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{formattedDate}</span>
          </div>

          {/* 本文プレビュー */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {contentPreview}
          </p>

          {/* 詳細ボタン */}
          <div className="flex items-center justify-between pt-2">
            <Link href="/ja/announcements">
              <Button variant="outline" size="sm" className="gap-2">
                詳細を見る
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            {otherAnnouncementsCount > 0 && (
              <span className="text-xs text-muted-foreground">
                他 {otherAnnouncementsCount}件のお知らせ
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
