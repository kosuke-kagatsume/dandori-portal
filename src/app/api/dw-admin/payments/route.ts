import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// DW管理API用の独立したPrismaクライアント
const prisma = new PrismaClient();

/**
 * DW管理 - 支払い記録一覧API
 * GET /api/dw-admin/payments
 *
 * クエリパラメータ:
 * - tenantId: テナントIDでフィルタ
 * - invoiceId: 請求書IDでフィルタ
 * - startDate: 開始日
 * - endDate: 終了日
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const invoiceId = searchParams.get('invoiceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // フィルタ条件を構築
    const where: Record<string, unknown> = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        (where.paymentDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.paymentDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // 支払い記録一覧を取得（tenantリレーションがないためinvoices経由でテナント名を取得）
    const [payments, total] = await Promise.all([
      prisma.payments.findMany({
        where,
        include: {
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              subtotal: true,
              tax: true,
              total: true,
              status: true,
              tenants: {
                select: {
                  id: true,
                  name: true,
                  subdomain: true,
                },
              },
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.payments.count({ where }),
    ]);

    // 集計
    const totalAmount = await prisma.payments.aggregate({
      where: {
        ...where,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payments: payments.map((payment) => ({
          id: payment.id,
          tenantId: payment.tenantId,
          tenantName: payment.invoices?.tenants?.name || '',
          invoiceId: payment.invoiceId,
          invoiceNumber: payment.invoices?.invoiceNumber || '',
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          status: payment.status,
          notes: payment.notes,
          createdAt: payment.createdAt,
        })),
        summary: {
          totalAmount: totalAmount._sum.amount || 0,
          count: total,
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
    console.error('[API] DW Admin - Get payments error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '支払い記録の取得に失敗しました',
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
 * DW管理 - 支払い記録登録API
 * POST /api/dw-admin/payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      invoiceId,
      amount,
      paymentDate,
      paymentMethod = 'bank_transfer',
      notes,
    } = body;

    // バリデーション
    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: '請求書IDは必須です' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: '有効な支払い金額を入力してください' },
        { status: 400 }
      );
    }

    // 請求書存在確認
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: { status: 'completed' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: '請求書が見つかりません' },
        { status: 404 }
      );
    }

    // すでにキャンセル済みの請求書には支払いできない
    if (invoice.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'キャンセル済みの請求書には支払いを登録できません' },
        { status: 400 }
      );
    }

    // 支払い済み金額を計算
    const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = invoice.total - paidAmount;

    // 過払いチェック
    if (amount > remainingAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `支払い金額が請求残額（${remainingAmount.toLocaleString()}円）を超えています`,
        },
        { status: 400 }
      );
    }

    // トランザクションで支払い登録と請求書ステータス更新
    const result = await prisma.$transaction(async (tx) => {
      // 支払い記録を作成
      const payment = await tx.payments.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: invoice.tenantId,
          invoiceId,
          amount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          status: 'completed',
          notes,
          updatedAt: new Date(),
        },
        include: {
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      });

      // 全額支払い済みの場合は請求書ステータスを更新
      const newPaidAmount = paidAmount + amount;
      const totalAmount = invoice.total;

      if (newPaidAmount >= totalAmount) {
        await tx.invoices.update({
          where: { id: invoiceId },
          data: {
            status: 'paid',
            paidDate: new Date(),
          },
        });
      }

      // アクティビティログを記録
      await tx.activity_feeds.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: invoice.tenantId,
          activityType: 'payment_received',
          title: '支払い受領',
          description: `${invoice.invoiceNumber} への支払い ${amount.toLocaleString()}円`,
          resourceType: 'payment',
          resourceId: payment.id,
        },
      });

      return payment;
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: '支払いを登録しました',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] DW Admin - Create payment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '支払いの登録に失敗しました',
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
