'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Scale,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  useLegalUpdatesStore,
  type LegalUpdate,
  type LegalUpdateCategory,
  type LegalUpdateStatus,
  categoryLabels,
  statusLabels,
  importanceLabels,
  categoryColors,
  importanceColors,
} from '@/lib/store/legal-updates-store';

export default function LegalUpdatesPage() {
  const t = useTranslations();
  const { updates, getStats } = useLegalUpdatesStore();
  const stats = getStats();

  // フィルター状態
  const [activeCategory, setActiveCategory] = useState<LegalUpdateCategory | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<LegalUpdateStatus | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUpdate, setSelectedUpdate] = useState<LegalUpdate | null>(null);

  // 年度リストの生成
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    updates.forEach((update) => {
      const year = new Date(update.effectiveDate).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [updates]);

  // フィルタリングされたデータ
  const filteredUpdates = useMemo(() => {
    let filtered = updates;

    // カテゴリフィルター
    if (activeCategory !== 'all') {
      filtered = filtered.filter((u) => u.category === activeCategory);
    }

    // ステータスフィルター
    if (activeStatus !== 'all') {
      filtered = filtered.filter((u) => u.status === activeStatus);
    }

    // 年度フィルター
    if (selectedYear !== 'all') {
      filtered = filtered.filter((u) => {
        const year = new Date(u.effectiveDate).getFullYear();
        return year === selectedYear;
      });
    }

    // 検索フィルター
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.title.toLowerCase().includes(lowerQuery) ||
          u.description.toLowerCase().includes(lowerQuery) ||
          u.lawName.toLowerCase().includes(lowerQuery) ||
          u.affectedAreas.some((area) => area.toLowerCase().includes(lowerQuery))
      );
    }

    // 施行日で降順ソート
    return filtered.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  }, [updates, activeCategory, activeStatus, selectedYear, searchQuery]);

  // ステータスアイコン
  const getStatusIcon = (status: LegalUpdateStatus) => {
    switch (status) {
      case 'applied':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'preparing':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="h-8 w-8" />
            法令・制度更新
          </h1>
          <p className="text-muted-foreground mt-2">
            人事・労務に関する法令変更や制度改正の履歴を管理します
          </p>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総更新数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}件</div>
            <p className="text-xs text-muted-foreground">
              全ての法令・制度更新
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">適用済み</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.applied}件</div>
            <p className="text-xs text-muted-foreground">
              システム適用済み
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予定・準備中</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byStatus.scheduled + stats.byStatus.preparing}件
            </div>
            <p className="text-xs text-muted-foreground">
              今後の対応予定
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">システム対応済み</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemUpdatedCount}件</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.systemUpdatedCount / stats.total) * 100) : 0}% の対応率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* フィルターエリア */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
          <CardDescription>カテゴリ、ステータス、年度、キーワードで絞り込み</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 検索 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="タイトル、法令名、影響範囲で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* ステータス・年度フィルター */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus('all')}
              >
                全て
              </Button>
              <Button
                variant={activeStatus === 'applied' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus('applied')}
                className="gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                適用済み
              </Button>
              <Button
                variant={activeStatus === 'scheduled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus('scheduled')}
                className="gap-1"
              >
                <Clock className="h-3 w-3" />
                予定
              </Button>
              <Button
                variant={activeStatus === 'preparing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus('preparing')}
                className="gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                準備中
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedYear === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedYear('all')}
              >
                全年度
              </Button>
              {availableYears.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}年
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリタブ */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as LegalUpdateCategory | 'all')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            全て ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs sm:text-sm">
            {categoryLabels.tax} ({stats.byCategory.tax})
          </TabsTrigger>
          <TabsTrigger value="labor" className="text-xs sm:text-sm">
            {categoryLabels.labor} ({stats.byCategory.labor})
          </TabsTrigger>
          <TabsTrigger value="social_insurance" className="text-xs sm:text-sm">
            {categoryLabels.social_insurance} ({stats.byCategory.social_insurance})
          </TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs sm:text-sm">
            {categoryLabels.payroll} ({stats.byCategory.payroll})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm">
            {categoryLabels.attendance} ({stats.byCategory.attendance})
          </TabsTrigger>
          <TabsTrigger value="safety" className="text-xs sm:text-sm">
            {categoryLabels.safety} ({stats.byCategory.safety})
          </TabsTrigger>
          <TabsTrigger value="other" className="text-xs sm:text-sm">
            {categoryLabels.other} ({stats.byCategory.other})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6 space-y-4">
          {filteredUpdates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">該当する更新情報がありません</p>
              </CardContent>
            </Card>
          ) : (
            filteredUpdates.map((update) => (
              <Card
                key={update.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedUpdate(update)}
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={categoryColors[update.category]}>
                          {categoryLabels[update.category]}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getStatusIcon(update.status)}
                          {statusLabels[update.status]}
                        </Badge>
                        <Badge className={importanceColors[update.importance]}>
                          {importanceLabels[update.importance]}
                        </Badge>
                        {update.systemUpdated && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            システム対応済み
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{update.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(update.effectiveDate)}
                    </div>
                  </div>
                  <CardDescription className="mt-2">{update.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 影響範囲 */}
                  <div>
                    <div className="text-sm font-medium mb-2">影響範囲</div>
                    <div className="flex flex-wrap gap-2">
                      {update.affectedAreas.map((area, index) => (
                        <Badge key={index} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 法令名 */}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">関連法令：</span>
                    <span className="font-medium">{update.lawName}</span>
                  </div>

                  {/* システム対応状況 */}
                  {update.systemUpdated && update.systemUpdateDetails && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-green-900 dark:text-green-100">
                          {update.systemUpdateDetails}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 参考URL */}
                  {update.referenceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(update.referenceUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      参考資料を開く
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* 詳細モーダル */}
      <Dialog open={!!selectedUpdate} onOpenChange={() => setSelectedUpdate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedUpdate && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={categoryColors[selectedUpdate.category]}>
                    {categoryLabels[selectedUpdate.category]}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {getStatusIcon(selectedUpdate.status)}
                    {statusLabels[selectedUpdate.status]}
                  </Badge>
                  <Badge className={importanceColors[selectedUpdate.importance]}>
                    {importanceLabels[selectedUpdate.importance]}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedUpdate.title}</DialogTitle>
                <DialogDescription className="text-base">
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    施行日: {formatDate(selectedUpdate.effectiveDate)}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* 概要 */}
                <div>
                  <h3 className="font-semibold mb-2">概要</h3>
                  <p className="text-sm text-muted-foreground">{selectedUpdate.description}</p>
                </div>

                {/* 変更内容 */}
                {(selectedUpdate.beforeContent || selectedUpdate.afterContent) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedUpdate.beforeContent && (
                      <div>
                        <h3 className="font-semibold mb-2">変更前</h3>
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 rounded-lg p-4">
                          <p className="text-sm whitespace-pre-wrap">{selectedUpdate.beforeContent}</p>
                        </div>
                      </div>
                    )}
                    {selectedUpdate.afterContent && (
                      <div>
                        <h3 className="font-semibold mb-2">変更後</h3>
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm whitespace-pre-wrap">{selectedUpdate.afterContent}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 影響範囲 */}
                <div>
                  <h3 className="font-semibold mb-2">影響範囲</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUpdate.affectedAreas.map((area, index) => (
                      <Badge key={index} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 関連法令 */}
                <div>
                  <h3 className="font-semibold mb-2">関連法令</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUpdate.lawName}</span>
                  </div>
                </div>

                {/* システム対応状況 */}
                <div>
                  <h3 className="font-semibold mb-2">システム対応状況</h3>
                  {selectedUpdate.systemUpdated ? (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-green-900 dark:text-green-100 mb-1">
                            対応済み
                          </div>
                          {selectedUpdate.systemUpdateDetails && (
                            <p className="text-sm text-green-800 dark:text-green-200">
                              {selectedUpdate.systemUpdateDetails}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-900 dark:text-yellow-100">
                          システム対応が必要です
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 参考資料 */}
                {selectedUpdate.referenceUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">参考資料</h3>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(selectedUpdate.referenceUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {selectedUpdate.referenceUrl}
                    </Button>
                  </div>
                )}

                {/* メタ情報 */}
                <div className="pt-4 border-t">
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <div>登録者: {selectedUpdate.createdBy}</div>
                    <div>登録日時: {new Date(selectedUpdate.createdAt).toLocaleString('ja-JP')}</div>
                    <div>更新日時: {new Date(selectedUpdate.updatedAt).toLocaleString('ja-JP')}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
