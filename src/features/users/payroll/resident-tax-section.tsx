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
  reportMunicipalityId: string | null;
  paymentMunicipalityId: string | null;
  addressNumber: string | null;
  recipientNumber: string | null;
}

interface ResidentTaxSectionProps {
  userId: string;
  canEdit: boolean;
  municipalities: Municipality[];
  fallbackMunicipalityId?: string;
  fallbackMunicipalityName?: string;
}

export function ResidentTaxSection({ userId, canEdit, municipalities, fallbackMunicipalityId, fallbackMunicipalityName }: ResidentTaxSectionProps) {
  const [data, setData] = useState<ResidentTaxData | null>(null);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    reportMunicipalityId: '',
    paymentMunicipalityId: '',
    addressNumber: '',
    recipientNumber: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/resident-tax`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || null);
      }
    } catch { /* */ }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const startEdit = () => {
    setForm({
      reportMunicipalityId: data?.reportMunicipalityId || fallbackMunicipalityId || '',
      paymentMunicipalityId: data?.paymentMunicipalityId || fallbackMunicipalityId || '',
      addressNumber: data?.addressNumber || '',
      recipientNumber: data?.recipientNumber || '',
    });
    setEditing(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/resident-tax`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  const getMuniDisplay = (id: string | null | undefined): string => {
    if (!id) return fallbackMunicipalityName || '未設定';
    const muni = municipalities.find(m => m.id === id);
    return muni ? `${muni.prefectureName} ${muni.name}` : '未設定';
  };

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
              <Label className="text-xs">給与支払報告書提出先</Label>
              <Select value={form.reportMunicipalityId} onValueChange={(v) => setForm(f => ({ ...f, reportMunicipalityId: v }))}>
                <SelectTrigger className="h-8"><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  {municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.prefectureName} {m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">納付先市区町村</Label>
              <Select value={form.paymentMunicipalityId} onValueChange={(v) => setForm(f => ({ ...f, paymentMunicipalityId: v }))}>
                <SelectTrigger className="h-8"><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  {municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.prefectureName} {m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">宛名番号</Label>
              <Input
                className="h-8 text-sm"
                value={form.addressNumber}
                onChange={(e) => setForm(f => ({ ...f, addressNumber: e.target.value }))}
                placeholder="宛名番号"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">受給者番号</Label>
              <Input
                className="h-8 text-sm"
                value={form.recipientNumber}
                onChange={(e) => setForm(f => ({ ...f, recipientNumber: e.target.value }))}
                placeholder="受給者番号"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">給与支払報告書提出先</p>
              <p className="text-sm mt-1">{getMuniDisplay(data?.reportMunicipalityId)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">納付先市区町村</p>
              <p className="text-sm mt-1">{getMuniDisplay(data?.paymentMunicipalityId)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">宛名番号</p>
              <p className="text-sm mt-1">{data?.addressNumber || '未設定'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">受給者番号</p>
              <p className="text-sm mt-1">{data?.recipientNumber || '未設定'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
