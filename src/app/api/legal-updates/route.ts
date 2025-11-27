import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/legal-updates - テナント用：公開済み法令一覧取得（自社のステータス込み）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // テナント側の対応状況でフィルタ
    const year = searchParams.get('year');

    // 公開済みの法令のみ取得
    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    // 年度でフィルタ
    if (year && year !== 'all') {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      where.effectiveDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // 法令を取得
    const legalUpdates = await prisma.legalUpdate.findMany({
      where,
      orderBy: [
        { effectiveDate: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        tenantStatuses: {
          where: { tenantId },
        },
      },
    });

    // テナント対応状況でフィルタリング（アプリケーション側で処理）
    let filteredUpdates = legalUpdates;
    if (status && status !== 'all') {
      filteredUpdates = legalUpdates.filter((update) => {
        const tenantStatus = update.tenantStatuses[0];
        if (status === 'pending') {
          return !tenantStatus || tenantStatus.status === 'pending';
        }
        return tenantStatus?.status === status;
      });
    }

    // レスポンス形式に整形
    const data = filteredUpdates.map((update) => {
      const tenantStatus = update.tenantStatuses[0];
      return {
        id: update.id,
        title: update.title,
        description: update.description,
        category: update.category,
        effectiveDate: update.effectiveDate,
        relatedLaws: update.relatedLaws,
        affectedAreas: update.affectedAreas,
        priority: update.priority,
        referenceUrl: update.referenceUrl,
        publishedAt: update.publishedAt,
        // テナント固有のステータス
        tenantStatus: tenantStatus ? {
          status: tenantStatus.status,
          notes: tenantStatus.notes,
          completedAt: tenantStatus.completedAt,
          completedBy: tenantStatus.completedBy,
        } : {
          status: 'pending',
          notes: null,
          completedAt: null,
          completedBy: null,
        },
      };
    });

    // 統計情報
    const stats = {
      total: data.length,
      completed: data.filter((d) => d.tenantStatus.status === 'completed').length,
      inProgress: data.filter((d) => d.tenantStatus.status === 'in_progress').length,
      pending: data.filter((d) => d.tenantStatus.status === 'pending').length,
    };

    return NextResponse.json({
      success: true,
      data,
      stats,
    });
  } catch (error) {
    console.error('Error fetching legal updates for tenant:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch legal updates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
