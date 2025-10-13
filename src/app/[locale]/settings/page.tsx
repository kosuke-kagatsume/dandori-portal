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
  Cloud,
  DollarSign,
  AlertTriangle,
  Clock,
  Package,
  GitBranch,
  UserCheck,
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
    email: boolean;
    emailAddress: string;
    emailTiming: 'instant' | 'daily' | 'weekly';
  };
  saas: {
    monthlyBudget: number;
    budgetAlertThreshold: number;
    unusedLicenseDays: number;
    enableUnusedLicenseAlert: boolean;
  };
  attendance: {
    workStartTime: string;
    workEndTime: string;
    weekendDays: number[];
    enableNationalHolidays: boolean;
    defaultBreakMinutes: number;
    overtimeCalculationMethod: 'daily' | 'monthly';
    lateNightStartHour: number;
    lateNightEndHour: number;
    requireGpsForClockIn: boolean;
    allowedClockInRadius: number;
    annualLeaveGrantDays: number;
    enableLeaveCarryover: boolean;
    maxCarryoverDays: number;
  };
  assets: {
    assetNumberPrefix: string;
    depreciationMethod: 'straight-line' | 'declining-balance';
    requireApprovalForPurchase: boolean;
    approvalAmountThreshold: number;
    inventoryCheckFrequency: 'monthly' | 'quarterly' | 'yearly';
    enableAutoAssignment: boolean;
    lowStockAlertThreshold: number;
    enableReturnReminder: boolean;
    returnReminderDays: number;
  };
  workflow: {
    defaultApprovalDeadlineDays: number;
    enableAutoEscalation: boolean;
    escalationReminderDays: number;
    autoApprovalThreshold: number;
    enableAutoApproval: boolean;
    requireCommentOnReject: boolean;
    allowParallelApproval: boolean;
    enableProxyApproval: boolean;
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
    email: false,
    emailAddress: '',
    emailTiming: 'daily',
  },
  saas: {
    monthlyBudget: 500000,
    budgetAlertThreshold: 80,
    unusedLicenseDays: 30,
    enableUnusedLicenseAlert: true,
  },
  attendance: {
    workStartTime: '09:00',
    workEndTime: '18:00',
    weekendDays: [0, 6], // 0=日曜, 6=土曜
    enableNationalHolidays: true,
    defaultBreakMinutes: 60,
    overtimeCalculationMethod: 'daily',
    lateNightStartHour: 22,
    lateNightEndHour: 5,
    requireGpsForClockIn: false,
    allowedClockInRadius: 500,
    annualLeaveGrantDays: 10,
    enableLeaveCarryover: true,
    maxCarryoverDays: 20,
  },
  assets: {
    assetNumberPrefix: 'AST',
    depreciationMethod: 'straight-line',
    requireApprovalForPurchase: true,
    approvalAmountThreshold: 100000,
    inventoryCheckFrequency: 'yearly',
    enableAutoAssignment: false,
    lowStockAlertThreshold: 3,
    enableReturnReminder: true,
    returnReminderDays: 7,
  },
  workflow: {
    defaultApprovalDeadlineDays: 3,
    enableAutoEscalation: true,
    escalationReminderDays: 1,
    autoApprovalThreshold: 5000,
    enableAutoApproval: false,
    requireCommentOnReject: true,
    allowParallelApproval: false,
    enableProxyApproval: true,
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

      <Tabs defaultValue="appearance" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-10">
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
          <TabsTrigger value="attendance">
            <Clock className="w-4 h-4 mr-1" />
            勤怠・休暇
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <GitBranch className="w-4 h-4 mr-1" />
            ワークフロー
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Package className="w-4 h-4 mr-1" />
            資産管理
          </TabsTrigger>
          <TabsTrigger value="saas">
            <Cloud className="w-4 h-4 mr-1" />
            SaaS管理
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

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>メール通知</Label>
                  <p className="text-sm text-muted-foreground">
                    重要な更新をメールで通知
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      notifications: { ...settings.notifications, email: checked }
                    });
                  }}
                />
              </div>

              {settings.notifications.email && (
                <>
                  <div className="space-y-2">
                    <Label>通知先メールアドレス</Label>
                    <Input
                      type="email"
                      value={settings.notifications.emailAddress}
                      onChange={(e) => {
                        updateSettings({
                          notifications: { ...settings.notifications, emailAddress: e.target.value }
                        });
                      }}
                      placeholder="your.email@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      通知を受け取るメールアドレスを入力してください
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>通知タイミング</Label>
                    <Select
                      value={settings.notifications.emailTiming}
                      onValueChange={(value: 'instant' | 'daily' | 'weekly') => {
                        updateSettings({
                          notifications: { ...settings.notifications, emailTiming: value }
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">即時</SelectItem>
                        <SelectItem value="daily">1日1回（まとめて）</SelectItem>
                        <SelectItem value="weekly">1週間1回（まとめて）</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {settings.notifications.emailTiming === 'instant' && '通知が発生した瞬間にメールを送信'}
                      {settings.notifications.emailTiming === 'daily' && '1日分の通知を午前9時にまとめて送信'}
                      {settings.notifications.emailTiming === 'weekly' && '1週間分の通知を毎週月曜日にまとめて送信'}
                    </p>
                  </div>
                </>
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

        {/* 勤怠・休暇設定 */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>営業時間設定</CardTitle>
              <CardDescription>標準的な勤務時間帯を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>勤務開始時刻</Label>
                  <Input
                    type="time"
                    value={settings.attendance.workStartTime}
                    onChange={(e) => updateSettings({
                      attendance: { ...settings.attendance, workStartTime: e.target.value }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    標準的な勤務開始時刻（例：09:00）
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>勤務終了時刻</Label>
                  <Input
                    type="time"
                    value={settings.attendance.workEndTime}
                    onChange={(e) => updateSettings({
                      attendance: { ...settings.attendance, workEndTime: e.target.value }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    標準的な勤務終了時刻（例：18:00）
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>休日設定</CardTitle>
              <CardDescription>週休日と祝日の扱いを設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>週休日</Label>
                <div className="grid grid-cols-7 gap-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                    <Button
                      key={index}
                      variant={settings.attendance.weekendDays.includes(index) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newWeekendDays = settings.attendance.weekendDays.includes(index)
                          ? settings.attendance.weekendDays.filter(d => d !== index)
                          : [...settings.attendance.weekendDays, index];
                        updateSettings({
                          attendance: { ...settings.attendance, weekendDays: newWeekendDays }
                        });
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  選択した曜日が週休日として扱われます
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>日本の祝日を自動適用</Label>
                  <p className="text-sm text-muted-foreground">
                    日本の国民の祝日を自動的に休日として扱います
                  </p>
                </div>
                <Switch
                  checked={settings.attendance.enableNationalHolidays}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      attendance: { ...settings.attendance, enableNationalHolidays: checked }
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>勤怠管理設定</CardTitle>
              <CardDescription>勤怠打刻と労働時間の管理設定を行います</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>デフォルト休憩時間</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.attendance.defaultBreakMinutes}
                      onChange={(e) => updateSettings({
                        attendance: { ...settings.attendance, defaultBreakMinutes: Number(e.target.value) }
                      })}
                      min="0"
                      max="240"
                    />
                    <span className="text-sm text-muted-foreground">分</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    標準的な休憩時間を設定します（例：60分）
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>残業計算方法</Label>
                  <Select
                    value={settings.attendance.overtimeCalculationMethod}
                    onValueChange={(value: 'daily' | 'monthly') => updateSettings({
                      attendance: { ...settings.attendance, overtimeCalculationMethod: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">日次計算</SelectItem>
                      <SelectItem value="monthly">月次計算</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {settings.attendance.overtimeCalculationMethod === 'daily'
                      ? '毎日8時間超を残業として計算'
                      : '月間総労働時間から残業を計算'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">深夜労働時間帯</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>深夜労働開始時刻</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.attendance.lateNightStartHour}
                        onChange={(e) => updateSettings({
                          attendance: { ...settings.attendance, lateNightStartHour: Number(e.target.value) }
                        })}
                        min="0"
                        max="23"
                      />
                      <span className="text-sm text-muted-foreground">時</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>深夜労働終了時刻</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.attendance.lateNightEndHour}
                        onChange={(e) => updateSettings({
                          attendance: { ...settings.attendance, lateNightEndHour: Number(e.target.value) }
                        })}
                        min="0"
                        max="23"
                      />
                      <span className="text-sm text-muted-foreground">時</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  労働基準法：22時〜翌5時は深夜労働として割増賃金25%加算
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>打刻設定</CardTitle>
              <CardDescription>勤怠打刻時の位置情報管理を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>GPS位置情報の必須化</Label>
                  <p className="text-sm text-muted-foreground">
                    打刻時にGPS位置情報の取得を必須にします
                  </p>
                </div>
                <Switch
                  checked={settings.attendance.requireGpsForClockIn}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      attendance: { ...settings.attendance, requireGpsForClockIn: checked }
                    });
                  }}
                />
              </div>

              {settings.attendance.requireGpsForClockIn && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>打刻可能範囲</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.attendance.allowedClockInRadius}
                        onChange={(e) => updateSettings({
                          attendance: { ...settings.attendance, allowedClockInRadius: Number(e.target.value) }
                        })}
                        min="50"
                        max="5000"
                        step="50"
                      />
                      <span className="text-sm text-muted-foreground">メートル</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      会社所在地から{settings.attendance.allowedClockInRadius}m以内で打刻可能
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>年次有給休暇設定</CardTitle>
              <CardDescription>有給休暇の付与と繰越ルールを設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>年次有給休暇付与日数</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.attendance.annualLeaveGrantDays}
                      onChange={(e) => updateSettings({
                        attendance: { ...settings.attendance, annualLeaveGrantDays: Number(e.target.value) }
                      })}
                      min="0"
                      max="20"
                    />
                    <span className="text-sm text-muted-foreground">日</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    入社半年後に付与される有給休暇日数（法定最低：10日）
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>最大繰越日数</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.attendance.maxCarryoverDays}
                      onChange={(e) => updateSettings({
                        attendance: { ...settings.attendance, maxCarryoverDays: Number(e.target.value) }
                      })}
                      min="0"
                      max="40"
                      disabled={!settings.attendance.enableLeaveCarryover}
                    />
                    <span className="text-sm text-muted-foreground">日</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    翌年度に繰り越せる有給休暇の最大日数
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>有給休暇繰越を許可</Label>
                  <p className="text-sm text-muted-foreground">
                    未消化の有給休暇を翌年度に繰り越すことを許可します
                  </p>
                </div>
                <Switch
                  checked={settings.attendance.enableLeaveCarryover}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      attendance: { ...settings.attendance, enableLeaveCarryover: checked }
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              これらの設定は、勤怠管理・休暇管理画面の動作に反映されます。
              労働基準法に準拠した設定を行ってください。
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* 資産管理設定 */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>資産番号設定</CardTitle>
              <CardDescription>資産の識別番号フォーマットを設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>資産番号プレフィックス</Label>
                <Input
                  value={settings.assets.assetNumberPrefix}
                  onChange={(e) => updateSettings({
                    assets: { ...settings.assets, assetNumberPrefix: e.target.value }
                  })}
                  placeholder="AST"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  例: 「AST」→ AST-0001, AST-0002... のように自動採番されます
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>減価償却設定</CardTitle>
              <CardDescription>固定資産の減価償却方法を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>減価償却方法</Label>
                <Select
                  value={settings.assets.depreciationMethod}
                  onValueChange={(value: 'straight-line' | 'declining-balance') => updateSettings({
                    assets: { ...settings.assets, depreciationMethod: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="straight-line">定額法</SelectItem>
                    <SelectItem value="declining-balance">定率法</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {settings.assets.depreciationMethod === 'straight-line'
                    ? '毎年一定額を償却する方法（建物、構築物など）'
                    : '毎年一定率で償却する方法（機械装置、車両など）'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>購入承認設定</CardTitle>
              <CardDescription>資産購入時の承認フローを設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>購入承認の必須化</Label>
                  <p className="text-sm text-muted-foreground">
                    資産購入時に承認フローを必須にします
                  </p>
                </div>
                <Switch
                  checked={settings.assets.requireApprovalForPurchase}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      assets: { ...settings.assets, requireApprovalForPurchase: checked }
                    });
                  }}
                />
              </div>

              {settings.assets.requireApprovalForPurchase && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>承認必須金額</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.assets.approvalAmountThreshold}
                        onChange={(e) => updateSettings({
                          assets: { ...settings.assets, approvalAmountThreshold: Number(e.target.value) }
                        })}
                        min="0"
                        step="10000"
                      />
                      <span className="text-sm text-muted-foreground">円</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ¥{settings.assets.approvalAmountThreshold.toLocaleString()}以上の資産購入時に承認が必要
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>棚卸設定</CardTitle>
              <CardDescription>定期的な資産棚卸の頻度を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>棚卸実施頻度</Label>
                <Select
                  value={settings.assets.inventoryCheckFrequency}
                  onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => updateSettings({
                    assets: { ...settings.assets, inventoryCheckFrequency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">毎月</SelectItem>
                    <SelectItem value="quarterly">四半期ごと</SelectItem>
                    <SelectItem value="yearly">年1回</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  棚卸通知と記録が自動的に管理されます
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>在庫アラート設定</CardTitle>
              <CardDescription>消耗品などの在庫切れアラートを設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>在庫アラート閾値</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.assets.lowStockAlertThreshold}
                    onChange={(e) => updateSettings({
                      assets: { ...settings.assets, lowStockAlertThreshold: Number(e.target.value) }
                    })}
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-muted-foreground">個</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  在庫数が{settings.assets.lowStockAlertThreshold}個以下になるとアラート通知
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>返却リマインダー設定</CardTitle>
              <CardDescription>貸出資産の返却期限リマインダーを設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>返却リマインダーを有効化</Label>
                  <p className="text-sm text-muted-foreground">
                    返却期限が近づいた際に自動通知します
                  </p>
                </div>
                <Switch
                  checked={settings.assets.enableReturnReminder}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      assets: { ...settings.assets, enableReturnReminder: checked }
                    });
                  }}
                />
              </div>

              {settings.assets.enableReturnReminder && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>リマインダー送信日数</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.assets.returnReminderDays}
                        onChange={(e) => updateSettings({
                          assets: { ...settings.assets, returnReminderDays: Number(e.target.value) }
                        })}
                        min="1"
                        max="30"
                      />
                      <span className="text-sm text-muted-foreground">日前</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      返却期限の{settings.assets.returnReminderDays}日前にリマインダー送信
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>自動割当設定</CardTitle>
              <CardDescription>新入社員への資産自動割当を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>自動割当を有効化</Label>
                  <p className="text-sm text-muted-foreground">
                    入社時に標準資産（PC、モニター等）を自動割当
                  </p>
                </div>
                <Switch
                  checked={settings.assets.enableAutoAssignment}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      assets: { ...settings.assets, enableAutoAssignment: checked }
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              これらの設定は、資産管理画面の動作に反映されます。
              定期的な棚卸実施により、資産の適切な管理を維持しましょう。
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* SaaS管理設定 */}
        <TabsContent value="saas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>予算設定</CardTitle>
              <CardDescription>月額予算とアラート設定を管理します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>月額予算上限</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings.saas.monthlyBudget}
                      onChange={(e) => updateSettings({
                        saas: { ...settings.saas, monthlyBudget: Number(e.target.value) }
                      })}
                      min="0"
                      step="10000"
                    />
                    <span className="text-sm text-muted-foreground">円</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    SaaSサービスの月額合計予算を設定します
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>予算超過アラート閾値</Label>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <Input
                      type="number"
                      value={settings.saas.budgetAlertThreshold}
                      onChange={(e) => updateSettings({
                        saas: { ...settings.saas, budgetAlertThreshold: Number(e.target.value) }
                      })}
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    予算の{settings.saas.budgetAlertThreshold}%（¥{Math.floor(settings.saas.monthlyBudget * settings.saas.budgetAlertThreshold / 100).toLocaleString()}）を超えるとアラート
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>未使用ライセンス検出</CardTitle>
              <CardDescription>使用されていないライセンスを自動検出してコスト削減を支援します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>未使用ライセンス検出を有効化</Label>
                  <p className="text-sm text-muted-foreground">
                    一定期間使用されていないライセンスを検出します
                  </p>
                </div>
                <Switch
                  checked={settings.saas.enableUnusedLicenseAlert}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      saas: { ...settings.saas, enableUnusedLicenseAlert: checked }
                    });
                  }}
                />
              </div>

              {settings.saas.enableUnusedLicenseAlert && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>未使用と判定する日数</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.saas.unusedLicenseDays}
                        onChange={(e) => updateSettings({
                          saas: { ...settings.saas, unusedLicenseDays: Number(e.target.value) }
                        })}
                        min="1"
                        max="365"
                      />
                      <span className="text-sm text-muted-foreground">日間</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      最終使用日から{settings.saas.unusedLicenseDays}日間使用がない場合、未使用ライセンスとして検出されます
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              これらの設定は、SaaS管理画面のサマリーカードやアラート機能に反映されます。
              定期的に見直して、適切な予算管理を行いましょう。
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* ワークフロー設定 */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>承認フロー設定</CardTitle>
              <CardDescription>
                申請の承認に関する基本設定を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 承認期限 */}
              <div className="space-y-2">
                <Label>デフォルト承認期限</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.workflow.defaultApprovalDeadlineDays}
                    onChange={(e) => updateSettings({
                      workflow: { ...settings.workflow, defaultApprovalDeadlineDays: Number(e.target.value) }
                    })}
                    min="1"
                    max="30"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">営業日</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  申請から承認までの標準期限です
                </p>
              </div>

              <Separator />

              {/* 並列承認 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>並列承認を許可</Label>
                  <p className="text-xs text-muted-foreground">
                    複数の承認者が同時に承認できるようにします
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.allowParallelApproval}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      workflow: { ...settings.workflow, allowParallelApproval: checked }
                    });
                  }}
                />
              </div>

              <Separator />

              {/* 却下時コメント必須 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>却下時のコメントを必須にする</Label>
                  <p className="text-xs text-muted-foreground">
                    申請を却下する際、理由の入力を必須にします
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.requireCommentOnReject}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      workflow: { ...settings.workflow, requireCommentOnReject: checked }
                    });
                  }}
                />
              </div>

              <Separator />

              {/* 代理承認 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>代理承認を許可</Label>
                  <p className="text-xs text-muted-foreground">
                    不在時に代理承認者が承認できるようにします
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.enableProxyApproval}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      workflow: { ...settings.workflow, enableProxyApproval: checked }
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>エスカレーション設定</CardTitle>
              <CardDescription>
                承認期限超過時の自動エスカレーション設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* エスカレーション有効化 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>自動エスカレーション</Label>
                  <p className="text-xs text-muted-foreground">
                    承認期限を超えた場合、上位承認者に自動通知します
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.enableAutoEscalation}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      workflow: { ...settings.workflow, enableAutoEscalation: checked }
                    });
                  }}
                />
              </div>

              {settings.workflow.enableAutoEscalation && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>リマインド送信タイミング</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.workflow.escalationReminderDays}
                        onChange={(e) => updateSettings({
                          workflow: { ...settings.workflow, escalationReminderDays: Number(e.target.value) }
                        })}
                        min="1"
                        max="10"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">日前</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      承認期限の{settings.workflow.escalationReminderDays}日前にリマインダーを送信します
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>自動承認設定</CardTitle>
              <CardDescription>
                条件に応じた自動承認の設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 自動承認有効化 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>自動承認を有効にする</Label>
                  <p className="text-xs text-muted-foreground">
                    一定金額以下の申請を自動的に承認します
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.enableAutoApproval}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      workflow: { ...settings.workflow, enableAutoApproval: checked }
                    });
                  }}
                />
              </div>

              {settings.workflow.enableAutoApproval && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>自動承認の金額上限</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">¥</span>
                      <Input
                        type="number"
                        value={settings.workflow.autoApprovalThreshold}
                        onChange={(e) => updateSettings({
                          workflow: { ...settings.workflow, autoApprovalThreshold: Number(e.target.value) }
                        })}
                        min="0"
                        step="1000"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ¥{settings.workflow.autoApprovalThreshold.toLocaleString()}以下の経費申請は自動承認されます
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              ワークフロー設定は、休暇申請・経費申請・出張申請などすべての申請に適用されます。
              変更後は承認者に共有することをお勧めします。
            </AlertDescription>
          </Alert>
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