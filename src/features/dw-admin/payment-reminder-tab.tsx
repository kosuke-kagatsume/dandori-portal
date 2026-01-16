'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  Clock,
  AlertCircle,
  Calendar,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { usePaymentReminderStore } from '@/lib/store/payment-reminder-store';
import { toast } from 'sonner';

export function PaymentReminderTab() {
  const {
    settings,
    updateSettings,
    history,
    getStats,
    checkAndGenerateReminders,
  } = usePaymentReminderStore();

  const stats = getStats();

  const [editingSettings, setEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  // 設定編集開始
  const handleStartEdit = () => {
    setTempSettings(settings);
    setEditingSettings(true);
  };

  // 設定保存
  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setEditingSettings(false);
    toast.success('リマインダー設定を更新しました');
  };

  // 設定キャンセル
  const handleCancelEdit = () => {
    setEditingSettings(false);
  };

  // 手動チェック実行
  const handleManualCheck = () => {
    checkAndGenerateReminders();
    toast.success('リマインダーチェックを実行しました');
  };

  // 日数配列を文字列に変換
  const daysArrayToString = (days: number[]) => {
    return days.join(', ');
  };

  // 文字列を日数配列に変換
  const stringToDaysArray = (str: string): number[] => {
    return str
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold">支払い期限リマインダー管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          自動リマインダー設定と送信履歴の管理
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              総リマインダー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReminders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              期限前通知
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.beforeDueReminders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              当日通知
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.onDueReminders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              期限超過通知
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueReminders}</div>
          </CardContent>
        </Card>
      </div>

      {/* リマインダー設定 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              リマインダー設定
            </CardTitle>
            <CardDescription className="mt-1">
              自動リマインダーの通知タイミングを設定します
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleManualCheck}>
              <RefreshCw className="h-4 w-4 mr-2" />
              手動チェック
            </Button>
            {!editingSettings ? (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                編集
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  キャンセル
                </Button>
                <Button size="sm" onClick={handleSaveSettings}>
                  保存
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* リマインダー有効/無効 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">自動リマインダー</Label>
              <p className="text-sm text-muted-foreground">
                リマインダーの自動送信を有効にします
              </p>
            </div>
            <Switch
              checked={editingSettings ? tempSettings.enabled : settings.enabled}
              onCheckedChange={(checked) => {
                if (editingSettings) {
                  setTempSettings({ ...tempSettings, enabled: checked });
                } else {
                  updateSettings({ enabled: checked });
                  toast.success(
                    checked ? 'リマインダーを有効にしました' : 'リマインダーを無効にしました'
                  );
                }
              }}
            />
          </div>

          {/* 期限前通知日数 */}
          <div className="space-y-2">
            <Label htmlFor="daysBeforeDue">期限前通知（日数）</Label>
            <Input
              id="daysBeforeDue"
              value={
                editingSettings
                  ? daysArrayToString(tempSettings.daysBeforeDue)
                  : daysArrayToString(settings.daysBeforeDue)
              }
              onChange={(e) => {
                if (editingSettings) {
                  setTempSettings({
                    ...tempSettings,
                    daysBeforeDue: stringToDaysArray(e.target.value),
                  });
                }
              }}
              disabled={!editingSettings}
              placeholder="例: 3, 1"
            />
            <p className="text-xs text-muted-foreground">
              カンマ区切りで日数を指定（例: 3, 1 = 3日前と1日前に通知）
            </p>
          </div>

          {/* 期限超過通知の有効/無効 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">期限超過通知</Label>
              <p className="text-sm text-muted-foreground">
                期限を過ぎた請求書のリマインダーを送信します
              </p>
            </div>
            <Switch
              checked={
                editingSettings ? tempSettings.overdueCheckEnabled : settings.overdueCheckEnabled
              }
              onCheckedChange={(checked) => {
                if (editingSettings) {
                  setTempSettings({ ...tempSettings, overdueCheckEnabled: checked });
                }
              }}
              disabled={!editingSettings}
            />
          </div>

          {/* 期限超過通知日数 */}
          <div className="space-y-2">
            <Label htmlFor="overdueCheckDays">期限超過後通知（日数）</Label>
            <Input
              id="overdueCheckDays"
              value={
                editingSettings
                  ? daysArrayToString(tempSettings.overdueCheckDays)
                  : daysArrayToString(settings.overdueCheckDays)
              }
              onChange={(e) => {
                if (editingSettings) {
                  setTempSettings({
                    ...tempSettings,
                    overdueCheckDays: stringToDaysArray(e.target.value),
                  });
                }
              }}
              disabled={!editingSettings}
              placeholder="例: 1, 3, 7"
            />
            <p className="text-xs text-muted-foreground">
              カンマ区切りで日数を指定（例: 1, 3, 7 = 期限超過1日後、3日後、7日後に通知）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* リマインダー履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>リマインダー送信履歴</CardTitle>
          <CardDescription>送信済みのリマインダー一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>送信日時</TableHead>
                  <TableHead>種類</TableHead>
                  <TableHead>テナント</TableHead>
                  <TableHead>請求書番号</TableHead>
                  <TableHead>期限</TableHead>
                  <TableHead>タイミング</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      リマインダー履歴がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(item.sentAt).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        {item.reminderType === 'before_due' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            期限前
                          </Badge>
                        ) : item.reminderType === 'on_due' ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            当日
                          </Badge>
                        ) : (
                          <Badge variant="destructive">期限超過</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.tenantName}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {item.invoiceNumber}
                        </code>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(item.dueDate).toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        {item.daysFromDue === 0
                          ? '当日'
                          : item.daysFromDue < 0
                            ? `${Math.abs(item.daysFromDue)}日前`
                            : `期限超過${item.daysFromDue}日`}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
