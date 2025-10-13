'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, User, MapPin, FileText, Calendar, Stamp } from 'lucide-react';
import type { WithholdingSlipData } from '@/lib/payroll/year-end-adjustment-types';

interface WithholdingSlipProps {
  data: WithholdingSlipData;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function WithholdingSlip({ data }: WithholdingSlipProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-6 w-6" />
          <h2 className="text-2xl font-bold">給与所得の源泉徴収票</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          （{data.fiscalYear}年分）
        </p>
        <Badge variant="outline" className="text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          発行日：{formatDate(data.issuedAt)}
        </Badge>
      </div>

      <Separator />

      {/* 支払者（会社）情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            支払者
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">氏名又は名称</div>
              <div className="font-medium">{data.payerName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">法人番号</div>
              <div className="font-mono text-sm">{data.payerTaxId}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              住所又は所在地
            </div>
            <div className="text-sm">{data.payerAddress}</div>
          </div>
        </CardContent>
      </Card>

      {/* 受給者（従業員）情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            受給者
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">氏名</div>
              <div className="font-medium">{data.employeeName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">所属部署</div>
              <div className="text-sm">{data.department}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">役職</div>
              <div className="text-sm">{data.position}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              住所
            </div>
            <div className="text-sm">{data.address}</div>
          </div>
        </CardContent>
      </Card>

      {/* 収入金額・所得金額 */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">収入金額・所得金額</CardTitle>
          <CardDescription>年間の給与収入と給与所得</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">支払金額</div>
                <div className="text-2xl font-bold">{formatCurrency(data.totalIncome)}</div>
                <p className="text-xs text-muted-foreground">年間総支給額</p>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">給与所得控除後の金額</div>
                <div className="text-2xl font-bold">{formatCurrency(data.employmentIncome)}</div>
                <p className="text-xs text-muted-foreground">給与所得金額</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 控除額・源泉徴収税額 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">所得控除の額の合計額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.totalDeductions)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              基礎控除、配偶者控除、扶養控除、社会保険料控除等の合計
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stamp className="h-4 w-4 text-green-600" />
              源泉徴収税額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.withheldTax)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              年間源泉徴収税額（復興特別所得税を含む）
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 控除対象配偶者・扶養親族 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">控除対象配偶者・扶養親族</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">配偶者控除額</div>
              <div className="font-medium">
                {data.spouseDeduction > 0
                  ? formatCurrency(data.spouseDeduction)
                  : '該当なし'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">扶養親族の数</div>
              <div className="font-medium">
                {data.dependents > 0 ? `${data.dependents}人` : '0人'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 社会保険料等・生命保険料・地震保険料 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">社会保険料等・保険料控除</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">社会保険料等の金額</div>
              <div className="font-medium">{formatCurrency(data.socialInsuranceTotal)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">生命保険料の控除額</div>
              <div className="font-medium">
                {data.lifeInsuranceDeduction > 0
                  ? formatCurrency(data.lifeInsuranceDeduction)
                  : '－'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">地震保険料の控除額</div>
              <div className="font-medium">
                {data.earthquakeInsuranceDeduction > 0
                  ? formatCurrency(data.earthquakeInsuranceDeduction)
                  : '－'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 住宅借入金等特別控除 */}
      {data.mortgageDeduction > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">住宅借入金等特別控除の額</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(data.mortgageDeduction)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              住宅ローン控除適用額
            </p>
          </CardContent>
        </Card>
      )}

      {/* フッター注記 */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              この源泉徴収票は、所得税法第226条の規定に基づき交付するものです。
            </p>
            <p>
              確定申告を行う場合は、この源泉徴収票を申告書に添付してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
