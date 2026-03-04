import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    await getTenantIdFromRequest(request);

    const record = await prisma.onboarding_basic_info.findUnique({
      where: { applicationId },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '基本情報の取得');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json();
    await getTenantIdFromRequest(request);

    const existing = await prisma.onboarding_basic_info.findUnique({
      where: { applicationId },
    });

    if (existing) {
      const updated = await prisma.onboarding_basic_info.update({
        where: { applicationId },
        data: {
          formData: body.formData,
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return successResponse(updated);
    }

    const record = await prisma.onboarding_basic_info.create({
      data: {
        id: `obi-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        applicationId,
        formData: body.formData,
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return successResponse(record);
  } catch (error) {
    return handleApiError(error, '基本情報の提出');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json();
    await getTenantIdFromRequest(request);

    const existing = await prisma.onboarding_basic_info.findUnique({
      where: { applicationId },
    });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.formData) updateData.formData = body.formData;

    if (body.action === 'draft') {
      updateData.status = 'draft';
      updateData.savedAt = new Date();
    } else if (body.action === 'approve') {
      updateData.status = 'approved';
      updateData.approvedAt = new Date();
      if (body.approvedBy) updateData.approvedBy = body.approvedBy;
    } else if (body.action === 'return') {
      updateData.status = 'returned';
      updateData.returnedAt = new Date();
      if (body.reviewComment) updateData.reviewComment = body.reviewComment;
    }

    if (existing) {
      const updated = await prisma.onboarding_basic_info.update({
        where: { applicationId },
        data: updateData,
      });
      return successResponse(updated);
    }

    const record = await prisma.onboarding_basic_info.create({
      data: {
        id: `obi-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        applicationId,
        formData: body.formData || {},
        updatedAt: new Date(),
        ...(updateData as Record<string, string | Date | null>),
      },
    });
    return successResponse(record);
  } catch (error) {
    if (error instanceof Error && error.message.includes('見つかりません')) {
      return errorResponse('基本情報が見つかりません', 404);
    }
    return handleApiError(error, '基本情報の更新');
  }
}
