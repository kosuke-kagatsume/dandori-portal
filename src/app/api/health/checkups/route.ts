import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, successResponse } from '@/lib/api/api-helpers';

// デモ用健康診断データ
const demoHealthCheckups = [
  {
    id: 'checkup-001',
    tenantId: 'tenant-demo-001',
    userId: 'user-001',
    userName: '田中太郎',
    checkupDate: new Date('2024-04-15'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'B',
    requiresReexam: false,
    requiresTreatment: false,
    requiresGuidance: true,
    height: 172.5,
    weight: 68.0,
    bmi: 22.9,
    bloodPressureSystolic: 125,
    bloodPressureDiastolic: 82,
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-04-15'),
    findings: [],
  },
  {
    id: 'checkup-002',
    tenantId: 'tenant-demo-001',
    userId: 'user-002',
    userName: '山田花子',
    checkupDate: new Date('2024-04-16'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'A',
    requiresReexam: false,
    requiresTreatment: false,
    requiresGuidance: false,
    height: 158.0,
    weight: 52.0,
    bmi: 20.8,
    bloodPressureSystolic: 110,
    bloodPressureDiastolic: 70,
    createdAt: new Date('2024-04-16'),
    updatedAt: new Date('2024-04-16'),
    findings: [],
  },
  {
    id: 'checkup-003',
    tenantId: 'tenant-demo-001',
    userId: 'user-003',
    userName: '佐藤次郎',
    checkupDate: new Date('2024-04-17'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'C',
    requiresReexam: true,
    requiresTreatment: false,
    requiresGuidance: true,
    height: 175.0,
    weight: 82.0,
    bmi: 26.8,
    bloodPressureSystolic: 145,
    bloodPressureDiastolic: 92,
    createdAt: new Date('2024-04-17'),
    updatedAt: new Date('2024-04-17'),
    findings: [
      { id: 'finding-001', category: '血圧', finding: '高血圧', severity: 'warning', recommendation: '再検査推奨' },
    ],
  },
  {
    id: 'checkup-004',
    tenantId: 'tenant-demo-001',
    userId: 'user-004',
    userName: '鈴木一郎',
    checkupDate: new Date('2024-04-18'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'A',
    requiresReexam: false,
    requiresTreatment: false,
    requiresGuidance: false,
    height: 168.0,
    weight: 62.0,
    bmi: 22.0,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 76,
    createdAt: new Date('2024-04-18'),
    updatedAt: new Date('2024-04-18'),
    findings: [],
  },
  {
    id: 'checkup-005',
    tenantId: 'tenant-demo-001',
    userId: 'user-005',
    userName: '高橋真理',
    checkupDate: new Date('2024-04-19'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'B',
    requiresReexam: false,
    requiresTreatment: false,
    requiresGuidance: true,
    height: 162.0,
    weight: 58.0,
    bmi: 22.1,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 78,
    createdAt: new Date('2024-04-19'),
    updatedAt: new Date('2024-04-19'),
    findings: [],
  },
  {
    id: 'checkup-006',
    tenantId: 'tenant-demo-001',
    userId: 'user-006',
    userName: '伊藤健',
    checkupDate: new Date('2024-04-20'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'D',
    requiresReexam: true,
    requiresTreatment: true,
    requiresGuidance: true,
    height: 180.0,
    weight: 95.0,
    bmi: 29.3,
    bloodPressureSystolic: 160,
    bloodPressureDiastolic: 100,
    createdAt: new Date('2024-04-20'),
    updatedAt: new Date('2024-04-20'),
    findings: [
      { id: 'finding-002', category: '血圧', finding: '重度高血圧', severity: 'critical', recommendation: '要治療' },
      { id: 'finding-003', category: '肥満', finding: '肥満2度', severity: 'warning', recommendation: '生活習慣改善' },
    ],
  },
  {
    id: 'checkup-007',
    tenantId: 'tenant-demo-001',
    userId: 'user-007',
    userName: '渡辺美咲',
    checkupDate: new Date('2024-04-21'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'A',
    requiresReexam: false,
    requiresTreatment: false,
    requiresGuidance: false,
    height: 155.0,
    weight: 48.0,
    bmi: 20.0,
    bloodPressureSystolic: 108,
    bloodPressureDiastolic: 68,
    createdAt: new Date('2024-04-21'),
    updatedAt: new Date('2024-04-21'),
    findings: [],
  },
  {
    id: 'checkup-008',
    tenantId: 'tenant-demo-001',
    userId: 'user-008',
    userName: '中村大輔',
    checkupDate: new Date('2024-04-22'),
    checkupType: 'regular',
    medicalInstitution: '東京健診センター',
    fiscalYear: 2024,
    overallResult: 'B',
    requiresReexam: false,
    requiresTreatment: false,
    requiresGuidance: true,
    height: 170.0,
    weight: 72.0,
    bmi: 24.9,
    bloodPressureSystolic: 130,
    bloodPressureDiastolic: 85,
    createdAt: new Date('2024-04-22'),
    updatedAt: new Date('2024-04-22'),
    findings: [],
  },
];

// 健康診断一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const stats = {
        byResult: {
          A: demoHealthCheckups.filter(c => c.overallResult === 'A').length,
          B: demoHealthCheckups.filter(c => c.overallResult === 'B').length,
          C: demoHealthCheckups.filter(c => c.overallResult === 'C').length,
          D: demoHealthCheckups.filter(c => c.overallResult === 'D').length,
        },
        requiresReexam: demoHealthCheckups.filter(c => c.requiresReexam).length,
        requiresTreatment: demoHealthCheckups.filter(c => c.requiresTreatment).length,
      };
      return successResponse(demoHealthCheckups, {
        count: demoHealthCheckups.length,
        pagination: { page: 1, limit: 50, total: demoHealthCheckups.length, totalPages: 1 },
        stats,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);
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
      prisma.healthCheckup.findMany({
        where,
        include: {
          findings: true,
        },
        orderBy: { checkupDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.healthCheckup.count({ where }),
    ]);

    // 統計情報を計算
    const stats = await prisma.healthCheckup.groupBy({
      by: ['overallResult'],
      where: { tenantId },
      _count: true,
    });

    const requiresReexamCount = await prisma.healthCheckup.count({
      where: { tenantId, requiresReexam: true },
    });

    const requiresTreatmentCount = await prisma.healthCheckup.count({
      where: { tenantId, requiresTreatment: true },
    });

    return NextResponse.json({
      data: checkups,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        byResult: stats.reduce((acc, item) => {
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
    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);

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

    const checkup = await prisma.healthCheckup.create({
      data: {
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
        findings: findings
          ? {
              create: findings.map((f: { category: string; finding: string; severity: string; recommendation?: string }) => ({
                category: f.category,
                finding: f.finding,
                severity: f.severity,
                recommendation: f.recommendation,
              })),
            }
          : undefined,
      },
      include: {
        findings: true,
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
