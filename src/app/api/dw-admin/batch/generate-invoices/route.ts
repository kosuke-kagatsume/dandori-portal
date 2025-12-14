import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// バッチ処理用の独立したPrismaクライアント
const prismaClient = new PrismaClient();

/**
 * DW管理 - 請求書自動生成バッチAPI
 * POST /api/dw-admin/batch/generate-invoices
 *
 * 月末に実行し、全アクティブテナントの請求書を自動生成
 *
 * リクエストボディ:
 * - billingMonth: 請求対象月（YYYY-MM形式）
 * - dryRun: trueの場合、実際には作成せずプレビューのみ
 */
export async function POST(request: NextRequest) {
  try {
    // API Keyによる認証（バッチ実行用）
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.BATCH_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: '認証エラー' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { billingMonth, dryRun = false } = body;

    // 請求月が指定されていない場合は前月を使用
    const targetMonth = billingMonth || getPreviousMonth();

    // アクティブなテナントを取得
    const tenants = await prismaClient.tenant.findMany({
      where: {
        tenant_settings: {
          status: 'active',
        },
      },
      include: {
        settings: true,
        _count: {
          select: { users: true },
        },
      },
    });

    const results: Array<{
      tenantId: string;
      tenantName: string;
      status: 'created' | 'skipped' | 'error';
      invoiceNumber?: string;
      amount?: number;
      reason?: string;
    }> = [];

    for (const tenant of tenants) {
      try {
        // 既存の請求書をチェック
        const existingInvoice = await prismaClient.invoice.findFirst({
          where: {
            tenantId: tenant.id,
            billingMonth: new Date(`${targetMonth}-01`),
          },
        });

        if (existingInvoice) {
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            status: 'skipped',
            reason: '既に請求書が存在します',
          });
          continue;
        }

        // 料金計算（ユーザー数ベース）
        const userCount = tenant._count.users;
        const basePrice = tenant.tenant_settings?.customPricing ? 0 : 10000; // カスタム料金の場合は手動設定
        const pricePerUser = 1000;
        const subtotal = basePrice + (userCount * pricePerUser);
        const taxRate = 0.1;
        const tax = Math.floor(subtotal * taxRate);
        const total = subtotal + tax;

        if (dryRun) {
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            status: 'created',
            amount: total,
            reason: 'ドライラン（未作成）',
          });
          continue;
        }

        // 請求書番号生成
        const invoiceNumber = generateInvoiceNumber(targetMonth, tenant.id);

        // 支払い期限（翌月末）
        const dueDate = getEndOfNextMonth(targetMonth);

        // 請求書作成
        const invoice = await prismaClient.invoice.create({
          data: {
            tenantId: tenant.id,
            invoiceNumber,
            billingMonth: new Date(`${targetMonth}-01`),
            subtotal,
            tax,
            total,
            status: 'draft',
            dueDate,
            billingEmail: tenant.tenant_settings?.billingEmail,
            items: {
              basePrice,
              userCount,
              pricePerUser,
              taxRate,
            },
          },
        });

        // 通知作成
        await prismaClient.dWNotification.create({
          data: {
            type: 'invoice_created',
            title: `請求書が作成されました`,
            description: `${tenant.name}の${formatMonth(targetMonth)}分請求書（${invoiceNumber}）が作成されました`,
            priority: 'normal',
            tenantId: tenant.id,
            invoiceId: invoice.id,
            amount: total,
          },
        });

        // アクティビティ記録
        await prismaClient.dWActivity.create({
          data: {
            tenantId: tenant.id,
            activityType: 'invoice_generated',
            title: '請求書自動生成',
            description: `${formatMonth(targetMonth)}分の請求書が自動生成されました`,
            resourceType: 'invoice',
            resourceId: invoice.id,
            priority: 'normal',
          },
        });

        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          status: 'created',
          invoiceNumber,
          amount: total,
        });
      } catch (err) {
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          status: 'error',
          reason: err instanceof Error ? err.message : '不明なエラー',
        });
      }
    }

    const summary = {
      totalTenants: tenants.length,
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      totalAmount: results
        .filter((r) => r.status === 'created' && r.amount)
        .reduce((sum, r) => sum + (r.amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        billingMonth: targetMonth,
        dryRun,
        summary,
        results,
      },
    });
  } catch (error) {
    console.error('[Batch] Generate invoices error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '請求書生成バッチの実行に失敗しました',
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

// ヘルパー関数
function getPreviousMonth(): string {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function generateInvoiceNumber(month: string, tenantId: string): string {
  const monthPart = month.replace('-', '');
  const tenantPart = tenantId.slice(-4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${monthPart}-${tenantPart}-${random}`;
}

function getEndOfNextMonth(month: string): Date {
  const [year, monthNum] = month.split('-').map(Number);
  const nextMonth = new Date(year, monthNum + 1, 0); // 翌月末日
  return nextMonth;
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  return `${year}年${parseInt(monthNum)}月`;
}
