'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import { Clock, MapPin, Calendar, Hourglass, Loader2 } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function AttendanceTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
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
      saveSettings();
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 週休日のトグル
  const toggleWeeklyHoliday = (day: string) => {
    const current = attendanceSettings.weeklyHolidays || [];
    const newHolidays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    updateAttendanceSettings({ weeklyHolidays: newHolidays });
  };

  const weekDays = [
    { key: 'sunday', label: '日' },
    { key: 'monday', label: '月' },
    { key: 'tuesday', label: '火' },
    { key: 'wednesday', label: '水' },
    { key: 'thursday', label: '木' },
    { key: 'friday', label: '金' },
    { key: 'saturday', label: '土' },
  ];

  return (
    <div className="space-y-6">
      {/* 勤務時間設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>勤務時間設定</CardTitle>
          </div>
          <CardDescription>標準的な勤務時間を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workStartTime">始業時刻 *</Label>
              <Input
                id="workStartTime"
                type="time"
                value={attendanceSettings.workStartTime}
                onChange={(e) => updateAttendanceSettings({ workStartTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEndTime">終業時刻 *</Label>
              <Input
                id="workEndTime"
                type="time"
                value={attendanceSettings.workEndTime}
                onChange={(e) => updateAttendanceSettings({ workEndTime: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakStartTime">休憩開始時刻</Label>
              <Input
                id="breakStartTime"
                type="time"
                value={attendanceSettings.breakStartTime}
                onChange={(e) => updateAttendanceSettings({ breakStartTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakEndTime">休憩終了時刻</Label>
              <Input
                id="breakEndTime"
                type="time"
                value={attendanceSettings.breakEndTime}
                onChange={(e) => updateAttendanceSettings({ breakEndTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakDurationMinutes">休憩時間（分） *</Label>
            <Input
              id="breakDurationMinutes"
              type="number"
              min="0"
              max="480"
              value={attendanceSettings.breakDurationMinutes}
              onChange={(e) => updateAttendanceSettings({ breakDurationMinutes: parseInt(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">
              標準の休憩時間（例: 60分）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* フレックス設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>フレックス設定</CardTitle>
          </div>
          <CardDescription>フレックスタイム制度の設定</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>フレックスタイム制度</Label>
              <p className="text-sm text-muted-foreground">
                フレックスタイム制度を有効にする
              </p>
            </div>
            <Switch
              checked={attendanceSettings.enableFlexTime}
              onCheckedChange={(checked) => updateAttendanceSettings({ enableFlexTime: checked })}
            />
          </div>

          {attendanceSettings.enableFlexTime && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coreTimeStart">コアタイム開始</Label>
                  <Input
                    id="coreTimeStart"
                    type="time"
                    value={attendanceSettings.coreTimeStart || ''}
                    onChange={(e) => updateAttendanceSettings({ coreTimeStart: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coreTimeEnd">コアタイム終了</Label>
                  <Input
                    id="coreTimeEnd"
                    type="time"
                    value={attendanceSettings.coreTimeEnd || ''}
                    onChange={(e) => updateAttendanceSettings({ coreTimeEnd: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 休日設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>休日設定</CardTitle>
          </div>
          <CardDescription>週休日の設定を行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>週休日</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={(attendanceSettings.weeklyHolidays || []).includes(key) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleWeeklyHoliday(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              週休日として扱う曜日を選択してください
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 残業設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hourglass className="w-5 h-5" />
            <CardTitle>残業設定</CardTitle>
          </div>
          <CardDescription>残業時間の計算方法を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overtimeThresholdMinutes">残業計算開始（分）</Label>
              <Input
                id="overtimeThresholdMinutes"
                type="number"
                min="0"
                max="720"
                value={attendanceSettings.overtimeThresholdMinutes}
                onChange={(e) => updateAttendanceSettings({ overtimeThresholdMinutes: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                日次労働時間がこの分数を超えると残業（通常480分=8時間）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOvertimeHoursPerMonth">月間残業上限（時間）</Label>
              <Input
                id="maxOvertimeHoursPerMonth"
                type="number"
                min="0"
                max="100"
                value={attendanceSettings.maxOvertimeHoursPerMonth}
                onChange={(e) => updateAttendanceSettings({ maxOvertimeHoursPerMonth: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                36協定の上限（通常45時間）
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
