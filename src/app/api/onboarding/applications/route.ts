import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/onboarding/applications - 入社手続き一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { tenantId };
    if (status) {
      const statuses = status.split(',');
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    const applications = await prisma.onboarding_applications.findMany({
      where,
      include: {
        basic_info: { select: { status: true } },
        family_info: { select: { status: true } },
        bank_account: { select: { status: true } },
        commute_route: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(applications, { count: applications.length });
  } catch (error) {
    return handleApiError(error, '入社手続き一覧の取得');
  }
}

/**
 * POST /api/onboarding/applications - 入社手続き新規作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const validation = validateRequiredFields(body, [
      'applicantName',
      'applicantEmail',
      'hireDate',
    ]);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    const id = `onb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const accessToken = crypto.randomUUID();

    const application = await prisma.onboarding_applications.create({
      data: {
        id,
        tenantId,
        applicantName: body.applicantName,
        applicantEmail: body.applicantEmail,
        employeeNumber: body.employeeNumber || null,
        department: body.department || null,
        position: body.position || null,
        hireDate: new Date(body.hireDate),
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: 'invited',
        invitedAt: new Date(),
        accessToken,
        hrNotes: body.hrNotes || null,
        updatedAt: new Date(),
      },
    });

    return successResponse(application, { count: 1 });
  } catch (error) {
    return handleApiError(error, '入社手続きの作成');
  }
}
