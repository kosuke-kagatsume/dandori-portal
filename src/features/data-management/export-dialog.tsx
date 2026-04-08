'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Settings2, CheckCircle } from 'lucide-react';
import { MonthPicker, MonthRangePicker } from '@/components/ui/month-range-picker';
import { useUserStore } from '@/lib/store/user-store';

// ── 型定義 ──────────────────────────────────────────

export type TimeFormat = 'time' | 'hour_minute' | 'decimal' | 'minutes';

export interface ExportOptions {
  periodType: 'single' | 'multi';
  yearMonth: string;
  yearMonthFrom: string;
  yearMonthTo: string;
  unitType: 'employee' | 'closing_day';
  selectedEmployees: string[];
  selectedClosingDay: string;
  sortBy: 'employee_number' | 'year_month';
  includeActualPunch: boolean;
  timeFormat: TimeFormat;
  includeYearMonth: boolean;
}

export type ExportType = 'monthly' | 'attendance-csv' | 'attendance-pdf';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  exportType: ExportType;
  onExport: (options: ExportOptions) => void;
  exporting: boolean;
  estimatedCount?: number;
}

// ── デフォルト値 ──────────────────────────────────────────

function getDefaultYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const defaultOptions: ExportOptions = {
  periodType: 'single',
  yearMonth: getDefaultYearMonth(),
  yearMonthFrom: '',
  yearMonthTo: '',
  unitType: 'employee',
  selectedEmployees: ['all'],
  selectedClosingDay: 'all',
  sortBy: 'employee_number',
  includeActualPunch: true,
  timeFormat: 'time',
  includeYearMonth: true,
};

// ── コンポーネント ──────────────────────────────────────────

export function ExportDialog({
  open, onOpenChange, title, exportType, onExport, exporting, estimatedCount,
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(defaultOptions);
  const { users } = useUserStore();

  // ダイアログが開くたびにリセット
  useEffect(() => {
    if (open) {
      setOptions({ ...defaultOptions, yearMonth: getDefaultYearMonth() });
    }
  }, [open]);

  const update = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const showSortBy = exportType !== 'attendance-pdf';

  // 従業員選択肢
  const employeeOptions = useMemo(() => {
    return users
      .filter(u => u.status !== 'retired')
      .map(u => ({ id: u.id, label: `${u.employeeNumber || ''} ${u.name || ''}`.trim() }));
  }, [users]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {title}エクスポート
          </DialogTitle>
          <DialogDescription>エクスポートオプションを選択してください</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* 対象年月 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">対象年月</Label>
              <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">必須</span>
            </div>
            <RadioGroup
              value={options.periodType}
              onValueChange={(v) => update('periodType', v as 'single' | 'multi')}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="single" id="period-single" />
                <Label htmlFor="period-single" className="text-sm">単月</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="multi" id="period-multi" />
                <Label htmlFor="period-multi" className="text-sm">複数月</Label>
              </div>
            </RadioGroup>
            {options.periodType === 'single' ? (
              <MonthPicker
                value={options.yearMonth}
                onChange={(v) => update('yearMonth', v)}
                className="w-full"
              />
            ) : (
              <MonthRangePicker
                from={options.yearMonthFrom}
                to={options.yearMonthTo}
                onChange={(from, to) => setOptions(prev => ({ ...prev, yearMonthFrom: from, yearMonthTo: to }))}
                className="w-full"
              />
            )}
          </div>

          {/* 出力単位 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">出力単位</Label>
              <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">必須</span>
            </div>
            <RadioGroup
              value={options.unitType}
              onValueChange={(v) => update('unitType', v as 'employee' | 'closing_day')}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="employee" id="unit-employee" />
                <Label htmlFor="unit-employee" className="text-sm">従業員</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="closing_day" id="unit-closing" />
                <Label htmlFor="unit-closing" className="text-sm">勤怠締め日</Label>
              </div>
            </RadioGroup>

            {options.unitType === 'employee' ? (
              <Select
                value={options.selectedEmployees[0] || 'all'}
                onValueChange={(v) => update('selectedEmployees', [v])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="従業員を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  {employeeOptions.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={options.selectedClosingDay}
                onValueChange={(v) => update('selectedClosingDay', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="締め日を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="month_end">月末</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 並び順（PDFでは非表示） */}
          {showSortBy && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">並び順</Label>
              <RadioGroup
                value={options.sortBy}
                onValueChange={(v) => update('sortBy', v as 'employee_number' | 'year_month')}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="employee_number" id="sort-emp" />
                  <Label htmlFor="sort-emp" className="text-sm">従業員番号別</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="year_month" id="sort-ym" />
                  <Label htmlFor="sort-ym" className="text-sm">年月別</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 出力オプション */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">出力オプション</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-punch" className="text-sm">実打刻時間を含める</Label>
              <Switch
                id="include-punch"
                checked={options.includeActualPunch}
                onCheckedChange={(v) => update('includeActualPunch', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">時間フォーマット</Label>
              <Select
                value={options.timeFormat}
                onValueChange={(v) => update('timeFormat', v as TimeFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">時間:分（例: 1:30）</SelectItem>
                  <SelectItem value="hour_minute">時間+分（例: 1.30）</SelectItem>
                  <SelectItem value="decimal">小数点（例: 1.50）</SelectItem>
                  <SelectItem value="minutes">分（例: 90）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 複数月時のみ: 年月を含める */}
            {options.periodType === 'multi' && (
              <div className="flex items-center justify-between">
                <Label htmlFor="include-ym" className="text-sm">年月を含める</Label>
                <Switch
                  id="include-ym"
                  checked={options.includeYearMonth}
                  onCheckedChange={(v) => update('includeYearMonth', v)}
                />
              </div>
            )}
          </div>

          {/* エクスポート対象件数 */}
          <div className="p-3 bg-primary/5 rounded-lg flex items-center justify-between">
            <span className="text-sm">エクスポート対象</span>
            <span className="font-medium">
              {estimatedCount !== undefined ? `約${estimatedCount}件` : '—'}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
          <Button onClick={() => onExport(options)} disabled={exporting}>
            {exporting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                エクスポート中...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                エクスポート
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
