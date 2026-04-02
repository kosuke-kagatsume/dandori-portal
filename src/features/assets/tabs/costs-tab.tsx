'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { type VehicleFromAPI } from '@/hooks/use-vehicles-api';
import { formatCurrency } from '@/lib/assets/formatters';
import { calculateVehicleCosts } from '@/lib/assets/cost-calculator';

type MaintenanceRecord = {
  vehicleId: string;
  date: string;
  cost: number;
};

interface Props {
  vehicles: VehicleFromAPI[];
  maintenanceRecords: MaintenanceRecord[];
}

export function CostsTab({ vehicles, maintenanceRecords }: Props) {
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [startMonth, setStartMonth] = useState(
    `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`,
  );
  const [endMonth, setEndMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
  );

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const costSummary = useMemo(
    () => calculateVehicleCosts(vehicles, maintenanceRecords, startMonth, endMonth),
    [vehicles, maintenanceRecords, startMonth, endMonth],
  );

  const totalLeaseCost = costSummary.reduce((sum, item) => sum + item.leaseCost, 0);
  const totalMaintenanceCost = costSummary.reduce((sum, item) => sum + item.maintenanceCost, 0);
  const totalCost = totalLeaseCost + totalMaintenanceCost;

  return (
    <div className="space-y-4">
      {/* 期間選択 */}
      <Card>
        <CardHeader>
          <CardTitle>集計期間</CardTitle>
          <CardDescription>費用集計の対象期間を選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">開始月</label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">終了月</label>
              <input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 費用サマリー */}
      <Card>
        <CardHeader>
          <CardTitle>車両別費用集計</CardTitle>
          <CardDescription>{startMonth} 〜 {endMonth} の費用内訳</CardDescription>
        </CardHeader>
        <CardContent>
          {costSummary.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              指定期間の費用データがありません
            </div>
          ) : (
            <>
              {/* 合計表示 */}
              <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">期間合計</div>
                  <div className="text-3xl font-bold text-primary">{formatCurrency(totalCost)}</div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground flex gap-4">
                  <span>リース費用: {formatCurrency(totalLeaseCost)}</span>
                  <span>メンテナンス費用: {formatCurrency(totalMaintenanceCost)}</span>
                </div>
              </div>

              {/* 車両別費用テーブル */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>車両番号</TableHead>
                    <TableHead>車種</TableHead>
                    <TableHead>所有形態</TableHead>
                    <TableHead className="text-right">リース費用</TableHead>
                    <TableHead className="text-right">メンテナンス費用</TableHead>
                    <TableHead className="text-right">合計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costSummary.map((item) => {
                    const vehicle = vehicleMap.get(item.vehicleId);
                    const total = item.leaseCost + item.maintenanceCost;
                    return (
                      <TableRow key={item.vehicleId}>
                        <TableCell className="font-medium">{vehicle?.vehicleNumber || '-'}</TableCell>
                        <TableCell>{vehicle ? `${vehicle.make} ${vehicle.model}` : '-'}</TableCell>
                        <TableCell>
                          {vehicle && (
                            <Badge variant="outline">
                              {vehicle.ownershipType === 'owned' ? '自己所有' : vehicle.ownershipType === 'leased' ? 'リース' : 'レンタル'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">{formatCurrency(item.leaseCost)}</TableCell>
                        <TableCell className="text-right text-orange-600">{formatCurrency(item.maintenanceCost)}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
