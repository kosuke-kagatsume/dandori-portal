'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';
import type { User } from '@/types';
import {
  type ClosingDayGroup, type Municipality,
  type AllowanceItem, type DeductionItem,
  type ResidentTaxMonthly, type SalarySettings,
} from '@/lib/payroll/payroll-types';
import { EditableField, SectionEditButtons } from './payroll/payroll-ui-helpers';
import { SalaryDeductionContent } from './payroll/salary-deduction-content';
import { TransferContent } from './payroll/transfer-content';
import { IncomeTaxSection } from './payroll/income-tax-section';
import { ResidentTaxSection } from './payroll/resident-tax-section';
import { DependentDetailsSection } from './payroll/dependent-details-section';
import { MynumberSection } from './payroll/mynumber-section';

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
  const [masterDepartments, setMasterDepartments] = useState<{ id: string; name: string }[]>([]);
  const [masterPositions, setMasterPositions] = useState<{ id: string; name: string }[]>([]);
  const [allowanceItems, setAllowanceItems] = useState<AllowanceItem[]>([]);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([]);

  // ── DBデータ ──────────────────────────────────────────
  const [salarySettings, setSalarySettings] = useState<SalarySettings | null>(null);
  const [residentTax, setResidentTax] = useState<ResidentTaxMonthly | null>(null);

  // ── 編集状態 ──────────────────────────────────────────
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [businessForm, setBusinessForm] = useState({
    paymentType: '', closingDayGroupId: '',
    departmentId: '', positionId: '',
  });

  // ── データ取得 ──────────────────────────────────────────

  const fetchMasterData = useCallback(async () => {
    if (!tenantId) return;
    const base = `/api/settings/payroll`;
    try {
      const [cdgRes, pcRes, munRes, aiRes, diRes, deptRes, posRes] = await Promise.all([
        fetch(`${base}/closing-day-groups?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/pay-categories?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/municipalities?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/allowance-items?tenantId=${tenantId}&activeOnly=true`),
        fetch(`${base}/deduction-items?tenantId=${tenantId}&activeOnly=true`),
        fetch(`/api/master-data/departments?tenantId=${tenantId}&limit=100`),
        fetch(`/api/master-data/positions?tenantId=${tenantId}&limit=100`),
      ]);
      const [cdg, _pc, mun, ai, di, dept, pos] = await Promise.all([
        cdgRes.ok ? cdgRes.json() : { data: [] },
        pcRes.ok ? pcRes.json() : { data: [] },
        munRes.ok ? munRes.json() : { data: [] },
        aiRes.ok ? aiRes.json() : { data: [] },
        diRes.ok ? diRes.json() : { data: [] },
        deptRes.ok ? deptRes.json() : { data: [] },
        posRes.ok ? posRes.json() : { data: [] },
      ]);
      setClosingDayGroups(cdg.data || []);
      setMunicipalities(mun.data || []);
      setAllowanceItems(ai.data || []);
      setDeductionItems(di.data || []);
      setMasterDepartments(dept.data || []);
      setMasterPositions(pos.data || []);
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
    fetchResidentTax();
  }, [fetchMasterData, fetchSalarySettings, fetchResidentTax]);

  // ── 業務情報 CRUD ──────────────────────────────────────────

  const startEditBusiness = () => {
    setBusinessForm({
      paymentType: salarySettings?.paymentType || payroll?.workType || '',
      closingDayGroupId: salarySettings?.closingDayGroupId || '',
      departmentId: user.departmentId || '',
      positionId: user.positionId || '',
    });
    setEditingBusiness(true);
  };

  const saveBusiness = async () => {
    setIsSaving(true);
    try {
      const selectedDept = masterDepartments.find(d => d.id === businessForm.departmentId);
      const selectedPos = masterPositions.find(p => p.id === businessForm.positionId);

      const [salaryRes, userRes] = await Promise.all([
        fetch(`/api/users/${user.id}/salary-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentType: businessForm.paymentType,
            closingDayGroupId: businessForm.closingDayGroupId || null,
          }),
        }),
        fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            departmentId: businessForm.departmentId || null,
            department: selectedDept?.name || '',
            positionId: businessForm.positionId || null,
            position: selectedPos?.name || '',
          }),
        }),
      ]);
      if (!salaryRes.ok || !userRes.ok) throw new Error();
      toast.success('業務情報を保存しました');
      setEditingBusiness(false);
      await fetchSalarySettings();
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
              <EditableField
                label="部門"
                value={editingBusiness ? businessForm.departmentId : (user.department || '')}
                isEditing={editingBusiness}
                onChange={(v) => setBusinessForm(f => ({ ...f, departmentId: v }))}
                type="select"
                selectOptions={masterDepartments.map(d => ({ value: d.id, label: d.name }))}
              />
              <EditableField
                label="職種"
                value={editingBusiness ? businessForm.positionId : (user.position || '')}
                isEditing={editingBusiness}
                onChange={(v) => setBusinessForm(f => ({ ...f, positionId: v }))}
                type="select"
                selectOptions={masterPositions.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* 扶養親族詳細（配偶者・扶養カードは扶養親族詳細に集約済みのため削除） */}
        <DependentDetailsSection userId={user.id} canEdit={canEdit} canReadMynumber={isHR} canManageMynumber={canEdit} />

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

        {/* B5: マイナンバー（暗号化・個別権限・監査ログ対応） */}
        <MynumberSection
          userId={user.id}
          canManage={canEdit}
          canRead={isHR}
        />
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

    </Tabs>
  );
}
