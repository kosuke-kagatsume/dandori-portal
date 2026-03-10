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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, getFiscalYear, getCurrentFiscalYear } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import {
  Heart,
  Plus,
  AlertTriangle,
  FileText,
  Download,
  Brain,
  TrendingUp,
  Clock,
  BarChart3,
  Play,
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import {
  exportHealthCheckupsToCSV,
  exportFindingsListToCSV,
  exportStressChecksToCSV,
  type HealthCheckupExport,
  type StressCheckExport,
} from '@/lib/csv/csv-export';
import {
  downloadIndustrialPhysicianReportPDF,
  downloadHighStressListPDF,
  downloadHealthCheckupSummaryPDF,
  type HealthCheckupForPDF,
  type StressCheckForPDF,
} from '@/lib/pdf/health-report-pdf';
import type { HealthCheckup, StressCheck, OverallResult, CheckupType, FollowUpStatus, StressCheckStatus } from '@/types/health';

// Components
import { HealthStatsHeader } from './components/health-stats-header';
import { CheckupSubTabs } from './components/checkups/checkup-sub-tabs';
import { StressCheckFilters } from './components/stress-checks/stress-check-filters';
import { FollowUpFilters } from './components/follow-up/follow-up-filters';
import { CheckupRegistrationDialog } from './components/checkups/checkup-registration-dialog';
import { useHealthRBAC } from '@/lib/hooks/use-health-rbac';

// APIからのレスポンス型
interface APIHealthCheckup {
  id: string;
  userId: string;
  userName: string;
  department?: string;
  checkupDate: string;
  checkupType: string;
  medicalInstitution: string;
  overallResult: string;
  requiresReexam: boolean;
  requiresTreatment: boolean;
  requiresGuidance?: boolean;
  height?: number;
  weight?: number;
  bmi?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  followUpStatus?: string;
  doctorOpinion?: string;
  findings?: Array<{ finding: string }>;
}

interface APIStressCheck {
  id: string;
  userId: string;
  userName: string;
  department?: string;
  fiscalYear: number;
  checkDate: string;
  status: string;
  stressFactorsScore?: number;
  stressResponseScore?: number;
  socialSupportScore?: number;
  isHighStress: boolean;
  interviewRequested: boolean;
  interviewDate?: string;
}

// 結果バッジの色を取得
const getResultBadgeColor = (result: OverallResult) => {
  switch (result) {
    case 'A':
      return 'bg-green-100 text-green-800';
    case 'B':
      return 'bg-blue-100 text-blue-800';
    case 'C':
      return 'bg-yellow-100 text-yellow-800';
    case 'D':
      return 'bg-orange-100 text-orange-800';
    case 'E':
      return 'bg-red-100 text-red-800';
  }
};

const getResultLabel = (result: OverallResult) => {
  switch (result) {
    case 'A':
      return '異常なし';
    case 'B':
      return '軽度異常';
    case 'C':
      return '要経過観察';
    case 'D':
      return '要精密検査';
    case 'E':
      return '要治療';
  }
};

// 結果別の色設定
const resultColorMap: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#eab308',
  D: '#f97316',
  E: '#ef4444',
};
const resultLabelMap: Record<string, string> = {
  A: 'A: 異常なし',
  B: 'B: 軽度異常',
  C: 'C: 要経過観察',
  D: 'D: 要精密検査',
  E: 'E: 要治療',
};

// フォロー記録用の型
interface FollowUpRecord {
  id: string;
  userId: string;
  userName: string;
  followUpDate: Date | undefined;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  nextFollowUpDate: Date | undefined;
}

