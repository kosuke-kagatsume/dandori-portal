import { NextRequest } from 'next/server';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import { getReportsForTenant } from '../../_store';

// 営業日判定（簡易: 土日除外）
function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

// 期間内の営業日数を計算
function countBusinessDays(startDate: string, endDate: string): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    if (isBusinessDay(current)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// 週番号を取得
function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - yearStart.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNum = Math.ceil((diff / oneWeek) + 1);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// 月キーを取得
function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

// GET - 提出率集計
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const granularity = (searchParams.get('granularity') || 'daily') as 'daily' | 'weekly' | 'monthly';

    // メンバーリスト取得
    let members: Array<{ id: string; name: string; departmentId?: string; departmentName?: string }> = [];
    try {
      const baseUrl = request.nextUrl.origin;
      const membersRes = await fetch(`${baseUrl}/api/members/status?tenantId=${tenantId}`);
      if (membersRes.ok) {
        const membersJson = await membersRes.json();
        const rawMembers = membersJson.data?.members || membersJson.data || [];
        members = Array.isArray(rawMembers) ? rawMembers : [];
      }
    } catch {
      // メンバー取得失敗時は空配列
    }

    // フォールバック: メンバーが取れない場合、日報から一意の従業員を抽出
    const allReports = getReportsForTenant(tenantId);
    if (members.length === 0) {
      const employeeMap = new Map<string, { id: string; name: string }>();
      allReports.forEach((r) => {
        if (!employeeMap.has(r.employeeId)) {
          employeeMap.set(r.employeeId, { id: r.employeeId, name: r.employeeName || r.employeeId });
        }
      });
      members = Array.from(employeeMap.values());
    }

    // 日付範囲でフィルタ
    const filteredReports = allReports.filter((r) => r.date >= startDate && r.date <= endDate);

    // 営業日数
    const businessDays = countBusinessDays(startDate, endDate);
    const totalExpected = members.length * Math.max(businessDays, 1);

    // 提出済みカウント (submitted + approved)
    const submittedReports = filteredReports.filter((r) => r.status === 'submitted' || r.status === 'approved');
    const approvedReports = filteredReports.filter((r) => r.status === 'approved');
    const rejectedReports = filteredReports.filter((r) => r.status === 'rejected');

    // サマリー
    const summary = {
      totalEmployees: members.length,
      submittedCount: submittedReports.length,
      notSubmittedCount: Math.max(0, totalExpected - submittedReports.length),
      approvedCount: approvedReports.length,
      rejectedCount: rejectedReports.length,
      submissionRate: totalExpected > 0 ? Math.round((submittedReports.length / totalExpected) * 100) : 0,
    };

    // 時系列データ
    const timeSeriesMap = new Map<string, { submitted: number; expected: number }>();

    // 期間内の各営業日を生成
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      if (isBusinessDay(current)) {
        const dateStr = current.toISOString().split('T')[0];
        let periodKey: string;
        if (granularity === 'weekly') {
          periodKey = getWeekKey(dateStr);
        } else if (granularity === 'monthly') {
          periodKey = getMonthKey(dateStr);
        } else {
          periodKey = dateStr;
        }
        const existing = timeSeriesMap.get(periodKey) || { submitted: 0, expected: 0 };
        existing.expected += members.length;
        timeSeriesMap.set(periodKey, existing);
      }
      current.setDate(current.getDate() + 1);
    }

    // 提出データを集計
    submittedReports.forEach((r) => {
      let periodKey: string;
      if (granularity === 'weekly') {
        periodKey = getWeekKey(r.date);
      } else if (granularity === 'monthly') {
        periodKey = getMonthKey(r.date);
      } else {
        periodKey = r.date;
      }
      const existing = timeSeriesMap.get(periodKey);
      if (existing) {
        existing.submitted++;
      }
    });

    const timeSeries = Array.from(timeSeriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        submissionRate: data.expected > 0 ? Math.round((data.submitted / data.expected) * 100) : 0,
        submittedCount: data.submitted,
        totalExpected: data.expected,
      }));

    // 部署別集計
    const deptMap = new Map<string, { name: string; submitted: number; expected: number }>();
    members.forEach((m) => {
      const deptId = m.departmentId || 'unknown';
      const deptName = m.departmentName || '未所属';
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { name: deptName, submitted: 0, expected: 0 });
      }
      const dept = deptMap.get(deptId)!;
      dept.expected += Math.max(businessDays, 1);
    });

    submittedReports.forEach((r) => {
      const member = members.find((m) => m.id === r.employeeId);
      const deptId = member?.departmentId || 'unknown';
      const dept = deptMap.get(deptId);
      if (dept) {
        dept.submitted++;
      }
    });

    const byDepartment = Array.from(deptMap.entries()).map(([departmentId, data]) => ({
      departmentId,
      departmentName: data.name,
      submissionRate: data.expected > 0 ? Math.round((data.submitted / data.expected) * 100) : 0,
      submittedCount: data.submitted,
      totalExpected: data.expected,
    }));

    // 個人別詳細
    const employeeDetails = members.map((m) => {
      const empReports = submittedReports.filter((r) => r.employeeId === m.id);
      const expected = Math.max(businessDays, 1);
      const lastReport = empReports.sort((a, b) => b.date.localeCompare(a.date))[0];

      return {
        employeeId: m.id,
        employeeName: m.name,
        departmentName: m.departmentName || '未所属',
        submittedCount: empReports.length,
        expectedCount: expected,
        submissionRate: expected > 0 ? Math.round((empReports.length / expected) * 100) : 0,
        lastSubmittedDate: lastReport?.submittedAt || lastReport?.date || null,
      };
    });

    return successResponse({
      summary,
      timeSeries,
      byDepartment,
      employeeDetails,
    });
  } catch (error) {
    return handleApiError(error, '提出率集計取得');
  }
}
