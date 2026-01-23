'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
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
} from '@/lib/mock-data/dashboard-charts-data';
import { useDashboardStore } from '@/lib/store/dashboard-store';

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
  COLORS.danger,    // 赤（営業支援など）
  COLORS.primary,   // 青（開発ツール）
  COLORS.purple,    // 紫（プロジェクト管理）
  COLORS.info,      // シアン（コミュニケーション）
  COLORS.success,   // 緑（生産性ツール）
  COLORS.warning,   // オレンジ（デザインツール）
];

// カテゴリ別のカラーマッピング
const CATEGORY_COLORS: Record<string, string> = {
  '営業支援': COLORS.danger,
  '開発ツール': COLORS.primary,
  'プロジェクト管理': COLORS.purple,
  'コミュニケーション': COLORS.info,
  '生産性ツール': COLORS.success,
  'デザインツール': COLORS.warning,
  'その他': COLORS.secondary,
};

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
            <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
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

// 今後の入退社予定データ（デモ）
// 注意: IDはDBのユーザーIDと一致させる必要がある（t1-プレフィックス付き）
const upcomingPersonnelChanges = [
  { id: 't1-user-017', name: '清水愛', type: 'join', date: '2025年1月6日', department: '開発部' },
  { id: 't1-user-010', name: '加藤翔太', type: 'join', date: '2025年1月6日', department: '営業部' },
  { id: 't1-user-023', name: '前田美穂', type: 'leave', date: '2025年1月31日', department: '総務部' },
  { id: 't1-user-029', name: '近藤大地', type: 'join', date: '2025年2月1日', department: 'マーケティング部' },
  { id: 't1-user-024', name: '藤田一樹', type: 'leave', date: '2025年2月28日', department: '総務部' },
];

export function HeadcountTrendChart() {
  const router = useRouter();

  const handleMemberClick = (userId: string) => {
    router.push(`/ja/users/${userId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          入退社予定
        </CardTitle>
        <CardDescription>今後の入社・退職予定（クリックでユーザー詳細へ）</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingPersonnelChanges.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => handleMemberClick(person.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  person.type === 'join'
                    ? 'bg-green-100 dark:bg-green-900'
                    : 'bg-red-100 dark:bg-red-900'
                }`}>
                  <Users className={`h-4 w-4 ${
                    person.type === 'join'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{person.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  person.type === 'join'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {person.type === 'join' ? '入社' : '退職'}
                </span>
                <span className="text-sm text-muted-foreground">{person.date}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================
// システム管理者用グラフ（実データ対応）
// =====================================

export function SaasCostTrendChart() {
  const { saasMonthlyTrend, saasCategories, isLoading, fetchDashboardStats } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // デフォルトデータ
  const defaultTrend = [
    { month: '2025-08', '営業支援': 200000, '開発ツール': 50000, '生産性ツール': 140000, 'コミュニケーション': 55000, 'プロジェクト管理': 8000 },
    { month: '2025-09', '営業支援': 205000, '開発ツール': 52000, '生産性ツール': 142000, 'コミュニケーション': 56000, 'プロジェクト管理': 9000 },
    { month: '2025-10', '営業支援': 210000, '開発ツール': 55000, '生産性ツール': 145000, 'コミュニケーション': 58000, 'プロジェクト管理': 9000 },
    { month: '2025-11', '営業支援': 215000, '開発ツール': 58000, '生産性ツール': 148000, 'コミュニケーション': 59000, 'プロジェクト管理': 10000 },
    { month: '2025-12', '営業支援': 220000, '開発ツール': 60000, '生産性ツール': 150000, 'コミュニケーション': 60000, 'プロジェクト管理': 10000 },
  ];
  const defaultCategories = ['営業支援', '開発ツール', '生産性ツール', 'コミュニケーション', 'プロジェクト管理'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            SaaSコスト推移
          </CardTitle>
          <CardDescription>カテゴリ別の月次コスト推移</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const displayTrend = saasMonthlyTrend.length > 0 ? saasMonthlyTrend : defaultTrend;
  const displayCategories = saasCategories.length > 0 ? saasCategories : defaultCategories;

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
          <AreaChart data={displayTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              layout="horizontal"
              align="center"
            />
            {displayCategories.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={CATEGORY_COLORS[category] || CHART_COLORS[index % CHART_COLORS.length]}
                fill={CATEGORY_COLORS[category] || CHART_COLORS[index % CHART_COLORS.length]}
                name={category}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SaasCostByCategoryChart() {
  const { saasCostByCategory, isLoading, fetchDashboardStats } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // デフォルトデータ
  const defaultData = [
    { category: '営業支援', cost: 220000, percentage: 44 },
    { category: '生産性ツール', cost: 150000, percentage: 30 },
    { category: '開発ツール', cost: 60000, percentage: 12 },
    { category: 'コミュニケーション', cost: 60000, percentage: 12 },
    { category: 'プロジェクト管理', cost: 10000, percentage: 2 },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            カテゴリ別SaaSコスト
          </CardTitle>
          <CardDescription>現在のSaaSサービスの費用内訳</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const displayData = saasCostByCategory.length > 0 ? saasCostByCategory : defaultData;

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
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* 円グラフ */}
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cost"
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          {/* 凡例リスト */}
          <div className="w-full lg:w-auto space-y-2">
            {displayData.map((entry, index) => (
              <div key={entry.category} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[entry.category] || CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="flex-1">{entry.category}</span>
                <span className="font-medium">{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// カテゴリ名の日本語マッピング
const CATEGORY_JAPANESE: Record<string, string> = {
  'PC': 'PC',
  'monitor': 'モニター',
  '会議室設備': '会議室設備',
  'オフィス家具': 'オフィス家具',
  '通信機器': '通信機器',
  '車両': '車両',
};

export function AssetUtilizationChart() {
  const { assetUtilization, isLoading, fetchDashboardStats } = useDashboardStore();
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleClick = () => {
    router.push('/ja/assets');
  };

  if (isLoading) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            資産利用状況
          </CardTitle>
          <CardDescription>社内資産の利用状況（クリックで詳細へ）</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // データがない場合のフォールバック（デモデータを使用）
  const displayData = assetUtilization.length > 0 ? assetUtilization : [
    { category: 'PC', total: 45, inUse: 38, available: 7, utilizationRate: 84 },
    { category: 'モニター', total: 60, inUse: 52, available: 8, utilizationRate: 87 },
    { category: '会議室設備', total: 12, inUse: 10, available: 2, utilizationRate: 83 },
    { category: '通信機器', total: 30, inUse: 25, available: 5, utilizationRate: 83 },
    { category: '車両', total: 8, inUse: 6, available: 2, utilizationRate: 75 },
  ];

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-500" />
          資産利用状況
        </CardTitle>
        <CardDescription>社内資産の利用状況（クリックで詳細へ）</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayData.map((asset) => {
            const categoryName = CATEGORY_JAPANESE[asset.category] || asset.category;
            return (
              <div key={asset.category} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium">{categoryName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 dark:text-green-400">
                    使用中: <strong>{asset.inUse}</strong>台
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    利用可能: <strong>{asset.available}</strong>台
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
