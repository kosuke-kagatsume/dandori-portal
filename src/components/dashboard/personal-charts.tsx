'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { Clock, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { COLORS, useFetchChartData } from './chart-helpers';

function ChartLoading() {
  return <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export function PersonalAttendanceChart() {
  const userId = useUserStore((s) => s.currentUser?.id);
  const { data, isLoading } = useFetchChartData<Array<{ date: string; clockIn: number; clockOut: number; workHours: number; status: string }>>(
    userId ? `/api/dashboard/charts/personal-attendance?userId=${userId}&days=7` : ''
  );

  const fallbackData = [
    { date: '1/13', clockIn: 8.5, clockOut: 18.0 }, { date: '1/14', clockIn: 9.0, clockOut: 18.5 },
    { date: '1/15', clockIn: 8.8, clockOut: 17.8 }, { date: '1/16', clockIn: 9.2, clockOut: 19.0 },
    { date: '1/17', clockIn: 8.7, clockOut: 18.2 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" />個人勤怠トレンド</CardTitle>
        <CardDescription>過去7日間の出退勤時刻と労働時間</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend />
              <Line type="monotone" dataKey="clockIn" stroke={COLORS.primary} name="出勤時刻" strokeWidth={2} />
              <Line type="monotone" dataKey="clockOut" stroke={COLORS.secondary} name="退勤時刻" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function PersonalLeaveChart() {
  const userId = useUserStore((s) => s.currentUser?.id);
  const { data, isLoading } = useFetchChartData<Array<{ month: string; used: number; remaining: number }>>(
    userId ? `/api/dashboard/charts/personal-leave?userId=${userId}&months=6` : ''
  );

  const fallbackData = [
    { month: '8月', used: 1, remaining: 18 }, { month: '9月', used: 0, remaining: 18 },
    { month: '10月', used: 2, remaining: 16 }, { month: '11月', used: 1, remaining: 15 },
    { month: '12月', used: 0, remaining: 15 }, { month: '1月', used: 1, remaining: 14 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-green-500" />休暇取得履歴</CardTitle>
        <CardDescription>過去6ヶ月の有給休暇の使用状況</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="used" fill={COLORS.success} name="使用日数" />
              <Bar dataKey="remaining" fill={COLORS.warning} name="残日数" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function PersonalWorkHoursChart() {
  const userId = useUserStore((s) => s.currentUser?.id);
  const { data, isLoading } = useFetchChartData<Array<{ month: string; standard: number; overtime: number }>>(
    userId ? `/api/dashboard/charts/personal-work-hours?userId=${userId}&months=6` : ''
  );

  const fallbackData = [
    { month: '8月', standard: 160, overtime: 10 }, { month: '9月', standard: 160, overtime: 15 },
    { month: '10月', standard: 160, overtime: 20 }, { month: '11月', standard: 160, overtime: 8 },
    { month: '12月', standard: 160, overtime: 12 }, { month: '1月', standard: 160, overtime: 5 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-500" />月次労働時間</CardTitle>
        <CardDescription>標準労働時間と実績の比較</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
              <Area type="monotone" dataKey="standard" stackId="1" stroke={COLORS.info} fill={COLORS.info} fillOpacity={0.3} name="標準時間" />
              <Area type="monotone" dataKey="overtime" stackId="2" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.6} name="残業時間" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
