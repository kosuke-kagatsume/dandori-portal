import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * テナント解決API
 * サブドメインからテナント情報を取得
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subdomain = searchParams.get('subdomain');

  try {

    if (!subdomain) {
      return NextResponse.json(
        { error: 'subdomain parameter is required' },
        { status: 400 }
      );
    }

    // データベースからサブドメインに対応するテナントを検索
    const tenant = await prisma.tenants.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found', subdomain },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      name: tenant.name,
    });
  } catch (error) {
    console.error('[API] Tenant resolve error:', error);
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      subdomain,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
