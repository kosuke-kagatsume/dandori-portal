'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download, Users, Clock, FileSpreadsheet, FileText, Info, CheckCircle, Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportUsersToCSV, exportAttendanceToCSV } from '@/lib/csv/csv-export';
import { useUserStore } from '@/lib/store/user-store';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';
import { ExportDialog, type ExportOptions, type ExportType as AttendanceExportType } from './export-dialog';

type ExportType = 'employee' | AttendanceExportType;

interface ExportConfig {
  id: ExportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  format: 'csv' | 'pdf';
}

const exportConfigs: ExportConfig[] = [
  {
    id: 'employee',
    title: '従業員データ',
    description: 'ログイン許可/退職者/入社前フィルター',
    icon: <Users className="h-5 w-5" />,
    format: 'csv',
  },
  {
    id: 'monthly',
    title: '月別データ',
    description: '勤怠締め日/時間フォーマット選択',
    icon: <Clock className="h-5 w-5" />,
    format: 'csv',
  },
  {
    id: 'attendance-csv',
    title: '出勤簿データ（CSV）',
    description: '実打刻/実質労働時間含む選択',
    icon: <FileSpreadsheet className="h-5 w-5" />,
    format: 'csv',
  },
  {
    id: 'attendance-pdf',
    title: '出勤簿データ（PDF）',
    description: '年月指定 or 従業員指定',
    icon: <FileText className="h-5 w-5" />,
    format: 'pdf',
  },
];

