'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { DollarSign, Calendar, Loader2 } from 'lucide-react';
import type { SettingsTabProps } from '../types';
import { AllowanceItemsPanel } from './payroll/AllowanceItemsPanel';
import { DeductionItemsPanel } from './payroll/DeductionItemsPanel';
import { ResidentTaxPanel } from './payroll/ResidentTaxPanel';
import { ClosingDayGroupPanel } from './payroll/ClosingDayGroupPanel';
import { PayCategoryPanel } from './payroll/PayCategoryPanel';
import { OfficePanel } from './payroll/OfficePanel';
import { SocialInsurancePanel } from './payroll/SocialInsurancePanel';
import { LaborInsurancePanel } from './payroll/LaborInsurancePanel';

// 支払スケジュールサブタブ
function PayScheduleSubTab({ saveSettings }: { saveSettings: () => void }) {
  const {
    payrollSettings,
    updatePayrollSettings,
    fetchPayrollSettings,
    savePayrollSettings,
    isLoading
  } = useCompanySettingsStore();
  const [isSaving, setIsSaving] = useState(false);

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
              <p className="text-sm text-muted-foreground">締め日（末日は31を選択）</p>
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
              <p className="text-sm text-muted-foreground">給与支給日（末日は31を選択）</p>
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
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={isSaving || isLoading}>
          {isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>) : '設定を保存'}
        </Button>
      </div>
    </div>
  );
}

// 給与形態サブタブ（月給/時給/日給/賞与マスタ）
function PayStructureSubTab({ saveSettings }: { saveSettings: () => void }) {
  const {
    payrollSettings,
    updatePayrollSettings,
    fetchPayrollSettings,
    savePayrollSettings,
    isLoading
  } = useCompanySettingsStore();
  const [isSaving, setIsSaving] = useState(false);

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

  const payTypes = [
    { key: 'monthly', label: '月給', description: '月額固定の給与形態', icon: '💰' },
    { key: 'hourly', label: '時給', description: '時間単位の給与形態', icon: '⏰' },
    { key: 'daily', label: '日給', description: '日額固定の給与形態', icon: '📅' },
    { key: 'bonus', label: '賞与', description: '賞与（ボーナス）の設定', icon: '🎁' },
  ];

  return (
    <div className="space-y-6">
      {/* デフォルト給与形態 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <CardTitle>給与形態設定</CardTitle>
          </div>
          <CardDescription>デフォルトの給与形態と基本設定を行います</CardDescription>
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
              <p className="text-sm text-muted-foreground">1日あたりの標準労働時間（時間）</p>
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
              <p className="text-sm text-muted-foreground">1ヶ月あたりの標準労働日数（日）</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 給与形態マスタ */}
      <Card>
        <CardHeader>
          <CardTitle>給与形態マスタ</CardTitle>
          <CardDescription>月給・時給・日給・賞与の各形態を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payTypes.map(pt => (
              <div key={pt.key} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pt.icon}</span>
                  <h4 className="font-medium">{pt.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{pt.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={isSaving || isLoading}>
          {isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>) : '設定を保存'}
        </Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PayrollTab({ settings: _settings, updateSettings: _updateSettings, saveSettings: _saveSettings }: SettingsTabProps) {
  return (
    <Tabs defaultValue="schedule" className="space-y-4">
      <TabsList className="flex w-full overflow-x-auto">
        <TabsTrigger value="schedule">支払スケジュール</TabsTrigger>
        <TabsTrigger value="pay-structure">給与形態</TabsTrigger>
        <TabsTrigger value="allowance-items">支給項目</TabsTrigger>
        <TabsTrigger value="deduction-items">控除項目</TabsTrigger>
        <TabsTrigger value="resident-tax">住民税</TabsTrigger>
        <TabsTrigger value="closing-day-groups">締め日グループ</TabsTrigger>
        <TabsTrigger value="pay-categories">給与カテゴリ</TabsTrigger>
        <TabsTrigger value="office">事業所</TabsTrigger>
        <TabsTrigger value="social-insurance">社会保険</TabsTrigger>
        <TabsTrigger value="labor-insurance">労働保険</TabsTrigger>
      </TabsList>

      <TabsContent value="schedule">
        <PayScheduleSubTab saveSettings={_saveSettings} />
      </TabsContent>

      <TabsContent value="pay-structure">
        <PayStructureSubTab saveSettings={_saveSettings} />
      </TabsContent>

      <TabsContent value="allowance-items">
        <AllowanceItemsPanel />
      </TabsContent>

      <TabsContent value="deduction-items">
        <DeductionItemsPanel />
      </TabsContent>

      <TabsContent value="resident-tax">
        <ResidentTaxPanel />
      </TabsContent>

      <TabsContent value="closing-day-groups">
        <ClosingDayGroupPanel />
      </TabsContent>

      <TabsContent value="pay-categories">
        <PayCategoryPanel />
      </TabsContent>

      <TabsContent value="office">
        <OfficePanel />
      </TabsContent>

      <TabsContent value="social-insurance">
        <SocialInsurancePanel />
      </TabsContent>

      <TabsContent value="labor-insurance">
        <LaborInsurancePanel />
      </TabsContent>
    </Tabs>
  );
}
