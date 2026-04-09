'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building } from 'lucide-react';
import { toast } from 'sonner';
import type { Municipality } from '@/lib/payroll/payroll-types';
import { SectionEditButtons } from './payroll-ui-helpers';

interface ResidentTaxData {
  id: string;
  fiscalYear: number;
  municipalityId: string | null;
  collectionMethod: string;
  monthlyAmounts: Record<string, number> | null;
}

interface ResidentTaxSectionProps {
  userId: string;
  canEdit: boolean;
  municipalities: Municipality[];
  // 既存データからのフォールバック
  fallbackMunicipalityId?: string;
  fallbackMunicipalityName?: string;
}

const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const emptyMonthlyAmounts = (): Record<string, number> => {
  const amounts: Record<string, number> = {};
  for (let i = 1; i <= 12; i++) amounts[`m${i}`] = 0;
  return amounts;
};

export function ResidentTaxSection({ userId, canEdit, municipalities, fallbackMunicipalityId, fallbackMunicipalityName }: ResidentTaxSectionProps) {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<ResidentTaxData | null>(null);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [form, setForm] = useState({
    municipalityId: '',
    collectionMethod: 'special',
    monthlyAmounts: emptyMonthlyAmounts(),
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/resident-tax?fiscalYear=${fiscalYear}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || null);
      }
    } catch { /* */ }
  }, [userId, fiscalYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = () => {
    const amounts = (data?.monthlyAmounts as Record<string, number> | null) || emptyMonthlyAmounts();
    setForm({
      municipalityId: data?.municipalityId || fallbackMunicipalityId || '',
      collectionMethod: data?.collectionMethod || 'special',
      monthlyAmounts: { ...emptyMonthlyAmounts(), ...amounts },
    });
    setEditing(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/resident-tax`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fiscalYear, ...form }),
      });
      if (!res.ok) throw new Error();
      toast.success('住民税情報を保存しました');
      setEditing(false);
      await fetchData();
    } catch {
      toast.error('住民税情報の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const currentMuni = municipalities.find(m => m.id === (data?.municipalityId || fallbackMunicipalityId));
  const muniDisplay = currentMuni
    ? `${currentMuni.prefectureName} ${currentMuni.name}`
    : (fallbackMunicipalityName || '未設定');
  const amounts = (data?.monthlyAmounts as Record<string, number> | null) || {};
  const yearTotal = Object.values(amounts).reduce((sum, v) => sum + (v || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">住民税</CardTitle>
              <CardDescription>住民税の徴収設定</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(fiscalYear)} onValueChange={(v) => setFiscalYear(parseInt(v))}>
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
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">市区町村</Label>
                <Select value={form.municipalityId} onValueChange={(v) => setForm(f => ({ ...f, municipalityId: v }))}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="選択してください" /></SelectTrigger>
                  <SelectContent>
                    {municipalities.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.prefectureName} {m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">徴収方法</Label>
                <Select value={form.collectionMethod} onValueChange={(v) => setForm(f => ({ ...f, collectionMethod: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="special">特別徴収</SelectItem>
                    <SelectItem value="ordinary">普通徴収</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">月額住民税</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {monthLabels.map((label, i) => {
                  const key = `m${i + 1}`;
                  return (
                    <div key={key} className="space-y-0.5">
                      <Label className="text-[10px] text-muted-foreground">{label}</Label>
                      <Input
                        type="number" min="0" className="h-7 text-xs"
                        value={form.monthlyAmounts[key] || ''}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          monthlyAmounts: { ...f.monthlyAmounts, [key]: parseInt(e.target.value) || 0 },
                        }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">市区町村</p>
                <p className="text-sm mt-1">{muniDisplay}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">徴収方法</p>
                <p className="text-sm mt-1">{data?.collectionMethod === 'ordinary' ? '普通徴収' : '特別徴収'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">年間合計</p>
                <p className="text-sm mt-1">¥{yearTotal.toLocaleString()}</p>
              </div>
            </div>
            {yearTotal > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {monthLabels.map((label, i) => {
                  const key = `m${i + 1}`;
                  return (
                    <div key={key}>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className="text-xs">¥{(amounts[key] || 0).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
