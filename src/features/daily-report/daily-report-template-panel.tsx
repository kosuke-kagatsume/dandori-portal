'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store/user-store';
import { useMasterDataStore } from '@/lib/store/master-data-store';
import {
  useDailyReportTemplateStore,
  type DailyReportTemplate,
  type DailyReportTemplateInput,
  type TemplateField,
  type FieldType,
  type SubmissionRule,
  type ApproverType,
} from '@/lib/store/daily-report-template-store';
import { useOrganizationStore } from '@/lib/store/organization-store';

// === 定数 ===

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'テキスト',
  textarea: 'テキストエリア',
  number: '数値',
  select: '単一選択',
  multiselect: '複数選択',
  date: '日付',
  time: '時刻',
  timerange: '時間帯',
  file: 'ファイル',
};

const FIELD_TYPES: FieldType[] = [
  'text', 'textarea', 'number',
  'select', 'multiselect',
  'date', 'time', 'timerange', 'file',
];

const SUBMISSION_RULE_LABELS: Record<SubmissionRule, string> = {
  required_on_clockout: '退勤時必須',
  prompt_after_clockout: '退勤後催促',
  optional: '任意',
};

// === フォームデータ型 ===

interface TemplateFormData {
  name: string;
  description: string;
  departmentIds: string[];
  submissionRule: SubmissionRule;
  reminderHours: number;
  approvalRequired: boolean;
  approverType: ApproverType;
  approverIds: string[];
  isActive: boolean;
  fields: TemplateField[];
}

interface FieldFormData {
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string;
  options: string; // 改行区切り
}

const defaultTemplateForm: TemplateFormData = {
  name: '',
  description: '',
  departmentIds: [],
  submissionRule: 'optional',
  reminderHours: 2,
  approvalRequired: false,
  approverType: 'direct_manager',
  approverIds: [],
  isActive: true,
  fields: [],
};

const defaultFieldForm: FieldFormData = {
  label: '',
  fieldType: 'text',
  required: false,
  placeholder: '',
  options: '',
};

// === ユーティリティ ===

