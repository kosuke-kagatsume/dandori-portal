'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, Settings2 } from 'lucide-react';
import type { HealthCheckup, HealthCheckupSchedule, ScheduleStatus } from '@/types/health';
import { ScheduleList } from './schedule-list';
import { ResultsList } from './results-list';
import { HealthMasterPanel } from '../master/health-master-panel';

interface CheckupSubTabsProps {
  schedules: HealthCheckupSchedule[];
  checkups: HealthCheckup[];
  departments: string[];
  searchQuery: string;
  filterDepartment: string;
  filterResult: string;
  onSearchQueryChange: (query: string) => void;
  onFilterDepartmentChange: (dept: string) => void;
  onFilterResultChange: (result: string) => void;
  onViewCheckupDetails: (checkup: HealthCheckup) => void;
  onRefreshSchedules: () => void;
  onUpdateScheduleStatus?: (id: string, status: ScheduleStatus) => Promise<void>;
  userRoles: string[];
}

export function CheckupSubTabs({
  schedules,
  checkups,
  departments,
  searchQuery,
  filterDepartment,
  filterResult,
  onSearchQueryChange,
  onFilterDepartmentChange,
  onFilterResultChange,
  onViewCheckupDetails,
  onRefreshSchedules,
  onUpdateScheduleStatus,
  userRoles,
}: CheckupSubTabsProps) {
  const isAdmin = userRoles.includes('hr') || userRoles.includes('admin');

  return (
    <Tabs defaultValue="schedule" className="space-y-4">
      <TabsList className={`grid w-full max-w-md ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <TabsTrigger value="schedule" className="gap-2">
          <Calendar className="h-4 w-4" />
          予定
        </TabsTrigger>
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
        <ScheduleList
          schedules={schedules}
          departments={departments}
          searchQuery={searchQuery}
          filterDepartment={filterDepartment}
          onSearchQueryChange={onSearchQueryChange}
          onFilterDepartmentChange={onFilterDepartmentChange}
          onRefresh={onRefreshSchedules}
          onUpdateStatus={onUpdateScheduleStatus}
          isAdmin={isAdmin}
        />
      </TabsContent>

      <TabsContent value="results">
        <ResultsList
          checkups={checkups}
          departments={departments}
          searchQuery={searchQuery}
          filterDepartment={filterDepartment}
          filterResult={filterResult}
          onSearchQueryChange={onSearchQueryChange}
          onFilterDepartmentChange={onFilterDepartmentChange}
          onFilterResultChange={onFilterResultChange}
          onViewDetails={onViewCheckupDetails}
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
