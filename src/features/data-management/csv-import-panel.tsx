'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  Download,
  FileText,
  Users,
  Clock,
  Calendar,
  Gift,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  importEmployees,
  importAttendance,
  importLeaveUsage,
  importLeaveGrant,
  importTransferReservation,
  generateEmployeeTemplate,
  generateAttendanceTemplate,
  generateLeaveUsageTemplate,
  generateLeaveGrantTemplate,
  generateTransferReservationTemplate,
  downloadTemplate,
  type CSVImportResult,
  type CSVImportError,
} from '@/lib/csv/csv-import';

type ImportType = 'employee' | 'attendance' | 'leave-usage' | 'leave-grant' | 'transfer-reservation';

interface ImportConfig {
  id: ImportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  maxRows: number;
  templateGenerator: () => string;
  templateFilename: string;
  importFunction: (csvText: string) => CSVImportResult;
}

const importConfigs: ImportConfig[] = [
  {
    id: 'employee',
    title: '従業員データ',
    description: '従業員の基本情報をインポート',
    icon: <Users className="h-5 w-5" />,
    maxRows: 3000,
    templateGenerator: generateEmployeeTemplate,
    templateFilename: 'employee_template.csv',
    importFunction: importEmployees,
  },
  {
    id: 'attendance',
    title: '日次勤怠データ',
    description: '出勤・退勤・休憩時間をインポート',
    icon: <Clock className="h-5 w-5" />,
    maxRows: 50000,
    templateGenerator: generateAttendanceTemplate,
    templateFilename: 'attendance_template.csv',
    importFunction: importAttendance,
  },
  {
    id: 'leave-usage',
    title: '休暇利用実績',
    description: '有給休暇の利用実績をインポート',
    icon: <Calendar className="h-5 w-5" />,
    maxRows: 1200,
    templateGenerator: generateLeaveUsageTemplate,
    templateFilename: 'leave_usage_template.csv',
    importFunction: importLeaveUsage,
  },
  {
    id: 'leave-grant',
    title: '休暇付与データ',
    description: '有給休暇・代休の付与をインポート',
    icon: <Gift className="h-5 w-5" />,
    maxRows: 1000,
    templateGenerator: generateLeaveGrantTemplate,
    templateFilename: 'leave_grant_template.csv',
    importFunction: importLeaveGrant,
  },
  {
    id: 'transfer-reservation',
    title: '異動予約データ',
    description: '従業員の異動予約をインポート',
    icon: <Users className="h-5 w-5" />,
    maxRows: 3000,
    templateGenerator: generateTransferReservationTemplate,
    templateFilename: 'transfer_reservation_template.csv',
    importFunction: importTransferReservation,
  },
];

export function CSVImportPanel() {
  const [activeTab, setActiveTab] = useState<ImportType>('employee');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConfig = importConfigs.find(c => c.id === activeTab)!;

  // テンプレートダウンロード
  const handleDownloadTemplate = useCallback(() => {
    const template = activeConfig.templateGenerator();
    downloadTemplate(template, activeConfig.templateFilename);
    toast.success('テンプレートをダウンロードしました');
  }, [activeConfig]);

  // ファイル選択
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('CSVファイルを選択してください');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  // インポート実行
  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      toast.error('ファイルを選択してください');
      return;
    }

    setImporting(true);

    try {
      const text = await selectedFile.text();
      const result = activeConfig.importFunction(text);

      setImportResult(result);
      setShowResultDialog(true);

      if (result.success) {
        toast.success(`${result.successRows}件のデータをインポートしました`);
      } else if (result.successRows > 0) {
        toast.warning(`${result.successRows}件のデータをインポートしました（${result.errorRows}件のエラー）`);
      } else {
        toast.error('インポートに失敗しました');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('ファイルの読み込みに失敗しました');
    } finally {
      setImporting(false);
    }
  }, [selectedFile, activeConfig]);

  // ファイル選択をリセット
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* 説明 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          CSVファイルを使用して、従業員データや勤怠データを一括でインポートできます。
          各データ種別のテンプレートをダウンロードしてご利用ください。
        </AlertDescription>
      </Alert>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ImportType); handleReset(); }}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {importConfigs.map(config => (
            <TabsTrigger key={config.id} value={config.id} className="flex items-center gap-2">
              {config.icon}
              <span className="hidden sm:inline">{config.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {importConfigs.map(config => (
          <TabsContent key={config.id} value={config.id} className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {config.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{config.title}インポート</CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    最大{config.maxRows.toLocaleString()}行
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ステップ1: テンプレートダウンロード */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                      1
                    </span>
                    テンプレートをダウンロード
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">
                    まず、インポート用のCSVテンプレートをダウンロードしてください。
                  </p>
                  <Button
                    variant="outline"
                    className="ml-8"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    テンプレートをダウンロード
                  </Button>
                </div>

                {/* ステップ2: ファイル選択 */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                      2
                    </span>
                    CSVファイルを選択
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">
                    データを入力したCSVファイルを選択してください。
                  </p>
                  <div className="ml-8 flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id={`file-input-${config.id}`}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      ファイルを選択
                    </Button>
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{selectedFile.name}</span>
                        <span className="text-muted-foreground">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ステップ3: インポート実行 */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                      3
                    </span>
                    インポート実行
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">
                    ファイルを確認し、インポートを実行してください。
                  </p>
                  <div className="ml-8 flex items-center gap-2">
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || importing}
                    >
                      {importing ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          インポート中...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          インポート実行
                        </>
                      )}
                    </Button>
                    {selectedFile && (
                      <Button variant="ghost" onClick={handleReset}>
                        リセット
                      </Button>
                    )}
                  </div>
                </div>

                {/* 注意事項 */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">注意事項</p>
                      <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-0.5">
                        <li>従業員番号が既存データと一致する場合、データが更新されます</li>
                        <li>日付形式はYYYY-MM-DD（例: 2026-01-15）を使用してください</li>
                        <li>時刻形式はHH:mm（例: 09:00）を使用してください</li>
                        <li>文字コードはUTF-8（BOM付き推奨）を使用してください</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* 結果ダイアログ */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importResult?.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : importResult?.successRows && importResult.successRows > 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              インポート結果
            </DialogTitle>
            <DialogDescription>
              {activeConfig.title}のインポートが完了しました
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* サマリー */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{importResult.totalRows}</div>
                  <div className="text-sm text-muted-foreground">総行数</div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.successRows}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">成功</div>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-950 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.errorRows}</div>
                  <div className="text-sm text-red-700 dark:text-red-300">エラー</div>
                </div>
              </div>

              {/* 進捗バー */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>成功率</span>
                  <span>{Math.round((importResult.successRows / importResult.totalRows) * 100)}%</span>
                </div>
                <Progress value={(importResult.successRows / importResult.totalRows) * 100} />
              </div>

              {/* 警告 */}
              {importResult.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {importResult.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* エラー一覧 */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-red-600">エラー詳細</h4>
                  <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">行</TableHead>
                          <TableHead>エラー内容</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.slice(0, 20).map((error: CSVImportError, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">{error.row}</TableCell>
                            <TableCell className="text-sm">{error.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {importResult.errors.length > 20 && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        他 {importResult.errors.length - 20} 件のエラー
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => { setShowResultDialog(false); handleReset(); }}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
