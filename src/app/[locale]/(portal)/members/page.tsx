'use client';

import { useState, useEffect, useCallback } from 'react';
// import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { useUserStore } from '@/lib/store/user-store';
import {
  Users,
  MapPin,
  Home,
  Plane,
  GraduationCap,
  UserX,
  // Clock, // 出勤時刻表示で使用予定
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyAvatar } from '@/components/ui/lazy-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualDataTable } from '@/components/ui/common/virtual-data-table';
import { MemberCard } from '@/features/members/member-card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

type MemberStatus = 'present' | 'remote' | 'business_trip' | 'training' | 'absent' | 'not_checked_in';

type Member = User & {
  currentStatus: MemberStatus;
  workLocation?: string;
  lastActivity?: string;
  workingTime?: string;
  checkedInAt?: string;
  employeeNumber?: string;  // 社員番号
  nameKana?: string;        // フリガナ
};

export default function MembersPage() {
  // const t = useTranslations('members');
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': 'メンバー状況',
    };
    return translations[key] || key;
  };
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'employeeNumber' | 'checkedInAt'>('name');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // カードビューのページサイズ
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initialize date on client side to avoid SSR/CSR hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  // tenantId を取得
  const currentUser = useUserStore(state => state.currentUser);
  const tenantId = currentUser?.tenantId || '';

  // API経由でメンバーデータを取得（勤怠データ含む）
  const fetchMembers = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/members/status?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        const membersData = data.data?.members || [];

        // APIレスポンスをMember型にマッピング
        const apiMembers: Member[] = membersData.map((member: {
          id: string;
          email: string;
          name: string;
          nameKana: string | null;
          employeeNumber: string | null;
          department: string | null;
          position: string | null;
          role: string;
          avatar: string | null;
          currentStatus: string;
          workLocation: string | null;
          checkedInAt: string | null;
          workingTime: string | null;
          lastActivity: string | null;
        }) => ({
          id: member.id,
          email: member.email,
          name: member.name,
          nameKana: member.nameKana || undefined,
          employeeNumber: member.employeeNumber || undefined,
          department: member.department || '',
          position: member.position || '',
          role: member.role,
          avatar: member.avatar,
          tenantId,
          status: 'active' as const,
          currentStatus: member.currentStatus as MemberStatus,
          workLocation: member.workLocation || undefined,
          checkedInAt: member.checkedInAt || undefined,
          workingTime: member.workingTime || undefined,
          lastActivity: member.lastActivity || undefined,
        }));

        setMembers(apiMembers);
      }
    } catch (error) {
      console.error('メンバーデータの取得に失敗しました:', error);
      toast.error('メンバーデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Load members data
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMembers();
      setLastUpdated(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMembers]);

  // フィルター変更時にページをリセット
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter, sortBy]);

  // 動的に部署リストを取得
  const departments = Array.from(new Set(members.map(m => m.department).filter((d): d is string => !!d))).sort((a, b) => a.localeCompare(b, 'ja'));

  // Filter and sort members
  const filteredMembers = members
    .filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (member.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (member.employeeNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      // 休暇・欠勤フィルターは absent と not_checked_in の両方を含める
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'absent'
                             ? (member.currentStatus === 'absent' || member.currentStatus === 'not_checked_in')
                             : member.currentStatus === statusFilter);
      const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ja');
        case 'department':
          return (a.department || '').localeCompare(b.department || '', 'ja');
        case 'employeeNumber':
          // 社員番号でソート
          if (!a.employeeNumber && !b.employeeNumber) return 0;
          if (!a.employeeNumber) return 1;
          if (!b.employeeNumber) return -1;
          return a.employeeNumber.localeCompare(b.employeeNumber, 'ja', { numeric: true });
        case 'checkedInAt':
          // 出勤時刻でソート（出勤している人が先、未出勤は後）
          if (!a.checkedInAt && !b.checkedInAt) return 0;
          if (!a.checkedInAt) return 1;
          if (!b.checkedInAt) return -1;
          return a.checkedInAt.localeCompare(b.checkedInAt);
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    total: members.length,
    present: members.filter(m => m.currentStatus === 'present').length,
    remote: members.filter(m => m.currentStatus === 'remote').length,
    businessTrip: members.filter(m => m.currentStatus === 'business_trip').length,
    training: members.filter(m => m.currentStatus === 'training').length,
    absent: members.filter(m => m.currentStatus === 'absent' || m.currentStatus === 'not_checked_in').length,
  };

  const statusBadgeVariant = (status: MemberStatus) => {
    switch (status) {
      case 'present': return 'default';
      case 'remote': return 'secondary';
      case 'business_trip': return 'outline';
      case 'training': return 'outline';
      case 'absent': return 'secondary';
      case 'not_checked_in': return 'destructive';
      default: return 'outline';
    }
  };

  const statusLabel = (status: MemberStatus) => {
    const labels = {
      present: '出社',
      remote: '在宅',
      business_trip: '出張',
      training: '研修',
      absent: '休暇',
      not_checked_in: '未出勤',
    };
    return labels[status];
  };

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'name',
      header: 'メンバー',
      enableSorting: false, // 上部フィルタで並び替えするためソート無効
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center space-x-3">
            <LazyAvatar
              src={member.avatar}
              alt={member.name}
              fallback={member.name.charAt(0)}
              className="h-8 w-8"
            />
            <div>
              <div className="font-medium">{member.name}</div>
              {member.nameKana && (
                <div className="text-xs text-muted-foreground">{member.nameKana}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'employeeNumber',
      header: '社員番号',
      enableSorting: false,
      cell: ({ row }) => {
        const num = row.original.employeeNumber;
        return num ? <span className="text-sm">{num}</span> : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'department',
      header: '部署・役職',
      enableSorting: false,
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div>
            <div className="text-sm">{member.department}</div>
            <div className="text-xs text-muted-foreground">{member.position}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'currentStatus',
      header: 'ステータス',
      enableSorting: false,
      cell: ({ row }) => {
        const status = row.original.currentStatus;
        return (
          <Badge variant={statusBadgeVariant(status)}>
            {statusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'workLocation',
      header: '勤務地',
      enableSorting: false,
      cell: ({ row }) => {
        const location = row.original.workLocation;
        return location ? location : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'checkedInAt',
      header: '出勤時刻',
      enableSorting: false,
      cell: ({ row }) => {
        const time = row.original.checkedInAt;
        return time ? <span className="font-mono text-sm">{time}</span> : <span className="text-muted-foreground">未出勤</span>;
      },
    },
    {
      accessorKey: 'workingTime',
      header: '稼働時間',
      enableSorting: false,
      cell: ({ row }) => {
        const time = row.original.workingTime;
        return time ? <span className="font-mono text-sm">{time}</span> : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'lastActivity',
      header: '最終活動',
      enableSorting: false,
      cell: ({ row }) => {
        const activity = row.original.lastActivity;
        return activity ? <span className="text-sm">{activity}</span> : <span className="text-muted-foreground">-</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            メンバーの現在の状況をリアルタイムで確認できます
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              autoRefresh ? "bg-green-50 text-green-700 border-green-200" : ""
            )}
          >
            {autoRefresh ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            自動更新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchMembers();
              setLastUpdated(new Date());
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </div>

      {/* Stats Summary - クリックでフィルタ */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総メンバー</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'present' && "ring-2 ring-green-500"
          )}
          onClick={() => setStatusFilter('present')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出社</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'remote' && "ring-2 ring-blue-500"
          )}
          onClick={() => setStatusFilter('remote')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在宅</CardTitle>
            <Home className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.remote}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'business_trip' && "ring-2 ring-purple-500"
          )}
          onClick={() => setStatusFilter('business_trip')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出張</CardTitle>
            <Plane className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.businessTrip}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'training' && "ring-2 ring-orange-500"
          )}
          onClick={() => setStatusFilter('training')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">研修</CardTitle>
            <GraduationCap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.training}</div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusFilter === 'absent' && "ring-2 ring-red-500"
          )}
          onClick={() => setStatusFilter('absent')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">休暇・欠勤</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="メンバー名や部署で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MemberStatus | 'all')}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="present">出社</SelectItem>
              <SelectItem value="remote">在宅</SelectItem>
              <SelectItem value="business_trip">出張</SelectItem>
              <SelectItem value="training">研修</SelectItem>
              <SelectItem value="absent">休暇・欠勤</SelectItem>
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="部署" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部署</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'department' | 'employeeNumber' | 'checkedInAt')}>
            <SelectTrigger className="w-36">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="並び順" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">名前順</SelectItem>
              <SelectItem value="employeeNumber">社員番号順</SelectItem>
              <SelectItem value="department">部署順</SelectItem>
              <SelectItem value="checkedInAt">出勤時刻順</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            最終更新: {lastUpdated ? lastUpdated.toLocaleTimeString('ja-JP') : '--:--:--'}
          </span>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'card' | 'table')}>
            <TabsList>
              <TabsTrigger value="card" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'card' ? (
        <>
          {/* ページネーション情報（カードビュー上部） */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredMembers.length} 件中 {Math.min((currentPage - 1) * pageSize + 1, filteredMembers.length)} - {Math.min(currentPage * pageSize, filteredMembers.length)} 件を表示
            </div>
            {filteredMembers.length > pageSize && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  {currentPage} / {Math.ceil(filteredMembers.length / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMembers.length / pageSize), p + 1))}
                  disabled={currentPage >= Math.ceil(filteredMembers.length / pageSize)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(Math.ceil(filteredMembers.length / pageSize))}
                  disabled={currentPage >= Math.ceil(filteredMembers.length / pageSize)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            {/* ページネーション情報（リスト表示上部） */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {filteredMembers.length} / {members.length} 件
              </div>
              {filteredMembers.length > pageSize && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    {currentPage} / {Math.ceil(filteredMembers.length / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMembers.length / pageSize), p + 1))}
                    disabled={currentPage >= Math.ceil(filteredMembers.length / pageSize)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(Math.ceil(filteredMembers.length / pageSize))}
                    disabled={currentPage >= Math.ceil(filteredMembers.length / pageSize)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <VirtualDataTable
              columns={columns}
              data={filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
              searchKey="name"
              searchPlaceholder="メンバー検索..."
              enableVirtualization={false}
              enableCaching={true}
              pageSize={pageSize}
            />
          </CardContent>
        </Card>
      )}

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">メンバーが見つかりません</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                検索条件を変更してみてください
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}