'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthRangePickerProps {
  from: string;       // "YYYY-MM" or ""
  to: string;         // "YYYY-MM" or ""
  onChange: (from: string, to: string) => void;
  className?: string;
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function formatYearMonth(ym: string): string {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}/${m.padStart(2, '0')}`;
}

export function MonthRangePicker({ from, to, onChange, className }: MonthRangePickerProps) {
  const currentYear = new Date().getFullYear();
  const [displayYear, setDisplayYear] = useState(from ? parseInt(from.split('-')[0]) : currentYear);
  const [selecting, setSelecting] = useState<'from' | 'to'>('from');
  const [open, setOpen] = useState(false);

  const isInRange = useCallback((ym: string) => {
    if (!from || !to) return false;
    return ym >= from && ym <= to;
  }, [from, to]);

  const isSelected = useCallback((ym: string) => {
    return ym === from || ym === to;
  }, [from, to]);

  const handleMonthClick = (month: number) => {
    const ym = `${displayYear}-${String(month).padStart(2, '0')}`;
    if (selecting === 'from') {
      onChange(ym, '');
      setSelecting('to');
    } else {
      if (ym < from) {
        onChange(ym, from);
      } else {
        onChange(from, ym);
      }
      setSelecting('from');
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setSelecting('from');
  };

  const displayText = from && to
    ? `${formatYearMonth(from)} - ${formatYearMonth(to)}`
    : from
    ? `${formatYearMonth(from)} - ...`
    : '期間を選択';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start text-left font-normal', !from && 'text-muted-foreground', className)}>
          <Calendar className="mr-2 h-4 w-4" />
          <span className="flex-1">{displayText}</span>
          {from && (
            <X className="ml-2 h-3 w-3 text-muted-foreground hover:text-foreground" onClick={handleClear} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start">
        {/* 年ナビゲーション */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDisplayYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm">{displayYear}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDisplayYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 12ヶ月グリッド */}
        <div className="grid grid-cols-3 gap-2">
          {MONTH_LABELS.map((label, i) => {
            const month = i + 1;
            const ym = `${displayYear}-${String(month).padStart(2, '0')}`;
            const selected = isSelected(ym);
            const inRange = isInRange(ym);

            return (
              <Button
                key={month}
                variant={selected ? 'default' : inRange ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9',
                  inRange && !selected && 'bg-primary/10 hover:bg-primary/20',
                )}
                onClick={() => handleMonthClick(month)}
              >
                {label}
              </Button>
            );
          })}
        </div>

        {/* 選択ガイド */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          {selecting === 'from' ? '開始月を選択' : '終了月を選択'}
        </p>
      </PopoverContent>
    </Popover>
  );
}

// ── 単月ピッカー ──────────────────────────────────────────

interface MonthPickerProps {
  value: string;       // "YYYY-MM" or ""
  onChange: (value: string) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [displayYear, setDisplayYear] = useState(value ? parseInt(value.split('-')[0]) : currentYear);
  const [open, setOpen] = useState(false);

  const handleMonthClick = (month: number) => {
    onChange(`${displayYear}-${String(month).padStart(2, '0')}`);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const displayText = value ? formatYearMonth(value) : '年月を選択';

  // デフォルト値設定
  if (!value) {
    const defaultValue = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    onChange(defaultValue);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('justify-start text-left font-normal', !value && 'text-muted-foreground', className)}>
          <Calendar className="mr-2 h-4 w-4" />
          <span className="flex-1">{displayText}</span>
          {value && (
            <X className="ml-2 h-3 w-3 text-muted-foreground hover:text-foreground" onClick={handleClear} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDisplayYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm">{displayYear}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDisplayYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTH_LABELS.map((label, i) => {
            const month = i + 1;
            const ym = `${displayYear}-${String(month).padStart(2, '0')}`;
            return (
              <Button
                key={month}
                variant={ym === value ? 'default' : 'ghost'}
                size="sm"
                className="h-9"
                onClick={() => handleMonthClick(month)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
