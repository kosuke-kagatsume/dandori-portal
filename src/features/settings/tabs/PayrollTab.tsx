'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { DollarSign, Calendar, Shield, Loader2 } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function PayrollTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  const {
    payrollSettings,
    updatePayrollSettings,
    fetchPayrollSettings,
    savePayrollSettings,
    isLoading
  } = useCompanySettingsStore();
  const [isSaving, setIsSaving] = useState(false);

  // 初回ロード時にAPIからデータ取得
  useEffect(() => {
    fetchPayrollSettings();
  }, [fetchPayrollSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePayrollSettings();
      saveSettings();
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 支給日・締め日設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>支給日・締め日設定</CardTitle>
          </div>
          <CardDescription>給与の締め日と支給日を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closingDay">締め日 *</Label>
              <Select
                value={payrollSettings.closingDay.toString()}
                onValueChange={(value) => updatePayrollSettings({ closingDay: parseInt(value) })}
              >
                <SelectTrigger id="closingDay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="31">末日</SelectItem>
                  <SelectItem value="15">15日</SelectItem>
                  <SelectItem value="20">20日</SelectItem>
                  <SelectItem value="25">25日</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 30].map(day => (
                    <SelectItem key={day} value={day.toString()}>{day}日</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                締め日（末日は31を選択）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDay">支給日 *</Label>
              <Select
                value={payrollSettings.paymentDay.toString()}
                onValueChange={(value) => updatePayrollSettings({ paymentDay: parseInt(value) })}
              >
                <SelectTrigger id="paymentDay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="31">末日</SelectItem>
                  <SelectItem value="10">10日</SelectItem>
                  <SelectItem value="15">15日</SelectItem>
                  <SelectItem value="20">20日</SelectItem>
                  <SelectItem value="25">25日</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 30].map(day => (
                    <SelectItem key={day} value={day.toString()}>{day}日</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                給与支給日（末日は31を選択）
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDayType">支給タイミング *</Label>
            <Select
              value={payrollSettings.paymentDayType}
              onValueChange={(value: 'current' | 'next') => updatePayrollSettings({ paymentDayType: value })}
            >
              <SelectTrigger id="paymentDayType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">当月払い（締め日の月に支給）</SelectItem>
                <SelectItem value="next">翌月払い（締め日の翌月に支給）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 給与体系設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <CardTitle>給与体系設定</CardTitle>
          </div>
          <CardDescription>給与の基本設定を行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultPayType">デフォルト給与形態 *</Label>
            <Select
              value={payrollSettings.defaultPayType}
              onValueChange={(value: 'monthly' | 'hourly' | 'daily') => updatePayrollSettings({ defaultPayType: value })}
            >
              <SelectTrigger id="defaultPayType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">月給制</SelectItem>
                <SelectItem value="daily">日給制</SelectItem>
                <SelectItem value="hourly">時給制</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standardWorkHours">所定労働時間 / 日 *</Label>
              <Input
                id="standardWorkHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={payrollSettings.standardWorkHours}
                onChange={(e) => updatePayrollSettings({ standardWorkHours: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                1日あたりの標準労働時間（時間）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="standardWorkDays">所定労働日数 / 月 *</Label>
              <Input
                id="standardWorkDays"
                type="number"
                min="0"
                max="31"
                value={payrollSettings.standardWorkDays}
                onChange={(e) => updatePayrollSettings({ standardWorkDays: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                1ヶ月あたりの標準労働日数（日）
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 控除設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>控除設定</CardTitle>
          </div>
          <CardDescription>社会保険料および税金の控除設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>健康保険</Label>
                <p className="text-sm text-muted-foreground">健康保険料を控除する</p>
              </div>
              <Switch
                checked={payrollSettings.enableHealthInsurance}
                onCheckedChange={(checked) => updatePayrollSettings({ enableHealthInsurance: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>厚生年金保険</Label>
                <p className="text-sm text-muted-foreground">厚生年金保険料を控除する</p>
              </div>
              <Switch
                checked={payrollSettings.enablePensionInsurance}
                onCheckedChange={(checked) => updatePayrollSettings({ enablePensionInsurance: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>雇用保険</Label>
                <p className="text-sm text-muted-foreground">雇用保険料を控除する</p>
              </div>
              <Switch
                checked={payrollSettings.enableEmploymentInsurance}
                onCheckedChange={(checked) => updatePayrollSettings({ enableEmploymentInsurance: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>所得税</Label>
                <p className="text-sm text-muted-foreground">源泉所得税を控除する</p>
              </div>
              <Switch
                checked={payrollSettings.enableIncomeTax}
                onCheckedChange={(checked) => updatePayrollSettings({ enableIncomeTax: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>住民税</Label>
                <p className="text-sm text-muted-foreground">住民税を控除する</p>
              </div>
              <Switch
                checked={payrollSettings.enableResidentTax}
                onCheckedChange={(checked) => updatePayrollSettings({ enableResidentTax: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={isSaving || isLoading}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            '給与設定を保存'
          )}
        </Button>
      </div>
    </div>
  );
}
