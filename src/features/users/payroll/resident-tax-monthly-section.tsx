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

// 左列: 6月〜11月, 右列: 12月〜5月
const LEFT_MONTHS = MONTH_ORDER.slice(0, 6);
const RIGHT_MONTHS = MONTH_ORDER.slice(6);

interface Props {
  userId: string;
  initialData: ResidentTaxMonthly | null;
  canEdit: boolean;
  onSaved: () => void;
}

const emptyForm = (): Record<MonthKey, number> => ({
  month6: 0, month7: 0, month8: 0, month9: 0, month10: 0, month11: 0,
  month12: 0, month1: 0, month2: 0, month3: 0, month4: 0, month5: 0,
});

export function ResidentTaxMonthlySection({ userId, initialData, canEdit, onSaved }: Props) {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<ResidentTaxMonthly | null>(initialData);
  const [fiscalYear, setFiscalYear] = useState(initialData?.fiscalYear || currentYear);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Record<MonthKey, number>>(emptyForm());

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
  };

  const startEdit = () => {
    const base = emptyForm();
    if (data) {
      for (const { key } of MONTH_ORDER) {
        base[key] = data[key] || 0;
      }
    }
    setForm(base);
    setEditing(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const method = data ? 'PATCH' : 'POST';
      const res = await fetch(`/api/users/${userId}/resident-tax-monthly`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear, ...form }),
      });
      if (!res.ok) throw new Error();
      toast.success('住民税月額を保存しました');
      setEditing(false);
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
    setForm(prev => {
      const next = { ...prev };
      for (let i = fromIndex + 1; i < MONTH_ORDER.length; i++) {
        next[MONTH_ORDER[i].key] = value;
      }
      return next;
    });
  };

  const yearTotal = editing
    ? MONTH_ORDER.reduce((sum, { key }) => sum + (form[key] || 0), 0)
    : (data ? MONTH_ORDER.reduce((sum, { key }) => sum + (data[key] || 0), 0) : 0);

  const renderMonthRow = (
    month: { key: MonthKey; label: string },
    index: number,
  ) => {
    if (editing) {
      return (
        <div key={month.key} className="flex items-center gap-2">
          <span className="text-sm w-16 shrink-0">{month.label}</span>
          <Input
            type="number"
            min="0"
            max="999999"
            className="h-9 w-32 text-sm text-right"
            value={form[month.key] || ''}
            onChange={(e) => setForm(f => ({ ...f, [month.key]: parseInt(e.target.value) || 0 }))}
          />
          {index > 0 && form[month.key] > 0 && (
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
                onCancel={() => setEditing(false)}
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
