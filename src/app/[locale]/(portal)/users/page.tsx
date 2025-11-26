'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { generateMockUsers } from '@/lib/mock-data';
import { useIsMounted } from '@/hooks/useIsMounted';
import {
  MoreHorizontal,
  Download,
  Upload,
  UserPlus,
  Mail,
  Phone,
  Edit,
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
import { useUserStore } from '@/lib/store/user-store';
import { toast } from 'sonner';
import type { User } from '@/types';
import { exportUsersToCSV } from '@/lib/csv/csv-export';

// ダイアログの遅延読み込み
const RetireUserDialog = dynamic(() => import('@/features/users/retire-user-dialog').then(mod => ({ default: mod.RetireUserDialog })), { ssr: false });
const InviteUserDialog = dynamic(() => import('@/features/users/invite-user-dialog').then(mod => ({ default: mod.InviteUserDialog })), { ssr: false });

export default function UsersPage() {
  const mounted = useIsMounted();

  // const t = useTranslations('users');
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'title': 'ユーザー管理',
    };
    return translations[key] || key;
  };
  const [loading, setLoading] = useState(true);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [retiringUser, setRetiringUser] = useState<User | undefined>();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [importInputRef, setImportInputRef] = useState<HTMLInputElement | null>(null);

  const router = useRouter();
  const { users, setUsers, addUser, retireUser } = useUserStore();

  // フィルタリングされたユーザー一覧（useMemoでメモ化）
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter === 'all') return true;
      return user.status === statusFilter;
    });
  }, [users, statusFilter]);

  // 統計情報のメモ化
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    retired: users.filter(u => u.status === 'retired').length,
    admin: users.filter(u => u.roles?.includes('admin')).length,
  }), [users]);

  // Load users from store (already loaded via zustand persist)
  useEffect(() => {
    // ユーザーストアが空の場合、デモデータを生成
    if (users.length === 0) {
      console.log('[Demo] Generating initial user data...');
      const mockUsers = generateMockUsers(50); // 50人のデモユーザーを生成
      setUsers(mockUsers);
    }
    setLoading(false);
  }, [users.length, setUsers]);

  const handleRetireUser = async (retiredDate: string, reason: string) => {
    if (!retiringUser) return;

    try {
      // API経由で退職処理
      const response = await fetch(`/api/users/${retiringUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'retired',
          retiredDate,
          retirementReason: reason,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to retire user');
      }

      // ストアも更新
      retireUser(
        retiringUser.id,
        retiredDate,
        reason as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other'
      );

      // ローカルステートを更新
      setUsers(prev => prev.map(u => u.id === retiringUser.id ? result.data : u));

      toast.success('退職処理が完了しました');
    } catch (error) {
      console.error('Error retiring user:', error);
      toast.error('退職処理に失敗しました');
      throw error;
    }
  };

  const handleExportCSV = () => {
    try {
      const result = exportUsersToCSV(filteredUsers);
      if (result.success) {
        toast.success(`CSV出力完了: ${result.recordCount}件`);
      } else {
        toast.error(result.error || 'CSV出力に失敗しました');
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('CSV出力に失敗しました');
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('CSVファイルを選択してください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          toast.error('CSVファイルが空です');
          return;
        }

        // ヘッダー行をスキップ
        const dataLines = lines.slice(1);
        const importedUsers: User[] = [];
        let errorCount = 0;

        dataLines.forEach((line, index) => {
          try {
            // CSV行をパース（カンマで分割、引用符考慮）
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

            if (cleanValues.length < 6) {
              errorCount++;
              return;
            }

            const [id, name, email, phone, department, position, hireDate, status, roles] = cleanValues;

            const user: User = {
              id: id || `imported-${Date.now()}-${index}`,
              tenantId: 'tenant-demo-001',
              name: name || '',
              email: email || '',
              phone: phone || '',
              department: department || '',
              position: position || '',
              hireDate: hireDate || new Date().toISOString().split('T')[0],
              status: (status as 'active' | 'inactive' | 'suspended' | 'retired') || 'active',
              roles: roles ? roles.split(';') : ['user'],
              unitId: '1',
              timezone: 'Asia/Tokyo',
              avatar: '',
            };

            // 基本的なバリデーション
            if (user.name && user.email) {
              importedUsers.push(user);
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Line ${index + 2} parse error:`, error);
            errorCount++;
          }
        });

        if (importedUsers.length > 0) {
          // 既存のユーザーと重複チェック（メールアドレスで）
          const existingEmails = new Set(users.map(u => u.email));
          const newUsers = importedUsers.filter(u => !existingEmails.has(u.email));

          if (newUsers.length > 0) {
            setUsers([...users, ...newUsers]);
            toast.success(`${newUsers.length}件のユーザーをインポートしました${errorCount > 0 ? ` (${errorCount}件のエラーをスキップ)` : ''}`);
          } else {
            toast.warning('すべてのユーザーが既に登録されています');
          }
        } else {
          toast.error(`インポートに失敗しました (${errorCount}件のエラー)`);
        }

        // input要素をリセット
        if (event.target) {
          event.target.value = '';
        }
      } catch (error) {
        console.error('Failed to import CSV:', error);
        toast.error('CSVの読み込みに失敗しました');
      }
    };

    reader.onerror = () => {
      toast.error('ファイルの読み込みに失敗しました');
    };

    reader.readAsText(file, 'UTF-8');
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
        const roles = row.original.roles || ['user'];
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

  // SSR時は何も表示しない
  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight whitespace-nowrap">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">
            システムに登録されているユーザーを管理します
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => importInputRef?.click()}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            インポート
          </Button>
          <input
            ref={(el) => setImportInputRef(el)}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            style={{ display: 'none' }}
          />
          <Button
            onClick={() => setInviteDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            ユーザー招待
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                {stats.retired}
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
                {stats.admin}
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

      {/* Retire User Dialog */}
      <RetireUserDialog
        open={retireDialogOpen}
        onOpenChange={setRetireDialogOpen}
        user={retiringUser}
        onConfirm={handleRetireUser}
      />

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteSuccess={(user) => {
          // 招待されたユーザーをリストに追加
          addUser({
            id: user.id,
            name: user.name,
            email: user.email,
            status: 'active',
            roles: ['user'],
            department: user.department || '',
            position: user.position || '',
            hireDate: new Date().toISOString().split('T')[0],
            phone: '',
            unitId: '1',
            timezone: 'Asia/Tokyo',
            avatar: '',
          });
        }}
      />
    </div>
  );
}