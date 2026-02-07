'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Plus,
  UserPlus,
  UserX,
  ArrowRightLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useScheduledChangesStore,
  changeTypeLabels,
  changeStatusLabels,
  changeTypeColors,
  approvalStatusLabels,
  type ScheduledChange,
  type ScheduledChangeType,
  type HireDetails,
  type TransferDetails,
  type RetirementDetails,
  type ApprovalStatus,
} from '@/lib/store/scheduled-changes-store';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateScheduledChangeDialog } from '@/features/scheduled-changes/create-scheduled-change-dialog';
import { EditScheduledChangeDialog } from '@/features/scheduled-changes/edit-scheduled-change-dialog';
import { CsvImportDialog } from '@/features/scheduled-changes/csv-import-dialog';
import { exportScheduledChangesToCSV } from '@/lib/csv/scheduled-changes-csv';

export default function ScheduledChangesPage() {
  const {
    changes,
    isLoading,
    error,
    _hasHydrated,
    fetchChanges,
    cancelScheduledChange,
    applyScheduledChange,
    deleteScheduledChange,
    getStats,
  } = useScheduledChangesStore();

  // ページマウント時にAPIからデータを取得
  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'applied' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<ScheduledChangeType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<ScheduledChange | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 統計を取得
  const stats = useMemo(() => getStats(), [changes, getStats]);

  // フィルタリングされた予約一覧
  const filteredChanges = useMemo(() => {
    let filtered = [...changes];

    // ステータスでフィルタ
    if (activeTab !== 'all') {
      filtered = filtered.filter((change) => change.status === activeTab);
    }

    // タイプでフィルタ
    if (typeFilter !== 'all') {
      filtered = filtered.filter((change) => change.type === typeFilter);
    }

    // 検索フィルタ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((change) => {
        // ユーザー名で検索
        if (change.userName?.toLowerCase().includes(query)) return true;
        // 作成者名で検索
        if (change.createdByName.toLowerCase().includes(query)) return true;
        // 入社の場合は氏名・部門・役職で検索
        if (change.type === 'hire') {
          const details = change.details as HireDetails;
          if (details.name.toLowerCase().includes(query)) return true;
          if (details.department.toLowerCase().includes(query)) return true;
          if (details.position.toLowerCase().includes(query)) return true;
        }
        // 異動の場合は部門で検索
        if (change.type === 'transfer') {
          const details = change.details as TransferDetails;
          if (details.currentDepartment.toLowerCase().includes(query)) return true;
          if (details.newDepartment.toLowerCase().includes(query)) return true;
        }
        return false;
      });
    }

    // 有効日でソート（昇順）
    filtered.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

    return filtered;
  }, [changes, activeTab, typeFilter, searchQuery]);

  // タイプ別のアイコンを取得
  const getTypeIcon = (type: ScheduledChangeType) => {
    switch (type) {
      case 'hire':
        return <UserPlus className="h-5 w-5" />;
      case 'transfer':
        return <ArrowRightLeft className="h-5 w-5" />;
      case 'retirement':
        return <UserX className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // 詳細情報を表示
  const renderDetails = (change: ScheduledChange) => {
    switch (change.type) {
      case 'hire': {
        const hireDetails = change.details as HireDetails;
        return (
          <div className="text-sm">
            <p className="font-medium">{hireDetails.name}</p>
            <p className="text-muted-foreground">
              {hireDetails.department} - {hireDetails.position}
            </p>
          </div>
        );
      }
      case 'transfer': {
        const transferDetails = change.details as TransferDetails;
        return (
          <div className="text-sm">
            <p className="font-medium">{change.userName}</p>
            <p className="text-muted-foreground">
              {transferDetails.currentDepartment} → {transferDetails.newDepartment}
            </p>
            <p className="text-muted-foreground text-xs">
              {transferDetails.currentPosition} → {transferDetails.newPosition}
            </p>
          </div>
        );
      }
      case 'retirement': {
        const retirementDetails = change.details as RetirementDetails;
        return (
          <div className="text-sm">
            <p className="font-medium">{change.userName}</p>
            <p className="text-muted-foreground text-xs">
              理由: {retirementDetails.retirementReason}
            </p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  // 予約をキャンセル
  const handleCancel = async (change: ScheduledChange) => {
    const success = await cancelScheduledChange(change.id);
    if (success) {
      toast.success('予約をキャンセルしました');
    } else {
      toast.error('予約のキャンセルに失敗しました');
    }
  };

  // 予約を即座に適用
  const handleApply = async (change: ScheduledChange) => {
    const success = await applyScheduledChange(change.id);
    setApplyDialogOpen(false);
    if (success) {
      toast.success('予約を適用しました');
    } else {
      toast.error('予約の適用に失敗しました');
    }
  };

  // 予約を削除
  const handleDelete = async (change: ScheduledChange) => {
    const success = await deleteScheduledChange(change.id);
    setDeleteDialogOpen(false);
    if (success) {
      toast.success('予約を削除しました');
    } else {
      toast.error('予約の削除に失敗しました');
    }
  };

  // チェックボックス選択の切り替え
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 全選択の切り替え
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredChanges.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredChanges.map(c => c.id)));
    }
  };

  // 一括適用
  const handleBulkApply = async () => {
    const count = selectedIds.size;
    const results = await Promise.all(
      Array.from(selectedIds).map(id => applyScheduledChange(id))
    );
    const successCount = results.filter(Boolean).length;
    setSelectedIds(new Set());
    if (successCount === count) {
      toast.success(`${count}件の予約を適用しました`);
    } else {
      toast.warning(`${successCount}/${count}件の予約を適用しました`);
    }
  };

  // 一括キャンセル
  const handleBulkCancel = async () => {
    const count = selectedIds.size;
    const results = await Promise.all(
      Array.from(selectedIds).map(id => cancelScheduledChange(id))
    );
    const successCount = results.filter(Boolean).length;
    setSelectedIds(new Set());
    if (successCount === count) {
      toast.success(`${count}件の予約をキャンセルしました`);
    } else {
      toast.warning(`${successCount}/${count}件の予約をキャンセルしました`);
    }
  };

  // 一括削除
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    const results = await Promise.all(
      Array.from(selectedIds).map(id => deleteScheduledChange(id))
    );
    const successCount = results.filter(Boolean).length;
    setSelectedIds(new Set());
    if (successCount === count) {
      toast.success(`${count}件の予約を削除しました`);
    } else {
      toast.warning(`${successCount}/${count}件の予約を削除しました`);
    }
  };

  // CSV出力
  const handleExportCSV = () => {
    const result = exportScheduledChangesToCSV(filteredChanges);
    if (result.success) {
      toast.success(`${result.recordCount}件の予約をCSV出力しました`);
    } else {
      toast.error(result.error || 'CSV出力に失敗しました');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            予約管理
          </h1>
          <p className="text-muted-foreground mt-1">
            入社・異動・退職の予約を管理します
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCsvImportDialogOpen(true)} className="flex-1 sm:flex-none">
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">CSV</span>インポート
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">CSV</span>出力
            </Button>
          </div>
          <Button size="lg" onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-5 w-5 mr-2" />
            新規予約
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予約中</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">未適用の予約</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">適用済み</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.applied}</div>
            <p className="text-xs text-muted-foreground">適用完了</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">入社予約</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.hire}</div>
            <p className="text-xs text-muted-foreground">新規入社</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">異動予約</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.transfer}</div>
            <p className="text-xs text-muted-foreground">部門・役職変更</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">退職予約</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.retirement}</div>
            <p className="text-xs text-muted-foreground">退職予定</p>
          </CardContent>
        </Card>
      </div>

      {/* 検索・フィルターエリア */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* 検索ボックス */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="名前、部門、作成者で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* タイプフィルター */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ScheduledChangeType | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="予約タイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのタイプ</SelectItem>
                <SelectItem value="hire">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-green-600" />
                    入社
                  </span>
                </SelectItem>
                <SelectItem value="transfer">
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    異動
                  </span>
                </SelectItem>
                <SelectItem value="retirement">
                  <span className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-600" />
                    退職
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* タブとテーブル */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'pending' | 'applied' | 'cancelled')} className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="all">
            全て ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="pending">
            予約中 ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="applied">
            適用済み ({stats.applied})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            キャンセル ({stats.cancelled})
          </TabsTrigger>
        </TabsList>

        {/* 一括操作ツールバー */}
        {selectedIds.size > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">{selectedIds.size}件選択中</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  選択解除
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkCancel}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      一括キャンセル
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkApply}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      一括適用
                    </Button>
                  </>
                )}
                {(activeTab === 'applied' || activeTab === 'cancelled' || activeTab === 'all') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    一括削除
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {activeTab === 'all' && '全ての予約'}
                  {activeTab === 'pending' && '予約中の変更'}
                  {activeTab === 'applied' && '適用済みの変更'}
                  {activeTab === 'cancelled' && 'キャンセルされた変更'}
                </CardTitle>
                {filteredChanges.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.size === filteredChanges.length}
                      onCheckedChange={handleToggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">全選択</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && !_hasHydrated ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                  <p className="text-muted-foreground">読み込み中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <p className="text-red-500">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={() => fetchChanges()}>
                    再読み込み
                  </Button>
                </div>
              ) : filteredChanges.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">予約がありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredChanges.map((change) => (
                    <div
                      key={change.id}
                      className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 lg:items-center lg:flex-1">
                        {/* チェックボックス */}
                        <Checkbox
                          checked={selectedIds.has(change.id)}
                          onCheckedChange={() => handleToggleSelect(change.id)}
                          className="mt-1 lg:mt-0"
                        />
                        {/* 左側：有効日とタイプ */}
                        <div className="flex items-center gap-3 flex-1 lg:gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {format(new Date(change.effectiveDate), 'dd', { locale: ja })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(change.effectiveDate), 'MMM', { locale: ja })}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg ${changeTypeColors[change.type]}`}>
                          {getTypeIcon(change.type)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant="outline">{changeTypeLabels[change.type]}</Badge>
                            <Badge
                              variant={
                                change.status === 'pending'
                                  ? 'default'
                                  : change.status === 'applied'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {changeStatusLabels[change.status]}
                            </Badge>
                            {/* 承認ステータス表示 */}
                            {change.requiresApproval && change.approvalStatus && (
                              <Badge
                                variant="outline"
                                className={
                                  change.approvalStatus === 'approved'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : change.approvalStatus === 'rejected'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : change.approvalStatus === 'pending_approval'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    : ''
                                }
                              >
                                {change.approvalStatus === 'approved' && <ShieldCheck className="h-3 w-3 mr-1" />}
                                {change.approvalStatus === 'rejected' && <ShieldX className="h-3 w-3 mr-1" />}
                                {change.approvalStatus === 'pending_approval' && <ShieldAlert className="h-3 w-3 mr-1" />}
                                {approvalStatusLabels[change.approvalStatus as ApprovalStatus]}
                              </Badge>
                            )}
                          </div>
                          {renderDetails(change)}
                          <p className="text-xs text-muted-foreground mt-1">
                            作成者: {change.createdByName}
                            {change.approvedByName && (
                              <span className="ml-2">/ 承認者: {change.approvedByName}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      </div>
                      {/* 右側：アクション */}
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {change.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChange(change);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              編集
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancel(change)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              キャンセル
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedChange(change);
                                setApplyDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              即座に適用
                            </Button>
                          </>
                        )}
                        {(change.status === 'applied' || change.status === 'cancelled') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedChange(change);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>予約を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。予約の履歴が完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedChange && handleDelete(selectedChange)}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 即座に適用確認ダイアログ */}
      <AlertDialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>予約を即座に適用しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              有効日を待たずに、この変更を今すぐ適用します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedChange && handleApply(selectedChange)}
            >
              適用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 新規予約作成ダイアログ */}
      <CreateScheduledChangeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* 予約編集ダイアログ */}
      <EditScheduledChangeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        change={selectedChange}
      />

      {/* CSVインポートダイアログ */}
      <CsvImportDialog
        open={csvImportDialogOpen}
        onOpenChange={setCsvImportDialogOpen}
      />
    </div>
  );
}
