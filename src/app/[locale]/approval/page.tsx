'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useWorkflowStore, WorkflowRequest } from '@/lib/workflow-store';
import { useUserStore } from '@/lib/store/user-store';
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
  RotateCcw,
  Info,
  AlertTriangle,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedDataTable } from '@/components/ui/common/optimized-data-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [selectedFlow, setSelectedFlow] = useState<WorkflowRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const { currentUser } = useUserStore();
  const currentUserId = currentUser?.id || '1'; // 現在のユーザー

  const {
    requests,
    getPendingApprovals,
    getMyRequests,
    approveRequest,
    rejectRequest,
    initializeDemoData,
  } = useWorkflowStore();

  useEffect(() => {
    // デモデータの自動初期化
    if (requests.length === 0) {
      console.log('[ApprovalPage] No requests found, initializing demo data...');
      setTimeout(() => {
        initializeDemoData();
        console.log('[ApprovalPage] Demo data initialized');
      }, 100);
    }
    setLoading(false);
  }, [requests.length, initializeDemoData]);

  // 承認待ちのフロー
  const pendingApprovals = useMemo(() =>
    getPendingApprovals(currentUserId),
    [getPendingApprovals, currentUserId, requests]
  );

  // 自分が申請したフロー
  const myRequests = useMemo(() =>
    getMyRequests(currentUserId),
    [getMyRequests, currentUserId, requests]
  );

  // 全ての承認フロー（管理者向け）
  const allFlows = useMemo(() =>
    requests.filter(req => req.status !== 'draft'),
    [requests]
  );

  // 統計情報のメモ化
  const stats = useMemo(() => ({
    approvedCount: allFlows.filter(f => f.status === 'approved').length,
    completedCount: allFlows.filter(f => f.status === 'approved' || f.status === 'rejected').length,
  }), [allFlows]);

  const handleApproval = async () => {
    if (!selectedFlow) return;

    // 現在のステップを見つける
    const currentStep = selectedFlow.approvalSteps.find(
      step => step.approverId === currentUserId && step.status === 'pending'
    );

    if (!currentStep) {
      toast.error('承認権限がありません');
      return;
    }

    try {
      if (approvalAction === 'approve') {
        approveRequest(selectedFlow.id, currentStep.id, comment);
      } else {
        if (!comment) {
          toast.error('却下理由を入力してください');
          return;
        }
        rejectRequest(selectedFlow.id, currentStep.id, comment);
      }

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

  const handleReturn = async () => {
    if (!selectedFlow || !returnReason.trim()) {
      toast.error('差し戻し理由を入力してください');
      return;
    }

    try {
      // TODO: 差し戻し機能の実装
      toast.warning('差し戻し機能は現在開発中です');
      setShowReturnDialog(false);
      setSelectedFlow(null);
      setReturnReason('');
    } catch (error) {
      toast.error('処理に失敗しました');
    }
  };

  const openApprovalDialog = (flow: WorkflowRequest, action: 'approve' | 'reject') => {
    setSelectedFlow(flow);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const openReturnDialog = (flow: WorkflowRequest) => {
    setSelectedFlow(flow);
    setShowReturnDialog(true);
  };

  const handleEscalate = (flow: WorkflowRequest) => {
    try {
      // TODO: エスカレーション機能の実装
      toast.warning('エスカレーション機能は現在開発中です');
    } catch (error) {
      toast.error('エスカレーションに失敗しました');
    }
  };

  // 期限の状態を判定
  const getDeadlineStatus = (deadline: string | undefined) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      return { status: 'overdue', hours: Math.abs(hoursRemaining), color: 'text-red-600' };
    } else if (hoursRemaining < 6) {
      return { status: 'urgent', hours: hoursRemaining, color: 'text-orange-600' };
    } else if (hoursRemaining < 24) {
      return { status: 'soon', hours: hoursRemaining, color: 'text-yellow-600' };
    }
    return null;
  };

  const getStatusBadge = (status: WorkflowRequest['status']) => {
    const config = {
      draft: { label: '下書き', variant: 'outline' as const, icon: FileText },
      pending: { label: '承認待ち', variant: 'default' as const, icon: Clock },
      in_review: { label: '確認中', variant: 'default' as const, icon: Clock },
      partially_approved: { label: '一部承認', variant: 'default' as const, icon: Clock },
      approved: { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '却下', variant: 'destructive' as const, icon: XCircle },
      returned: { label: '差し戻し', variant: 'secondary' as const, icon: RotateCcw },
      cancelled: { label: 'キャンセル', variant: 'secondary' as const, icon: AlertCircle },
      completed: { label: '完了', variant: 'default' as const, icon: CheckCircle },
      escalated: { label: 'エスカレーション', variant: 'secondary' as const, icon: AlertCircle },
    };

    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getRequestTypeLabel = (type: WorkflowRequest['type']) => {
    const labels = {
      leave_request: '休暇申請',
      overtime_request: '残業申請',
      expense_claim: '経費申請',
      business_trip: '出張申請',
      purchase_request: '購買申請',
      document_approval: '書類承認',
      shift_change: 'シフト変更',
      remote_work: 'リモートワーク',
    };
    return labels[type] || '申請';
  };

  // 承認待ちテーブルの列定義
  const pendingColumns: ColumnDef<WorkflowRequest>[] = useMemo(() => [
    {
      accessorKey: 'submittedAt',
      header: '申請日',
      cell: ({ row }) => {
        const date = row.original.submittedAt ? new Date(row.original.submittedAt) : new Date(row.original.createdAt);
        return (
          <div className="text-sm">
            {format(date, 'MM/dd HH:mm', { locale: ja })}
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: '種別',
      cell: ({ row }) => (
        <Badge variant="outline">
          {getRequestTypeLabel(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: 'requesterName',
      header: '申請者',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.requesterName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: '優先度',
      cell: ({ row }) => {
        const priority = row.original.priority;
        const config = {
          low: { label: '低', variant: 'outline' as const, color: 'text-green-600' },
          normal: { label: '通常', variant: 'outline' as const, color: 'text-blue-600' },
          high: { label: '高', variant: 'destructive' as const, color: 'text-orange-600' },
          urgent: { label: '緊急', variant: 'destructive' as const, color: 'text-red-600' },
        };
        const { label, variant } = config[priority];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: 'currentStep',
      header: '進捗',
      cell: ({ row }) => {
        const flow = row.original;
        const progress = calculateProgress(flow);
        const currentStep = flow.approvalSteps[flow.currentStep];
        const deadlineStatus = currentStep?.escalationDeadline ? getDeadlineStatus(currentStep.escalationDeadline) : null;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2 w-20" />
              <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
              {flow.appliedRules && flow.appliedRules.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-blue-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">条件分岐ルール適用</p>
                      {flow.appliedRules.map((rule, index) => (
                        <p key={index} className="text-xs">• {rule}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {deadlineStatus && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className={`h-4 w-4 ${deadlineStatus.color} cursor-help`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">
                        {deadlineStatus.status === 'overdue' && '期限超過'}
                        {deadlineStatus.status === 'urgent' && '緊急（6時間以内）'}
                        {deadlineStatus.status === 'soon' && '期限接近（24時間以内）'}
                      </p>
                      <p className="text-xs">
                        {deadlineStatus.status === 'overdue'
                          ? `${Math.floor(deadlineStatus.hours)}時間超過`
                          : `残り${Math.floor(deadlineStatus.hours)}時間`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {currentStep?.escalatedAt && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ArrowUp className="h-4 w-4 text-purple-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">エスカレーション済み</p>
                      <p className="text-xs">
                        {format(new Date(currentStep.escalatedAt), 'MM/dd HH:mm', { locale: ja })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {currentStep && (
              <p className="text-xs text-muted-foreground">
                ステップ {flow.currentStep + 1}: {currentStep.approverName}
                {currentStep.delegatedTo && (
                  <span className="text-purple-600 ml-1">(委任: {currentStep.delegatedTo.name})</span>
                )}
              </p>
            )}
            {deadlineStatus?.status === 'overdue' && flow.status === 'pending' && (
              <p className="text-xs text-red-600 font-medium">
                エスカレーション推奨
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
        const currentStep = flow.approvalSteps[flow.currentStep];
        const canApprove = currentStep &&
          currentStep.approverId === currentUserId &&
          currentStep.status === 'pending';
        const deadlineStatus = currentStep?.escalationDeadline ? getDeadlineStatus(currentStep.escalationDeadline) : null;
        const isOverdue = deadlineStatus?.status === 'overdue' && flow.status === 'pending';

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
            <Button
              size="sm"
              variant="secondary"
              className="h-8"
              onClick={() => openReturnDialog(flow)}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              差し戻し
            </Button>
            {isOverdue && !currentStep?.escalatedAt && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => handleEscalate(flow)}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                エスカレート
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => setSelectedFlow(flow)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {isOverdue && !currentStep?.escalatedAt && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => handleEscalate(flow)}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                エスカレート
              </Button>
            )}
          </div>
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
              {stats.approvedCount}
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
              {stats.completedCount}
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
                  searchKey="requesterName"
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
                              {getRequestTypeLabel(flow.type)}
                            </Badge>
                            {getStatusBadge(flow.status)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(flow.submittedAt || flow.createdAt), 'MM/dd HH:mm', { locale: ja })}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Progress value={calculateProgress(flow)} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>進捗: {calculateProgress(flow).toFixed(0)}%</span>
                            <span>
                              {flow.status === 'pending' || flow.status === 'partially_approved'
                                ? `ステップ ${flow.currentStep + 1}/${flow.approvalSteps.length}`
                                : flow.status === 'approved' ? '承認完了'
                                : flow.status === 'rejected' ? '却下'
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
                searchKey="requesterName"
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
                  <p>申請者: {selectedFlow.requesterName}</p>
                  <p>申請種別: {getRequestTypeLabel(selectedFlow.type)}</p>
                  <p>申請日: {format(new Date(selectedFlow.submittedAt || selectedFlow.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
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

      {/* Return to Sender Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請を差し戻す</DialogTitle>
            <DialogDescription>
              {selectedFlow && (
                <div className="space-y-2 text-left">
                  <p>申請者: {selectedFlow.requesterName}</p>
                  <p>申請種別: {getRequestTypeLabel(selectedFlow.type)}</p>
                  <p>申請日: {format(new Date(selectedFlow.submittedAt || selectedFlow.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    差し戻し理由を入力してください。申請者に修正依頼が送信されます。
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnReason">差し戻し理由 *</Label>
              <Textarea
                id="returnReason"
                placeholder="例：経費の領収書が添付されていません"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleReturn}
              variant="secondary"
              disabled={!returnReason.trim()}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              差し戻す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ヘルパー関数：進捗率を計算
function calculateProgress(request: WorkflowRequest): number {
  if (request.status === 'completed' || request.status === 'approved') return 100;
  if (request.status === 'rejected' || request.status === 'cancelled') return 0;

  const totalSteps = request.approvalSteps.length;
  const completedSteps = request.approvalSteps.filter(
    s => s.status === 'approved' || s.status === 'skipped'
  ).length;

  return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
}