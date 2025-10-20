'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SettingsTabProps } from '../types';

export function YearEndTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>YearEndTab</CardTitle>
        <CardDescription>設定を管理します</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">このタブは現在開発中です</p>
        <Button onClick={saveSettings} className="mt-4">保存</Button>
      </CardContent>
    </Card>
  );
}
