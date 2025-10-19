/**
 * StatsCard Component - Usage Examples
 *
 * This file demonstrates various usage patterns for the StatsCard component.
 */

import { StatsCard } from './stats-card';
import { Users, TrendingUp, AlertCircle, Calendar, DollarSign, ShieldCheck } from 'lucide-react';

/**
 * Example 1: Basic Stats Card
 */
export function BasicStatsCardExample() {
  return (
    <StatsCard
      title="Total Users"
      value={150}
      icon={Users}
      gradient="from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
    />
  );
}

/**
 * Example 2: Stats Card with Trend
 */
export function StatsCardWithTrendExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Positive trend */}
      <StatsCard
        title="Monthly Revenue"
        value={1250000}
        trend="+12.5% 先月比"
        trendDirection="up"
        icon={DollarSign}
        gradient="from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
      />

      {/* Negative trend */}
      <StatsCard
        title="Churn Rate"
        value={3.2}
        trend="-0.8% 先月比"
        trendDirection="down"
        icon={TrendingUp}
        gradient="from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
      />
    </div>
  );
}

/**
 * Example 3: Loading State
 */
export function LoadingStatsCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Loading Card"
        value={0}
        icon={Users}
        gradient="from-gray-50 to-gray-100"
        loading={true}
      />
      <StatsCard
        title="Another Loading Card"
        value={0}
        icon={AlertCircle}
        gradient="from-amber-50 to-amber-100"
        loading={true}
      />
    </div>
  );
}

/**
 * Example 4: Clickable Stats Card
 */
export function ClickableStatsCardExample() {
  const handleClick = () => {
    console.log('Card clicked!');
    // Navigate to detailed view or perform action
  };

  return (
    <StatsCard
      title="Pending Approvals"
      value={8}
      trend="3件は緊急"
      icon={AlertCircle}
      gradient="from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"
      onClick={handleClick}
    />
  );
}

/**
 * Example 5: Different Gradients
 */
export function GradientVariationsExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Orange Theme"
        value={50}
        icon={Users}
        gradient="from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900"
      />
      <StatsCard
        title="Blue Theme"
        value={42}
        icon={Users}
        gradient="from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
      />
      <StatsCard
        title="Purple Theme"
        value={99}
        icon={ShieldCheck}
        gradient="from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900"
      />
      <StatsCard
        title="Green Theme"
        value={87.5}
        icon={TrendingUp}
        gradient="from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
      />
    </div>
  );
}

/**
 * Example 6: String Values
 */
export function StringValueStatsCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatsCard
        title="System Status"
        value="Online"
        trend="稼働時間 99.9%"
        icon={ShieldCheck}
        gradient="from-green-50 to-green-100"
      />
      <StatsCard
        title="今日の勤怠"
        value="出勤中"
        trend="08:45 出勤"
        icon={Calendar}
        gradient="from-orange-50 to-orange-100"
      />
    </div>
  );
}

/**
 * Example 7: Dashboard Integration
 */
export function DashboardStatsExample() {
  const stats = [
    {
      title: '総従業員数',
      value: 50,
      trend: '+12 先月比',
      icon: Users,
      gradient: 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900',
    },
    {
      title: '本日の出勤率',
      value: 42,
      trend: '出勤率 84%',
      icon: Users,
      gradient: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
    },
    {
      title: '承認待ち',
      value: 8,
      trend: '3件は緊急',
      icon: AlertCircle,
      gradient: 'from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900',
    },
    {
      title: 'システム健全性',
      value: '99.9%',
      trend: '稼働時間',
      icon: ShieldCheck,
      gradient: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          trend={stat.trend}
          icon={stat.icon}
          gradient={stat.gradient}
        />
      ))}
    </div>
  );
}

/**
 * Example 8: Responsive Grid
 */
export function ResponsiveStatsGridExample() {
  return (
    <>
      {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Card 1"
          value={100}
          icon={Users}
          gradient="from-blue-50 to-blue-100"
        />
        <StatsCard
          title="Card 2"
          value={200}
          icon={TrendingUp}
          gradient="from-green-50 to-green-100"
        />
        <StatsCard
          title="Card 3"
          value={300}
          icon={AlertCircle}
          gradient="from-amber-50 to-amber-100"
        />
        <StatsCard
          title="Card 4"
          value={400}
          icon={Calendar}
          gradient="from-purple-50 to-purple-100"
        />
      </div>

      {/* Employee view: 2 columns only */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mt-6">
        <StatsCard
          title="私の勤怠"
          value="出勤中"
          trend="08:45 出勤"
          icon={Users}
          gradient="from-orange-50 to-orange-100"
        />
        <StatsCard
          title="月間稼働率"
          value="87.5%"
          trend="+2.1% 先月比"
          icon={TrendingUp}
          gradient="from-green-50 to-green-100"
        />
      </div>
    </>
  );
}
