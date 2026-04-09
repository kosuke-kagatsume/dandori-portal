'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Banknote, Edit, ShieldAlert, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';
import type { User } from '@/types';
import {
  type ClosingDayGroup, type Municipality,
  type AllowanceItem, type DeductionItem, type EmployeeDependent,
  type ResidentTaxMonthly, type SalarySettings,
} from '@/lib/payroll/payroll-types';
import { EditableField, SectionEditButtons } from './payroll/payroll-ui-helpers';
import { SalaryDeductionContent } from './payroll/salary-deduction-content';
import { TransferContent } from './payroll/transfer-content';
import { IncomeTaxSection } from './payroll/income-tax-section';
import { ResidentTaxSection } from './payroll/resident-tax-section';
import { DependentDetailsSection } from './payroll/dependent-details-section';

interface UserPayrollTabProps {
  user: User;
  isReadOnly: boolean;
  isHR: boolean;
  onEdit?: () => void;
}

const paymentTypeLabels: Record<string, string> = {
  monthly: '月給',
  daily: '日給',
  hourly: '時給',
};

export function UserPayrollTab({ user, isReadOnly, isHR }: UserPayrollTabProps) {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;
  const payroll = user.payrollInfo;

  // ── マスタデータ ──────────────────────────────────────────
  const [closingDayGroups, setClosingDayGroups] = useState<ClosingDayGroup[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [allowanceItems, setAllowanceItems] = useState<AllowanceItem[]>([]);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([]);

  // ── DBデータ ──────────────────────────────────────────
  const [salarySettings, setSalarySettings] = useState<SalarySettings | null>(null);
  const [dependentInfo, setDependentInfo] = useState<EmployeeDependent | null>(null);
  const [residentTax, setResidentTax] = useState<ResidentTaxMonthly | null>(null);

  // ── 編集状態 ──────────────────────────────────────────
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingDependent, setEditingDependent] = useState(false);
  const [myNumberDialogOpen, setMyNumberDialogOpen] = useState(false);
  const [myNumberInput, setMyNumberInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [businessForm, setBusinessForm] = useState({
    paymentType: '', closingDayGroupId: '',
  });
  const [dependentForm, setDependentForm] = useState({
    hasSpouse: false, spouseIsDependent: false,
    generalDependents: 0, specificDependents: 0, elderlyDependents: 0, under16Dependents: 0,
  });

  // ── データ取得 ──────────────────────────────────────────

  const fetchMasterData = useCallback(async () => {
    if (!tenantId) return;
    const base = `/api/settings/payroll`;
    try {
      const [cdgRes, pcRes, munRes, aiRes, diRes] = await Promise.all([
        fetch(`${base}/closing-day-groups?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/pay-categories?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/municipalities?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/allowance-items?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/deduction-items?tenantId=${tenantId}&activeOnly=true`),
      ]);
      const [cdg, _pc, mun, ai, di] = await Promise.all([
        cdgRes.ok ? cdgRes.json() : { data: [] },
        pcRes.ok ? pcRes.json() : { data: [] },
        munRes.ok ? munRes.json() : { data: [] },
        aiRes.ok ? aiRes.json() : { data: [] },
        diRes.ok ? diRes.json() : { data: [] },
      ]);
      setClosingDayGroups(cdg.data || []);
      // payCategories removed from UI (#5)
      setMunicipalities(mun.data || []);
      setAllowanceItems(ai.data || []);
      setDeductionItems(di.data || []);
    } catch { /* */ }
  }, [tenantId]);

  const fetchSalarySettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/salary-settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setSalarySettings(data.data);
      }
    } catch { /* */ }
  }, [user.id]);

  const fetchDependentInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/dependents`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setDependentInfo(data.data);
      }
    } catch { /* */ }
  }, [user.id]);

  const fetchResidentTax = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/resident-tax-monthly`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setResidentTax(data.data);
      }
    } catch { /* */ }
  }, [user.id]);

  useEffect(() => {
    fetchMasterData();
    fetchSalarySettings();
    fetchDependentInfo();
    fetchResidentTax();
  }, [fetchMasterData, fetchSalarySettings, fetchDependentInfo, fetchResidentTax]);

  // ── 業務情報 CRUD ──────────────────────────────────────────

  const startEditBusiness = () => {
    setBusinessForm({
      paymentType: salarySettings?.paymentType || payroll?.workType || '',
      closingDayGroupId: salarySettings?.closingDayGroupId || '',
    });
    setEditingBusiness(true);
  };

  const saveBusiness = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/salary-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: businessForm.paymentType,
          closingDayGroupId: businessForm.closingDayGroupId || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('業務情報を保存しました');
      setEditingBusiness(false);
      await fetchSalarySettings();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 扶養情報 CRUD ──────────────────────────────────────────

  const startEditDependent = () => {
    setDependentForm({
      hasSpouse: dependentInfo?.hasSpouse ?? false,
      spouseIsDependent: dependentInfo?.spouseIsDependent ?? false,
      generalDependents: dependentInfo?.generalDependents ?? 0,
      specificDependents: dependentInfo?.specificDependents ?? 0,
      elderlyDependents: dependentInfo?.elderlyDependents ?? 0,
      under16Dependents: dependentInfo?.under16Dependents ?? 0,
    });
    setEditingDependent(true);
  };

  const saveDependent = async () => {
    setIsSaving(true);
    try {
      const method = dependentInfo ? 'PATCH' : 'POST';
      const res = await fetch(`/api/users/${user.id}/dependents`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dependentForm),
      });
      if (!res.ok) throw new Error();
      toast.success('配偶者・扶養情報を保存しました');
      setEditingDependent(false);
      await fetchDependentInfo();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ── 住民税・所得税 CRUD ──────────────────────────────────────────

  // ── マイナンバー保存 ──────────────────────────────────────────

  const saveMyNumber = async () => {
    if (!/^\d{12}$/.test(myNumberInput)) {
      toast.error('マイナンバーは12桁の数字で入力してください');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myNumber: myNumberInput }),
      });
      if (!res.ok) throw new Error();
      toast.success('マイナンバーを保存しました');
      setMyNumberDialogOpen(false);
      setMyNumberInput('');
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ── ヘルパー ──────────────────────────────────────────

  const currentMunicipality = municipalities.find(m => m.id === salarySettings?.municipalityId);
  const currentClosingGroup = closingDayGroups.find(g => g.id === (salarySettings?.closingDayGroupId || businessForm.closingDayGroupId));
  const canEdit = isHR && !isReadOnly;

  // ══════════════════════════════════════════════════════════════
  // レンダリング
  // ══════════════════════════════════════════════════════════════

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">一般</TabsTrigger>
        <TabsTrigger value="salary-deduction">支給・控除</TabsTrigger>
        <TabsTrigger value="transfer">振込</TabsTrigger>
      </TabsList>

      {/* サブタブ1: 一般 */}
      <TabsContent value="general" className="space-y-4">
        {/* B1: 業務情報 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">業務情報</CardTitle>
                  <CardDescription>給与形態・基本給・締め日グループ</CardDescription>
                </div>
              </div>
              {canEdit && (
                <SectionEditButtons
                  isEditing={editingBusiness} isSaving={isSaving}
                  onEdit={startEditBusiness} onSave={saveBusiness}
                  onCancel={() => setEditingBusiness(false)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <EditableField
                label="給与形態"
                value={editingBusiness ? businessForm.paymentType : (paymentTypeLabels[salarySettings?.paymentType || payroll?.workType || ''] || salarySettings?.paymentType || payroll?.workType || '')}
                isEditing={editingBusiness}
                onChange={(v) => setBusinessForm(f => ({ ...f, paymentType: v }))}
                type="select"
                selectOptions={[
                  { value: 'monthly', label: '月給' },
                  { value: 'daily', label: '日給' },
                  { value: 'hourly', label: '時給' },
                ]}
              />
              <EditableField
                label="締め日グループ"
                value={editingBusiness ? businessForm.closingDayGroupId : (currentClosingGroup?.name || '')}
                isEditing={editingBusiness}
                onChange={(v) => setBusinessForm(f => ({ ...f, closingDayGroupId: v }))}
                type="select"
                selectOptions={closingDayGroups.map(g => ({ value: g.id, label: g.name }))}
              />
              <div>
                <p className="text-sm font-medium text-muted-foreground">部門</p>
                <p className="text-sm mt-1">{user.department || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">職種</p>
                <p className="text-sm mt-1">{user.position || '未設定'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* B3: 配偶者・扶養 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">配偶者・扶養</CardTitle>
                  <CardDescription>配偶者有無と扶養親族数</CardDescription>
                </div>
              </div>
              {canEdit && (
                <SectionEditButtons
                  isEditing={editingDependent} isSaving={isSaving}
                  onEdit={startEditDependent} onSave={saveDependent}
                  onCancel={() => setEditingDependent(false)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingDependent ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={dependentForm.hasSpouse} onCheckedChange={(v) => setDependentForm(f => ({ ...f, hasSpouse: v }))} />
                    <Label>配偶者あり</Label>
                  </div>
                  {dependentForm.hasSpouse && (
                    <div className="flex items-center gap-2">
                      <Switch checked={dependentForm.spouseIsDependent} onCheckedChange={(v) => setDependentForm(f => ({ ...f, spouseIsDependent: v }))} />
                      <Label>扶養対象</Label>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {([
                    { key: 'generalDependents', label: '一般扶養親族' },
                    { key: 'specificDependents', label: '特定扶養（19-22歳）' },
                    { key: 'elderlyDependents', label: '老人扶養（70歳以上）' },
                    { key: 'under16Dependents', label: '16歳未満' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <Input type="number" min="0" value={dependentForm[key]} onChange={e => setDependentForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">配偶者</p>
                  <p className="text-sm mt-1">{dependentInfo?.hasSpouse ? 'あり' : (payroll?.hasSpouse ? 'あり' : 'なし')}</p>
                </div>
                {(dependentInfo?.hasSpouse || payroll?.hasSpouse) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">扶養対象</p>
                    <p className="text-sm mt-1">{dependentInfo?.spouseIsDependent ? '対象' : '対象外'}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">一般扶養</p>
                  <p className="text-sm mt-1">{dependentInfo?.generalDependents ?? 0}人</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">特定扶養</p>
                  <p className="text-sm mt-1">{dependentInfo?.specificDependents ?? 0}人</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">老人扶養</p>
                  <p className="text-sm mt-1">{dependentInfo?.elderlyDependents ?? 0}人</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">16歳未満</p>
                  <p className="text-sm mt-1">{dependentInfo?.under16Dependents ?? 0}人</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* B4a: 扶養親族詳細 */}
        <DependentDetailsSection userId={user.id} canEdit={canEdit} />

        {/* B4b: 所得税 */}
        <IncomeTaxSection
          userId={user.id}
          canEdit={canEdit}
          fallbackTaxClassification={user.taxClassification || undefined}
          fallbackIsSecondaryIncome={user.isSecondaryIncome}
        />

        {/* B4c: 住民税 */}
        <ResidentTaxSection
          userId={user.id}
          canEdit={canEdit}
          municipalities={municipalities}
          fallbackMunicipalityId={currentMunicipality?.id}
          fallbackMunicipalityName={currentMunicipality ? `${currentMunicipality.prefectureName} ${currentMunicipality.name}` : payroll?.residentTaxCity}
        />

        {/* B5: マイナンバー */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">マイナンバー</CardTitle>
                  <CardDescription>個人番号（社会保険・労務管理用）</CardDescription>
                </div>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => { setMyNumberInput(''); setMyNumberDialogOpen(true); }}>
                  <Edit className="mr-1 h-4 w-4" />{user.myNumber || payroll?.myNumber ? '変更' : '登録'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>マイナンバーは暗号化して保存され、アクセスログが記録されます。</AlertDescription>
            </Alert>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">マイナンバー</p>
              <p className="text-sm mt-1 font-mono">
                {(user.myNumber || payroll?.myNumber) ? '●●●●●●●●●●●●' : '未登録'}
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* サブタブ2: 支給・控除 */}
      <TabsContent value="salary-deduction" className="space-y-4">
        <SalaryDeductionContent
          userId={user.id}
          salarySettings={salarySettings}
          payroll={payroll}
          allowanceItems={allowanceItems}
          deductionItems={deductionItems}
          residentTax={residentTax}
          canEdit={canEdit}
          onResidentTaxSaved={fetchResidentTax}
        />
      </TabsContent>

      {/* サブタブ3: 振込 */}
      <TabsContent value="transfer" className="space-y-4">
        <TransferContent userId={user.id} canEdit={canEdit} />
      </TabsContent>

      {/* マイナンバー入力ダイアログ */}
      <Dialog open={myNumberDialogOpen} onOpenChange={setMyNumberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>マイナンバーの{user.myNumber ? '変更' : '登録'}</DialogTitle>
            <DialogDescription>12桁の個人番号を入力してください</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>マイナンバー *</Label>
            <Input
              type="text" maxLength={12}
              value={myNumberInput}
              onChange={(e) => setMyNumberInput(e.target.value.replace(/\D/g, ''))}
              placeholder="123456789012"
              className="font-mono mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">半角数字12桁</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMyNumberDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveMyNumber} disabled={isSaving || myNumberInput.length !== 12}>
              {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
