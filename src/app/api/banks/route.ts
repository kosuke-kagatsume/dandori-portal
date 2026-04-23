import { NextRequest, NextResponse } from 'next/server';
import { searchBanks } from '@/lib/banks/zengin-data';
import { handleApiError } from '@/lib/api/api-helpers';

export const runtime = 'nodejs';

/**
 * GET /api/banks - 全銀協 銀行マスタ検索
 *
 * Query:
 *   q: 検索クエリ（空欄なら人気銀行30件）
 *   limit: 最大50
 *   offset: ページング
 */
export async function GET(request: NextRequest) {
  try {
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

    const result = searchBanks({ q, limit: limitRaw, offset: Math.max(0, offsetRaw) });
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
    return handleApiError(error, '銀行マスタ検索');
  }
}
