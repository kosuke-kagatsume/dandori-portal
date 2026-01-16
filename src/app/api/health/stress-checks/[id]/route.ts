import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantId, successResponse } from '@/lib/api/api-helpers';

// デモ用ストレスチェックデータ
const demoStressChecks = [
  {
    id: 'stress-001',
    tenantId: 'tenant-demo-001',
    userId: 'user-001',
    userName: '田中太郎',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-01'),
    status: 'completed',
    stressFactorsScore: 65,
    stressResponseScore: 58,
    socialSupportScore: 72,
    totalScore: 65,
    isHighStress: false,
    highStressReason: null,
    interviewRequested: false,
    interviewScheduled: false,
    interviewCompleted: false,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: 'stress-003',
    tenantId: 'tenant-demo-001',
    userId: 'user-003',
    userName: '佐藤次郎',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-03'),
    status: 'completed',
    stressFactorsScore: 82,
    stressResponseScore: 78,
    socialSupportScore: 45,
    totalScore: 78,
    isHighStress: true,
    highStressReason: 'ストレス要因と反応スコアが高く、サポート環境が不十分',
    interviewRequested: true,
    interviewScheduled: true,
    interviewScheduledAt: new Date('2024-11-15'),
    interviewCompleted: false,
    createdAt: new Date('2024-11-03'),
    updatedAt: new Date('2024-11-03'),
  },
  {
    id: 'stress-006',
    tenantId: 'tenant-demo-001',
    userId: 'user-006',
    userName: '伊藤健',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-06'),
    status: 'interview_recommended',
    stressFactorsScore: 88,
    stressResponseScore: 85,
    socialSupportScore: 38,
    totalScore: 85,
    isHighStress: true,
    highStressReason: '業務負荷が高く、職場環境のサポートが不足',
    interviewRequested: true,
    interviewScheduled: false,
    interviewCompleted: false,
    createdAt: new Date('2024-11-06'),
    updatedAt: new Date('2024-11-06'),
  },
];

// ストレスチェック詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const stressCheck = demoStressChecks.find(s => s.id === id);
      if (!stressCheck) {
        return NextResponse.json(
          { error: 'Stress check not found' },
          { status: 404 }
        );
      }
      return successResponse(stressCheck);
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);

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
    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);

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
    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);

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
