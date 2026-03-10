import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
  validateRequired,
  parseFiscalYear,
} from '@/lib/api/api-helpers';

// 健診予定一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');
    const checkupTypeName = searchParams.get('checkupTypeName');
    const medicalInstitutionId = searchParams.get('medicalInstitutionId');

    const where: Record<string, unknown> = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (fiscalYear) {
      const fy = parseFiscalYear(fiscalYear);
      if (fy) where.fiscalYear = fy;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (checkupTypeName) {
      where.checkupTypeName = checkupTypeName;
    }

    if (medicalInstitutionId) {
      where.medicalInstitutionId = medicalInstitutionId;
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
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const {
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
      'userId',
      'userName',
      'checkupTypeName',
      'scheduledDate',
      'fiscalYear',
    ]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 日付バリデーション
    const parsedScheduledDate = new Date(scheduledDate);
    if (isNaN(parsedScheduledDate.getTime())) {
      return NextResponse.json({ error: '予定日の日付形式が不正です' }, { status: 400 });
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
        scheduledDate: parsedScheduledDate,
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
