import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest, parseFiscalYear } from '@/lib/api/api-helpers';

// ストレスチェック一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');
    const isHighStress = searchParams.get('isHighStress');
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

    if (status) {
      where.status = status;
    }

    if (isHighStress === 'true') {
      where.isHighStress = true;
    } else if (isHighStress === 'false') {
      where.isHighStress = false;
    }

    const [stressChecks, total] = await Promise.all([
      prisma.stress_checks.findMany({
        where,
        orderBy: { checkDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.stress_checks.count({ where }),
    ]);

    // 統計情報を計算（フィルタ年度があればその年度、なければ現在年度）
    const statsYear = fiscalYear ? parseInt(fiscalYear) : new Date().getFullYear();

    // 統計情報を全件ベースで取得（ページネーション範囲ではなくテナント全体）
    const [totalUsers, statusCounts, completedCount, highStressCount, interviewRequestedCount] = await Promise.all([
      prisma.users.count({
        where: { tenantId, status: 'active' },
      }),
      prisma.stress_checks.groupBy({
        by: ['status'],
        where: { tenantId, fiscalYear: statsYear },
        _count: true,
      }),
      prisma.stress_checks.count({
        where: { tenantId, fiscalYear: statsYear, status: 'completed' },
      }),
      prisma.stress_checks.count({
        where: { tenantId, fiscalYear: statsYear, isHighStress: true },
      }),
      prisma.stress_checks.count({
        where: { tenantId, fiscalYear: statsYear, interviewRequested: true },
      }),
    ]);

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
    const tenantId = await getTenantIdFromRequest(request);

    const body = await request.json();

    // 必須フィールドバリデーション
    if (!body.userId || !body.userName) {
      return NextResponse.json(
        { error: 'userId and userName are required' },
        { status: 400 }
      );
    }

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
    const existing = await prisma.stress_checks.findFirst({
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
      ? await prisma.stress_checks.update({
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
            updatedAt: new Date(),
          },
        })
      : await prisma.stress_checks.create({
          data: {
            id: crypto.randomUUID(),
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
            updatedAt: new Date(),
          },
        });

    return NextResponse.json({ data: stressCheck }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error creating stress check:', error);
    return NextResponse.json(
      { error: 'Failed to create stress check' },
      { status: 500 }
    );
  }
}
