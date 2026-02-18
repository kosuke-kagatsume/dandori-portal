import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
  validateRequired,
} from '@/lib/api/api-helpers';

// 健診予定一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (fiscalYear) {
      where.fiscalYear = parseInt(fiscalYear);
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const schedules = await prisma.health_checkup_schedules.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
    });

    return successResponse(schedules);
  } catch (error) {
    return handleApiError(error, '健診予定の取得');
  }
}

// 健診予定登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      userId,
      userName,
      departmentName,
      checkupTypeName,
      medicalInstitutionId,
      scheduledDate,
      scheduledTime,
      status,
      fiscalYear,
      notes,
    } = body;

    const validation = validateRequired(body, [
      'tenantId',
      'userId',
      'userName',
      'checkupTypeName',
      'scheduledDate',
      'fiscalYear',
    ]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const schedule = await prisma.health_checkup_schedules.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        userName,
        departmentName,
        checkupTypeName,
        medicalInstitutionId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        status: status || 'scheduled',
        fiscalYear,
        notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '健診予定の登録');
  }
}
