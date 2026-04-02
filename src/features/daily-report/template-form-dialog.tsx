'use client';

import { useState, useEffect } from 'react';
import type { DailyReportTemplate, TemplateField, SubmissionRule, ApproverType, FieldType } from '@/lib/store/daily-report-template-store';
import type { TemplateFormData, FieldFormData } from '@/lib/daily-report/template-helpers';
import {
  FIELD_TYPE_LABELS, FIELD_TYPES,
  defaultFieldForm, generateFieldId,
} from '@/lib/daily-report/template-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

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
          <div className="space-y-2">
            <Label>フィールド名 <span className="text-red-500">*</span></Label>
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="例: 訪問先名"
            />
          </div>

          <div className="space-y-2">
            <Label>種別</Label>
            <Select
              value={form.fieldType}
              onValueChange={(v) => setForm({ ...form, fieldType: v as FieldType })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft} value={ft}>{FIELD_TYPE_LABELS[ft]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>必須</Label>
            <Switch checked={form.required} onCheckedChange={(checked) => setForm({ ...form, required: checked })} />
          </div>

          <div className="space-y-2">
            <Label>プレースホルダー</Label>
            <Input
              value={form.placeholder}
              onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
              placeholder="入力欄のヒントテキスト"
            />
          </div>

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
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === テンプレート作成/編集ダイアログ ===

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: DailyReportTemplate | null;
  formData: TemplateFormData;
  onFormDataChange: (data: TemplateFormData) => void;
  onSave: () => void;
  isLoading: boolean;
  departments: Array<{ id: string; name: string; isActive: boolean }>;
  allMembers: Array<{ id: string; name: string; status: string; isManager: boolean }>;
}

