import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

/**
 * GET /api/onboarding/applications/[id] - 入社手続き詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const application = await prisma.onboarding_applications.findFirst({
      where: { id, tenantId },
      include: {
        basic_info: true,
        family_info: true,
        bank_account: true,
        commute_route: true,
      },
    });

    if (!application) {
      return errorResponse('入社手続きが見つかりません', 404);
    }

    return successResponse(application);
  } catch (error) {
    return handleApiError(error, '入社手続き詳細の取得');
  }
}

/**
 * PATCH /api/onboarding/applications/[id] - ステータス更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const existing = await prisma.onboarding_applications.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('入社手続きが見つかりません', 404);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.status) updateData.status = body.status;
    if (body.hrNotes !== undefined) updateData.hrNotes = body.hrNotes;

    if (body.status === 'submitted') {
      updateData.submittedAt = new Date();
    } else if (body.status === 'under_review') {
      updateData.reviewedAt = new Date();
    } else if (body.status === 'approved') {
      updateData.approvedAt = new Date();
      if (body.approvedBy) updateData.approvedBy = body.approvedBy;
    }

    const application = await prisma.onboarding_applications.update({
      where: { id },
      data: updateData,
    });

    return successResponse(application);
  } catch (error) {
    return handleApiError(error, '入社手続きの更新');
  }
}

/**
 * DELETE /api/onboarding/applications/[id] - 入社手続き削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const existing = await prisma.onboarding_applications.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('入社手続きが見つかりません', 404);
    }

    await prisma.onboarding_applications.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '入社手続きの削除');
  }
}
