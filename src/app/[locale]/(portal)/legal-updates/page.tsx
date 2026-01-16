'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Scale,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  // TrendingUp, // 統計グラフで使用予定
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// カテゴリの定義
type LegalCategory = 'tax' | 'labor' | 'social_insurance' | 'payroll' | 'attendance' | 'safety' | 'other';

const categoryLabels: Record<LegalCategory, string> = {
  tax: '税務',
  labor: '労務',
  social_insurance: '社会保険',
  payroll: '給与',
  attendance: '勤怠',
  safety: '安全衛生',
  other: 'その他',
};

const categoryColors: Record<LegalCategory, string> = {
  tax: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  labor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  social_insurance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  payroll: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  attendance: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  safety: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

// 優先度の定義
type Priority = 'high' | 'medium' | 'low';

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

// テナントステータスの定義
type TenantStatus = 'pending' | 'in_progress' | 'completed';

const tenantStatusLabels: Record<TenantStatus, string> = {
  pending: '未対応',
  in_progress: '対応中',
  completed: '完了',
};

const tenantStatusColors: Record<TenantStatus, string> = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

// APIレスポンスの型
interface LegalUpdate {
  id: string;
  title: string;
  description: string | null;
  category: LegalCategory;
  effectiveDate: string;
  relatedLaws: string | null;
  affectedAreas: string[];
  priority: Priority;
  referenceUrl: string | null;
  publishedAt: string;
  tenantStatus: {
    status: TenantStatus;
    notes: string | null;
    completedAt: string | null;
    completedBy: string | null;
  };
}

interface ApiResponse {
  success: boolean;
  data: LegalUpdate[];
  stats?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

export default function LegalUpdatesPage() {
  // データ状態
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // フィルター状態
  const [activeCategory, setActiveCategory] = useState<LegalCategory | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<TenantStatus | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUpdate, setSelectedUpdate] = useState<LegalUpdate | null>(null);

  // ステータス更新用
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingStatus, setEditingStatus] = useState<TenantStatus>('pending');

  // データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (activeStatus !== 'all') params.append('status', activeStatus);
      if (selectedYear !== 'all') params.append('year', String(selectedYear));

      const response = await fetch(`/api/legal-updates?${params.toString()}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setUpdates(result.data);
        // statsが存在する場合のみ更新（undefinedの場合はデフォルト値を維持）
        if (result.stats) {
          setStats(result.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch legal updates:', error);
      toast.error('法令情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activeStatus, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 年度リストの生成
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    updates.forEach((update) => {
      const year = new Date(update.effectiveDate).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [updates]);

  // フィルタリングされたデータ（検索のみクライアントサイド）
  const filteredUpdates = useMemo(() => {
    let filtered = updates;

    // 検索フィルター
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.title.toLowerCase().includes(lowerQuery) ||
          (u.description && u.description.toLowerCase().includes(lowerQuery)) ||
          (u.relatedLaws && u.relatedLaws.toLowerCase().includes(lowerQuery)) ||
          u.affectedAreas.some((area) => area.toLowerCase().includes(lowerQuery))
      );
    }

    // 施行日で降順ソート
    return filtered.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  }, [updates, searchQuery]);

  // カテゴリ別の件数
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {
      all: updates.length,
      tax: 0,
      labor: 0,
      social_insurance: 0,
      payroll: 0,
      attendance: 0,
      safety: 0,
      other: 0,
    };
    updates.forEach((u) => {
      counts[u.category]++;
    });
    return counts;
  }, [updates]);

  // ステータスアイコン
  const getStatusIcon = (status: TenantStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
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

  // ステータス更新
  const handleUpdateStatus = async () => {
    if (!selectedUpdate) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/legal-updates/${selectedUpdate.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingStatus,
          notes: editingNotes,
          completedBy: editingStatus === 'completed' ? 'デモユーザー' : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('対応状況を更新しました');
        // データを再取得
        await fetchData();
        // モーダルを更新
        setSelectedUpdate((prev) =>
          prev
            ? {
                ...prev,
                tenantStatus: {
                  status: editingStatus,
                  notes: editingNotes,
                  completedAt: editingStatus === 'completed' ? new Date().toISOString() : null,
                  completedBy: editingStatus === 'completed' ? 'デモユーザー' : null,
                },
              }
            : null
        );
      } else {
        toast.error('更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('更新に失敗しました');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // モーダルを開く時に編集状態を初期化
  const openDetailModal = (update: LegalUpdate) => {
    setSelectedUpdate(update);
    setEditingStatus(update.tenantStatus.status);
    setEditingNotes(update.tenantStatus.notes || '');
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
            人事・労務に関する法令変更や制度改正の情報と対応状況を管理します
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          更新
        </Button>
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
              公開されている法令・制度更新
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">対応完了</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}件</div>
            <p className="text-xs text-muted-foreground">
              対応が完了した項目
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">対応中</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}件</div>
            <p className="text-xs text-muted-foreground">
              現在対応を進めている項目
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未対応</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}件</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round(((stats.total - stats.pending) / stats.total) * 100) : 0}% の対応率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* フィルターエリア */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
          <CardDescription>カテゴリ、対応状況、年度、キーワードで絞り込み</CardDescription>
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
                variant={activeStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus('pending')}
                className="gap-1"
              >
                <AlertCircle className="h-3 w-3" />
                未対応
              </Button>
              <Button
                variant={activeStatus === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus('in_progress')}
                className="gap-1"
              >
                <Clock className="h-3 w-3" />
                対応中
              </Button>
              <Button
                variant={activeStatus === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveStatus('completed')}
                className="gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                完了
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
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as LegalCategory | 'all')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            全て ({categoryStats.all})
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs sm:text-sm">
            {categoryLabels.tax} ({categoryStats.tax})
          </TabsTrigger>
          <TabsTrigger value="labor" className="text-xs sm:text-sm">
            {categoryLabels.labor} ({categoryStats.labor})
          </TabsTrigger>
          <TabsTrigger value="social_insurance" className="text-xs sm:text-sm">
            {categoryLabels.social_insurance} ({categoryStats.social_insurance})
          </TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs sm:text-sm">
            {categoryLabels.payroll} ({categoryStats.payroll})
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm">
            {categoryLabels.attendance} ({categoryStats.attendance})
          </TabsTrigger>
          <TabsTrigger value="safety" className="text-xs sm:text-sm">
            {categoryLabels.safety} ({categoryStats.safety})
          </TabsTrigger>
          <TabsTrigger value="other" className="text-xs sm:text-sm">
            {categoryLabels.other} ({categoryStats.other})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6 space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                <p className="text-muted-foreground">読み込み中...</p>
              </CardContent>
            </Card>
          ) : filteredUpdates.length === 0 ? (
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
                onClick={() => openDetailModal(update)}
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={categoryColors[update.category]}>
                          {categoryLabels[update.category]}
                        </Badge>
                        <Badge variant="outline" className={`gap-1 ${tenantStatusColors[update.tenantStatus.status]}`}>
                          {getStatusIcon(update.tenantStatus.status)}
                          {tenantStatusLabels[update.tenantStatus.status]}
                        </Badge>
                        <Badge className={priorityColors[update.priority]}>
                          優先度: {priorityLabels[update.priority]}
                        </Badge>
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
                  {update.affectedAreas.length > 0 && (
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
                  )}

                  {/* 法令名 */}
                  {update.relatedLaws && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">関連法令：</span>
                      <span className="font-medium">{update.relatedLaws}</span>
                    </div>
                  )}

                  {/* 対応状況メモ */}
                  {update.tenantStatus.notes && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">対応メモ: </span>
                        {update.tenantStatus.notes}
                      </div>
                    </div>
                  )}

                  {/* 完了情報 */}
                  {update.tenantStatus.status === 'completed' && update.tenantStatus.completedAt && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-green-900 dark:text-green-100">
                          {formatDate(update.tenantStatus.completedAt)} に完了
                          {update.tenantStatus.completedBy && ` (${update.tenantStatus.completedBy})`}
                        </div>
                      </div>
                    </div>
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
                  <Badge className={priorityColors[selectedUpdate.priority]}>
                    優先度: {priorityLabels[selectedUpdate.priority]}
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
                {selectedUpdate.description && (
                  <div>
                    <h3 className="font-semibold mb-2">概要</h3>
                    <p className="text-sm text-muted-foreground">{selectedUpdate.description}</p>
                  </div>
                )}

                {/* 影響範囲 */}
                {selectedUpdate.affectedAreas.length > 0 && (
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
                )}

                {/* 関連法令 */}
                {selectedUpdate.relatedLaws && (
                  <div>
                    <h3 className="font-semibold mb-2">関連法令</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUpdate.relatedLaws}</span>
                    </div>
                  </div>
                )}

                {/* 参考資料 */}
                {selectedUpdate.referenceUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">参考資料</h3>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(selectedUpdate.referenceUrl!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      参考資料を開く
                    </Button>
                  </div>
                )}

                {/* 対応状況更新 */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">自社の対応状況</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">ステータス</label>
                      <Select value={editingStatus} onValueChange={(v) => setEditingStatus(v as TenantStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-gray-600" />
                              未対応
                            </div>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              対応中
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              完了
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">対応メモ</label>
                      <Textarea
                        placeholder="対応内容や備忘録を記入..."
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleUpdateStatus}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          更新中...
                        </>
                      ) : (
                        '対応状況を更新'
                      )}
                    </Button>
                  </div>
                </div>

                {/* 完了情報 */}
                {selectedUpdate.tenantStatus.status === 'completed' && selectedUpdate.tenantStatus.completedAt && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-green-900 dark:text-green-100 mb-1">
                          対応完了
                        </div>
                        <div className="text-sm text-green-800 dark:text-green-200">
                          {formatDate(selectedUpdate.tenantStatus.completedAt)}
                          {selectedUpdate.tenantStatus.completedBy && ` - ${selectedUpdate.tenantStatus.completedBy}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* メタ情報 */}
                <div className="pt-4 border-t">
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <div>公開日: {formatDate(selectedUpdate.publishedAt)}</div>
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
