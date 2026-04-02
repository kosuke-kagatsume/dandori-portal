'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Users, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { COLORS, useFetchChartData } from './chart-helpers';

function ChartLoading() {
  return <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export function CompanyAttendanceChart() {
  const { data, isLoading } = useFetchChartData<Array<{ month: string; attendanceRate: number; averageWorkHours: number }>>(
    '/api/dashboard/charts/company-stats?type=attendance&months=6'
  );

  const fallbackData = [
    { month: '8月', attendanceRate: 96, averageWorkHours: 8.2 }, { month: '9月', attendanceRate: 95, averageWorkHours: 8.4 },
    { month: '10月', attendanceRate: 94, averageWorkHours: 8.5 }, { month: '11月', attendanceRate: 97, averageWorkHours: 8.1 },
    { month: '12月', attendanceRate: 93, averageWorkHours: 8.6 }, { month: '1月', attendanceRate: 95, averageWorkHours: 8.3 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" />全社勤怠トレンド</CardTitle>
        <CardDescription>過去6ヶ月の全社出勤率と労働時間</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" />
              <YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" /><Tooltip /><Legend />
              <Line yAxisId="left" type="monotone" dataKey="attendanceRate" stroke={COLORS.primary} name="出勤率(%)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="averageWorkHours" stroke={COLORS.secondary} name="平均労働時間" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DepartmentLeaveChart() {
  const { data, isLoading } = useFetchChartData<Array<{ department: string; usedDays: number; memberCount: number; averagePerPerson: number }>>(
    '/api/dashboard/charts/company-stats?type=leave'
  );

  const fallbackData = [
    { department: '営業部', usedDays: 45 }, { department: '開発部', usedDays: 52 },
    { department: '総務部', usedDays: 38 }, { department: '人事部', usedDays: 42 },
    { department: 'マーケティング部', usedDays: 35 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-green-500" />部署別休暇取得率</CardTitle>
        <CardDescription>各部署の有給消化状況</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="department" type="category" width={120} /><Tooltip /><Legend />
              <Bar dataKey="usedDays" fill={COLORS.success} name="使用日数" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DepartmentSalaryChart() {
  const { data, isLoading } = useFetchChartData<Array<{ department: string; baseSalary: number; allowances: number; overtime: number }>>(
    '/api/dashboard/charts/company-stats?type=salary'
  );

  const fallbackData = [
    { department: '営業部', baseSalary: 350000, allowances: 50000, overtime: 45000 },
    { department: '開発部', baseSalary: 400000, allowances: 60000, overtime: 55000 },
    { department: '総務部', baseSalary: 320000, allowances: 40000, overtime: 25000 },
    { department: '人事部', baseSalary: 330000, allowances: 45000, overtime: 30000 },
    { department: 'マーケティング部', baseSalary: 360000, allowances: 55000, overtime: 40000 },
  ];
  const displayData = data && data.length > 0 ? data : fallbackData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-yellow-500" />部署別平均給与</CardTitle>
        <CardDescription>部署ごとの給与構成（基本給・手当・残業代）</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <ChartLoading /> : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="department" type="category" width={120} />
              <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} /><Legend />
              <Bar dataKey="baseSalary" fill={COLORS.primary} name="基本給" stackId="a" />
              <Bar dataKey="allowances" fill={COLORS.success} name="手当" stackId="a" />
              <Bar dataKey="overtime" fill={COLORS.warning} name="残業代" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface PersonnelChange {
  id: string; userId?: string; userName?: string; type: string; effectiveDate: string;
  department?: string; newDepartment?: string; details?: { department?: string; newDepartment?: string };
}

export function HeadcountTrendChart() {
  const router = useRouter();
  const [changes, setChanges] = useState<PersonnelChange[]>([]);

  const fetchChanges = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduled-changes?status=pending&limit=10');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setChanges(data.data);
      }
    } catch { /* fallback */ }
  }, []);

  useEffect(() => { fetchChanges(); }, [fetchChanges]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-purple-500" />入退社予定</CardTitle>
        <CardDescription>今後の入社・退職予定（クリックでユーザー詳細へ）</CardDescription>
      </CardHeader>
      <CardContent>
        {changes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">予定はありません</p>
        ) : (
          <div className="space-y-3">
            {changes.map((person) => {
              const isJoin = person.type === 'hire' || person.type === 'join';
              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => person.userId && router.push(`/ja/users/${person.userId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isJoin ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                      <Users className={`h-4 w-4 ${isJoin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{person.userName || '未定'}</p>
                      <p className="text-xs text-muted-foreground">{person.details?.newDepartment || person.details?.department || person.newDepartment || person.department || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${isJoin ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                      {isJoin ? '入社' : '退職'}
                    </span>
                    <span className="text-sm text-muted-foreground">{new Date(person.effectiveDate).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
