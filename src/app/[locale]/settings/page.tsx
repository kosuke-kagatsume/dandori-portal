'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Download,
  Upload,
  AlertCircle,
  Check
} from 'lucide-react';
import { useUIStore, useUserStore } from '@/lib/store';

export default function SettingsPage() {
  const { theme, setTheme, locale, setLocale } = useUIStore();
  const { currentUser } = useUserStore();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          システム設定と個人設定を管理します
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="appearance">表示</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
          <TabsTrigger value="data">データ</TabsTrigger>
        </TabsList>

        {/* 一般設定 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
              <CardDescription>
                基本的な個人情報の設定を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">氏名</Label>
                  <Input id="name" defaultValue={currentUser?.name || '山田太郎'} disabled />
                  <p className="text-xs text-muted-foreground">
                    ※氏名の変更は管理者にお問い合わせください
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input id="email" type="email" defaultValue={currentUser?.email || 'admin@demo.com'} disabled />
                  <p className="text-xs text-muted-foreground">
                    ※メールアドレスの変更は管理者にお問い合わせください
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" type="tel" defaultValue="090-1234-5678" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">タイムゾーン</Label>
                <Select defaultValue="asia-tokyo">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia-tokyo">Asia/Tokyo (JST)</SelectItem>
                    <SelectItem value="asia-seoul">Asia/Seoul (KST)</SelectItem>
                    <SelectItem value="asia-shanghai">Asia/Shanghai (CST)</SelectItem>
                    <SelectItem value="america-newyork">America/New_York (EST)</SelectItem>
                    <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 表示設定 */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>表示設定</CardTitle>
              <CardDescription>
                アプリケーションの見た目をカスタマイズします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>テーマ</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      ライト
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      ダーク
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setTheme('system')}
                    >
                      <Monitor className="w-4 h-4 mr-2" />
                      システム
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="language">言語</Label>
                  <Select value={locale} onValueChange={setLocale}>
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
                  <Label htmlFor="font-size">フォントサイズ</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">小</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="large">大</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>コンパクト表示</Label>
                    <p className="text-sm text-muted-foreground">
                      情報をより密に表示します
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知設定 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                通知の受信方法と種類を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      メール通知
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      重要な更新をメールで受信します
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      プッシュ通知
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      ブラウザのプッシュ通知を有効にします
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>通知を受け取る項目</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">承認リクエスト</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">メンション</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">システムアップデート</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">週次レポート</Label>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* セキュリティ設定 */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>セキュリティ設定</CardTitle>
              <CardDescription>
                アカウントのセキュリティを管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>パスワード</Label>
                  <div className="flex gap-2">
                    <Input type="password" placeholder="現在のパスワード" />
                    <Button variant="outline">変更</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    最終更新: 2024年1月15日
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      二要素認証
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      ログイン時に追加の認証を要求します
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>セッション管理</Label>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            <div>
                              <p className="text-sm font-medium">Chrome - Mac</p>
                              <p className="text-xs text-muted-foreground">現在のセッション</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">アクティブ</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            <div>
                              <p className="text-sm font-medium">Safari - iPhone</p>
                              <p className="text-xs text-muted-foreground">最終アクセス: 2時間前</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">終了</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* データ設定 */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>データ管理</CardTitle>
              <CardDescription>
                データのバックアップとエクスポートを管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      自動バックアップ
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      データを定期的に自動バックアップします
                    </p>
                  </div>
                  <Switch
                    checked={autoBackup}
                    onCheckedChange={setAutoBackup}
                  />
                </div>

                <div className="space-y-2">
                  <Label>バックアップ頻度</Label>
                  <Select defaultValue="daily" disabled={!autoBackup}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">毎日</SelectItem>
                      <SelectItem value="weekly">週次</SelectItem>
                      <SelectItem value="monthly">月次</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>データエクスポート</Label>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      個人データをエクスポート (CSV)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      勤怠データをエクスポート (Excel)
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      全データをエクスポート (JSON)
                    </Button>
                  </div>
                </div>

                <Separator />

                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      危険な操作
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" className="w-full">
                      アカウントを削除
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      この操作は取り消せません。すべてのデータが永久に削除されます。
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">キャンセル</Button>
        <Button onClick={handleSave}>
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              保存しました
            </>
          ) : (
            '変更を保存'
          )}
        </Button>
      </div>
    </div>
  );
}