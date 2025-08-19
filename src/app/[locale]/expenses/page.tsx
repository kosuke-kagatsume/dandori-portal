'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Receipt,
  Plus,
  Upload,
  Download,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  PiggyBank,
  Car,
  Utensils,
  Train,
  Hotel,
  Users,
  Briefcase,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/common/data-table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ExpenseRecord {
  id: string;
  date: string;
  category: 'transport' | 'meal' | 'accommodation' | 'office' | 'entertainment' | 'other';
  amount: number;
  description: string;
  project?: string;
  client?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  submittedAt?: string;
  approvedAt?: string;
  approver?: string;
  receipt?: boolean;
  note?: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('list');

  // 経費データの読み込み
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        // モック経費データ
        const mockExpenses: ExpenseRecord[] = Array.from({ length: 30 }, (_, i) => ({
          id: `${i + 1}`,
          date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          category: (['transport', 'meal', 'accommodation', 'office', 'entertainment', 'other'] as const)[Math.floor(Math.random() * 6)],
          amount: Math.floor(Math.random() * 50000) + 1000,
          description: [
            'タクシー代（客先訪問）',
            '会食費（顧客接待）',
            '新幹線代（大阪出張）',
            'ホテル宿泊費',
            '事務用品購入',
            'ソフトウェアライセンス',
            '書籍購入',
            'セミナー参加費',
          ][Math.floor(Math.random() * 8)],
          project: Math.random() > 0.5 ? `プロジェクト${Math.floor(Math.random() * 5) + 1}` : undefined,
          client: Math.random() > 0.5 ? `${['A社', 'B社', 'C社'][Math.floor(Math.random() * 3)]}` : undefined,
          status: (['draft', 'pending', 'approved', 'rejected', 'paid'] as const)[Math.floor(Math.random() * 5)],
          submittedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          approvedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
          approver: Math.random() > 0.5 ? '山田部長' : undefined,
          receipt: Math.random() > 0.2,
          note: Math.random() > 0.7 ? '領収書添付済み' : undefined,
        }));

        setExpenses(mockExpenses);
      } catch (error) {
        toast.error('経費データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, []);

  const getCategoryIcon = (category: ExpenseRecord['category']) => {
    switch (category) {
      case 'transport': return Train;
      case 'meal': return Utensils;
      case 'accommodation': return Hotel;
      case 'office': return Briefcase;
      case 'entertainment': return Gift;
      default: return Receipt;
    }
  };

  const getCategoryLabel = (category: ExpenseRecord['category']) => {
    const labels = {
      transport: '交通費',
      meal: '飲食費',
      accommodation: '宿泊費',
      office: '事務用品',
      entertainment: '交際費',
      other: 'その他',
    };
    return labels[category];
  };

  const getStatusBadge = (status: ExpenseRecord['status']) => {
    const config = {
      draft: { label: '下書き', variant: 'secondary' as const, icon: FileText },
      pending: { label: '承認待ち', variant: 'outline' as const, icon: Clock },
      approved: { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '却下', variant: 'destructive' as const, icon: XCircle },
      paid: { label: '精算済み', variant: 'default' as const, icon: CreditCard },
    };

    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const columns: ColumnDef<ExpenseRecord>[] = [
    {
      accessorKey: 'date',
      header: '日付',
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return format(date, 'MM/dd', { locale: ja });
      },
    },
    {
      accessorKey: 'category',
      header: 'カテゴリ',
      cell: ({ row }) => {
        const Icon = getCategoryIcon(row.original.category);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{getCategoryLabel(row.original.category)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: '内容',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.description}</div>
          {row.original.project && (
            <div className="text-xs text-muted-foreground">{row.original.project}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: '金額',
      cell: ({ row }) => (
        <div className="font-medium">
          ¥{row.original.amount.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'client',
      header: '取引先',
      cell: ({ row }) => row.original.client || '-',
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'receipt',
      header: '領収書',
      cell: ({ row }) => row.original.receipt ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
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
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // 統計データ
  const stats = {
    totalThisMonth: expenses
      .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
      .reduce((sum, e) => sum + e.amount, 0),
    pending: expenses.filter(e => e.status === 'pending').length,
    approved: expenses.filter(e => e.status === 'approved').length,
    averageAmount: Math.floor(
      expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length
    ),
  };

  const budgetUsage = (stats.totalThisMonth / 500000) * 100; // 月間予算50万円と仮定

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">経費精算</h1>
          <p className="text-muted-foreground">
            経費の申請と精算管理を行います
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            領収書アップロード
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                経費申請
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>経費申請</DialogTitle>
                <DialogDescription>
                  経費の詳細を入力してください
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">日付</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">カテゴリ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transport">交通費</SelectItem>
                        <SelectItem value="meal">飲食費</SelectItem>
                        <SelectItem value="accommodation">宿泊費</SelectItem>
                        <SelectItem value="office">事務用品</SelectItem>
                        <SelectItem value="entertainment">交際費</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">金額</Label>
                  <Input id="amount" type="number" placeholder="¥0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">内容</Label>
                  <Input id="description" placeholder="経費の内容を入力" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">備考</Label>
                  <Textarea id="note" placeholder="詳細な説明を入力" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">領収書</Label>
                  <Input id="receipt" type="file" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={() => {
                  toast.success('経費申請を送信しました');
                  setDialogOpen(false);
                }}>
                  申請する
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の経費</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.totalThisMonth.toLocaleString()}
            </div>
            <Progress value={budgetUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              予算の{budgetUsage.toFixed(0)}%使用
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
              承認待ち申請
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">承認済み</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              精算待ち
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均金額</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.averageAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              申請あたり
            </p>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="list">申請一覧</TabsTrigger>
          <TabsTrigger value="budget">予算管理</TabsTrigger>
          <TabsTrigger value="reports">レポート</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <DataTable
                columns={columns}
                data={expenses}
                searchKey="description"
                searchPlaceholder="内容で検索..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別予算</CardTitle>
                <CardDescription>
                  各カテゴリの予算消化状況
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['transport', 'meal', 'accommodation', 'office', 'entertainment'].map(category => {
                  const categoryExpenses = expenses
                    .filter(e => e.category === category && new Date(e.date).getMonth() === new Date().getMonth())
                    .reduce((sum, e) => sum + e.amount, 0);
                  const budget = 100000; // 各カテゴリ10万円の予算
                  const usage = (categoryExpenses / budget) * 100;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{getCategoryLabel(category as any)}</span>
                        <span className="font-medium">
                          ¥{categoryExpenses.toLocaleString()} / ¥{budget.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={usage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>月間推移</CardTitle>
                <CardDescription>
                  過去6ヶ月の経費推移
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  グラフ機能は開発中です
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>経費レポート</CardTitle>
              <CardDescription>
                期間を指定してレポートを生成できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input type="date" placeholder="開始日" />
                <Input type="date" placeholder="終了日" />
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  レポート生成
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                レポートを生成するには期間を選択してください
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}