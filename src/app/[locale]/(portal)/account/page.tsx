'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// Select関連コンポーネント（将来的に言語選択で使用予定）
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Palette,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Check,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  Volume2,
  Key,
  Lock,
} from 'lucide-react';
import { useUIStore, useUserStore } from '@/lib/store';
import { AvatarUploadButton } from '@/features/profile/avatar-upload-button';

export default function AccountPage() {
  // const router = useRouter(); // 将来的にページ遷移で使用予定
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _currentLocale = (params?.locale as string) || 'ja'; // 将来的に言語切り替えで使用予定

  const { theme, setTheme } = useUIStore();
  const { currentUser, updateUser } = useUserStore();

  // プロフィール状態
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState('');

  // 通知設定状態
  const [browserNotification, setBrowserNotification] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [workflowNotification, setWorkflowNotification] = useState(true);
  const [attendanceNotification, setAttendanceNotification] = useState(true);
  const [announcementNotification, setAnnouncementNotification] = useState(true);

  // パスワード変更状態
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 2FA状態
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleAvatarUpload = (url: string) => {
    if (currentUser?.id) {
      updateUser(currentUser.id, { avatar: url });
    }
  };

  const handleAvatarUploadError = (error: string) => {
    console.error('Avatar upload error:', error);
  };

  const handleSaveProfile = () => {
    if (currentUser?.id) {
      updateUser(currentUser.id, { name: displayName });
    }
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('現在のパスワードを入力してください');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('新しいパスワードは8文字以上で入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }

    // TODO: 実際のパスワード変更API呼び出し
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold">マイアカウント</h1>
        <p className="text-muted-foreground">
          個人設定を管理します
        </p>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="profile" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>プロフィール</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>外観</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>通知</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>セキュリティ</span>
          </TabsTrigger>
        </TabsList>

        {/* プロフィールタブ */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール設定</CardTitle>
              <CardDescription>
                他のメンバーに表示されるあなたの情報を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* アバター */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback className="text-2xl">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="font-medium">プロフィール画像</h3>
                  <p className="text-sm text-muted-foreground">
                    JPG、PNG、GIF形式（最大5MB）
                  </p>
                  {currentUser?.id && (
                    <AvatarUploadButton
                      userId={currentUser.id}
                      onUploadSuccess={handleAvatarUpload}
                      onUploadError={handleAvatarUploadError}
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* 表示名 */}
              <div className="space-y-2">
                <Label htmlFor="displayName">表示名</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="表示名を入力"
                />
                <p className="text-sm text-muted-foreground">
                  チャットやコメントで表示される名前です
                </p>
              </div>

              {/* 自己紹介 */}
              <div className="space-y-2">
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="自己紹介を入力（任意）"
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveProfile}>
                <Check className="w-4 h-4 mr-2" />
                保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 外観タブ */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>外観設定</CardTitle>
              <CardDescription>
                アプリケーションの見た目をカスタマイズします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* テーマ選択 */}
              <div className="space-y-4">
                <Label>テーマ</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <Sun className="w-6 h-6" />
                    <span className="text-sm font-medium">ライト</span>
                    {theme === 'light' && (
                      <Badge variant="default" className="text-xs">選択中</Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <Moon className="w-6 h-6" />
                    <span className="text-sm font-medium">ダーク</span>
                    {theme === 'dark' && (
                      <Badge variant="default" className="text-xs">選択中</Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                      theme === 'system' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <Monitor className="w-6 h-6" />
                    <span className="text-sm font-medium">システム</span>
                    {theme === 'system' && (
                      <Badge variant="default" className="text-xs">選択中</Badge>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知タブ */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                通知の受け取り方法を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 通知方法 */}
              <div className="space-y-4">
                <h3 className="font-medium">通知方法</h3>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">ブラウザ通知</p>
                      <p className="text-sm text-muted-foreground">
                        デスクトップ通知を受け取る
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={browserNotification}
                    onCheckedChange={setBrowserNotification}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">メール通知</p>
                      <p className="text-sm text-muted-foreground">
                        重要な通知をメールで受け取る
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={emailNotification}
                    onCheckedChange={setEmailNotification}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">通知音</p>
                      <p className="text-sm text-muted-foreground">
                        通知時にサウンドを再生
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSound}
                    onCheckedChange={setNotificationSound}
                  />
                </div>
              </div>

              <Separator />

              {/* 通知種別 */}
              <div className="space-y-4">
                <h3 className="font-medium">通知種別</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">ワークフロー</p>
                    <p className="text-sm text-muted-foreground">
                      承認依頼・承認完了の通知
                    </p>
                  </div>
                  <Switch
                    checked={workflowNotification}
                    onCheckedChange={setWorkflowNotification}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">勤怠</p>
                    <p className="text-sm text-muted-foreground">
                      打刻忘れ・残業アラートの通知
                    </p>
                  </div>
                  <Switch
                    checked={attendanceNotification}
                    onCheckedChange={setAttendanceNotification}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">お知らせ</p>
                    <p className="text-sm text-muted-foreground">
                      社内お知らせの通知
                    </p>
                  </div>
                  <Switch
                    checked={announcementNotification}
                    onCheckedChange={setAnnouncementNotification}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* セキュリティタブ */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>セキュリティ設定</CardTitle>
              <CardDescription>
                アカウントのセキュリティを管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* パスワード変更 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">パスワード</p>
                    <p className="text-sm text-muted-foreground">
                      最終変更: 30日以上前
                    </p>
                  </div>
                </div>
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">変更</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>パスワードを変更</DialogTitle>
                      <DialogDescription>
                        新しいパスワードを設定してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* 現在のパスワード */}
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">現在のパスワード</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="現在のパスワード"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 新しいパスワード */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">新しいパスワード</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="8文字以上"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* パスワード確認 */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="もう一度入力"
                        />
                      </div>

                      {passwordError && (
                        <p className="text-sm text-red-500">{passwordError}</p>
                      )}

                      {passwordSuccess && (
                        <p className="text-sm text-green-500 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          パスワードを変更しました
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                        キャンセル
                      </Button>
                      <Button onClick={handlePasswordChange}>
                        変更する
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              {/* 2要素認証 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">2要素認証</p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorEnabled ? '有効' : '無効'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>

              {twoFactorEnabled && (
                <div className="ml-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    2要素認証が有効です。ログイン時に認証アプリのコードが必要になります。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ログインセッション */}
          <Card>
            <CardHeader>
              <CardTitle>ログインセッション</CardTitle>
              <CardDescription>
                現在アクティブなセッションを確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">現在のセッション</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome on macOS - 東京, 日本
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">アクティブ</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
