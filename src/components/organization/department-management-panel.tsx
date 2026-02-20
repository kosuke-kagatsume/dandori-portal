'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Plus, MoreHorizontal, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { DepartmentDialog, type Department } from './department-dialog';
import { DeleteDepartmentDialog } from './delete-department-dialog';

interface DepartmentManagementPanelProps {
  canEdit?: boolean;
}

export function DepartmentManagementPanel({ canEdit = true }: DepartmentManagementPanelProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ダイアログ状態
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<{ id: string; name: string } | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organization/departments');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '部門一覧の取得に失敗しました');
      }

      setDepartments(result.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      setError(error instanceof Error ? error.message : '部門一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // 親部門名を取得
  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = departments.find(d => d.id === parentId);
    return parent?.name || '-';
  };

  // 階層構造でソート
  const getSortedDepartments = () => {
    const result: (Department & { level: number })[] = [];

    const addWithLevel = (parentId: string | null, level: number) => {
      const children = departments
        .filter(d => d.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

      for (const child of children) {
        result.push({ ...child, level });
        addWithLevel(child.id, level + 1);
      }
    };

    addWithLevel(null, 0);
    return result;
  };

  const sortedDepartments = getSortedDepartments();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchDepartments} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              部門管理
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchDepartments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                更新
              </Button>
              {canEdit && (
                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  部門を追加
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedDepartments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">部門がまだ登録されていません</p>
              {canEdit && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  最初の部門を追加
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部門名</TableHead>
                  <TableHead>親部門</TableHead>
                  <TableHead className="text-center">表示順</TableHead>
                  <TableHead className="text-center">状態</TableHead>
                  {canEdit && <TableHead className="w-[80px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDepartments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* 階層インデント */}
                        {dept.level > 0 && (
                          <span className="text-muted-foreground" style={{ marginLeft: `${dept.level * 16}px` }}>
                            └
                          </span>
                        )}
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getParentName(dept.parentId)}
                    </TableCell>
                    <TableCell className="text-center">
                      {dept.sortOrder}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                        {dept.isActive ? '有効' : '無効'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingDepartment(dept)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingDepartment({ id: dept.id, name: dept.name })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 追加ダイアログ */}
      <DepartmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        departments={departments}
        onSuccess={fetchDepartments}
      />

      {/* 編集ダイアログ */}
      <DepartmentDialog
        open={!!editingDepartment}
        onOpenChange={(open) => !open && setEditingDepartment(null)}
        department={editingDepartment}
        departments={departments}
        onSuccess={fetchDepartments}
      />

      {/* 削除確認ダイアログ */}
      <DeleteDepartmentDialog
        open={!!deletingDepartment}
        onOpenChange={(open) => !open && setDeletingDepartment(null)}
        department={deletingDepartment}
        onSuccess={fetchDepartments}
      />
    </>
  );
}
