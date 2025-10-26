'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { FileText, Calendar, QrCode } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function YearEndTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  const { yearEndAdjustmentSettings, updateYearEndAdjustmentSettings } = useCompanySettingsStore();

  const handleSave = () => {
    saveSettings();
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

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          年末調整設定を保存
        </Button>
      </div>
    </div>
  );
}