function generateFieldId(): string {
  return `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

// === セクションヘッダー ===

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-4 pb-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <Separator className="mt-2" />
    </div>
  );
}

// === フィールド追加/編集ダイアログ ===

function FieldFormDialog({
  open,
  onOpenChange,
  fieldData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldData: FieldFormData;
  onSave: (data: FieldFormData) => void;
}) {
  const [form, setForm] = useState<FieldFormData>(defaultFieldForm);

  useEffect(() => {
    if (open) {
      setForm(fieldData);
    }
  }, [open, fieldData]);

  const showOptions = form.fieldType === 'select' || form.fieldType === 'multiselect';

  const handleSave = () => {
    if (!form.label.trim()) {
      toast.error('フィールド名を入力してください');
      return;
    }
    if (showOptions && !form.options.trim()) {
      toast.error('選択肢を入力してください');
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>フィールド設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* フィールド名 */}
          <div className="space-y-2">
            <Label>フィールド名 <span className="text-red-500">*</span></Label>
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="例: 訪問先名"
            />
          </div>

          {/* 種別 */}
          <div className="space-y-2">
            <Label>種別</Label>
            <Select
              value={form.fieldType}
              onValueChange={(v) => setForm({ ...form, fieldType: v as FieldType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft} value={ft}>
                    {FIELD_TYPE_LABELS[ft]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 必須 */}
          <div className="flex items-center justify-between">
            <Label>必須</Label>
            <Switch
              checked={form.required}
              onCheckedChange={(checked) => setForm({ ...form, required: checked })}
            />
          </div>

          {/* プレースホルダー */}
          <div className="space-y-2">
            <Label>プレースホルダー</Label>
            <Input
              value={form.placeholder}
              onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
              placeholder="入力欄のヒントテキスト"
            />
          </div>

          {/* 選択肢（select/multiselectの場合のみ） */}
          {showOptions && (
            <div className="space-y-2">
              <Label>選択肢 <span className="text-red-500">*</span></Label>
              <Textarea
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
                placeholder={'1行に1つずつ入力\n例:\n受注\n継続\n失注\n保留'}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">1行に1つの選択肢を入力してください</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === メインコンポーネント ===

export function DailyReportTemplateMasterPanel() {
  const currentUser = useUserStore((state) => state.currentUser);
  const tenantId = currentUser?.tenantId;

  // テンプレートストア
  const {
    templates,
    isLoading,
    setTenantId,
    fetchTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useDailyReportTemplateStore();

  // 部署マスタ
  const {
    departments,
    setTenantId: setMasterTenantId,
    fetchDepartments,
  } = useMasterDataStore();

  // 組織ストア（承認者選択用）
  const allMembers = useOrganizationStore((state) => state.allMembers);

  // ダイアログ状態
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DailyReportTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(defaultTemplateForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // フィールドダイアログ状態
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldFormData, setFieldFormData] = useState<FieldFormData>(defaultFieldForm);

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
    } catch {
      // エラーはストアで処理済み
    }
  };

  // テンプレート削除
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate(deleteTarget.id);
      toast.success('テンプレートを削除しました');
    } catch {
      toast.error('削除に失敗しました');
    }
    setDeleteTarget(null);
  };

  // 部署チェック切替
  const toggleDepartment = (deptId: string) => {
    setFormData((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId],
    }));
  };

  // 部署名取得
  const getDepartmentName = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.name || deptId;
  };

  // === フィールド操作 ===

  const handleAddField = () => {
    setEditingFieldIndex(null);
    setFieldFormData(defaultFieldForm);
    setShowFieldDialog(true);
  };

  const handleEditField = (index: number) => {
    const field = formData.fields[index];
    setEditingFieldIndex(index);
    setFieldFormData({
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      placeholder: field.placeholder || '',
      options: field.options?.join('\n') || '',
    });
    setShowFieldDialog(true);
  };

  const handleDeleteField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields
        .filter((_, i) => i !== index)
        .map((f, i) => ({ ...f, order: i })),
    }));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formData.fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newFields.length) return;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    setFormData((prev) => ({
      ...prev,
      fields: newFields.map((f, i) => ({ ...f, order: i })),
    }));
  };

  const handleFieldSave = (data: FieldFormData) => {
    const optionsArray = data.options
      ? data.options.split('\n').map((o) => o.trim()).filter(Boolean)
      : undefined;

    if (editingFieldIndex !== null) {
      // 編集
      setFormData((prev) => ({
        ...prev,
        fields: prev.fields.map((f, i) =>
          i === editingFieldIndex
            ? {
                ...f,
                label: data.label.trim(),
                fieldType: data.fieldType,
                required: data.required,
                placeholder: data.placeholder.trim() || undefined,
                options: optionsArray,
              }
            : f
        ),
      }));
    } else {
      // 追加
      const newField: TemplateField = {
        id: generateFieldId(),
        label: data.label.trim(),
        fieldType: data.fieldType,
        required: data.required,
        placeholder: data.placeholder.trim() || undefined,
        options: optionsArray,
        order: formData.fields.length,
      };
      setFormData((prev) => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));
    }
  };

  // アクティブな部署一覧
  const activeDepartments = departments.filter((d) => d.isActive);

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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: template.id, name: template.name })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* === テンプレート作成/編集ダイアログ === */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>
              {editingTemplate ? 'テンプレートを編集' : '新規テンプレート作成'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
            <div className="space-y-4 pb-4">

              {/* セクション1: 基本設定 */}
              <SectionHeader title="基本設定" />

              {/* テンプレート名 */}
              <div className="space-y-2">
                <Label>テンプレート名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: 営業日報"
                />
              </div>

              {/* 説明 */}
              <div className="space-y-2">
                <Label>説明</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="テンプレートの用途を記載"
                  rows={2}
                />
              </div>

              {/* 適用部署 */}
              <div className="space-y-2">
                <Label>適用部署</Label>
                {activeDepartments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    部署が登録されていません。マスタ管理から部署を追加してください。
                  </p>
                ) : (
                  <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2">
                    {activeDepartments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={formData.departmentIds.includes(dept.id)}
                          onCheckedChange={() => toggleDepartment(dept.id)}
                        />
                        <label
                          htmlFor={`dept-${dept.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {dept.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {formData.departmentIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.departmentIds.map((deptId) => (
                      <Badge key={deptId} variant="secondary" className="text-xs">
                        {getDepartmentName(deptId)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 有効/無効 */}
              <div className="flex items-center justify-between">
                <Label>有効</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              {/* セクション2: 提出ルール */}
              <SectionHeader title="提出ルール" />

              {/* 提出タイミング */}
              <div className="space-y-3">
                <Label>提出タイミング</Label>
                <RadioGroup
                  value={formData.submissionRule}
                  onValueChange={(v) => setFormData({ ...formData, submissionRule: v as SubmissionRule })}
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="required_on_clockout" id="rule-required" className="mt-0.5" />
                    <div>
                      <label htmlFor="rule-required" className="text-sm font-medium cursor-pointer">
                        退勤時必須
                      </label>
                      <p className="text-xs text-muted-foreground">
                        日報を提出しないと退勤打刻が完了しません
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="prompt_after_clockout" id="rule-prompt" className="mt-0.5" />
                    <div>
                      <label htmlFor="rule-prompt" className="text-sm font-medium cursor-pointer">
                        退勤後催促
                      </label>
                      <p className="text-xs text-muted-foreground">
                        退勤は即確定。未提出の場合、指定時間後にリマインド通知
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="optional" id="rule-optional" className="mt-0.5" />
                    <div>
                      <label htmlFor="rule-optional" className="text-sm font-medium cursor-pointer">
                        任意
                      </label>
                      <p className="text-xs text-muted-foreground">
                        退勤のみ確定。日報は任意で提出
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* 催促時間（催促モードのみ） */}
              {formData.submissionRule === 'prompt_after_clockout' && (
                <div className="space-y-2">
                  <Label>催促までの時間</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={formData.reminderHours}
                      onChange={(e) =>
                        setFormData({ ...formData, reminderHours: parseInt(e.target.value) || 1 })
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">時間後にリマインド</span>
                  </div>
                </div>
              )}

              {/* 承認 */}
              <div className="space-y-3">
                <Label>承認</Label>
                <RadioGroup
                  value={formData.approvalRequired ? 'required' : 'not_required'}
                  onValueChange={(v) =>
                    setFormData({ ...formData, approvalRequired: v === 'required' })
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="required" id="approval-required" />
                    <label htmlFor="approval-required" className="text-sm cursor-pointer">
                      必要（上長が承認/差戻）
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="not_required" id="approval-not-required" />
                    <label htmlFor="approval-not-required" className="text-sm cursor-pointer">
                      不要（提出のみ）
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* 承認者設定（承認が必要な場合のみ） */}
              {formData.approvalRequired && (
                <div className="space-y-3">
                  <Label>承認者タイプ</Label>
                  <RadioGroup
                    value={formData.approverType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, approverType: v as ApproverType })
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="direct_manager" id="approver-manager" className="mt-0.5" />
                      <div>
                        <label htmlFor="approver-manager" className="text-sm font-medium cursor-pointer">
                          直属マネージャー
                        </label>
                        <p className="text-xs text-muted-foreground">
                          組織ツリーに基づく直属上位者が承認します
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="specific_person" id="approver-specific" className="mt-0.5" />
                      <div>
                        <label htmlFor="approver-specific" className="text-sm font-medium cursor-pointer">
                          特定の個人を指名
                        </label>
                        <p className="text-xs text-muted-foreground">
                          指定した社員が承認者になります
                        </p>
                      </div>
                    </div>
                  </RadioGroup>

                  {/* 特定の個人を選択 */}
                  {formData.approverType === 'specific_person' && (
                    <div className="space-y-2">
                      <Label>承認者を選択</Label>
                      {allMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          組織メンバーが登録されていません。組織管理からメンバーを追加してください。
                        </p>
                      ) : (
                        <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2">
                          {allMembers
                            .filter((m) => m.status === 'active')
                            .map((member) => (
                              <div key={member.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`approver-${member.id}`}
                                  checked={formData.approverIds.includes(member.id)}
                                  onCheckedChange={(checked) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      approverIds: checked
                                        ? [...prev.approverIds, member.id]
                                        : prev.approverIds.filter((id) => id !== member.id),
                                    }));
                                  }}
                                />
                                <label
                                  htmlFor={`approver-${member.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {member.name}
                                  {member.isManager && (
                                    <span className="text-xs text-muted-foreground ml-1">(管理者)</span>
                                  )}
                                </label>
                              </div>
                            ))}
                        </div>
                      )}
                      {formData.approverIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.approverIds.map((approverId) => {
                            const member = allMembers.find((m) => m.id === approverId);
                            return (
                              <Badge key={approverId} variant="secondary" className="text-xs">
                                {member?.name || approverId}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* セクション3: フィールド定義 */}
              <SectionHeader title="フィールド定義" />

              {formData.fields.length === 0 ? (
                <div className="border rounded-md p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    フィールドが定義されていません
                  </p>
                  <Button variant="outline" size="sm" onClick={handleAddField}>
                    <Plus className="h-4 w-4 mr-2" />
                    フィールドを追加
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 border rounded-md px-3 py-2"
                    >
                      {/* 並び順操作 */}
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === formData.fields.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* 順番 */}
                      <span className="text-xs text-muted-foreground w-6 text-center">
                        {index + 1}
                      </span>

                      {/* フィールド情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {field.label}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {FIELD_TYPE_LABELS[field.fieldType]}
                          </Badge>
                          {field.required && (
                            <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100 shrink-0">
                              必須
                            </Badge>
                          )}
                        </div>
                        {field.options && field.options.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            選択肢: {field.options.join(' / ')}
                          </p>
                        )}
                      </div>

                      {/* 操作ボタン */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEditField(index)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDeleteField(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddField}
                    className="w-full mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    フィールドを追加
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === フィールド追加/編集サブダイアログ === */}
      <FieldFormDialog
        open={showFieldDialog}
        onOpenChange={setShowFieldDialog}
        fieldData={fieldFormData}
        onSave={handleFieldSave}
      />

      {/* === 削除確認ダイアログ === */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>テンプレートを削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
