'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, DollarSign, FileText, Calculator } from 'lucide-react';
import type { YearEndAdjustmentResult } from '@/lib/payroll/year-end-adjustment-types';

interface YearEndAdjustmentResultProps {
  result: YearEndAdjustmentResult;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

export function YearEndAdjustmentResultDisplay({ result }: YearEndAdjustmentResultProps) {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{result.fiscalYear}年 年末調整結果</h3>
          <p className="text-muted-foreground">
            {result.employeeName} ({result.employeeId}) - {result.department}
          </p>
        </div>
        <Badge variant={result.isRefund ? 'default' : 'destructive'} className="text-lg px-4 py-2">
          {result.isRefund ? '還付' : '徴収'}
        </Badge>
      </div>

      <Separator />

      {/* 還付/徴収額カード */}
      <Card className={result.isRefund ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.isRefund ? (
              <>
                <TrendingUp className="h-5 w-5 text-green-600" />
                還付金額
              </>
            ) : (
              <>
                <TrendingDown className="h-5 w-5 text-red-600" />
                追加徴収税額
              </>
            )}
          </CardTitle>
          <CardDescription>
            {result.isRefund
              ? '源泉徴収税額が年税額を上回っているため、還付されます'
              : '源泉徴収税額が年税額を下回っているため、追加で徴収されます'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {formatCurrency(Math.abs(result.yearEndAdjustmentAmount))}
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">年間源泉徴収税額</span>
              <span className="font-medium">{formatCurrency(result.withheldTaxTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">年調年税額</span>
              <span className="font-medium">{formatCurrency(result.annualIncomeTax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>{result.isRefund ? '還付額' : '徴収額'}</span>
              <span className={result.isRefund ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(Math.abs(result.yearEndAdjustmentAmount))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 収入金額 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            収入金額
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">年間総収入</span>
            <span className="font-medium">{formatCurrency(result.totalAnnualIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">給与所得控除</span>
            <span className="font-medium text-red-600">-{formatCurrency(result.employmentIncomeDeduction)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>給与所得金額</span>
            <span>{formatCurrency(result.employmentIncome)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 所得控除 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            所得控除
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">基礎控除</div>
                <div className="font-medium">{formatCurrency(result.basicDeduction)}</div>
              </div>

              {result.spouseDeduction > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">配偶者控除</div>
                  <div className="font-medium">{formatCurrency(result.spouseDeduction)}</div>
                </div>
              )}

              {result.dependentDeduction > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">扶養控除</div>
                  <div className="font-medium">{formatCurrency(result.dependentDeduction)}</div>
                </div>
              )}

              {result.disabilityDeduction > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">障害者控除</div>
                  <div className="font-medium">{formatCurrency(result.disabilityDeduction)}</div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">社会保険料控除</div>
                <div className="font-medium">{formatCurrency(result.socialInsuranceDeduction)}</div>
              </div>

              {result.lifeInsuranceDeduction > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">生命保険料控除</div>
                  <div className="font-medium">{formatCurrency(result.lifeInsuranceDeduction)}</div>
                </div>
              )}

              {result.earthquakeInsuranceDeduction > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">地震保険料控除</div>
                  <div className="font-medium">{formatCurrency(result.earthquakeInsuranceDeduction)}</div>
                </div>
              )}

              {result.smallBusinessMutualAidDeduction > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">小規模企業共済等掛金控除</div>
                  <div className="font-medium">{formatCurrency(result.smallBusinessMutualAidDeduction)}</div>
                </div>
              )}

              {result.otherDeductions > 0 && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">その他控除</div>
                  <div className="font-medium">{formatCurrency(result.otherDeductions)}</div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>所得控除合計</span>
              <span>{formatCurrency(result.totalDeductions)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 課税所得・税額 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            課税所得・税額
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">給与所得金額</span>
            <span className="font-medium">{formatCurrency(result.employmentIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">所得控除合計</span>
            <span className="font-medium text-red-600">-{formatCurrency(result.totalDeductions)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>課税所得金額</span>
            <span>{formatCurrency(result.taxableIncome)}</span>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">所得税額（復興特別含む）</span>
              <span className="font-medium">{formatCurrency(result.annualIncomeTax)}</span>
            </div>

            {result.mortgageDeduction > 0 && (
              <>
                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">住宅借入金等特別控除</span>
                  <span className="font-medium text-red-600">-{formatCurrency(result.mortgageDeduction)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>年調年税額</span>
                  <span>{formatCurrency(result.annualIncomeTax - result.mortgageDeduction)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 計算情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">計算情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>計算日時</span>
            <span>{new Date(result.calculatedAt).toLocaleString('ja-JP')}</span>
          </div>
          <div className="flex justify-between">
            <span>ステータス</span>
            <Badge variant={result.status === 'approved' ? 'default' : 'secondary'}>
              {result.status === 'draft' && '下書き'}
              {result.status === 'submitted' && '申告済み'}
              {result.status === 'approved' && '承認済み'}
              {result.status === 'finalized' && '確定'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
