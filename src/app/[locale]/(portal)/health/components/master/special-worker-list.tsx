'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Plus, Trash2, RefreshCw, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store/user-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SpecialWorker {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  employeeNumber: string | null;
  lastCheckupDate: string | null;
}

export function SpecialWorkerList() {
  const currentUser = useUserStore((state) => state.currentUser);
  const tenantId = currentUser?.tenantId;
  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);

  const [workers, setWorkers] = useState<SpecialWorker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<SpecialWorker | null>(null);

  const fetchWorkers = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/health/special-workers?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.data || []);
      }
    } catch {
      toast.error('特定業務従事者の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchWorkers();
    if (users.length === 0) fetchUsers();
  }, [fetchWorkers]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddWorker = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpecialWorker: true }),
      });
      if (!res.ok) throw new Error();
      toast.success('特定業務従事者に追加しました');
      setShowAddDialog(false);
      fetchWorkers();
    } catch {
      toast.error('追加に失敗しました');
    }
  };

  const handleRemoveWorker = async () => {
    if (!removeTarget) return;
    try {
      const res = await fetch(`/api/users/${removeTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpecialWorker: false }),
      });
      if (!res.ok) throw new Error();
      toast.success('特定業務従事者から解除しました');
      setRemoveTarget(null);
      fetchWorkers();
    } catch {
      toast.error('解除に失敗しました');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未受診';
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 追加候補: isSpecialWorker=false のユーザー（既に追加済みを除外）
  const workerIds = new Set(workers.map((w) => w.id));
  const addCandidates = users.filter(
    (u) => !workerIds.has(u.id) && u.status !== 'retired'
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>特定業務従事者一覧</CardTitle>
            <CardDescription>特定業務に従事する従業員を管理します（6ヶ月ごとの健康診断義務）</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchWorkers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>社員番号</TableHead>
              <TableHead>部署・役職</TableHead>
              <TableHead>前回受診日</TableHead>
              <TableHead>受診状況</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((w) => {
              const monthsElapsed = w.lastCheckupDate
                ? (Date.now() - new Date(w.lastCheckupDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                : -1;
              const isOverdue = monthsElapsed >= 6 || monthsElapsed < 0;
              const isWarning = monthsElapsed >= 5 && monthsElapsed < 6;

              return (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell>{w.employeeNumber || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[w.department, w.position].filter(Boolean).join(' / ') || '-'}
                  </TableCell>
                  <TableCell>{formatDate(w.lastCheckupDate)}</TableCell>
                  <TableCell>
                    {isOverdue ? (
                      <Badge variant="destructive">要受診</Badge>
                    ) : isWarning ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        期限間近
                      </Badge>
                    ) : (
                      <Badge variant="default">正常</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveTarget(w)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  特定業務従事者がいません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* 追加ダイアログ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              特定業務従事者を追加
            </DialogTitle>
            <DialogDescription>
              従業員を検索して追加してください
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border">
            <CommandInput placeholder="氏名で検索..." />
            <CommandList>
              <CommandEmpty>該当する従業員がいません</CommandEmpty>
              <CommandGroup>
                {addCandidates.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={`${u.name} ${u.department || ''}`}
                    onSelect={() => handleAddWorker(u.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="font-medium">{u.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {u.department || ''}
                        </span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>特定業務従事者の解除</AlertDialogTitle>
            <AlertDialogDescription>
              「{removeTarget?.name}」を特定業務従事者から解除しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveWorker} className="bg-red-600 hover:bg-red-700">
              解除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