export function CSVExportPanel() {
  // 従業員エクスポートダイアログ
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [employeeExporting, setEmployeeExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [includeRetired, setIncludeRetired] = useState(false);
  const [includePreHire, setIncludePreHire] = useState(false);

  // 勤怠系エクスポートダイアログ（共通）
  const [attendanceDialogType, setAttendanceDialogType] = useState<AttendanceExportType | null>(null);
  const [attendanceExporting, setAttendanceExporting] = useState(false);

  const { users } = useUserStore();
  const { records: attendanceRecords } = useAttendanceHistoryStore();

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const openExportDialog = (type: ExportType) => {
    if (type === 'employee') {
      setShowEmployeeDialog(true);
    } else {
      setAttendanceDialogType(type);
    }
  };

  // 従業員エクスポート
  const handleEmployeeExport = useCallback(async () => {
    setEmployeeExporting(true);
    try {
      let filteredUsers = [...users];
      if (!includeRetired) {
        filteredUsers = filteredUsers.filter(u => u.status !== 'retired');
      }
      if (!includePreHire) {
        filteredUsers = filteredUsers.filter(u => {
          if (!u.hireDate) return true;
          return new Date(u.hireDate) <= new Date();
        });
      }
      if (filteredUsers.length === 0) {
        toast.error('エクスポートするデータがありません');
        return;
      }
      const result = exportUsersToCSV(filteredUsers, `employees_${selectedYear}${String(selectedMonth).padStart(2, '0')}.csv`);
      if (result.success) {
        toast.success(`${result.recordCount}件の従業員データをエクスポートしました`);
      } else {
        toast.error(result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('エクスポートに失敗しました');
    } finally {
      setEmployeeExporting(false);
      setShowEmployeeDialog(false);
    }
  }, [users, includeRetired, includePreHire, selectedYear, selectedMonth]);

  // 勤怠系エクスポート
  const handleAttendanceExport = useCallback(async (options: ExportOptions) => {
    if (!attendanceDialogType) return;
    setAttendanceExporting(true);
    try {
      const yearMonth = options.periodType === 'single' ? options.yearMonth : options.yearMonthFrom;
      const [y, m] = (yearMonth || '').split('-');

      // 勤怠データフィルタリング（PDF/CSV共通）
      let startDate: string;
      let endDate: string;

      if (options.periodType === 'single') {
        startDate = `${y}-${m}-01`;
        endDate = `${y}-${m}-31`;
      } else {
        const [fy, fm] = (options.yearMonthFrom || '').split('-');
        const [ty, tm] = (options.yearMonthTo || '').split('-');
        startDate = `${fy}-${fm}-01`;
        endDate = `${ty}-${tm}-31`;
      }

      let filteredRecords = attendanceRecords.filter(r =>
        r.date >= startDate && r.date <= endDate
      );

      if (options.unitType === 'employee' && !options.selectedEmployees.includes('all')) {
        filteredRecords = filteredRecords.filter(r =>
          options.selectedEmployees.includes(r.userId || '')
        );
      }

      if (filteredRecords.length === 0) {
        toast.error('エクスポートするデータがありません');
        return;
      }

      // PDF出力
      if (attendanceDialogType === 'attendance-pdf') {
        const { generateAttendancePDFLazy } = await import('@/lib/pdf/lazy-pdf');
        const userInfos = users.map(u => ({
          id: u.id,
          name: u.name || '',
          employeeNumber: u.employeeNumber || undefined,
          department: u.department || undefined,
        }));
        const pdf = await generateAttendancePDFLazy(filteredRecords, options, userInfos);
        const ymStr = options.periodType === 'single'
          ? (yearMonth || '').replace('-', '')
          : `${(options.yearMonthFrom || '').replace('-', '')}_${(options.yearMonthTo || '').replace('-', '')}`;
        pdf.save(`出勤簿_${ymStr}.pdf`);
        toast.success('出勤簿PDFをダウンロードしました');
        return;
      }

      // CSV出力
      const prefix = attendanceDialogType === 'monthly' ? 'monthly' : 'attendance';
      const filename = `${prefix}_${y}${m}.csv`;
      const result = exportAttendanceToCSV(filteredRecords, filename);
      if (result.success) {
        toast.success(`${result.recordCount}件の勤怠データをエクスポートしました`);
      } else {
        toast.error(result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('エクスポートに失敗しました');
    } finally {
      setAttendanceExporting(false);
      setAttendanceDialogType(null);
    }
  }, [attendanceDialogType, attendanceRecords, users]);

  const activeAttendanceConfig = attendanceDialogType
    ? exportConfigs.find(c => c.id === attendanceDialogType)
    : null;

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          各種データをCSV/PDF形式でエクスポートできます。
          エクスポートされたデータは他システムへの連携や帳票印刷に活用できます。
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        {exportConfigs.map(config => (
          <Card key={config.id} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {config.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{config.title}</CardTitle>
                    <CardDescription className="text-sm">{config.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={config.format === 'csv' ? 'default' : 'secondary'}>
                  {config.format.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => openExportDialog(config.id)}>
                <Download className="mr-2 h-4 w-4" />
                エクスポート
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 従業員エクスポートダイアログ */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              従業員データエクスポート
            </DialogTitle>
            <DialogDescription>エクスポートオプションを選択してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>対象年</Label>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>対象月</Label>
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={String(month)}>{month}月</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm">フィルターオプション</h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-retired" className="text-sm">退職者を含める</Label>
                <Switch id="include-retired" checked={includeRetired} onCheckedChange={setIncludeRetired} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-pre-hire" className="text-sm">入社前社員を含める</Label>
                <Switch id="include-pre-hire" checked={includePreHire} onCheckedChange={setIncludePreHire} />
              </div>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg flex items-center justify-between">
              <span className="text-sm">エクスポート対象</span>
              <span className="font-medium">約{users.length}件</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>キャンセル</Button>
            <Button onClick={handleEmployeeExport} disabled={employeeExporting}>
              {employeeExporting ? (
                <><span className="animate-spin mr-2">⟳</span>エクスポート中...</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" />エクスポート</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 勤怠系共通エクスポートダイアログ */}
      <ExportDialog
        open={!!attendanceDialogType}
        onOpenChange={(open) => { if (!open) setAttendanceDialogType(null); }}
        title={activeAttendanceConfig?.title || ''}
        exportType={attendanceDialogType || 'monthly'}
        onExport={handleAttendanceExport}
        exporting={attendanceExporting}
        estimatedCount={attendanceRecords.length}
      />
    </div>
  );
}
