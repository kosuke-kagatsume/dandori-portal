'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Car, Laptop, Monitor } from 'lucide-react';
import { type WarningItem } from '@/lib/assets/warnings';
import {
  formatDate, getWarningLevelBadge, getDeadlineTypeLabel,
  getAssetCategoryBadge,
} from '@/lib/assets/formatters';

interface Props {
  allWarnings: WarningItem[];
  onViewDetail: (warning: WarningItem) => void;
}

export function WarningsTab({ allWarnings, onViewDetail }: Props) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'vehicle' | 'pc' | 'general'>('all');

  const filteredWarnings = useMemo(() => {
    if (categoryFilter === 'all') return allWarnings;
    return allWarnings.filter((w) => w.assetCategory === categoryFilter);
  }, [allWarnings, categoryFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>期限警告</CardTitle>
            <CardDescription>
              車検・点検・保証・リース終了など、期限が近い項目（90日以内）
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
            >
              すべて ({allWarnings.length})
            </Button>
            <Button
              variant={categoryFilter === 'vehicle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('vehicle')}
            >
              <Car className="mr-1 h-4 w-4" />
              車両 ({allWarnings.filter(w => w.assetCategory === 'vehicle').length})
            </Button>
            <Button
              variant={categoryFilter === 'pc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('pc')}
            >
              <Laptop className="mr-1 h-4 w-4" />
              PC ({allWarnings.filter(w => w.assetCategory === 'pc').length})
            </Button>
            <Button
              variant={categoryFilter === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('general')}
            >
              <Monitor className="mr-1 h-4 w-4" />
              その他 ({allWarnings.filter(w => w.assetCategory === 'general').length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredWarnings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            期限が近い項目はありません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>レベル</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>資産</TableHead>
                <TableHead>期限日</TableHead>
                <TableHead>残日数</TableHead>
                <TableHead className="text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWarnings.map((warning) => (
                <TableRow key={warning.id}>
                  <TableCell>{getWarningLevelBadge(warning.level)}</TableCell>
                  <TableCell>{getAssetCategoryBadge(warning.assetCategory)}</TableCell>
                  <TableCell>{getDeadlineTypeLabel(warning.deadlineType)}</TableCell>
                  <TableCell className="font-medium">{warning.assetName}</TableCell>
                  <TableCell>{formatDate(warning.deadlineDate)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        warning.daysRemaining <= 30
                          ? 'text-destructive font-semibold'
                          : warning.daysRemaining <= 60
                          ? 'text-orange-600'
                          : 'text-muted-foreground'
                      }
                    >
                      あと{warning.daysRemaining}日
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onViewDetail(warning)}>
                      詳細
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
