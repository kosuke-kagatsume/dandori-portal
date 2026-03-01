import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// インメモリストア（Phase 2 で Prisma に移行予定）
export interface StoredReport {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  templateId: string;
  templateName?: string;
  status: string;
  values: Array<{
    fieldId: string;
    value: string | string[] | number | null;
  }>;
  submittedAt: string | null;
  targetApproverId: string | null;
  targetApproverName: string | null;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export const reportsByTenant = new Map<string, StoredReport[]>();

function getReportsForTenant(tenantId: string): StoredReport[] {
  if (!reportsByTenant.has(tenantId)) {
    reportsByTenant.set(tenantId, []);
  }
  return reportsByTenant.get(tenantId)!;
}

// GET - 日報一覧取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const targetApproverId = searchParams.get('targetApproverId');

    let reports = getReportsForTenant(tenantId);

    // フィルタリング
    if (employeeId) {
      reports = reports.filter((r) => r.employeeId === employeeId);
    }
    if (startDate) {
      reports = reports.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      reports = reports.filter((r) => r.date <= endDate);
    }
    if (status) {
      reports = reports.filter((r) => r.status === status);
    }
    if (targetApproverId) {
      reports = reports.filter((r) => r.targetApproverId === targetApproverId);
    }

    // 日付降順でソート
    reports = [...reports].sort((a, b) => b.date.localeCompare(a.date));

    return successResponse({ items: reports }, { count: reports.length });
  } catch (error) {
    return handleApiError(error, '日報取得に失敗');
  }
}

// POST - 日報作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    if (!body.employeeId || !body.date || !body.templateId) {
      return errorResponse('employeeId, date, templateId は必須です', 400);
    }

    const reports = getReportsForTenant(tenantId);

    // 同一日・同一従業員の重複チェック
    const existing = reports.find(
      (r) => r.employeeId === body.employeeId && r.date === body.date
    );
    if (existing) {
      return errorResponse('この日付の日報は既に存在します', 409);
    }

    const now = new Date().toISOString();
    const report: StoredReport = {
      id: `dr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      employeeId: body.employeeId,
      employeeName: body.employeeName || '',
      date: body.date,
      templateId: body.templateId,
      templateName: body.templateName || '',
      status: body.status || 'draft',
      values: body.values || [],
      submittedAt: body.status === 'submitted' ? now : null,
      targetApproverId: body.targetApproverId || null,
      targetApproverName: body.targetApproverName || null,
      approverId: null,
      approverName: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };

    reports.push(report);
    return successResponse({ item: report }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '日報作成に失敗');
  }
}

// PATCH - 日報更新
export async function PATCH(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDは必須です', 400);
    }

    const body = await request.json();
    const reports = getReportsForTenant(tenantId);
    const index = reports.findIndex((r) => r.id === id);

    if (index === -1) {
      return errorResponse('日報が見つかりません', 404);
    }

    const now = new Date().toISOString();
    reports[index] = {
      ...reports[index],
      status: body.status ?? reports[index].status,
      values: body.values ?? reports[index].values,
      submittedAt: body.submittedAt ?? reports[index].submittedAt,
      targetApproverId: body.targetApproverId ?? reports[index].targetApproverId,
      targetApproverName: body.targetApproverName ?? reports[index].targetApproverName,
      updatedAt: now,
    };

    return successResponse({ item: reports[index] });
  } catch (error) {
    return handleApiError(error, '日報更新に失敗');
  }
}

// DELETE - 日報削除
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDは必須です', 400);
    }

    const reports = getReportsForTenant(tenantId);
    const index = reports.findIndex((r) => r.id === id);

    if (index === -1) {
      return errorResponse('日報が見つかりません', 404);
    }

    // 提出済みの日報は削除不可
    if (reports[index].status === 'submitted' || reports[index].status === 'approved') {
      return errorResponse('提出済みの日報は削除できません', 400);
    }

    reports.splice(index, 1);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '日報削除に失敗');
  }
}
