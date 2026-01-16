'use client';

import React, { useState } from 'react';
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
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { useInvoiceAutoGenerationStore } from '@/lib/store/invoice-auto-generation-store';
import { toast } from 'sonner';

export function InvoiceAutoGenerationTab() {
  const {
    settings,
    updateSettings,
    history,
    getStats,
    generateInvoicesForAllTenants,
  } = useInvoiceAutoGenerationStore();

  const stats = getStats();

  const [editingSettings, setEditingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // 設定編集開始
  const handleStartEdit = () => {
    setTempSettings(settings);
    setEditingSettings(true);
  };

  // 設定保存
  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setEditingSettings(false);
    toast.success('自動生成設定を更新しました');
  };

  // 設定キャンセル
  const handleCancelEdit = () => {
    setEditingSettings(false);
  };

  // 手動実行
  const handleManualGeneration = () => {
    const result = generateInvoicesForAllTenants('manual');

    toast.success(
      `請求書を一括生成しました（成功: ${result.successCount}件、失敗: ${result.failureCount}件）`
    );
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold">請求書自動生成管理</h2>
        <p className="text-sm text-muted-foreground mt-1">
          月次自動生成設定と実行履歴の管理
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              総実行回数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" suppressHydrationWarning>{stats.totalExecutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              総請求書数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" suppressHydrationWarning>{stats.totalInvoicesGenerated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              総収益
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" suppressHydrationWarning>
              ¥{stats.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              最終実行日時
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium" suppressHydrationWarning>
              {stats.lastExecutionDate
                ? new Date(stats.lastExecutionDate).toLocaleString('ja-JP')
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 自動生成設定 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              自動生成設定
            </CardTitle>
            <CardDescription className="mt-1">月次請求書の自動生成を設定します</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleManualGeneration}>
              <Play className="h-4 w-4 mr-2" />
              手動実行
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
          {/* 自動生成有効/無効 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">月次自動生成</Label>
              <p className="text-sm text-muted-foreground">
                毎月指定日に自動で請求書を生成します
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
                    checked ? '自動生成を有効にしました' : '自動生成を無効にしました'
                  );
                }
              }}
            />
          </div>

          {/* 実行日 */}
          <div className="space-y-2">
            <Label htmlFor="dayOfMonth">実行日（毎月）</Label>
            <Input
              id="dayOfMonth"
              type="number"
              min={1}
              max={28}
              value={editingSettings ? tempSettings.dayOfMonth : settings.dayOfMonth}
              onChange={(e) => {
                if (editingSettings) {
                  setTempSettings({
                    ...tempSettings,
                    dayOfMonth: parseInt(e.target.value, 10),
                  });
                }
              }}
              disabled={!editingSettings}
            />
            <p className="text-xs text-muted-foreground">
              毎月指定日に自動実行されます（1-28日の範囲で指定）
            </p>
          </div>

          {/* ユーザーあたり料金 */}
          <div className="space-y-2">
            <Label htmlFor="basePricePerUser">ユーザーあたり基本料金（円）</Label>
            <Input
              id="basePricePerUser"
              type="number"
              min={0}
              step={1000}
              value={
                editingSettings ? tempSettings.basePricePerUser : settings.basePricePerUser
              }
              onChange={(e) => {
                if (editingSettings) {
                  setTempSettings({
                    ...tempSettings,
                    basePricePerUser: parseInt(e.target.value, 10),
                  });
                }
              }}
              disabled={!editingSettings}
            />
            <p className="text-xs text-muted-foreground">
              テナントのユーザー数に応じて請求額を計算します
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 生成履歴 */}
      <Card>
        <CardHeader>
          <CardTitle>実行履歴</CardTitle>
          <CardDescription>過去の請求書一括生成の実行結果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>実行日時</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>対象テナント</TableHead>
                  <TableHead>成功/失敗</TableHead>
                  <TableHead className="text-right">合計金額</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      実行履歴がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item, index) => (
                    <React.Fragment key={`history-${item.id}-${index}`}>
                      <TableRow key={`row-${item.id}`}>
                        <TableCell className="font-mono text-sm" suppressHydrationWarning>
                          {new Date(item.executedAt).toLocaleString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.executionType === 'auto' ? 'default' : 'outline'}>
                            {item.executionType === 'auto' ? '自動' : '手動'}
                          </Badge>
                        </TableCell>
                        <TableCell suppressHydrationWarning>{item.tenantCount}件</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2" suppressHydrationWarning>
                            <span className="text-green-600">{item.successCount}件</span>
                            {item.failureCount > 0 && (
                              <>
                                /
                                <span className="text-red-600">{item.failureCount}件</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold" suppressHydrationWarning>
                          ¥{item.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedHistoryId(
                                expandedHistoryId === item.id ? null : item.id
                              )
                            }
                          >
                            {expandedHistoryId === item.id ? '閉じる' : '詳細'}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* 詳細表示 */}
                      {expandedHistoryId === item.id && (
                        <TableRow key={`detail-${item.id}`}>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <div className="py-4">
                              <h4 className="font-semibold mb-3">生成詳細</h4>
                              <div className="space-y-2">
                                {item.details.map((detail, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                  >
                                    <div className="flex items-center gap-4">
                                      {detail.status === 'success' ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                      )}
                                      <div>
                                        <p className="font-medium">{detail.tenantName}</p>
                                        {detail.status === 'success' ? (
                                          <p className="text-xs text-muted-foreground">
                                            請求書番号: {detail.invoiceNumber} ({detail.userCount}
                                            ユーザー)
                                          </p>
                                        ) : (
                                          <p className="text-xs text-red-600">
                                            {detail.errorMessage}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    {detail.status === 'success' && (
                                      <div className="text-right">
                                        <p className="font-semibold" suppressHydrationWarning>
                                          ¥{detail.amount.toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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
