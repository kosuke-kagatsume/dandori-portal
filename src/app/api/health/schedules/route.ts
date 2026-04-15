import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
  validateRequired,
  parseFiscalYear,
} from '@/lib/api/api-helpers';
import { getCurrentFiscalYear, toWareki, calculateAgeAtFiscalYearEnd } from '@/lib/utils';

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

    // enrichedモード: users/institutions JOINで19列データ返却
    const enrich = searchParams.get('enrich') === 'true';

    const schedules = await prisma.health_checkup_schedules.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
    });

    if (enrich) {
      // ユーザー情報取得
      const userIds = Array.from(new Set(schedules.map(s => s.userId)));
      const users = userIds.length > 0
        ? await prisma.users.findMany({
            where: { id: { in: userIds }, tenantId },
            select: {
              id: true,
              name: true,
              department: true,
              birthDate: true,
              gender: true,
              insuranceNumber: true,
              postalCode: true,
              address: true,
              phone: true,
            },
          })
        : [];
      const userMap = new Map(users.map(u => [u.id, u]));

      // 医療機関情報取得
      const instIds = Array.from(new Set(schedules.map(s => s.medicalInstitutionId).filter((v): v is string => v != null)));
      const institutions = instIds.length > 0
        ? await prisma.health_medical_institutions.findMany({
            where: { id: { in: instIds }, tenantId },
            select: { id: true, name: true, region: true },
          })
        : [];
      const instMap = new Map(institutions.map(i => [i.id, i]));

      // 検査料金取得
      const examPrices = await prisma.health_institution_exam_prices.findMany({
        where: { tenantId, isActive: true },
        include: { health_checkup_types: { select: { name: true } } },
      });

      // オプション取得
      const options = instIds.length > 0
        ? await prisma.health_institution_options.findMany({
            where: { institutionId: { in: instIds }, tenantId },
          })
        : [];

      const fy = fiscalYear ? parseInt(fiscalYear) : getCurrentFiscalYear();

      const enrichedData = schedules.map(s => {
        const user = userMap.get(s.userId);
        const inst = s.medicalInstitutionId ? instMap.get(s.medicalInstitutionId) : null;

        // 基本料金
        const ep = s.medicalInstitutionId
          ? examPrices.find(p =>
              p.institutionId === s.medicalInstitutionId &&
              (p.checkupTypeName === s.checkupTypeName || p.health_checkup_types?.name === s.checkupTypeName)
            )
          : null;

        // オプション名一覧
        const selIds = (s.selectedOptionIds as string[] | null) || [];
        const instOptions = s.medicalInstitutionId
          ? options.filter(o => o.institutionId === s.medicalInstitutionId)
          : [];
        const optionNames = selIds
          .map(id => instOptions.find(o => o.id === id)?.name || '')
          .filter(Boolean);

        // 和暦・年齢
        let birthDateWareki = '';
        let age = 0;
        if (user?.birthDate) {
          birthDateWareki = toWareki(user.birthDate);
          age = calculateAgeAtFiscalYearEnd(user.birthDate, fy);
        }

        return {
          ...s,
          birthDate: user?.birthDate?.toISOString() || null,
          birthDateWareki,
          age,
          gender: user?.gender || null,
          insuranceNumber: user?.insuranceNumber || null,
          postalCode: user?.postalCode || null,
          address: user?.address || null,
          phone: user?.phone || null,
          institutionName: inst?.name || null,
          optionNames,
          basePrice: ep?.price ?? null,
        };
      });

      return successResponse(enrichedData);
    }

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
      region,
      selectedOptionIds,
      totalCost,
      companyPaidOptionCost,
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

    // 日付バリデーション（YYYY-MM-DD文字列をUTC正午でパースしタイムゾーンずれを防止）
    const parsedScheduledDate = (() => {
      if (typeof scheduledDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
        const [y, m, d] = scheduledDate.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      }
      return new Date(scheduledDate);
    })();
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
        region,
        selectedOptionIds: selectedOptionIds || undefined,
        totalCost: totalCost ?? undefined,
        companyPaidOptionCost: companyPaidOptionCost ?? undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '健診予定の登録');
  }
}
