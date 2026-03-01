'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { TemplateField, FieldType } from '@/lib/store/daily-report-template-store';
import type { ReportFieldValue } from '@/lib/store/daily-report-store';

// === 型定義 ===

interface DailyReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  fields: TemplateField[];
  initialValues?: ReportFieldValue[];
  onSaveDraft: (values: ReportFieldValue[]) => Promise<void>;
  onSubmit: (values: ReportFieldValue[]) => Promise<void>;
  /** 下書き不可（退勤時必須モード） */
  submitOnly?: boolean;
  /** ダイアログの説明文 */
  description?: string;
  isLoading?: boolean;
  /** 読み取り専用モード（レビュー表示用） */
  readOnly?: boolean;
  /** フッターカスタムコンテンツ（readOnly時に承認/差戻しボタンなど） */
  footerContent?: React.ReactNode;
}

// フィールド型ラベル
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

// === フィールドレンダラー ===

function FieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
}: {
  field: TemplateField;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number | null) => void;
  disabled?: boolean;
}) {
  switch (field.fieldType) {
    case 'text':
      return (
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          disabled={disabled}
        />
      );

    case 'textarea':
      return (
        <Textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          rows={3}
          disabled={disabled}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={field.placeholder || ''}
          disabled={disabled}
        />
      );

    case 'select':
      return (
        <Select
          value={(value as string) || ''}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || '選択してください'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiselect': {
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2 border rounded-md p-3">
          {field.options?.map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${opt}`}
                checked={selectedValues.includes(opt)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selectedValues, opt]);
                  } else {
                    onChange(selectedValues.filter((v) => v !== opt));
                  }
                }}
              />
              <label htmlFor={`${field.id}-${opt}`} className="text-sm cursor-pointer">
                {opt}
              </label>
            </div>
          ))}
        </div>
      );
    }

    case 'date':
      return (
        <Input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case 'time':
      return (
        <Input
          type="time"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case 'timerange': {
      const parts = ((value as string) || '').split('~');
      const startTime = parts[0]?.trim() || '';
      const endTime = parts[1]?.trim() || '';
      return (
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={startTime}
            onChange={(e) => onChange(`${e.target.value}~${endTime}`)}
            className="w-[140px]"
            disabled={disabled}
          />
          <span className="text-sm text-muted-foreground">〜</span>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => onChange(`${startTime}~${e.target.value}`)}
            className="w-[140px]"
            disabled={disabled}
          />
        </div>
      );
    }

    case 'file':
      return (
        <div className="border rounded-md p-3 text-center">
          <p className="text-sm text-muted-foreground">
            ファイル添付は Phase 2.5 で対応予定です
          </p>
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ファイル名をメモとして入力"
            className="mt-2"
            disabled={disabled}
          />
        </div>
      );

    default:
      return null;
  }
}

// === メインコンポーネント ===

export function DailyReportFormDialog({
  open,
  onOpenChange,
  templateName,
  fields,
  initialValues,
  onSaveDraft,
  onSubmit,
  submitOnly = false,
  description,
  isLoading = false,
  readOnly = false,
  footerContent,
}: DailyReportFormProps) {
  const [values, setValues] = useState<Map<string, string | string[] | number | null>>(new Map());
  const [saving, setSaving] = useState(false);

  // 初期値設定
  useEffect(() => {
    if (open) {
      const map = new Map<string, string | string[] | number | null>();
      if (initialValues) {
        initialValues.forEach((v) => map.set(v.fieldId, v.value));
      }
      setValues(map);
    }
  }, [open, initialValues]);

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const updateValue = useCallback(
    (fieldId: string, value: string | string[] | number | null) => {
      setValues((prev) => {
        const next = new Map(prev);
        next.set(fieldId, value);
        return next;
      });
    },
    []
  );

  const getFieldValues = (): ReportFieldValue[] => {
    return sortedFields.map((field) => ({
      fieldId: field.id,
      value: values.get(field.id) ?? null,
    }));
  };

  // バリデーション
  const validate = (): boolean => {
    const requiredFields = sortedFields.filter((f) => f.required);
    for (const field of requiredFields) {
      const val = values.get(field.id);
      if (val === null || val === undefined || val === '') {
        toast.error(`「${field.label}」は必須です`);
        return false;
      }
      if (Array.isArray(val) && val.length === 0) {
        toast.error(`「${field.label}」は必須です`);
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSaveDraft(getFieldValues());
      toast.success('下書きを保存しました');
      onOpenChange(false);
    } catch {
      // エラーは呼び出し元で処理
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(getFieldValues());
      toast.success('日報を提出しました');
      onOpenChange(false);
    } catch {
      // エラーは呼び出し元で処理
    } finally {
      setSaving(false);
    }
  };

  const disabled = saving || isLoading;

  // フィールド型ラベルをESLint unused対策で参照
  void FIELD_TYPE_LABELS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{templateName}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-160px)] px-6">
          <div className="space-y-5 pb-4 pt-2">
            {sortedFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    {field.label}
                  </Label>
                  {field.required && (
                    <Badge className="text-[10px] bg-red-100 text-red-700 hover:bg-red-100 px-1.5 py-0">
                      必須
                    </Badge>
                  )}
                </div>
                <FieldRenderer
                  field={field}
                  value={values.get(field.id) ?? null}
                  onChange={(v) => updateValue(field.id, v)}
                  disabled={readOnly}
                />
              </div>
            ))}

            {sortedFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                フィールドが定義されていません
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 border-t gap-2">
          {readOnly ? (
            <>
              {footerContent || (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  閉じる
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>
                キャンセル
              </Button>
              {!submitOnly && (
                <Button variant="secondary" onClick={handleSaveDraft} disabled={disabled}>
                  {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  下書き保存
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={disabled}>
                {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                提出
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
