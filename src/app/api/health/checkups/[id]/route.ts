import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// 健康診断詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
