import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// インメモリストア（Phase 2 で Prisma に移行予定）
interface StoredTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  departmentIds: string[];
  submissionRule: string;
  reminderHours: number;
  approvalRequired: boolean;
  approverType: 'direct_manager' | 'specific_person';
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
  createdAt: string;
  updatedAt: string;
}

const templateStore = new Map<string, StoredTemplate[]>();

function getTemplatesForTenant(tenantId: string): StoredTemplate[] {
  if (!templateStore.has(tenantId)) {
    templateStore.set(tenantId, []);
  }
  return templateStore.get(tenantId)!;
}

// GET - テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const templates = getTemplatesForTenant(tenantId);
    return successResponse({ items: templates }, { count: templates.length });
  } catch (error) {
    return handleApiError(error, 'テンプレート取得に失敗');
  }
}

// POST - テンプレート作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    if (!body.name) {
      return errorResponse('テンプレート名は必須です', 400);
    }

    const templates = getTemplatesForTenant(tenantId);

    // 重複チェック
    const existing = templates.find((t) => t.name === body.name);
    if (existing) {
      return errorResponse('同名のテンプレートが既に存在します', 409);
    }

    const now = new Date().toISOString();
    const template: StoredTemplate = {
      id: `drt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      name: body.name,
      description: body.description || '',
      departmentIds: body.departmentIds || [],
      submissionRule: body.submissionRule || 'optional',
      reminderHours: body.reminderHours || 0,
      approvalRequired: body.approvalRequired ?? false,
      approverType: body.approverType || 'direct_manager',
      approverIds: body.approverIds || [],
      isActive: body.isActive ?? true,
      fields: body.fields || [],
      createdAt: now,
      updatedAt: now,
    };

    templates.push(template);
    return successResponse({ item: template }, { count: 1 });
  } catch (error) {
    return handleApiError(error, 'テンプレート作成に失敗');
  }
}

// PATCH - テンプレート更新
export async function PATCH(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDは必須です', 400);
    }

    const body = await request.json();
    const templates = getTemplatesForTenant(tenantId);
    const index = templates.findIndex((t) => t.id === id);

    if (index === -1) {
      return errorResponse('テンプレートが見つかりません', 404);
    }

    // 名前重複チェック
    if (body.name) {
      const duplicate = templates.find((t) => t.name === body.name && t.id !== id);
      if (duplicate) {
        return errorResponse('同名のテンプレートが既に存在します', 409);
      }
    }

    templates[index] = {
      ...templates[index],
      name: body.name ?? templates[index].name,
      description: body.description ?? templates[index].description,
      departmentIds: body.departmentIds ?? templates[index].departmentIds,
      submissionRule: body.submissionRule ?? templates[index].submissionRule,
      reminderHours: body.reminderHours ?? templates[index].reminderHours,
      approvalRequired: body.approvalRequired ?? templates[index].approvalRequired,
      approverType: body.approverType ?? templates[index].approverType,
      approverIds: body.approverIds ?? templates[index].approverIds,
      isActive: body.isActive ?? templates[index].isActive,
      fields: body.fields ?? templates[index].fields,
      updatedAt: new Date().toISOString(),
    };

    return successResponse({ item: templates[index] });
  } catch (error) {
    return handleApiError(error, 'テンプレート更新に失敗');
  }
}

// DELETE - テンプレート削除
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDは必須です', 400);
    }

    const templates = getTemplatesForTenant(tenantId);
    const index = templates.findIndex((t) => t.id === id);

    if (index === -1) {
      return errorResponse('テンプレートが見つかりません', 404);
    }

    templates.splice(index, 1);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'テンプレート削除に失敗');
  }
}
