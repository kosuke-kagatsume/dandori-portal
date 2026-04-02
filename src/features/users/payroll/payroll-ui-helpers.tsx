'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Edit, Loader2, Check, X } from 'lucide-react';

// ── EditableField ──────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'select';
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
  suffix?: string;
}

export function EditableField({ label, value, isEditing, onChange, type = 'text', selectOptions, placeholder, suffix }: EditableFieldProps) {
  if (!isEditing) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm mt-1">{value ? `${value}${suffix || ''}` : '未設定'}</p>
      </div>
    );
  }

  if (type === 'select' && selectOptions) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="mt-1 h-8">
            <SelectValue placeholder={placeholder || '選択してください'} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <Input
        type={type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-8"
      />
    </div>
  );
}

// ── SectionEditButtons ──────────────────────────────────

export function SectionEditButtons({
  isEditing, isSaving, onEdit, onSave, onCancel,
}: {
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="mr-1 h-4 w-4" />キャンセル
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
          保存
        </Button>
      </div>
    );
  }
  return (
    <Button variant="outline" size="sm" onClick={onEdit}>
      <Edit className="mr-1 h-4 w-4" />編集
    </Button>
  );
}
