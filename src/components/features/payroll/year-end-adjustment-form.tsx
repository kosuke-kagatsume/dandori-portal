'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calculator, User, Users, Home, Heart, FileText } from 'lucide-react';
import type { YearEndAdjustmentDeductions } from '@/lib/payroll/year-end-adjustment-types';

interface YearEndAdjustmentFormProps {
  employeeId: string;
  employeeName: string;
  fiscalYear: number;
  onSubmit: (deductions: YearEndAdjustmentDeductions) => void;
  isCalculating?: boolean;
}

export function YearEndAdjustmentForm({
  employeeId,
  employeeName,
  fiscalYear,
  onSubmit,
  isCalculating = false,
}: YearEndAdjustmentFormProps) {
  // 配偶者情報
  const [hasSpouse, setHasSpouse] = useState(false);
  const [spouseIncome, setSpouseIncome] = useState(0);
  const [spouseAge, setSpouseAge] = useState(40);

  // 扶養親族
  const [dependentGeneral, setDependentGeneral] = useState(0);
  const [dependentSpecific, setDependentSpecific] = useState(0);
  const [dependentElderly, setDependentElderly] = useState(0);
  const [dependentElderlyLiving, setDependentElderlyLiving] = useState(0);

  // 障害者控除
  const [disabilityGeneral, setDisabilityGeneral] = useState(0);
  const [disabilitySpecial, setDisabilitySpecial] = useState(0);
  const [disabilitySpecialLiving, setDisabilitySpecialLiving] = useState(0);

  // 生命保険料
  const [lifeGeneral, setLifeGeneral] = useState(0);
  const [lifeMedical, setLifeMedical] = useState(0);
  const [lifePension, setLifePension] = useState(0);

  // 地震保険料
  const [earthquakeInsurance, setEarthquakeInsurance] = useState(0);
  const [longTermDamage, setLongTermDamage] = useState(0);

  // 小規模企業共済等掛金
  const [ideco, setIdeco] = useState(0);
  const [mutualAid, setMutualAid] = useState(0);

  // 住宅借入金等特別控除
  const [hasMortgage, setHasMortgage] = useState(false);
  const [mortgageLoanBalance, setMortgageLoanBalance] = useState(0);
  const [mortgageRate, setMortgageRate] = useState(0.01);
  const [mortgageMax, setMortgageMax] = useState(400000);

  // その他控除
  const [widow, setWidow] = useState(0);
  const [singleParent, setSingleParent] = useState(0);
  const [workingStudent, setWorkingStudent] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const deductions: YearEndAdjustmentDeductions = {
      spouse: {
        hasSpouse,
        spouseIncome,
        spouseAge,
      },
      dependent: {
        general: dependentGeneral,
        specific: dependentSpecific,
        elderly: dependentElderly,
        elderlyLivingTogether: dependentElderlyLiving,
      },
      disability: {
        general: disabilityGeneral,
        special: disabilitySpecial,
        specialLivingTogether: disabilitySpecialLiving,
      },
      lifeInsurance: {
        generalInsurance: lifeGeneral,
        medicalInsurance: lifeMedical,
        pensionInsurance: lifePension,
      },
      earthquakeInsurance: {
        earthquakeInsurance,
        longTermDamageInsurance: longTermDamage,
      },
      socialInsurance: {
        healthInsurance: 0, // 自動計算
        pension: 0, // 自動計算
        employmentInsurance: 0, // 自動計算
        nationalPension: 0,
        other: 0,
      },
      smallBusinessMutualAid: {
        ideco,
        mutualAid,
      },
      mortgage: hasMortgage
        ? {
            loanBalance: mortgageLoanBalance,
            deductionRate: mortgageRate,
            maxDeduction: mortgageMax,
          }
        : undefined,
      other: {
        widow,
        singleParent,
        workingStudent,
      },
    };

    onSubmit(deductions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{fiscalYear}年 年末調整申告</h3>
          <p className="text-sm text-muted-foreground">
            従業員: {employeeName} ({employeeId})
          </p>
        </div>
        <Button type="submit" disabled={isCalculating}>
          <Calculator className="mr-2 h-4 w-4" />
          {isCalculating ? '計算中...' : '年末調整を計算'}
        </Button>
      </div>

      <Separator />

      {/* 配偶者情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            配偶者情報
          </CardTitle>
          <CardDescription>
            配偶者控除・配偶者特別控除の適用を受ける場合は入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSpouse"
              checked={hasSpouse}
              onCheckedChange={(checked) => setHasSpouse(checked as boolean)}
            />
            <Label htmlFor="hasSpouse">配偶者あり</Label>
          </div>

          {hasSpouse && (
            <div className="grid gap-4 md:grid-cols-2 ml-6">
              <div className="space-y-2">
                <Label htmlFor="spouseIncome">配偶者の年間所得（円）</Label>
                <Input
                  id="spouseIncome"
                  type="number"
                  value={spouseIncome}
                  onChange={(e) => setSpouseIncome(Number(e.target.value))}
                  placeholder="480,000"
                />
                <p className="text-xs text-muted-foreground">
                  48万円以下：配偶者控除、48万円超133万円以下：配偶者特別控除
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouseAge">配偶者の年齢</Label>
                <Input
                  id="spouseAge"
                  type="number"
                  value={spouseAge}
                  onChange={(e) => setSpouseAge(Number(e.target.value))}
                  placeholder="40"
                />
                <p className="text-xs text-muted-foreground">
                  70歳以上：老人控除対象配偶者
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 扶養親族情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            扶養親族
          </CardTitle>
          <CardDescription>
            扶養控除の対象となる親族の人数を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dependentGeneral">一般扶養親族（16歳以上、38万円）</Label>
            <Input
              id="dependentGeneral"
              type="number"
              min="0"
              value={dependentGeneral}
              onChange={(e) => setDependentGeneral(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dependentSpecific">特定扶養親族（19-23歳未満、63万円）</Label>
            <Input
              id="dependentSpecific"
              type="number"
              min="0"
              value={dependentSpecific}
              onChange={(e) => setDependentSpecific(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dependentElderly">老人扶養親族（70歳以上、48万円）</Label>
            <Input
              id="dependentElderly"
              type="number"
              min="0"
              value={dependentElderly}
              onChange={(e) => setDependentElderly(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dependentElderlyLiving">同居老親等（70歳以上同居、58万円）</Label>
            <Input
              id="dependentElderlyLiving"
              type="number"
              min="0"
              value={dependentElderlyLiving}
              onChange={(e) => setDependentElderlyLiving(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* 生命保険料控除 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            生命保険料控除
          </CardTitle>
          <CardDescription>
            年間支払保険料を入力してください（最大12万円控除）
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="lifeGeneral">一般生命保険料（円）</Label>
            <Input
              id="lifeGeneral"
              type="number"
              min="0"
              value={lifeGeneral}
              onChange={(e) => setLifeGeneral(Number(e.target.value))}
              placeholder="80,000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lifeMedical">介護医療保険料（円）</Label>
            <Input
              id="lifeMedical"
              type="number"
              min="0"
              value={lifeMedical}
              onChange={(e) => setLifeMedical(Number(e.target.value))}
              placeholder="40,000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lifePension">個人年金保険料（円）</Label>
            <Input
              id="lifePension"
              type="number"
              min="0"
              value={lifePension}
              onChange={(e) => setLifePension(Number(e.target.value))}
              placeholder="60,000"
            />
          </div>
        </CardContent>
      </Card>

      {/* 地震保険料控除 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            地震保険料控除
          </CardTitle>
          <CardDescription>
            年間支払保険料を入力してください（最大5万円控除）
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="earthquakeInsurance">地震保険料（円）</Label>
            <Input
              id="earthquakeInsurance"
              type="number"
              min="0"
              value={earthquakeInsurance}
              onChange={(e) => setEarthquakeInsurance(Number(e.target.value))}
              placeholder="50,000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longTermDamage">旧長期損害保険料（円）</Label>
            <Input
              id="longTermDamage"
              type="number"
              min="0"
              value={longTermDamage}
              onChange={(e) => setLongTermDamage(Number(e.target.value))}
              placeholder="15,000"
            />
          </div>
        </CardContent>
      </Card>

      {/* 小規模企業共済等掛金控除 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            小規模企業共済等掛金控除
          </CardTitle>
          <CardDescription>
            iDeCo・小規模企業共済の年間掛金を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ideco">iDeCo掛金（円）</Label>
            <Input
              id="ideco"
              type="number"
              min="0"
              value={ideco}
              onChange={(e) => setIdeco(Number(e.target.value))}
              placeholder="276,000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mutualAid">小規模企業共済掛金（円）</Label>
            <Input
              id="mutualAid"
              type="number"
              min="0"
              value={mutualAid}
              onChange={(e) => setMutualAid(Number(e.target.value))}
              placeholder="840,000"
            />
          </div>
        </CardContent>
      </Card>

      {/* 住宅借入金等特別控除 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            住宅借入金等特別控除
          </CardTitle>
          <CardDescription>
            住宅ローン控除を受ける場合は入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasMortgage"
              checked={hasMortgage}
              onCheckedChange={(checked) => setHasMortgage(checked as boolean)}
            />
            <Label htmlFor="hasMortgage">住宅ローン控除あり</Label>
          </div>

          {hasMortgage && (
            <div className="grid gap-4 md:grid-cols-3 ml-6">
              <div className="space-y-2">
                <Label htmlFor="mortgageLoanBalance">年末残高（円）</Label>
                <Input
                  id="mortgageLoanBalance"
                  type="number"
                  value={mortgageLoanBalance}
                  onChange={(e) => setMortgageLoanBalance(Number(e.target.value))}
                  placeholder="30,000,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mortgageRate">控除率</Label>
                <Input
                  id="mortgageRate"
                  type="number"
                  step="0.001"
                  value={mortgageRate}
                  onChange={(e) => setMortgageRate(Number(e.target.value))}
                  placeholder="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mortgageMax">控除限度額（円）</Label>
                <Input
                  id="mortgageMax"
                  type="number"
                  value={mortgageMax}
                  onChange={(e) => setMortgageMax(Number(e.target.value))}
                  placeholder="400,000"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
