'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Train, Shield, Landmark, Briefcase, Building, Umbrella } from 'lucide-react';
import { toast } from 'sonner';
import { SectionEditButtons } from './payroll-ui-helpers';
import {
  type AllowanceItem, type DeductionItem, type SalarySettings, type ResidentTaxMonthly,
  commuteMethodLabels, deductionCategoryLabels, residentTaxMonthKeys, residentTaxMonthLabels,
} from '@/lib/payroll/payroll-types';

interface PayrollInfo {
  commuteMethod?: string;
  commuteAllowance?: number;
  healthInsuranceGrade?: string | number;
  pensionGrade?: string | number;
  employmentInsuranceRate?: string;
}

interface Props {
  userId: string;
  salarySettings: SalarySettings | null;
  payroll: PayrollInfo | undefined;
  allowanceItems: AllowanceItem[];
  deductionItems: DeductionItem[];
  residentTax: ResidentTaxMonthly | null;
  canEdit: boolean;
  onResidentTaxSaved: () => void;
}

export function SalaryDeductionContent({
  userId, salarySettings, payroll, allowanceItems, deductionItems,
  residentTax, canEdit, onResidentTaxSaved,
}: Props) {
  const [editingResidentTax, setEditingResidentTax] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [residentTaxForm, setResidentTaxForm] = useState({
    fiscalYear: new Date().getFullYear(),
    month6: 0, month7: 0, month8: 0, month9: 0,
    month10: 0, month11: 0, month12: 0,
    month1: 0, month2: 0, month3: 0,
    month4: 0, month5: 0,
  });

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
      const res = await fetch(`/api/users/${userId}/resident-tax-monthly`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(residentTaxForm),
      });
      if (!res.ok) throw new Error();
      toast.success('住民税月額を保存しました');
      setEditingResidentTax(false);
      onResidentTaxSaved();
    } catch {
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* C1: 支給項目 */}
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
                {allowanceItems.sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
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

      {/* C3-C6: 保険関連 */}
      {([
        { icon: Shield, title: '健康保険', desc: '等級・報酬月額・負担額',
          grade: salarySettings?.healthInsuranceGrade ?? payroll?.healthInsuranceGrade ?? '未設定' },
        { icon: Landmark, title: '厚生年金保険', desc: '等級・報酬月額・負担額',
          grade: salarySettings?.pensionInsuranceGrade ?? payroll?.pensionGrade ?? '未設定' },
      ] as const).map(({ icon: Icon, title, desc, grade }) => (
        <Card key={title}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">等級</p>
                <p className="text-sm mt-1">{grade}</p>
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
      ))}

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

      {/* C7: 住民税月額 */}
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
                isEditing={editingResidentTax} isSaving={isSaving}
                onEdit={startEditResidentTax} onSave={saveResidentTax}
                onCancel={() => setEditingResidentTax(false)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {residentTaxMonthLabels.map(m => (
                  <TableHead key={m} className="text-center text-xs px-1">{m}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {editingResidentTax ? (
                  residentTaxMonthKeys.map(key => (
                    <TableCell key={key} className="px-1">
                      <Input
                        type="number" className="h-7 text-xs w-16"
                        value={residentTaxForm[key]}
                        onChange={(e) => setResidentTaxForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                      />
                    </TableCell>
                  ))
                ) : (
                  residentTaxMonthKeys.map(key => (
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

      {/* C8: 控除項目 */}
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
                {deductionItems.sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.deductionCategory === 'social_insurance' ? 'destructive' : item.deductionCategory === 'tax' ? 'default' : 'secondary'}>
                        {deductionCategoryLabels[item.deductionCategory] || item.deductionCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
