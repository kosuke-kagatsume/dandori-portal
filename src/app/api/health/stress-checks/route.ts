import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// ストレスチェック一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = await getTenantIdFromRequest(request);
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
      prisma.stress_checks.findMany({
        where,
        orderBy: { checkDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.stress_checks.count({ where }),
    ]);

    // 統計情報を計算（N+1問題解消: 5クエリ→2クエリ）
    const currentYear = new Date().getFullYear();

    // 1. ユーザー総数（受検率計算用）
    // 2. ステータス別集計（groupByで一度に取得）
    const [totalUsers, statusCounts] = await Promise.all([
      prisma.users.count({
        where: { tenantId, status: 'active' },
      }),
      prisma.stress_checks.groupBy({
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
    const tenantId = await getTenantIdFromRequest(request);

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

    return NextResponse.json({ data: stressCheck }, { status: 201 });
  } catch (error) {
    console.error('Error creating stress check:', error);
    return NextResponse.json(
      { error: 'Failed to create stress check' },
      { status: 500 }
    );
  }
}
