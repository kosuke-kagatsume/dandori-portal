'use client';

import { useState } from 'react';
import {
  GitBranch,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Send,
  Users,
  Calendar,
  DollarSign,
  Package,
  Briefcase,
  Shield,
  Settings,
  ChevronRight,
  MoreVertical,
  Plus,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface WorkflowItem {
  id: string;
  title: string;
  type: 'leave' | 'expense' | 'purchase' | 'contract' | 'hr' | 'it';
  status: 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  priority: 'high' | 'medium' | 'low';
  requester: {
    name: string;
    avatar?: string;
    department: string;
  };
  currentStep: number;
  totalSteps: number;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  amount?: number;
  description: string;
}

export default function WorkflowPage() {
  const [selectedTab, setSelectedTab] = useState('my-requests');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // モックワークフローデータ
  const workflows: WorkflowItem[] = [
    {
      id: '1',
      title: '年末年始休暇申請',
      type: 'leave',
      status: 'pending',
      priority: 'high',
      requester: {
        name: '山田太郎',
        department: '営業部',
      },
      currentStep: 1,
      totalSteps: 3,
      assignee: '佐藤部長',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-10',
      dueDate: '2024-01-15',
      description: '12/29〜1/3の年末年始休暇を申請します',
    },
    {
      id: '2',
      title: '出張経費精算',
      type: 'expense',
      status: 'in_review',
      priority: 'medium',
      requester: {
        name: '鈴木花子',
        department: '開発部',
      },
      currentStep: 2,
      totalSteps: 4,
      assignee: '経理部',
      createdAt: '2024-01-08',
      updatedAt: '2024-01-11',
      amount: 85000,
      description: '大阪出張の交通費と宿泊費',
    },
    {
      id: '3',
      title: 'PCモニター購入申請',
      type: 'purchase',
      status: 'approved',
      priority: 'low',
      requester: {
        name: '田中次郎',
        department: 'デザイン部',
      },
      currentStep: 4,
      totalSteps: 4,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-12',
      amount: 45000,
      description: '4Kモニター（27インチ）の購入',
    },
    {
      id: '4',
      title: '業務委託契約承認',
      type: 'contract',
      status: 'pending',
      priority: 'high',
      requester: {
        name: '高橋美香',
        department: '法務部',
      },
      currentStep: 1,
      totalSteps: 5,
      assignee: '法務部長',
      createdAt: '2024-01-11',
      updatedAt: '2024-01-11',
      dueDate: '2024-01-20',
      description: 'ABC社との業務委託契約',
    },
    {
      id: '5',
      title: '新入社員入社手続き',
      type: 'hr',
      status: 'in_review',
      priority: 'high',
      requester: {
        name: '人事部',
        department: '管理本部',
      },
      currentStep: 3,
      totalSteps: 6,
      assignee: 'IT部',
      createdAt: '2024-01-09',
      updatedAt: '2024-01-12',
      dueDate: '2024-02-01',
      description: '2月入社予定の新入社員3名の手続き',
    },
  ];

  const getTypeIcon = (type: WorkflowItem['type']) => {
    switch (type) {
      case 'leave': return Calendar;
      case 'expense': return DollarSign;
      case 'purchase': return Package;
      case 'contract': return FileText;
      case 'hr': return Users;
      case 'it': return Shield;
      default: return Briefcase;
    }
  };

  const getTypeLabel = (type: WorkflowItem['type']) => {
    const labels = {
      leave: '休暇申請',
      expense: '経費精算',
      purchase: '購買申請',
      contract: '契約承認',
      hr: '人事手続き',
      it: 'IT申請',
    };
    return labels[type];
  };

  const getStatusBadge = (status: WorkflowItem['status']) => {
    const config = {
      draft: { label: '下書き', variant: 'secondary' as const, icon: FileText },
      pending: { label: '承認待ち', variant: 'outline' as const, icon: Clock },
      in_review: { label: 'レビュー中', variant: 'default' as const, icon: AlertCircle },
      approved: { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '却下', variant: 'destructive' as const, icon: XCircle },
      completed: { label: '完了', variant: 'default' as const, icon: CheckCircle },
    };

    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: WorkflowItem['priority']) => {
    const config = {
      high: { label: '高', color: 'text-red-600 bg-red-50' },
      medium: { label: '中', color: 'text-yellow-600 bg-yellow-50' },
      low: { label: '低', color: 'text-green-600 bg-green-50' },
    };

    const { label, color } = config[priority];
    return (
      <Badge className={`${color} border-0`}>
        優先度: {label}
      </Badge>
    );
  };

  const filteredWorkflows = workflows.filter(w => {
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (filterType !== 'all' && w.type !== filterType) return false;
    if (searchQuery && !w.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: workflows.length,
    pending: workflows.filter(w => w.status === 'pending').length,
    inReview: workflows.filter(w => w.status === 'in_review').length,
    completed: workflows.filter(w => w.status === 'completed' || w.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ワークフロー</h1>
          <p className="text-muted-foreground">
            申請の承認フローを管理します
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新規申請
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総申請数</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              今月の申請
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認待ち</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              要対応
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">レビュー中</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
            <p className="text-xs text-muted-foreground">
              処理中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              今月完了
            </p>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="申請を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="pending">承認待ち</SelectItem>
            <SelectItem value="in_review">レビュー中</SelectItem>
            <SelectItem value="approved">承認済み</SelectItem>
            <SelectItem value="rejected">却下</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="種類" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="leave">休暇申請</SelectItem>
            <SelectItem value="expense">経費精算</SelectItem>
            <SelectItem value="purchase">購買申請</SelectItem>
            <SelectItem value="contract">契約承認</SelectItem>
            <SelectItem value="hr">人事手続き</SelectItem>
            <SelectItem value="it">IT申請</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* タブコンテンツ */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="my-requests">自分の申請</TabsTrigger>
          <TabsTrigger value="approvals">承認待ち</TabsTrigger>
          <TabsTrigger value="all">すべて</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <div className="grid gap-4">
            {filteredWorkflows.map((workflow) => {
              const Icon = getTypeIcon(workflow.type);
              const progress = (workflow.currentStep / workflow.totalSteps) * 100;

              return (
                <Card key={workflow.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{workflow.title}</h3>
                            {getPriorityBadge(workflow.priority)}
                            {getStatusBadge(workflow.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {workflow.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {workflow.requester.name} ({workflow.requester.department})
                            </span>
                            {workflow.amount && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ¥{workflow.amount.toLocaleString()}
                              </span>
                            )}
                            {workflow.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                期限: {workflow.dueDate}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                ステップ {workflow.currentStep} / {workflow.totalSteps}
                              </span>
                              {workflow.assignee && (
                                <span className="text-sm text-muted-foreground">
                                  • 担当: {workflow.assignee}
                                </span>
                              )}
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          詳細
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>アクション</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              承認する
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              保留する
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              転送する
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              却下する
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}