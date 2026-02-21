import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { seedTenantPermissions } from '@/lib/permissions/seed-tenant-permissions';
import { withDWAdminAuth } from '@/lib/auth/api-auth';
import { createSuccessResponse, handleError, badRequestError, conflictError } from '@/lib/api/response';

// DW管理API用の独立したPrismaクライアント
const prisma = new PrismaClient();

/**
 * DW管理 - テナント一覧API
 * GET /api/dw-admin/tenants
 *
 * クエリパラメータ:
 * - status: ステータスでフィルタ（trial, active, suspended, cancelled）
 * - search: テナント名で検索
 */
export async function GET(request: NextRequest) {
  // DW管理者認証チェック
  const { errorResponse } = await withDWAdminAuth();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // テナント一覧を取得
    const tenants = await prisma.tenants.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { subdomain: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && {
          tenant_settings: {
            status: status,
          },
        }),
      },
      include: {
        tenant_settings: {
          select: {
            status: true,
            trialEndDate: true,
            contractStartDate: true,
            contractEndDate: true,
            billingEmail: true,
            customPricing: true,
          },
        },
        _count: {
          select: {
            users: true,
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 総件数
    const total = await prisma.tenants.count({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { subdomain: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && {
          tenant_settings: {
            status: status,
          },
        }),
      },
    });

    // N+1回避: テナントIDリストで一括集計
    const tenantIds = tenants.map((t) => t.id);

    // 全請求の集計（テナントごと）
    const invoiceStatsByTenant = await prisma.invoices.groupBy({
      by: ['tenantId'],
      _sum: { total: true },
      _count: true,
      where: { tenantId: { in: tenantIds } },
    });

    // 未払い請求の集計（テナントごと）
    const unpaidStatsByTenant = await prisma.invoices.groupBy({
      by: ['tenantId'],
      _sum: { total: true },
      _count: true,
      where: {
        tenantId: { in: tenantIds },
        status: { notIn: ['paid', 'cancelled'] },
      },
    });

    // 延滞請求の件数（テナントごと）
    const overdueCountByTenant = await prisma.invoices.groupBy({
      by: ['tenantId'],
      _count: true,
      where: {
        tenantId: { in: tenantIds },
        status: 'overdue',
      },
    });

    // マップに変換して高速ルックアップ
    const invoiceStatsMap = new Map(
      invoiceStatsByTenant.map((s) => [s.tenantId, { total: s._sum.total || 0, count: s._count }])
    );
    const unpaidStatsMap = new Map(
      unpaidStatsByTenant.map((s) => [s.tenantId, { total: s._sum.total || 0, count: s._count }])
    );
    const overdueCountMap = new Map(
      overdueCountByTenant.map((s) => [s.tenantId, s._count])
    );

    // テナントデータとマージ
    const tenantsWithStats = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      settings: tenant.tenant_settings,
      userCount: tenant._count.users,
      invoiceCount: tenant._count.invoices,
      totalAmount: invoiceStatsMap.get(tenant.id)?.total || 0,
      unpaidAmount: unpaidStatsMap.get(tenant.id)?.total || 0,
      overdueCount: overdueCountMap.get(tenant.id) || 0,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }));

    // ステータス別集計
    const statusCounts = await prisma.tenant_settings.groupBy({
      by: ['status'],
      _count: true,
    });

    return createSuccessResponse({
      tenants: tenantsWithStats,
      summary: {
        total,
        byStatus: statusCounts.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    }, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error, 'テナント一覧の取得');
  }
}

/**
 * DW管理 - テナント作成API
 * POST /api/dw-admin/tenants
 */
export async function POST(request: NextRequest) {
  // DW管理者認証チェック
  const { errorResponse } = await withDWAdminAuth();
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();

    const {
      name,
      subdomain,
      plan: _plan = 'standard',
      status = 'trial',
      billingEmail,
      monthlyPrice: _monthlyPrice,
      trialEndDate,
    } = body;
    // plan と monthlyPrice は将来の機能拡張用（現在は tenant_settings で管理）
    void _plan;
    void _monthlyPrice;

    // バリデーション
    if (!name) {
      return badRequestError('テナント名は必須です');
    }

    // サブドメインの重複チェック
    if (subdomain) {
      const existing = await prisma.tenants.findFirst({
        where: { subdomain },
      });
      if (existing) {
        return conflictError('このサブドメインは既に使用されています');
      }
    }

    // トランザクションでテナントと設定を作成
    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenants.create({
        data: {
          id: crypto.randomUUID(),
          name,
          subdomain,
          updatedAt: new Date(),
        },
      });

      await tx.tenant_settings.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: newTenant.id,
          status,
          billingEmail,
          trialEndDate: trialEndDate ? new Date(trialEndDate) : undefined,
          updatedAt: new Date(),
        },
      });

      // 新規テナントにデフォルト権限データを投入
      await seedTenantPermissions(tx, newTenant.id);

      return tx.tenants.findUnique({
        where: { id: newTenant.id },
        include: {
          tenant_settings: true,
        },
      });
    });

    return createSuccessResponse(tenant, {
      message: 'テナントを作成しました',
      status: 201,
    });
  } catch (error) {
    return handleError(error, 'テナントの作成');
  }
}
