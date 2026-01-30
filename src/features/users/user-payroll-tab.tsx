'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Banknote,
  Building,
  CreditCard,
  Edit,
  ShieldAlert,
  Train,
  Users,
  Landmark,
  Info,
} from 'lucide-react';
import type { User } from '@/types';

interface UserPayrollTabProps {
  user: User;
  isReadOnly: boolean;
  isHR: boolean;
  onEdit?: () => void;
}

const workTypeLabels: Record<string, string> = {
  monthly: '月給',
  daily: '日給',
  hourly: '時給',
};

const residentTaxMethodLabels: Record<string, string> = {
  special: '特別徴収',
  normal: '普通徴収',
};

const incomeTaxLabels: Record<string, string> = {
  kouA: '甲欄',
  kouB: '甲欄（障害者等）',
  otsu: '乙欄',
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
  savings: '貯蓄',
};

const usageLabels: Record<string, string> = {
  salary: '給与',
  bonus: '賞与',
  both: '給与・賞与',
};

export function UserPayrollTab({ user, isReadOnly: _isReadOnly, isHR, onEdit }: UserPayrollTabProps) {
  const payroll = user.payrollInfo;

  const editButton = isHR && (
    <Button variant="outline" size="sm" onClick={onEdit}>
      <Edit className="mr-2 h-4 w-4" />
      編集
    </Button>
  );

  // 扶養人数の自動計算（UI枠）
  const calculatedDependentCount = payroll?.dependents?.length ?? payroll?.dependentCount ?? 0;

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">一般情報</TabsTrigger>
        <TabsTrigger value="salary-detail">給与情報</TabsTrigger>
        <TabsTrigger value="payment">支払情報</TabsTrigger>
      </TabsList>

      {/* サブタブ1: 一般情報 */}
      <TabsContent value="general" className="space-y-4">
        {/* 基本 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">基本・勤務</CardTitle>
                  <CardDescription>給与形態と基本給</CardDescription>
                </div>
              </div>
              {editButton}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">給与形態</p>
                <p className="text-sm mt-1">
                  {payroll?.workType ? workTypeLabels[payroll.workType] : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">基本給</p>
                <p className="text-sm mt-1">
                  {payroll?.basicSalary != null
                    ? `¥${payroll.basicSalary.toLocaleString()}`
                    : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">雇用形態</p>
                <p className="text-sm mt-1">{user.employmentType || '未設定'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 住民税・所得税 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">住民税・所得税</CardTitle>
                <CardDescription>税金関連設定</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">徴収先市区町村</p>
                <p className="text-sm mt-1">{payroll?.residentTaxCity || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">住民税徴収方法</p>
                <p className="text-sm mt-1">
                  {payroll?.residentTaxMethod
                    ? residentTaxMethodLabels[payroll.residentTaxMethod]
                    : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">所得税区分</p>
                <p className="text-sm mt-1">
                  {payroll?.incomeTaxType
                    ? incomeTaxLabels[payroll.incomeTaxType]
                    : '未設定'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 扶養情報 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">扶養情報</CardTitle>
                <CardDescription>扶養親族と人数</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">扶養人数</p>
                <p className="text-2xl font-bold mt-1">{calculatedDependentCount}人</p>
              </div>
              {payroll?.dependents && payroll.dependents.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <Info className="inline h-3 w-3 mr-1" />
                  扶養親族データから自動計算（ロジック実装予定）
                </div>
              )}
            </div>

            {payroll?.dependents && payroll.dependents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>氏名</TableHead>
                    <TableHead>続柄</TableHead>
                    <TableHead>生年月日</TableHead>
                    <TableHead>障害者</TableHead>
                    <TableHead>老親等</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.dependents.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell className="font-medium">{dep.name}</TableCell>
                      <TableCell>{dep.relationship}</TableCell>
                      <TableCell>
                        {dep.birthDate
                          ? new Date(dep.birthDate).toLocaleDateString('ja-JP')
                          : '-'}
                      </TableCell>
                      <TableCell>{dep.isDisabled ? '該当' : '-'}</TableCell>
                      <TableCell>{dep.isElderlyParent ? '該当' : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">扶養親族の登録はありません</p>
            )}
          </CardContent>
        </Card>

        {/* マイナンバー */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">マイナンバー</CardTitle>
                <CardDescription>個人番号（社会保険・労務管理用）</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                マイナンバーは暗号化して保存され、アクセスログが記録されます。
                閲覧には権限が必要です。
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">マイナンバー</p>
              <p className="text-sm mt-1">
                {payroll?.myNumber
                  ? '****-****-****'
                  : '未登録'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                暗号化保存・アクセスログ機能は今後のアップデートで実装予定です。
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* サブタブ2: 給与情報 */}
      <TabsContent value="salary-detail" className="space-y-4">
        {/* 支給項目 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">支給項目</CardTitle>
                  <CardDescription>各種手当</CardDescription>
                </div>
              </div>
              {editButton}
            </div>
          </CardHeader>
          <CardContent>
            {(!payroll?.allowances || payroll.allowances.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">支給項目の登録はありません</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>手当名</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>課税</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payroll.allowances.map((allowance) => (
                    <TableRow key={allowance.id}>
                      <TableCell className="font-medium">{allowance.name}</TableCell>
                      <TableCell className="text-right">¥{allowance.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={allowance.isTaxable ? 'default' : 'secondary'}>
                          {allowance.isTaxable ? '課税' : '非課税'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>合計</TableCell>
                    <TableCell className="text-right">
                      ¥{payroll.allowances.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 通勤 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Train className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">通勤情報</CardTitle>
                <CardDescription>通勤手当・経路</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">通勤方法</p>
                <p className="text-sm mt-1">
                  {payroll?.commuteMethod
                    ? commuteMethodLabels[payroll.commuteMethod]
                    : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">通勤手当</p>
                <p className="text-sm mt-1">
                  {payroll?.commuteAllowance != null
                    ? `¥${payroll.commuteAllowance.toLocaleString()}/月`
                    : '未設定'}
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">通勤経路</p>
                <p className="text-sm mt-1">{payroll?.commuteRoute || '未設定'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 保険 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">社会保険</CardTitle>
                <CardDescription>健康保険・厚生年金・雇用保険</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">健康保険等級</p>
                <p className="text-sm mt-1">{payroll?.healthInsuranceGrade || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">厚生年金等級</p>
                <p className="text-sm mt-1">{payroll?.pensionGrade || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">雇用保険番号</p>
                <p className="text-sm mt-1">{payroll?.employmentInsuranceNumber || '未設定'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 住民税月額 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">住民税支払</CardTitle>
                <CardDescription>月額住民税</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm font-medium text-muted-foreground">住民税月額</p>
              <p className="text-sm mt-1">
                {payroll?.residentTaxMonthlyAmount != null
                  ? `¥${payroll.residentTaxMonthlyAmount.toLocaleString()}/月`
                  : '未設定'}
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* サブタブ3: 支払情報 */}
      <TabsContent value="payment" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <div>
                  <CardTitle className="text-base">振込口座</CardTitle>
                  <CardDescription>給与・賞与の振込先口座</CardDescription>
                </div>
              </div>
              {editButton}
            </div>
          </CardHeader>
          <CardContent>
            {(!payroll?.bankAccounts || payroll.bankAccounts.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">振込口座の登録はありません</p>
            ) : (
              <div className="space-y-4">
                {payroll.bankAccounts.map((account) => (
                  <div key={account.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge>{usageLabels[account.usage]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">金融機関</p>
                        <p>{account.bankName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">支店名</p>
                        <p>{account.branchName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">口座種別</p>
                        <p>{accountTypeLabels[account.accountType]}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">口座番号</p>
                        <p>{account.accountNumber}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">口座名義</p>
                        <p>{account.accountHolder}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
