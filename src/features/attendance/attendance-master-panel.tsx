'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceTab } from '@/features/settings/tabs';
import { LeaveTypeMasterPanel } from '@/features/leave/leave-type-master-panel';
import { PunchRoundingPanel } from './punch-rounding-panel';
import { AlertMasterPanel } from './alert-master-panel';
import type { SimpleSettings } from '@/features/settings/types';

interface AttendanceMasterPanelProps {
  settings?: SimpleSettings;
  updateSettings?: (updates: Partial<SimpleSettings>) => void;
  saveSettings?: () => void;
}

/**
 * 勤怠マスタ統合パネル
 * サブタブ: 就業ルール / 休暇・休日 / 打刻丸め / アラート・36協定
 */
export function AttendanceMasterPanel({
  settings,
  updateSettings,
  saveSettings,
}: AttendanceMasterPanelProps) {
  // AttendanceTabに渡すためのデフォルト値
  const noop = () => {};
  const defaultSettings = settings || ({} as SimpleSettings);

  return (
    <Tabs defaultValue="work-rules" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="work-rules">就業ルール</TabsTrigger>
        <TabsTrigger value="leave-holiday">休暇・休日</TabsTrigger>
        <TabsTrigger value="punch-rounding">打刻丸め</TabsTrigger>
        <TabsTrigger value="alert-36">アラート・36協定</TabsTrigger>
      </TabsList>

      <TabsContent value="work-rules">
        <AttendanceTab
          settings={defaultSettings}
          updateSettings={updateSettings || noop}
          saveSettings={saveSettings || noop}
        />
      </TabsContent>

      <TabsContent value="leave-holiday">
        <LeaveTypeMasterPanel />
      </TabsContent>

      <TabsContent value="punch-rounding">
        <PunchRoundingPanel />
      </TabsContent>

      <TabsContent value="alert-36">
        <AlertMasterPanel />
      </TabsContent>
    </Tabs>
  );
}
