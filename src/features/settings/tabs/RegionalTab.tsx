'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Languages, Globe, Calendar, FileDown } from 'lucide-react';
import type { SettingsTabProps, ExportTimeFormat } from '../types';

export function RegionalTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* 言語設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            <CardTitle>言語設定</CardTitle>
          </div>
          <CardDescription>表示言語を選択します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">表示言語 *</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => updateSettings({ language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* タイムゾーン設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>タイムゾーン設定</CardTitle>
          </div>
          <CardDescription>日時表示のタイムゾーンを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">タイムゾーン *</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => updateSettings({ timezone: value })}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Tokyo">日本標準時 (JST, UTC+9)</SelectItem>
                <SelectItem value="America/New_York">米国東部時間 (EST, UTC-5)</SelectItem>
                <SelectItem value="America/Los_Angeles">米国太平洋時間 (PST, UTC-8)</SelectItem>
                <SelectItem value="Europe/London">英国時間 (GMT, UTC+0)</SelectItem>
                <SelectItem value="Europe/Paris">中央ヨーロッパ時間 (CET, UTC+1)</SelectItem>
                <SelectItem value="Asia/Shanghai">中国標準時 (CST, UTC+8)</SelectItem>
                <SelectItem value="Asia/Singapore">シンガポール時間 (SGT, UTC+8)</SelectItem>
                <SelectItem value="Australia/Sydney">オーストラリア東部時間 (AEDT, UTC+11)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              日時の表示に使用するタイムゾーンを選択してください
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 日付フォーマット設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>日付フォーマット設定</CardTitle>
          </div>
          <CardDescription>日付の表示形式を選択します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateFormat">日付フォーマット *</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) => updateSettings({ dateFormat: value })}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">2025-01-31 (ISO 8601)</SelectItem>
                <SelectItem value="YYYY/MM/DD">2025/01/31</SelectItem>
                <SelectItem value="DD/MM/YYYY">31/01/2025 (英国式)</SelectItem>
                <SelectItem value="MM/DD/YYYY">01/31/2025 (米国式)</SelectItem>
                <SelectItem value="YYYY年MM月DD日">2025年01月31日 (和暦)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              システム全体で使用する日付の表示形式
            </p>
          </div>

          <Separator />

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">プレビュー</p>
            <p className="text-sm text-muted-foreground">
              今日の日付: {
                settings.dateFormat
                  .replace('YYYY', '2025')
                  .replace('MM', '01')
                  .replace('DD', '31')
                  .replace('年', '年')
                  .replace('月', '月')
                  .replace('日', '日')
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* エクスポート設定（P.22） */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            <CardTitle>エクスポート設定</CardTitle>
          </div>
          <CardDescription>CSVエクスポート時のフォーマットを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exportTimeFormat">時間フォーマット *</Label>
            <Select
              value={settings.export?.timeFormat || 'time'}
              onValueChange={(value: ExportTimeFormat) =>
                updateSettings({
                  export: { ...settings.export, timeFormat: value }
                })
              }
            >
              <SelectTrigger id="exportTimeFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">時刻表示（1:30）</SelectItem>
                <SelectItem value="hour_minute">時間+分表示（1.30）</SelectItem>
                <SelectItem value="decimal">小数点表示（1.50）</SelectItem>
                <SelectItem value="minutes">分表示（90）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              勤怠データのCSVエクスポート時に使用する時間の表示形式
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="exportEncoding">文字エンコーディング</Label>
            <Select
              value={settings.export?.encoding || 'utf-8'}
              onValueChange={(value: 'utf-8' | 'shift_jis') =>
                updateSettings({
                  export: { ...settings.export, encoding: value }
                })
              }
            >
              <SelectTrigger id="exportEncoding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utf-8">UTF-8（推奨）</SelectItem>
                <SelectItem value="shift_jis">Shift_JIS（Excel互換）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              CSVファイルの文字エンコーディング
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="exportDateFormat">エクスポート日付フォーマット</Label>
            <Select
              value={settings.export?.dateFormat || 'YYYY-MM-DD'}
              onValueChange={(value: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'MM/DD/YYYY') =>
                updateSettings({
                  export: { ...settings.export, dateFormat: value }
                })
              }
            >
              <SelectTrigger id="exportDateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YYYY-MM-DD">2025-01-31 (ISO 8601)</SelectItem>
                <SelectItem value="YYYY/MM/DD">2025/01/31</SelectItem>
                <SelectItem value="MM/DD/YYYY">01/31/2025 (米国式)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              CSVエクスポート時の日付フォーマット
            </p>
          </div>

          <Separator />

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">時間フォーマット プレビュー（1時間30分の場合）</p>
            <p className="text-sm text-muted-foreground">
              {settings.export?.timeFormat === 'time' && '1:30'}
              {settings.export?.timeFormat === 'hour_minute' && '1.30'}
              {settings.export?.timeFormat === 'decimal' && '1.50'}
              {settings.export?.timeFormat === 'minutes' && '90'}
              {!settings.export?.timeFormat && '1:30'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} size="lg">
          地域設定を保存
        </Button>
      </div>
    </div>
  );
}
