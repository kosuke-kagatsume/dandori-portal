'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, AlertTriangle, Wrench, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/assets/formatters';

export interface AssetStats {
  totalAssets: number;
  totalVehicles: number;
  totalPCs: number;
  totalGeneralAssets: number;
  totalRepairsAndMaintenance: number;
  totalRepairs: number;
  totalMaintenance: number;
  thisMonthTotalCost: number;
  monthlyLeaseCost: number;
}

export interface WarningStats {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

interface Props {
  stats: AssetStats;
  warningStats: WarningStats;
}

export function AssetStatsCards({ stats, warningStats }: Props) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総資産数</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAssets}件</div>
          <p className="text-xs text-muted-foreground">
            車両{stats.totalVehicles} / PC{stats.totalPCs} / 他{stats.totalGeneralAssets}
          </p>
        </CardContent>
      </Card>

      <Card className={warningStats.criticalCount > 0 ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">期限警告</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${warningStats.criticalCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{warningStats.criticalCount}件</div>
          <p className="text-xs text-muted-foreground">
            注意: {warningStats.warningCount}件 / 情報: {warningStats.infoCount}件
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">修理・メンテナンス</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRepairsAndMaintenance}件</div>
          <p className="text-xs text-muted-foreground">
            修理{stats.totalRepairs} / メンテ{stats.totalMaintenance}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月費用</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.thisMonthTotalCost)}</div>
          <p className="text-xs text-muted-foreground">
            リース{formatCurrency(stats.monthlyLeaseCost).replace('￥', '')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
