'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, Users, TrendingUp, DollarSign, FileText, Calendar, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { useToast } from '@/hooks/use-toast';
import { PayrollDetailModal } from '@/components/features/payroll/payroll-detail-modal';
import { MountGate } from '@/components/common/MountGate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

// データ手動リセットボタン（開発＆運用保守用）
function ResetPayrollDataButton() {
  const resetToSeed = usePayrollStore(s => s.resetToSeed);
  return (
    <button
      type="button"
      className="text-xs underline text-muted-foreground hover:text-foreground"
      onClick={() => {
        resetToSeed();
        console.log('[payroll] store reset to seed');
      }}
    >
      給与データを初期化
    </button>
  );
}

export default function PayrollPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01');
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 賞与関連のstate
  const [selectedBonusPeriod, setSelectedBonusPeriod] = useState('2024-12');
  const [selectedBonusType, setSelectedBonusType] = useState<'summer' | 'winter' | 'special'>('winter');
  const [selectedBonusCalculation, setSelectedBonusCalculation] = useState<any>(null);

  const { toast } = useToast();

  const {
    salaryMasters,
    calculations,
    bonusCalculations,
    isCalculating,
    runPayroll,
    getCalculationsByPeriod,
    getBonusCalculationsByPeriod,
    runBonusCalculation,
    resetToSeed,
  } = usePayrollStore();

  // 起動時の再シード保険
  useEffect(() => {
    const s = usePayrollStore.getState();
    console.log('[PayrollPage] Initial check - employees:', s.salaryMasters.length);
    if (s.salaryMasters.length < 15) {
      console.log('[PayrollPage] Employee count < 15, resetting to seed');
      s.resetToSeed();
    }
  }, []);

  // 計算結果を取得
  const calculationResults = getCalculationsByPeriod(selectedPeriod);
  const bonusResults = getBonusCalculationsByPeriod(selectedBonusPeriod, selectedBonusType);

  // 詳細表示
  const handleViewDetails = (calculation: any) => {
    setSelectedCalculation(calculation);
    setIsDetailModalOpen(true);
  };

  // 給与計算実行
  const handleCalculatePayroll = async () => {
    console.log('[PayrollPage] 給与計算実行ボタンがクリックされました');
    try {
      await runPayroll(selectedPeriod);
      const results = getCalculationsByPeriod(selectedPeriod);

      toast({
        title: '計算完了',
        description: `${results.length}名の給与計算が完了しました。`,
      });
    } catch (error) {
      console.error('[PayrollPage] 給与計算エラー:', error);
      toast({
        title: 'エラー',
        description: '給与計算中にエラーが発生しました。',
        variant: 'destructive',
      });
    }
  };

  // 賞与計算実行
  const handleCalculateBonus = async () => {
    console.log('[PayrollPage] 賞与計算実行ボタンがクリックされました', { selectedBonusPeriod, selectedBonusType });
    try {
      await runBonusCalculation(selectedBonusPeriod, selectedBonusType);
      const results = getBonusCalculationsByPeriod(selectedBonusPeriod, selectedBonusType);

      const bonusTypeText = selectedBonusType === 'summer' ? '夏季' : selectedBonusType === 'winter' ? '冬季' : '特別';
      toast({
        title: '賞与計算完了',
        description: `${results.length}名の${bonusTypeText}賞与計算が完了しました。`,
      });
    } catch (error) {
      console.error('[PayrollPage] 賞与計算エラー:', error);
      toast({
        title: 'エラー',
        description: '賞与計算中にエラーが発生しました。',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">給与管理</h1>
          <p className="text-muted-foreground">
            給与計算と支払い管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleCalculatePayroll}
            disabled={isCalculating}
          >
            <Calculator className="mr-2 h-4 w-4" />
            {isCalculating ? '計算中...' : '給与計算実行'}
          </Button>
          <ResetPayrollDataButton />
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">従業員数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <MountGate fallback={<div className="text-2xl font-bold">--名</div>}>
              <div className="text-2xl font-bold">{salaryMasters.length}名</div>
            </MountGate>
            <p className="text-xs text-muted-foreground">
              +2名 前月比
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総支給額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(1320000)}</div>
            <p className="text-xs text-muted-foreground">
              今月分
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均給与</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(440000)}</div>
            <p className="text-xs text-muted-foreground">
              全社平均
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">控除額合計</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(370739)}</div>
            <p className="text-xs text-muted-foreground">
              社会保険・税金
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">給与明細一覧</TabsTrigger>
          <TabsTrigger value="calculation">給与計算</TabsTrigger>
          <TabsTrigger value="bonus">賞与管理</TabsTrigger>
          <TabsTrigger value="settings">給与設定</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与明細一覧</CardTitle>
              <CardDescription>
                2025-01月分の給与明細
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>社員名</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>役職</TableHead>
                    <TableHead className="text-right">基本給</TableHead>
                    <TableHead className="text-right">諸手当</TableHead>
                    <TableHead className="text-right">控除額</TableHead>
                    <TableHead className="text-right">差引支給額</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <MountGate fallback={
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        給与計算データを読み込み中...
                      </TableCell>
                    </TableRow>
                  }>
                    {calculationResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          給与計算データがありません。「給与計算実行」ボタンをクリックして計算を開始してください。
                        </TableCell>
                      </TableRow>
                    ) : (
                      calculationResults.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell className="font-medium">{calc.employeeName}</TableCell>
                          <TableCell>{calc.department}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calc.basicSalary)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(calc.totalAllowances)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(calc.totalDeductions)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(calc.netSalary)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">確定</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(calc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </MountGate>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与計算</CardTitle>
              <CardDescription>
                月次給与計算の実行と管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">計算対象期間</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                      <option value="2025-01">2025年1月</option>
                      <option value="2024-12">2024年12月</option>
                      <option value="2024-11">2024年11月</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">計算ステータス</label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">計算準備完了</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCalculatePayroll}
                    disabled={isCalculating}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    {isCalculating ? '計算中...' : '給与計算実行'}
                  </Button>
                  <Button type="button" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    計算結果出力
                  </Button>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">計算対象</h4>
                  <div className="text-sm text-muted-foreground">
                    対象従業員: {salaryMasters.length}名<br />
                    計算期間: {selectedPeriod}<br />
                    勤怠データ連携: 有効
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonus" className="space-y-4">
          {/* 賞与概要カード */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">夏季賞与</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(25000000)}</div>
                <p className="text-xs text-muted-foreground">
                  2024年7月支給
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">冬季賞与</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(28000000)}</div>
                <p className="text-xs text-muted-foreground">
                  2024年12月支給
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">次回賞与予定</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2025年6月</div>
                <p className="text-xs text-muted-foreground">
                  夏季賞与支給予定
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 賞与計算・管理セクション */}
          <Card>
            <CardHeader>
              <CardTitle>賞与計算・管理</CardTitle>
              <CardDescription>
                従業員別賞与計算と明細管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 賞与設定 */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">支給期間</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedBonusPeriod}
                      onChange={(e) => setSelectedBonusPeriod(e.target.value)}
                    >
                      <option value="2024-12">2024年12月</option>
                      <option value="2024-07">2024年7月</option>
                      <option value="2025-06">2025年6月</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">賞与種別</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedBonusType}
                      onChange={(e) => setSelectedBonusType(e.target.value as 'summer' | 'winter' | 'special')}
                    >
                      <option value="winter">冬季賞与</option>
                      <option value="summer">夏季賞与</option>
                      <option value="special">特別賞与</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">操作</label>
                    <Button
                      type="button"
                      onClick={handleCalculateBonus}
                      disabled={isCalculating}
                      className="w-full"
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      {isCalculating ? '計算中...' : '賞与計算実行'}
                    </Button>
                  </div>
                </div>

                {/* 従業員別賞与明細テーブル */}
                <div className="mt-6">
                  <MountGate fallback={<div className="font-medium mb-4">賞与明細を読み込み中...</div>}>
                    <h4 className="font-medium mb-4">
                      従業員別賞与明細 ({selectedBonusType === 'summer' ? '夏季' : selectedBonusType === 'winter' ? '冬季' : '特別'}賞与 - {selectedBonusPeriod})
                    </h4>
                  </MountGate>
                  <MountGate fallback={
                    <div className="w-full p-8 text-center text-muted-foreground">
                      賞与テーブルを読み込み中...
                    </div>
                  }>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>社員名</TableHead>
                          <TableHead>部署</TableHead>
                          <TableHead>役職</TableHead>
                          <TableHead className="text-right">基本賞与</TableHead>
                          <TableHead className="text-right">査定賞与</TableHead>
                          <TableHead className="text-right">控除額</TableHead>
                          <TableHead className="text-right">差引支給額</TableHead>
                          <TableHead>査定</TableHead>
                          <TableHead className="text-center">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonusResults.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                              賞与計算データがありません。「賞与計算実行」ボタンをクリックして計算を開始してください。
                            </TableCell>
                          </TableRow>
                        ) : (
                          bonusResults.map((bonus) => (
                            <TableRow key={bonus.id}>
                              <TableCell className="font-medium">{bonus.employeeName}</TableCell>
                              <TableCell>{bonus.department}</TableCell>
                              <TableCell>{bonus.position}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(bonus.basicBonus + bonus.positionBonus)}
                              </TableCell>
                              <TableCell className="text-right text-blue-600">
                                {formatCurrency(bonus.performanceBonus)}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                {formatCurrency(bonus.totalDeductions)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-lg">
                                {formatCurrency(bonus.netBonus)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  bonus.performanceRating === 'S' ? 'default' :
                                  bonus.performanceRating === 'A' ? 'secondary' :
                                  bonus.performanceRating === 'B' ? 'outline' :
                                  'destructive'
                                }>
                                  {bonus.performanceRating}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBonusCalculation(bonus);
                                    setIsDetailModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </MountGate>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与設定</CardTitle>
              <CardDescription>
                給与計算に関する各種設定
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">支給日</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="25">毎月25日</option>
                      <option value="10">毎月10日</option>
                      <option value="15">毎月15日</option>
                      <option value="last">月末</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">計算基準日</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="last">月末締め</option>
                      <option value="20">毎月20日締め</option>
                      <option value="15">毎月15日締め</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 給与・賞与詳細モーダル */}
      <PayrollDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        calculation={selectedCalculation || selectedBonusCalculation}
      />
    </div>
  );
}