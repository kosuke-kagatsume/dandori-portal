import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest, parseFiscalYear } from '@/lib/api/api-helpers';

// 健康診断一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);

    const where: Record<string, unknown> = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (fiscalYear) {
      const fy = parseFiscalYear(fiscalYear);
      if (fy) where.fiscalYear = fy;
    }

    if (status === 'requires_reexam') {
      where.requiresReexam = true;
    } else if (status === 'requires_treatment') {
      where.requiresTreatment = true;
    } else if (status === 'requires_guidance') {
      where.requiresGuidance = true;
    }

    // ソートカラムの動的設定（ホワイトリスト検証）
    const allowedSortFields = ['checkupDate', 'userName', 'department', 'overallResult', 'createdAt'];
    const orderByField = allowedSortFields.includes(sortBy || '') ? sortBy! : 'checkupDate';
    const orderByDir = sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Record<string, string> = { [orderByField]: orderByDir };

    const [checkups, total] = await Promise.all([
      prisma.health_checkups.findMany({
        where,
        include: {
          health_findings: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.health_checkups.count({ where }),
    ]);

    // 統計情報を全件ベースで取得（ページネーション範囲ではなくテナント全体）
    const [resultStats, requiresReexamCount, requiresTreatmentCount] = await Promise.all([
      prisma.health_checkups.groupBy({
        by: ['overallResult'],
        where: { tenantId },
        _count: true,
      }),
      prisma.health_checkups.count({
        where: { tenantId, requiresReexam: true },
      }),
      prisma.health_checkups.count({
        where: { tenantId, requiresTreatment: true },
      }),
    ]);

    return NextResponse.json({
      data: checkups,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        byResult: resultStats.reduce((acc, item) => {
          acc[item.overallResult] = item._count;
          return acc;
        }, {} as Record<string, number>),
        requiresReexam: requiresReexamCount,
        requiresTreatment: requiresTreatmentCount,
      },
    });
  } catch (error) {
    console.error('Error fetching health checkups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health checkups' },
      { status: 500 }
    );
  }
}

// 健康診断登録
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const body = await request.json();

    // 必須フィールドバリデーション
    if (!body.userId || !body.userName || !body.checkupDate || !body.checkupType || !body.overallResult) {
      return NextResponse.json(
        { error: 'userId, userName, checkupDate, checkupType, overallResult are required' },
        { status: 400 }
      );
    }

    // overallResult値バリデーション
    const validResults = ['A', 'B', 'C', 'D', 'E'];
    if (!validResults.includes(body.overallResult)) {
      return NextResponse.json(
        { error: `overallResult must be one of: ${validResults.join(', ')}` },
        { status: 400 }
      );
    }

    // checkupDate日付バリデーション（YYYY-MM-DD文字列をUTC正午でパースしタイムゾーンずれを防止）
    const parsedCheckupDate = (() => {
      const cd = body.checkupDate;
      if (typeof cd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cd)) {
        const [y, m, d] = cd.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      }
      return new Date(cd);
    })();
    if (isNaN(parsedCheckupDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid checkupDate format' },
        { status: 400 }
      );
    }

    const {
      userId,
      userName,
      department,
      checkupType,
      medicalInstitution,
      fiscalYear,
      overallResult,
      requiresReexam,
      requiresTreatment,
      requiresGuidance,
      height,
      weight,
      bmi,
      waistCircumference,
      eyesightLeft,
      eyesightRight,
      hearingLeft,
      hearingRight,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      bloodGlucose,
      hba1c,
      triglycerides,
      hdlCholesterol,
      ldlCholesterol,
      got,
      gpt,
      gammaGtp,
      uricAcid,
      urinaryProtein,
      urinaryGlucose,
      followUpStatus,
      followUpDate,
      followUpNotes,
      doctorOpinion,
      workRestriction,
      findings,
      bloodType,
      selectedExamTypeId,
      selectedOptionIds,
      totalCost,
    } = body;

    const checkup = await prisma.health_checkups.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        userName,
        department,
        checkupDate: parsedCheckupDate,
        checkupType,
        medicalInstitution,
        fiscalYear: fiscalYear || new Date().getFullYear(),
        overallResult,
        requiresReexam: requiresReexam || false,
        requiresTreatment: requiresTreatment || false,
        requiresGuidance: requiresGuidance || false,
        height,
        weight,
        bmi,
        waistCircumference,
        eyesightLeft,
        eyesightRight,
        hearingLeft,
        hearingRight,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        bloodGlucose,
        hba1c,
        triglycerides,
        hdlCholesterol,
        ldlCholesterol,
        got,
        gpt,
        gammaGtp,
        uricAcid,
        urinaryProtein,
        urinaryGlucose,
        followUpStatus: followUpStatus || 'none',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpNotes,
        doctorOpinion,
        workRestriction,
        bloodType,
        selectedExamTypeId,
        selectedOptionIds: selectedOptionIds || undefined,
        totalCost,
        updatedAt: new Date(),
        health_findings: findings
          ? {
              create: findings.map((f: { category: string; finding: string; severity: string; recommendation?: string }) => ({
                id: crypto.randomUUID(),
                category: f.category,
                finding: f.finding,
                severity: f.severity,
                recommendation: f.recommendation,
              })),
            }
          : undefined,
      },
      include: {
        health_findings: true,
      },
    });

    return NextResponse.json({ data: checkup }, { status: 201 });
  } catch (error) {
    console.error('Error creating health checkup:', error);
    return NextResponse.json(
      { error: 'Failed to create health checkup' },
      { status: 500 }
    );
  }
}
