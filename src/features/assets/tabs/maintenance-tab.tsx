'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Wrench } from 'lucide-react';
import { type VehicleFromAPI } from '@/hooks/use-vehicles-api';
import { formatDate, formatCurrency, getMaintenanceTypeLabel } from '@/lib/assets/formatters';

type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  cost: number;
  mileage: number | null;
  description: string | null;
  notes: string | null;
  vendorId: string | null;
};

type Vendor = {
  id: string;
  name: string;
};

interface Props {
  maintenanceRecords: MaintenanceRecord[];
  vehicles: VehicleFromAPI[];
  vendors: Vendor[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function MaintenanceTab({ maintenanceRecords, vehicles, vendors, onDelete, onAdd }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  const vendorMap = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);

  const filteredRecords = useMemo(() => {
    return maintenanceRecords.filter((record) => {
      const matchesType = typeFilter === 'all' || record.type === typeFilter;
      const matchesVendor = vendorFilter === 'all' || record.vendorId === vendorFilter;
      return matchesType && matchesVendor;
    });
  }, [maintenanceRecords, typeFilter, vendorFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>メンテナンス履歴</CardTitle>
            <CardDescription>全車両のメンテナンス記録（{maintenanceRecords.length}件）</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            メンテナンスを登録
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">すべての種別</option>
            <option value="oil_change">オイル交換</option>
            <option value="tire_change">タイヤ交換</option>
            <option value="inspection">点検</option>
            <option value="shaken">車検</option>
            <option value="repair">修理</option>
            <option value="other">その他</option>
          </select>
          <select
            className="px-3 py-2 border rounded-md text-sm"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          >
            <option value="all">すべての業者</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p>メンテナンス記録がありません</p>
            <p className="text-sm mt-2">「新規登録」ボタンからメンテナンス記録を追加してください</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>車両</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>走行距離</TableHead>
                <TableHead>業者</TableHead>
                <TableHead className="text-right">費用</TableHead>
                <TableHead>内容</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const vehicle = vehicleMap.get(record.vehicleId);
                const vendor = record.vendorId ? vendorMap.get(record.vendorId) : null;
                return (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(record.date)}</TableCell>
                    <TableCell>
                      {vehicle ? (
                        <>
                          <div className="font-medium">{vehicle.vehicleNumber}</div>
                          <div className="text-xs text-muted-foreground">{vehicle.make} {vehicle.model}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMaintenanceTypeLabel(record.type)}</Badge>
                    </TableCell>
                    <TableCell>{record.mileage ? `${record.mileage.toLocaleString()} km` : '-'}</TableCell>
                    <TableCell>{vendor?.name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(record.cost)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.description || '-'}
                      {record.notes && (
                        <div className="text-xs text-muted-foreground">{record.notes}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => onDelete(record.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
