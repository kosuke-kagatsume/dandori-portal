'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Banknote,
  Building,
  CreditCard,
  Edit,
  ShieldAlert,
  Train,
  Landmark,
  Info,
  Heart,
  Shield,
  Briefcase,
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  Umbrella,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store';
import type { User } from '@/types';

interface UserPayrollTabProps {
  user: User;
  isReadOnly: boolean;
  isHR: boolean;
  onEdit?: () => void;
}

// ── 型定義 ──────────────────────────────────────────

interface ClosingDayGroup {
  id: string;
  name: string;
  closingDay: number;
  paymentMonth: string;
  paymentDay: number;
}

interface PayCategory {
  id: string;
  name: string;
  code: string;
}

interface Municipality {
  id: string;
  code: string;
  name: string;
  prefectureName: string;
}

interface AllowanceItem {
  id: string;
  code: string;
  name: string;
  isTaxable: boolean;
  itemType: string;
  defaultAmount: number | null;
  sortOrder: number;
}

interface DeductionItem {
  id: string;
  code: string;
  name: string;
  deductionCategory: string;
  sortOrder: number;
}

interface EmployeeDependent {
  id: string;
  hasSpouse: boolean;
  spouseIsDependent: boolean;
  generalDependents: number;
  specificDependents: number;
  elderlyDependents: number;
  under16Dependents: number;
}

interface BankAccount {
  id: string;
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
  transferAmount: number | null;
  sortOrder: number;
}

interface ResidentTaxMonthly {
  id: string;
  fiscalYear: number;
  month6: number; month7: number; month8: number; month9: number;
  month10: number; month11: number; month12: number;
  month1: number; month2: number; month3: number;
  month4: number; month5: number;
}

interface SalarySettings {
  id: string;
  paymentType: string;
  basicSalary: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  socialInsuranceGrade: number | null;
  employmentInsuranceRate: number;
  closingDayGroupId: string | null;
  payCategoryId: string | null;
  municipalityId: string | null;
  commuteMethod: string | null;
  commuteDistance: number | null;
  commuteAllowance: number | null;
  commuteNontaxableLimit: number | null;
  healthInsuranceGrade: number | null;
  pensionInsuranceGrade: number | null;
  nursingInsuranceApplicable: boolean;
}

// ── ラベル定義 ──────────────────────────────────────────

const _workTypeLabels: Record<string, string> = {
  monthly: '月給',
  daily: '日給',
  hourly: '時給',
};

const commuteMethodLabels: Record<string, string> = {
  train: '電車',
  bus: 'バス',
  car: '自動車',
  bicycle: '自転車',
  walk: '徒歩',
  other: 'その他',
};

const accountTypeLabels: Record<string, string> = {
  ordinary: '普通',
  current: '当座',
};

const taxClassLabels: Record<string, string> = {
  kou: '甲欄',
  otsu: '乙欄',
};

// ── EditableField コンポーネント ──────────────────────────────────────────

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

