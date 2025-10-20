'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sun, Moon, Globe, Bell } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function AppearanceTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  const testBrowserNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('テスト通知', {
        body: 'これはテスト通知です',
        icon: '/favicon.ico',
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('テスト通知', {
            body: 'これはテスト通知です',
            icon: '/favicon.ico',
          });
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>テーマ</CardTitle>
          <CardDescription>アプリケーションの配色を選択します</CardDescription>
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
          <CardDescription>通知の表示方法を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ブラウザ通知</Label>
              <p className="text-sm text-muted-foreground">重要な更新をデスクトップに通知</p>
            </div>
            <Switch
              checked={settings.notifications.browser}
              onCheckedChange={(checked) => {
                updateSettings({
                  notifications: { ...settings.notifications, browser: checked },
                });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>通知音</Label>
              <p className="text-sm text-muted-foreground">通知時に音を鳴らす</p>
            </div>
            <Switch
              checked={settings.notifications.sound}
              onCheckedChange={(checked) => {
                updateSettings({
                  notifications: { ...settings.notifications, sound: checked },
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
              <p className="text-sm text-muted-foreground">重要な更新をメールで通知</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) => {
                updateSettings({
                  notifications: { ...settings.notifications, email: checked },
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
                      notifications: { ...settings.notifications, emailAddress: e.target.value },
                    });
                  }}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>通知タイミング</Label>
                <Select
                  value={settings.notifications.emailTiming}
                  onValueChange={(value: 'instant' | 'daily' | 'weekly') => {
                    updateSettings({
                      notifications: { ...settings.notifications, emailTiming: value },
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
              </div>
            </>
          )}

          <div className="pt-4">
            <Button onClick={saveSettings}>保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
