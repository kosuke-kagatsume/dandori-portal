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
import { Plus, Pencil, Trash2, Building, Stethoscope, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useHealthMasterStore } from '@/lib/store/health-master-store';
import { useUserStore } from '@/lib/store/user-store';
import type { HealthCheckupType, HealthMedicalInstitution } from '@/types/health';
import { CheckupTypeDialog } from './checkup-type-dialog';
import { InstitutionDialog } from './institution-dialog';
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
  const tenantId = currentUser?.tenantId || 'tenant-1';

  const {
    checkupTypes,
    medicalInstitutions,
    isLoading,
    setTenantId,
    fetchAll,
    deleteCheckupType,
    deleteMedicalInstitution,
  } = useHealthMasterStore();

  // ダイアログ状態
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showInstDialog, setShowInstDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<HealthCheckupType | undefined>();
  const [selectedInst, setSelectedInst] = useState<HealthMedicalInstitution | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'checkupType' | 'institution'; id: string; name: string } | null>(null);

  // 初期データ読み込み
  useEffect(() => {
    if (tenantId) {
      setTenantId(tenantId);
      fetchAll();
    }
  }, [tenantId, setTenantId, fetchAll]);

  const handleEditType = (type: HealthCheckupType) => {
    setSelectedType(type);
    setShowTypeDialog(true);
  };

  const handleEditInst = (inst: HealthMedicalInstitution) => {
    setSelectedInst(inst);
    setShowInstDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'checkupType') {
        await deleteCheckupType(deleteTarget.id);
        toast.success('健診種別を削除しました');
      } else {
        await deleteMedicalInstitution(deleteTarget.id);
        toast.success('医療機関を削除しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="checkup-types">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="checkup-types" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            健診種別
          </TabsTrigger>
          <TabsTrigger value="institutions" className="gap-2">
            <Building className="h-4 w-4" />
            医療機関
          </TabsTrigger>
        </TabsList>

        {/* 健診種別マスタ */}
        <TabsContent value="checkup-types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>健診種別マスタ</CardTitle>
                  <CardDescription>健康診断の種別を管理します</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchAll()} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    更新
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedType(undefined);
                      setShowTypeDialog(true);
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
                    <TableHead>種別名</TableHead>
                    <TableHead>コード</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkupTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 rounded">{type.code}</code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{type.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={type.isActive ? 'default' : 'secondary'}>
                          {type.isActive ? '有効' : '無効'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditType(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget({ type: 'checkupType', id: type.id, name: type.name })}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {checkupTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        健診種別がありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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

      {/* 健診種別ダイアログ */}
      <CheckupTypeDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        editItem={selectedType}
        onSuccess={() => fetchAll()}
      />

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
