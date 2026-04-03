'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, Settings2, ListChecks } from 'lucide-react';
import type { HealthCheckup, HealthCheckupSchedule, ScheduleStatus } from '@/types/health';
import { ScheduleList } from './schedule-list';
import { ScheduleFullList, type EnrichedSchedule } from './schedule-full-list';
import { ResultsList } from './results-list';
import { HealthMasterPanel } from '../master/health-master-panel';

interface CheckupSubTabsProps {
  schedules: HealthCheckupSchedule[];
  checkups: HealthCheckup[];
  departments: string[];
  currentUserId: string;
  // 結果タブ用フィルタ
  resultSearchQuery: string;
  resultFilterDepartment: string;
  resultFilterResult: string;
  onResultSearchQueryChange: (query: string) => void;
  onResultFilterDepartmentChange: (dept: string) => void;
  onResultFilterResultChange: (result: string) => void;
  onViewCheckupDetails: (checkup: HealthCheckup) => void;
  onRefreshSchedules: () => void;
  onUpdateScheduleStatus?: (id: string, status: ScheduleStatus) => Promise<void>;
  userRoles: string[];
  // 結果登録（予定一覧から）
  onRegisterResult?: (schedule: EnrichedSchedule) => void;
  // 結果編集・削除
  onEditCheckup?: (checkup: HealthCheckup) => void;
  onDeleteCheckup?: (checkupId: string) => void;
}

export function CheckupSubTabs({
  schedules,
  checkups,
  departments,
  currentUserId,
  resultSearchQuery,
  resultFilterDepartment,
  resultFilterResult,
  onResultSearchQueryChange,
  onResultFilterDepartmentChange,
  onResultFilterResultChange,
  onViewCheckupDetails,
  onRefreshSchedules,
  onUpdateScheduleStatus,
  userRoles,
  onRegisterResult,
  onEditCheckup,
  onDeleteCheckup,
}: CheckupSubTabsProps) {
  const isAdmin = userRoles.includes('hr') || userRoles.includes('admin');
  const isHR = userRoles.includes('hr');

  // 予定タブ: ログインユーザー本人のデータのみ（A-5）
  const mySchedules = useMemo(() => {
    return schedules.filter(s => s.userId === currentUserId);
  }, [schedules, currentUserId]);

  // タブ数に応じたグリッド
  const tabCount = isHR ? 4 : isAdmin ? 3 : 2;
  const gridClass = `grid-cols-${tabCount}`;

  return (
    <Tabs defaultValue="schedule" className="space-y-4">
      <TabsList className={`grid w-full max-w-lg ${gridClass}`}>
        <TabsTrigger value="schedule" className="gap-2">
          <Calendar className="h-4 w-4" />
          予定
        </TabsTrigger>
        {isHR && (
          <TabsTrigger value="schedule-list" className="gap-2">
            <ListChecks className="h-4 w-4" />
            予定一覧
          </TabsTrigger>
        )}
        <TabsTrigger value="results" className="gap-2">
          <FileText className="h-4 w-4" />
          結果
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="master" className="gap-2">
            <Settings2 className="h-4 w-4" />
            管理
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="schedule">
        <ScheduleList schedules={mySchedules} />
      </TabsContent>

      {isHR && (
        <TabsContent value="schedule-list">
          <ScheduleFullList
            schedules={schedules}
            departments={departments}
            onRefreshSchedules={onRefreshSchedules}
            onUpdateScheduleStatus={onUpdateScheduleStatus}
            onRegisterResult={onRegisterResult}
          />
        </TabsContent>
      )}

      <TabsContent value="results">
        <ResultsList
          checkups={checkups}
          departments={departments}
          searchQuery={resultSearchQuery}
          filterDepartment={resultFilterDepartment}
          filterResult={resultFilterResult}
          onSearchQueryChange={onResultSearchQueryChange}
          onFilterDepartmentChange={onResultFilterDepartmentChange}
          onFilterResultChange={onResultFilterResultChange}
          onViewDetails={onViewCheckupDetails}
          isAdmin={isAdmin}
          onEditCheckup={onEditCheckup}
          onDeleteCheckup={onDeleteCheckup}
        />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="master">
          <HealthMasterPanel />
        </TabsContent>
      )}
    </Tabs>
  );
}
