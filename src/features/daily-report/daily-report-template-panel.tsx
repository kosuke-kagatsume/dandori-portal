'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DailyReportTemplate, DailyReportTemplateInput } from '@/lib/store/daily-report-template-store';
import type { TemplateFormData } from '@/lib/daily-report/template-helpers';
import { SUBMISSION_RULE_LABELS, defaultTemplateForm } from '@/lib/daily-report/template-helpers';
import { TemplateFormDialog } from '@/features/daily-report/template-form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store/user-store';
import { useMasterDataStore } from '@/lib/store/master-data-store';
import { useDailyReportTemplateStore } from '@/lib/store/daily-report-template-store';
import { useOrganizationStore } from '@/lib/store/organization-store';

// === メインコンポーネント ===

export function DailyReportTemplateMasterPanel() {
  const currentUser = useUserStore((state) => state.currentUser);
  const tenantId = currentUser?.tenantId;

  // テンプレートストア
  const {
    templates, isLoading, setTenantId, fetchTemplates,
    addTemplate, updateTemplate, deleteTemplate,
  } = useDailyReportTemplateStore();

  // 部署マスタ
  const {
    departments, setTenantId: setMasterTenantId, fetchDepartments,
  } = useMasterDataStore();

  // 組織ストア（承認者選択用）
  const allMembers = useOrganizationStore((state) => state.allMembers);

  // ダイアログ状態
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DailyReportTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(defaultTemplateForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // 初期化
  useEffect(() => {
    if (tenantId) {
      setTenantId(tenantId);
      setMasterTenantId(tenantId);
      fetchTemplates();
      fetchDepartments();
    }
  }, [tenantId, setTenantId, setMasterTenantId, fetchTemplates, fetchDepartments]);

  // テンプレート作成ダイアログを開く
  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    setFormData(defaultTemplateForm);
    setShowFormDialog(true);
  }, []);

  // テンプレート編集ダイアログを開く
  const handleEdit = useCallback((template: DailyReportTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      departmentIds: template.departmentIds,
      submissionRule: template.submissionRule,
      reminderHours: template.reminderHours,
      approvalRequired: template.approvalRequired,
      approverType: template.approverType || 'direct_manager',
      approverIds: template.approverIds || [],
      isActive: template.isActive,
      fields: template.fields,
    });
    setShowFormDialog(true);
  }, []);

  // テンプレート保存
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('テンプレート名を入力してください');
      return;
    }

    const input: DailyReportTemplateInput = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      departmentIds: formData.departmentIds,
      submissionRule: formData.submissionRule,
      reminderHours: formData.submissionRule === 'prompt_after_clockout' ? formData.reminderHours : 0,
      approvalRequired: formData.approvalRequired,
      approverType: formData.approverType,
      approverIds: formData.approverType === 'specific_person' ? formData.approverIds : [],
      isActive: formData.isActive,
      fields: formData.fields,
    };

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, input);
        toast.success('テンプレートを更新しました');
      } else {
        await addTemplate(input);
        toast.success('テンプレートを作成しました');
      }
      setShowFormDialog(false);
    } catch (error) {
      toast.error((error as Error).message || (editingTemplate ? '更新に失敗しました' : '作成に失敗しました'));
    }
  };

  // テンプレート削除
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate(deleteTarget.id);
      toast.success('テンプレートを削除しました');
    } catch (error) {
      toast.error((error as Error).message || '削除に失敗しました');
    }
    setDeleteTarget(null);
  };

  // 部署名取得
  const getDepartmentName = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.name || deptId;
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">日報テンプレート</h3>
          <p className="text-sm text-muted-foreground">
            部署ごとの日報テンプレートを管理します
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {/* テンプレート一覧 */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              テンプレートがありません。「新規作成」から追加してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>テンプレート名</TableHead>
              <TableHead>適用部署</TableHead>
              <TableHead>提出ルール</TableHead>
              <TableHead>承認</TableHead>
              <TableHead>状態</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {template.departmentIds.length === 0 ? (
                      <span className="text-muted-foreground text-xs">未設定</span>
                    ) : (
                      template.departmentIds.map((deptId) => (
                        <Badge key={deptId} variant="secondary" className="text-xs">
                          {getDepartmentName(deptId)}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {SUBMISSION_RULE_LABELS[template.submissionRule]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {template.approvalRequired ? (
                    <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">必要</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">不要</span>
                  )}
                </TableCell>
                <TableCell>
                  {template.isActive ? (
                    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">有効</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">無効</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ id: template.id, name: template.name })}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* テンプレート作成/編集ダイアログ */}
      <TemplateFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        editingTemplate={editingTemplate}
        formData={formData}
        onFormDataChange={setFormData}
        onSave={handleSave}
        isLoading={isLoading}
        departments={departments}
        allMembers={allMembers}
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>テンプレートを削除</AlertDialogTitle>
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
