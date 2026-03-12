'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { MapPin, Loader2 } from 'lucide-react';
import type { SettingsTabProps } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AttendanceTab({ settings: _settings, updateSettings: _updateSettings, saveSettings: _saveSettings }: SettingsTabProps) {
  const {
    attendanceSettings,
    updateAttendanceSettings,
    fetchAttendanceSettings,
    saveAttendanceSettings,
    isLoading
  } = useCompanySettingsStore();
  const [isSaving, setIsSaving] = useState(false);

  // 初回ロード時にAPIからデータ取得
  useEffect(() => {
    fetchAttendanceSettings();
  }, [fetchAttendanceSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAttendanceSettings();
      _saveSettings();
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 打刻設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <CardTitle>打刻設定</CardTitle>
          </div>
          <CardDescription>打刻時の位置情報設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>リモート打刻を許可</Label>
              <p className="text-sm text-muted-foreground">
                オフィス外からの打刻を許可する
              </p>
            </div>
            <Switch
              checked={attendanceSettings.allowRemoteCheckIn}
              onCheckedChange={(checked) => updateAttendanceSettings({ allowRemoteCheckIn: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>位置情報を必須にする</Label>
              <p className="text-sm text-muted-foreground">
                打刻時に位置情報の取得を必須にする
              </p>
            </div>
            <Switch
              checked={attendanceSettings.requireLocationOnCheckIn}
              onCheckedChange={(checked) => updateAttendanceSettings({ requireLocationOnCheckIn: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>早出打刻を許可</Label>
              <p className="text-sm text-muted-foreground">
                始業時刻前の打刻を許可する
              </p>
            </div>
            <Switch
              checked={attendanceSettings.allowEarlyCheckIn}
              onCheckedChange={(checked) => updateAttendanceSettings({ allowEarlyCheckIn: checked })}
            />
          </div>

          {attendanceSettings.allowEarlyCheckIn && (
            <div className="space-y-2">
              <Label htmlFor="earlyCheckInMinutes">早出許容時間（分）</Label>
              <Input
                id="earlyCheckInMinutes"
                type="number"
                min="0"
                max="180"
                value={attendanceSettings.earlyCheckInMinutes}
                onChange={(e) => updateAttendanceSettings({ earlyCheckInMinutes: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                始業時刻の何分前から打刻を許可するか
              </p>
            </div>
          )}
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
            '勤怠設定を保存'
          )}
        </Button>
      </div>
    </div>
  );
}
