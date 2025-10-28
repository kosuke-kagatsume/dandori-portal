'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { parseScheduledChangesCSV, validateScheduledChanges } from '@/lib/csv/scheduled-changes-csv';
import { useScheduledChangesStore, type ScheduledChange } from '@/lib/store/scheduled-changes-store';
import { toast } from 'sonner';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ScheduledChange[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { scheduleChange } = useScheduledChangesStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['CSVファイルを選択してください']);
      setFile(null);
      setParsedData(null);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setParsedData(null);
    setIsProcessing(true);

    try {
      // CSVをパース
      const data = await parseScheduledChangesCSV(selectedFile);

      // バリデーション
      const validation = validateScheduledChanges(data);

      if (!validation.valid) {
        setErrors(validation.errors);
        setParsedData(null);
      } else {
        setParsedData(data);
        setErrors([]);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'CSVファイルの読み込みに失敗しました']);
      setParsedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!parsedData || parsedData.length === 0) return;

    try {
      let successCount = 0;
      let failCount = 0;

      parsedData.forEach((change) => {
        try {
          // 新しいIDを生成してインポート（既存IDと重複しないように）
          scheduleChange({
            type: change.type,
            userId: change.userId,
            userName: change.userName,
            effectiveDate: change.effectiveDate,
            createdBy: change.createdBy,
            createdByName: change.createdByName,
            requiresApproval: change.requiresApproval,
            details: change.details,
          });
          successCount++;
        } catch (error) {
          console.error('Failed to import change:', error);
          failCount++;
        }
      });

      if (successCount > 0) {
        toast.success(`${successCount}件の予約をインポートしました`);
      }
      if (failCount > 0) {
        toast.error(`${failCount}件のインポートに失敗しました`);
      }

      // ダイアログを閉じる
      handleClose();
    } catch (error) {
      toast.error('インポート中にエラーが発生しました');
      console.error('Import error:', error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setErrors([]);
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV インポート
          </DialogTitle>
          <DialogDescription>
            予約データをCSVファイルからインポートします
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ファイル選択 */}
          <div className="space-y-2">
            <label
              htmlFor="csv-file"
              className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <div className="flex flex-col items-center space-y-2">
                <FileText className="h-8 w-8 text-gray-400" />
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {file ? file.name : 'CSVファイルを選択またはドラッグ＆ドロップ'}
                </span>
                <span className="text-xs text-gray-500">CSV形式のファイルのみ対応</span>
              </div>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* 処理中 */}
          {isProcessing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>ファイルを処理中...</AlertDescription>
            </Alert>
          )}

          {/* エラー表示 */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">エラーが見つかりました：</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {errors.length > 10 && (
                    <li className="text-muted-foreground">
                      他 {errors.length - 10} 件のエラー...
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 成功表示 */}
          {parsedData && parsedData.length > 0 && errors.length === 0 && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <div className="font-medium mb-1">
                  {parsedData.length}件の予約データが読み込まれました
                </div>
                <div className="text-sm">
                  インポートボタンをクリックして予約を追加してください
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* データプレビュー */}
          {parsedData && parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">プレビュー（最初の5件）：</div>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">予約タイプ</th>
                      <th className="px-3 py-2 text-left">対象ユーザー</th>
                      <th className="px-3 py-2 text-left">有効日</th>
                      <th className="px-3 py-2 text-left">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.slice(0, 5).map((change, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{change.type}</td>
                        <td className="px-3 py-2">{change.userName || '-'}</td>
                        <td className="px-3 py-2">{change.effectiveDate}</td>
                        <td className="px-3 py-2">{change.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || parsedData.length === 0 || isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            インポート（{parsedData?.length || 0}件）
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
