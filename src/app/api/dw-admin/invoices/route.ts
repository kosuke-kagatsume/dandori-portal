import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// DW管理API用の独立したPrismaクライアント
const prisma = new PrismaClient();

/**
 * DW管理 - 請求書一覧・集計API
 * GET /api/dw-admin/invoices
 *
 * クエリパラメータ:
 * - status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
 * - tenantId: テナントIDでフィルタ
 * - year: 年でフィルタ
 * - month: 月でフィルタ
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // フィルタ条件を構築
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.billingMonth = {
        gte: startDate,
        lte: endDate,
      };
    } else if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      where.billingMonth = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 請求書一覧を取得
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
          payments: {
            orderBy: { paymentDate: 'desc' },
            take: 1,
          },
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // 集計データを取得
    const summaryResult = await prisma.invoice.groupBy({
      by: ['status'],
      _sum: {
        total: true,
      },
      _count: true,
    });

    // 今月の売上集計
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'paid',
        paidDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: {
        total: true,
      },
    });

    // 期限切れ請求書を更新（バッチ処理の補完）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.invoice.updateMany({
      where: {
        status: 'sent',
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: 'overdue',
      },
    });

    // 集計データを整形
    const summary = {
      total: 0,
      draft: { count: 0, amount: 0 },
      sent: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 },
      monthlyRevenue: monthlyRevenue._sum.total || 0,
    };

    summaryResult.forEach((item) => {
      const statusKey = item.status as keyof typeof summary;
      if (statusKey in summary && typeof summary[statusKey] === 'object') {
        (summary[statusKey] as { count: number; amount: number }).count = item._count;
        (summary[statusKey] as { count: number; amount: number }).amount = item._sum.total || 0;
        summary.total += item._count;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          tenantId: invoice.tenantId,
          tenantName: invoice.tenant.name,
          tenantSubdomain: invoice.tenant.subdomain,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          billingMonth: invoice.billingMonth,
          dueDate: invoice.dueDate,
          status: invoice.status,
          paidDate: invoice.paidDate,
          lastPayment: invoice.payments[0] || null,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
        })),
        summary,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[API] DW Admin - Get invoices error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '請求書一覧の取得に失敗しました',
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
 * DW管理 - 請求書作成API
 * POST /api/dw-admin/invoices
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tenantId,
      subtotal,
      tax = 0,
      billingMonth,
      dueDate,
      billingEmail,
      memo,
    } = body;

    // バリデーション
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'テナントIDは必須です' },
        { status: 400 }
      );
    }

    if (!subtotal || subtotal <= 0) {
      return NextResponse.json(
        { success: false, error: '有効な金額を入力してください' },
        { status: 400 }
      );
    }

    if (!billingEmail) {
      return NextResponse.json(
        { success: false, error: '請求先メールアドレスは必須です' },
        { status: 400 }
      );
    }

    // テナント存在確認
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        settings: {
          select: {
            billingEmail: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'テナントが見つかりません' },
        { status: 404 }
      );
    }

    // 請求書番号生成（INV-YYYYMM-XXXX形式）
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${yearMonth}`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const invoiceNumber = `INV-${yearMonth}-${String(sequence).padStart(4, '0')}`;

    // 合計金額を計算
    const total = subtotal + tax;

    // 請求書作成
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        subtotal,
        tax,
        total,
        billingMonth: billingMonth ? new Date(billingMonth) : new Date(now.getFullYear(), now.getMonth(), 1),
        dueDate: dueDate ? new Date(dueDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // デフォルト30日後
        billingEmail: billingEmail || tenant.settings?.billingEmail || '',
        memo,
        status: 'draft',
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: invoice,
        message: '請求書を作成しました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] DW Admin - Create invoice error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '請求書の作成に失敗しました',
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
