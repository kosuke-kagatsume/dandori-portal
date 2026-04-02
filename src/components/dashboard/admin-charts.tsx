'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { DollarSign, Package, Loader2 } from 'lucide-react';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { CHART_COLORS, CATEGORY_COLORS } from './chart-helpers';

function ChartLoading() {
  return <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

export function SaasCostTrendChart() {
  const { saasMonthlyTrend, saasCategories, isLoading, fetchDashboardStats } = useDashboardStore();
  useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

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
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-500" />SaaSコスト推移</CardTitle>
          <CardDescription>カテゴリ別の月次コスト推移</CardDescription>
        </CardHeader>
        <CardContent><ChartLoading /></CardContent>
      </Card>
    );
  }

  const displayTrend = saasMonthlyTrend.length > 0 ? saasMonthlyTrend : defaultTrend;
  const displayCategories = saasCategories.length > 0 ? saasCategories : defaultCategories;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-500" />SaaSコスト推移</CardTitle>
        <CardDescription>カテゴリ別の月次コスト推移</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={displayTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} width={60} />
            <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} layout="horizontal" align="center" />
            {displayCategories.map((category, index) => (
              <Area key={category} type="monotone" dataKey={category} stackId="1"
                stroke={CATEGORY_COLORS[category] || CHART_COLORS[index % CHART_COLORS.length]}
                fill={CATEGORY_COLORS[category] || CHART_COLORS[index % CHART_COLORS.length]}
                name={category} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SaasCostByCategoryChart() {
  const { saasCostByCategory, isLoading, fetchDashboardStats } = useDashboardStore();
  useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

  const defaultData = [
    { category: '営業支援', cost: 220000, percentage: 44 }, { category: '生産性ツール', cost: 150000, percentage: 30 },
    { category: '開発ツール', cost: 60000, percentage: 12 }, { category: 'コミュニケーション', cost: 60000, percentage: 12 },
    { category: 'プロジェクト管理', cost: 10000, percentage: 2 },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-purple-500" />カテゴリ別SaaSコスト</CardTitle>
          <CardDescription>現在のSaaSサービスの費用内訳</CardDescription>
        </CardHeader>
        <CardContent><ChartLoading /></CardContent>
      </Card>
    );
  }

  const displayData = saasCostByCategory.length > 0 ? saasCostByCategory : defaultData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-purple-500" />カテゴリ別SaaSコスト</CardTitle>
        <CardDescription>現在のSaaSサービスの費用内訳</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={displayData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="cost">
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full lg:w-auto space-y-2">
            {displayData.map((entry, index) => (
              <div key={entry.category} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.category] || CHART_COLORS[index % CHART_COLORS.length] }} />
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

const CATEGORY_JAPANESE: Record<string, string> = {
  'PC': 'PC', 'monitor': 'モニター', '会議室設備': '会議室設備',
  'オフィス家具': 'オフィス家具', '通信機器': '通信機器', '車両': '車両',
};

export function AssetUtilizationChart() {
  const { assetUtilization, isLoading, fetchDashboardStats } = useDashboardStore();
  const router = useRouter();
  useEffect(() => { fetchDashboardStats(); }, [fetchDashboardStats]);

  const handleClick = () => { router.push('/ja/assets'); };

  if (isLoading) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-green-500" />資産利用状況</CardTitle>
          <CardDescription>社内資産の利用状況（クリックで詳細へ）</CardDescription>
        </CardHeader>
        <CardContent><ChartLoading /></CardContent>
      </Card>
    );
  }

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
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-green-500" />資産利用状況</CardTitle>
        <CardDescription>社内資産の利用状況（クリックで詳細へ）</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayData.map((asset) => (
            <div key={asset.category} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium">{CATEGORY_JAPANESE[asset.category] || asset.category}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400">使用中: <strong>{asset.inUse}</strong>台</span>
                <span className="text-blue-600 dark:text-blue-400">利用可能: <strong>{asset.available}</strong>台</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
