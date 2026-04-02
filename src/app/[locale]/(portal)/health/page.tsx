'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store/user-store';
import { useHealthStore } from '@/lib/store/health-store';
import { useTenantStore } from '@/lib/store/tenant-store';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentFiscalYear } from '@/lib/utils';
import { Heart, Brain, Clock, BarChart3, Play } from 'lucide-react';
import { format } from 'date-fns';
import { useHealthRBAC } from '@/lib/hooks/use-health-rbac';
import type { HealthCheckup, StressCheck } from '@/types/health';
import {
  type FollowUpRecord, type InterviewRecord,
  mapAPICheckups, mapAPIStressChecks,
} from '@/lib/health/health-helpers';

// 既存コンポーネント
import { HealthStatsHeader } from './components/health-stats-header';
import { CheckupSubTabs } from './components/checkups/checkup-sub-tabs';
import { StressCheckFilters } from './components/stress-checks/stress-check-filters';
import { StressCheckTable } from './components/stress-checks/stress-check-table';
import { FollowUpFilters } from './components/follow-up/follow-up-filters';
import { FollowUpContent } from './components/follow-up/follow-up-content';
import { ReportContent } from './components/reports/report-content';
import { CheckupDetailDialog } from './components/dialogs/checkup-detail-dialog';
import { FollowUpDialog } from './components/dialogs/follow-up-dialog';
import { InterviewDialog } from './components/dialogs/interview-dialog';
import { CheckupRegistrationDialog } from './components/checkups/checkup-registration-dialog';

