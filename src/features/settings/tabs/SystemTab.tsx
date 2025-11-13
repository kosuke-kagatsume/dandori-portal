'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, Database, Trash2, AlertTriangle, HardDrive, Settings } from 'lucide-react';
import type { SettingsTabProps } from '../types';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { BackupPanel } from '@/components/backup/backup-panel';
import { toast } from 'sonner';

export function SystemTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  const { resetSettings } = useCompanySettingsStore();

  const handleResetAllSettings = () => {
    if (confirm('全ての設定をリセットしますか？この操作は取り消せません。')) {
      resetSettings();
      toast.success('全ての設定がリセットされました');
    }
  };

  const handleClearLocalStorage = () => {
    if (confirm('LocalStorageの全データを削除しますか？この操作は取り消せません。')) {
      localStorage.clear();
      toast.success('LocalStorageをクリアしました');
      window.location.reload();
    }
  };

  const getLocalStorageSize = () => {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">データ管理</TabsTrigger>
          <TabsTrigger value="system">システム管理</TabsTrigger>
        </TabsList>

        {/* データ管理タブ */}
        <TabsContent value="data" className="space-y-6">
          {/* バックアップ&リストア */}
          <Card>
            <BackupPanel />
          </Card>

          {/* LocalStorage使用状況 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                <CardTitle>ストレージ使用状況</CardTitle>
              </div>
              <CardDescription>LocalStorageの使用状況を確認します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">LocalStorage使用状況</p>
                <p className="text-2xl font-bold">{getLocalStorageSize()} KB</p>
                <p className="text-sm text-muted-foreground">
                  利用可能な容量: 約5-10 MB（ブラウザにより異なります）
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  LocalStorageに保存されているデータ:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>ユーザー設定（テーマ、言語など）</li>
                  <li>会社設定（会社情報、給与設定、年末調整設定）</li>
                  <li>勤怠履歴データ</li>
                  <li>ワークフロー申請データ</li>
                  <li>休暇管理データ</li>
                  <li>組織構造データ</li>
                  <li>その他の業務データ</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* システム管理タブ */}
        <TabsContent value="system" className="space-y-6">
          {/* 警告メッセージ */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              このセクションの操作は慎重に行ってください。誤って実行するとデータが失われる可能性があります。
            </AlertDescription>
          </Alert>

          {/* システムリセット */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <CardTitle>設定のリセット</CardTitle>
              </div>
              <CardDescription>設定を初期状態に戻します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    設定のリセットについて
                  </p>
                  <p className="text-sm text-yellow-700">
                    このボタンを押すと、会社情報・給与設定・年末調整設定がデフォルト値に戻ります。
                    業務データ（勤怠履歴、ワークフロー申請など）は削除されません。
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={handleResetAllSettings}
                  className="w-full"
                >
                  設定を初期化
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* データ完全削除 */}
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-600">データの完全削除</CardTitle>
              </div>
              <CardDescription>
                全てのデータを削除します（危険な操作）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    ⚠️ 警告: この操作は取り消せません
                  </p>
                  <p className="text-sm text-red-700 mb-2">
                    このボタンを押すと、LocalStorageに保存されている全てのデータが削除されます:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    <li>全ての設定</li>
                    <li>勤怠履歴データ</li>
                    <li>ワークフロー申請データ</li>
                    <li>休暇管理データ</li>
                    <li>組織データ</li>
                    <li>その他全ての業務データ</li>
                  </ul>
                  <p className="text-sm text-red-700 mt-2 font-medium">
                    実行後、ページは自動的にリロードされます。
                  </p>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleClearLocalStorage}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  LocalStorageを完全削除
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* システム情報 */}
          <Card>
            <CardHeader>
              <CardTitle>システム情報</CardTitle>
              <CardDescription>アプリケーションのバージョン情報</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">アプリケーション:</span>
                  <span className="font-medium">Dandori Portal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">バージョン:</span>
                  <span className="font-medium">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">フレームワーク:</span>
                  <span className="font-medium">Next.js 14.2.15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ビルド日:</span>
                  <span className="font-medium">2025-10-26</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
