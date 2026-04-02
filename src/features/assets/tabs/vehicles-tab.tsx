'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Search, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { type VehicleFromAPI } from '@/hooks/use-vehicles-api';
import {
  formatDate, calculateDaysRemaining,
  getStatusBadge, getOwnershipBadge,
} from '@/lib/assets/formatters';

interface Props {
  vehicles: VehicleFromAPI[];
  mounted: boolean;
  onDelete: (id: string, vehicleNumber: string) => void;
  onAdd: () => void;
}

export function VehiclesTab({ vehicles, mounted, onDelete, onAdd }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance' | 'retired'>('all');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || vehicle.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [vehicles, searchQuery, filterStatus]);

  const handleExportCSV = () => {
    const headers = ['車両番号', 'ナンバープレート', 'メーカー', '型番', '年式', '所有形態', 'ステータス', '車検日', '点検日', '月額リース費用'];
    const rows = filteredVehicles.map(v => [
      v.vehicleNumber, v.licensePlate, v.make, v.model,
      v.year?.toString() || '', v.ownershipType, v.status,
      v.inspectionDate || '', v.maintenanceDate || '',
      v.leaseMonthlyCost?.toString() || '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vehicles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`CSV出力完了: ${filteredVehicles.length}件`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>車両一覧</CardTitle>
              <CardDescription>登録されている全車両の管理（{vehicles.length}台）</CardDescription>
            </div>
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              車両を登録
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="車両番号、ナンバーで検索..."
                className="pl-8 pr-4 py-2 border rounded-md w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md w-full sm:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="all">すべてのステータス</option>
              <option value="active">稼働中</option>
              <option value="maintenance">整備中</option>
              <option value="retired">廃車</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              CSV出力
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>車両番号</TableHead>
              <TableHead>ナンバープレート</TableHead>
              <TableHead>車種</TableHead>
              <TableHead>割当先</TableHead>
              <TableHead>所有形態</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>次回車検</TableHead>
              <TableHead>次回点検</TableHead>
              <TableHead className="text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  車両が見つかりません
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>
                    {vehicle.make} {vehicle.model}
                    <div className="text-xs text-muted-foreground">{vehicle.year}年式</div>
                  </TableCell>
                  <TableCell>
                    {vehicle.assignedUserName ? (
                      <div>
                        {vehicle.assignedUserName}
                        {vehicle.assignedDate && (
                          <div className="text-xs text-muted-foreground">{formatDate(vehicle.assignedDate)}～</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">未割当</span>
                    )}
                  </TableCell>
                  <TableCell>{getOwnershipBadge(vehicle.ownershipType)}</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>
                    {vehicle.inspectionDate ? (
                      <>
                        <div className="text-sm">{formatDate(vehicle.inspectionDate)}</div>
                        {mounted && (
                          <div className="text-xs text-muted-foreground">
                            {calculateDaysRemaining(vehicle.inspectionDate)}日後
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vehicle.maintenanceDate ? (
                      <>
                        <div className="text-sm">{formatDate(vehicle.maintenanceDate)}</div>
                        {mounted && (
                          <div className="text-xs text-muted-foreground">
                            {calculateDaysRemaining(vehicle.maintenanceDate)}日後
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => onDelete(vehicle.id, vehicle.vehicleNumber)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
