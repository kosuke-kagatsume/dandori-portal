'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWorkflowStore, WorkflowRequest, WorkflowType, ApproverRole } from '@/lib/workflow-store';
import { useNotificationStore } from '@/lib/store/notification-store';
import { useUserStore } from '@/lib/store/user-store';
import { useIsMounted } from '@/hooks/useIsMounted';
import {
  // GitBranch, // フロー図で使用予定
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  // AlertCircle, // アラート表示で使用予定
  // Play, // 再生ボタンで使用予定
  // Pause, // 一時停止ボタンで使用予定
  // Send, // 送信ボタンで使用予定
  Users,
  Calendar,
  DollarSign,
  Package,
  Briefcase,
  // ChevronRight, // アコーディオンで使用予定
  // MoreVertical, // メニューボタンで使用予定
  Plus,
  Search,
  User,
  // MessageSquare, // コメント機能で使用予定
  Eye,
  UserCheck,
  // TrendingUp, // 統計グラフで使用予定
  ClipboardList,
  CheckCheck,
  // ArrowRight, // 矢印アイコンで使用予定
  Timer,
  AlertTriangle,
  UserX,
  Home,
  Building2,
  // Laptop, // PC関連アイコンで使用予定
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // アバター表示で使用予定
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// ドロップダウンメニュー（アクションメニューで使用予定）
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BulkApprovalBar } from '@/features/workflow/bulk-approval-bar';
import { Checkbox } from '@/components/ui/checkbox';

