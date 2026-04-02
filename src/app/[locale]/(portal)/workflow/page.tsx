'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWorkflowStore, type WorkflowRequest, type WorkflowType } from '@/lib/workflow-store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { useUserStore } from '@/lib/store/user-store';
import { useIsMounted } from '@/hooks/useIsMounted';
import {
  FileText, Clock, CheckCircle, Users, Calendar, DollarSign,
  Package, Briefcase, Plus, Search, User, UserCheck, ClipboardList,
  Timer, Home, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { BulkApprovalBar } from '@/features/workflow/bulk-approval-bar';
import { WorkflowCard, EmptyState } from '@/features/workflow/workflow-card';
import { ApprovalDialog, DelegateDialog, DetailDialog } from '@/features/workflow/workflow-dialogs';
import { getWorkflowTypeLabel } from '@/lib/workflow/workflow-helpers';

const DelegateSettingsDialog = dynamic(() => import('@/features/workflow/delegate-settings-dialog').then(mod => ({ default: mod.DelegateSettingsDialog })), { ssr: false });
const NewRequestForm = dynamic(() => import('@/features/workflow/new-request-form').then(mod => ({ default: mod.NewRequestForm })), { ssr: false });

export default function WorkflowPage() {
  const isMounted = useIsMounted();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [showDelegateSettings, setShowDelegateSettings] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<WorkflowType | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<WorkflowRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDelegateDialog, setShowDelegateDialog] = useState(false);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showNewRequestFormDialog, setShowNewRequestFormDialog] = useState(false);
  const [showChangeRequestDialog, setShowChangeRequestDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegateReason, setDelegateReason] = useState('');

  const { currentUser } = useUserStore();
  const { addNotification } = useNotificationStore();
  const currentUserId = currentUser?.id || '1';

  const {
    requests, fetchRequests, createRequest, submitRequest,
    getMyRequests, getPendingApprovals, getDelegatedApprovals,
    approveRequest, rejectRequest, delegateApproval, getStatistics,
  } = useWorkflowStore();

  useEffect(() => {
    useWorkflowStore.persist.rehydrate();
    fetchRequests();
  }, [fetchRequests]);

  const pendingApprovals = useMemo(() => getPendingApprovals(currentUserId), [getPendingApprovals, currentUserId, requests]);
  const myRequests = useMemo(() => getMyRequests(currentUserId), [getMyRequests, currentUserId, requests]);
  const delegatedApprovals = useMemo(() => getDelegatedApprovals(currentUserId), [getDelegatedApprovals, currentUserId, requests]);
  const stats = useMemo(() => getStatistics(currentUserId), [getStatistics, currentUserId, requests]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      useWorkflowStore.getState().checkAndEscalate();
    }, 60000);
    return () => clearInterval(checkInterval);
  }, []);

  // ── ハンドラー ──────────────────────────────────────────

  const handleApproval = async () => {
    if (!selectedRequest) return;
    const currentStep = selectedRequest.approvalSteps.find(
      s => s.status === 'pending' && s.approverId === currentUserId
    );
    if (!currentStep) { toast.error('承認権限がありません'); return; }

    try {
      if (approvalAction === 'approve') {
        approveRequest(selectedRequest.id, currentStep.id, comment);
        addNotification({
          id: `notif-${Date.now()}`, title: '申請が承認されました',
          message: `${currentUser?.name}があなたの${getWorkflowTypeLabel(selectedRequest.type)}を承認しました`,
          type: 'success', timestamp: new Date().toISOString(), read: false, important: false,
          userId: selectedRequest.requesterId,
        });
        toast.success('申請を承認しました', { description: '申請者に通知が送信されました' });
      } else {
        rejectRequest(selectedRequest.id, currentStep.id, comment);
        addNotification({
          id: `notif-${Date.now()}`, title: '申請が却下されました',
          message: `${currentUser?.name}があなたの${getWorkflowTypeLabel(selectedRequest.type)}を却下しました: ${comment}`,
          type: 'error', timestamp: new Date().toISOString(), read: false, important: true,
          userId: selectedRequest.requesterId,
        });
        toast.success('申請を却下しました');
      }
      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setComment('');
    } catch {
      toast.error('処理に失敗しました');
    }
  };

  const handleDelegate = () => {
    if (!selectedRequest || !delegateUserId || !delegateReason) {
      toast.error('必要な情報を入力してください'); return;
    }
    const currentStep = selectedRequest.approvalSteps.find(
      s => s.status === 'pending' && s.approverId === currentUserId
    );
    if (!currentStep) { toast.error('承認権限がありません'); return; }

    delegateApproval(selectedRequest.id, currentStep.id, delegateUserId, '代理承認者', delegateReason);
    addNotification({
      id: `notif-${Date.now()}`, title: '承認が委任されました',
      message: `${currentUser?.name}から${getWorkflowTypeLabel(selectedRequest.type)}の承認が委任されました`,
      type: 'info', timestamp: new Date().toISOString(), read: false, important: false,
      userId: delegateUserId,
    });
    toast.success('承認を委任しました');
    setShowDelegateDialog(false);
    setDelegateUserId('');
    setDelegateReason('');
    setSelectedRequest(null);
  };

  const handleNewRequestSubmit = async (data: Partial<WorkflowRequest>) => {
    const requestId = await createRequest(data as Omit<WorkflowRequest, 'id' | 'createdAt' | 'updatedAt'>);
    submitRequest(requestId as string);
    setShowNewRequestDialog(false);
    setSelectedRequestType(null);
  };

  const handleNewRequest = (type: WorkflowType) => {
    setSelectedRequestType(type);
    setShowNewRequestDialog(false);
    setShowNewRequestFormDialog(true);
  };

  const openApprovalDialog = (request: WorkflowRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request); setApprovalAction(action); setShowApprovalDialog(true);
  };
  const openDetailDialog = (request: WorkflowRequest) => {
    setSelectedRequest(request); setShowDetailDialog(true);
  };
  const openDelegateDialog = (request: WorkflowRequest) => {
    setSelectedRequest(request); setShowDelegateDialog(true);
  };

  // ── フィルタリング ──────────────────────────────────────────

  const filterRequests = (reqs: WorkflowRequest[]) => {
    return reqs.filter(req => {
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterType !== 'all' && req.type !== filterType) return false;
      if (searchQuery && !req.requesterName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  const filteredPendingApprovals = useMemo(() => filterRequests(pendingApprovals), [pendingApprovals, filterType, filterStatus, searchQuery]);
  const filteredMyRequests = useMemo(() => filterRequests(myRequests), [myRequests, filterType, filterStatus, searchQuery]);
  const filteredDelegatedApprovals = useMemo(() => filterRequests(delegatedApprovals), [delegatedApprovals, filterType, filterStatus, searchQuery]);

  // ══════════════════════════════════════════════════════════════
  // レンダリング
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ワークフロー</h1>
          <p className="text-muted-foreground">申請の作成・承認・進捗管理を行います</p>
        </div>
        <Button onClick={() => setShowNewRequestDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />新規申請
        </Button>
      </div>

      {/* 統計カード */}
      {isMounted && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {([
            { label: '承認待ち', value: pendingApprovals.length, icon: Clock, color: 'text-orange-600', sub: '要対応' },
            { label: '代理承認', value: delegatedApprovals.length, icon: UserCheck, color: 'text-purple-600', sub: '委任済み' },
            { label: '申請中', value: stats.pendingRequests, icon: User, color: 'text-blue-600', sub: '処理中' },
            { label: '承認済み', value: stats.approvedRequests, icon: CheckCircle, color: 'text-green-600', sub: '完了' },
            { label: '平均処理時間', value: stats.averageApprovalTime.toFixed(1), icon: Timer, color: 'text-indigo-600', sub: '日' },
          ] as const).map(({ label, value, icon: Icon, color, sub }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="申請者名で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="ステータス" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="pending">申請中</SelectItem>
            <SelectItem value="partially_approved">一部承認</SelectItem>
            <SelectItem value="approved">承認済み</SelectItem>
            <SelectItem value="rejected">却下</SelectItem>
            <SelectItem value="escalated">エスカレーション</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="種類" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="leave_request">休暇申請</SelectItem>
            <SelectItem value="expense_claim">経費申請</SelectItem>
            <SelectItem value="overtime_request">残業申請</SelectItem>
            <SelectItem value="business_trip">出張申請</SelectItem>
            <SelectItem value="remote_work">リモートワーク</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* タブコンテンツ */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />承認待ち ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="delegated" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />代理承認 ({delegatedApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <User className="h-4 w-4" />自分の申請 ({myRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredPendingApprovals.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRequestIds.length === filteredPendingApprovals.length && filteredPendingApprovals.length > 0}
                  onCheckedChange={(checked) => {
                    setSelectedRequestIds(checked ? filteredPendingApprovals.map(r => r.id) : []);
                  }}
                />
                <span className="text-sm text-muted-foreground">すべて選択</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowDelegateSettings(true)}>
                <UserCheck className="h-4 w-4 mr-1" />代理承認者設定
              </Button>
            </div>
          )}
          {filteredPendingApprovals.length > 0 ? (
            <div className="grid gap-4">
              {filteredPendingApprovals.map((request) => (
                <WorkflowCard
                  key={request.id} request={request} currentUserId={currentUserId}
                  onApprove={() => openApprovalDialog(request, 'approve')}
                  onReject={() => openApprovalDialog(request, 'reject')}
                  onDelegate={() => openDelegateDialog(request)}
                  onDetail={() => openDetailDialog(request)}
                  showCheckbox isSelected={selectedRequestIds.includes(request.id)}
                  onSelectChange={(checked) => {
                    setSelectedRequestIds(checked
                      ? [...selectedRequestIds, request.id]
                      : selectedRequestIds.filter(id => id !== request.id));
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle} title="承認待ち申請はありません" description="新しい申請が提出されると、こちらに表示されます" />
          )}
        </TabsContent>

        <TabsContent value="delegated" className="space-y-4">
          {filteredDelegatedApprovals.length > 0 ? (
            <div className="grid gap-4">
              {filteredDelegatedApprovals.map((request) => (
                <WorkflowCard
                  key={request.id} request={request} currentUserId={currentUserId}
                  onApprove={() => openApprovalDialog(request, 'approve')}
                  onReject={() => openApprovalDialog(request, 'reject')}
                  onDetail={() => openDetailDialog(request)} isDelegated
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={UserCheck} title="代理承認はありません" description="承認が委任されると、こちらに表示されます" />
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {filteredMyRequests.length > 0 ? (
            <div className="grid gap-4">
              {filteredMyRequests.map((request) => (
                <WorkflowCard
                  key={request.id} request={request} currentUserId={currentUserId}
                  onDetail={() => openDetailDialog(request)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="申請履歴はありません" description="新規申請を作成すると、こちらに表示されます" />
          )}
        </TabsContent>
      </Tabs>

      {/* 新規申請ダイアログ */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新規申請を作成</DialogTitle>
            <DialogDescription>作成する申請の種類を選択してください</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {([
              { type: 'leave_request' as WorkflowType, icon: Calendar, label: '休暇申請', color: 'text-blue-600' },
              { type: 'expense_claim' as WorkflowType, icon: DollarSign, label: '経費申請', color: 'text-green-600' },
              { type: 'overtime_request' as WorkflowType, icon: Clock, label: '残業申請', color: 'text-orange-600' },
              { type: 'business_trip' as WorkflowType, icon: Briefcase, label: '出張申請', color: 'text-purple-600' },
              { type: 'remote_work' as WorkflowType, icon: Home, label: 'リモートワーク', color: 'text-indigo-600' },
              { type: 'purchase_request' as WorkflowType, icon: Package, label: '購買申請', color: 'text-pink-600' },
            ]).map(({ type, icon: Icon, label, color }) => (
              <Button key={type} variant="outline" className="h-24 flex-col gap-2" onClick={() => handleNewRequest(type)}>
                <Icon className={`h-8 w-8 ${color}`} /><span>{label}</span>
              </Button>
            ))}
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => { setShowNewRequestDialog(false); setShowChangeRequestDialog(true); }}>
              <ClipboardList className="h-8 w-8 text-teal-600" /><span>各種変更</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 各種変更選択ダイアログ */}
      <Dialog open={showChangeRequestDialog} onOpenChange={setShowChangeRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>変更申請の種類を選択</DialogTitle>
            <DialogDescription>変更する項目を選択してください</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            {([
              { type: 'bank_account_change' as WorkflowType, icon: Building2, label: '給与振込口座変更', color: 'text-blue-600' },
              { type: 'family_info_change' as WorkflowType, icon: Users, label: '家族情報変更', color: 'text-green-600' },
              { type: 'commute_route_change' as WorkflowType, icon: UserCheck, label: '通勤経路変更', color: 'text-orange-600' },
            ]).map(({ type, icon: Icon, label, color }) => (
              <Button key={type} variant="outline" className="h-24 flex-col gap-2" onClick={() => { setShowChangeRequestDialog(false); handleNewRequest(type); }}>
                <Icon className={`h-8 w-8 ${color}`} /><span>{label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 新規申請フォーム */}
      <NewRequestForm
        open={showNewRequestFormDialog && selectedRequestType !== null}
        onOpenChange={(open) => { setShowNewRequestFormDialog(open); if (!open) setSelectedRequestType(null); }}
        requestType={selectedRequestType}
        onSubmit={handleNewRequestSubmit}
        currentUserId={currentUserId}
        currentUserName={currentUser?.name || '田中太郎'}
      />

      {/* 承認/却下・委任・詳細ダイアログ */}
      <ApprovalDialog
        open={showApprovalDialog} onOpenChange={setShowApprovalDialog}
        request={selectedRequest} action={approvalAction}
        comment={comment} onCommentChange={setComment} onConfirm={handleApproval}
      />
      <DelegateDialog
        open={showDelegateDialog} onOpenChange={setShowDelegateDialog}
        delegateUserId={delegateUserId} onDelegateUserIdChange={setDelegateUserId}
        delegateReason={delegateReason} onDelegateReasonChange={setDelegateReason}
        onConfirm={handleDelegate}
      />
      <DetailDialog
        open={showDetailDialog} onOpenChange={setShowDetailDialog} request={selectedRequest}
      />

      {/* 代理承認者設定 */}
      <DelegateSettingsDialog open={showDelegateSettings} onOpenChange={setShowDelegateSettings} userId={currentUserId} />

      {/* 一括承認バー */}
      <BulkApprovalBar selectedIds={selectedRequestIds} onClear={() => setSelectedRequestIds([])} />
    </div>
  );
}
