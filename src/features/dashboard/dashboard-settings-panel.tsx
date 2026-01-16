'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardDisplaySettings {
  showAttendanceButton: boolean;
  showLeaveRequestButton: boolean;
  showLeaveBalance: boolean;
  showRecentActivity: boolean;
  showSystemStatus: boolean;
}

const defaultSettings: DashboardDisplaySettings = {
  showAttendanceButton: true,
  showLeaveRequestButton: true,
  showLeaveBalance: false,
  showRecentActivity: false,
  showSystemStatus: false,
};

export function DashboardSettingsPanel() {
  const [settings, setSettings] = useState<DashboardDisplaySettings>(defaultSettings);

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dashboard-display-settings');
        if (savedSettings) {
          setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
        }
      } catch (error) {
        console.error('Failed to load dashboard settings:', error);
      }
    }
  }, []);

  // 設定を保存
  const saveSettings = () => {
    try {
      localStorage.setItem('dashboard-display-settings', JSON.stringify(settings));
      toast.success('ダッシュボード設定を保存しました');
    } catch (error) {
      console.error('Failed to save dashboard settings:', error);
      toast.error('設定の保存に失敗しました');
    }
  };

  // 設定を更新
  const updateSetting = (key: keyof DashboardDisplaySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            クイックアクション表示設定
          </CardTitle>
          <CardDescription>
            ダッシュボードのクイックアクションボタンの表示/非表示を設定します。
            会社の方針に応じて、不要なボタンを非表示にできます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label htmlFor="showAttendanceButton" className="font-medium">
                  勤怠打刻ボタン
                </Label>
                <p className="text-xs text-muted-foreground">
                  ダッシュボードに勤怠打刻ボタンを表示します
                </p>
              </div>
            </div>
            <Switch
              id="showAttendanceButton"
              checked={settings.showAttendanceButton}
              onCheckedChange={(checked) => updateSetting('showAttendanceButton', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Label htmlFor="showLeaveRequestButton" className="font-medium">
                  休暇申請ボタン
                </Label>
                <p className="text-xs text-muted-foreground">
                  ダッシュボードに休暇申請ボタンを表示します
                </p>
              </div>
            </div>
            <Switch
              id="showLeaveRequestButton"
              checked={settings.showLeaveRequestButton}
              onCheckedChange={(checked) => updateSetting('showLeaveRequestButton', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings}>
          設定を保存
        </Button>
      </div>
    </div>
  );
}
