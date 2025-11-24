'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Megaphone,
  Search,
  Filter,
  AlertCircle,
  Calendar,
  ExternalLink,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useAnnouncementsStore } from '@/lib/store/announcements-store';
import type { Announcement, AnnouncementPriority, AnnouncementType } from '@/lib/store/announcements-store';
import { useIsMounted } from '@/hooks/useIsMounted';
import ReactMarkdown from 'react-markdown';

// 優先度ラベル
const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  urgent: '緊急',
  high: '高',
  normal: '通常',
  low: '低',
};

// 種別ラベル
const TYPE_LABELS: Record<AnnouncementType, string> = {
  general: '一般告知',
  deadline: '締切・期限',
  system: 'システム関連',
  event: 'イベント',
  policy: '規程・ポリシー',
  emergency: '緊急連絡',
};

export default function AnnouncementsPage() {
  const mounted = useIsMounted();
  const {
    announcements,
    isLoading,
    fetchPublishedAnnouncements,
    markAsRead,
    getUserStatus,
  } = useAnnouncementsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 初期化: 公開済みアナウンスを取得
  useEffect(() => {
    fetchPublishedAnnouncements();
  }, [fetchPublishedAnnouncements]);

  // 現在のユーザーID（仮）
  const currentUserId = 'current-user-id'; // TODO: 実際のユーザーIDを取得

  // フィルタリング
  const filteredAnnouncements = useMemo(() => {
    if (!mounted) return [];

    let filtered = announcements.filter((a) => a.published);

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query)
      );
    }

    // 優先度フィルター
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((a) => a.priority === priorityFilter);
    }

    // 種別フィルター
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // 既読/未読フィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => {
        const userStatus = getUserStatus(a.id, currentUserId);
        return userStatus === statusFilter;
      });
    }

    // 日付でソート（新しい順）
    return filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt);
      const dateB = new Date(b.publishedAt || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [mounted, announcements, searchQuery, priorityFilter, typeFilter, statusFilter, getUserStatus, currentUserId]);

  // 統計
  const stats = useMemo(() => {
    const total = announcements.filter((a) => a.published).length;
    const unread = announcements.filter((a) => {
      const status = getUserStatus(a.id, currentUserId);
      return a.published && status === 'unread';
    }).length;
    const urgent = announcements.filter((a) => a.published && a.priority === 'urgent').length;
    const requiresAction = announcements.filter((a) => a.published && a.requiresAction).length;

    return { total, unread, urgent, requiresAction };
  }, [announcements, getUserStatus, currentUserId]);

  // 詳細表示
  const handleViewDetail = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDetailDialogOpen(true);

    // 既読にする
    const userStatus = getUserStatus(announcement.id, currentUserId);
    if (userStatus === 'unread') {
      markAsRead(announcement.id, currentUserId);
    }
  };

  // 優先度バッジ
  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">{PRIORITY_LABELS[priority]}</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-500">{PRIORITY_LABELS[priority]}</Badge>;
      case 'normal':
        return <Badge variant="secondary">{PRIORITY_LABELS[priority]}</Badge>;
      case 'low':
        return <Badge variant="outline">{PRIORITY_LABELS[priority]}</Badge>;
    }
  };

  // 種別バッジ
  const getTypeBadge = (type: AnnouncementType) => {
    const variant = type === 'emergency' ? 'destructive' : 'outline';
    return <Badge variant={variant}>{TYPE_LABELS[type]}</Badge>;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Megaphone className="h-8 w-8" />
          アナウンス
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          全社アナウンスの確認
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総アナウンス数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              未読
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              緊急
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              対応が必要
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.requiresAction}</div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="タイトル・内容で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 優先度フィルター */}
            <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="優先度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての優先度</SelectItem>
                <SelectItem value="urgent">緊急</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="normal">通常</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>

            {/* 種別フィルター */}
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="種別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての種別</SelectItem>
                <SelectItem value="general">一般告知</SelectItem>
                <SelectItem value="deadline">締切・期限</SelectItem>
                <SelectItem value="system">システム関連</SelectItem>
                <SelectItem value="event">イベント</SelectItem>
                <SelectItem value="policy">規程・ポリシー</SelectItem>
                <SelectItem value="emergency">緊急連絡</SelectItem>
              </SelectContent>
            </Select>

            {/* 既読/未読フィルター */}
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="unread">未読</SelectItem>
                <SelectItem value="read">既読</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* アナウンス一覧 */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              読み込み中...
            </CardContent>
          </Card>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              該当するアナウンスがありません
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const userStatus = getUserStatus(announcement.id, currentUserId);
            const isUnread = userStatus === 'unread';
            const isOverdue = announcement.actionDeadline && new Date(announcement.actionDeadline) < new Date();

            return (
              <Card
                key={announcement.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  isUnread ? 'border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleViewDetail(announcement)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(announcement.priority)}
                        {getTypeBadge(announcement.type)}
                        {isUnread && (
                          <Badge variant="default" className="bg-blue-500">
                            未読
                          </Badge>
                        )}
                        {announcement.requiresAction && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            対応が必要
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                        <div>投稿者: {announcement.createdByName}</div>
                        {announcement.actionDeadline && (
                          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            <Clock className="h-3 w-3" />
                            期限: {new Date(announcement.actionDeadline).toLocaleDateString('ja-JP')}
                            {isOverdue && <AlertCircle className="h-3 w-3" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPriorityBadge(selectedAnnouncement.priority)}
                      {getTypeBadge(selectedAnnouncement.type)}
                      {selectedAnnouncement.requiresAction && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          対応が必要
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-2xl">{selectedAnnouncement.title}</DialogTitle>
                    <DialogDescription className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                      <div>投稿者: {selectedAnnouncement.createdByName}</div>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* 内容 */}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{selectedAnnouncement.content}</ReactMarkdown>
                </div>

                {/* 期限 */}
                {selectedAnnouncement.actionDeadline && (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-700" />
                        <span className="font-medium text-orange-700">
                          対応期限: {new Date(selectedAnnouncement.actionDeadline).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* アクションボタン */}
                {selectedAnnouncement.requiresAction && selectedAnnouncement.actionUrl && (
                  <div className="flex gap-2">
                    <Button asChild className="w-full">
                      <a
                        href={selectedAnnouncement.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {selectedAnnouncement.actionLabel || '詳細を確認'}
                      </a>
                    </Button>
                  </div>
                )}

                {/* 確認ボタン */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setSelectedAnnouncement(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    確認しました
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
