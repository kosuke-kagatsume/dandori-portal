import { NextRequest, NextResponse } from 'next/server';
import { searchBranches, findBank } from '@/lib/banks/zengin-data';
import { handleApiError } from '@/lib/api/api-helpers';

export const runtime = 'nodejs';

/**
 * GET /api/banks/[bankCode]/branches - 支店マスタ検索
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bankCode: string }> },
) {
  try {
    const { bankCode } = await params;
    if (!/^\d{4}$/.test(bankCode)) {
      return NextResponse.json(
        { success: false, error: '銀行コードは4桁の数字です' },
        { status: 400 },
      );
    }
    if (!findBank(bankCode)) {
      return NextResponse.json(
        { success: false, error: '銀行が見つかりません' },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const limitRaw = parseInt(searchParams.get('limit') ?? '30', 10);
    const offsetRaw = parseInt(searchParams.get('offset') ?? '0', 10);

    if (!Number.isFinite(limitRaw) || limitRaw < 1 || limitRaw > 50) {
      return NextResponse.json(
        { success: false, error: 'limit は 1〜50 の範囲で指定してください' },
        { status: 400 },
      );
    }

    const result = searchBranches({
      bankCode,
      q,
      limit: limitRaw,
      offset: Math.max(0, offsetRaw),
    });
    if (!result) {
      return NextResponse.json(
        { success: false, error: '支店マスタが見つかりません' },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      success: true,
      data: result.data,
      meta: { total: result.total, limit: limitRaw, offset: Math.max(0, offsetRaw) },
    });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800',
    );
    return response;
  } catch (error) {
    return handleApiError(error, '支店マスタ検索');
  }
}
