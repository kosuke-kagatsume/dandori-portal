'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useDailyReportAnalyticsStore } from '@/lib/store/daily-report-analytics-store';
import {
  exportDailyReportListToCSV,
  exportSubmissionRateToCSV,
  exportFieldAggregationToCSV,
} from '@/lib/csv/csv-export';

export function AnalyticsCSVExport() {
  const {
    submissionData,
    fieldAggregation,
    isExporting,
    setIsExporting,
  } = useDailyReportAnalyticsStore();

  const handleExportReports = () => {
    if (!submissionData) {
      toast.error('データがありません');
      return;
    }
    setIsExporting(true);
    try {
      const result = exportSubmissionRateToCSV(submissionData.employeeDetails);
      if (result.success) {
        toast.success('CSVをダウンロードしました');
      } else {
        toast.error(result.error || 'エクスポートに失敗しました');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSubmissionRate = () => {
    if (!submissionData) {
      toast.error('データがありません');
      return;
    }
    setIsExporting(true);
    try {
      const result = exportDailyReportListToCSV(submissionData.employeeDetails);
      if (result.success) {
        toast.success('CSVをダウンロードしました');
      } else {
        toast.error(result.error || 'エクスポートに失敗しました');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFieldAggregation = () => {
    if (!fieldAggregation) {
      toast.error('フィールド集計データがありません。テンプレートを選択してください。');
      return;
    }
    setIsExporting(true);
    try {
      const result = exportFieldAggregationToCSV(fieldAggregation);
      if (result.success) {
        toast.success('CSVをダウンロードしました');
      } else {
        toast.error(result.error || 'エクスポートに失敗しました');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          CSVエクスポート
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportReports}>
          提出率サマリCSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportSubmissionRate}>
          個人別提出状況CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportFieldAggregation}>
          フィールド集計CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