// ダイアログとフォームの遅延読み込み
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
  // デモデータに合わせてユーザーIDを設定（田中太郎: 営業部マネージャー）
  const currentUserId = currentUser?.id || '1';
  
  const {
    requests,
    fetchRequests,
    createRequest,
    submitRequest,
    getMyRequests,
    getPendingApprovals,
    getDelegatedApprovals,
    approveRequest,
    rejectRequest,
    delegateApproval,
    getStatistics,
  } = useWorkflowStore();

  // Zustand persistのhydration（SSR対応）とAPIからデータ取得
  useEffect(() => {
    useWorkflowStore.persist.rehydrate();
    fetchRequests();
  }, [fetchRequests]);

  // 承認待ちのリクエスト
  const pendingApprovals = useMemo(() => 
    getPendingApprovals(currentUserId), 
    [getPendingApprovals, currentUserId, requests]
  );

  // 自分の申請
  const myRequests = useMemo(() => 
    getMyRequests(currentUserId), 
    [getMyRequests, currentUserId, requests]
  );

  // 代理承認
  const delegatedApprovals = useMemo(() => 
    getDelegatedApprovals(currentUserId),
    [getDelegatedApprovals, currentUserId, requests]
  );

  // 統計情報
  const stats = useMemo(() =>
    getStatistics(currentUserId),
    [getStatistics, currentUserId, requests]
  );

  // エスカレーション監視（1分ごと）
  useEffect(() => {
    const checkInterval = setInterval(() => {
      useWorkflowStore.getState().checkAndEscalate();
    }, 60000);

    return () => clearInterval(checkInterval);
  }, []);

  const handleApproval = async () => {
    if (!selectedRequest) return;

    const currentStep = selectedRequest.approvalSteps.find(
      s => s.status === 'pending' && s.approverId === currentUserId
    );

    if (!currentStep) {
      toast.error('承認権限がありません');
      return;
    }

    try {
      if (approvalAction === 'approve') {
        approveRequest(selectedRequest.id, currentStep.id, comment);
        
        // 通知を送信
        addNotification({
          id: `notif-${Date.now()}`,
          title: '申請が承認されました',
          message: `${currentUser?.name}があなたの${getWorkflowTypeLabel(selectedRequest.type)}を承認しました`,
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false,
          important: false,
          userId: selectedRequest.requesterId,
        });
        
        toast.success('申請を承認しました', { 
          description: '申請者に通知が送信されました' 
        });
      } else {
        rejectRequest(selectedRequest.id, currentStep.id, comment);
        
        // 通知を送信
        addNotification({
          id: `notif-${Date.now()}`,
          title: '申請が却下されました',
          message: `${currentUser?.name}があなたの${getWorkflowTypeLabel(selectedRequest.type)}を却下しました: ${comment}`,
          type: 'error',
          timestamp: new Date().toISOString(),
          read: false,
          important: true,
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
      toast.error('必要な情報を入力してください');
      return;
    }

    const currentStep = selectedRequest.approvalSteps.find(
      s => s.status === 'pending' && s.approverId === currentUserId
    );

    if (!currentStep) {
      toast.error('承認権限がありません');
      return;
    }

    // ダミーの代理承認者情報（実際はユーザーマスタから取得）
    const delegateName = '代理承認者';

    delegateApproval(
      selectedRequest.id,
      currentStep.id,
      delegateUserId,
      delegateName,
      delegateReason
    );

    // 通知を送信
    addNotification({
      id: `notif-${Date.now()}`,
      title: '承認が委任されました',
      message: `${currentUser?.name}から${getWorkflowTypeLabel(selectedRequest.type)}の承認が委任されました`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
      important: false,
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
    // toast.successは削除（NewRequestForm内で処理されるため）
    setShowNewRequestDialog(false);
    setSelectedRequestType(null);
  };

  const handleNewRequest = (type: WorkflowType) => {
    setSelectedRequestType(type);
    setShowNewRequestDialog(false);
    // フォームダイアログを表示
    setShowNewRequestFormDialog(true);
  };

  // 以下の古いデモデータ作成コードは使用しない（コメントアウト）
  /*
  const handleNewRequestOld = (type: WorkflowType) => {
    setSelectedRequestType(type);
    setShowNewRequestDialog(false);
    // より具体的なデモデータで新規申請を作成
    const getRequestDetails = (type: WorkflowType) => {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      switch (type) {
        case 'leave_request':
          return {
            title: '有給休暇申請',
            description: '家族旅行のため有給休暇を取得します',
            details: {
              leaveType: 'paid_leave',
              startDate: nextWeek.toISOString().split('T')[0],
              endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              days: 2,
              reason: '家族旅行',
              handover: '業務は完了済み、緊急時は携帯電話で対応可能',
            },
          };
        case 'expense_claim':
          return {
            title: '営業活動経費申請',
            description: '顧客訪問にかかった交通費と会食費の精算',
            details: {
              totalAmount: 25000,
              items: [
                { name: '電車代（往復）', amount: 2800 },
                { name: '顧客との昼食代', amount: 8500 },
                { name: 'タクシー代', amount: 3200 },
                { name: '資料印刷費', amount: 500 },
              ],
              purpose: '新規顧客開拓',
              date: now.toISOString().split('T')[0],
            },
          };
        case 'overtime_request':
          return {
            title: '月末残業申請',
            description: '月末処理のため残業が必要です',
            details: {
              month: now.toISOString().substring(0, 7),
              estimatedHours: 15,
              reason: '月次レポート作成と顧客対応',
              project: '営業活動',
            },
          };
        case 'business_trip':
          return {
            title: '関西支社出張申請',
            description: '関西支社での会議参加のための出張申請',
            details: {
              destination: '大阪',
              purpose: '四半期業績会議',
              startDate: nextWeek.toISOString().split('T')[0],
              endDate: new Date(nextWeek.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              estimatedCost: 45000,
            },
          };
        case 'remote_work':
          return {
            title: 'リモートワーク申請',
            description: '作業集中のため在宅勤務を希望します',
            details: {
              startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              reason: '資料作成に集中するため',
              workLocation: '自宅',
              tasks: ['月次資料作成', 'プレゼン準備', 'メール対応'],
            },
          };
        default:
          return {
            title: getWorkflowTypeLabel(type),
            description: `${getWorkflowTypeLabel(type)}の申請`,
            details: {},
          };
      }
    };

    const requestDetails = getRequestDetails(type);
    
    // 承認ステップを動的に設定
    const getApprovalSteps = (type: WorkflowType) => {
      switch (type) {
        case 'leave_request':
          return [
            {
              id: `step-${Date.now()}-1`,
              order: 1,
              approverRole: 'direct_manager' as ApproverRole,
              approverId: '2',
              approverName: '山田花子（部長）',
              status: 'pending' as const,
            },
            {
              id: `step-${Date.now()}-2`,
              order: 2,
              approverRole: 'hr_manager' as ApproverRole,
              approverId: '5',
              approverName: '高橋美咲（人事部長）',
              status: 'pending' as const,
            },
          ];
        case 'expense_claim':
          return [
            {
              id: `step-${Date.now()}-1`,
              order: 1,
              approverRole: 'direct_manager' as ApproverRole,
              approverId: '2',
              approverName: '山田花子（部長）',
              status: 'pending' as const,
            },
            {
              id: `step-${Date.now()}-2`,
              order: 2,
              approverRole: 'finance_manager' as ApproverRole,
              approverId: '6',
              approverName: '渡辺健太（経理部長）',
              status: 'pending' as const,
            },
          ];
        default:
          return [
            {
              id: `step-${Date.now()}-1`,
              order: 1,
              approverRole: 'direct_manager' as ApproverRole,
              approverId: '2',
              approverName: '山田花子（部長）',
              status: 'pending' as const,
            },
          ];
      }
    };

    const newRequest = useWorkflowStore.getState().createRequest({
      type,
      title: requestDetails.title,
      description: requestDetails.description,
      requesterId: currentUserId,
      requesterName: currentUser?.name || '田中太郎',
      department: currentUser?.department || '営業部',
      status: 'draft',
      priority: type === 'business_trip' ? 'high' : 'normal',
      details: requestDetails.details,
      approvalSteps: getApprovalSteps(type),
      currentStep: 0,
      attachments: [],
      timeline: [],
      escalation: {
        enabled: true,
        daysUntilEscalation: type === 'expense_claim' ? 5 : 3,
        escalationPath: type === 'expense_claim' 
          ? ['direct_manager', 'finance_manager', 'general_manager']
          : ['direct_manager', 'department_head', 'general_manager'],
      },
    });

    // 自動で提出
    submitRequest(newRequest);
    
    toast.success('申請を作成しました', {
      description: '承認者に通知が送信されました',
    });
    
    setShowNewRequestDialog(false);
  };
  */

  const openApprovalDialog = (request: WorkflowRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const openDetailDialog = (request: WorkflowRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const openDelegateDialog = (request: WorkflowRequest) => {
    setSelectedRequest(request);
    setShowDelegateDialog(true);
  };

  // フィルタリング
  const filterRequests = (reqs: WorkflowRequest[]) => {
    return reqs.filter(req => {
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterType !== 'all' && req.type !== filterType) return false;
      if (searchQuery && !req.requesterName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  // フィルター結果のメモ化
  const filteredPendingApprovals = useMemo(() => filterRequests(pendingApprovals), [pendingApprovals, filterType, filterStatus, searchQuery]);
  const filteredMyRequests = useMemo(() => filterRequests(myRequests), [myRequests, filterType, filterStatus, searchQuery]);
  const filteredDelegatedApprovals = useMemo(() => filterRequests(delegatedApprovals), [delegatedApprovals, filterType, filterStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ワークフロー</h1>
          <p className="text-muted-foreground">
            申請の作成・承認・進捗管理を行います
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setShowNewRequestDialog(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            新規申請
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {isMounted && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground">要対応</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">代理承認</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{delegatedApprovals.length}</div>
              <p className="text-xs text-muted-foreground">委任済み</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">申請中</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">処理中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認済み</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">完了</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均処理時間</CardTitle>
              <Timer className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {stats.averageApprovalTime.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">日</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="申請者名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
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
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="種類" />
          </SelectTrigger>
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
            <Clock className="h-4 w-4" />
            承認待ち ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="delegated" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            代理承認 ({delegatedApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            自分の申請 ({myRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* 承認待ちタブ */}
        <TabsContent value="pending" className="space-y-4">
          {filteredPendingApprovals.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRequestIds.length === filteredPendingApprovals.length && filteredPendingApprovals.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRequestIds(filteredPendingApprovals.map(r => r.id));
                    } else {
                      setSelectedRequestIds([]);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  すべて選択
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDelegateSettings(true)}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                代理承認者設定
              </Button>
            </div>
          )}
          {filteredPendingApprovals.length > 0 ? (
            <div className="grid gap-4">
              {filteredPendingApprovals.map((request) => (
                <WorkflowCard
                  key={request.id}
                  request={request}
                  currentUserId={currentUserId}
                  onApprove={() => openApprovalDialog(request, 'approve')}
                  onReject={() => openApprovalDialog(request, 'reject')}
                  onDelegate={() => openDelegateDialog(request)}
                  onDetail={() => openDetailDialog(request)}
                  showCheckbox
                  isSelected={selectedRequestIds.includes(request.id)}
                  onSelectChange={(checked) => {
                    if (checked) {
                      setSelectedRequestIds([...selectedRequestIds, request.id]);
                    } else {
                      setSelectedRequestIds(selectedRequestIds.filter(id => id !== request.id));
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle}
              title="承認待ち申請はありません"
              description="新しい申請が提出されると、こちらに表示されます"
            />
          )}
        </TabsContent>

        {/* 代理承認タブ */}
        <TabsContent value="delegated" className="space-y-4">
          {filteredDelegatedApprovals.length > 0 ? (
            <div className="grid gap-4">
              {filteredDelegatedApprovals.map((request) => (
                <WorkflowCard
                  key={request.id}
                  request={request}
                  currentUserId={currentUserId}
                  onApprove={() => openApprovalDialog(request, 'approve')}
                  onReject={() => openApprovalDialog(request, 'reject')}
                  onDetail={() => openDetailDialog(request)}
                  isDelegated
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserCheck}
              title="代理承認はありません"
              description="承認が委任されると、こちらに表示されます"
            />
          )}
        </TabsContent>

        {/* 自分の申請タブ */}
        <TabsContent value="my-requests" className="space-y-4">
          {filteredMyRequests.length > 0 ? (
            <div className="grid gap-4">
              {filteredMyRequests.map((request) => (
                <WorkflowCard
                  key={request.id}
                  request={request}
                  currentUserId={currentUserId}
                  onDetail={() => openDetailDialog(request)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="申請履歴はありません"
              description="新規申請を作成すると、こちらに表示されます"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* 新規申請ダイアログ */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新規申請を作成</DialogTitle>
            <DialogDescription>
              作成する申請の種類を選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleNewRequest('leave_request')}
            >
              <Calendar className="h-8 w-8 text-blue-600" />
              <span>休暇申請</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleNewRequest('expense_claim')}
            >
              <DollarSign className="h-8 w-8 text-green-600" />
              <span>経費申請</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleNewRequest('overtime_request')}
            >
              <Clock className="h-8 w-8 text-orange-600" />
              <span>残業申請</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleNewRequest('business_trip')}
            >
              <Briefcase className="h-8 w-8 text-purple-600" />
              <span>出張申請</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleNewRequest('remote_work')}
            >
              <Home className="h-8 w-8 text-indigo-600" />
              <span>リモートワーク</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleNewRequest('purchase_request')}
            >
              <Package className="h-8 w-8 text-pink-600" />
              <span>購買申請</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setShowNewRequestDialog(false);
                setShowChangeRequestDialog(true);
              }}
            >
              <ClipboardList className="h-8 w-8 text-teal-600" />
              <span>各種変更</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 各種変更選択ダイアログ */}
      <Dialog open={showChangeRequestDialog} onOpenChange={setShowChangeRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>変更申請の種類を選択</DialogTitle>
            <DialogDescription>
              変更する項目を選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setShowChangeRequestDialog(false);
                handleNewRequest('bank_account_change');
              }}
            >
              <Building2 className="h-8 w-8 text-blue-600" />
              <span>給与振込口座変更</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setShowChangeRequestDialog(false);
                handleNewRequest('family_info_change');
              }}
            >
              <Users className="h-8 w-8 text-green-600" />
              <span>家族情報変更</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setShowChangeRequestDialog(false);
                handleNewRequest('commute_route_change');
              }}
            >
              <UserCheck className="h-8 w-8 text-orange-600" />
              <span>通勤経路変更</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新規申請フォーム */}
      <NewRequestForm
        open={showNewRequestFormDialog && selectedRequestType !== null}
        onOpenChange={(open) => {
          setShowNewRequestFormDialog(open);
          if (!open) setSelectedRequestType(null);
        }}
        requestType={selectedRequestType}
        onSubmit={handleNewRequestSubmit}
        currentUserId={currentUserId}
        currentUserName={currentUser?.name || '田中太郎'}
      />

      {/* 承認/却下ダイアログ */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? '申請を承認' : '申請を却下'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="space-y-2 text-left mt-4">
                  <p>申請者: {selectedRequest.requesterName}</p>
                  <p>申請種別: {getWorkflowTypeLabel(selectedRequest.type)}</p>
                  <p>申請日: {format(new Date(selectedRequest.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                コメント {approvalAction === 'reject' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  approvalAction === 'approve' 
                    ? '承認理由やコメントをご入力ください（任意）'
                    : '却下理由をご入力ください（必須）'
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
              disabled={approvalAction === 'reject' && !comment}
              className={approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={approvalAction === 'reject' ? 'destructive' : 'default'}
            >
              {approvalAction === 'approve' ? '承認する' : '却下する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 代理承認ダイアログ */}
      <Dialog open={showDelegateDialog} onOpenChange={setShowDelegateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>承認を委任</DialogTitle>
            <DialogDescription>
              他の承認者に承認を委任します
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delegate-user">委任先 <span className="text-red-500">*</span></Label>
              <Select value={delegateUserId} onValueChange={setDelegateUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="委任先を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">佐藤副部長</SelectItem>
                  <SelectItem value="5">高橋課長</SelectItem>
                  <SelectItem value="6">渡辺主任</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delegate-reason">委任理由 <span className="text-red-500">*</span></Label>
              <Textarea
                id="delegate-reason"
                placeholder="委任理由を入力してください"
                value={delegateReason}
                onChange={(e) => setDelegateReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelegateDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleDelegate}
              disabled={!delegateUserId || !delegateReason}
            >
              委任する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 詳細ダイアログ */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>申請詳細</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">申請者</Label>
                    <p className="font-medium">{selectedRequest.requesterName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">部署</Label>
                    <p className="font-medium">{selectedRequest.department}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">申請種別</Label>
                    <p className="font-medium">{getWorkflowTypeLabel(selectedRequest.type)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">優先度</Label>
                    <Badge className={getPriorityColor(selectedRequest.priority)}>
                      {getPriorityLabel(selectedRequest.priority)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">ステータス</Label>
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {getStatusLabel(selectedRequest.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">申請日</Label>
                    <p className="font-medium">
                      {format(new Date(selectedRequest.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </p>
                  </div>
                </div>

                {/* 説明 */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">説明</Label>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>

                {/* 承認フロー */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">承認フロー</Label>
                  <div className="space-y-4">
                    {selectedRequest.approvalSteps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.status === 'approved' ? 'bg-green-100 text-green-600' :
                          step.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          step.status === 'skipped' ? 'bg-gray-100 text-gray-400' :
                          index === selectedRequest.currentStep ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {step.status === 'approved' ? <CheckCheck className="h-5 w-5" /> :
                           step.status === 'rejected' ? <XCircle className="h-5 w-5" /> :
                           step.status === 'skipped' ? <UserX className="h-5 w-5" /> :
                           step.order}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{step.approverName}</span>
                            <Badge variant="outline" className="text-xs">
                              {getApproverRoleLabel(step.approverRole)}
                            </Badge>
                            {step.delegatedTo && (
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                委任: {step.delegatedTo.name}
                              </Badge>
                            )}
                            {step.status === 'approved' && (
                              <Badge className="text-xs bg-green-100 text-green-800">承認済み</Badge>
                            )}
                            {step.status === 'rejected' && (
                              <Badge className="text-xs" variant="destructive">却下</Badge>
                            )}
                            {step.status === 'pending' && index === selectedRequest.currentStep && (
                              <Badge className="text-xs">承認待ち</Badge>
                            )}
                          </div>
                          
                          {step.actionDate && (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(step.actionDate), 'MM/dd HH:mm', { locale: ja })}
                            </p>
                          )}
                          
                          {step.comments && (
                            <p className="text-sm mt-1 p-2 bg-muted rounded">
                              {step.comments}
                            </p>
                          )}
                          
                          {step.delegatedTo && (
                            <p className="text-sm mt-1 p-2 bg-purple-50 rounded text-purple-800">
                              委任理由: {step.delegatedTo.reason}
                            </p>
                          )}
                          
                          {step.escalationDeadline && step.status === 'pending' && (
                            <p className="text-sm mt-1 text-orange-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              期限: {format(new Date(step.escalationDeadline), 'MM/dd', { locale: ja })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* タイムライン */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">履歴</Label>
                  <div className="space-y-2">
                    {selectedRequest.timeline.map((event) => (
                      <div key={event.id} className="flex gap-3 text-sm">
                        <span className="text-muted-foreground w-24">
                          {format(new Date(event.timestamp), 'MM/dd HH:mm')}
                        </span>
                        <span className="flex-1">
                          <span className="font-medium">{event.userName}</span>
                          {' '}が{event.action}
                          {event.comments && (
                            <span className="text-muted-foreground"> - {event.comments}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 進捗バー */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Progress 
                    value={calculateProgress(selectedRequest)} 
                    className="flex-1" 
                  />
                  <span className="text-sm text-muted-foreground">
                    進捗: {calculateProgress(selectedRequest).toFixed(0)}%
                  </span>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* 代理承認者設定ダイアログ */}
      <DelegateSettingsDialog
        open={showDelegateSettings}
        onOpenChange={setShowDelegateSettings}
        userId={currentUserId}
      />

      {/* 一括承認バー */}
      <BulkApprovalBar
        selectedIds={selectedRequestIds}
        onClear={() => setSelectedRequestIds([])}
      />
    </div>
  );
}

// ワークフローカードコンポーネント
function WorkflowCard({ 
  request, 
  currentUserId, 
  onApprove, 
  onReject,
  onDelegate, 
  onDetail,
  isDelegated = false,
  isSelected = false,
  onSelectChange,
  showCheckbox = false,
}: {
  request: WorkflowRequest;
  currentUserId: string;
  onApprove?: () => void;
  onReject?: () => void;
  onDelegate?: () => void;
  onDetail: () => void;
  isDelegated?: boolean;
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  showCheckbox?: boolean;
}) {
  const Icon = getWorkflowTypeIcon(request.type);
  const progress = calculateProgress(request);
  const currentStep = request.approvalSteps[request.currentStep];
  const canApprove = currentStep && (
    currentStep.approverId === currentUserId || 
    currentStep.delegatedTo?.id === currentUserId
  ) && currentStep.status === 'pending';

  return (
    <Card className={isSelected ? 'ring-2 ring-blue-500' : ''}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-4">
          <div className="flex gap-4 w-full lg:w-auto">
            {showCheckbox && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectChange}
                className="mt-3"
              />
            )}
            <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{request.title}</h3>
                <Badge className={getPriorityColor(request.priority)}>
                  {getPriorityLabel(request.priority)}
                </Badge>
                <Badge className={getStatusColor(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
                {isDelegated && (
                  <Badge className="bg-purple-100 text-purple-800">
                    委任
                  </Badge>
                )}
                {request.status === 'escalated' && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    エスカレーション
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {request.requesterName}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {request.department}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(request.createdAt), 'MM/dd HH:mm', { locale: ja })}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    ステップ {request.currentStep + 1} / {request.approvalSteps.length}
                  </span>
                  {currentStep && (
                    <span className="text-sm text-muted-foreground">
                      • 承認者: {currentStep.approverName}
                      {currentStep.delegatedTo && ` → ${currentStep.delegatedTo.name}`}
                    </span>
                  )}
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <Button variant="outline" size="sm" onClick={onDetail} className="w-full sm:w-auto">
              <Eye className="h-4 w-4 mr-1" />
              詳細
            </Button>
            {canApprove && onApprove && onReject && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" onClick={onApprove}>
                  承認
                </Button>
                <Button size="sm" variant="outline" onClick={onReject} className="w-full sm:w-auto">
                  却下
                </Button>
                {onDelegate && (
                  <Button size="sm" variant="outline" onClick={onDelegate} className="w-full sm:w-auto">
                    <UserCheck className="h-4 w-4 mr-1" />
                    委任
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 空状態コンポーネント
function EmptyState({ icon: Icon, title, description }: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// ヘルパー関数
function getWorkflowTypeIcon(type: WorkflowType) {
  const icons = {
    leave_request: Calendar,
    expense_claim: DollarSign,
    overtime_request: Clock,
    business_trip: Briefcase,
    purchase_request: Package,
    document_approval: FileText,
    shift_change: Users,
    remote_work: Home,
    bank_account_change: Building2,
    family_info_change: Users,
    commute_route_change: UserCheck,
  };
  return icons[type] || FileText;
}

function getWorkflowTypeLabel(type: WorkflowType): string {
  const labels = {
    leave_request: '休暇申請',
    expense_claim: '経費申請',
    overtime_request: '残業申請',
    business_trip: '出張申請',
    purchase_request: '購買申請',
    document_approval: '書類承認',
    shift_change: 'シフト変更',
    remote_work: 'リモートワーク申請',
    bank_account_change: '給与振込口座変更',
    family_info_change: '家族情報変更',
    commute_route_change: '通勤経路変更',
  };
  return labels[type] || '申請';
}

function getStatusLabel(status: WorkflowRequest['status']): string {
  const labels: Record<string, string> = {
    draft: '下書き',
    pending: '申請中',
    in_review: '確認中',
    partially_approved: '一部承認',
    approved: '承認済み',
    rejected: '却下',
    cancelled: '取消',
    completed: '完了',
    escalated: 'エスカレーション',
  };
  return labels[status] || status;
}

function getStatusColor(status: WorkflowRequest['status']): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    partially_approved: 'bg-indigo-100 text-indigo-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    escalated: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || '';
}

function getPriorityLabel(priority: WorkflowRequest['priority']): string {
  const labels = {
    low: '低',
    normal: '通常',
    high: '高',
    urgent: '緊急',
  };
  return labels[priority] || priority;
}

function getPriorityColor(priority: WorkflowRequest['priority']): string {
  const colors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };
  return colors[priority] || '';
}

function getApproverRoleLabel(role: ApproverRole): string {
  const labels = {
    direct_manager: '直属上司',
    department_head: '部門長',
    hr_manager: '人事部長',
    finance_manager: '経理部長',
    general_manager: '役員',
    ceo: '社長',
  };
  return labels[role] || role;
}

function calculateProgress(request: WorkflowRequest): number {
  if (request.status === 'completed' || request.status === 'approved') return 100;
  if (request.status === 'rejected' || request.status === 'cancelled') return 0;
  
  const totalSteps = request.approvalSteps.length;
  const completedSteps = request.approvalSteps.filter(
    s => s.status === 'approved' || s.status === 'skipped'
  ).length;
  
  return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
}