// 面談記録用の型
interface InterviewRecord {
  id: string;
  userId: string;
  userName: string;
  interviewDate: Date | undefined;
  interviewType: 'stress_interview' | 'health_guidance' | 'return_to_work';
  doctorName: string;
  notes: string;
  outcome: string;
  nextAction: string;
}

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
  const { canRegisterResults, canViewAllEmployees, canViewDepartmentEmployees, canManageFollowUp, selfOnly, userDepartment, userId: rbacUserId } = useHealthRBAC();

  // 健診予定ストア
  const { schedules, fetchSchedules, updateScheduleStatus, setTenantId: setHealthStoreTenantId } = useHealthStore();

  // APIからのデータ
  const [checkups, setCheckups] = useState<HealthCheckup[]>([]);
  const [stressChecks, setStressChecks] = useState<StressCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('checkups');

  // タブごとに独立したフィルタ状態
  // 健康診断 - 予定サブタブ
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleFilterDepartment, setScheduleFilterDepartment] = useState<string>('all');
  // 健康診断 - 結果サブタブ
  const [checkupSearchQuery, setCheckupSearchQuery] = useState('');
  const [checkupFilterResult, setCheckupFilterResult] = useState<string>('all');
  const [checkupFilterDepartment, setCheckupFilterDepartment] = useState<string>('all');
  // ストレスチェックタブ
  const [stressSearchQuery, setStressSearchQuery] = useState('');
  const [stressFilterDepartment, setStressFilterDepartment] = useState<string>('all');
  const [stressFilterJudgment, setStressFilterJudgment] = useState<string>('all');
  // フォローアップタブ
  const [followUpSearchQuery, setFollowUpSearchQuery] = useState('');
  const [followUpFilterDepartment, setFollowUpFilterDepartment] = useState<string>('all');
  const [followUpFilterStatus, setFollowUpFilterStatus] = useState<string>('all');
  // レポートタブ
  const [reportFilterDepartment, setReportFilterDepartment] = useState<string>('all');
  const [selectedCheckup, setSelectedCheckup] = useState<HealthCheckup | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // RBAC: APIクエリにユーザー制限を適用
  const buildRbacQuery = useCallback(() => {
    if (selfOnly && rbacUserId) {
      return `&userId=${rbacUserId}`;
    }
    return '';
  }, [selfOnly, rbacUserId]);

  // RBAC: 部署フィルタ（フロントエンド側）
  const applyDepartmentFilter = useCallback(<T extends { department?: string }>(items: T[]): T[] => {
    if (canViewAllEmployees) return items;
    if (canViewDepartmentEmployees && userDepartment) {
      return items.filter(item => item.department === userDepartment);
    }
    return items; // selfOnlyの場合はAPI側でフィルタ済み
  }, [canViewAllEmployees, canViewDepartmentEmployees, userDepartment]);

  // APIからデータを取得
  const fetchData = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    // RBAC: selfOnlyだがuserIdが未取得（ハイドレーション中）→ スキップ
    if (selfOnly && !rbacUserId) {
      setIsLoading(false);
      return;
    }

    const rbacQuery = buildRbacQuery();

    setIsLoading(true);
    try {
      // 健康診断データを取得
      const checkupsRes = await fetch(`/api/health/checkups?tenantId=${tenantId}${rbacQuery}`);
      if (checkupsRes.ok) {
        const checkupsData = await checkupsRes.json();
        const apiCheckups: APIHealthCheckup[] = checkupsData.data || [];
        const mappedCheckups: HealthCheckup[] = apiCheckups.map(c => ({
          id: c.id,
          userId: c.userId,
          userName: c.userName,
          department: c.department || '',
          checkupDate: new Date(c.checkupDate),
          checkupType: (c.checkupType as CheckupType) || 'regular',
          medicalInstitution: c.medicalInstitution,
          overallResult: (c.overallResult as OverallResult) || 'A',
          requiresReexam: c.requiresReexam,
          requiresTreatment: c.requiresTreatment,
          requiresGuidance: c.requiresGuidance ?? false,
          height: c.height,
          weight: c.weight,
          bmi: c.bmi,
          bloodPressureSystolic: c.bloodPressureSystolic,
          bloodPressureDiastolic: c.bloodPressureDiastolic,
          followUpStatus: (c.followUpStatus as FollowUpStatus) || 'none',
          doctorOpinion: c.doctorOpinion,
          findings: c.findings?.map(f => f.finding) || [],
        }));
        setCheckups(applyDepartmentFilter(mappedCheckups));
      }

      // ストレスチェックデータを取得
      const stressRes = await fetch(`/api/health/stress-checks?tenantId=${tenantId}${rbacQuery}`);
      if (stressRes.ok) {
        const stressData = await stressRes.json();
        const apiStress: APIStressCheck[] = stressData.data || [];
        const mappedStress: StressCheck[] = apiStress.map(s => ({
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          department: s.department || '',
          fiscalYear: s.fiscalYear,
          checkDate: new Date(s.checkDate),
          status: (s.status as StressCheckStatus) || 'pending',
          stressFactorsScore: s.stressFactorsScore ?? 0,
          stressResponseScore: s.stressResponseScore ?? 0,
          socialSupportScore: s.socialSupportScore ?? 0,
          isHighStress: s.isHighStress,
          interviewRequested: s.interviewRequested,
          interviewDate: s.interviewDate ? new Date(s.interviewDate) : undefined,
        }));
        setStressChecks(applyDepartmentFilter(mappedStress));
      }

      // 健診予定データを取得（RBAC: selfOnlyなら自分のみ）
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

  // RBAC: スケジュールの部署フィルタ（managerの場合）
  const filteredSchedules = useMemo(() => {
    if (canViewAllEmployees || selfOnly) return schedules; // selfOnlyはAPI側でフィルタ済み
    if (canViewDepartmentEmployees && userDepartment) {
      return schedules.filter(s => s.departmentName === userDepartment);
    }
    return schedules;
  }, [schedules, canViewAllEmployees, canViewDepartmentEmployees, selfOnly, userDepartment]);

  // フォロー記録ダイアログ用state
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedFollowUpUser, setSelectedFollowUpUser] = useState<{ id: string; name: string } | null>(null);
  const [followUpRecord, setFollowUpRecord] = useState<Partial<FollowUpRecord>>({
    followUpDate: undefined,
    status: 'scheduled',
    notes: '',
    nextFollowUpDate: undefined,
  });

  // 面談記録ダイアログ用state
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [selectedInterviewUser, setSelectedInterviewUser] = useState<{ id: string; name: string } | null>(null);
  const [interviewRecord, setInterviewRecord] = useState<Partial<InterviewRecord>>({
    interviewDate: undefined,
    interviewType: 'stress_interview',
    doctorName: '',
    notes: '',
    outcome: '',
    nextAction: '',
  });

  // 健診結果登録ダイアログ用state
  const [checkupRegistrationDialogOpen, setCheckupRegistrationDialogOpen] = useState(false);

  // 統計データを計算
  const stats = useMemo(() => {
    // 総従業員数: RBAC制限時は閲覧可能範囲に合わせる
    let totalEmployees: number;
    if (selfOnly) {
      totalEmployees = 1; // 自分のみ
    } else if (canViewDepartmentEmployees && userDepartment) {
      totalEmployees = users.filter(u => u.department === userDepartment).length || 1;
    } else {
      totalEmployees = users.length > 0 ? users.length : checkups.length;
    }
    // 受診済み = 健診レコードのユニークユーザー数
    const completedUserIds = new Set(checkups.map(c => c.userId));
    const completed = completedUserIds.size;
    const requiresReexam = checkups.filter((c) => c.requiresReexam).length;
    const requiresTreatment = checkups.filter((c) => c.requiresTreatment).length;
    const highStress = stressChecks.filter((s) => s.isHighStress).length;
    const stressCheckCompletionRate = stressChecks.length > 0
      ? Math.round((stressChecks.filter((s) => s.status !== 'pending').length / stressChecks.length) * 100)
      : 0;

    return {
      totalEmployees,
      completed,
      completionRate: totalEmployees > 0 ? Math.round((completed / totalEmployees) * 100) : 0,
      requiresReexam,
      requiresTreatment,
      highStress,
      stressCheckCompletionRate,
    };
  }, [checkups, stressChecks, users, selfOnly, canViewDepartmentEmployees, userDepartment]);

  // フィルタリングされたストレスチェックデータ
  const filteredStressChecks = useMemo(() => {
    return stressChecks.filter((check) => {
      const matchesSearch =
        check.userName.toLowerCase().includes(stressSearchQuery.toLowerCase()) ||
        (check.department?.toLowerCase().includes(stressSearchQuery.toLowerCase()) ?? false);
      const matchesDepartment = stressFilterDepartment === 'all' || check.department === stressFilterDepartment;
      const matchesJudgment = stressFilterJudgment === 'all' ||
        (stressFilterJudgment === 'high_stress' && check.isHighStress) ||
        (stressFilterJudgment === 'normal' && !check.isHighStress);
      return matchesSearch && matchesDepartment && matchesJudgment;
    });
  }, [stressChecks, stressSearchQuery, stressFilterDepartment, stressFilterJudgment]);

  // 部門リスト（全データソースから導出）
  const departments = useMemo(() => {
    const depts = new Set<string>();
    checkups.forEach(c => { if (c.department) depts.add(c.department); });
    stressChecks.forEach(s => { if (s.department) depts.add(s.department); });
    filteredSchedules.forEach(s => { if (s.departmentName) depts.add(s.departmentName); });
    return Array.from(depts).sort();
  }, [checkups, stressChecks, filteredSchedules]);

  // レポート用: 健康診断結果分布（実データ）
  const checkupResultDistribution = useMemo(() => {
    // レポート部署フィルタ適用
    const filtered = reportFilterDepartment === 'all'
      ? checkups
      : checkups.filter(c => c.department === reportFilterDepartment);
    const counts: Record<string, number> = {};
    filtered.forEach(c => {
      counts[c.overallResult] = (counts[c.overallResult] || 0) + 1;
    });
    return ['A', 'B', 'C', 'D', 'E'].map(r => ({
      name: resultLabelMap[r] || r,
      value: counts[r] || 0,
      color: resultColorMap[r] || '#999',
    })).filter(d => d.value > 0);
  }, [checkups, reportFilterDepartment]);

  // レポート用: 有所見率（所見ありの割合）
  const findingsRateData = useMemo(() => {
    const filtered = reportFilterDepartment === 'all'
      ? checkups
      : checkups.filter(c => c.department === reportFilterDepartment);
    // 年度ごとに集計（4月起算）
    const byYear: Record<number, { total: number; withFindings: number }> = {};
    filtered.forEach(c => {
      const year = getFiscalYear(c.checkupDate);
      if (!byYear[year]) byYear[year] = { total: 0, withFindings: 0 };
      byYear[year].total++;
      if (c.overallResult !== 'A') byYear[year].withFindings++;
    });
    return Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, data]) => ({
        year,
        rate: data.total > 0 ? Math.round((data.withFindings / data.total) * 100) : 0,
      }));
  }, [checkups, reportFilterDepartment]);

  // レポート用: 部署別ストレス傾向（実データ）
  const stressByDepartmentData = useMemo(() => {
    const filtered = reportFilterDepartment === 'all'
      ? stressChecks
      : stressChecks.filter(s => s.department === reportFilterDepartment);
    const byDept: Record<string, { factors: number[]; response: number[]; support: number[] }> = {};
    filtered.forEach(s => {
      const dept = s.department || '未設定';
      if (!byDept[dept]) byDept[dept] = { factors: [], response: [], support: [] };
      byDept[dept].factors.push(s.stressFactorsScore);
      byDept[dept].response.push(s.stressResponseScore);
      byDept[dept].support.push(s.socialSupportScore);
    });
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    return Object.entries(byDept).map(([dept, data]) => ({
      department: dept,
      stressFactors: avg(data.factors),
      stressResponse: avg(data.response),
      support: avg(data.support),
    }));
  }, [stressChecks, reportFilterDepartment]);

  const handleViewDetails = (checkup: HealthCheckup) => {
    setSelectedCheckup(checkup);
    setDetailDialogOpen(true);
  };

  // フォロー記録ダイアログを開く
  const handleOpenFollowUpDialog = (userId: string, userName: string) => {
    setSelectedFollowUpUser({ id: userId, name: userName });
    setFollowUpRecord({
      followUpDate: new Date(),
      status: 'scheduled',
      notes: '',
      nextFollowUpDate: undefined,
    });
    setFollowUpDialogOpen(true);
  };

  // フォロー記録を保存（API接続）
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

  // 面談記録ダイアログを開く
  const handleOpenInterviewDialog = (userId: string, userName: string) => {
    setSelectedInterviewUser({ id: userId, name: userName });
    setInterviewRecord({
      interviewDate: new Date(),
      interviewType: 'stress_interview',
      doctorName: '',
      notes: '',
      outcome: '',
      nextAction: '',
    });
    setInterviewDialogOpen(true);
  };

  // 面談記録を保存（API接続 - フォローアップ記録として保存）
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

  // (健診結果登録はCheckupRegistrationDialogコンポーネントに抽出済み)

  // CSV出力ハンドラー
  const handleExportHealthCheckups = () => {
    const exportData: HealthCheckupExport[] = checkups.map((checkup) => ({
      id: checkup.id,
      userId: checkup.userId,
      userName: checkup.userName,
      departmentName: checkup.department || '',
      checkupDate: format(checkup.checkupDate, 'yyyy-MM-dd'),
      checkupType: checkup.checkupType,
      medicalInstitution: checkup.medicalInstitution,
      fiscalYear: getFiscalYear(checkup.checkupDate),
      overallResult: checkup.overallResult,
      requiresReexam: checkup.requiresReexam,
      requiresTreatment: checkup.requiresTreatment,
      requiresGuidance: checkup.requiresGuidance || false,
      height: checkup.height,
      weight: checkup.weight,
      bmi: checkup.bmi,
      bloodPressureSystolic: checkup.bloodPressureSystolic,
      bloodPressureDiastolic: checkup.bloodPressureDiastolic,
      followUpStatus: checkup.followUpStatus,
      findings: checkup.findings,
    }));
    exportHealthCheckupsToCSV(exportData);
  };

  const handleExportFindingsList = () => {
    const exportData: HealthCheckupExport[] = checkups.map((checkup) => ({
      id: checkup.id,
      userId: checkup.userId,
      userName: checkup.userName,
      departmentName: checkup.department || '',
      checkupDate: format(checkup.checkupDate, 'yyyy-MM-dd'),
      checkupType: checkup.checkupType,
      medicalInstitution: checkup.medicalInstitution,
      fiscalYear: getFiscalYear(checkup.checkupDate),
      overallResult: checkup.overallResult,
      requiresReexam: checkup.requiresReexam,
      requiresTreatment: checkup.requiresTreatment,
      requiresGuidance: checkup.requiresGuidance || false,
      height: checkup.height,
      weight: checkup.weight,
      bmi: checkup.bmi,
      bloodPressureSystolic: checkup.bloodPressureSystolic,
      bloodPressureDiastolic: checkup.bloodPressureDiastolic,
      followUpStatus: checkup.followUpStatus,
      findings: checkup.findings,
    }));
    exportFindingsListToCSV(exportData);
  };

  const handleExportStressChecks = () => {
    const exportData: StressCheckExport[] = filteredStressChecks.map((check) => ({
      id: check.id,
      userId: check.userId,
      userName: check.userName,
      departmentName: check.department || '',
      fiscalYear: check.fiscalYear,
      checkDate: format(check.checkDate, 'yyyy-MM-dd'),
      status: check.status,
      stressFactorsScore: check.stressFactorsScore,
      stressResponseScore: check.stressResponseScore,
      socialSupportScore: check.socialSupportScore,
      totalScore: check.stressFactorsScore + check.stressResponseScore + check.socialSupportScore,
      isHighStress: check.isHighStress,
      highStressReason: check.isHighStress ? 'ストレス度合いが高い' : undefined,
      interviewRequested: check.interviewRequested,
      interviewScheduled: false,
      interviewCompleted: false,
    }));
    exportStressChecksToCSV(exportData);
  };

  // PDF出力ハンドラー
  const handleExportIndustrialPhysicianReportPDF = async () => {
    const checkupData: HealthCheckupForPDF[] = checkups.map((checkup) => ({
      id: checkup.id,
      userId: checkup.userId,
      userName: checkup.userName,
      departmentName: checkup.department || '',
      checkupDate: checkup.checkupDate,
      checkupType: checkup.checkupType,
      medicalInstitution: checkup.medicalInstitution,
      fiscalYear: getFiscalYear(checkup.checkupDate),
      overallResult: checkup.overallResult,
      requiresReexam: checkup.requiresReexam,
      requiresTreatment: checkup.requiresTreatment,
      requiresGuidance: checkup.requiresGuidance || false,
      height: checkup.height,
      weight: checkup.weight,
      bmi: checkup.bmi,
      bloodPressureSystolic: checkup.bloodPressureSystolic,
      bloodPressureDiastolic: checkup.bloodPressureDiastolic,
      followUpStatus: checkup.followUpStatus,
      findings: checkup.findings?.map((f) => ({
        category: f,
        finding: f,
        severity: 'warning',
      })),
    }));

    const stressData: StressCheckForPDF[] = filteredStressChecks.map((check) => ({
      id: check.id,
      userId: check.userId,
      userName: check.userName,
      departmentName: check.department || '',
      fiscalYear: check.fiscalYear,
      checkDate: check.checkDate,
      status: check.status,
      stressFactorsScore: check.stressFactorsScore,
      stressResponseScore: check.stressResponseScore,
      socialSupportScore: check.socialSupportScore,
      totalScore: check.stressFactorsScore + check.stressResponseScore + check.socialSupportScore,
      isHighStress: check.isHighStress,
      highStressReason: check.isHighStress ? 'ストレス度合いが高い' : undefined,
      interviewRequested: check.interviewRequested,
      interviewScheduled: false,
      interviewCompleted: false,
    }));

    await downloadIndustrialPhysicianReportPDF(
      checkupData,
      stressData,
      getCurrentFiscalYear(),
      companyName
    );
  };

  const handleExportHighStressListPDF = async () => {
    const stressData: StressCheckForPDF[] = filteredStressChecks.map((check) => ({
      id: check.id,
      userId: check.userId,
      userName: check.userName,
      departmentName: check.department || '',
      fiscalYear: check.fiscalYear,
      checkDate: check.checkDate,
      status: check.status,
      stressFactorsScore: check.stressFactorsScore,
      stressResponseScore: check.stressResponseScore,
      socialSupportScore: check.socialSupportScore,
      totalScore: check.stressFactorsScore + check.stressResponseScore + check.socialSupportScore,
      isHighStress: check.isHighStress,
      highStressReason: check.isHighStress ? 'ストレス度合いが高い' : undefined,
      interviewRequested: check.interviewRequested,
      interviewScheduled: false,
      interviewCompleted: false,
    }));

    await downloadHighStressListPDF(stressData, getCurrentFiscalYear());
  };

  const handleExportHealthCheckupSummaryPDF = async () => {
    const checkupData: HealthCheckupForPDF[] = checkups.map((checkup) => ({
      id: checkup.id,
      userId: checkup.userId,
      userName: checkup.userName,
      departmentName: checkup.department || '',
      checkupDate: checkup.checkupDate,
      checkupType: checkup.checkupType,
      medicalInstitution: checkup.medicalInstitution,
      fiscalYear: getFiscalYear(checkup.checkupDate),
      overallResult: checkup.overallResult,
      requiresReexam: checkup.requiresReexam,
      requiresTreatment: checkup.requiresTreatment,
      requiresGuidance: checkup.requiresGuidance || false,
      height: checkup.height,
      weight: checkup.weight,
      bmi: checkup.bmi,
      bloodPressureSystolic: checkup.bloodPressureSystolic,
      bloodPressureDiastolic: checkup.bloodPressureDiastolic,
      followUpStatus: checkup.followUpStatus,
      findings: checkup.findings?.map((f) => ({
        category: f,
        finding: f,
        severity: 'warning',
      })),
    }));

    await downloadHealthCheckupSummaryPDF(checkupData, getCurrentFiscalYear());
  };

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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">健康管理</h1>
          <p className="text-muted-foreground">
            従業員の健康診断・ストレスチェックを管理します
          </p>
        </div>
        <div className="flex gap-2">
          {canViewAllEmployees && (
            <Button variant="outline" onClick={() => setActiveTab('reports')}>
              <Download className="mr-2 h-4 w-4" />
              レポート出力
            </Button>
          )}
          {canRegisterResults && (
            <Button onClick={() => setCheckupRegistrationDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              健診結果登録
            </Button>
          )}
        </div>
      </div>

      {/* 統計カード */}
      <HealthStatsHeader {...stats} />

      {/* メインコンテンツ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
        <TabsList className={`grid w-full ${canViewAllEmployees ? 'grid-cols-4' : canManageFollowUp ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="checkups">
            <Heart className="mr-2 h-4 w-4" />
            健康診断
          </TabsTrigger>
          <TabsTrigger value="stress">
            <Brain className="mr-2 h-4 w-4" />
            ストレスチェック
          </TabsTrigger>
          {canManageFollowUp && (
            <TabsTrigger value="followup">
              <Clock className="mr-2 h-4 w-4" />
              フォローアップ
            </TabsTrigger>
          )}
          {canViewAllEmployees && (
            <TabsTrigger value="reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              レポート
            </TabsTrigger>
          )}
        </TabsList>

        {/* 健康診断タブ（3分割：予定/結果/管理） */}
        <TabsContent value="checkups">
          <CheckupSubTabs
            schedules={filteredSchedules}
            checkups={checkups}
            departments={departments}
            scheduleSearchQuery={scheduleSearchQuery}
            scheduleFilterDepartment={scheduleFilterDepartment}
            onScheduleSearchQueryChange={setScheduleSearchQuery}
            onScheduleFilterDepartmentChange={setScheduleFilterDepartment}
            resultSearchQuery={checkupSearchQuery}
            resultFilterDepartment={checkupFilterDepartment}
            resultFilterResult={checkupFilterResult}
            onResultSearchQueryChange={setCheckupSearchQuery}
            onResultFilterDepartmentChange={setCheckupFilterDepartment}
            onResultFilterResultChange={setCheckupFilterResult}
            onViewCheckupDetails={handleViewDetails}
            onRefreshSchedules={() => fetchSchedules()}
            onUpdateScheduleStatus={updateScheduleStatus}
            userRoles={userRoles}
          />
        </TabsContent>

        {/* ストレスチェックタブ */}
        <TabsContent value="stress">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>ストレスチェック結果一覧</CardTitle>
                <CardDescription>
                  {getCurrentFiscalYear()}年度 ストレスチェック実施状況
                </CardDescription>
              </div>
              <Button onClick={() => router.push(`/${locale}/health/stress-check/take`)}>
                <Play className="mr-2 h-4 w-4" />
                ストレスチェックを受検
              </Button>
            </CardHeader>
            <CardContent>
              {/* 部署・判定フィルタ追加 */}
              <StressCheckFilters
                searchQuery={stressSearchQuery}
                filterDepartment={stressFilterDepartment}
                filterJudgment={stressFilterJudgment}
                departments={departments}
                onSearchQueryChange={setStressSearchQuery}
                onFilterDepartmentChange={setStressFilterDepartment}
                onFilterJudgmentChange={setStressFilterJudgment}
              />

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>氏名</TableHead>
                      <TableHead>部署</TableHead>
                      <TableHead>回答日</TableHead>
                      <TableHead>ストレス要因</TableHead>
                      <TableHead>心身の反応</TableHead>
                      <TableHead>周囲のサポート</TableHead>
                      <TableHead>判定</TableHead>
                      <TableHead>面談</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStressChecks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          ストレスチェックデータがありません
                        </TableCell>
                      </TableRow>
                    ) : filteredStressChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-medium">{check.userName}</TableCell>
                        <TableCell>{check.department || '-'}</TableCell>
                        <TableCell>
                          {check.status === 'pending'
                            ? '-'
                            : format(check.checkDate, 'yyyy/MM/dd', { locale: ja })}
                        </TableCell>
                        <TableCell>
                          {check.status === 'pending' ? '-' : `${check.stressFactorsScore}点`}
                        </TableCell>
                        <TableCell>
                          {check.status === 'pending' ? '-' : `${check.stressResponseScore}点`}
                        </TableCell>
                        <TableCell>
                          {check.status === 'pending' ? '-' : `${check.socialSupportScore}点`}
                        </TableCell>
                        <TableCell>
                          {check.status === 'pending' ? (
                            <Badge variant="secondary">未回答</Badge>
                          ) : check.isHighStress ? (
                            <Badge className="bg-red-100 text-red-800">高ストレス</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">正常</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {check.interviewRequested ? (
                            <Badge className="bg-purple-100 text-purple-800">
                              {check.interviewDate
                                ? format(check.interviewDate, 'M/d', { locale: ja }) + ' 予定'
                                : '希望あり'}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* フォローアップタブ（hr/admin/managerのみ） */}
        {canManageFollowUp && <TabsContent value="followup">
          {/* 部署フィルタ追加 */}
          <FollowUpFilters
            searchQuery={followUpSearchQuery}
            filterDepartment={followUpFilterDepartment}
            filterStatus={followUpFilterStatus}
            departments={departments}
            onSearchQueryChange={setFollowUpSearchQuery}
            onFilterDepartmentChange={setFollowUpFilterDepartment}
            onFilterStatusChange={setFollowUpFilterStatus}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  要再検査者リスト
                </CardTitle>
                <CardDescription>精密検査が必要な方</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const filtered = checkups
                      .filter((c) => c.requiresReexam)
                      .filter((c) => followUpFilterDepartment === 'all' || c.department === followUpFilterDepartment)
                      .filter((c) => c.userName.toLowerCase().includes(followUpSearchQuery.toLowerCase()))
                      .filter((c) => followUpFilterStatus === 'all' || c.followUpStatus === followUpFilterStatus);
                    return filtered.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        該当する要再検査者はいません
                      </p>
                    ) : filtered.map((checkup) => (
                      <div
                        key={checkup.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{checkup.userName}</p>
                          <p className="text-sm text-muted-foreground">{checkup.department}</p>
                          <div className="flex gap-1 mt-1">
                            {checkup.findings.map((finding, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {finding}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFollowUpDialog(checkup.userId, checkup.userName)}
                        >
                          フォロー記録
                        </Button>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  高ストレス者リスト
                </CardTitle>
                <CardDescription>面談対象者</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const filtered = stressChecks
                      .filter((s) => s.isHighStress)
                      .filter((s) => followUpFilterDepartment === 'all' || s.department === followUpFilterDepartment)
                      .filter((s) => s.userName.toLowerCase().includes(followUpSearchQuery.toLowerCase()));
                    return filtered.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        該当する高ストレス者はいません
                      </p>
                    ) : filtered.map((check) => (
                      <div
                        key={check.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{check.userName}</p>
                          <p className="text-sm text-muted-foreground">{check.department}</p>
                          {check.interviewRequested && (
                            <Badge className="mt-1 bg-purple-100 text-purple-800">
                              面談希望あり
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInterviewDialog(check.userId, check.userName)}
                        >
                          面談記録
                        </Button>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>}

        {/* レポートタブ（hr/admin/executiveのみ） */}
        {canViewAllEmployees && <TabsContent value="reports">
          {/* 部署フィルタ追加 */}
          <div className="mb-4">
            <Select value={reportFilterDepartment} onValueChange={setReportFilterDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="部署" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての部署</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* 有所見率推移グラフ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  有所見率推移
                </CardTitle>
                <CardDescription>過去3年間の推移</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={findingsRateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, '有所見率']} />
                      <Legend />
                      <Line type="monotone" dataKey="rate" stroke="#8884d8" strokeWidth={2} name="有所見率" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 健康診断結果分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  健康診断結果分布
                </CardTitle>
                <CardDescription>判定結果の割合</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={checkupResultDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name.split(':')[0]} ${(percent * 100).toFixed(0)}%`}
                      >
                        {checkupResultDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}人`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 部署別ストレス傾向 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  部署別ストレス傾向
                </CardTitle>
                <CardDescription>部署ごとのストレス状況比較（高スコア = 高ストレス / 低サポート）</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stressByDepartmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="stressFactors" fill="#f97316" name="ストレス要因" />
                      <Bar dataKey="stressResponse" fill="#ef4444" name="心身の反応" />
                      <Bar dataKey="support" fill="#22c55e" name="周囲のサポート" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* レポート出力 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>レポート出力</CardTitle>
                <CardDescription>各種帳票をダウンロードできます</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={handleExportHealthCheckups}
                  >
                    <Download className="h-6 w-6" />
                    <span>健康診断結果一覧</span>
                    <span className="text-xs text-muted-foreground">CSV形式</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={handleExportFindingsList}
                  >
                    <Download className="h-6 w-6" />
                    <span>有所見者リスト</span>
                    <span className="text-xs text-muted-foreground">CSV形式</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={handleExportStressChecks}
                  >
                    <Download className="h-6 w-6" />
                    <span>ストレスチェック結果</span>
                    <span className="text-xs text-muted-foreground">CSV形式</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={handleExportIndustrialPhysicianReportPDF}
                  >
                    <FileText className="h-6 w-6" />
                    <span>産業医報告書</span>
                    <span className="text-xs text-muted-foreground">PDF形式</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={handleExportHighStressListPDF}
                  >
                    <FileText className="h-6 w-6" />
                    <span>高ストレス者一覧</span>
                    <span className="text-xs text-muted-foreground">PDF形式</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={handleExportHealthCheckupSummaryPDF}
                  >
                    <FileText className="h-6 w-6" />
                    <span>健診サマリー</span>
                    <span className="text-xs text-muted-foreground">PDF形式</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>}
      </Tabs>

      {/* 健康診断詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>健康診断結果詳細</DialogTitle>
            <DialogDescription>
              {selectedCheckup?.userName} さんの健康診断結果
            </DialogDescription>
          </DialogHeader>
          {selectedCheckup && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">基本情報</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">氏名</span>
                      <span className="font-medium">{selectedCheckup.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">部署</span>
                      <span>{selectedCheckup.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">受診日</span>
                      <span>
                        {format(selectedCheckup.checkupDate, 'yyyy年MM月dd日', { locale: ja })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">医療機関</span>
                      <span>{selectedCheckup.medicalInstitution}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">判定結果</h4>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={`text-lg px-3 py-1 ${getResultBadgeColor(selectedCheckup.overallResult)}`}>
                      {selectedCheckup.overallResult}: {getResultLabel(selectedCheckup.overallResult)}
                    </Badge>
                  </div>
                  {selectedCheckup.requiresReexam && (
                    <Badge variant="outline" className="border-orange-500 text-orange-600 mr-2">
                      要再検査
                    </Badge>
                  )}
                  {selectedCheckup.requiresTreatment && (
                    <Badge variant="outline" className="border-red-500 text-red-600">
                      要治療
                    </Badge>
                  )}
                </div>
              </div>

              {(selectedCheckup.height || selectedCheckup.weight || selectedCheckup.bmi || selectedCheckup.bloodPressureSystolic) && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">身体計測</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">身長</p>
                    <p className="text-lg font-medium">{selectedCheckup.height != null ? `${selectedCheckup.height} cm` : '-'}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">体重</p>
                    <p className="text-lg font-medium">{selectedCheckup.weight != null ? `${selectedCheckup.weight} kg` : '-'}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">BMI</p>
                    <p className="text-lg font-medium">{selectedCheckup.bmi != null ? selectedCheckup.bmi.toFixed(1) : '-'}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">血圧</p>
                    <p className="text-lg font-medium">
                      {selectedCheckup.bloodPressureSystolic != null
                        ? `${selectedCheckup.bloodPressureSystolic}/${selectedCheckup.bloodPressureDiastolic}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
              )}

              {selectedCheckup.findings.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">所見</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedCheckup.findings.map((finding, i) => (
                      <Badge key={i} variant="secondary">
                        {finding}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCheckup.doctorOpinion && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">医師所見</h4>
                  <p className="p-3 bg-muted rounded-lg text-sm">
                    {selectedCheckup.doctorOpinion}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  閉じる
                </Button>
                <Button onClick={async () => {
                  if (!selectedCheckup) return;
                  const data: HealthCheckupForPDF[] = [{
                    id: selectedCheckup.id,
                    userId: selectedCheckup.userId,
                    userName: selectedCheckup.userName,
                    departmentName: selectedCheckup.department || '',
                    checkupDate: selectedCheckup.checkupDate,
                    checkupType: selectedCheckup.checkupType,
                    medicalInstitution: selectedCheckup.medicalInstitution,
                    fiscalYear: getFiscalYear(selectedCheckup.checkupDate),
                    overallResult: selectedCheckup.overallResult,
                    requiresReexam: selectedCheckup.requiresReexam,
                    requiresTreatment: selectedCheckup.requiresTreatment,
                    requiresGuidance: selectedCheckup.requiresGuidance || false,
                    height: selectedCheckup.height,
                    weight: selectedCheckup.weight,
                    bmi: selectedCheckup.bmi,
                    bloodPressureSystolic: selectedCheckup.bloodPressureSystolic,
                    bloodPressureDiastolic: selectedCheckup.bloodPressureDiastolic,
                    followUpStatus: selectedCheckup.followUpStatus,
                    findings: selectedCheckup.findings?.map(f => ({
                      category: f,
                      finding: f,
                      severity: 'warning',
                    })),
                  }];
                  await downloadHealthCheckupSummaryPDF(data, getFiscalYear(selectedCheckup.checkupDate));
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  PDFダウンロード
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* フォロー記録ダイアログ */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>フォロー記録</DialogTitle>
            <DialogDescription>
              {selectedFollowUpUser?.name} さんのフォロー状況を記録します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>フォロー日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !followUpRecord.followUpDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followUpRecord.followUpDate
                      ? format(followUpRecord.followUpDate, 'yyyy年MM月dd日', { locale: ja })
                      : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={followUpRecord.followUpDate}
                    onSelect={(date) =>
                      setFollowUpRecord({ ...followUpRecord, followUpDate: date })
                    }
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select
                value={followUpRecord.status}
                onValueChange={(value: 'scheduled' | 'completed' | 'cancelled') =>
                  setFollowUpRecord({ ...followUpRecord, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">予定</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>フォロー内容・メモ</Label>
              <Textarea
                placeholder="フォローの内容を記録してください..."
                value={followUpRecord.notes}
                onChange={(e) =>
                  setFollowUpRecord({ ...followUpRecord, notes: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>次回フォロー予定日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !followUpRecord.nextFollowUpDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followUpRecord.nextFollowUpDate
                      ? format(followUpRecord.nextFollowUpDate, 'yyyy年MM月dd日', { locale: ja })
                      : '日付を選択（任意）'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={followUpRecord.nextFollowUpDate}
                    onSelect={(date) =>
                      setFollowUpRecord({ ...followUpRecord, nextFollowUpDate: date })
                    }
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveFollowUp}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 面談記録ダイアログ */}
      <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>面談記録</DialogTitle>
            <DialogDescription>
              {selectedInterviewUser?.name} さんとの面談内容を記録します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>面談日</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !interviewRecord.interviewDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {interviewRecord.interviewDate
                      ? format(interviewRecord.interviewDate, 'yyyy年MM月dd日', { locale: ja })
                      : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={interviewRecord.interviewDate}
                    onSelect={(date) =>
                      setInterviewRecord({ ...interviewRecord, interviewDate: date })
                    }
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>面談種別</Label>
              <Select
                value={interviewRecord.interviewType}
                onValueChange={(value: 'stress_interview' | 'health_guidance' | 'return_to_work') =>
                  setInterviewRecord({ ...interviewRecord, interviewType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stress_interview">ストレスチェック面談</SelectItem>
                  <SelectItem value="health_guidance">保健指導</SelectItem>
                  <SelectItem value="return_to_work">復職面談</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>担当医師・保健師名</Label>
              <Input
                placeholder="担当者名を入力"
                value={interviewRecord.doctorName}
                onChange={(e) =>
                  setInterviewRecord({ ...interviewRecord, doctorName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>面談内容</Label>
              <Textarea
                placeholder="面談の内容を記録してください..."
                value={interviewRecord.notes}
                onChange={(e) =>
                  setInterviewRecord({ ...interviewRecord, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>面談結果・所見</Label>
              <Textarea
                placeholder="面談の結果や所見を記録してください..."
                value={interviewRecord.outcome}
                onChange={(e) =>
                  setInterviewRecord({ ...interviewRecord, outcome: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>今後の対応・アクション</Label>
              <Textarea
                placeholder="今後必要な対応やアクションを記録してください..."
                value={interviewRecord.nextAction}
                onChange={(e) =>
                  setInterviewRecord({ ...interviewRecord, nextAction: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveInterview}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 健診結果登録ダイアログ（抽出済みコンポーネント） */}
      <CheckupRegistrationDialog
        open={checkupRegistrationDialogOpen}
        onOpenChange={setCheckupRegistrationDialogOpen}
        tenantId={tenantId}
        onSuccess={fetchData}
      />
    </div>
  );
}
