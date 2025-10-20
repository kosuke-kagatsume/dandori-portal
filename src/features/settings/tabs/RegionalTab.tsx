'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SettingsTabProps } from '../types';

export function RegionalTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>地域と言語</CardTitle>
        <CardDescription>タイムゾーン、言語、日付フォーマットを設定します</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">地域設定は現在開発中です</p>
        <Button onClick={saveSettings} className="mt-4">保存</Button>
      </CardContent>
    </Card>
  );
}
