/**
 * ダッシュボードグラフ用モックデータ生成
 */

// 過去7日間の勤怠トレンドデータ（一般社員用）
export function generatePersonalAttendanceTrend() {
  const days = ['月', '火', '水', '木', '金', '土', '日'];
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));

    // 土日は休み
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      day: days[dayOfWeek === 0 ? 6 : dayOfWeek - 1],
      clockIn: isWeekend ? null : 8.75 + Math.random() * 0.5, // 8:45-9:15の間
      clockOut: isWeekend ? null : 18 + Math.random() * 1, // 18:00-19:00の間
      workHours: isWeekend ? 0 : 8 + Math.random() * 2, // 8-10時間
    };
  });
}

// 過去6ヶ月の個人休暇取得データ（一般社員用）
export function generatePersonalLeaveHistory() {
  const months = ['8月', '9月', '10月', '11月', '12月', '1月'];

  return months.map((month, i) => ({
    month,
    used: Math.floor(Math.random() * 3), // 0-2日
    remaining: 20 - (i * 2) - Math.floor(Math.random() * 2), // 徐々に減る
  }));
}

// 過去6ヶ月の個人稼働時間（一般社員用）
export function generatePersonalWorkHours() {
  const months = ['8月', '9月', '10月', '11月', '12月', '1月'];

  return months.map((month) => ({
    month,
    standard: 160, // 標準労働時間
    actual: 155 + Math.random() * 20, // 実労働時間 155-175時間
    overtime: Math.random() * 20, // 残業 0-20時間
  }));
}

// チーム出勤率トレンド（管理職用）
export function generateTeamAttendanceTrend() {
  const days = ['月', '火', '水', '木', '金'];
  const today = new Date();

  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (4 - i));

    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      day: days[i],
      attendanceRate: 85 + Math.random() * 15, // 85-100%
      onTime: 6 + Math.floor(Math.random() * 2), // 6-8人
      late: Math.random() > 0.7 ? 1 : 0, // たまに1人遅刻
      absent: Math.random() > 0.9 ? 1 : 0, // まれに1人欠勤
    };
  });
}

// チームメンバー稼働状況（管理職用）
export function generateTeamMemberWorkload() {
  const members = [
    '田中太郎', '佐藤花子', '鈴木一郎', '高橋直樹',
    '伊藤健太', '渡辺由美', '山田美咲', '加藤修'
  ];

  return members.map((name) => ({
    name,
    taskCount: Math.floor(5 + Math.random() * 10), // 5-15タスク
    completionRate: 70 + Math.random() * 30, // 70-100%
    workHours: 160 + Math.random() * 20, // 160-180時間
  }));
}

// 承認タスク処理状況（管理職用）
export function generateApprovalTasksTrend() {
  const weeks = ['第1週', '第2週', '第3週', '第4週'];

  return weeks.map((week) => ({
    week,
    pending: Math.floor(Math.random() * 5), // 0-5件
    approved: Math.floor(5 + Math.random() * 10), // 5-15件
    rejected: Math.floor(Math.random() * 2), // 0-2件
  }));
}

// 全社勤怠トレンド（人事用）
export function generateCompanyAttendanceTrend() {
  const months = ['8月', '9月', '10月', '11月', '12月', '1月'];

  return months.map((month) => ({
    month,
    attendanceRate: 92 + Math.random() * 6, // 92-98%
    averageWorkHours: 165 + Math.random() * 10, // 165-175時間
    overtimeHours: 15 + Math.random() * 10, // 15-25時間
  }));
}

// 部門別休暇取得率（人事用）
export function generateDepartmentLeaveRate() {
  const departments = ['開発部', '営業部', '総務部', '経理部', '人事部', 'マーケティング部'];

  return departments.map((department) => ({
    department,
    usedDays: 8 + Math.floor(Math.random() * 8), // 8-16日
    totalDays: 20,
    rate: (8 + Math.random() * 8) / 20 * 100, // 40-80%
  }));
}

// 部門別平均給与（人事用）
export function generateDepartmentAverageSalary() {
  const departments = ['開発部', '営業部', '総務部', '経理部', '人事部', 'マーケティング部'];

  return departments.map((department) => ({
    department,
    baseSalary: 280000 + Math.random() * 120000, // 28万-40万
    allowances: 30000 + Math.random() * 30000, // 3万-6万
    overtime: 20000 + Math.random() * 40000, // 2万-6万
    total: 330000 + Math.random() * 170000, // 33万-50万
  }));
}

// 人員増減トレンド（人事用）
export function generateHeadcountTrend() {
  const months = ['8月', '9月', '10月', '11月', '12月', '1月'];

  return months.map((month, i) => ({
    month,
    total: 45 + i, // 45名から徐々に増加
    hired: Math.floor(Math.random() * 3), // 0-2名入社
    resigned: Math.floor(Math.random() * 2), // 0-1名退職
  }));
}

// SaaSコスト推移（システム管理者用）
export function generateSaasCostTrend() {
  const months = ['8月', '9月', '10月', '11月', '12月', '1月'];

  return months.map((month) => ({
    month,
    communication: 50000 + Math.random() * 10000, // Slack, Zoom
    development: 150000 + Math.random() * 20000, // GitHub, Jira
    design: 80000 + Math.random() * 15000, // Figma, Adobe
    productivity: 120000 + Math.random() * 20000, // Microsoft 365, Notion
    sales: 200000 + Math.random() * 30000, // Salesforce
    total: 600000 + Math.random() * 100000, // 60万-70万
  }));
}

// カテゴリ別SaaSコスト（システム管理者用）
export function generateSaasCostByCategory() {
  return [
    { category: 'コミュニケーション', cost: 55000, count: 2 },
    { category: '開発ツール', cost: 160000, count: 3 },
    { category: 'デザインツール', cost: 85000, count: 2 },
    { category: '生産性ツール', cost: 130000, count: 4 },
    { category: '営業支援', cost: 220000, count: 1 },
    { category: 'プロジェクト管理', cost: 60000, count: 2 },
  ];
}

// 資産利用状況（システム管理者用）
export function generateAssetUtilization() {
  return [
    { category: 'PC', total: 50, inUse: 47, available: 3 },
    { category: '車両', total: 12, inUse: 10, available: 2 },
    { category: 'タブレット', total: 20, inUse: 15, available: 5 },
    { category: '携帯電話', total: 50, inUse: 50, available: 0 },
  ];
}

// システム健全性トレンド（システム管理者用）
export function generateSystemHealthTrend() {
  const days = ['月', '火', '水', '木', '金', '土', '日'];

  return days.map((day) => ({
    day,
    uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
    responseTime: 100 + Math.random() * 50, // 100-150ms
    errorRate: Math.random() * 0.5, // 0-0.5%
  }));
}
