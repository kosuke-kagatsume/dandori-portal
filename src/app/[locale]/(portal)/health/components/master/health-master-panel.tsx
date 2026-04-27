'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Pencil, Trash2, Building, UserCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import { useUserStore } from '@/lib/store/user-store';
import type { HealthMedicalInstitution } from '@/types/health';
import { InstitutionDialog } from './institution-dialog';
import { SpecialWorkerList } from './special-worker-list';
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

export function HealthMasterPanel() {
  const currentUser = useUserStore((state) => state.currentUser);
  const tenantId = currentUser?.tenantId;

  const {
    medicalInstitutions,
    isLoading,
    setTenantId,
    fetchAll,
    deleteMedicalInstitution,
  } = useHealthMasterStore();

  // ダイアログ状態
  const [showInstDialog, setShowInstDialog] = useState(false);
  const [selectedInst, setSelectedInst] = useState<HealthMedicalInstitution | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'institution'; id: string; name: string } | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    if (tenantId) {
      setTenantId(tenantId);
      fetchAll();
    }
  }, [tenantId, setTenantId, fetchAll]);

  const handleEditInst = (inst: HealthMedicalInstitution) => {
    setSelectedInst(inst);
    setShowInstDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMedicalInstitution(deleteTarget.id);
      toast.success('医療機関を削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error((error as Error).message || '削除に失敗しました');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="special-workers">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="special-workers" className="gap-2">
            <UserCheck className="h-4 w-4" />
            特定業務従事者
          </TabsTrigger>
          <TabsTrigger value="institutions" className="gap-2">
            <Building className="h-4 w-4" />
            医療機関
          </TabsTrigger>
        </TabsList>

        {/* 特定業務従事者一覧 */}
        <TabsContent value="special-workers">
          <SpecialWorkerList />
        </TabsContent>

        {/* 医療機関マスタ */}
        <TabsContent value="institutions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>医療機関マスタ</CardTitle>
                  <CardDescription>健診を受ける医療機関を管理します</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchAll()} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    更新
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedInst(undefined);
                      setShowInstDialog(true);
                    }}
                  >
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
                    <TableHead>医療機関名</TableHead>
                    <TableHead>コード</TableHead>
                    <TableHead>地域</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>メール</TableHead>
                    <TableHead>住所</TableHead>
                    <TableHead>電話番号</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicalInstitutions.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">{inst.name}</TableCell>
                      <TableCell>
                        {inst.code ? (
                          <code className="text-sm bg-muted px-1 rounded">{inst.code}</code>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{inst.region || '-'}</TableCell>
                      <TableCell>{inst.contactPerson || '-'}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[180px] truncate">
                        {inst.email || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {inst.address || '-'}
                      </TableCell>
                      <TableCell>{inst.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={inst.isActive ? 'default' : 'secondary'}>
                          {inst.isActive ? '有効' : '無効'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditInst(inst)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget({ type: 'institution', id: inst.id, name: inst.name })}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {medicalInstitutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        医療機関がありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 医療機関ダイアログ */}
      <InstitutionDialog
        open={showInstDialog}
        onOpenChange={setShowInstDialog}
        editItem={selectedInst}
        onSuccess={() => fetchAll()}
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