export default function HealthPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'ja';
  const currentUser = useUserStore(state => state.currentUser);
  const users = useUserStore(state => state.users);
  const fetchUsers = useUserStore(state => state.fetchUsers);
  const tenantId = currentUser?.tenantId || '';
  const currentTenant = useTenantStore(state => state.currentTenant);
  const companyName = currentTenant?.name || '';
  const userRoles = currentUser?.roles || ['employee'];
  const { canViewAllEmployees, canViewDepartmentEmployees, canManageFollowUp, selfOnly, stressCheckViewScope, canViewReports, canDownloadReports, userDepartment, userId: rbacUserId } = useHealthRBAC();

  const { schedules, fetchSchedules, updateScheduleStatus, setTenantId: setHealthStoreTenantId } = useHealthStore();

  // データ状態
  const [checkups, setCheckups] = useState<HealthCheckup[]>([]);
  const [stressChecks, setStressChecks] = useState<StressCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checkups');

  // フィルタ状態
  const [checkupSearchQuery, setCheckupSearchQuery] = useState('');
  const [checkupFilterResult, setCheckupFilterResult] = useState<string>('all');
  const [checkupFilterDepartment, setCheckupFilterDepartment] = useState<string>('all');
  const [stressSearchQuery, setStressSearchQuery] = useState('');
  const [stressFilterDepartment, setStressFilterDepartment] = useState<string>('all');
  const [stressFilterJudgment, setStressFilterJudgment] = useState<string>('all');
  const [followUpSearchQuery, setFollowUpSearchQuery] = useState('');
  const [followUpFilterDepartment, setFollowUpFilterDepartment] = useState<string>('all');
  const [followUpFilterStatus, setFollowUpFilterStatus] = useState<string>('all');
  const [reportFilterDepartment, setReportFilterDepartment] = useState<string>('all');

  // ダイアログ状態
  const [selectedCheckup, setSelectedCheckup] = useState<HealthCheckup | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedFollowUpUser, setSelectedFollowUpUser] = useState<{ id: string; name: string } | null>(null);
  const [followUpRecord, setFollowUpRecord] = useState<Partial<FollowUpRecord>>({
    followUpDate: undefined, status: 'scheduled', notes: '', nextFollowUpDate: undefined,
  });
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [selectedInterviewUser, setSelectedInterviewUser] = useState<{ id: string; name: string } | null>(null);
  const [interviewRecord, setInterviewRecord] = useState<Partial<InterviewRecord>>({
    interviewDate: undefined, interviewType: 'stress_interview', doctorName: '', notes: '', outcome: '', nextAction: '',
  });
  const [checkupRegistrationDialogOpen, setCheckupRegistrationDialogOpen] = useState(false);

  // ── RBAC ──────────────────────────────────

  const buildRbacQuery = useCallback(() => {
    if (selfOnly && rbacUserId) return `&userId=${rbacUserId}`;
    return '';
  }, [selfOnly, rbacUserId]);

  const applyDepartmentFilter = useCallback(<T extends { department?: string }>(items: T[]): T[] => {
    if (canViewAllEmployees) return items;
    if (canViewDepartmentEmployees && userDepartment) return items.filter(item => item.department === userDepartment);
    return items;
  }, [canViewAllEmployees, canViewDepartmentEmployees, userDepartment]);

  // ── データ取得 ──────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!tenantId) { setIsLoading(false); return; }
    if (selfOnly && !rbacUserId) { setIsLoading(false); return; }

    const rbacQuery = buildRbacQuery();
    setIsLoading(true);
    try {
      const [checkupsRes, stressRes] = await Promise.all([
        fetch(`/api/health/checkups?tenantId=${tenantId}${rbacQuery}`),
        fetch(`/api/health/stress-checks?tenantId=${tenantId}${rbacQuery}`),
      ]);

      if (checkupsRes.ok) {
        const data = await checkupsRes.json();
        setCheckups(applyDepartmentFilter(mapAPICheckups(data.data || [])));
      }
      if (stressRes.ok) {
        const data = await stressRes.json();
        setStressChecks(applyDepartmentFilter(mapAPIStressChecks(data.data || [])));
      }

      setHealthStoreTenantId(tenantId);
      await fetchSchedules(undefined, selfOnly ? rbacUserId : undefined);
    } catch (error) {
      console.error('健康管理データの取得に失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, setHealthStoreTenantId, fetchSchedules, buildRbacQuery, applyDepartmentFilter, selfOnly, rbacUserId]);

  useEffect(() => {
    fetchData();
    if (users.length === 0) fetchUsers();
  }, [fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 派生データ ──────────────────────────────────

  const filteredSchedules = useMemo(() => {
    if (canViewAllEmployees || selfOnly) return schedules;
    if (canViewDepartmentEmployees && userDepartment) return schedules.filter(s => s.departmentName === userDepartment);
    return schedules;
  }, [schedules, canViewAllEmployees, canViewDepartmentEmployees, selfOnly, userDepartment]);

  const stats = useMemo(() => {
    let totalEmployees: number;
    if (selfOnly) totalEmployees = 1;
    else if (canViewDepartmentEmployees && userDepartment) totalEmployees = users.filter(u => u.department === userDepartment).length || 1;
    else totalEmployees = users.length > 0 ? users.length : checkups.length;

    const completed = new Set(checkups.map(c => c.userId)).size;
    return {
      totalEmployees,
      completed,
      completionRate: totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 0,
      requiresReexam: checkups.filter(c => c.requiresReexam).length,
      requiresTreatment: checkups.filter(c => c.requiresTreatment).length,
      highStress: stressChecks.filter(s => s.isHighStress).length,
      stressCheckCompletionRate: stressChecks.length > 0
        ? Math.round((stressChecks.filter(s => s.status !== 'pending').length / stressChecks.length) * 100) : 0,
    };
  }, [checkups, stressChecks, users, selfOnly, canViewDepartmentEmployees, userDepartment]);

  const filteredStressChecks = useMemo(() => {
    return stressChecks.filter(check => {
      if (stressCheckViewScope === 'self' && check.userId !== rbacUserId) return false;
      if (stressCheckViewScope === 'department' && check.department !== userDepartment) return false;
      const q = stressSearchQuery.toLowerCase();
      const matchesSearch = !stressSearchQuery ||
        check.userName.toLowerCase().includes(q) ||
        (check.checkDate && format(new Date(check.checkDate), 'yyyy/MM/dd').includes(q));
      const matchesDepartment = stressFilterDepartment === 'all' || check.department === stressFilterDepartment;
      const matchesJudgment = stressFilterJudgment === 'all' ||
        (stressFilterJudgment === 'high_stress' && check.isHighStress) ||
        (stressFilterJudgment === 'normal' && !check.isHighStress);
      return matchesSearch && matchesDepartment && matchesJudgment;
    });
  }, [stressChecks, stressSearchQuery, stressFilterDepartment, stressFilterJudgment, stressCheckViewScope, rbacUserId, userDepartment]);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    checkups.forEach(c => { if (c.department) depts.add(c.department); });
    stressChecks.forEach(s => { if (s.department) depts.add(s.department); });
    filteredSchedules.forEach(s => { if (s.departmentName) depts.add(s.departmentName); });
    return Array.from(depts).sort();
  }, [checkups, stressChecks, filteredSchedules]);

  // ── ダイアログハンドラー ──────────────────────────────────

  const handleOpenFollowUpDialog = (userId: string, userName: string) => {
    setSelectedFollowUpUser({ id: userId, name: userName });
    setFollowUpRecord({ followUpDate: new Date(), status: 'scheduled', notes: '', nextFollowUpDate: undefined });
    setFollowUpDialogOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!selectedFollowUpUser || !followUpRecord.followUpDate) {
      toast.error('フォロー日を選択してください');
      return;
    }
    try {
      const res = await fetch('/api/health/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedFollowUpUser.id,
          userName: selectedFollowUpUser.name,
          followUpDate: followUpRecord.followUpDate.toISOString(),
          status: followUpRecord.status || 'scheduled',
          notes: followUpRecord.notes,
          nextFollowUpDate: followUpRecord.nextFollowUpDate?.toISOString() || null,
        }),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
      toast.success('フォロー記録を保存しました');
      setFollowUpDialogOpen(false);
    } catch {
      toast.error('フォロー記録の保存に失敗しました');
    }
  };

  const handleOpenInterviewDialog = (userId: string, userName: string) => {
    setSelectedInterviewUser({ id: userId, name: userName });
    setInterviewRecord({ interviewDate: new Date(), interviewType: 'stress_interview', doctorName: '', notes: '', outcome: '', nextAction: '' });
    setInterviewDialogOpen(true);
  };

  const handleSaveInterview = async () => {
    if (!selectedInterviewUser || !interviewRecord.interviewDate) {
      toast.error('面談日を選択してください');
      return;
    }
    const interviewTypeLabel = {
      stress_interview: 'ストレスチェック面談',
      health_guidance: '保健指導',
      return_to_work: '復職面談',
    }[interviewRecord.interviewType || 'stress_interview'];

    const notesText = [
      `【面談種別】${interviewTypeLabel}`,
      interviewRecord.doctorName ? `【担当】${interviewRecord.doctorName}` : '',
      interviewRecord.notes ? `【面談内容】${interviewRecord.notes}` : '',
      interviewRecord.outcome ? `【結果・所見】${interviewRecord.outcome}` : '',
      interviewRecord.nextAction ? `【今後の対応】${interviewRecord.nextAction}` : '',
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/health/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedInterviewUser.id,
          userName: selectedInterviewUser.name,
          followUpDate: interviewRecord.interviewDate.toISOString(),
          status: 'completed',
          notes: notesText,
          assignedTo: interviewRecord.doctorName || undefined,
        }),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
      toast.success('面談記録を保存しました');
      setInterviewDialogOpen(false);
    } catch {
      toast.error('面談記録の保存に失敗しました');
    }
  };

  // ── ローディング ──────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // ── 描画 ──────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">健康管理</h1>
          <p className="text-muted-foreground">健康診断・ストレスチェックを一元管理</p>
        </div>
      </div>

      <HealthStatsHeader {...stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
        <TabsList className={`grid w-full ${canViewAllEmployees ? 'grid-cols-4' : canManageFollowUp ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="checkups"><Heart className="mr-2 h-4 w-4" />健康診断</TabsTrigger>
          <TabsTrigger value="stress"><Brain className="mr-2 h-4 w-4" />ストレスチェック</TabsTrigger>
          {canManageFollowUp && <TabsTrigger value="followup"><Clock className="mr-2 h-4 w-4" />フォローアップ</TabsTrigger>}
          {canViewReports && <TabsTrigger value="reports"><BarChart3 className="mr-2 h-4 w-4" />レポート</TabsTrigger>}
        </TabsList>

        <TabsContent value="checkups">
          <CheckupSubTabs
            schedules={filteredSchedules} checkups={checkups} departments={departments}
            currentUserId={rbacUserId}
            resultSearchQuery={checkupSearchQuery} resultFilterDepartment={checkupFilterDepartment} resultFilterResult={checkupFilterResult}
            onResultSearchQueryChange={setCheckupSearchQuery} onResultFilterDepartmentChange={setCheckupFilterDepartment} onResultFilterResultChange={setCheckupFilterResult}
            onViewCheckupDetails={(c) => { setSelectedCheckup(c); setDetailDialogOpen(true); }}
            onRefreshSchedules={() => fetchSchedules()} onUpdateScheduleStatus={updateScheduleStatus}
            userRoles={userRoles}
          />
        </TabsContent>

        <TabsContent value="stress">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>ストレスチェック結果一覧</CardTitle>
                <CardDescription>{getCurrentFiscalYear()}年度 ストレスチェック実施状況</CardDescription>
              </div>
              <Button onClick={() => router.push(`/${locale}/health/stress-check/take`)}>
                <Play className="mr-2 h-4 w-4" />ストレスチェックを受検
              </Button>
            </CardHeader>
            <CardContent>
              <StressCheckFilters
                searchQuery={stressSearchQuery} filterDepartment={stressFilterDepartment} filterJudgment={stressFilterJudgment}
                departments={departments}
                onSearchQueryChange={setStressSearchQuery} onFilterDepartmentChange={setStressFilterDepartment} onFilterJudgmentChange={setStressFilterJudgment}
              />
              <StressCheckTable stressChecks={filteredStressChecks} />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageFollowUp && (
          <TabsContent value="followup">
            <FollowUpFilters
              searchQuery={followUpSearchQuery} filterDepartment={followUpFilterDepartment} filterStatus={followUpFilterStatus}
              departments={departments}
              onSearchQueryChange={setFollowUpSearchQuery} onFilterDepartmentChange={setFollowUpFilterDepartment} onFilterStatusChange={setFollowUpFilterStatus}
            />
            <FollowUpContent
              checkups={checkups} stressChecks={stressChecks}
              filterDepartment={followUpFilterDepartment} searchQuery={followUpSearchQuery} filterStatus={followUpFilterStatus}
              onOpenFollowUp={handleOpenFollowUpDialog} onOpenInterview={handleOpenInterviewDialog}
            />
          </TabsContent>
        )}

        {canViewReports && (
          <TabsContent value="reports">
            <ReportContent
              checkups={checkups} stressChecks={stressChecks} filteredStressChecks={filteredStressChecks}
              departments={departments} filterDepartment={reportFilterDepartment} onFilterDepartmentChange={setReportFilterDepartment}
              canDownloadReports={canDownloadReports} companyName={companyName}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* ダイアログ群 */}
      <CheckupDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} checkup={selectedCheckup} />
      <FollowUpDialog
        open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}
        userName={selectedFollowUpUser?.name} record={followUpRecord} onRecordChange={setFollowUpRecord} onSave={handleSaveFollowUp}
      />
      <InterviewDialog
        open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}
        userName={selectedInterviewUser?.name} record={interviewRecord} onRecordChange={setInterviewRecord} onSave={handleSaveInterview}
      />
      <CheckupRegistrationDialog
        open={checkupRegistrationDialogOpen} onOpenChange={setCheckupRegistrationDialogOpen}
        tenantId={tenantId} onSuccess={fetchData}
      />
    </div>
  );
}
