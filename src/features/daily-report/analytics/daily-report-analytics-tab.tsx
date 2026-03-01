'use client';

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  useDailyReportAnalyticsStore,
  type DateRangePreset,
} from '@/lib/store/daily-report-analytics-store';
import { SubmissionRateDashboard } from './submission-rate-dashboard';
import { FieldAggregationPanel } from './field-aggregation-panel';
import { AnalyticsCSVExport } from './analytics-csv-export';

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'this-week', label: '今週' },
  { value: 'this-month', label: '今月' },
  { value: 'last-month', label: '先月' },
  { value: 'custom', label: 'カスタム' },
];

const GRANULARITY_OPTIONS = [
  { value: 'daily', label: '日別' },
  { value: 'weekly', label: '週別' },
  { value: 'monthly', label: '月別' },
] as const;

export function DailyReportAnalyticsTab() {
  const {
    dateRangePreset,
    startDate,
    endDate,
    granularity,
    submissionData,
    isLoading,
    setDateRange,
    setGranularity,
    fetchSubmissionRate,
  } = useDailyReportAnalyticsStore();

  // 初回読み込み
  useEffect(() => {
    fetchSubmissionRate();
  }, [fetchSubmissionRate]);

  // プリセット変更時にデータ再取得
  const handlePresetChange = useCallback((preset: DateRangePreset) => {
    setDateRange(preset);
    // 非customの場合は自動でfetch
    if (preset !== 'custom') {
      setTimeout(() => fetchSubmissionRate(), 0);
    }
  }, [setDateRange, fetchSubmissionRate]);

  // カスタム日付変更
  const handleCustomDateChange = useCallback((type: 'start' | 'end', value: string) => {
    const newStart = type === 'start' ? value : startDate;
    const newEnd = type === 'end' ? value : endDate;
    setDateRange('custom', newStart, newEnd);
  }, [startDate, endDate, setDateRange]);

  // 粒度変更
  const handleGranularityChange = useCallback((g: 'daily' | 'weekly' | 'monthly') => {
    setGranularity(g);
    setTimeout(() => fetchSubmissionRate(), 0);
  }, [setGranularity, fetchSubmissionRate]);

  // カスタム日付での検索
  const handleSearch = useCallback(() => {
    fetchSubmissionRate();
  }, [fetchSubmissionRate]);

  return (
    <div className="space-y-6">
      {/* フィルターバー */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 日付プリセット */}
        <div className="flex gap-1">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={dateRangePreset === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetChange(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* カスタム日付入力 */}
        {dateRangePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="w-[150px]"
            />
            <span className="text-sm text-muted-foreground">〜</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="w-[150px]"
            />
            <Button size="sm" onClick={handleSearch}>
              検索
            </Button>
          </div>
        )}

        {/* 粒度選択 */}
        <Select value={granularity} onValueChange={(v) => handleGranularityChange(v as 'daily' | 'weekly' | 'monthly')}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* CSVエクスポート */}
        <div className="ml-auto">
          <AnalyticsCSVExport />
        </div>
      </div>

      {/* ローディング */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 提出率ダッシュボード */}
      {!isLoading && submissionData && (
        <SubmissionRateDashboard data={submissionData} />
      )}

      {/* データなし */}
      {!isLoading && !submissionData && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          データがありません
        </div>
      )}

      {/* フィールド別集計パネル */}
      <FieldAggregationPanel />
    </div>
  );
}
