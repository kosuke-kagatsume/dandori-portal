'use client';

import { Card } from '@/components/ui/card';
import { BackupPanel } from '@/components/backup/backup-panel';
import type { SettingsTabProps } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DataTab({ settings: _settings, updateSettings: _updateSettings, saveSettings: _saveSettings }: SettingsTabProps) {
  return (
    <Card>
      <BackupPanel />
    </Card>
  );
}
