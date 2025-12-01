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
  Clock,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Filter,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyAvatar } from '@/components/ui/lazy-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // In real app, would refetch data here
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // tenantId を取得
  const currentUser = useUserStore(state => state.currentUser);
  const tenantId = currentUser?.tenantId || '';

  // API経由でメンバーデータを取得
  const fetchMembers = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/users?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        const users: User[] = data.data || [];

        // Transform users to members with status
        const apiMembers: Member[] = users.map((user: User) => ({
          ...user,
          currentStatus: (['present', 'remote', 'business_trip', 'training', 'absent', 'not_checked_in'] as const)[
            Math.floor(Math.random() * 6)
          ] as MemberStatus,
          workLocation: Math.random() > 0.5 ? user.department : '本社',
          lastActivity: `${Math.floor(Math.random() * 60)}分前`,
          workingTime: `${Math.floor(Math.random() * 8 + 1)}h ${Math.floor(Math.random() * 60)}m`,
          checkedInAt: Math.random() > 0.3 ? `${Math.floor(Math.random() * 3 + 8)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : undefined,
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

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.currentStatus === statusFilter;
    const matchesLocation = locationFilter === 'all' || member.workLocation === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
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
              <div className="text-sm text-muted-foreground">{member.department}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'position',
      header: '役職',
    },
    {
      accessorKey: 'currentStatus',
      header: 'ステータス',
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
    },
    {
      accessorKey: 'checkedInAt',
      header: '出勤時刻',
      cell: ({ row }) => {
        const time = row.original.checkedInAt;
        return time ? time : <span className="text-muted-foreground">未出勤</span>;
      },
    },
    {
      accessorKey: 'workingTime',
      header: '稼働時間',
    },
    {
      accessorKey: 'lastActivity',
      header: '最終活動',
      cell: ({ row }) => {
        const activity = row.original.lastActivity;
        return <span className="text-sm text-muted-foreground">{activity}</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総メンバー</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出社</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在宅</CardTitle>
            <Home className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.remote}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">出張</CardTitle>
            <Plane className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.businessTrip}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">研修</CardTitle>
            <GraduationCap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.training}</div>
          </CardContent>
        </Card>

        <Card>
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

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="勤務地" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="本社">本社</SelectItem>
              <SelectItem value="営業部">営業部</SelectItem>
              <SelectItem value="開発部">開発部</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <VirtualDataTable
              columns={columns}
              data={filteredMembers}
              searchKey="name"
              searchPlaceholder="メンバー検索..."
              enableVirtualization={filteredMembers.length > 100}
              enableCaching={true}
              pageSize={50}
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