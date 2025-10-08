'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sun,
  Moon,
  Languages,
  Download,
  Upload,
  Bell,
  Globe,
  Calendar,
  RefreshCw,
  CheckCircle,
  Info,
  Building2,
  Wallet,
  FileText,
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// シンプルな設定の型定義
interface SimpleSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    browser: boolean;
    sound: boolean;
  };
}

// デフォルト設定
const defaultSettings: SimpleSettings = {
  theme: 'light',
  language: 'ja',
  timezone: 'Asia/Tokyo',
  dateFormat: 'YYYY-MM-DD',
  notifications: {
    browser: false,
    sound: false,
  },
};

export default function SimpleSettingsPage() {
  const { currentUser } = useUserStore();
  const {
    companyInfo,
    payrollSettings,
    yearEndAdjustmentSettings,
    updateCompanyInfo,
    updatePayrollSettings,
    updateYearEndAdjustmentSettings
  } = useCompanySettingsStore();
  const [settings, setSettings] = useState<SimpleSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // 設定の読み込み
  useEffect(() => {
    const stored = localStorage.getItem('dandori_simple_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
        // テーマを適用
        applyTheme(parsed.theme || 'light');
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // テーマ適用関数
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // 設定の更新
  const updateSettings = (updates: Partial<SimpleSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setHasChanges(true);

    // テーマの即座適用
    if (updates.theme) {
      applyTheme(updates.theme);
    }
  };

  // 設定の保存
  const saveSettings = () => {
    localStorage.setItem('dandori_simple_settings', JSON.stringify(settings));
    setHasChanges(false);
    toast.success('設定を保存しました');

    // 言語変更の場合は再読み込みを促す
    const stored = localStorage.getItem('dandori_simple_settings');
    if (stored) {
      const old = JSON.parse(stored);
      if (old.language !== settings.language) {
        toast.info('言語設定の変更はページ再読み込み後に反映されます', {
          action: {
            label: '再読み込み',
            onClick: () => window.location.reload(),
          },
        });
      }
    }
  };

  // 設定のエクスポート
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const fileName = `dandori-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
    
    toast.success('設定をダウンロードしました');
  };

  // 設定のインポート
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        const newSettings = { ...defaultSettings, ...imported };
        setSettings(newSettings);
        applyTheme(newSettings.theme);
        localStorage.setItem('dandori_simple_settings', JSON.stringify(newSettings));
        toast.success('設定をインポートしました');
      } catch (error) {
        toast.error('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    
    // インプットをリセット
    event.target.value = '';
  };

  // ブラウザ通知のテスト
  const testBrowserNotification = async () => {
    if (!('Notification' in window)) {
      toast.error('このブラウザは通知をサポートしていません');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('通知がブロックされています。ブラウザの設定を確認してください');
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('通知の許可が必要です');
        return;
      }
    }

    new Notification('Dandori Portal', {
      body: '通知テストです。正常に動作しています！',
      icon: '/icon-192x192.png',
    });
  };

  // 設定のリセット
  const resetSettings = () => {
    if (confirm('すべての設定をリセットしますか？')) {
      setSettings(defaultSettings);
      applyTheme('light');
      localStorage.removeItem('dandori_simple_settings');
      toast.success('設定をリセットしました');
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">設定</h1>
          <p className="text-muted-foreground">アプリケーションの設定を管理</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Alert className="w-auto">
              <AlertDescription>未保存の変更があります</AlertDescription>
            </Alert>
          )}
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <CheckCircle className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="appearance">外観</TabsTrigger>
          <TabsTrigger value="regional">地域と言語</TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-1" />
            会社情報
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <Wallet className="w-4 h-4 mr-1" />
            給与設定
          </TabsTrigger>
          <TabsTrigger value="year-end">
            <FileText className="w-4 h-4 mr-1" />
            年末調整
          </TabsTrigger>
          <TabsTrigger value="data">データ</TabsTrigger>
        </TabsList>

        {/* 外観設定 */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>テーマ</CardTitle>
              <CardDescription>
                アプリケーションの配色を選択します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={settings.theme === 'light' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => updateSettings({ theme: 'light' })}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  ライト
                </Button>
                <Button
                  variant={settings.theme === 'dark' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => updateSettings({ theme: 'dark' })}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  ダーク
                </Button>
                <Button
                  variant={settings.theme === 'system' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => updateSettings({ theme: 'system' })}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  システム
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>通知</CardTitle>
              <CardDescription>
                通知の表示方法を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ブラウザ通知</Label>
                  <p className="text-sm text-muted-foreground">
                    重要な更新をデスクトップに通知
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.browser}
                  onCheckedChange={(checked) => {
                    updateSettings({ 
                      notifications: { ...settings.notifications, browser: checked }
                    });
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>通知音</Label>
                  <p className="text-sm text-muted-foreground">
                    通知時に音を鳴らす
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.sound}
                  onCheckedChange={(checked) => {
                    updateSettings({ 
                      notifications: { ...settings.notifications, sound: checked }
                    });
                  }}
                />
              </div>

              {settings.notifications.browser && (
                <Button variant="outline" size="sm" onClick={testBrowserNotification}>
                  <Bell className="w-4 h-4 mr-2" />
                  通知をテスト
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 地域と言語 */}
        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>言語とタイムゾーン</CardTitle>
              <CardDescription>
                表示言語と地域の設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>言語</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSettings({ language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>タイムゾーン</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => updateSettings({ timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Tokyo">東京 (JST)</SelectItem>
                      <SelectItem value="Asia/Seoul">ソウル (KST)</SelectItem>
                      <SelectItem value="Asia/Shanghai">上海 (CST)</SelectItem>
                      <SelectItem value="America/New_York">ニューヨーク (EST)</SelectItem>
                      <SelectItem value="Europe/London">ロンドン (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>日付形式</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) => updateSettings({ dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                      <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                      <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                      <SelectItem value="YYYY年MM月DD日">2024年01月15日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 会社情報設定 */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>会社の基本情報を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>会社名 *</Label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) => updateCompanyInfo({ name: e.target.value })}
                    placeholder="サンプル株式会社"
                  />
                </div>
                <div className="space-y-2">
                  <Label>会社名（カナ） *</Label>
                  <Input
                    value={companyInfo.nameKana}
                    onChange={(e) => updateCompanyInfo({ nameKana: e.target.value })}
                    placeholder="サンプルカブシキガイシャ"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>郵便番号 *</Label>
                  <Input
                    value={companyInfo.postalCode}
                    onChange={(e) => updateCompanyInfo({ postalCode: e.target.value })}
                    placeholder="100-0001"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>住所 *</Label>
                  <Input
                    value={companyInfo.address}
                    onChange={(e) => updateCompanyInfo({ address: e.target.value })}
                    placeholder="東京都千代田区千代田1-1-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>電話番号 *</Label>
                  <Input
                    value={companyInfo.phone}
                    onChange={(e) => updateCompanyInfo({ phone: e.target.value })}
                    placeholder="03-1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>FAX</Label>
                  <Input
                    value={companyInfo.fax || ''}
                    onChange={(e) => updateCompanyInfo({ fax: e.target.value })}
                    placeholder="03-1234-5679"
                  />
                </div>
                <div className="space-y-2">
                  <Label>メールアドレス</Label>
                  <Input
                    type="email"
                    value={companyInfo.email || ''}
                    onChange={(e) => updateCompanyInfo({ email: e.target.value })}
                    placeholder="info@sample.co.jp"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>法人情報</CardTitle>
              <CardDescription>税務・法務関連の情報を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>代表者名 *</Label>
                  <Input
                    value={companyInfo.representativeName}
                    onChange={(e) => updateCompanyInfo({ representativeName: e.target.value })}
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="space-y-2">
                  <Label>代表者役職 *</Label>
                  <Input
                    value={companyInfo.representativeTitle}
                    onChange={(e) => updateCompanyInfo({ representativeTitle: e.target.value })}
                    placeholder="代表取締役"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>法人番号</Label>
                  <Input
                    value={companyInfo.corporateNumber || ''}
                    onChange={(e) => updateCompanyInfo({ corporateNumber: e.target.value })}
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                </div>
                <div className="space-y-2">
                  <Label>設立日</Label>
                  <Input
                    type="date"
                    value={companyInfo.foundedDate || ''}
                    onChange={(e) => updateCompanyInfo({ foundedDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>所轄税務署 *</Label>
                  <Input
                    value={companyInfo.taxOffice}
                    onChange={(e) => updateCompanyInfo({ taxOffice: e.target.value })}
                    placeholder="麹町税務署"
                  />
                </div>
                <div className="space-y-2">
                  <Label>決算月 *</Label>
                  <Select
                    value={companyInfo.fiscalYearEnd}
                    onValueChange={(value) => updateCompanyInfo({ fiscalYearEnd: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">1月</SelectItem>
                      <SelectItem value="02">2月</SelectItem>
                      <SelectItem value="03">3月</SelectItem>
                      <SelectItem value="04">4月</SelectItem>
                      <SelectItem value="05">5月</SelectItem>
                      <SelectItem value="06">6月</SelectItem>
                      <SelectItem value="07">7月</SelectItem>
                      <SelectItem value="08">8月</SelectItem>
                      <SelectItem value="09">9月</SelectItem>
                      <SelectItem value="10">10月</SelectItem>
                      <SelectItem value="11">11月</SelectItem>
                      <SelectItem value="12">12月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 給与設定 */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与支給設定</CardTitle>
              <CardDescription>給与の支給日・締め日を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>締め日 *</Label>
                  <Select
                    value={String(payrollSettings.closingDay)}
                    onValueChange={(value) => updatePayrollSettings({ closingDay: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="31">月末締め</SelectItem>
                      <SelectItem value="15">15日締め</SelectItem>
                      <SelectItem value="20">20日締め</SelectItem>
                      <SelectItem value="25">25日締め</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>支給日 *</Label>
                  <Select
                    value={String(payrollSettings.paymentDay)}
                    onValueChange={(value) => updatePayrollSettings({ paymentDay: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10日</SelectItem>
                      <SelectItem value="15">15日</SelectItem>
                      <SelectItem value="20">20日</SelectItem>
                      <SelectItem value="25">25日</SelectItem>
                      <SelectItem value="31">月末</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>支給タイミング *</Label>
                  <Select
                    value={payrollSettings.paymentDayType}
                    onValueChange={(value: 'current' | 'next') => updatePayrollSettings({ paymentDayType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">当月払い</SelectItem>
                      <SelectItem value="next">翌月払い</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>所定労働時間/日 *</Label>
                  <Input
                    type="number"
                    value={payrollSettings.standardWorkHours}
                    onChange={(e) => updatePayrollSettings({ standardWorkHours: Number(e.target.value) })}
                    min="1"
                    max="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label>所定労働日数/月 *</Label>
                  <Input
                    type="number"
                    value={payrollSettings.standardWorkDays}
                    onChange={(e) => updatePayrollSettings({ standardWorkDays: Number(e.target.value) })}
                    min="1"
                    max="31"
                  />
                </div>
                <div className="space-y-2">
                  <Label>給与体系 *</Label>
                  <Select
                    value={payrollSettings.defaultPayType}
                    onValueChange={(value: 'monthly' | 'hourly' | 'daily') => updatePayrollSettings({ defaultPayType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">月給制</SelectItem>
                      <SelectItem value="daily">日給制</SelectItem>
                      <SelectItem value="hourly">時給制</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>控除項目設定</CardTitle>
              <CardDescription>給与から控除する項目を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
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
                <div>
                  <Label>厚生年金</Label>
                  <p className="text-sm text-muted-foreground">厚生年金保険料を控除する</p>
                </div>
                <Switch
                  checked={payrollSettings.enablePensionInsurance}
                  onCheckedChange={(checked) => updatePayrollSettings({ enablePensionInsurance: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
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
                <div>
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
                <div>
                  <Label>住民税</Label>
                  <p className="text-sm text-muted-foreground">特別徴収住民税を控除する</p>
                </div>
                <Switch
                  checked={payrollSettings.enableResidentTax}
                  onCheckedChange={(checked) => updatePayrollSettings({ enableResidentTax: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 年末調整設定 */}
        <TabsContent value="year-end" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>年末調整期間</CardTitle>
              <CardDescription>年末調整の実施期間を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>開始月 *</Label>
                  <Select
                    value={String(yearEndAdjustmentSettings.adjustmentStartMonth)}
                    onValueChange={(value) => updateYearEndAdjustmentSettings({ adjustmentStartMonth: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10月</SelectItem>
                      <SelectItem value="11">11月</SelectItem>
                      <SelectItem value="12">12月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>終了月 *</Label>
                  <Select
                    value={String(yearEndAdjustmentSettings.adjustmentEndMonth)}
                    onValueChange={(value) => updateYearEndAdjustmentSettings({ adjustmentEndMonth: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12月</SelectItem>
                      <SelectItem value="1">1月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>控除項目</CardTitle>
              <CardDescription>年末調整で適用する控除項目を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>基礎控除</Label>
                  <p className="text-sm text-muted-foreground">全員に適用される基礎控除（48万円）</p>
                </div>
                <Switch
                  checked={yearEndAdjustmentSettings.enableBasicDeduction}
                  onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableBasicDeduction: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>配偶者控除</Label>
                  <p className="text-sm text-muted-foreground">配偶者がいる場合の控除</p>
                </div>
                <Switch
                  checked={yearEndAdjustmentSettings.enableSpouseDeduction}
                  onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableSpouseDeduction: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>扶養控除</Label>
                  <p className="text-sm text-muted-foreground">扶養家族がいる場合の控除</p>
                </div>
                <Switch
                  checked={yearEndAdjustmentSettings.enableDependentDeduction}
                  onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableDependentDeduction: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>生命保険料控除</Label>
                  <p className="text-sm text-muted-foreground">生命保険・介護医療保険・個人年金保険</p>
                </div>
                <Switch
                  checked={yearEndAdjustmentSettings.enableInsuranceDeduction}
                  onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableInsuranceDeduction: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>社会保険料控除</Label>
                  <p className="text-sm text-muted-foreground">国民年金・国民健康保険等</p>
                </div>
                <Switch
                  checked={yearEndAdjustmentSettings.enableSocialInsuranceDeduction}
                  onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ enableSocialInsuranceDeduction: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>源泉徴収票設定</CardTitle>
              <CardDescription>源泉徴収票の書式を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>書式</Label>
                <Select
                  value={yearEndAdjustmentSettings.withholdingSlipFormat}
                  onValueChange={(value: 'standard' | 'detailed') => updateYearEndAdjustmentSettings({ withholdingSlipFormat: value })}
                >
                  <SelectTrigger>
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
                <div>
                  <Label>QRコード</Label>
                  <p className="text-sm text-muted-foreground">マイナンバー連携用QRコードを付与</p>
                </div>
                <Switch
                  checked={yearEndAdjustmentSettings.includeQRCode}
                  onCheckedChange={(checked) => updateYearEndAdjustmentSettings({ includeQRCode: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* データ管理 */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>データ管理</CardTitle>
              <CardDescription>
                設定のバックアップとリストア
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <Button onClick={exportSettings} variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    設定をエクスポート
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    現在の設定をJSONファイルとしてダウンロード
                  </p>
                </div>

                <div>
                  <Label htmlFor="import-settings" className="cursor-pointer">
                    <div className="flex items-center justify-start w-full px-3 py-2 border rounded-md hover:bg-accent hover:text-accent-foreground">
                      <Upload className="w-4 h-4 mr-2" />
                      設定をインポート
                    </div>
                  </Label>
                  <input
                    id="import-settings"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importSettings}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    保存した設定ファイルから復元
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={resetSettings} variant="destructive" className="w-full justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    設定をリセット
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    すべての設定を初期値に戻す
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              エクスポートした設定ファイルは他の端末でも使用できます。
              定期的にバックアップを取ることをお勧めします。
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}