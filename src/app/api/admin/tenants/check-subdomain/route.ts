import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * サブドメイン利用可能性チェックAPI
 * GET /api/admin/tenants/check-subdomain?subdomain=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subdomain = searchParams.get('subdomain');

  try {
    if (!subdomain) {
      return NextResponse.json(
        { success: false, error: 'subdomain parameter is required' },
        { status: 400 }
      );
    }

    // サブドメインの形式チェック
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 30) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: 'invalid_format',
        message: 'サブドメインは3〜30文字の英小文字・数字・ハイフンのみ使用可能です',
      });
    }

    // 予約済みサブドメインのチェック
    const reservedSubdomains = [
      'www', 'api', 'app', 'admin', 'dw-admin', 'mail', 'ftp', 'smtp', 'pop',
      'imap', 'test', 'demo', 'staging', 'dev', 'development', 'production',
      'cdn', 'static', 'assets', 'media', 'blog', 'docs', 'help', 'support',
    ];

    if (reservedSubdomains.includes(subdomain)) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: 'reserved',
        message: 'このサブドメインは予約されています',
      });
    }

    // データベースで重複チェック
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    if (existingTenant) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: 'taken',
        message: 'このサブドメインは既に使用されています',
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
      message: 'このサブドメインは使用可能です',
    });
  } catch (error) {
    console.error('[API] Check subdomain error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サブドメインの確認に失敗しました',
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
