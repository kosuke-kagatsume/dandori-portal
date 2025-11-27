import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';
import {
  withCache,
  generateCacheKey,
  CACHE_TTL,
  CACHE_PREFIX,
} from '@/lib/cache/redis';

// デモ用の法令・制度更新データ
const demoLegalUpdates = [
  {
    id: 'legal-001',
    title: '育児・介護休業法の改正',
    description: '男性育休取得促進のための改正。出生時育児休業（産後パパ育休）の創設、育児休業の分割取得が可能に。',
    category: '労務',
    effectiveDate: new Date('2024-04-01'),
    relatedLaws: ['育児・介護休業法'],
    affectedAreas: ['人事', '勤怠管理', '給与計算'],
    priority: 'high',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000130583.html',
    publishedAt: new Date('2024-01-15'),
    tenantStatus: { status: 'completed', notes: '就業規則を改定済み', completedAt: new Date('2024-03-15'), completedBy: '人事部' },
  },
  {
    id: 'legal-002',
    title: '電子帳簿保存法の改正',
    description: '電子取引データの保存義務化。2024年1月からの本格施行に伴う対応が必要。',
    category: '税務',
    effectiveDate: new Date('2024-01-01'),
    relatedLaws: ['電子帳簿保存法'],
    affectedAreas: ['経理', '総務'],
    priority: 'high',
    referenceUrl: 'https://www.nta.go.jp/law/joho-zeikaishaku/sonota/jirei/index.htm',
    publishedAt: new Date('2023-10-01'),
    tenantStatus: { status: 'completed', notes: '電子保存システム導入完了', completedAt: new Date('2023-12-20'), completedBy: '経理部' },
  },
  {
    id: 'legal-003',
    title: '働き方改革関連法（時間外労働上限規制）',
    description: '建設業・運送業への時間外労働上限規制適用開始（2024年問題）。',
    category: '労務',
    effectiveDate: new Date('2024-04-01'),
    relatedLaws: ['労働基準法'],
    affectedAreas: ['人事', '勤怠管理'],
    priority: 'high',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000148322.html',
    publishedAt: new Date('2023-06-01'),
    tenantStatus: { status: 'in_progress', notes: '勤怠システムの設定変更中', completedAt: null, completedBy: null },
  },
  {
    id: 'legal-004',
    title: '社会保険適用拡大',
    description: '従業員101人以上の企業でパート・アルバイトへの社会保険適用拡大。2024年10月からは51人以上に。',
    category: '社会保険',
    effectiveDate: new Date('2024-10-01'),
    relatedLaws: ['健康保険法', '厚生年金保険法'],
    affectedAreas: ['人事', '給与計算'],
    priority: 'medium',
    referenceUrl: 'https://www.nenkin.go.jp/service/kounen/tekiyo/jigyosho/tanjikan.html',
    publishedAt: new Date('2024-04-01'),
    tenantStatus: { status: 'pending', notes: null, completedAt: null, completedBy: null },
  },
  {
    id: 'legal-005',
    title: '定額減税の実施',
    description: '2024年6月から所得税・住民税の定額減税を実施。給与計算システムの対応が必要。',
    category: '税務',
    effectiveDate: new Date('2024-06-01'),
    relatedLaws: ['所得税法', '地方税法'],
    affectedAreas: ['給与計算', '経理'],
    priority: 'high',
    referenceUrl: 'https://www.nta.go.jp/users/gensen/teigakugenzei/index.htm',
    publishedAt: new Date('2024-03-01'),
    tenantStatus: { status: 'completed', notes: '給与システム対応済み', completedAt: new Date('2024-05-28'), completedBy: '経理部' },
  },
];

// GET /api/legal-updates - テナント用：公開済み法令一覧取得（自社のステータス込み）
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const stats = {
        total: demoLegalUpdates.length,
        completed: demoLegalUpdates.filter((d) => d.tenantStatus.status === 'completed').length,
        inProgress: demoLegalUpdates.filter((d) => d.tenantStatus.status === 'in_progress').length,
        pending: demoLegalUpdates.filter((d) => d.tenantStatus.status === 'pending').length,
      };

      return successResponse(demoLegalUpdates, {
        count: demoLegalUpdates.length,
        pagination: {
          page: 1,
          limit: 20,
          total: demoLegalUpdates.length,
          totalPages: 1,
        },
        stats,
        cacheSeconds: 300,
      });
    }
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // テナント側の対応状況でフィルタ
    const year = searchParams.get('year');
    const { page, limit, skip } = getPaginationParams(searchParams);

    // キャッシュキー生成
    const cacheKey = generateCacheKey(CACHE_PREFIX.LEGAL_UPDATES, {
      tenantId,
      category,
      status,
      year,
      page,
      limit,
    });

    // キャッシュを使用してデータ取得
    const result = await withCache(
      cacheKey,
      async () => {
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

        // 総件数取得
        const total = await prisma.legalUpdate.count({ where });

        // 法令を取得（select最適化）
        const legalUpdates = await prisma.legalUpdate.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            effectiveDate: true,
            relatedLaws: true,
            affectedAreas: true,
            priority: true,
            referenceUrl: true,
            publishedAt: true,
            isPublished: true,
            createdAt: true,
            tenantStatuses: {
              where: { tenantId },
              select: {
                status: true,
                notes: true,
                completedAt: true,
                completedBy: true,
              },
            },
          },
          orderBy: [
            { effectiveDate: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
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

        return { data, total, stats };
      },
      CACHE_TTL.LEGAL_UPDATES
    );

    return successResponse(result.data, {
      count: result.data.length,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      stats: result.stats,
      cacheSeconds: CACHE_TTL.LEGAL_UPDATES,
    });
  } catch (error) {
    return handleApiError(error, '法令情報の取得');
  }
}
