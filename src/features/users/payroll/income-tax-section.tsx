'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { SectionEditButtons } from './payroll-ui-helpers';

interface IncomeTaxInfo {
  id: string;
  taxClassification: string;
  isSecondaryIncome: boolean;
  isDisasterVictim: boolean;
  isForeigner: boolean;
  disabilityGrade: string;
  widowCategory: string;
  isWorkingStudent: boolean;
  residencyStatus: string;
}

interface IncomeTaxSectionProps {
  userId: string;
  canEdit: boolean;
  // 既存データからのフォールバック
  fallbackTaxClassification?: string;
  fallbackIsSecondaryIncome?: boolean;
}

const disabilityGradeLabels: Record<string, string> = {
  none: 'なし',
  general: '一般障害者',
  special: '特別障害者',
  fellow_living_special: '同居特別障害者',
};

const widowCategoryLabels: Record<string, string> = {
  none: 'なし',
  widow: '寡婦',
  single_parent: 'ひとり親',
};

const taxClassLabels: Record<string, string> = {
  kou: '甲欄',
  otsu: '乙欄',
  hei: '丙欄（日雇い等）',
};

const residencyStatusLabels: Record<string, string> = {
  resident: '居住者',
  non_resident: '非居住者',
};

export function IncomeTaxSection({ userId, canEdit, fallbackTaxClassification, fallbackIsSecondaryIncome }: IncomeTaxSectionProps) {
  const [data, setData] = useState<IncomeTaxInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    taxClassification: 'kou',
    isSecondaryIncome: false,
    isDisasterVictim: false,
    isForeigner: false,
    disabilityGrade: 'none',
    widowCategory: 'none',
    isWorkingStudent: false,
    residencyStatus: 'resident',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/income-tax`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || null);
      }
    } catch { /* */ }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = () => {
    setForm({
      taxClassification: data?.taxClassification || fallbackTaxClassification || 'kou',
      isSecondaryIncome: data?.isSecondaryIncome ?? fallbackIsSecondaryIncome ?? false,
      isDisasterVictim: data?.isDisasterVictim ?? false,
      isForeigner: data?.isForeigner ?? false,
      disabilityGrade: data?.disabilityGrade || 'none',
      widowCategory: data?.widowCategory || 'none',
      isWorkingStudent: data?.isWorkingStudent ?? false,
      residencyStatus: data?.residencyStatus || 'resident',
    });
    setEditing(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/income-tax`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('所得税情報を保存しました');
      setEditing(false);
      await fetchData();
    } catch {
      toast.error('所得税情報の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const taxClass = data?.taxClassification || fallbackTaxClassification;
  const isSecondary = data?.isSecondaryIncome ?? fallbackIsSecondaryIncome ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">所得税</CardTitle>
              <CardDescription>源泉徴収に関する設定</CardDescription>
            </div>
          </div>
          {canEdit && (
            <SectionEditButtons
              isEditing={editing} isSaving={isSaving}
              onEdit={startEdit} onSave={save}
              onCancel={() => setEditing(false)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">税額表区分</Label>
              <Select value={form.taxClassification} onValueChange={(v) => setForm(f => ({ ...f, taxClassification: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kou">甲欄</SelectItem>
                  <SelectItem value="otsu">乙欄</SelectItem>
                  <SelectItem value="hei">丙欄（日雇い等）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.isSecondaryIncome} onCheckedChange={(v) => setForm(f => ({ ...f, isSecondaryIncome: v }))} />
              <Label className="text-xs">従たる給与</Label>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.isDisasterVictim} onCheckedChange={(v) => setForm(f => ({ ...f, isDisasterVictim: v }))} />
              <Label className="text-xs">災害者</Label>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.isForeigner} onCheckedChange={(v) => setForm(f => ({ ...f, isForeigner: v }))} />
              <Label className="text-xs">外国人</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">本人障害区分</Label>
              <Select value={form.disabilityGrade} onValueChange={(v) => setForm(f => ({ ...f, disabilityGrade: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(disabilityGradeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">寡婦/ひとり親</Label>
              <Select value={form.widowCategory} onValueChange={(v) => setForm(f => ({ ...f, widowCategory: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(widowCategoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.isWorkingStudent} onCheckedChange={(v) => setForm(f => ({ ...f, isWorkingStudent: v }))} />
              <Label className="text-xs">勤労学生</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">居住者区分</Label>
              <Select value={form.residencyStatus} onValueChange={(v) => setForm(f => ({ ...f, residencyStatus: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(residencyStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">税額表区分</p>
              <p className="text-sm mt-1">{taxClass ? taxClassLabels[taxClass] || taxClass : '未設定'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">従たる給与</p>
              <p className="text-sm mt-1">{isSecondary ? 'あり' : 'なし'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">災害者</p>
              <p className="text-sm mt-1">{data?.isDisasterVictim ? '対象' : '対象外'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">外国人</p>
              <p className="text-sm mt-1">{data?.isForeigner ? '該当' : '非該当'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">本人障害区分</p>
              <p className="text-sm mt-1">{disabilityGradeLabels[data?.disabilityGrade || 'none']}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">寡婦/ひとり親</p>
              <p className="text-sm mt-1">{widowCategoryLabels[data?.widowCategory || 'none']}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">勤労学生</p>
              <p className="text-sm mt-1">{data?.isWorkingStudent ? '対象' : '対象外'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">居住者区分</p>
              <p className="text-sm mt-1">{residencyStatusLabels[data?.residencyStatus || 'resident']}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
