import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// 健康診断一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (fiscalYear) {
      where.fiscalYear = parseInt(fiscalYear);
    }

    if (status === 'requires_reexam') {
      where.requiresReexam = true;
    } else if (status === 'requires_treatment') {
      where.requiresTreatment = true;
    } else if (status === 'requires_guidance') {
      where.requiresGuidance = true;
    }

    const [checkups, total] = await Promise.all([
      prisma.health_checkups.findMany({
        where,
        include: {
          health_findings: true,
        },
        orderBy: { checkupDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.health_checkups.count({ where }),
    ]);

    // 統計情報を1クエリで取得（N+1問題解消: 4クエリ→1クエリ）
    const resultStats = await prisma.health_checkups.groupBy({
      by: ['overallResult'],
      where: { tenantId },
      _count: true,
    });

    // requiresReexam/requiresTreatmentの統計は既に取得したデータから計算（追加クエリ不要）
    const requiresReexamCount = checkups.filter(c => c.requiresReexam).length;
    const requiresTreatmentCount = checkups.filter(c => c.requiresTreatment).length;

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
    const {
      userId,
      userName,
      checkupDate,
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
    } = body;

    const checkup = await prisma.health_checkups.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        userName,
        checkupDate: new Date(checkupDate),
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
        updatedAt: new Date(),
        health_findings: findings
          ? {
              create: findings.map((f: { category: string; finding: string; severity: string; recommendation?: string }) => ({
                id: crypto.randomUUID(),
                tenantId,
                category: f.category,
                finding: f.finding,
                severity: f.severity,
                recommendation: f.recommendation,
                updatedAt: new Date(),
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
