'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { COLORS, useFetchChartData } from './chart-helpers';

function ChartLoading() {
  return <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export function TeamAttendanceChart() {
  const managerId = useUserStore((s) => s.currentUser?.id);
  const { data, isLoading } = useFetchChartData<Array<{ date: string; onTime: number; late: number; absent: number }>>(
    managerId ? `/api/dashboard/charts/team-attendance?managerId=${managerId}&days=5` : ''
  );

  const fallbackData = [
    { date: '1/13', onTime: 8, late: 1, absent: 1 }, { date: '1/14', onTime: 9, late: 1, absent: 0 },
    { date: '1/15', onTime: 7, late: 2, absent: 1 }, { date: '1/16', onTime: 10, late: 0, absent: 0 },
    { date: '1/17', onTime: 8, late: 1, absent: 1 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" />チーム出勤状況</CardTitle>
        <CardDescription>チームメンバーの出勤トレンド（直近5日間）</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="onTime" fill={COLORS.success} name="定時出勤" stackId="a" />
              <Bar dataKey="late" fill={COLORS.warning} name="遅刻" stackId="a" />
              <Bar dataKey="absent" fill={COLORS.danger} name="欠勤" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TeamWorkloadChart() {
  const managerId = useUserStore((s) => s.currentUser?.id);
  const { data, isLoading } = useFetchChartData<Array<{ name: string; workHours: number; overtimeHours: number; completionRate: number }>>(
    managerId ? `/api/dashboard/charts/team-workload?managerId=${managerId}` : ''
  );

  const fallbackData = [
    { name: '田中太郎', completionRate: 95 }, { name: '山田花子', completionRate: 88 },
    { name: '佐藤次郎', completionRate: 92 }, { name: '鈴木一郎', completionRate: 78 },
    { name: '高橋美咲', completionRate: 85 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-purple-500" />メンバー稼働状況</CardTitle>
        <CardDescription>各メンバーのタスク完了率と労働時間</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip /><Legend />
              <Bar dataKey="completionRate" fill={COLORS.primary} name="完了率(%)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ApprovalTasksChart() {
  const approverId = useUserStore((s) => s.currentUser?.id);
  const { data, isLoading } = useFetchChartData<Array<{ week: string; approved: number; pending: number; rejected: number }>>(
    approverId ? `/api/dashboard/charts/approval-tasks?approverId=${approverId}&weeks=4` : ''
  );

  const fallbackData = [
    { week: 'W1', approved: 5, pending: 2, rejected: 1 }, { week: 'W2', approved: 8, pending: 3, rejected: 0 },
    { week: 'W3', approved: 6, pending: 1, rejected: 2 }, { week: 'W4', approved: 7, pending: 2, rejected: 1 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" />承認タスク処理状況</CardTitle>
        <CardDescription>週次の承認処理件数</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="approved" fill={COLORS.success} name="承認" />
              <Bar dataKey="pending" fill={COLORS.warning} name="保留中" />
              <Bar dataKey="rejected" fill={COLORS.danger} name="却下" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
