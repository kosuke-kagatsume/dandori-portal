import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // テナント一覧を取得
    const tenants = await prisma.tenant.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { subdomain: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && {
          settings: {
            status: status,
          },
        }),
      },
      include: {
        settings: {
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
    const total = await prisma.tenant.count({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { subdomain: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && {
          settings: {
            status: status,
          },
        }),
      },
    });

    // 各テナントの請求情報を集計
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const invoiceStats = await prisma.invoice.aggregate({
          where: { tenantId: tenant.id },
          _sum: { total: true },
          _count: true,
        });

        const unpaidStats = await prisma.invoice.aggregate({
          where: {
            tenantId: tenant.id,
            status: { notIn: ['paid', 'cancelled'] },
          },
          _sum: { total: true },
          _count: true,
        });

        const overdueCount = await prisma.invoice.count({
          where: {
            tenantId: tenant.id,
            status: 'overdue',
          },
        });

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          settings: tenant.settings,
          userCount: tenant._count.users,
          invoiceCount: tenant._count.invoices,
          totalAmount: invoiceStats._sum.total || 0,
          unpaidAmount: unpaidStats._sum.total || 0,
          overdueCount,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        };
      })
    );

    // ステータス別集計
    const statusCounts = await prisma.tenantSettings.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
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
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[API] DW Admin - Get tenants error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'テナント一覧の取得に失敗しました',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DW管理 - テナント作成API
 * POST /api/dw-admin/tenants
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      subdomain,
      plan = 'standard',
      status = 'trial',
      billingEmail,
      monthlyPrice,
      trialEndDate,
    } = body;

    // バリデーション
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'テナント名は必須です' },
        { status: 400 }
      );
    }

    // サブドメインの重複チェック
    if (subdomain) {
      const existing = await prisma.tenant.findFirst({
        where: { subdomain },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'このサブドメインは既に使用されています' },
          { status: 400 }
        );
      }
    }

    // トランザクションでテナントと設定を作成
    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name,
          subdomain,
        },
      });

      await tx.tenantSettings.create({
        data: {
          tenantId: newTenant.id,
          status,
          plan,
          billingEmail,
          monthlyPrice,
          trialEndDate: trialEndDate ? new Date(trialEndDate) : undefined,
        },
      });

      return tx.tenant.findUnique({
        where: { id: newTenant.id },
        include: {
          settings: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: tenant,
        message: 'テナントを作成しました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] DW Admin - Create tenant error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'テナントの作成に失敗しました',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
