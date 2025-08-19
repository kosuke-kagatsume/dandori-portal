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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Check,
  Clock,
  Calendar,
  MessageSquare,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Fingerprint,
  ShieldCheck,
  Eye,
  EyeOff,
  HardDrive,
  Cloud,
  Trash2,
  Archive,
  FileDown,
  BarChart,
  Languages,
  Laptop,
  Save,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useUIStore, useUserStore } from '@/lib/store';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const { theme, setTheme, locale, setLocale } = useUIStore();
  const { currentUser } = useUserStore();
  
  // 一般設定
  const [phoneNumber, setPhoneNumber] = useState('090-1234-5678');
  const [timezone, setTimezone] = useState('asia-tokyo');
  const [language, setLanguage] = useState('ja');
  const [dateFormat, setDateFormat] = useState('yyyy-mm-dd');
  const [weekStart, setWeekStart] = useState('monday');
  
  // 通知設定
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [leaveRequestNotif, setLeaveRequestNotif] = useState(true);
  const [attendanceReminder, setAttendanceReminder] = useState(true);
  const [overtimeAlert, setOvertimeAlert] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(true);
  
  // セキュリティ設定
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState([30]);
  const [passwordExpiry, setPasswordExpiry] = useState('90');
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [ipRestriction, setIpRestriction] = useState(false);
  const [allowedIPs, setAllowedIPs] = useState('');
  
  // データ管理設定
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [dataRetention, setDataRetention] = useState('365');
  const [storageUsed] = useState(65);
  const [syncEnabled, setSyncEnabled] = useState(true);
  
  // 外観設定
  const [fontSize, setFontSize] = useState([14]);
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState('left');
  const [accentColor, setAccentColor] = useState('blue');
  const [animations, setAnimations] = useState(true);
  
  const [saved, setSaved] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleSave = () => {
    toast.success('設定を保存しました');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setResetDialogOpen(false);
    toast.info('設定をリセットしました');
  };

  const handleExportData = () => {
    toast.success('データのエクスポートを開始しました');
  };

  const handleImportData = () => {
    toast.info('データのインポート機能は準備中です');
  };

  const handleClearCache = () => {
    toast.success('キャッシュをクリアしました');
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">設定</h1>
          <p className="text-muted-foreground">
            システム設定と個人設定を管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearCache}>
            <RefreshCw className="w-4 h-4 mr-2" />
            キャッシュクリア
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            設定を保存
            {saved && <Check className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">一般</TabsTrigger>
          <TabsTrigger value="appearance">外観</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="security">セキュリティ</TabsTrigger>
          <TabsTrigger value="data">データ管理</TabsTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="phone">電話番号</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">部署</Label>
                  <Input id="department" defaultValue={currentUser?.department || '開発部'} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>地域と言語</CardTitle>
              <CardDescription>
                タイムゾーンと言語設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">タイムゾーン</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
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
                <div className="space-y-2">
                  <Label htmlFor="language">言語</Label>
                  <Select value={language} onValueChange={setLanguage}>
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
                  <Label htmlFor="dateFormat">日付形式</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yyyy-mm-dd">2024-01-15</SelectItem>
                      <SelectItem value="dd/mm/yyyy">15/01/2024</SelectItem>
                      <SelectItem value="mm/dd/yyyy">01/15/2024</SelectItem>
                      <SelectItem value="yyyy年mm月dd日">2024年01月15日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekStart">週の開始日</Label>
                  <Select value={weekStart} onValueChange={setWeekStart}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">日曜日</SelectItem>
                      <SelectItem value="monday">月曜日</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 外観設定 */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>テーマ設定</CardTitle>
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
                  <Label>アクセントカラー</Label>
                  <RadioGroup value={accentColor} onValueChange={setAccentColor}>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="blue" id="blue" />
                        <Label htmlFor="blue" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500" />
                          ブルー
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="green" id="green" />
                        <Label htmlFor="green" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500" />
                          グリーン
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="purple" id="purple" />
                        <Label htmlFor="purple" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500" />
                          パープル
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="red" id="red" />
                        <Label htmlFor="red" className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500" />
                          レッド
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>フォントサイズ</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">小</span>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={12}
                      max={18}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm">大</span>
                    <span className="text-sm font-medium w-12">{fontSize}px</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>コンパクトモード</Label>
                    <p className="text-sm text-muted-foreground">
                      UI要素の間隔を狭くして、より多くの情報を表示
                    </p>
                  </div>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>アニメーション</Label>
                    <p className="text-sm text-muted-foreground">
                      画面遷移やエフェクトのアニメーション
                    </p>
                  </div>
                  <Switch
                    checked={animations}
                    onCheckedChange={setAnimations}
                  />
                </div>

                <div className="space-y-2">
                  <Label>サイドバー位置</Label>
                  <RadioGroup value={sidebarPosition} onValueChange={setSidebarPosition}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="left" id="left" />
                      <Label htmlFor="left">左側</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="right" id="right" />
                      <Label htmlFor="right">右側</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知設定 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通知方法</CardTitle>
              <CardDescription>
                通知の受け取り方法を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    メール通知
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    重要な通知をメールで受け取る
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
                    モバイルアプリでプッシュ通知を受け取る
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    デスクトップ通知
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    ブラウザのデスクトップ通知を表示
                  </p>
                </div>
                <Switch
                  checked={desktopNotifications}
                  onCheckedChange={setDesktopNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {notificationSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    通知音
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    通知時にサウンドを再生
                  </p>
                </div>
                <Switch
                  checked={notificationSound}
                  onCheckedChange={setNotificationSound}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>通知カテゴリ</CardTitle>
              <CardDescription>
                受け取る通知の種類を選択します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    休暇申請
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    休暇申請の承認依頼とステータス変更
                  </p>
                </div>
                <Switch
                  checked={leaveRequestNotif}
                  onCheckedChange={setLeaveRequestNotif}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    勤怠リマインダー
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    出退勤の打刻忘れリマインダー
                  </p>
                </div>
                <Switch
                  checked={attendanceReminder}
                  onCheckedChange={setAttendanceReminder}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    残業アラート
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    残業時間の上限接近通知
                  </p>
                </div>
                <Switch
                  checked={overtimeAlert}
                  onCheckedChange={setOvertimeAlert}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    お知らせ
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    会社からの重要なお知らせ
                  </p>
                </div>
                <Switch
                  checked={announcements}
                  onCheckedChange={setAnnouncements}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>レポート配信</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekly" className="font-normal">
                      週次レポート（毎週月曜日）
                    </Label>
                    <Switch
                      id="weekly"
                      checked={weeklyReport}
                      onCheckedChange={setWeeklyReport}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="monthly" className="font-normal">
                      月次レポート（毎月1日）
                    </Label>
                    <Switch
                      id="monthly"
                      checked={monthlyReport}
                      onCheckedChange={setMonthlyReport}
                    />
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
              <CardTitle>認証設定</CardTitle>
              <CardDescription>
                アカウントのセキュリティを強化します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    二要素認証
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    ログイン時にSMSまたは認証アプリでの確認を追加
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {twoFactorEnabled && (
                    <Badge variant="default" className="bg-green-500">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      有効
                    </Badge>
                  )}
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    生体認証
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    指紋や顔認証でのログインを許可
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={setBiometricEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  セッションタイムアウト
                </Label>
                <p className="text-sm text-muted-foreground">
                  無操作時に自動ログアウトするまでの時間（分）
                </p>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={sessionTimeout}
                    onValueChange={setSessionTimeout}
                    min={5}
                    max={120}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{sessionTimeout}分</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>パスワード有効期限</Label>
                <Select value={passwordExpiry} onValueChange={setPasswordExpiry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30日</SelectItem>
                    <SelectItem value="60">60日</SelectItem>
                    <SelectItem value="90">90日</SelectItem>
                    <SelectItem value="180">180日</SelectItem>
                    <SelectItem value="never">無期限</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>アクセス制御</CardTitle>
              <CardDescription>
                アカウントへのアクセスを制限します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    ログインアラート
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    新しいデバイスからのログイン時に通知
                  </p>
                </div>
                <Switch
                  checked={loginAlerts}
                  onCheckedChange={setLoginAlerts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    IP制限
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    特定のIPアドレスからのアクセスのみ許可
                  </p>
                </div>
                <Switch
                  checked={ipRestriction}
                  onCheckedChange={setIpRestriction}
                />
              </div>

              {ipRestriction && (
                <div className="space-y-2">
                  <Label>許可するIPアドレス</Label>
                  <Textarea
                    placeholder="IPアドレスを改行で区切って入力&#10;例:&#10;192.168.1.1&#10;10.0.0.0/24"
                    value={allowedIPs}
                    onChange={(e) => setAllowedIPs(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>パスワード変更</Label>
                <div className="space-y-2">
                  <Input type="password" placeholder="現在のパスワード" />
                  <Input type="password" placeholder="新しいパスワード" />
                  <Input type="password" placeholder="新しいパスワード（確認）" />
                  <Button className="w-full">
                    <Key className="w-4 h-4 mr-2" />
                    パスワードを変更
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* データ管理設定 */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>バックアップ設定</CardTitle>
              <CardDescription>
                データのバックアップと復元を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    自動バックアップ
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    データを定期的に自動バックアップ
                  </p>
                </div>
                <Switch
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>

              {autoBackup && (
                <div className="space-y-2">
                  <Label>バックアップ頻度</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">毎時間</SelectItem>
                      <SelectItem value="daily">毎日</SelectItem>
                      <SelectItem value="weekly">毎週</SelectItem>
                      <SelectItem value="monthly">毎月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    自動同期
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    複数デバイス間でデータを同期
                  </p>
                </div>
                <Switch
                  checked={syncEnabled}
                  onCheckedChange={setSyncEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>手動バックアップ</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    今すぐバックアップ
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    バックアップから復元
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ストレージ管理</CardTitle>
              <CardDescription>
                ストレージ使用状況とデータ管理
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ストレージ使用量</span>
                  <span className="font-medium">{storageUsed}% / 100GB</span>
                </div>
                <Progress value={storageUsed} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span>ドキュメント (32GB)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>画像 (18GB)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-300 rounded" />
                    <span>その他 (15GB)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>データ保存期間</Label>
                <Select value={dataRetention} onValueChange={setDataRetention}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90日間</SelectItem>
                    <SelectItem value="180">180日間</SelectItem>
                    <SelectItem value="365">1年間</SelectItem>
                    <SelectItem value="730">2年間</SelectItem>
                    <SelectItem value="unlimited">無期限</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  削除したデータの保存期間
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>データエクスポート</Label>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportData} className="flex-1">
                    <FileDown className="w-4 h-4 mr-2" />
                    データをエクスポート
                  </Button>
                  <Button variant="outline" onClick={handleImportData} className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    データをインポート
                  </Button>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  データのエクスポートには個人情報が含まれます。取り扱いにはご注意ください。
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="space-y-2">
                <Label className="text-red-600">危険な操作</Label>
                <div className="space-y-2">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        すべての設定をリセット
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>設定のリセット</DialogTitle>
                        <DialogDescription>
                          すべての設定をデフォルトに戻します。この操作は取り消せません。
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                          キャンセル
                        </Button>
                        <Button variant="destructive" onClick={handleReset}>
                          リセット
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}