'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
} from 'lucide-react';
import {
  useAnnouncementsStore,
  priorityLabels,
  typeLabels,
  priorityColors,
  typeColors,
  type AnnouncementPriority,
  type AnnouncementType,
} from '@/lib/store/announcements-store';
import { useUserStore } from '@/lib/store';
// import { cn } from '@/lib/utils'; // 将来的にスタイリングで使用予定
import { CreateAnnouncementDialog } from '@/features/announcements/create-announcement-dialog';

export default function AnnouncementsAdminPage() {
  const currentUser = useUserStore((state) => state.currentUser);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const {
    getAnnouncements,
    publishAnnouncement,
    unpublishAnnouncement,
    deleteAnnouncement,
  } = useAnnouncementsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AnnouncementType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<AnnouncementPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // 権限チェック（hr または admin のみアクセス可能）
  if (!currentUser?.roles?.includes('hr') && !currentUser?.roles?.includes('admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>アクセス権限がありません</CardTitle>
            <CardDescription>
              このページにアクセスするには、人事担当者または管理者権限が必要です。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 全アナウンスを取得
  const allAnnouncements = getAnnouncements();

  // フィルタリング
  const filteredAnnouncements = allAnnouncements.filter((announcement) => {
    // 検索クエリ
    if (
      searchQuery &&
      !announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // タイプフィルター
    if (filterType !== 'all' && announcement.type !== filterType) {
      return false;
    }

    // 優先度フィルター
    if (filterPriority !== 'all' && announcement.priority !== filterPriority) {
      return false;
    }

    // ステータスフィルター
    if (filterStatus === 'published' && !announcement.published) {
      return false;
    }
    if (filterStatus === 'draft' && announcement.published) {
      return false;
    }

    return true;
  });

  // 統計
  const stats = {
    total: allAnnouncements.length,
    published: allAnnouncements.filter((a) => a.published).length,
    draft: allAnnouncements.filter((a) => !a.published).length,
    urgent: allAnnouncements.filter((a) => a.priority === 'urgent').length,
  };

  // 公開切り替え
  const handleTogglePublish = (announcementId: string, currentPublished: boolean) => {
    if (currentPublished) {
      unpublishAnnouncement(announcementId);
    } else {
      publishAnnouncement(announcementId);
    }
  };

  // 削除
  const handleDelete = (announcementId: string) => {
    if (confirm('このアナウンスを削除してもよろしいですか？')) {
      deleteAnnouncement(announcementId);
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">アナウンス管理</h1>
          <p className="text-muted-foreground mt-1">
            全社員向けのお知らせを作成・管理します
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総アナウンス数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              公開中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              下書き
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              緊急
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">フィルター・検索</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="タイトル・内容を検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* タイプ */}
            <Select value={filterType} onValueChange={(value) => setFilterType(value as AnnouncementType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="タイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのタイプ</SelectItem>
                <SelectItem value="general">一般</SelectItem>
                <SelectItem value="deadline">締切</SelectItem>
                <SelectItem value="system">システム</SelectItem>
                <SelectItem value="event">イベント</SelectItem>
                <SelectItem value="policy">規程</SelectItem>
                <SelectItem value="emergency">緊急</SelectItem>
              </SelectContent>
            </Select>

            {/* 優先度 */}
            <Select
              value={filterPriority}
              onValueChange={(value) => setFilterPriority(value as 'urgent' | 'high' | 'normal' | 'low' | 'all')}
            >
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

            {/* ステータス */}
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'published' | 'draft' | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="published">公開中</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* アナウンス一覧テーブル */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>アナウンス一覧</CardTitle>
              <CardDescription className="mt-1">
                {filteredAnnouncements.length}件のアナウンス
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>該当するアナウンスがありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ステータス</TableHead>
                    <TableHead>タイトル</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>優先度</TableHead>
                    <TableHead>対象</TableHead>
                    <TableHead>掲載期間</TableHead>
                    <TableHead>作成者</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      {/* ステータス */}
                      <TableCell>
                        {announcement.published ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            公開中
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            下書き
                          </Badge>
                        )}
                      </TableCell>

                      {/* タイトル */}
                      <TableCell>
                        <div className="font-medium max-w-xs truncate">
                          {announcement.title}
                        </div>
                        {announcement.requiresAction && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            対応必要
                          </Badge>
                        )}
                      </TableCell>

                      {/* タイプ */}
                      <TableCell>
                        <Badge className={typeColors[announcement.type]}>
                          {typeLabels[announcement.type]}
                        </Badge>
                      </TableCell>

                      {/* 優先度 */}
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[announcement.priority]}>
                          {priorityLabels[announcement.priority]}
                        </Badge>
                      </TableCell>

                      {/* 対象 */}
                      <TableCell>
                        <div className="text-sm">
                          {announcement.target === 'all' && '全員'}
                          {announcement.target === 'employee' && '一般社員'}
                          {announcement.target === 'manager' && 'マネージャー'}
                          {announcement.target === 'hr' && '人事'}
                          {announcement.target === 'executive' && '経営者'}
                          {announcement.target === 'custom' && 'カスタム'}
                        </div>
                      </TableCell>

                      {/* 掲載期間 */}
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>{formatDate(announcement.startDate)}～</div>
                          {announcement.endDate && <div>{formatDate(announcement.endDate)}</div>}
                        </div>
                      </TableCell>

                      {/* 作成者 */}
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {announcement.createdByName}
                        </div>
                      </TableCell>

                      {/* 操作 */}
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleTogglePublish(announcement.id, announcement.published)
                            }
                            title={announcement.published ? '非公開にする' : '公開する'}
                          >
                            {announcement.published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="編集"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(announcement.id)}
                            title="削除"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 作成ダイアログ */}
      <CreateAnnouncementDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
