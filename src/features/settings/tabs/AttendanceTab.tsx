'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Calendar, Hourglass } from 'lucide-react';
import type { SettingsTabProps } from '../types';

export function AttendanceTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
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
                value={settings.attendance.workStartTime}
                onChange={(e) => updateSettings({
                  attendance: { ...settings.attendance, workStartTime: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEndTime">終業時刻 *</Label>
              <Input
                id="workEndTime"
                type="time"
                value={settings.attendance.workEndTime}
                onChange={(e) => updateSettings({
                  attendance: { ...settings.attendance, workEndTime: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultBreakMinutes">休憩時間（分） *</Label>
            <Input
              id="defaultBreakMinutes"
              type="number"
              min="0"
              max="480"
              value={settings.attendance.defaultBreakMinutes}
              onChange={(e) => updateSettings({
                attendance: { ...settings.attendance, defaultBreakMinutes: parseInt(e.target.value) }
              })}
            />
            <p className="text-sm text-muted-foreground">
              標準の休憩時間（例: 60分）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 休日設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>休日設定</CardTitle>
          </div>
          <CardDescription>週末と祝日の設定を行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>週末の曜日</Label>
            <div className="flex flex-wrap gap-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                <Button
                  key={index}
                  variant={settings.attendance.weekendDays.includes(index) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newWeekendDays = settings.attendance.weekendDays.includes(index)
                      ? settings.attendance.weekendDays.filter(d => d !== index)
                      : [...settings.attendance.weekendDays, index].sort();
                    updateSettings({
                      attendance: { ...settings.attendance, weekendDays: newWeekendDays }
                    });
                  }}
                >
                  {day}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              週末として扱う曜日を選択してください
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>祝日を自動認識</Label>
              <p className="text-sm text-muted-foreground">
                日本の国民の祝日を自動的に休日として扱う
              </p>
            </div>
            <Switch
              checked={settings.attendance.enableNationalHolidays}
              onCheckedChange={(checked) => updateSettings({
                attendance: { ...settings.attendance, enableNationalHolidays: checked }
              })}
            />
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
          <div className="space-y-2">
            <Label htmlFor="overtimeCalculationMethod">残業計算方法 *</Label>
            <Select
              value={settings.attendance.overtimeCalculationMethod}
              onValueChange={(value: 'daily' | 'monthly') => updateSettings({
                attendance: { ...settings.attendance, overtimeCalculationMethod: value }
              })}
            >
              <SelectTrigger id="overtimeCalculationMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">日次計算（1日8時間超過で残業）</SelectItem>
                <SelectItem value="monthly">月次計算（月160時間超過で残業）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lateNightStartHour">深夜労働開始時刻 *</Label>
              <Input
                id="lateNightStartHour"
                type="number"
                min="0"
                max="23"
                value={settings.attendance.lateNightStartHour}
                onChange={(e) => updateSettings({
                  attendance: { ...settings.attendance, lateNightStartHour: parseInt(e.target.value) }
                })}
              />
              <p className="text-sm text-muted-foreground">
                深夜労働の開始時刻（時）- 通常22時
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateNightEndHour">深夜労働終了時刻 *</Label>
              <Input
                id="lateNightEndHour"
                type="number"
                min="0"
                max="23"
                value={settings.attendance.lateNightEndHour}
                onChange={(e) => updateSettings({
                  attendance: { ...settings.attendance, lateNightEndHour: parseInt(e.target.value) }
                })}
              />
              <p className="text-sm text-muted-foreground">
                深夜労働の終了時刻（時）- 通常5時
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
              <Label>GPS位置情報を必須にする</Label>
              <p className="text-sm text-muted-foreground">
                打刻時に位置情報の取得を必須にする
              </p>
            </div>
            <Switch
              checked={settings.attendance.requireGpsForClockIn}
              onCheckedChange={(checked) => updateSettings({
                attendance: { ...settings.attendance, requireGpsForClockIn: checked }
              })}
            />
          </div>

          {settings.attendance.requireGpsForClockIn && (
            <div className="space-y-2">
              <Label htmlFor="allowedClockInRadius">打刻許可範囲（メートル） *</Label>
              <Input
                id="allowedClockInRadius"
                type="number"
                min="10"
                max="10000"
                value={settings.attendance.allowedClockInRadius}
                onChange={(e) => updateSettings({
                  attendance: { ...settings.attendance, allowedClockInRadius: parseInt(e.target.value) }
                })}
              />
              <p className="text-sm text-muted-foreground">
                オフィスから何メートル以内なら打刻を許可するか
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 有給休暇設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>有給休暇設定</CardTitle>
          </div>
          <CardDescription>年次有給休暇の付与ルールを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="annualLeaveGrantDays">年間付与日数 *</Label>
            <Input
              id="annualLeaveGrantDays"
              type="number"
              min="0"
              max="40"
              value={settings.attendance.annualLeaveGrantDays}
              onChange={(e) => updateSettings({
                attendance: { ...settings.attendance, annualLeaveGrantDays: parseInt(e.target.value) }
              })}
            />
            <p className="text-sm text-muted-foreground">
              入社時に付与する有給休暇日数（法定最低10日）
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>有給休暇の繰越を許可</Label>
              <p className="text-sm text-muted-foreground">
                未使用の有給休暇を翌年に繰り越す
              </p>
            </div>
            <Switch
              checked={settings.attendance.enableLeaveCarryover}
              onCheckedChange={(checked) => updateSettings({
                attendance: { ...settings.attendance, enableLeaveCarryover: checked }
              })}
            />
          </div>

          {settings.attendance.enableLeaveCarryover && (
            <div className="space-y-2">
              <Label htmlFor="maxCarryoverDays">最大繰越日数 *</Label>
              <Input
                id="maxCarryoverDays"
                type="number"
                min="0"
                max="40"
                value={settings.attendance.maxCarryoverDays}
                onChange={(e) => updateSettings({
                  attendance: { ...settings.attendance, maxCarryoverDays: parseInt(e.target.value) }
                })}
              />
              <p className="text-sm text-muted-foreground">
                翌年に繰り越せる最大日数（法定最大20日）
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} size="lg">
          勤怠設定を保存
        </Button>
      </div>
    </div>
  );
}
