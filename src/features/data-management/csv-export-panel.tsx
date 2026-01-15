'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Users,
  Clock,
  FileSpreadsheet,
  FileText,
  Info,
  CheckCircle,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportUsersToCSV, exportAttendanceToCSV } from '@/lib/csv/csv-export';
import { useUserStore } from '@/lib/store/user-store';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';

type ExportType = 'employee' | 'monthly' | 'attendance-csv' | 'attendance-pdf';

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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedExport, setSelectedExport] = useState<ExportType | null>(null);
  const [exporting, setExporting] = useState(false);

  // Export options state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [includeRetired, setIncludeRetired] = useState(false);
  const [includePreHire, setIncludePreHire] = useState(false);
  const [includeActualPunch, setIncludeActualPunch] = useState(true);
  const [timeFormat, setTimeFormat] = useState<'hhmm' | 'decimal'>('hhmm');

  // Stores
  const { users } = useUserStore();
  const { records: attendanceRecords } = useAttendanceHistoryStore();

  const activeConfig = selectedExport ? exportConfigs.find(c => c.id === selectedExport) : null;

  // 年の選択肢を生成
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // エクスポート実行
  const handleExport = useCallback(async () => {
    if (!selectedExport) return;

    setExporting(true);

    try {
      switch (selectedExport) {
        case 'employee': {
          // 従業員データフィルタリング
          let filteredUsers = [...users];

          if (!includeRetired) {
            filteredUsers = filteredUsers.filter(u => u.status !== 'retired');
          }
          if (!includePreHire) {
            filteredUsers = filteredUsers.filter(u => {
              const hireDate = new Date(u.hireDate);
              return hireDate <= new Date();
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
          break;
        }

        case 'monthly':
        case 'attendance-csv': {
          // 月別勤怠データフィルタリング
          const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
          const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;

          const filteredRecords = attendanceRecords.filter(r =>
            r.date >= startDate && r.date <= endDate
          );

          if (filteredRecords.length === 0) {
            toast.error('エクスポートするデータがありません');
            return;
          }

          const filename = selectedExport === 'monthly'
            ? `monthly_${selectedYear}${String(selectedMonth).padStart(2, '0')}.csv`
            : `attendance_${selectedYear}${String(selectedMonth).padStart(2, '0')}.csv`;

          const result = exportAttendanceToCSV(filteredRecords, filename);
          if (result.success) {
            toast.success(`${result.recordCount}件の勤怠データをエクスポートしました`);
          } else {
            toast.error(result.error || 'エクスポートに失敗しました');
          }
          break;
        }

        case 'attendance-pdf': {
          // PDFエクスポートはブラウザ印刷機能を使用
          toast.info('PDF出力はブラウザの印刷機能を使用してください', {
            description: '勤怠一覧画面から印刷ダイアログを開き、「PDFとして保存」を選択してください',
          });
          break;
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('エクスポートに失敗しました');
    } finally {
      setExporting(false);
      setShowExportDialog(false);
    }
  }, [selectedExport, selectedYear, selectedMonth, includeRetired, includePreHire, users, attendanceRecords]);

  // ダイアログを開く
  const openExportDialog = (exportType: ExportType) => {
    setSelectedExport(exportType);
    setShowExportDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          各種データをCSV/PDF形式でエクスポートできます。
          エクスポートされたデータは他システムへの連携や帳票印刷に活用できます。
        </AlertDescription>
      </Alert>

      {/* エクスポートカード一覧 */}
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
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={config.format === 'csv' ? 'default' : 'secondary'}>
                  {config.format.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => openExportDialog(config.id)}
              >
                <Download className="mr-2 h-4 w-4" />
                エクスポート
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* エクスポートダイアログ */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {activeConfig?.title}エクスポート
            </DialogTitle>
            <DialogDescription>
              エクスポートオプションを選択してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 年月選択 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>対象年</Label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={String(year)}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>対象月</Label>
                <Select
                  value={String(selectedMonth)}
                  onValueChange={(v) => setSelectedMonth(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={String(month)}>
                        {month}月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 従業員エクスポートオプション */}
            {selectedExport === 'employee' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">フィルターオプション</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-retired" className="text-sm">退職者を含める</Label>
                  <Switch
                    id="include-retired"
                    checked={includeRetired}
                    onCheckedChange={setIncludeRetired}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-pre-hire" className="text-sm">入社前社員を含める</Label>
                  <Switch
                    id="include-pre-hire"
                    checked={includePreHire}
                    onCheckedChange={setIncludePreHire}
                  />
                </div>
              </div>
            )}

            {/* 勤怠エクスポートオプション */}
            {(selectedExport === 'monthly' || selectedExport === 'attendance-csv') && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">出力オプション</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-actual-punch" className="text-sm">実打刻時間を含める</Label>
                  <Switch
                    id="include-actual-punch"
                    checked={includeActualPunch}
                    onCheckedChange={setIncludeActualPunch}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">時間フォーマット</Label>
                  <Select
                    value={timeFormat}
                    onValueChange={(v) => setTimeFormat(v as 'hhmm' | 'decimal')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hhmm">時間:分（例: 8:30）</SelectItem>
                      <SelectItem value="decimal">小数点（例: 8.5）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* PDFオプション */}
            {selectedExport === 'attendance-pdf' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  PDF出力は勤怠一覧画面からブラウザの印刷機能を使用して行います。
                  「エクスポート」ボタンをクリックすると、印刷プレビュー画面が開きます。
                </AlertDescription>
              </Alert>
            )}

            {/* データ件数プレビュー */}
            <div className="p-3 bg-primary/5 rounded-lg flex items-center justify-between">
              <span className="text-sm">エクスポート対象</span>
              <span className="font-medium">
                {selectedExport === 'employee' && `約${users.length}件`}
                {(selectedExport === 'monthly' || selectedExport === 'attendance-csv') && `約${attendanceRecords.length}件`}
                {selectedExport === 'attendance-pdf' && 'ブラウザ印刷'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
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
    </div>
  );
}
