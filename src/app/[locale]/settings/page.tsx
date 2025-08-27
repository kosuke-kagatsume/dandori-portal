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
} from 'lucide-react';
import { useUserStore } from '@/lib/store';
import { toast } from 'sonner';

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appearance">外観</TabsTrigger>
          <TabsTrigger value="regional">地域と言語</TabsTrigger>
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