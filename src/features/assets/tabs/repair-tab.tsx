'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Wrench } from 'lucide-react';
import { formatDate, formatCurrency, getCategoryLabel, getRepairTypeLabel } from '@/lib/assets/formatters';

type RepairRecord = {
  id: string;
  date: string;
  repairType: string;
  symptom: string | null;
  vendorName: string | null;
  cost: number;
  status: string;
  pcAsset?: { assetNumber: string; manufacturer: string; model: string } | null;
  generalAsset?: { assetNumber: string; name: string; category: string } | null;
};

interface Props {
  repairRecords: RepairRecord[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function RepairTab({ repairRecords, onDelete, onAdd }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              修理記録
            </CardTitle>
            <CardDescription>PC・その他資産の修理履歴（{repairRecords.length}件）</CardDescription>
          </div>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            修理を登録
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {repairRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p>修理記録がありません</p>
            <p className="text-sm mt-2">「修理登録」ボタンから修理記録を追加してください</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>対象資産</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>症状</TableHead>
                <TableHead>業者</TableHead>
                <TableHead className="text-right">費用</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(record.date)}</TableCell>
                  <TableCell>
                    {record.pcAsset ? (
                      <>
                        <Badge variant="outline" className="mr-1">PC</Badge>
                        <span className="font-medium">{record.pcAsset.assetNumber}</span>
                        <div className="text-xs text-muted-foreground">
                          {record.pcAsset.manufacturer} {record.pcAsset.model}
                        </div>
                      </>
                    ) : record.generalAsset ? (
                      <>
                        <Badge variant="outline" className="mr-1">{getCategoryLabel(record.generalAsset.category)}</Badge>
                        <span className="font-medium">{record.generalAsset.assetNumber}</span>
                        <div className="text-xs text-muted-foreground">{record.generalAsset.name}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getRepairTypeLabel(record.repairType)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{record.symptom || '-'}</TableCell>
                  <TableCell>{record.vendorName || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(record.cost)}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'completed' ? 'default' : record.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {record.status === 'completed' ? '完了' : record.status === 'in_progress' ? '修理中' : record.status === 'pending' ? '修理待ち' : 'キャンセル'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onDelete(record.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
