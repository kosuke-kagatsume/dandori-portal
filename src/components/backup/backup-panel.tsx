'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  Info,
  HardDrive,
} from 'lucide-react';
import {
  downloadBackupJSON,
  importBackupFile,
  getBackupSize,
  validateBackup,
} from '@/lib/backup/data-backup';
import { toast } from 'sonner';

export function BackupPanel() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupSize, setBackupSize] = useState<number | null>(null);

  // バックアップサイズを取得
  const handleGetSize = () => {
    const size = getBackupSize();
    setBackupSize(size);
    toast.success(`バックアップサイズ: ${size.toFixed(2)} MB`);
  };

  // JSONバックアップ
  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // UI feedback
      downloadBackupJSON();
      toast.success('バックアップが完了しました', {
        description: 'JSONファイルがダウンロードされました',
      });
    } catch (error) {
      toast.error('バックアップに失敗しました', {
        description: 'エラーが発生しました',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // リストア
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);

    try {
      const result = await importBackupFile(file);

      if (result.success) {
        toast.success('データのリストアが完了しました', {
          description: 'ページをリロードしてください',
        });

        // 2秒後にリロード
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('リストアに失敗しました', {
          description: result.errors.join(', '),
        });
      }
    } catch (error) {
      toast.error('リストアに失敗しました', {
        description: 'ファイルの読み込みエラー',
      });
    } finally {
      setIsRestoring(false);
      // input値をリセット
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* バックアップ統計 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">データサイズ</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupSize !== null ? `${backupSize.toFixed(2)} MB` : '-'}
            </div>
            <Button variant="link" size="sm" className="px-0" onClick={handleGetSize}>
              計算する
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">バックアップ対象</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 ストア</div>
            <p className="text-xs text-muted-foreground mt-1">全データを一括保存</p>
          </CardContent>
        </Card>
      </div>

      {/* バックアップ作成 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            バックアップの作成
          </CardTitle>
          <CardDescription>
            全データをJSON形式でエクスポートします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              ユーザー、勤怠、給与、ワークフロー等、全12ストアのデータを含みます
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="flex-1"
            >
              {isBackingUp ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  バックアップ中...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  JSONバックアップをダウンロード
                </>
              )}
            </Button>
          </div>

          {isBackingUp && (
            <Progress value={75} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* リストア */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            バックアップからリストア
          </CardTitle>
          <CardDescription>
            バックアップファイルからデータを復元します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>警告:</strong> 現在のデータは全て上書きされます。この操作は取り消せません。
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label htmlFor="restore-file">
              <Button
                variant="outline"
                className="w-full"
                disabled={isRestoring}
                asChild
              >
                <span>
                  {isRestoring ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      リストア中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      バックアップファイルを選択
                    </>
                  )}
                </span>
              </Button>
            </label>
            <input
              id="restore-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestore}
              disabled={isRestoring}
            />
            <p className="text-xs text-muted-foreground">
              JSON形式のバックアップファイルを選択してください
            </p>
          </div>

          {isRestoring && (
            <Progress value={50} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* 自動バックアップ（将来機能） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-4" />
            自動バックアップ（準備中）
          </CardTitle>
          <CardDescription>
            定期的な自動バックアップを設定できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              この機能は将来のバージョンで実装予定です
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