export function TemplateFormDialog({
  open, onOpenChange, editingTemplate, formData, onFormDataChange,
  onSave, isLoading, departments, allMembers,
}: TemplateFormDialogProps) {
  // フィールドダイアログ状態
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [fieldFormData, setFieldFormData] = useState<FieldFormData>(defaultFieldForm);

  const activeDepartments = departments.filter((d) => d.isActive);

  // 部署ヘルパー
  const toggleDepartment = (deptId: string) => {
    onFormDataChange({
      ...formData,
      departmentIds: formData.departmentIds.includes(deptId)
        ? formData.departmentIds.filter((id) => id !== deptId)
        : [...formData.departmentIds, deptId],
    });
  };

  const getDepartmentName = (deptId: string) => {
    return departments.find((d) => d.id === deptId)?.name || deptId;
  };

  // フィールド操作
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
    onFormDataChange({
      ...formData,
      fields: formData.fields
        .filter((_, i) => i !== index)
        .map((f, i) => ({ ...f, order: i })),
    });
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formData.fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newFields.length) return;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    onFormDataChange({
      ...formData,
      fields: newFields.map((f, i) => ({ ...f, order: i })),
    });
  };

  const handleFieldSave = (data: FieldFormData) => {
    const optionsArray = data.options
      ? data.options.split('\n').map((o) => o.trim()).filter(Boolean)
      : undefined;

    if (editingFieldIndex !== null) {
      onFormDataChange({
        ...formData,
        fields: formData.fields.map((f, i) =>
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
      });
    } else {
      const newField: TemplateField = {
        id: generateFieldId(),
        label: data.label.trim(),
        fieldType: data.fieldType,
        required: data.required,
        placeholder: data.placeholder.trim() || undefined,
        options: optionsArray,
        order: formData.fields.length,
      };
      onFormDataChange({
        ...formData,
        fields: [...formData.fields, newField],
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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

              <div className="space-y-2">
                <Label>テンプレート名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                  placeholder="例: 営業日報"
                />
              </div>

              <div className="space-y-2">
                <Label>説明</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                  placeholder="テンプレートの用途を記載"
                  rows={2}
                />
              </div>

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
                        <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer">
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

              <div className="flex items-center justify-between">
                <Label>有効</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => onFormDataChange({ ...formData, isActive: checked })}
                />
              </div>

              {/* セクション2: 提出ルール */}
              <SectionHeader title="提出ルール" />

              <div className="space-y-3">
                <Label>提出タイミング</Label>
                <RadioGroup
                  value={formData.submissionRule}
                  onValueChange={(v) => onFormDataChange({ ...formData, submissionRule: v as SubmissionRule })}
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="required_on_clockout" id="rule-required" className="mt-0.5" />
                    <div>
                      <label htmlFor="rule-required" className="text-sm font-medium cursor-pointer">退勤時必須</label>
                      <p className="text-xs text-muted-foreground">日報を提出しないと退勤打刻が完了しません</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="prompt_after_clockout" id="rule-prompt" className="mt-0.5" />
                    <div>
                      <label htmlFor="rule-prompt" className="text-sm font-medium cursor-pointer">退勤後催促</label>
                      <p className="text-xs text-muted-foreground">退勤は即確定。未提出の場合、指定時間後にリマインド通知</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="optional" id="rule-optional" className="mt-0.5" />
                    <div>
                      <label htmlFor="rule-optional" className="text-sm font-medium cursor-pointer">任意</label>
                      <p className="text-xs text-muted-foreground">退勤のみ確定。日報は任意で提出</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

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
                        onFormDataChange({ ...formData, reminderHours: parseInt(e.target.value) || 1 })
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">時間後にリマインド</span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label>承認</Label>
                <RadioGroup
                  value={formData.approvalRequired ? 'required' : 'not_required'}
                  onValueChange={(v) =>
                    onFormDataChange({ ...formData, approvalRequired: v === 'required' })
                  }
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="required" id="approval-required" />
                    <label htmlFor="approval-required" className="text-sm cursor-pointer">必要（上長が承認/差戻）</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="not_required" id="approval-not-required" />
                    <label htmlFor="approval-not-required" className="text-sm cursor-pointer">不要（提出のみ）</label>
                  </div>
                </RadioGroup>
              </div>

              {formData.approvalRequired && (
                <div className="space-y-3">
                  <Label>承認者タイプ</Label>
                  <RadioGroup
                    value={formData.approverType}
                    onValueChange={(v) =>
                      onFormDataChange({ ...formData, approverType: v as ApproverType })
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="direct_manager" id="approver-manager" className="mt-0.5" />
                      <div>
                        <label htmlFor="approver-manager" className="text-sm font-medium cursor-pointer">直属マネージャー</label>
                        <p className="text-xs text-muted-foreground">組織ツリーに基づく直属上位者が承認します</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="specific_person" id="approver-specific" className="mt-0.5" />
                      <div>
                        <label htmlFor="approver-specific" className="text-sm font-medium cursor-pointer">特定の個人を指名</label>
                        <p className="text-xs text-muted-foreground">指定した社員が承認者になります</p>
                      </div>
                    </div>
                  </RadioGroup>

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
                                    onFormDataChange({
                                      ...formData,
                                      approverIds: checked
                                        ? [...formData.approverIds, member.id]
                                        : formData.approverIds.filter((id) => id !== member.id),
                                    });
                                  }}
                                />
                                <label htmlFor={`approver-${member.id}`} className="text-sm cursor-pointer">
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
                  <p className="text-sm text-muted-foreground mb-3">フィールドが定義されていません</p>
                  <Button variant="outline" size="sm" onClick={handleAddField}>
                    <Plus className="h-4 w-4 mr-2" />
                    フィールドを追加
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 border rounded-md px-3 py-2">
                      <div className="flex flex-col">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleMoveField(index, 'up')} disabled={index === 0}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => handleMoveField(index, 'down')} disabled={index === formData.fields.length - 1}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-center">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{field.label}</span>
                          <Badge variant="outline" className="text-xs shrink-0">{FIELD_TYPE_LABELS[field.fieldType]}</Badge>
                          {field.required && (
                            <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-100 shrink-0">必須</Badge>
                          )}
                        </div>
                        {field.options && field.options.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">選択肢: {field.options.join(' / ')}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditField(index)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteField(index)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddField} className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    フィールドを追加
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button onClick={onSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FieldFormDialog
        open={showFieldDialog}
        onOpenChange={setShowFieldDialog}
        fieldData={fieldFormData}
        onSave={handleFieldSave}
      />
    </>
  );
}
