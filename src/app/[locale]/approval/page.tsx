'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useApprovalStore } from '@/lib/approval-store';
import { ApprovalFlow, calculateProgress } from '@/lib/approval-system';
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  Filter,
  FileText,
  TrendingUp,
  Users,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedDataTable } from '@/components/ui/common/optimized-data-table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ApprovalPage() {
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  
  const currentUserId = '1'; // 現在のユーザー（田中太郎）
  
  const { 
    approvalFlows, 
    getPendingApprovals, 
    getUserRequests, 
    processApproval: processApprovalAction,
    getNotificationCount
  } = useApprovalStore();

  useEffect(() => {
    setLoading(false);
  }, []);

  // 承認待ちのフロー
  const pendingApprovals = useMemo(() => 
    getPendingApprovals(currentUserId), 
    [getPendingApprovals, currentUserId, approvalFlows]
  );

  // 自分が申請したフロー
  const myRequests = useMemo(() => 
    getUserRequests(currentUserId), 
    [getUserRequests, currentUserId, approvalFlows]
  );

  // 全ての承認フロー（管理者向け）
  const allFlows = useMemo(() => 
    approvalFlows.filter(flow => flow.overallStatus !== 'draft'),
    [approvalFlows]
  );

  const handleApproval = async () => {
    if (!selectedFlow) return;

    try {
      processApprovalAction(selectedFlow.id, currentUserId, approvalAction, comment);
      setShowApprovalDialog(false);
      setSelectedFlow(null);
      setComment('');
      
      toast.success(
        approvalAction === 'approve' ? '申請を承認しました' : '申請を却下しました',
        { description: '申請者に通知が送信されました' }
      );
    } catch (error) {
      toast.error('処理に失敗しました');
    }
  };

  const openApprovalDialog = (flow: ApprovalFlow, action: 'approve' | 'reject') => {
    setSelectedFlow(flow);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const getStatusBadge = (status: ApprovalFlow['overallStatus']) => {
    const config = {
      draft: { label: '下書き', variant: 'outline' as const, icon: FileText },
      pending: { label: '承認待ち', variant: 'default' as const, icon: Clock },
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

  const getRequestTypeLabel = (type: ApprovalFlow['requestType']) => {
    const labels = {
      leave: '休暇申請',
      overtime: '残業申請',
      expense: '経費申請',
      attendance_correction: '勤怠修正',
    };
    return labels[type];
  };

  // 承認待ちテーブルの列定義
  const pendingColumns: ColumnDef<ApprovalFlow>[] = useMemo(() => [
    {
      accessorKey: 'submittedAt',
      header: '申請日',
      cell: ({ row }) => {
        const date = new Date(row.original.submittedAt);
        return (
          <div className="text-sm">
            {format(date, 'MM/dd HH:mm', { locale: ja })}
          </div>
        );
      },
    },
    {
      accessorKey: 'requestType',
      header: '種別',
      cell: ({ row }) => (
        <Badge variant="outline">
          {getRequestTypeLabel(row.original.requestType)}
        </Badge>
      ),
    },
    {
      accessorKey: 'applicantName',
      header: '申請者',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.applicantName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'urgency',
      header: '緊急度',
      cell: ({ row }) => {
        const urgency = row.original.urgency;
        const config = {
          low: { label: '低', variant: 'outline' as const, color: 'text-green-600' },
          normal: { label: '中', variant: 'outline' as const, color: 'text-blue-600' },
          high: { label: '高', variant: 'destructive' as const, color: 'text-red-600' },
        };
        const { label, variant } = config[urgency];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'currentStep',
      header: '進捗',
      cell: ({ row }) => {
        const flow = row.original;
        const progress = calculateProgress(flow);
        const currentStep = flow.steps.find(s => s.stepNumber === flow.currentStep);
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 w-20" />
              <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
            </div>
            {currentStep && (
              <p className="text-xs text-muted-foreground">
                ステップ {currentStep.stepNumber}: {currentStep.approverName}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const flow = row.original;
        const canApprove = flow.steps.some(step => 
          step.stepNumber === flow.currentStep &&
          step.approverUserId === currentUserId &&
          step.status === 'pending'
        );
        
        return canApprove ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8"
              onClick={() => openApprovalDialog(flow, 'approve')}
            >
              承認
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => openApprovalDialog(flow, 'reject')}
            >
              却下
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => setSelectedFlow(flow)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ], [currentUserId]);

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
          <h1 className="text-3xl font-bold tracking-tight">承認管理</h1>
          <p className="text-muted-foreground">
            申請の承認・却下および進捗管理
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              あなたの承認が必要
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">自分の申請</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{myRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              提出した申請
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月承認済み</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allFlows.filter(f => f.overallStatus === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              承認完了
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">処理済み</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {allFlows.filter(f => f.overallStatus === 'approved' || f.overallStatus === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">
              全体の処理数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            承認待ち ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            自分の申請 ({myRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            全ての申請
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>承認待ち申請</CardTitle>
              <CardDescription>
                あなたの承認が必要な申請一覧
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length > 0 ? (
                <OptimizedDataTable
                  columns={pendingColumns}
                  data={pendingApprovals}
                  searchKey="applicantName"
                  searchPlaceholder="申請者名で検索..."
                  pageSize={10}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">承認待ち申請はありません</h3>
                  <p className="text-sm">
                    新しい申請が提出されると、こちらに表示されます
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>自分の申請履歴</CardTitle>
              <CardDescription>
                あなたが提出した申請の状況
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myRequests.length > 0 ? (
                <div className="space-y-4">
                  {myRequests.map((flow) => (
                    <Card key={flow.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              {getRequestTypeLabel(flow.requestType)}
                            </Badge>
                            {getStatusBadge(flow.overallStatus)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(flow.submittedAt), 'MM/dd HH:mm', { locale: ja })}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Progress value={calculateProgress(flow)} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>進捗: {calculateProgress(flow).toFixed(0)}%</span>
                            <span>
                              {flow.overallStatus === 'pending' 
                                ? `ステップ ${flow.currentStep}/${flow.steps.length}`
                                : flow.overallStatus === 'approved' ? '承認完了'
                                : flow.overallStatus === 'rejected' ? '却下'
                                : 'キャンセル'
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">申請履歴はありません</h3>
                  <p className="text-sm">
                    申請を提出すると、こちらに表示されます
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>全ての申請</CardTitle>
              <CardDescription>
                システム内の全申請（管理者向け）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptimizedDataTable
                columns={pendingColumns}
                data={allFlows}
                searchKey="applicantName"
                searchPlaceholder="申請者名で検索..."
                pageSize={15}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? '申請を承認' : '申請を却下'}
            </DialogTitle>
            <DialogDescription>
              {selectedFlow && (
                <div className="space-y-2 text-left">
                  <p>申請者: {selectedFlow.applicantName}</p>
                  <p>申請種別: {getRequestTypeLabel(selectedFlow.requestType)}</p>
                  <p>申請日: {format(new Date(selectedFlow.submittedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">コメント（任意）</Label>
              <Textarea
                id="comment"
                placeholder={
                  approvalAction === 'approve' 
                    ? '承認理由やコメントをご入力ください'
                    : '却下理由をご入力ください（推奨）'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleApproval}
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={approvalAction === 'reject' ? 'destructive' : 'default'}
            >
              {approvalAction === 'approve' ? '承認する' : '却下する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}