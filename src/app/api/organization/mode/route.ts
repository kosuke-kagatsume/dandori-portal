import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/organization/mode - テナントの組織管理モードを取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const settings = await prisma.tenant_settings.findUnique({
      where: { tenantId },
      select: { organizationMode: true },
    });

    return successResponse({
      mode: settings?.organizationMode ?? 'flat',
    });
  } catch (error) {
    return handleApiError(error, '組織管理モードの取得');
  }
}

// PUT /api/organization/mode - テナントの組織管理モードを変更（admin権限のみ）
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const { mode } = body;

    if (mode !== 'flat' && mode !== 'hierarchy') {
      return errorResponse('モードは "flat" または "hierarchy" を指定してください', 400);
    }

    await prisma.tenant_settings.upsert({
      where: { tenantId },
      update: { organizationMode: mode },
      create: {
        id: crypto.randomUUID(),
        tenantId,
        organizationMode: mode,
        updatedAt: new Date(),
      },
    });

    return successResponse({ mode });
  } catch (error) {
    return handleApiError(error, '組織管理モードの変更');
  }
}
