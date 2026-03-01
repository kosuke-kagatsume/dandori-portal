import { NextRequest } from 'next/server';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// 日報テンプレートのインメモリストアを参照
// NOTE: 同一プロセス内のインメモリなので、daily-report-templates/route.ts の Map を共有する必要がある
// Phase 2 で Prisma に移行すれば不要になる

// テンプレート取得用のヘルパー（テンプレートAPIを内部呼び出し）
async function getTemplatesForTenant(tenantId: string, request: NextRequest) {
  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/daily-report-templates?tenantId=${tenantId}`, {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.items || json.data || [];
}

// 従業員の部署IDを取得するヘルパー
async function getEmployeeDepartmentIds(
  tenantId: string,
  employeeId: string,
  request: NextRequest
): Promise<string[]> {
  const origin = new URL(request.url).origin;
  try {
    const res = await fetch(`${origin}/api/members?tenantId=${tenantId}&id=${employeeId}`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const member = json.data?.items?.[0] || json.data?.[0];
    if (!member) return [];
    // departmentId が単一文字列の場合と配列の場合に対応
    if (Array.isArray(member.departmentIds)) return member.departmentIds;
    if (member.departmentId) return [member.departmentId];
    if (member.department?.id) return [member.department.id];
    return [];
  } catch {
    return [];
  }
}

interface TemplateData {
  id: string;
  name: string;
  departmentIds: string[];
  submissionRule: string;
  reminderHours: number;
  approvalRequired: boolean;
  approverType: string;
  approverIds: string[];
  isActive: boolean;
  fields: Array<{
    id: string;
    label: string;
    fieldType: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    order: number;
  }>;
}

// GET - 従業員に適用されるテンプレートを取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return successResponse({ template: null });
    }

    // テンプレート一覧を取得
    const templates: TemplateData[] = await getTemplatesForTenant(tenantId, request);
    const activeTemplates = templates.filter((t) => t.isActive);

    if (activeTemplates.length === 0) {
      return successResponse({ template: null });
    }

    // 従業員の部署を取得
    const employeeDeptIds = await getEmployeeDepartmentIds(tenantId, employeeId, request);

    // 部署に一致するテンプレートを探す
    let matched = activeTemplates.find((t) =>
      t.departmentIds.some((deptId) => employeeDeptIds.includes(deptId))
    );

    // 部署一致がなければ、部署未指定（全社共通）のテンプレートを使う
    if (!matched) {
      matched = activeTemplates.find((t) => t.departmentIds.length === 0);
    }

    if (!matched) {
      return successResponse({ template: null });
    }

    return successResponse({
      template: {
        id: matched.id,
        name: matched.name,
        submissionRule: matched.submissionRule,
        reminderHours: matched.reminderHours,
        approvalRequired: matched.approvalRequired,
        approverType: matched.approverType || 'direct_manager',
        approverIds: matched.approverIds || [],
        fields: matched.fields,
      },
    });
  } catch (error) {
    return handleApiError(error, '従業員テンプレート取得に失敗');
  }
}
