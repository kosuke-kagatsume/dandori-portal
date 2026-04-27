'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useIsMounted } from '@/hooks/useIsMounted';
import { UserPlus, Download, Upload, UserX, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VirtualDataTable } from '@/components/ui/common/virtual-data-table';
import { useUserStore } from '@/lib/store/user-store';
import { toast } from 'sonner';
import type { User } from '@/types';
import { exportUsersToCSV } from '@/lib/csv/csv-export';
import { parseCSVUsers, submitImportedUsers, type ImportError } from '@/lib/users/csv-import';
import { createUserColumns } from '@/features/users/user-table-columns';

// ダイアログの遅延読み込み
const RetireUserDialog = dynamic(() => import('@/features/users/retire-user-dialog').then(mod => ({ default: mod.RetireUserDialog })), { ssr: false });
const UserFormDialog = dynamic(() => import('@/features/users/user-form-dialog').then(mod => ({ default: mod.UserFormDialog })), { ssr: false });

export default function UsersPage() {
  const mounted = useIsMounted();

  const t = (key: string) => {
    const translations: Record<string, string> = { 'title': 'ユーザー管理' };
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
  const [importErrorDialogOpen, setImportErrorDialogOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [resetTargetUser, setResetTargetUser] = useState<User | undefined>();
  const [resetSending, setResetSending] = useState(false);

  const router = useRouter();
  const { users, setUsers, retireUser } = useUserStore();

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter === 'all') return true;
      return user.status === statusFilter;
    });
  }, [users, statusFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    retired: users.filter(u => u.status === 'retired').length,
    admin: users.filter(u => u.roles?.includes('admin')).length,
  }), [users]);

  const currentUser = useUserStore(state => state.currentUser);
  const tenantId = currentUser?.tenantId || '';

  const isHR = currentUser?.roles?.includes('hr');
  const isAdmin = currentUser?.roles?.includes('admin');
  const isReadOnly = !isHR;
  const canExportImport = isHR || isAdmin;

  // APIからユーザーを取得
  const fetchUsers = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const response = await fetch(`/api/users?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('ユーザーデータの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, setUsers]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRetireUser = async (retiredDate: string, reason: string) => {
    if (!retiringUser) return;
    try {
      const response = await fetch(`/api/users/${retiringUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'retired', retiredDate, retirementReason: reason }),
      });
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: Failed to retire user`);
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to retire user');

      retireUser(retiringUser.id, retiredDate, reason as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other');
      setUsers(users.map((u) => (u.id === retiringUser.id ? result.data : u)));
      toast.success('退職処理が完了しました');
    } catch (error) {
      console.error('Error retiring user:', error);
      toast.error(error instanceof Error ? error.message : '退職処理に失敗しました');
      throw error;
    }
  };

  const handleEditUser = async (data: {
    name: string; nameKana?: string; employeeNumber?: string; email: string; phone?: string;
    department?: string; position?: string; departmentId: string; positionId: string;
    employmentType?: string; hireDate: Date; status: 'active' | 'inactive' | 'suspended' | 'retired'; roles: string[];
  }) => {
    if (!editingUser) return;
    try {
      const hireDateStr = `${data.hireDate.getFullYear()}-${String(data.hireDate.getMonth() + 1).padStart(2, '0')}-${String(data.hireDate.getDate()).padStart(2, '0')}`;
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name, nameKana: data.nameKana, employeeNumber: data.employeeNumber,
          email: data.email, phone: data.phone, department: data.department, position: data.position,
          departmentId: data.departmentId, positionId: data.positionId, employmentType: data.employmentType,
          hireDate: hireDateStr, status: data.status, roles: data.roles,
        }),
      });
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: Failed to update user`);
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to update user');

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

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('CSVファイルを選択してください'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const { users: importedUsers, errors, errorCount } = parseCSVUsers(text, tenantId);

        if (importedUsers.length > 0) {
          const { newCount, updateCount, inviteCount, apiErrors } = await submitImportedUsers(importedUsers, users, tenantId);
          await fetchUsers();

          const allErrors = [...errors, ...apiErrors];
          const parts: string[] = [];
          if (newCount > 0) parts.push(`${newCount}件を新規追加`);
          if (inviteCount > 0) parts.push(`${inviteCount}件に招待メール送信`);
          if (updateCount > 0) parts.push(`${updateCount}件を更新`);
          if (apiErrors.length > 0) parts.push(`${apiErrors.length}件のAPI保存エラー`);
          if (errorCount > 0) parts.push(`${errorCount}件のパースエラー`);

          if (allErrors.length > 0) {
            setImportErrors(allErrors);
            setImportErrorDialogOpen(true);
            toast.warning(`インポート完了（エラーあり）: ${parts.join('、')}`);
          } else {
            toast.success(`インポート完了: ${parts.join('、')}`);
          }
        } else {
          if (errors.length > 0) {
            setImportErrors(errors);
            setImportErrorDialogOpen(true);
          }
          toast.error(`インポートに失敗しました (${errorCount}件のエラー)`);
        }

        if (event.target) event.target.value = '';
      } catch (error) {
        console.error('Failed to import CSV:', error);
        toast.error('CSVの読み込みに失敗しました');
      }
    };
    reader.onerror = () => { toast.error('ファイルの読み込みに失敗しました'); };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSendPasswordReset = useCallback(async () => {
    if (!resetTargetUser) return;
    setResetSending(true);
    try {
      const res = await fetch('/api/admin/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetTargetUser.id, locale: 'ja' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'メール送信に失敗しました');
      }
      toast.success(data.message || 'パスワード再設定メールを送信しました');
      setResetTargetUser(undefined);
    } catch (error) {
      toast.error((error as Error).message || 'メール送信に失敗しました');
    } finally {
      setResetSending(false);
    }
  }, [resetTargetUser]);

  const columns = useMemo(() => createUserColumns({
    onView: (user) => router.push(`/ja/users/${user.id}`),
    onEdit: (user) => { setEditingUser(user); setEditDialogOpen(true); },
    onRetire: (user) => { setRetiringUser(user); setRetireDialogOpen(true); },
    onSendPasswordReset: isReadOnly ? undefined : (user) => setResetTargetUser(user),
    isReadOnly,
  }), [router, isReadOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">システムに登録されているユーザーを管理します</p>
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
          {canExportImport && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />エクスポート
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />インポート
              </Button>
              <input
                ref={(el) => setImportInputRef(el)}
                type="file" accept=".csv"
                onChange={(e) => { handleImportCSV(e); setImportDialogOpen(false); }}
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '総ユーザー数', value: stats.total, color: 'blue', Icon: UserPlus },
          { label: '在籍中', value: stats.active, color: 'green', Icon: UserPlus },
          { label: '退職者', value: stats.retired, color: 'orange', Icon: UserX },
          { label: '管理者', value: stats.admin, color: 'yellow', Icon: UserPlus },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center space-x-2">
              <div className={`rounded-full bg-${color}-100 p-2 dark:bg-${color}-900`}>
                <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </div>
          </div>
        ))}
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

      {/* Retire / Edit Dialogs */}
      <RetireUserDialog open={retireDialogOpen} onOpenChange={setRetireDialogOpen} user={retiringUser} onConfirm={handleRetireUser} />
      <UserFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} user={editingUser} onSubmit={handleEditUser} />

      {/* パスワード再設定メール送信確認 */}
      <AlertDialog open={!!resetTargetUser} onOpenChange={(open) => !open && setResetTargetUser(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>パスワード再設定メールを送信</AlertDialogTitle>
            <AlertDialogDescription>
              {resetTargetUser?.name}（{resetTargetUser?.email}）宛に、パスワード再設定用のリンクを送信します。
              <br />
              リンクの有効期限は1時間です。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetSending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleSendPasswordReset(); }} disabled={resetSending}>
              {resetSending ? '送信中...' : '送信する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>キャンセル</Button>
            <Button onClick={() => importInputRef?.click()}>
              <Upload className="mr-2 h-4 w-4" />ファイルを選択
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Error Detail Dialog */}
      <Dialog open={importErrorDialogOpen} onOpenChange={setImportErrorDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>インポートエラー詳細</DialogTitle>
            <DialogDescription>{importErrors.length}件のエラーが発生しました。内容を確認して修正してください。</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground w-16">行</th>
                  <th className="text-left p-2 font-medium text-muted-foreground w-32">対象</th>
                  <th className="text-left p-2 font-medium text-muted-foreground w-28">項目</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">エラー内容</th>
                </tr>
              </thead>
              <tbody>
                {importErrors.map((err, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2 text-muted-foreground">{err.row > 0 ? err.row : '-'}</td>
                    <td className="p-2">{err.name || '-'}</td>
                    <td className="p-2">{err.field}</td>
                    <td className="p-2 text-destructive">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button onClick={() => setImportErrorDialogOpen(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
