import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * テナント一覧取得API
 * GET /api/admin/tenants
 */
export async function GET() {
  try {
    const tenants = await prisma.tenants.findMany({
      include: {
        tenant_settings: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        logo: tenant.logo,
        timezone: tenant.timezone,
        closingDay: tenant.closingDay,
        weekStartDay: tenant.weekStartDay,
        settings: tenant.tenant_settings,
        userCount: tenant._count.users,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      })),
    });
  } catch (error) {
    console.error('[API] Get tenants error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tenants',
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
 * テナント作成API
 * POST /api/admin/tenants
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      subdomain,
      logo,
      timezone = 'Asia/Tokyo',
      closingDay = '末',
      weekStartDay = 1,
      // テナント設定
      billingEmail,
      trialEndDate,
      contractStartDate,
      contractEndDate,
      status = 'trial',
    } = body;

    // バリデーション
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'テナント名は必須です' },
        { status: 400 }
      );
    }

    if (!subdomain) {
      return NextResponse.json(
        { success: false, error: 'サブドメインは必須です' },
        { status: 400 }
      );
    }

    // サブドメインの形式チェック（英数字とハイフンのみ）
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        {
          success: false,
          error: 'サブドメインは英小文字、数字、ハイフンのみ使用可能です',
        },
        { status: 400 }
      );
    }

    // サブドメインの重複チェック
    const existingTenant = await prisma.tenants.findUnique({
      where: { subdomain },
    });

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: 'このサブドメインは既に使用されています' },
        { status: 409 }
      );
    }

    // テナント作成（トランザクション）
    const tenant = await prisma.$transaction(async (tx) => {
      // テナントを作成
      const newTenant = await tx.tenants.create({
        data: {
          id: crypto.randomUUID(),
          name,
          subdomain,
          logo,
          timezone,
          closingDay,
          weekStartDay,
          updatedAt: new Date(),
        },
      });

      // テナント設定を作成
      await tx.tenant_settings.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: newTenant.id,
          billingEmail,
          trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
          contractStartDate: contractStartDate
            ? new Date(contractStartDate)
            : null,
          contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
          status,
          updatedAt: new Date(),
        },
      });

      // 作成したテナントを取得（設定込み）
      return tx.tenants.findUnique({
        where: { id: newTenant.id },
        include: {
          tenant_settings: true,
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
    console.error('[API] Create tenant error:', error);
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
