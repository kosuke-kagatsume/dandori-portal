'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ColumnDef } from '@tanstack/react-table';
import { useLeaveManagementStore, LeaveType, LeaveRequest } from '@/lib/store/leave-management-store';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OptimizedDataTable } from '@/components/ui/common/optimized-data-table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { exportLeaveToCSV } from '@/lib/csv/csv-export';

// ダイアログの遅延読み込み
const LeaveRequestDialog = dynamic(() => import('@/features/leave/leave-request-dialog').then(mod => ({ default: mod.LeaveRequestDialog })), { ssr: false });

export default function LeavePage() {
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': '休暇管理',
      'remainingDays': '残り日数',
      'usedDays': '使用日数',
      'pendingRequests': '承認待ち',
      'expiringDays': '失効予定',
      'requestList': '申請一覧',
      'balanceManagement': '残日数管理',
      'pendingApprovals': '承認待ち申請',
    };
    return translations[key] || key;
  };

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');

  // Zustand ストアから状態と関数を取得
  const {
    requests,
    getUserRequests,
    getPendingRequests,
    getLeaveBalance,
    initializeLeaveBalance,
    deleteRequest,
    cancelLeaveRequest,
  } = useLeaveManagementStore();

  const currentUserId = '1'; // 現在のユーザー（田中太郎）
  const currentYear = new Date().getFullYear();

  // 初期化：サンプルデータの作成
  useEffect(() => {
    setLoading(true);

    // 休暇残数の初期化（まだ初期化されていない場合）
    const balance = getLeaveBalance(currentUserId, currentYear);
    if (!balance) {
      initializeLeaveBalance(currentUserId, currentYear, 20);
    }

    // サンプルデータの追加（ストアが空の場合）
    if (requests.length === 0) {
      const { createLeaveRequest } = useLeaveManagementStore.getState();

      // サンプルデータ
      const sampleRequests = [
        {
          userId: '1',
          userName: '田中太郎',
          type: 'paid' as LeaveType,
          startDate: '2025-01-20',
          endDate: '2025-01-22',
          days: 3,
          reason: '家族旅行のため',
          status: 'approved' as const,
          approver: '山田部長',
          approvedDate: '2025-01-15',
        },
        {
          userId: '1',
          userName: '田中太郎',
          type: 'sick' as LeaveType,
          startDate: '2025-01-10',
          endDate: '2025-01-10',
          days: 1,
          reason: '体調不良',
          status: 'approved' as const,
          approver: '山田部長',
          approvedDate: '2025-01-11',
        },
        {
          userId: '1',
          userName: '田中太郎',
          type: 'paid' as LeaveType,
          startDate: '2025-02-05',
          endDate: '2025-02-07',
          days: 3,
          reason: '私用',
          status: 'pending' as const,
        },
        {
          userId: '1',
          userName: '田中太郎',
          type: 'paid' as LeaveType,
          startDate: '2024-12-28',
          endDate: '2025-01-03',
          days: 5,
          reason: '年末年始休暇',
          status: 'approved' as const,
          approver: '山田部長',
          approvedDate: '2024-12-20',
        },
      ];

      sampleRequests.forEach(req => createLeaveRequest(req));
    }

    setLoading(false);
  }, []);

  // ユーザーリクエストと休暇残数のメモ化
  const userRequests = useMemo(() => getUserRequests(currentUserId), [getUserRequests, currentUserId]);
  const balance = useMemo(() => getLeaveBalance(currentUserId, currentYear), [getLeaveBalance, currentUserId, currentYear]);

  const handleCreateRequest = async (data: any) => {
    try {
      const { createLeaveRequest } = useLeaveManagementStore.getState();

      createLeaveRequest({
        userId: currentUserId,
        userName: '田中太郎', // TODO: 実際のユーザー名を取得
        type: data.type || 'paid',
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        reason: data.reason,
        status: 'pending',
      });

      toast.success('休暇申請を作成しました');
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('休暇申請の作成に失敗しました');
      throw error;
    }
  };

  const handleCancelRequest = (id: string) => {
    try {
      cancelLeaveRequest(id);
      toast.success('休暇申請をキャンセルしました');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error('キャンセルに失敗しました');
    }
  };

  const handleDeleteRequest = (id: string) => {
    try {
      deleteRequest(id);
      toast.success('休暇申請を削除しました');
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleExportCSV = () => {
    try {
      const result = exportLeaveToCSV(userRequests);
      if (result.success) {
        toast.success(`CSV出力完了: ${result.recordCount}件`);
      } else {
        toast.error(result.error || 'CSV出力に失敗しました');
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('CSV出力に失敗しました');
    }
  };

  const handleExportPDF = async () => {
    try {
      // PDFライブラリを遅延読み込み（初回クリック時のみロード）
      const { downloadLeavePDF } = await import('@/lib/pdf/leave-pdf');
      await downloadLeavePDF(userRequests);
      toast.success('PDF出力完了');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('PDF出力に失敗しました');
    }
  };

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

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: 'createdAt',
      header: '申請日',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="text-sm">
            {format(date, 'MM/dd', { locale: ja })}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: '種類',
      cell: ({ row }) => (
        <Badge variant="outline">
          {getTypeLabel(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: 'startDate',
      header: '期間',
      cell: ({ row }) => {
        const request = row.original;
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);

        return (
          <div className="text-sm">
            <div>{format(start, 'MM/dd', { locale: ja })} ～</div>
            <div>{format(end, 'MM/dd', { locale: ja })}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'days',
      header: '日数',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.days}日
        </div>
      ),
    },
    {
      accessorKey: 'reason',
      header: '理由',
      cell: ({ row }) => (
        <div className="max-w-32 truncate text-sm">
          {row.original.reason}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'approver',
      header: '承認者',
      cell: ({ row }) => {
        const approver = row.original.approver;
        return approver ? (
          <span className="text-sm">{approver}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const request = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                詳細表示
              </DropdownMenuItem>
              {request.status === 'pending' && (
                <>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => handleCancelRequest(request.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    キャンセル
                  </DropdownMenuItem>
                </>
              )}
              {(request.status === 'draft' || request.status === 'cancelled') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => handleDeleteRequest(request.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // 統計情報の計算（useMemoでメモ化）
  const stats = useMemo(() => ({
    remaining: balance?.paidLeave.remaining || 0,
    used: balance?.paidLeave.used || 0,
    total: balance?.paidLeave.total || 20,
    pending: userRequests.filter(r => r.status === 'pending').length,
    expiring: 0, // TODO: 有効期限から失効予定日数を計算
    thisYearUsed: userRequests.filter(r => {
      const year = new Date().getFullYear();
      return new Date(r.startDate).getFullYear() === year && r.status === 'approved';
    }).reduce((sum, r) => sum + r.days, 0),
  }), [balance, userRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            有給休暇の申請と管理を行います
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV出力
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF出力
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            有給申請
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('remainingDays')}</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.remaining}</div>
            <p className="text-xs text-muted-foreground">
              年度内有効
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('usedDays')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.used}</div>
            <p className="text-xs text-muted-foreground">
              今年度使用済み
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingRequests')}</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              承認待ち
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('expiringDays')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expiring}</div>
            <p className="text-xs text-muted-foreground">
              年度末失効予定
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>有給消化状況</CardTitle>
          <CardDescription>
            今年度の有給取得進捗
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>使用日数</span>
              <span>{stats.used} / {stats.total}日</span>
            </div>
            <Progress value={(stats.used / stats.total) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>推奨: 15日以上</span>
              <span>{stats.used >= 15 ? '✓ 達成' : `あと${15 - stats.used}日`}</span>
            </div>
          </div>

          {stats.expiring > 0 && (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    失効警告
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    年度末（3月31日）に{stats.expiring}日が失効します。早めの取得をお勧めします。
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('requestList')}
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('balanceManagement')}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('pendingApprovals')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <OptimizedDataTable
                columns={columns}
                data={userRequests}
                searchKey="reason"
                searchPlaceholder="理由で検索..."
                pageSize={15}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>年次有給休暇</CardTitle>
                <CardDescription>
                  基本的な有給休暇の残日数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>付与日数</span>
                    <span className="font-medium">{stats.total}日</span>
                  </div>
                  <div className="flex justify-between">
                    <span>使用済み</span>
                    <span className="font-medium">{stats.used}日</span>
                  </div>
                  <div className="flex justify-between">
                    <span>残日数</span>
                    <span className="font-medium text-green-600">{stats.remaining}日</span>
                  </div>
                </div>
                <Progress value={(stats.used / stats.total) * 100} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>その他の休暇</CardTitle>
                <CardDescription>
                  特別休暇・慶弔休暇など
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>病気休暇</span>
                  <div className="text-right">
                    <div className="font-medium">{balance?.sickLeave.remaining || 0}日</div>
                    <div className="text-xs text-muted-foreground">
                      {balance?.sickLeave.total || 0}日中
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>特別休暇</span>
                  <div className="text-right">
                    <div className="font-medium">{balance?.specialLeave.remaining || 0}日</div>
                    <div className="text-xs text-muted-foreground">
                      {balance?.specialLeave.total || 0}日中
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>代休</span>
                  <div className="text-right">
                    <div className="font-medium">{balance?.compensatoryLeave.remaining || 0}日</div>
                    <div className="text-xs text-muted-foreground">
                      {balance?.compensatoryLeave.total || 0}日中
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>承認待ち申請</CardTitle>
              <CardDescription>
                あなたが承認権限を持つ申請一覧
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">承認待ち申請はありません</h3>
                <p className="text-sm">
                  新しい申請が提出されると、こちらに表示されます
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Request Dialog */}
      <LeaveRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateRequest}
      />
    </div>
  );
}
