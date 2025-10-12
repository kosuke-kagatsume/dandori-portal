'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Clock,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle2,
  DollarSign,
  Activity,
  Package,
} from 'lucide-react';
import {
  generatePersonalAttendanceTrend,
  generatePersonalLeaveHistory,
  generatePersonalWorkHours,
  generateTeamAttendanceTrend,
  generateTeamMemberWorkload,
  generateApprovalTasksTrend,
  generateCompanyAttendanceTrend,
  generateDepartmentLeaveRate,
  generateDepartmentAverageSalary,
  generateHeadcountTrend,
  generateSaasCostTrend,
  generateSaasCostByCategory,
  generateAssetUtilization,
  generateSystemHealthTrend,
} from '@/lib/mock-data/dashboard-charts-data';

// カラーパレット
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
  pink: '#ec4899',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
];

// =====================================
// 一般社員用グラフ
// =====================================

export function PersonalAttendanceChart() {
  const data = generatePersonalAttendanceTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          個人勤怠トレンド
        </CardTitle>
        <CardDescription>過去7日間の出退勤時刻と労働時間</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="clockIn"
              stroke={COLORS.primary}
              name="出勤時刻"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="clockOut"
              stroke={COLORS.secondary}
              name="退勤時刻"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PersonalLeaveChart() {
  const data = generatePersonalLeaveHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          休暇取得履歴
        </CardTitle>
        <CardDescription>過去6ヶ月の有給休暇の使用状況</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="used" fill={COLORS.success} name="使用日数" />
            <Bar dataKey="remaining" fill={COLORS.warning} name="残日数" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function PersonalWorkHoursChart() {
  const data = generatePersonalWorkHours();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          月次労働時間
        </CardTitle>
        <CardDescription>標準労働時間と実績の比較</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="standard"
              stackId="1"
              stroke={COLORS.info}
              fill={COLORS.info}
              fillOpacity={0.3}
              name="標準時間"
            />
            <Area
              type="monotone"
              dataKey="overtime"
              stackId="2"
              stroke={COLORS.danger}
              fill={COLORS.danger}
              fillOpacity={0.6}
              name="残業時間"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =====================================
// 管理職用グラフ
// =====================================

export function TeamAttendanceChart() {
  const data = generateTeamAttendanceTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          チーム出勤状況
        </CardTitle>
        <CardDescription>チームメンバーの出勤トレンド（直近5日間）</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="onTime" fill={COLORS.success} name="定時出勤" stackId="a" />
            <Bar dataKey="late" fill={COLORS.warning} name="遅刻" stackId="a" />
            <Bar dataKey="absent" fill={COLORS.danger} name="欠勤" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TeamWorkloadChart() {
  const data = generateTeamMemberWorkload();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          メンバー稼働状況
        </CardTitle>
        <CardDescription>各メンバーのタスク完了率と労働時間</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="completionRate" fill={COLORS.primary} name="完了率(%)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ApprovalTasksChart() {
  const data = generateApprovalTasksTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          承認タスク処理状況
        </CardTitle>
        <CardDescription>週次の承認処理件数</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="approved" fill={COLORS.success} name="承認" />
            <Bar dataKey="pending" fill={COLORS.warning} name="保留中" />
            <Bar dataKey="rejected" fill={COLORS.danger} name="却下" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =====================================
// 人事用グラフ
// =====================================

export function CompanyAttendanceChart() {
  const data = generateCompanyAttendanceTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          全社勤怠トレンド
        </CardTitle>
        <CardDescription>過去6ヶ月の全社出勤率と労働時間</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="attendanceRate"
              stroke={COLORS.primary}
              name="出勤率(%)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="averageWorkHours"
              stroke={COLORS.secondary}
              name="平均労働時間"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DepartmentLeaveChart() {
  const data = generateDepartmentLeaveRate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          部門別休暇取得率
        </CardTitle>
        <CardDescription>各部門の有給消化状況</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="department" type="category" width={120} />
            <Tooltip />
            <Legend />
            <Bar dataKey="usedDays" fill={COLORS.success} name="使用日数" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function DepartmentSalaryChart() {
  const data = generateDepartmentAverageSalary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-yellow-500" />
          部門別平均給与
        </CardTitle>
        <CardDescription>部門ごとの給与構成（基本給・手当・残業代）</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="department" type="category" width={120} />
            <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="baseSalary" fill={COLORS.primary} name="基本給" stackId="a" />
            <Bar dataKey="allowances" fill={COLORS.success} name="手当" stackId="a" />
            <Bar dataKey="overtime" fill={COLORS.warning} name="残業代" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function HeadcountTrendChart() {
  const data = generateHeadcountTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          人員増減トレンド
        </CardTitle>
        <CardDescription>入社・退社を含む人員数の推移</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke={COLORS.primary}
              name="総人員数"
              strokeWidth={3}
            />
            <Line
              type="monotone"
              dataKey="hired"
              stroke={COLORS.success}
              name="入社"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="resigned"
              stroke={COLORS.danger}
              name="退社"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// =====================================
// システム管理者用グラフ
// =====================================

export function SaasCostTrendChart() {
  const data = generateSaasCostTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-500" />
          SaaSコスト推移
        </CardTitle>
        <CardDescription>カテゴリ別の月次コスト推移</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
            <Legend />
            <Area
              type="monotone"
              dataKey="communication"
              stackId="1"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              name="コミュニケーション"
            />
            <Area
              type="monotone"
              dataKey="development"
              stackId="1"
              stroke={COLORS.secondary}
              fill={COLORS.secondary}
              name="開発"
            />
            <Area
              type="monotone"
              dataKey="design"
              stackId="1"
              stroke={COLORS.purple}
              fill={COLORS.purple}
              name="デザイン"
            />
            <Area
              type="monotone"
              dataKey="productivity"
              stackId="1"
              stroke={COLORS.success}
              fill={COLORS.success}
              name="生産性"
            />
            <Area
              type="monotone"
              dataKey="sales"
              stackId="1"
              stroke={COLORS.warning}
              fill={COLORS.warning}
              name="営業"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SaasCostByCategoryChart() {
  const data = generateSaasCostByCategory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-500" />
          カテゴリ別SaaSコスト
        </CardTitle>
        <CardDescription>現在のSaaSサービスの費用内訳</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="cost"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function AssetUtilizationChart() {
  const data = generateAssetUtilization();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-500" />
          資産利用状況
        </CardTitle>
        <CardDescription>社内資産の利用率</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="inUse" fill={COLORS.success} name="使用中" />
            <Bar dataKey="available" fill={COLORS.info} name="利用可能" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SystemHealthChart() {
  const data = generateSystemHealthTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          システム健全性
        </CardTitle>
        <CardDescription>稼働率とレスポンスタイム（週次）</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="uptime"
              stroke={COLORS.success}
              name="稼働率(%)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="responseTime"
              stroke={COLORS.info}
              name="レスポンスタイム(ms)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
