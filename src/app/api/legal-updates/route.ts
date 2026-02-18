import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';
import {
  withCache,
  generateCacheKey,
  CACHE_TTL,
  CACHE_PREFIX,
} from '@/lib/cache/redis';
import { demoLegalUpdates as importedDemoLegalUpdates } from '@/lib/demo-legal-updates';

// デモ用の法令・制度更新データ（demo-legal-updates.tsから変換）
const demoLegalUpdates = importedDemoLegalUpdates.map((update, index) => ({
  id: `legal-${String(index + 1).padStart(3, '0')}`,
  title: update.title,
  description: update.description,
  // カテゴリは英語キーをそのまま保持（フロントエンドで日本語変換）
  category: update.category,
  effectiveDate: new Date(update.effectiveDate),
  relatedLaws: update.lawName || null,
  affectedAreas: update.affectedAreas,
  priority: update.importance === 'critical' ? 'high' :
            update.importance === 'high' ? 'high' :
            update.importance === 'medium' ? 'medium' : 'low',
  referenceUrl: update.referenceUrl || null,
  publishedAt: new Date(update.effectiveDate),
  tenantStatus: {
    status: update.status === 'applied' ? 'completed' :
            update.status === 'preparing' ? 'in_progress' : 'pending',
    notes: update.systemUpdateDetails || null,
    completedAt: update.status === 'applied' ? new Date(update.effectiveDate) : null,
    completedBy: update.status === 'applied' ? update.createdBy : null,
  },
}));

// GET /api/legal-updates - テナント用：公開済み法令一覧取得（自社のステータス込み）
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const { searchParams } = new URL(request.url);
      const category = searchParams.get('category');
      const status = searchParams.get('status');
      const year = searchParams.get('year');

      // フィルタリング
      let filteredData = [...demoLegalUpdates];

      // カテゴリでフィルタ
      if (category && category !== 'all') {
        filteredData = filteredData.filter((d) => d.category === category);
      }

      // 年度でフィルタ
      if (year && year !== 'all') {
        const yearNum = parseInt(year);
        filteredData = filteredData.filter((d) => {
          const effectiveYear = d.effectiveDate.getFullYear();
          return effectiveYear === yearNum;
        });
      }

      // ステータスでフィルタ
      if (status && status !== 'all') {
        filteredData = filteredData.filter((d) => {
          if (status === 'pending') {
            return d.tenantStatus.status === 'pending';
          }
          return d.tenantStatus.status === status;
        });
      }

      // 全体の統計（フィルタ前のデータで計算）
      const stats = {
        total: demoLegalUpdates.length,
        completed: demoLegalUpdates.filter((d) => d.tenantStatus.status === 'completed').length,
        inProgress: demoLegalUpdates.filter((d) => d.tenantStatus.status === 'in_progress').length,
        pending: demoLegalUpdates.filter((d) => d.tenantStatus.status === 'pending').length,
      };

      return successResponse(filteredData, {
        count: filteredData.length,
        pagination: {
          page: 1,
          limit: 20,
          total: filteredData.length,
          totalPages: 1,
        },
        stats,
        cacheSeconds: 300,
      });
    }
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
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
        const total = await prisma.legal_updates.count({ where });

        // 法令を取得（select最適化）
        const legalUpdates = await prisma.legal_updates.findMany({
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
            tenant_legal_statuses: {
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
            const tenantStatus = update.tenant_legal_statuses[0];
            if (status === 'pending') {
              return !tenantStatus || tenantStatus.status === 'pending';
            }
            return tenantStatus?.status === status;
          });
        }

        // レスポンス形式に整形
        const data = filteredUpdates.map((update) => {
          const tenantStatus = update.tenant_legal_statuses[0];
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
