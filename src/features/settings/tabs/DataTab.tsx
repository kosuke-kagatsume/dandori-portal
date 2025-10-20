'use client';

import { Card } from '@/components/ui/card';
import { BackupPanel } from '@/components/backup/backup-panel';
import type { SettingsTabProps } from '../types';

export function DataTab({ settings, updateSettings, saveSettings }: SettingsTabProps) {
  return (
    <Card>
      <BackupPanel />
    </Card>
  );
}
