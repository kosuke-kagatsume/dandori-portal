'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Brain,
  Activity,
} from 'lucide-react';

interface HealthStatsHeaderProps {
  totalEmployees: number;
  completed: number;
  completionRate: number;
  requiresReexam: number;
  requiresTreatment: number;
  highStress: number;
  stressCheckCompletionRate: number;
}

export function HealthStatsHeader({
  totalEmployees,
  completed,
  completionRate,
  requiresReexam,
  requiresTreatment,
  highStress,
  stressCheckCompletionRate,
}: HealthStatsHeaderProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">対象社員</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}名</div>
          <p className="text-xs text-muted-foreground">年度対象者</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">受診率</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">{completed}名 受診完了</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">要再検査</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{requiresReexam}名</div>
          <p className="text-xs text-muted-foreground">フォローアップ必要</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">要治療</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{requiresTreatment}名</div>
          <p className="text-xs text-muted-foreground">医療機関受診推奨</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">高ストレス者</CardTitle>
          <Brain className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{highStress}名</div>
          <p className="text-xs text-muted-foreground">面談対象者</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ストレスチェック</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stressCheckCompletionRate}%</div>
          <p className="text-xs text-muted-foreground">回答率</p>
        </CardContent>
      </Card>
    </div>
  );
}
