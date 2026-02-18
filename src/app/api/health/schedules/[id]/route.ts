import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api/api-helpers';

// 健診予定個別取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const schedule = await prisma.health_checkup_schedules.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: '健診予定が見つかりません' },
        { status: 404 }
      );
    }

    return successResponse(schedule);
  } catch (error) {
    return handleApiError(error, '健診予定の取得');
  }
}

// 健診予定更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
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

    const schedule = await prisma.health_checkup_schedules.update({
      where: { id },
      data: {
        ...(userName !== undefined && { userName }),
        ...(departmentName !== undefined && { departmentName }),
        ...(checkupTypeName !== undefined && { checkupTypeName }),
        ...(medicalInstitutionId !== undefined && { medicalInstitutionId }),
        ...(scheduledDate !== undefined && { scheduledDate: new Date(scheduledDate) }),
        ...(scheduledTime !== undefined && { scheduledTime }),
        ...(status !== undefined && { status }),
        ...(fiscalYear !== undefined && { fiscalYear }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      },
    });

    return successResponse(schedule);
  } catch (error) {
    return handleApiError(error, '健診予定の更新');
  }
}

// 健診予定削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.health_checkup_schedules.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, '健診予定の削除');
  }
}
