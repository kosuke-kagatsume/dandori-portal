'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { ResidentTaxMonthly } from '@/lib/payroll/payroll-types';
import { SectionEditButtons } from './payroll-ui-helpers';

// 6月〜翌5月の順序
const MONTH_ORDER = [
  { key: 'month6', label: '6月分' },
  { key: 'month7', label: '7月分' },
  { key: 'month8', label: '8月分' },
  { key: 'month9', label: '9月分' },
  { key: 'month10', label: '10月分' },
  { key: 'month11', label: '11月分' },
  { key: 'month12', label: '12月分' },
  { key: 'month1', label: '1月分' },
  { key: 'month2', label: '2月分' },
  { key: 'month3', label: '3月分' },
  { key: 'month4', label: '4月分' },
  { key: 'month5', label: '5月分' },
] as const;

type MonthKey = (typeof MONTH_ORDER)[number]['key'];
// 未入力（null）と 0円入力（0）を区別するため number | null で保持
type MonthValue = number | null;

// 左列: 6月〜11月, 右列: 12月〜5月
const LEFT_MONTHS = MONTH_ORDER.slice(0, 6);
const RIGHT_MONTHS = MONTH_ORDER.slice(6);

interface Props {
  userId: string;
  initialData: ResidentTaxMonthly | null;
  canEdit: boolean;
  onSaved: () => void;
}

const emptyForm = (): Record<MonthKey, MonthValue> => ({
  month6: null, month7: null, month8: null, month9: null, month10: null, month11: null,
  month12: null, month1: null, month2: null, month3: null, month4: null, month5: null,
});

export function ResidentTaxMonthlySection({ userId, initialData, canEdit, onSaved }: Props) {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<ResidentTaxMonthly | null>(initialData);
  const [fiscalYear, setFiscalYear] = useState(initialData?.fiscalYear || currentYear);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Record<MonthKey, MonthValue>>(emptyForm());
  // コピー操作後は以降の「コピー」ボタンを非表示にするためのフラグ
  const [copyPerformed, setCopyPerformed] = useState(false);

  const fetchData = useCallback(async (year: number) => {
    try {
      const res = await fetch(`/api/users/${userId}/resident-tax-monthly?fiscalYear=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || null);
      }
    } catch { /* */ }
  }, [userId]);

  useEffect(() => {
    fetchData(fiscalYear);
  }, [fetchData, fiscalYear]);

  const handleYearChange = (year: string) => {
    const y = parseInt(year);
    setFiscalYear(y);
    setEditing(false);
    setCopyPerformed(false);
  };

  const startEdit = () => {
    const base = emptyForm();
    if (data) {
      for (const { key } of MONTH_ORDER) {
        // DBは Int @default(0) なので未登録と 0 を区別できないが、
        // 編集中は既存値（0 含む）をそのまま保持する
        base[key] = data[key];
      }
    }
    setForm(base);
    setCopyPerformed(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setCopyPerformed(false);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const method = data ? 'PATCH' : 'POST';
      // null は 0 として保存（未入力は0円扱い）
      const payload: Record<string, number> = {};
      for (const { key } of MONTH_ORDER) {
        payload[key] = form[key] ?? 0;
      }
      const res = await fetch(`/api/users/${userId}/resident-tax-monthly`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear, ...payload }),
      });
      if (!res.ok) throw new Error();
      toast.success('住民税月額を保存しました');
      setEditing(false);
      setCopyPerformed(false);
      await fetchData(fiscalYear);
      onSaved();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToSubsequent = (fromIndex: number) => {
    const value = form[MONTH_ORDER[fromIndex].key];
    if (value === null) return;
    setForm(prev => {
      const next = { ...prev };
      for (let i = fromIndex + 1; i < MONTH_ORDER.length; i++) {
        next[MONTH_ORDER[i].key] = value;
      }
      return next;
    });
    setCopyPerformed(true);
  };

  const yearTotal = editing
    ? MONTH_ORDER.reduce((sum, { key }) => sum + (form[key] ?? 0), 0)
    : (data ? MONTH_ORDER.reduce((sum, { key }) => sum + (data[key] || 0), 0) : 0);

  const renderMonthRow = (
    month: { key: MonthKey; label: string },
    index: number,
  ) => {
    if (editing) {
      const currentValue = form[month.key];
      // コピー操作後は以降のコピーボタンを全て非表示。0 でも未入力でなければ表示する
      const showCopyButton =
        !copyPerformed && index > 0 && currentValue !== null;
      return (
        <div key={month.key} className="flex items-center gap-2">
          <span className="text-sm w-16 shrink-0">{month.label}</span>
          <Input
            type="number"
            min="0"
            max="999999"
            className="h-9 w-32 text-sm text-right"
            value={currentValue ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              setForm(f => ({
                ...f,
                [month.key]: raw === '' ? null : (parseInt(raw) || 0),
              }));
            }}
          />
          {showCopyButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground px-2"
              onClick={() => copyToSubsequent(index)}
            >
              <Copy className="h-3 w-3 mr-1" />
              以降の欄に金額をコピー
            </Button>
          )}
        </div>
      );
    }

    return (
      <div key={month.key} className="flex items-center justify-between py-1.5 border-b last:border-b-0">
        <span className="text-sm text-muted-foreground">{month.label}</span>
        <span className="text-sm font-medium">
          {data ? `${data[month.key].toLocaleString()}円` : '-'}
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">住民税月額</CardTitle>
              <CardDescription className="text-orange-600">
                住民税を控除したい支給月に金額を入力してください
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(fiscalYear)} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}年度</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canEdit && (
              <SectionEditButtons
                isEditing={editing} isSaving={isSaving}
                onEdit={startEdit} onSave={save}
                onCancel={cancelEdit}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-3">
          <div className="text-sm">
            <span className="text-muted-foreground mr-2">年税額</span>
            <span className="font-bold text-base">{yearTotal.toLocaleString()}円</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            {LEFT_MONTHS.map((m, i) => renderMonthRow(m, i))}
          </div>
          <div className="space-y-1">
            {RIGHT_MONTHS.map((m, i) => renderMonthRow(m, i + 6))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
