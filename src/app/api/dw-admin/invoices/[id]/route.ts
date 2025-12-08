import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DW管理 - 請求書詳細取得API
 * GET /api/dw-admin/invoices/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            settings: {
              select: {
                billingEmail: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        items: true,
        reminders: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: '請求書が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        paidAmount: invoice.payments
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0),
      },
    });
  } catch (error) {
    console.error('[API] DW Admin - Get invoice detail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '請求書の取得に失敗しました',
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
 * DW管理 - 請求書更新API
 * PUT /api/dw-admin/invoices/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      subtotal,
      tax,
      billingMonth,
      dueDate,
      billingEmail,
      memo,
      status,
    } = body;

    // 請求書存在確認
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: '請求書が見つかりません' },
        { status: 404 }
      );
    }

    // 支払い済み・キャンセル済みは金額変更不可
    if (
      (existingInvoice.status === 'paid' || existingInvoice.status === 'cancelled') &&
      (subtotal !== undefined || tax !== undefined)
    ) {
      return NextResponse.json(
        { success: false, error: '支払い済み・キャンセル済みの請求書の金額は変更できません' },
        { status: 400 }
      );
    }

    // 更新データを構築
    const updateData: Record<string, unknown> = {};

    if (subtotal !== undefined) {
      updateData.subtotal = subtotal;
      updateData.total = subtotal + (tax !== undefined ? tax : existingInvoice.tax);
    }
    if (tax !== undefined) {
      updateData.tax = tax;
      updateData.total = (subtotal !== undefined ? subtotal : existingInvoice.subtotal) + tax;
    }
    if (billingMonth) updateData.billingMonth = new Date(billingMonth);
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (billingEmail !== undefined) updateData.billingEmail = billingEmail;
    if (memo !== undefined) updateData.memo = memo;

    // ステータス変更の処理
    if (status && status !== existingInvoice.status) {
      updateData.status = status;

      // 支払い済みに変更する場合は paidDate を設定
      if (status === 'paid' && !existingInvoice.paidDate) {
        updateData.paidDate = new Date();
      }

      // 送信済みに変更する場合は sentDate を設定
      if (status === 'sent' && !existingInvoice.sentDate) {
        updateData.sentDate = new Date();
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      data: invoice,
      message: '請求書を更新しました',
    });
  } catch (error) {
    console.error('[API] DW Admin - Update invoice error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '請求書の更新に失敗しました',
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
 * DW管理 - 請求書削除API
 * DELETE /api/dw-admin/invoices/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 請求書存在確認
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: '請求書が見つかりません' },
        { status: 404 }
      );
    }

    // 支払い済みの請求書は削除不可
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: '支払い済みの請求書は削除できません' },
        { status: 400 }
      );
    }

    // 支払い記録がある場合は削除不可
    if (existingInvoice.payments.length > 0) {
      return NextResponse.json(
        { success: false, error: '支払い記録がある請求書は削除できません' },
        { status: 400 }
      );
    }

    // 関連データを含めて削除
    await prisma.$transaction([
      prisma.invoiceReminder.deleteMany({ where: { invoiceId: id } }),
      prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: '請求書を削除しました',
    });
  } catch (error) {
    console.error('[API] DW Admin - Delete invoice error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '請求書の削除に失敗しました',
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
