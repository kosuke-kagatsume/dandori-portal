'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { generateMockUsers } from '@/lib/mock-data';
import {
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  UserPlus,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye,
  UserX,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LazyAvatar } from '@/components/ui/lazy-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VirtualDataTable } from '@/components/ui/common/virtual-data-table';
import { UserFormDialog } from '@/features/users/user-form-dialog';
import { RetireUserDialog } from '@/features/users/retire-user-dialog';
import { useUserStore } from '@/lib/store/user-store';
import { toast } from 'sonner';
import type { User } from '@/types';

export default function UsersPage() {
  // const t = useTranslations('users');
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': 'ユーザー管理',
    };
    return translations[key] || key;
  };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [retiringUser, setRetiringUser] = useState<User | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const router = useRouter();
  const { retireUser } = useUserStore();

  // フィルタリングされたユーザー一覧
  const filteredUsers = users.filter(user => {
    if (statusFilter === 'all') return true;
    return user.status === statusFilter;
  });

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // モックデータを使用（50人分）
        const mockUsers = generateMockUsers();
        setUsers(mockUsers);
      } catch (error) {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      
      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      throw error;
    }
  };

  const handleEditUser = async (userData: any) => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      
      const updatedUser = await response.json();
      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
    } catch (error) {
      throw error;
    }
  };

  const handleRetireUser = async (retiredDate: string, reason: string) => {
    if (!retiringUser) return;

    try {
      // Update the user in the store
      retireUser(
        retiringUser.id,
        retiredDate,
        reason as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other'
      );

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === retiringUser.id
          ? {
              ...u,
              status: 'retired' as const,
              retiredDate,
              retirementReason: reason as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other',
            }
          : u
      ));

      toast.success('退職処理が完了しました');
    } catch (error) {
      toast.error('退職処理に失敗しました');
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive',
      retired: 'outline',
    } as const;

    const labels = {
      active: '有効',
      inactive: '無効',
      suspended: '停止',
      retired: '退職',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'avatar',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <LazyAvatar
            src={user.avatar}
            alt={user.name}
            fallback={user.name.charAt(0)}
            className="h-8 w-8"
          />
        );
      },
    },
    {
      accessorKey: 'name',
      header: '氏名',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'department',
      header: '部署・役職',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <div className="font-medium">{user.department}</div>
            <div className="text-sm text-muted-foreground">{user.position}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: '連絡先',
      cell: ({ row }) => {
        const user = row.original;
        return user.phone ? (
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3" />
            {user.phone}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">未設定</span>
        );
      },
    },
    {
      accessorKey: 'roles',
      header: '権限',
      cell: ({ row }) => {
        const roles = row.original.roles;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'hireDate',
      header: '入社日',
      cell: ({ row }) => {
        const user = row.original;
        const hireDate = new Date(user.hireDate);
        return (
          <div>
            <div className="text-sm">{hireDate.toLocaleDateString('ja-JP')}</div>
            {user.status === 'retired' && user.retiredDate && (
              <div className="text-xs text-muted-foreground">
                退職: {new Date(user.retiredDate).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">メニューを開く</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  router.push(`/ja/users/${user.id}`);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                詳細表示
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditingUser(user);
                  setDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setRetiringUser(user);
                  setRetireDialogOpen(true);
                }}
                className="text-orange-600"
                disabled={user.status === 'retired'}
              >
                <UserX className="mr-2 h-4 w-4" />
                退職処理
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            システムに登録されているユーザーを管理します
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="active">有効のみ</SelectItem>
              <SelectItem value="retired">退職者のみ</SelectItem>
              <SelectItem value="inactive">無効のみ</SelectItem>
              <SelectItem value="suspended">停止のみ</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            インポート
          </Button>
          <Button
            onClick={() => {
              setEditingUser(undefined);
              setDialogOpen(true);
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            ユーザー追加
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">総ユーザー数</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
              <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">有効ユーザー</p>
              <p className="text-2xl font-bold">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
              <UserX className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">退職者</p>
              <p className="text-2xl font-bold">
                {users.filter(u => u.status === 'retired').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
              <UserPlus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">管理者</p>
              <p className="text-2xl font-bold">
                {users.filter(u => u.roles.includes('admin')).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <VirtualDataTable
            columns={columns}
            data={filteredUsers}
            searchKey="name"
            searchPlaceholder="ユーザー名またはメールアドレスで検索..."
            enableVirtualization={filteredUsers.length > 100}
            enableCaching={true}
            pageSize={50}
          />
        </div>
      </div>

      {/* User Form Dialog */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSubmit={editingUser ? handleEditUser : handleCreateUser}
      />

      {/* Retire User Dialog */}
      <RetireUserDialog
        open={retireDialogOpen}
        onOpenChange={setRetireDialogOpen}
        user={retiringUser}
        onConfirm={handleRetireUser}
      />
    </div>
  );
}