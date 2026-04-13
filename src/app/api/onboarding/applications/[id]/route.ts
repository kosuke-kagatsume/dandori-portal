import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';
import crypto from 'crypto';

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
 * status: 'approved' の場合、ユーザーレコードを自動作成する
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
      include: { basic_info: true },
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

      // ユーザーが未作成の場合のみ作成
      if (!existing.userId) {
        const userId = await createUserFromOnboarding(existing, tenantId);
        if (userId) {
          updateData.userId = userId;
          updateData.status = 'completed';
        }
      }
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
 * 入社手続きデータからユーザーレコードを作成
 */
async function createUserFromOnboarding(
  application: {
    applicantName: string;
    applicantEmail: string;
    employeeNumber: string | null;
    department: string | null;
    position: string | null;
    hireDate: Date;
    tenantId: string;
    basic_info: { formData: unknown } | null;
  },
  tenantId: string,
): Promise<string | null> {
  // 同じメールアドレスのユーザーが既に存在する場合はスキップ
  const existingUser = await prisma.users.findFirst({
    where: { email: application.applicantEmail, tenantId },
  });
  if (existingUser) {
    return existingUser.id;
  }

  // 基本情報フォームから追加フィールドを抽出
  const formData = (application.basic_info?.formData || {}) as Record<string, unknown>;

  const userId = crypto.randomUUID();
  await prisma.users.create({
    data: {
      id: userId,
      tenantId,
      email: application.applicantEmail,
      name: application.applicantName,
      employeeNumber: application.employeeNumber || undefined,
      department: application.department || undefined,
      position: application.position || undefined,
      hireDate: application.hireDate.toISOString().split('T')[0],
      roles: ['employee'],
      status: 'active',
      timezone: 'Asia/Tokyo',
      // 基本情報フォームからの追加フィールド
      ...(formData.phone ? { phone: String(formData.phone) } : {}),
      ...(formData.birthDate ? { birthDate: String(formData.birthDate) } : {}),
      ...(formData.gender ? { gender: String(formData.gender) } : {}),
      ...(formData.postalCode ? { postalCode: String(formData.postalCode) } : {}),
      ...(formData.address ? { address: String(formData.address) } : {}),
      updatedAt: new Date(),
    },
  });

  return userId;
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
