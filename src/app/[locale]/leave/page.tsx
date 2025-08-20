'use client';

import { useState, useEffect } from 'react';
// import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { generateLeaveData } from '@/lib/mock-data';
import { generateRealisticLeaveRequests, getLeaveBalances } from '@/lib/realistic-mock-data';
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
import { DataTable } from '@/components/ui/common/data-table';
import { LeaveRequestDialog } from '@/features/leave/leave-request-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface LeaveRequest {
  id: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submittedAt: string;
  approvedAt?: string;
  approver?: string;
  note?: string;
}

export default function LeavePage() {
  // const t = useTranslations('leave');
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
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');

  // Load leave requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await fetch('/api/leave-requests');
        const data = await response.json();
        
        // リアルな休暇申請データを取得
        const realisticRequests = generateRealisticLeaveRequests();
        
        // データをマッピング
        const mappedRequests: LeaveRequest[] = realisticRequests.map(req => ({
          id: req.id,
          type: req.leaveType === 'paid' ? 'annual' as const :
                req.leaveType === 'sick' ? 'sick' as const :
                req.leaveType === 'marriage' || req.leaveType === 'mourning' ? 'personal' as const :
                req.leaveType === 'maternity' ? 'maternity' as const :
                req.leaveType === 'childcare' ? 'paternity' as const :
                'personal' as const,
          startDate: req.startDate,
          endDate: req.endDate,
          days: req.days,
          reason: req.reason,
          status: req.status === 'draft' ? 'pending' as const :
                 req.status === 'pending' ? 'pending' as const :
                 req.status === 'approved' ? 'approved' as const :
                 req.status === 'rejected' ? 'rejected' as const :
                 'cancelled' as const,
          submittedAt: req.requestDate,
          approvedAt: req.approvalDate,
          approver: req.approver,
        }));
        
        setRequests(mappedRequests);
      } catch (error) {
        toast.error('Failed to load leave requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const handleCreateRequest = async (data: any) => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create request');
      
      const newRequest = await response.json();
      setRequests(prev => [newRequest, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const config = {
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

  const getTypeLabel = (type: LeaveRequest['type']) => {
    const labels = {
      annual: '年次有給',
      sick: '病気休暇',
      personal: '私用休暇',
      maternity: '産休',
      paternity: '育休',
      bereavement: '忌引',
    };
    return labels[type];
  };

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: 'submittedAt',
      header: '申請日',
      cell: ({ row }) => {
        const date = new Date(row.original.submittedAt);
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
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    キャンセル
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Calculate statistics from real data
  const leaveBalances = getLeaveBalances();
  const currentUserBalance = leaveBalances.find(b => b.userId === '1'); // 田中太郎のデータ
  
  const stats = {
    remaining: currentUserBalance?.paidLeave.remaining || 12,
    used: currentUserBalance?.paidLeave.used || 8,
    pending: requests.filter(r => r.status === 'pending').length,
    expiring: currentUserBalance?.paidLeave.expiring || 3,
    thisYearUsed: requests.filter(r => {
      const year = new Date().getFullYear();
      return new Date(r.startDate).getFullYear() === year && r.status === 'approved';
    }).reduce((sum, r) => sum + r.days, 0),
  };

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
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          有給申請
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
              <span>{stats.used} / 20日</span>
            </div>
            <Progress value={(stats.used / 20) * 100} className="h-2" />
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
              <DataTable
                columns={columns}
                data={requests}
                searchKey="reason"
                searchPlaceholder="理由で検索..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
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
                    <span className="font-medium">20日</span>
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
                <Progress value={(stats.used / 20) * 100} />
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
                  <Badge variant="secondary">無制限</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>忌引休暇</span>
                  <Badge variant="secondary">規定による</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>産前産後休暇</span>
                  <Badge variant="secondary">法定</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>育児休業</span>
                  <Badge variant="secondary">法定</Badge>
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