function EditableField({ label, value, isEditing, onChange, type = 'text', selectOptions, placeholder, suffix }: EditableFieldProps) {
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

// ── セクション編集ボタン ──────────────────────────────────────────

function SectionEditButtons({
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
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

// ══════════════════════════════════════════════════════════════
// メインコンポーネント
// ══════════════════════════════════════════════════════════════

export function UserPayrollTab({ user, isReadOnly, isHR }: UserPayrollTabProps) {
  const { currentTenant } = useTenantStore();
  const tenantId = currentTenant?.id;
  const payroll = user.payrollInfo;

  // ── マスタデータ ──────────────────────────────────────────
  const [closingDayGroups, setClosingDayGroups] = useState<ClosingDayGroup[]>([]);
  const [payCategories, setPayCategories] = useState<PayCategory[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [allowanceItems, setAllowanceItems] = useState<AllowanceItem[]>([]);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([]);

  // ── DBデータ ──────────────────────────────────────────
  const [salarySettings, setSalarySettings] = useState<SalarySettings | null>(null);
  const [dependentInfo, setDependentInfo] = useState<EmployeeDependent | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [residentTax, setResidentTax] = useState<ResidentTaxMonthly | null>(null);

  // ── 編集状態 ──────────────────────────────────────────
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingDependent, setEditingDependent] = useState(false);
  const [editingTax, setEditingTax] = useState(false);
  const [myNumberDialogOpen, setMyNumberDialogOpen] = useState(false);
  const [myNumberInput, setMyNumberInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 業務情報フォーム
  const [businessForm, setBusinessForm] = useState({
    paymentType: '',
    basicSalary: '',
    closingDayGroupId: '',
    payCategoryId: '',
    grade: '',
  });

  // 扶養情報フォーム
  const [dependentForm, setDependentForm] = useState({
    hasSpouse: false,
    spouseIsDependent: false,
    generalDependents: 0,
    specificDependents: 0,
    elderlyDependents: 0,
    under16Dependents: 0,
  });

  // 住民税・所得税フォーム
  const [taxForm, setTaxForm] = useState({
    municipalityId: '',
    isSecondaryIncome: false,
    taxClassification: '',
  });

  // 振込口座フォーム
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [deleteBankId, setDeleteBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    branchName: '',
    accountType: 'ordinary',
    accountNumber: '',
    accountHolder: '',
    isPrimary: false,
    transferAmount: '',
  });

  // 住民税月額フォーム
  const [editingResidentTax, setEditingResidentTax] = useState(false);
  const [residentTaxForm, setResidentTaxForm] = useState({
    fiscalYear: new Date().getFullYear(),
    month6: 0, month7: 0, month8: 0, month9: 0,
    month10: 0, month11: 0, month12: 0,
    month1: 0, month2: 0, month3: 0,
    month4: 0, month5: 0,
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
      const [cdg, pc, mun, ai, di] = await Promise.all([
        cdgRes.ok ? cdgRes.json() : { data: [] },
        pcRes.ok ? pcRes.json() : { data: [] },
        munRes.ok ? munRes.json() : { data: [] },
        aiRes.ok ? aiRes.json() : { data: [] },
        diRes.ok ? diRes.json() : { data: [] },
      ]);
      setClosingDayGroups(cdg.data || []);
      setPayCategories(pc.data || []);
      setMunicipalities(mun.data || []);
      setAllowanceItems(ai.data || []);
      setDeductionItems(di.data || []);
    } catch {
      // silently fail
    }
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

  const fetchBankAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/bank-accounts`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setBankAccounts(data.data);
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
    fetchBankAccounts();
    fetchResidentTax();
  }, [fetchMasterData, fetchSalarySettings, fetchDependentInfo, fetchBankAccounts, fetchResidentTax]);

  // ── 業務情報セクション保存 ──────────────────────────────────────────

  const startEditBusiness = () => {
    setBusinessForm({
      paymentType: salarySettings?.paymentType || payroll?.workType || '',
      basicSalary: String(salarySettings?.basicSalary ?? payroll?.basicSalary ?? ''),
      closingDayGroupId: salarySettings?.closingDayGroupId || '',
      payCategoryId: salarySettings?.payCategoryId || '',
      grade: String(salarySettings?.socialInsuranceGrade ?? ''),
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
          basicSalary: parseInt(businessForm.basicSalary) || 0,
          closingDayGroupId: businessForm.closingDayGroupId || null,
          payCategoryId: businessForm.payCategoryId || null,
          socialInsuranceGrade: parseInt(businessForm.grade) || null,
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

  // ── 扶養情報セクション保存 ──────────────────────────────────────────

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

  // ── 住民税・所得税セクション保存 ──────────────────────────────────────────

  const startEditTax = () => {
    setTaxForm({
      municipalityId: salarySettings?.municipalityId || '',
      isSecondaryIncome: user.isSecondaryIncome ?? false,
      taxClassification: user.taxClassification || '',
    });
    setEditingTax(true);
  };

  const saveTax = async () => {
    setIsSaving(true);
    try {
      // ユーザー情報更新
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSecondaryIncome: taxForm.isSecondaryIncome,
          taxClassification: taxForm.taxClassification || null,
        }),
      });
      // 給与設定更新
      await fetch(`/api/users/${user.id}/salary-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipalityId: taxForm.municipalityId || null,
        }),
      });
      toast.success('住民税・所得税情報を保存しました');
      setEditingTax(false);
      await fetchSalarySettings();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

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

  // ── 振込口座CRUD ──────────────────────────────────────────

  const openAddBank = () => {
    setEditingBank(null);
    setBankForm({ bankName: '', branchName: '', accountType: 'ordinary', accountNumber: '', accountHolder: '', isPrimary: bankAccounts.length === 0, transferAmount: '' });
    setBankDialogOpen(true);
  };

  const openEditBank = (account: BankAccount) => {
    setEditingBank(account);
    setBankForm({
      bankName: account.bankName,
      branchName: account.branchName,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      isPrimary: account.isPrimary,
      transferAmount: account.transferAmount != null ? String(account.transferAmount) : '',
    });
    setBankDialogOpen(true);
  };

  const saveBank = async () => {
    if (!bankForm.bankName || !bankForm.branchName || !bankForm.accountNumber || !bankForm.accountHolder) {
      toast.error('必須項目を入力してください');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...bankForm,
        transferAmount: bankForm.transferAmount ? parseInt(bankForm.transferAmount) : null,
      };
      const url = editingBank
        ? `/api/users/${user.id}/bank-accounts/${editingBank.id}`
        : `/api/users/${user.id}/bank-accounts`;
      const method = editingBank ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success(editingBank ? '口座情報を更新しました' : '口座を追加しました');
      setBankDialogOpen(false);
      await fetchBankAccounts();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBank = async () => {
    if (!deleteBankId) return;
    try {
      const res = await fetch(`/api/users/${user.id}/bank-accounts/${deleteBankId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('口座を削除しました');
      setDeleteBankId(null);
      await fetchBankAccounts();
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  // ── 住民税月額保存 ──────────────────────────────────────────

  const startEditResidentTax = () => {
    if (residentTax) {
      setResidentTaxForm({
        fiscalYear: residentTax.fiscalYear,
        month6: residentTax.month6, month7: residentTax.month7,
        month8: residentTax.month8, month9: residentTax.month9,
        month10: residentTax.month10, month11: residentTax.month11,
        month12: residentTax.month12, month1: residentTax.month1,
        month2: residentTax.month2, month3: residentTax.month3,
        month4: residentTax.month4, month5: residentTax.month5,
      });
    }
    setEditingResidentTax(true);
  };

  const saveResidentTax = async () => {
    setIsSaving(true);
    try {
      const method = residentTax ? 'PATCH' : 'POST';
      const res = await fetch(`/api/users/${user.id}/resident-tax-monthly`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(residentTaxForm),
      });
      if (!res.ok) throw new Error();
      toast.success('住民税月額を保存しました');
      setEditingResidentTax(false);
      await fetchResidentTax();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ── ヘルパー ──────────────────────────────────────────

  const currentMunicipality = municipalities.find(m => m.id === (salarySettings?.municipalityId || taxForm.municipalityId));
  const currentClosingGroup = closingDayGroups.find(g => g.id === (salarySettings?.closingDayGroupId || businessForm.closingDayGroupId));
  const currentPayCategory = payCategories.find(c => c.id === (salarySettings?.payCategoryId || businessForm.payCategoryId));

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

      {/* ════════════════════════════════════════════════════════ */}
      {/* サブタブ1: 一般 */}
      {/* ════════════════════════════════════════════════════════ */}
      <TabsContent value="general" className="space-y-4">

        {/* B1: 業務情報（旧「基本・勤務」） */}
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
                  isEditing={editingBusiness}
                  isSaving={isSaving}
                  onEdit={startEditBusiness}
                  onSave={saveBusiness}
                  onCancel={() => setEditingBusiness(false)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <EditableField
                label="給与形態"
                value={editingBusiness ? businessForm.paymentType : (salarySettings?.paymentType || payroll?.workType || '')}
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
                label="基本給"
                value={editingBusiness
                  ? businessForm.basicSalary
                  : (salarySettings?.basicSalary != null ? `¥${salarySettings.basicSalary.toLocaleString()}` : (payroll?.basicSalary != null ? `¥${payroll.basicSalary.toLocaleString()}` : ''))}
                isEditing={editingBusiness}
                onChange={(v) => setBusinessForm(f => ({ ...f, basicSalary: v }))}
                type="number"
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
                label="給与カテゴリ"
                value={editingBusiness ? businessForm.payCategoryId : (currentPayCategory?.name || '')}
                isEditing={editingBusiness}
                onChange={(v) => setBusinessForm(f => ({ ...f, payCategoryId: v }))}
                type="select"
                selectOptions={payCategories.map(c => ({ value: c.id, label: c.name }))}
              />
              <EditableField
                label="等級"
                value={editingBusiness ? businessForm.grade : String(salarySettings?.socialInsuranceGrade ?? '')}
                isEditing={editingBusiness}
                onChange={(v) => setBusinessForm(f => ({ ...f, grade: v }))}
                type="number"
              />
              <div>
                <p className="text-sm font-medium text-muted-foreground">雇用形態</p>
                <p className="text-sm mt-1">{user.employmentType || '未設定'}</p>
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
                  isEditing={editingDependent}
                  isSaving={isSaving}
                  onEdit={startEditDependent}
                  onSave={saveDependent}
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
                    <Switch
                      checked={dependentForm.hasSpouse}
                      onCheckedChange={(v) => setDependentForm(f => ({ ...f, hasSpouse: v }))}
                    />
                    <Label>配偶者あり</Label>
                  </div>
                  {dependentForm.hasSpouse && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dependentForm.spouseIsDependent}
                        onCheckedChange={(v) => setDependentForm(f => ({ ...f, spouseIsDependent: v }))}
                      />
                      <Label>扶養対象</Label>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">一般扶養親族</Label>
                    <Input type="number" min="0" value={dependentForm.generalDependents} onChange={e => setDependentForm(f => ({ ...f, generalDependents: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">特定扶養（19-22歳）</Label>
                    <Input type="number" min="0" value={dependentForm.specificDependents} onChange={e => setDependentForm(f => ({ ...f, specificDependents: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">老人扶養（70歳以上）</Label>
                    <Input type="number" min="0" value={dependentForm.elderlyDependents} onChange={e => setDependentForm(f => ({ ...f, elderlyDependents: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">16歳未満</Label>
                    <Input type="number" min="0" value={dependentForm.under16Dependents} onChange={e => setDependentForm(f => ({ ...f, under16Dependents: parseInt(e.target.value) || 0 }))} />
                  </div>
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

        {/* B4: 住民税・所得税 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">住民税・所得税</CardTitle>
                  <CardDescription>税金関連設定</CardDescription>
                </div>
              </div>
              {canEdit && (
                <SectionEditButtons
                  isEditing={editingTax}
                  isSaving={isSaving}
                  onEdit={startEditTax}
                  onSave={saveTax}
                  onCancel={() => setEditingTax(false)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingTax ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">市区町村</Label>
                  <Select value={taxForm.municipalityId} onValueChange={(v) => setTaxForm(f => ({ ...f, municipalityId: v }))}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.prefectureName} {m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    checked={taxForm.isSecondaryIncome}
                    onCheckedChange={(v) => setTaxForm(f => ({ ...f, isSecondaryIncome: v }))}
                  />
                  <Label className="text-xs">従たる給与</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">甲乙区分</Label>
                  <Select value={taxForm.taxClassification} onValueChange={(v) => setTaxForm(f => ({ ...f, taxClassification: v }))}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kou">甲欄</SelectItem>
                      <SelectItem value="otsu">乙欄</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">市区町村</p>
                  <p className="text-sm mt-1">
                    {currentMunicipality ? `${currentMunicipality.prefectureName} ${currentMunicipality.name}` : (payroll?.residentTaxCity || '未設定')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">従たる給与</p>
                  <p className="text-sm mt-1">{user.isSecondaryIncome ? 'あり' : 'なし'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">甲乙区分</p>
                  <p className="text-sm mt-1">
                    {user.taxClassification ? taxClassLabels[user.taxClassification] || user.taxClassification : (payroll?.incomeTaxType ? (payroll.incomeTaxType === 'otsu' ? '乙欄' : '甲欄') : '未設定')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              <AlertDescription>
                マイナンバーは暗号化して保存され、アクセスログが記録されます。
              </AlertDescription>
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

      {/* ════════════════════════════════════════════════════════ */}
      {/* サブタブ2: 支給・控除 */}
      {/* ════════════════════════════════════════════════════════ */}
      <TabsContent value="salary-deduction" className="space-y-4">

        {/* C1: 支給項目テーブル */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">支給項目</CardTitle>
                <CardDescription>マスタ定義された支給項目と個別金額</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {allowanceItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                支給項目が未設定です。設定 &gt; 給与 &gt; 支給項目から追加してください。
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>項目名</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>課税区分</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowanceItems.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.itemType === 'fixed' ? '固定' : '変動'}</TableCell>
                      <TableCell>
                        <Badge variant={item.isTaxable ? 'default' : 'secondary'}>
                          {item.isTaxable ? '課税' : '非課税'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.defaultAmount != null ? `¥${item.defaultAmount.toLocaleString()}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* C2: 通勤手当 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Train className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">通勤手当</CardTitle>
                <CardDescription>通勤方法・距離・定期代</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">通勤方法</p>
                <p className="text-sm mt-1">
                  {salarySettings?.commuteMethod ? commuteMethodLabels[salarySettings.commuteMethod] : (payroll?.commuteMethod ? commuteMethodLabels[payroll.commuteMethod] : '未設定')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">片道距離</p>
                <p className="text-sm mt-1">
                  {salarySettings?.commuteDistance != null ? `${salarySettings.commuteDistance} km` : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">定期代 / 通勤手当</p>
                <p className="text-sm mt-1">
                  {salarySettings?.commuteAllowance != null ? `¥${salarySettings.commuteAllowance.toLocaleString()}/月` : (payroll?.commuteAllowance != null ? `¥${payroll.commuteAllowance.toLocaleString()}/月` : '未設定')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">非課税限度額</p>
                <p className="text-sm mt-1">
                  {salarySettings?.commuteNontaxableLimit != null ? `¥${salarySettings.commuteNontaxableLimit.toLocaleString()}` : '未設定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* C3: 健康保険 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">健康保険</CardTitle>
                <CardDescription>等級・報酬月額・負担額</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">等級</p>
                <p className="text-sm mt-1">{salarySettings?.healthInsuranceGrade ?? payroll?.healthInsuranceGrade ?? '未設定'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">報酬月額</p>
                <p className="text-sm mt-1">未設定</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">被保険者負担</p>
                <p className="text-sm mt-1">未設定</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* C4: 厚生年金保険 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">厚生年金保険</CardTitle>
                <CardDescription>等級・報酬月額・負担額</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">等級</p>
                <p className="text-sm mt-1">{salarySettings?.pensionInsuranceGrade ?? payroll?.pensionGrade ?? '未設定'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">報酬月額</p>
                <p className="text-sm mt-1">未設定</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">被保険者負担</p>
                <p className="text-sm mt-1">未設定</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* C5: 雇用保険 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">雇用保険</CardTitle>
                <CardDescription>負担率・負担額</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">負担率</p>
                <p className="text-sm mt-1">
                  {salarySettings?.employmentInsuranceRate != null
                    ? `${(salarySettings.employmentInsuranceRate * 100).toFixed(1)}%`
                    : payroll?.employmentInsuranceRate || '未設定'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">被保険者負担</p>
                <p className="text-sm mt-1">未設定</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">事業主負担</p>
                <p className="text-sm mt-1">未設定</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* C6: 介護保険 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Umbrella className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">介護保険</CardTitle>
                <CardDescription>対象区分・負担率</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">対象区分</p>
                <p className="text-sm mt-1">
                  <Badge variant={salarySettings?.nursingInsuranceApplicable ? 'default' : 'secondary'}>
                    {salarySettings?.nursingInsuranceApplicable ? '対象' : '非対象'}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">負担率</p>
                <p className="text-sm mt-1">未設定</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* C7: 住民税月額テーブル */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">住民税月額</CardTitle>
                  <CardDescription>6月〜翌5月の12ヶ月分</CardDescription>
                </div>
              </div>
              {canEdit && (
                <SectionEditButtons
                  isEditing={editingResidentTax}
                  isSaving={isSaving}
                  onEdit={startEditResidentTax}
                  onSave={saveResidentTax}
                  onCancel={() => setEditingResidentTax(false)}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {['6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月'].map((m) => (
                    <TableHead key={m} className="text-center text-xs px-1">{m}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {editingResidentTax ? (
                    (['month6', 'month7', 'month8', 'month9', 'month10', 'month11', 'month12', 'month1', 'month2', 'month3', 'month4', 'month5'] as const).map((key) => (
                      <TableCell key={key} className="px-1">
                        <Input
                          type="number"
                          className="h-7 text-xs w-16"
                          value={residentTaxForm[key]}
                          onChange={(e) => setResidentTaxForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                        />
                      </TableCell>
                    ))
                  ) : (
                    (['month6', 'month7', 'month8', 'month9', 'month10', 'month11', 'month12', 'month1', 'month2', 'month3', 'month4', 'month5'] as const).map((key) => (
                      <TableCell key={key} className="text-center text-xs px-1">
                        {residentTax ? `¥${residentTax[key].toLocaleString()}` : '-'}
                      </TableCell>
                    ))
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* C8: 控除項目テーブル */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">控除項目</CardTitle>
                <CardDescription>マスタ定義された控除項目と個別金額</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {deductionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                控除項目が未設定です。設定 &gt; 給与 &gt; 控除項目から追加してください。
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>控除名</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductionItems.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => {
                    const categoryLabels: Record<string, string> = {
                      social_insurance: '法定控除',
                      tax: '税金',
                      other: '任意控除',
                    };
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant={item.deductionCategory === 'social_insurance' ? 'destructive' : item.deductionCategory === 'tax' ? 'default' : 'secondary'}>
                            {categoryLabels[item.deductionCategory] || item.deductionCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ════════════════════════════════════════════════════════ */}
      {/* サブタブ3: 振込 */}
      {/* ════════════════════════════════════════════════════════ */}
      <TabsContent value="transfer" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">振込口座</CardTitle>
                  <CardDescription>給与の振込先口座（メイン口座 + サブ口座）</CardDescription>
                </div>
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={openAddBank}>
                  <Plus className="mr-1 h-4 w-4" />追加
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {bankAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">振込口座の登録はありません</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>区分</TableHead>
                    <TableHead>銀行名</TableHead>
                    <TableHead>支店名</TableHead>
                    <TableHead>口座種別</TableHead>
                    <TableHead>口座番号</TableHead>
                    <TableHead>名義人</TableHead>
                    <TableHead className="text-right">振込額</TableHead>
                    {canEdit && <TableHead className="w-[80px]">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.sort((a, b) => a.sortOrder - b.sortOrder).map((account) => (
                    <TableRow key={account.id} className={canEdit ? 'cursor-pointer' : ''} onClick={() => canEdit && openEditBank(account)}>
                      <TableCell>
                        <Badge variant={account.isPrimary ? 'default' : 'secondary'}>
                          {account.isPrimary ? 'メイン' : 'サブ'}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.bankName}</TableCell>
                      <TableCell>{account.branchName}</TableCell>
                      <TableCell>{accountTypeLabels[account.accountType] || account.accountType}</TableCell>
                      <TableCell>{account.accountNumber}</TableCell>
                      <TableCell>{account.accountHolder}</TableCell>
                      <TableCell className="text-right">
                        {account.isPrimary ? '残額全額' : (account.transferAmount != null ? `¥${account.transferAmount.toLocaleString()}` : '残額全額')}
                      </TableCell>
                      {canEdit && (
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditBank(account)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteBankId(account.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {bankAccounts.length > 1 && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  サブ口座に定額が設定されている場合、残額がメイン口座に振り込まれます。
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ダイアログ */}
      {/* ════════════════════════════════════════════════════════ */}

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
              type="text"
              maxLength={12}
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

      {/* 振込口座追加・編集ダイアログ */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBank ? '口座情報の編集' : '振込口座の追加'}</DialogTitle>
            <DialogDescription>振込先口座の情報を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>銀行名 *</Label>
                <Input value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>支店名 *</Label>
                <Input value={bankForm.branchName} onChange={e => setBankForm(f => ({ ...f, branchName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>口座種別</Label>
                <Select value={bankForm.accountType} onValueChange={v => setBankForm(f => ({ ...f, accountType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinary">普通</SelectItem>
                    <SelectItem value="current">当座</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>口座番号 *</Label>
                <Input value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>口座名義 *</Label>
              <Input value={bankForm.accountHolder} onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={bankForm.isPrimary} onCheckedChange={v => setBankForm(f => ({ ...f, isPrimary: v }))} />
                <Label>メイン口座</Label>
              </div>
              {!bankForm.isPrimary && (
                <div className="space-y-1">
                  <Label>振込額</Label>
                  <Input type="number" value={bankForm.transferAmount} onChange={e => setBankForm(f => ({ ...f, transferAmount: e.target.value }))} placeholder="空欄で残額全額" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>キャンセル</Button>
            <Button onClick={saveBank} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {editingBank ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 口座削除確認 */}
      <AlertDialog open={!!deleteBankId} onOpenChange={() => setDeleteBankId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>口座の削除</AlertDialogTitle>
            <AlertDialogDescription>この口座情報を削除しますか？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBank}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
