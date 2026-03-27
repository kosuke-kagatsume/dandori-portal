import { NextRequest } from 'next/server';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import { prisma } from '@/lib/prisma';
import { getTemplatesForTenant as getTemplatesFromStore } from '@/app/api/daily-report-templates/_store';

// 従業員の部署IDを取得するヘルパー（DB直接参照）
async function getEmployeeDepartmentIds(
  employeeId: string,
): Promise<string[]> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: employeeId },
      select: { departmentId: true, department: true },
    });
    if (!user) return [];
    if (user.departmentId) return [user.departmentId];
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

    // テンプレート一覧をストアから直接取得（内部fetchではなく直接参照）
    const templates: TemplateData[] = getTemplatesFromStore(tenantId);
    const activeTemplates = templates.filter((t) => t.isActive);

    if (activeTemplates.length === 0) {
      return successResponse({ template: null });
    }

    // 従業員の部署を取得
    const employeeDeptIds = await getEmployeeDepartmentIds(employeeId);

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
