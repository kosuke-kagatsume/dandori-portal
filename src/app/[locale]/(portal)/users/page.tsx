'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
// import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VirtualDataTable } from '@/components/ui/common/virtual-data-table';
import { useUserStore } from '@/lib/store/user-store';
import { toast } from 'sonner';
import type { User } from '@/types';
import { exportUsersToCSV } from '@/lib/csv/csv-export';

// ダイアログの遅延読み込み
const RetireUserDialog = dynamic(() => import('@/features/users/retire-user-dialog').then(mod => ({ default: mod.RetireUserDialog })), { ssr: false });
const UserFormDialog = dynamic(() => import('@/features/users/user-form-dialog').then(mod => ({ default: mod.UserFormDialog })), { ssr: false });

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [importInputRef, setImportInputRef] = useState<HTMLInputElement | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const router = useRouter();
  const { users, setUsers, retireUser } = useUserStore();

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

  // currentUserからtenantIdを取得
  const currentUser = useUserStore(state => state.currentUser);
  const tenantId = currentUser?.tenantId || '';

  // 人事(hr)のみ編集可能。経営者・システム管理者は閲覧のみ
  const isHR = currentUser?.roles?.includes('hr');
  const isAdmin = currentUser?.roles?.includes('admin');
  const isReadOnly = !isHR;
  // エクスポート・インポートはadminまたはhrのみ
  const canExportImport = isHR || isAdmin;

  // APIからユーザーを取得
  const fetchUsers = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        const apiUsers: User[] = data.data || [];
        setUsers(apiUsers);
      }
    } catch (error) {
      console.error('ユーザーデータの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, setUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

      // HTTPステータスコードをチェック
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: Failed to retire user`);
      }

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
      setUsers(users.map((u) => (u.id === retiringUser.id ? result.data : u)));

      toast.success('退職処理が完了しました');
    } catch (error) {
      console.error('Error retiring user:', error);
      toast.error(error instanceof Error ? error.message : '退職処理に失敗しました');
      throw error;
    }
  };

  // ユーザー編集ハンドラー
  const handleEditUser = async (data: {
    name: string;
    nameKana?: string;
    employeeNumber?: string;
    email: string;
    phone?: string;
    department?: string;
    position?: string;
    departmentId: string;
    positionId: string;
    employmentType?: string;
    hireDate: Date;
    status: 'active' | 'inactive' | 'suspended' | 'retired';
    roles: string[];
  }) => {
    if (!editingUser) return;

    try {
      // 日付をローカルタイムゾーンで YYYY-MM-DD 形式に変換（UTCへの変換を回避）
      const hireDateStr = `${data.hireDate.getFullYear()}-${String(data.hireDate.getMonth() + 1).padStart(2, '0')}-${String(data.hireDate.getDate()).padStart(2, '0')}`;

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          nameKana: data.nameKana,
          employeeNumber: data.employeeNumber,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          departmentId: data.departmentId,
          positionId: data.positionId,
          employmentType: data.employmentType,
          hireDate: hireDateStr,
          status: data.status,
          roles: data.roles,
        }),
      });

      // HTTPステータスコードをチェック
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: Failed to update user`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      // ストアを更新
      setUsers(users.map((u) => (u.id === editingUser.id ? result.data : u)));
      toast.success('ユーザー情報を更新しました');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'ユーザー情報の更新に失敗しました');
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

  // CSV行を正しくパース（空セルも保持する）
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    values.push(current.trim());
    return values;
  };

  // ステータスラベル → 内部値の逆引き
  const reverseStatusLabel = (label: string): 'active' | 'inactive' | 'suspended' | 'retired' => {
    const reverseMap: Record<string, 'active' | 'inactive' | 'suspended' | 'retired'> = {
      '有効': 'active', '無効': 'inactive', '停止': 'suspended', '退職': 'retired',
      '在籍中': 'active', '入社予定': 'inactive', '休職中': 'suspended', '退職済み': 'retired',
      'active': 'active', 'inactive': 'inactive', 'suspended': 'suspended', 'retired': 'retired',
    };
    return reverseMap[label] || 'active';
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('CSVファイルを選択してください');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = (e.target?.result as string).replace(/^\uFEFF/, '');
        const lines = text.split(/\r?\n/).filter(line => line.trim());

        if (lines.length < 2) {
          toast.error('CSVファイルが空です');
          return;
        }

        // ヘッダー行をスキップ（※付きヘッダーも対応）
        const dataLines = lines.slice(1);
        const importedUsers: User[] = [];
        let errorCount = 0;

        dataLines.forEach((line, index) => {
          try {
            const cleanValues = parseCSVLine(line);

            if (cleanValues.length < 6) {
              errorCount++;
              return;
            }

            // CSV形式: 従業員ID,※社員番号,※氏名,フリガナ,※メール,電話,※部署,※役職,雇用形態,入社日,生年月日,性別,郵便番号,住所,ステータス,退職日,退職理由,※役割,招待
            const [id, employeeNumber, name, nameKana, email, phone, department, position, employmentType, hireDate, birthDate, gender, postalCode, address, status, retiredDate, retirementReason, roles, invite] = cleanValues;

            // 日付形式の正規化（yyyy/mm/dd → yyyy-mm-dd）
            const normalizeDate = (d: string | undefined) => d ? d.replace(/\//g, '-') : undefined;

            const user: User = {
              id: id || `imported-${Date.now()}-${index}`,
              tenantId: currentUser?.tenantId || '',
              name: name || '',
              nameKana: nameKana || '',
              employeeNumber: employeeNumber || '',
              email: email || '',
              phone: phone || '',
              department: department || '',
              position: position || '',
              employmentType: employmentType || '',
              hireDate: normalizeDate(hireDate) || '',
              birthDate: normalizeDate(birthDate) || undefined,
              gender: (gender === '男' ? 'male' : gender === '女' ? 'female' : gender as 'male' | 'female' | 'other' | 'prefer_not_to_say') || undefined,
              postalCode: postalCode || '',
              address: address || '',
              status: reverseStatusLabel(status || ''),
              retiredDate: normalizeDate(retiredDate) || undefined,
              retirementReason: (['voluntary', 'company', 'contract_end', 'retirement_age', 'other'].includes(retirementReason || '') ? retirementReason as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other' : undefined),
              roles: roles ? roles.split(/[;,]/).map(r => r.trim()).filter(Boolean) : ['employee'],
              unitId: undefined,
              timezone: 'Asia/Tokyo',
              avatar: '',
            };

            // 招待フラグを判定
            const shouldInvite = invite?.toUpperCase() === 'TRUE' || invite === '✓' || invite === '☑';
            // @ts-expect-error _invite is a temporary flag for import processing
            user._invite = shouldInvite;

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
          // 社員番号またはメールアドレスで既存ユーザーとマッチング
          const existingByEmail = new Map(users.map(u => [u.email, u]));
          const existingByEmpNo = new Map(
            users.filter(u => u.employeeNumber).map(u => [u.employeeNumber!, u])
          );

          const newUsers: User[] = [];
          const updatedUsers: User[] = [];

          importedUsers.forEach(imported => {
            // 社員番号一致 → メール一致の順で既存ユーザーを検索
            const existing = (imported.employeeNumber && existingByEmpNo.get(imported.employeeNumber))
              || existingByEmail.get(imported.email);

            if (existing) {
              // 既存ユーザーを上書き更新
              updatedUsers.push({ ...existing, ...imported, id: existing.id });
            } else {
              newUsers.push(imported);
            }
          });

          if (newUsers.length > 0 || updatedUsers.length > 0) {
            // DB APIに永続化（レート制限対策: リトライ付き、リクエスト間に遅延）
            let apiErrorCount = 0;
            const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

            const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2): Promise<Response> => {
              for (let attempt = 0; attempt <= maxRetries; attempt++) {
                const res = await fetch(url, options);
                if (res.ok || (res.status !== 401 && res.status !== 429 && res.status !== 503)) {
                  return res;
                }
                if (attempt < maxRetries) {
                  await delay(500 * (attempt + 1));
                }
              }
              return fetch(url, options);
            };

            for (const user of updatedUsers) {
              try {
                const res = await fetchWithRetry(`/api/users/${user.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: user.name,
                    nameKana: user.nameKana,
                    employeeNumber: user.employeeNumber,
                    email: user.email,
                    phone: user.phone,
                    department: user.department,
                    position: user.position,
                    employmentType: user.employmentType,
                    hireDate: user.hireDate,
                    birthDate: user.birthDate || undefined,
                    gender: user.gender || undefined,
                    postalCode: user.postalCode || undefined,
                    address: user.address || undefined,
                    status: user.status,
                    retiredDate: user.retiredDate || undefined,
                    retirementReason: user.retirementReason || undefined,
                    roles: user.roles?.length ? user.roles : undefined,
                  }),
                });
                if (!res.ok) {
                  const errBody = await res.json().catch(() => null);
                  console.error(`Import PATCH error for ${user.name} (${user.id}):`, res.status, errBody);
                  apiErrorCount++;
                }
                // レート制限回避のため少し待つ
                await delay(50);
              } catch (err) {
                console.error(`Import PATCH exception for ${user.name}:`, err);
                apiErrorCount++;
              }
            }

            // 新規ユーザーもAPIで作成（招待フラグ付きは招待APIを使用）
            let inviteCount = 0;
            for (const user of newUsers) {
              try {
                // @ts-expect-error _invite is a temporary flag for import processing
                const shouldInvite = user._invite === true;
                if (shouldInvite) {
                  // 招待API: ユーザー作成 + パスワード生成 + メール送信
                  const res = await fetchWithRetry('/api/admin/invite-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: user.email,
                      name: user.name,
                      role: user.roles?.[0] || 'employee',
                      roles: user.roles,
                      department: user.department,
                      position: user.position,
                      employeeNumber: user.employeeNumber,
                      employmentType: user.employmentType,
                      hireDate: user.hireDate,
                      tenantId: currentUser?.tenantId || tenantId,
                    }),
                  });
                  if (!res.ok) {
                    const errBody = await res.json().catch(() => null);
                    console.error(`Import invite error for ${user.name}:`, res.status, errBody);
                    apiErrorCount++;
                  } else {
                    inviteCount++;
                  }
                } else {
                  // 通常の作成
                  const res = await fetchWithRetry('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...user,
                      tenantId: currentUser?.tenantId || tenantId,
                    }),
                  });
                  if (!res.ok) {
                    const errBody = await res.json().catch(() => null);
                    console.error(`Import POST error for ${user.name}:`, res.status, errBody);
                    apiErrorCount++;
                  }
                }
                await delay(50);
              } catch (err) {
                console.error(`Import POST exception for ${user.name}:`, err);
                apiErrorCount++;
              }
            }

            // DB保存後にリフレッシュ
            await fetchUsers();

            const parts: string[] = [];
            if (newUsers.length > 0) parts.push(`${newUsers.length}件を新規追加`);
            if (inviteCount > 0) parts.push(`${inviteCount}件に招待メール送信`);
            if (updatedUsers.length > 0) parts.push(`${updatedUsers.length}件を更新`);
            if (apiErrorCount > 0) parts.push(`${apiErrorCount}件のAPI保存エラー`);
            if (errorCount > 0) parts.push(`${errorCount}件のパースエラー`);
            toast.success(`インポート完了: ${parts.join('、')}`);
          } else {
            toast.warning('インポート対象のデータがありません');
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
      active: '在籍中',
      inactive: '入社予定',
      suspended: '休職中',
      retired: '退職済み',
    } as const;

    // 日本語ラベルや不明値が入っている場合の逆引き
    const normalized = reverseStatusLabel(status);

    return (
      <Badge variant={variants[normalized] || 'outline'}>
        {labels[normalized] || status || '不明'}
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
              {/* 人事以外は編集・退職処理不可 */}
              {!isReadOnly && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingUser(user);
                      setEditDialogOpen(true);
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
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
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

  // SSR時は何も表示しない
  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('title')}</h1>
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
              <SelectItem value="active">在籍中</SelectItem>
              <SelectItem value="retired">退職済み</SelectItem>
              <SelectItem value="inactive">入社予定</SelectItem>
              <SelectItem value="suspended">休職中</SelectItem>
            </SelectContent>
          </Select>
          {/* admin/hrのみエクスポート・インポート表示 */}
          {canExportImport && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                エクスポート
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                インポート
              </Button>
              <input
                ref={(el) => setImportInputRef(el)}
                type="file"
                accept=".csv"
                onChange={(e) => { handleImportCSV(e); setImportDialogOpen(false); }}
                style={{ display: 'none' }}
              />
            </>
          )}
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
              <p className="text-sm font-medium text-muted-foreground">在籍中</p>
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

      {/* Edit User Dialog */}
      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={editingUser}
        onSubmit={handleEditUser}
      />

      {/* CSV Import Instructions Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>ユーザーを一括登録</DialogTitle>
            <DialogDescription>CSVファイルを選択してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>一括登録用のCSVファイルは、[エクスポート]ボタンで出力できます。</li>
              <li>1行目のヘッダ列を削除すると、登録できません。</li>
              <li>※は必須項目となります。</li>
              <li>部署、役職列は、設定＞マスタ管理に登録している名称と一致させてください。</li>
              <li>権限列には「admin」「executive」「manager」「hr」「employee」を半角英字で入力してください。</li>
              <li>＜任意項目＞招待メールを送りたいユーザーの招待列に「TRUE」を入力してください。</li>
              <li>＜任意項目＞日付は「YYYY/MM/DD」形式で入力してください。</li>
              <li>＜任意項目＞フリガナは全角カタカナで入力してください。</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => importInputRef?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              ファイルを選択
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}