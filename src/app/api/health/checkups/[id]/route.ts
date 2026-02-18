import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest, successResponse } from '@/lib/api/api-helpers';

// デモ用健康診断データ（checkups/route.tsと同じデータを参照）
const demoHealthCheckups = [
  {
    id: 'checkup-001',
    tenantId: 'tenant-1',
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
    tenantId: 'tenant-1',
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
    tenantId: 'tenant-1',
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
    id: 'checkup-006',
    tenantId: 'tenant-1',
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
];

// 健康診断詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const checkup = demoHealthCheckups.find(c => c.id === id);
      if (!checkup) {
        return NextResponse.json(
          { error: 'Health checkup not found' },
          { status: 404 }
        );
      }
      return successResponse(checkup);
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);

    const checkup = await prisma.health_checkups.findFirst({
      where: { id, tenantId },
      include: {
        health_findings: true,
      },
    });

    if (!checkup) {
      return NextResponse.json(
        { error: 'Health checkup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: checkup });
  } catch (error) {
    console.error('Error fetching health checkup:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health checkup' },
      { status: 500 }
    );
  }
}

// 健康診断更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);

    const { id } = await params;
    const body = await request.json();

    // 既存チェック
    const existing = await prisma.health_checkups.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Health checkup not found' },
        { status: 404 }
      );
    }

    const {
      checkupDate,
      checkupType,
      medicalInstitution,
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

    // トランザクションで更新
    const checkup = await prisma.$transaction(async (tx) => {
      // 既存の所見を削除
      if (findings) {
        await tx.health_findings.deleteMany({
          where: { checkupId: id },
        });
      }

      // 健康診断を更新
      return tx.health_checkups.update({
        where: { id },
        data: {
          checkupDate: checkupDate ? new Date(checkupDate) : undefined,
          checkupType,
          medicalInstitution,
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
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          followUpNotes,
          doctorOpinion,
          workRestriction,
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
    });

    return NextResponse.json({ data: checkup });
  } catch (error) {
    console.error('Error updating health checkup:', error);
    return NextResponse.json(
      { error: 'Failed to update health checkup' },
      { status: 500 }
    );
  }
}

// 健康診断削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);

    const { id } = await params;

    // 既存チェック
    const existing = await prisma.health_checkups.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Health checkup not found' },
        { status: 404 }
      );
    }

    await prisma.health_checkups.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting health checkup:', error);
    return NextResponse.json(
      { error: 'Failed to delete health checkup' },
      { status: 500 }
    );
  }
}
