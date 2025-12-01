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
    interviewRequestedAt: null,
    interviewScheduled: false,
    interviewScheduledAt: null,
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
  },
  {
    id: 'stress-002',
    tenantId: 'tenant-demo-001',
    userId: 'user-002',
    userName: '山田花子',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-02'),
    status: 'completed',
    stressFactorsScore: 45,
    stressResponseScore: 42,
    socialSupportScore: 80,
    totalScore: 48,
    isHighStress: false,
    highStressReason: null,
    interviewRequested: false,
    interviewRequestedAt: null,
    interviewScheduled: false,
    interviewScheduledAt: null,
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-02'),
    updatedAt: new Date('2024-11-02'),
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
    interviewRequestedAt: new Date('2024-11-03'),
    interviewScheduled: true,
    interviewScheduledAt: new Date('2024-11-15'),
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-03'),
    updatedAt: new Date('2024-11-03'),
  },
  {
    id: 'stress-004',
    tenantId: 'tenant-demo-001',
    userId: 'user-004',
    userName: '鈴木一郎',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-04'),
    status: 'completed',
    stressFactorsScore: 55,
    stressResponseScore: 50,
    socialSupportScore: 68,
    totalScore: 55,
    isHighStress: false,
    highStressReason: null,
    interviewRequested: false,
    interviewRequestedAt: null,
    interviewScheduled: false,
    interviewScheduledAt: null,
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-04'),
    updatedAt: new Date('2024-11-04'),
  },
  {
    id: 'stress-005',
    tenantId: 'tenant-demo-001',
    userId: 'user-005',
    userName: '高橋真理',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-05'),
    status: 'pending',
    stressFactorsScore: null,
    stressResponseScore: null,
    socialSupportScore: null,
    totalScore: null,
    isHighStress: false,
    highStressReason: null,
    interviewRequested: false,
    interviewRequestedAt: null,
    interviewScheduled: false,
    interviewScheduledAt: null,
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-11-05'),
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
    interviewRequestedAt: new Date('2024-11-06'),
    interviewScheduled: false,
    interviewScheduledAt: null,
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-06'),
    updatedAt: new Date('2024-11-06'),
  },
  {
    id: 'stress-007',
    tenantId: 'tenant-demo-001',
    userId: 'user-007',
    userName: '渡辺美咲',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-07'),
    status: 'completed',
    stressFactorsScore: 40,
    stressResponseScore: 35,
    socialSupportScore: 85,
    totalScore: 40,
    isHighStress: false,
    highStressReason: null,
    interviewRequested: false,
    interviewRequestedAt: null,
    interviewScheduled: false,
    interviewScheduledAt: null,
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-07'),
    updatedAt: new Date('2024-11-07'),
  },
  {
    id: 'stress-008',
    tenantId: 'tenant-demo-001',
    userId: 'user-008',
    userName: '中村大輔',
    fiscalYear: 2024,
    checkDate: new Date('2024-11-08'),
    status: 'completed',
    stressFactorsScore: 60,
    stressResponseScore: 55,
    socialSupportScore: 65,
    totalScore: 58,
    isHighStress: false,
    highStressReason: null,
    interviewRequested: false,
    interviewRequestedAt: null,
    interviewScheduled: false,
    interviewScheduledAt: null,
    interviewCompleted: false,
    interviewCompletedAt: null,
    createdAt: new Date('2024-11-08'),
    updatedAt: new Date('2024-11-08'),
  },
];

// ストレスチェック一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const completedChecks = demoStressChecks.filter(s => s.status === 'completed');
      const highStressChecks = demoStressChecks.filter(s => s.isHighStress);
      const interviewRequestedChecks = demoStressChecks.filter(s => s.interviewRequested);

      const stats = {
        completionRate: Math.round((completedChecks.length / 8) * 100), // 8人想定
        highStressCount: highStressChecks.length,
        interviewRequestedCount: interviewRequestedChecks.length,
        byStatus: {
          pending: demoStressChecks.filter(s => s.status === 'pending').length,
          completed: completedChecks.length,
          interview_recommended: demoStressChecks.filter(s => s.status === 'interview_recommended').length,
        },
      };

      return successResponse(demoStressChecks, {
        pagination: { total: demoStressChecks.length, limit: 50, offset: 0, hasMore: false },
        stats,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');
    const isHighStress = searchParams.get('isHighStress');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (fiscalYear) {
      where.fiscalYear = parseInt(fiscalYear);
    }

    if (status) {
      where.status = status;
    }

    if (isHighStress === 'true') {
      where.isHighStress = true;
    }

    const [stressChecks, total] = await Promise.all([
      prisma.stressCheck.findMany({
        where,
        orderBy: { checkDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.stressCheck.count({ where }),
    ]);

    // 統計情報を計算（N+1問題解消: 5クエリ→2クエリ）
    const currentYear = new Date().getFullYear();

    // 1. ユーザー総数（受検率計算用）
    // 2. ステータス別集計（groupByで一度に取得）
    const [totalUsers, statusCounts] = await Promise.all([
      prisma.user.count({
        where: { tenantId, status: 'active' },
      }),
      prisma.stressCheck.groupBy({
        by: ['status'],
        where: { tenantId, fiscalYear: currentYear },
        _count: true,
      }),
    ]);

    // 取得済みデータからインメモリで計算（追加クエリ不要）
    const completedCount = stressChecks.filter(s => s.status === 'completed').length;
    const highStressCount = stressChecks.filter(s => s.isHighStress).length;
    const interviewRequestedCount = stressChecks.filter(s => s.interviewRequested).length;

    return NextResponse.json({
      data: stressChecks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        completionRate: totalUsers > 0 ? Math.round((completedCount / totalUsers) * 100) : 0,
        highStressCount,
        interviewRequestedCount,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Error fetching stress checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stress checks' },
      { status: 500 }
    );
  }
}

// ストレスチェック結果登録（回答送信）
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = getTenantId(searchParams);

    const body = await request.json();
    const {
      userId,
      userName,
      fiscalYear,
      responses,
      stressFactorsScore,
      stressResponseScore,
      socialSupportScore,
      totalScore,
      isHighStress,
      highStressReason,
    } = body;

    // 既存チェック（同一年度の重複防止）
    const existing = await prisma.stressCheck.findFirst({
      where: {
        tenantId,
        userId,
        fiscalYear: fiscalYear || new Date().getFullYear(),
      },
    });

    if (existing && existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Stress check already completed for this fiscal year' },
        { status: 400 }
      );
    }

    const stressCheck = existing
      ? await prisma.stressCheck.update({
          where: { id: existing.id },
          data: {
            checkDate: new Date(),
            status: 'completed',
            responses,
            stressFactorsScore,
            stressResponseScore,
            socialSupportScore,
            totalScore,
            isHighStress,
            highStressReason,
          },
        })
      : await prisma.stressCheck.create({
          data: {
            tenantId,
            userId,
            userName,
            fiscalYear: fiscalYear || new Date().getFullYear(),
            checkDate: new Date(),
            status: 'completed',
            responses,
            stressFactorsScore,
            stressResponseScore,
            socialSupportScore,
            totalScore,
            isHighStress,
            highStressReason,
          },
        });

    return NextResponse.json({ data: stressCheck }, { status: 201 });
  } catch (error) {
    console.error('Error creating stress check:', error);
    return NextResponse.json(
      { error: 'Failed to create stress check' },
      { status: 500 }
    );
  }
}
