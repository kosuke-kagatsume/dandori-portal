'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { useUserStore } from '@/lib/store/user-store';
import { useRetiredYearEndStore } from '@/lib/store/retired-yearend-store';
import { FileText, Calendar, QrCode, Send, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function YearEndTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  const { yearEndAdjustmentSettings, updateYearEndAdjustmentSettings } = useCompanySettingsStore();
  const { getRetiredUsers } = useUserStore();
  const {
    sendWithholdingSlipsToRetired,
    getRecentSendHistories,
    isAlreadySent,
    getStats,
  } = useRetiredYearEndStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isSending, setIsSending] = useState(false);

  // 退職者リスト取得
  const retiredUsers = getRetiredUsers();

  // 送信履歴
  const sendHistories = getRecentSendHistories(10);

  // 統計
  const stats = getStats(selectedYear);

  const handleSave = () => {
    saveSettings();
  };

  // 一括送信ハンドラー
  const handleBulkSend = async () => {
    if (retiredUsers.length === 0) {
      return;
    }

    setIsSending(true);
    try {
      await sendWithholdingSlipsToRetired(retiredUsers, selectedYear);
    } catch (error) {
      console.error('Failed to send withholding slips:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 年末調整期間設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>年末調整期間設定</CardTitle>
          </div>
          <CardDescription>年末調整の実施期間を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentStartMonth">開始月 *</Label>
              <Select
                value={yearEndAdjustmentSettings.adjustmentStartMonth.toString()}
                onValueChange={(value) => updateYearEndAdjustmentSettings({ adjustmentStartMonth: parseInt(value) })}
              >
                <SelectTrigger id="adjustmentStartMonth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                年末調整の開始月（通常11月）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentEndMonth">終了月 *</Label>
              <Select
                value={yearEndAdjustmentSettings.adjustmentEndMonth.toString()}
                onValueChange={(value) => updateYearEndAdjustmentSettings({ adjustmentEndMonth: parseInt(value) })}
              >
                <SelectTrigger id="adjustmentEndMonth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                年末調整の終了月（通常12月）
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 控除項目設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>控除項目設定</CardTitle>
          </div>
          <CardDescription>年末調整で使用する控除項目を選択します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>基礎控除</Label>
                <p className="text-sm text-muted-foreground">基礎控除を適用する（48万円）</p>
              </div>
              <Switch
                checked={yearEndAdjustmentSettings.enableBasicDeduction}
                onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableBasicDeduction: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>配偶者控除</Label>
                <p className="text-sm text-muted-foreground">配偶者控除・配偶者特別控除を適用する</p>
              </div>
              <Switch
                checked={yearEndAdjustmentSettings.enableSpouseDeduction}
                onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableSpouseDeduction: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>扶養控除</Label>
                <p className="text-sm text-muted-foreground">扶養控除を適用する</p>
              </div>
              <Switch
                checked={yearEndAdjustmentSettings.enableDependentDeduction}
                onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableDependentDeduction: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>生命保険料控除</Label>
                <p className="text-sm text-muted-foreground">生命保険料控除を適用する</p>
              </div>
              <Switch
                checked={yearEndAdjustmentSettings.enableInsuranceDeduction}
                onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableInsuranceDeduction: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>社会保険料控除</Label>
                <p className="text-sm text-muted-foreground">社会保険料控除を適用する</p>
              </div>
              <Switch
                checked={yearEndAdjustmentSettings.enableSocialInsuranceDeduction}
                onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableSocialInsuranceDeduction: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 源泉徴収票設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            <CardTitle>源泉徴収票設定</CardTitle>
          </div>
          <CardDescription>源泉徴収票の出力設定を行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withholdingSlipFormat">書式 *</Label>
            <Select
              value={yearEndAdjustmentSettings.withholdingSlipFormat}
              onValueChange={(value: 'standard' | 'detailed') => updateYearEndAdjustmentSettings({ withholdingSlipFormat: value })}
            >
              <SelectTrigger id="withholdingSlipFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">標準書式</SelectItem>
                <SelectItem value="detailed">詳細書式</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>QRコード付与</Label>
              <p className="text-sm text-muted-foreground">
                源泉徴収票にQRコードを付与する（e-Tax対応）
              </p>
            </div>
            <Switch
              checked={yearEndAdjustmentSettings.includeQRCode}
              onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ includeQRCode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 退職者への源泉徴収票送信 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <CardTitle>退職者への源泉徴収票送信</CardTitle>
          </div>
          <CardDescription>
            退職者に対して年末調整の源泉徴収票をメールで自動送信します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 統計カード */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">退職者数</p>
                  <p className="text-2xl font-bold">{retiredUsers.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">送信成功</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">送信失敗</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* 年度選択と一括送信 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Label htmlFor="sendYear" className="whitespace-nowrap">対象年度</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger id="sendYear" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleBulkSend}
              disabled={isSending || retiredUsers.length === 0}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isSending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  退職者全員に送信
                </>
              )}
            </Button>
          </div>

          {retiredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              送信対象の退職者がいません
            </div>
          )}

          {/* 退職者リスト */}
          {retiredUsers.length > 0 && (
            <>
              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-4">退職者リスト（{retiredUsers.length}名）</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>氏名</TableHead>
                      <TableHead>メールアドレス</TableHead>
                      <TableHead>退職日</TableHead>
                      <TableHead>送信状況</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retiredUsers.map((user) => {
                      const sent = isAlreadySent(user.id, selectedYear);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.retiredDate
                              ? new Date(user.retiredDate).toLocaleDateString('ja-JP')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {sent ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                送信済み
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                未送信
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* 送信履歴 */}
          {sendHistories.length > 0 && (
            <>
              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-4">送信履歴（直近10件）</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>送信日時</TableHead>
                      <TableHead>氏名</TableHead>
                      <TableHead>年度</TableHead>
                      <TableHead>結果</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sendHistories.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          {new Date(history.sentAt).toLocaleString('ja-JP')}
                        </TableCell>
                        <TableCell className="font-medium">{history.userName}</TableCell>
                        <TableCell>{history.year}年</TableCell>
                        <TableCell>
                          {history.status === 'success' ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              成功
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              失敗
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          年末調整設定を保存
        </Button>
      </div>
    </div>
  );
}
