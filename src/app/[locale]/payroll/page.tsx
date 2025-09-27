'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calculator, Users, TrendingUp, DollarSign, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PayrollPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01');

  // 仮データ
  const payrollSummary = {
    totalEmployees: 50,
    totalPayroll: 18500000,
    averageSalary: 370000,
    totalDeductions: 3200000,
  };

  const employees = [
    { id: 1, name: '田中太郎', department: '営業部', position: '部長', baseSalary: 550000, allowances: 80000, deductions: 95000, netPay: 535000 },
    { id: 2, name: '佐藤花子', department: '経理部', position: '主任', baseSalary: 380000, allowances: 45000, deductions: 68000, netPay: 357000 },
    { id: 3, name: '鈴木一郎', department: '技術部', position: '課長', baseSalary: 480000, allowances: 60000, deductions: 85000, netPay: 455000 },
    { id: 4, name: '高橋美咲', department: '人事部', position: '一般', baseSalary: 280000, allowances: 30000, deductions: 48000, netPay: 262000 },
    { id: 5, name: '渡辺健太', department: '営業部', position: '一般', baseSalary: 300000, allowances: 35000, deductions: 52000, netPay: 283000 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">給与管理</h1>
          <p className="text-muted-foreground">
            給与計算と支払い管理
          </p>
        </div>
        <Button>
          <Calculator className="mr-2 h-4 w-4" />
          給与計算実行
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">従業員数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollSummary.totalEmployees}名</div>
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
            <div className="text-2xl font-bold">
              {formatCurrency(payrollSummary.totalPayroll)}
            </div>
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
            <div className="text-2xl font-bold">
              {formatCurrency(payrollSummary.averageSalary)}
            </div>
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
            <div className="text-2xl font-bold">
              {formatCurrency(payrollSummary.totalDeductions)}
            </div>
            <p className="text-xs text-muted-foreground">
              社会保険・税金
            </p>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="payslips" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payslips">給与明細一覧</TabsTrigger>
          <TabsTrigger value="calculation">給与計算</TabsTrigger>
          <TabsTrigger value="bonus">賞与管理</TabsTrigger>
          <TabsTrigger value="settings">給与設定</TabsTrigger>
        </TabsList>

        {/* 給与明細一覧 */}
        <TabsContent value="payslips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与明細一覧</CardTitle>
              <CardDescription>
                {selectedPeriod}月分の給与明細
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(emp.baseSalary)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(emp.allowances)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(emp.deductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(emp.netPay)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">確定</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 給与計算 */}
        <TabsContent value="calculation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与計算</CardTitle>
              <CardDescription>
                月次給与計算を実行します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  給与計算機能は現在準備中です
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 賞与管理 */}
        <TabsContent value="bonus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>賞与管理</CardTitle>
              <CardDescription>
                賞与の計算と支払い管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  賞与管理機能は現在準備中です
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 給与設定 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与設定</CardTitle>
              <CardDescription>
                給与計算の基本設定
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  給与設定機能は現在準備中です
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}