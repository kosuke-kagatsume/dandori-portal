import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// ストレスチェック詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromRequest(request);

    const stressCheck = await prisma.stress_checks.findFirst({
      where: { id, tenantId },
    });

    if (!stressCheck) {
      return NextResponse.json(
        { error: 'Stress check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: stressCheck });
  } catch (error) {
    console.error('Error fetching stress check:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stress check' },
      { status: 500 }
    );
  }
}

// ストレスチェック更新（面談申請等）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const { id } = await params;
    const body = await request.json();

    // 既存チェック
    const existing = await prisma.stress_checks.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Stress check not found' },
        { status: 404 }
      );
    }

    const {
      interviewRequested,
      interviewScheduled,
      interviewScheduledAt,
      interviewCompleted,
      // interviewCompletedAt, // 完了日時は自動設定
      interviewNotes,
      doctorName,
      doctorOpinion,
    } = body;

    const stressCheck = await prisma.stress_checks.update({
      where: { id },
      data: {
        interviewRequested,
        interviewRequestedAt: interviewRequested && !existing.interviewRequested ? new Date() : undefined,
        interviewScheduled,
        interviewScheduledAt: interviewScheduledAt ? new Date(interviewScheduledAt) : undefined,
        interviewCompleted,
        interviewCompletedAt: interviewCompleted && !existing.interviewCompleted ? new Date() : undefined,
        interviewNotes,
        doctorName,
        doctorOpinion,
        status: interviewRequested ? 'interview_recommended' : undefined,
      },
    });

    return NextResponse.json({ data: stressCheck });
  } catch (error) {
    console.error('Error updating stress check:', error);
    return NextResponse.json(
      { error: 'Failed to update stress check' },
      { status: 500 }
    );
  }
}

// ストレスチェック削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const { id } = await params;

    // 既存チェック
    const existing = await prisma.stress_checks.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Stress check not found' },
        { status: 404 }
      );
    }

    await prisma.stress_checks.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stress check:', error);
    return NextResponse.json(
      { error: 'Failed to delete stress check' },
      { status: 500 }
    );
  }
}
