'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCompanySettingsStore } from '@/lib/store/company-settings-store';
import type { ClosingDayGroup, AggregationCategory } from '@/lib/store/company-settings-store';
import { MapPin, CalendarDays, BarChart3, Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import type { SettingsTabProps } from '../types';

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const _categoryTypeLabels: Record<string, string> = {
  work: '勤務',
  leave: '休暇',
  overtime: '時間外',
  other: 'その他',
};

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

  // 締日グループ操作
  const addClosingDayGroup = () => {
    const newGroup: ClosingDayGroup = {
      id: `cdg-${Date.now()}`,
      name: '',
      closingDay: 31,
      paymentDay: 25,
      paymentMonthOffset: 1,
    };
    updateAttendanceSettings({
      closingDayGroups: [...(attendanceSettings.closingDayGroups || []), newGroup],
    });
  };

  const updateClosingDayGroup = (id: string, updates: Partial<ClosingDayGroup>) => {
    const groups = (attendanceSettings.closingDayGroups || []).map(g =>
      g.id === id ? { ...g, ...updates } : g
    );
    updateAttendanceSettings({ closingDayGroups: groups });
  };

  const removeClosingDayGroup = (id: string) => {
    const groups = (attendanceSettings.closingDayGroups || []).filter(g => g.id !== id);
    updateAttendanceSettings({ closingDayGroups: groups });
  };

  // 集計区分操作
  const addAggregationCategory = () => {
    const newCategory: AggregationCategory = {
      id: `ac-${Date.now()}`,
      name: '',
      code: '',
      type: 'work',
      isActive: true,
    };
    updateAttendanceSettings({
      aggregationCategories: [...(attendanceSettings.aggregationCategories || []), newCategory],
    });
  };

  const updateAggregationCategory = (id: string, updates: Partial<AggregationCategory>) => {
    const categories = (attendanceSettings.aggregationCategories || []).map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    updateAttendanceSettings({ aggregationCategories: categories });
  };

  const removeAggregationCategory = (id: string) => {
    const categories = (attendanceSettings.aggregationCategories || []).filter(c => c.id !== id);
    updateAttendanceSettings({ aggregationCategories: categories });
  };

  // 所定労働時間操作
  const updateMonthlyHours = (month: number, field: 'hours' | 'days', value: number) => {
    const hours = (attendanceSettings.monthlyStandardWorkHours || []).map(h =>
      h.month === month ? { ...h, [field]: value } : h
    );
    updateAttendanceSettings({ monthlyStandardWorkHours: hours });
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

      {/* 締日グループ設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              <div>
                <CardTitle>締日グループ設定</CardTitle>
                <CardDescription>給与締日と支給日のグループを管理します</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addClosingDayGroup}>
              <Plus className="w-4 h-4 mr-2" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!attendanceSettings.closingDayGroups || attendanceSettings.closingDayGroups.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">締日グループが登録されていません</p>
          ) : (
            <div className="space-y-4">
              {attendanceSettings.closingDayGroups.map((group) => (
                <div key={group.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <Label>グループ名</Label>
                      <Input
                        value={group.name}
                        onChange={(e) => updateClosingDayGroup(group.id, { name: e.target.value })}
                        placeholder="例: 末日締め翌月25日払い"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeClosingDayGroup(group.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>締日</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={group.closingDay}
                        onChange={(e) => updateClosingDayGroup(group.id, { closingDay: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">31 = 末日</p>
                    </div>
                    <div className="space-y-2">
                      <Label>支給日</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={group.paymentDay}
                        onChange={(e) => updateClosingDayGroup(group.id, { paymentDay: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>支給月</Label>
                      <Select
                        value={String(group.paymentMonthOffset)}
                        onValueChange={(v) => updateClosingDayGroup(group.id, { paymentMonthOffset: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">当月</SelectItem>
                          <SelectItem value="1">翌月</SelectItem>
                          <SelectItem value="2">翌々月</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 集計区分設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <div>
                <CardTitle>集計区分設定</CardTitle>
                <CardDescription>勤怠集計の区分を管理します</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addAggregationCategory}>
              <Plus className="w-4 h-4 mr-2" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!attendanceSettings.aggregationCategories || attendanceSettings.aggregationCategories.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">集計区分が登録されていません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区分名</TableHead>
                  <TableHead>コード</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead className="text-center">有効</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceSettings.aggregationCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <Input
                        value={cat.name}
                        onChange={(e) => updateAggregationCategory(cat.id, { name: e.target.value })}
                        placeholder="区分名"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={cat.code}
                        onChange={(e) => updateAggregationCategory(cat.id, { code: e.target.value })}
                        placeholder="コード"
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={cat.type}
                        onValueChange={(v) => updateAggregationCategory(cat.id, { type: v as AggregationCategory['type'] })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work">勤務</SelectItem>
                          <SelectItem value="leave">休暇</SelectItem>
                          <SelectItem value="overtime">時間外</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                        {cat.isActive ? '有効' : '無効'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAggregationCategory(cat.id)}
                        className="text-destructive h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 所定労働時間設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <div>
              <CardTitle>所定労働時間設定</CardTitle>
              <CardDescription>所定労働時間・日数の基本設定と月別設定を行います</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本設定（3項目） */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standardWorkHoursPerDay">1日の所定労働時間</Label>
              <Input
                id="standardWorkHoursPerDay"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={attendanceSettings.standardWorkHoursPerDay ?? 8}
                onChange={(e) => updateAttendanceSettings({ standardWorkHoursPerDay: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-sm text-muted-foreground">時間</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="standardWorkDaysPerMonthAvg">所定労働日数（月平均）</Label>
              <Input
                id="standardWorkDaysPerMonthAvg"
                type="number"
                min="0"
                max="31"
                step="0.1"
                value={attendanceSettings.standardWorkDaysPerMonthAvg ?? 20}
                onChange={(e) => updateAttendanceSettings({ standardWorkDaysPerMonthAvg: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-sm text-muted-foreground">日</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="standardWorkHoursPerMonthAvg">所定労働時間（月平均）</Label>
              <Input
                id="standardWorkHoursPerMonthAvg"
                type="number"
                min="0"
                max="250"
                step="0.5"
                value={attendanceSettings.standardWorkHoursPerMonthAvg ?? 160}
                onChange={(e) => updateAttendanceSettings({ standardWorkHoursPerMonthAvg: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-sm text-muted-foreground">時間</p>
            </div>
          </div>

          <Separator />

          {/* 月別設定テーブル */}
          <div>
            <p className="text-sm font-medium mb-2">月別設定</p>
          </div>
          {(!attendanceSettings.monthlyStandardWorkHours || attendanceSettings.monthlyStandardWorkHours.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">所定労働時間が設定されていません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>月</TableHead>
                  <TableHead>所定労働時間（時間）</TableHead>
                  <TableHead>所定労働日数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceSettings.monthlyStandardWorkHours.map((mh) => (
                  <TableRow key={mh.month}>
                    <TableCell className="font-medium">{monthNames[mh.month - 1]}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="250"
                        value={mh.hours}
                        onChange={(e) => updateMonthlyHours(mh.month, 'hours', parseFloat(e.target.value) || 0)}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="31"
                        value={mh.days}
                        onChange={(e) => updateMonthlyHours(mh.month, 'days', parseInt(e.target.value) || 0)}
                        className="h-8 w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
