'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Settings2, CheckCircle, Search, X, ChevronDown } from 'lucide-react';
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

// ── 従業員マルチセレクト ──────────────────────────────────────────

interface EmployeeOption {
  id: string;
  label: string;
}

function EmployeeMultiSelect({
  employees,
  selected,
  onChange,
}: {
  employees: EmployeeOption[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const isAll = selected.includes('all') || selected.length === 0;

  const filtered = useMemo(() => {
    if (!search) return employees;
    const q = search.toLowerCase();
    return employees.filter(e => e.label.toLowerCase().includes(q));
  }, [employees, search]);

  const toggleAll = () => {
    onChange(['all']);
  };

  const toggleEmployee = (id: string) => {
    if (isAll) {
      // 「全て」から個別選択に切り替え
      onChange([id]);
      return;
    }
    const next = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected.filter(s => s !== 'all'), id];
    onChange(next.length === 0 ? ['all'] : next);
  };

  const removeEmployee = (id: string) => {
    const next = selected.filter(s => s !== id);
    onChange(next.length === 0 ? ['all'] : next);
  };

  const selectedLabels = useMemo(() => {
    if (isAll) return [];
    return selected
      .map(id => employees.find(e => e.id === id))
      .filter((e): e is EmployeeOption => !!e);
  }, [selected, employees, isAll]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-auto min-h-10"
          >
            <span className="text-sm truncate">
              {isAll ? '全て' : `${selectedLabels.length}名選択中`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="名前で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
              <Checkbox
                checked={isAll}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-medium">全て</span>
            </label>
            {filtered.map(e => (
              <label key={e.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
                <Checkbox
                  checked={!isAll && selected.includes(e.id)}
                  onCheckedChange={() => toggleEmployee(e.id)}
                />
                <span className="text-sm">{e.label}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">該当なし</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* 選択済みバッジ */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map(e => (
            <Badge key={e.id} variant="secondary" className="gap-1 pr-1">
              <span className="text-xs">{e.label}</span>
              <button
                type="button"
                onClick={() => removeEmployee(e.id)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

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
              <EmployeeMultiSelect
                employees={employeeOptions}
                selected={options.selectedEmployees}
                onChange={(v) => update('selectedEmployees', v)}
              />
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
