'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { Building2, User, FileText, Loader2 } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function CompanyTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  const {
    companyInfo,
    updateCompanyInfo,
    fetchCompanySettings,
    saveCompanySettings,
    isLoading
  } = useCompanySettingsStore();
  const [isSaving, setIsSaving] = useState(false);

  // 初回ロード時にAPIからデータ取得
  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCompanySettings();
      saveSettings(); // 親コンポーネントのコールバックも呼ぶ
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <CardTitle>基本情報</CardTitle>
          </div>
          <CardDescription>会社の基本的な情報を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">会社名 *</Label>
              <Input
                id="companyName"
                value={companyInfo.name}
                onChange={(e) => updateCompanyInfo({ name: e.target.value })}
                placeholder="株式会社〇〇"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyNameKana">会社名（カナ） *</Label>
              <Input
                id="companyNameKana"
                value={companyInfo.nameKana}
                onChange={(e) => updateCompanyInfo({ nameKana: e.target.value })}
                placeholder="カブシキガイシャ〇〇"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">郵便番号 *</Label>
              <Input
                id="postalCode"
                value={companyInfo.postalCode}
                onChange={(e) => updateCompanyInfo({ postalCode: e.target.value })}
                placeholder="123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">住所 *</Label>
              <Input
                id="address"
                value={companyInfo.address}
                onChange={(e) => updateCompanyInfo({ address: e.target.value })}
                placeholder="東京都〇〇区〇〇 1-2-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号 *</Label>
              <Input
                id="phone"
                value={companyInfo.phone}
                onChange={(e) => updateCompanyInfo({ phone: e.target.value })}
                placeholder="03-1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">FAX番号</Label>
              <Input
                id="fax"
                value={companyInfo.fax || ''}
                onChange={(e) => updateCompanyInfo({ fax: e.target.value })}
                placeholder="03-1234-5679"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={companyInfo.email || ''}
                onChange={(e) => updateCompanyInfo({ email: e.target.value })}
                placeholder="info@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 法人情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <CardTitle>法人情報</CardTitle>
          </div>
          <CardDescription>代表者および法人番号を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="representativeName">代表者名 *</Label>
              <Input
                id="representativeName"
                value={companyInfo.representativeName}
                onChange={(e) => updateCompanyInfo({ representativeName: e.target.value })}
                placeholder="山田 太郎"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representativeTitle">代表者役職 *</Label>
              <Input
                id="representativeTitle"
                value={companyInfo.representativeTitle}
                onChange={(e) => updateCompanyInfo({ representativeTitle: e.target.value })}
                placeholder="代表取締役"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="corporateNumber">法人番号（13桁）</Label>
            <Input
              id="corporateNumber"
              value={companyInfo.corporateNumber || ''}
              onChange={(e) => updateCompanyInfo({ corporateNumber: e.target.value })}
              placeholder="1234567890123"
              maxLength={13}
            />
            <p className="text-sm text-muted-foreground">
              国税庁から通知された13桁の法人番号を入力してください
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 税務情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>税務情報</CardTitle>
          </div>
          <CardDescription>税務署および決算期を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxOffice">所轄税務署 *</Label>
              <Input
                id="taxOffice"
                value={companyInfo.taxOffice}
                onChange={(e) => updateCompanyInfo({ taxOffice: e.target.value })}
                placeholder="麹町税務署"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxOfficeCode">税務署コード（4桁）</Label>
              <Input
                id="taxOfficeCode"
                value={companyInfo.taxOfficeCode || ''}
                onChange={(e) => updateCompanyInfo({ taxOfficeCode: e.target.value })}
                placeholder="0001"
                maxLength={4}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiscalYearEnd">決算月 *</Label>
              <Input
                id="fiscalYearEnd"
                value={companyInfo.fiscalYearEnd}
                onChange={(e) => updateCompanyInfo({ fiscalYearEnd: e.target.value })}
                placeholder="03"
                maxLength={2}
              />
              <p className="text-sm text-muted-foreground">
                決算月を2桁で入力（例: 3月決算 → 03）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foundedDate">設立日</Label>
              <Input
                id="foundedDate"
                type="date"
                value={companyInfo.foundedDate || ''}
                onChange={(e) => updateCompanyInfo({ foundedDate: e.target.value })}
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
            '会社情報を保存'
          )}
        </Button>
      </div>
    </div>
  );
}
