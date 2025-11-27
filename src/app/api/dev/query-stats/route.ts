import { NextResponse } from 'next/server';
import { getQueryStats, resetQueryStats } from '@/lib/prisma';

// GET /api/dev/query-stats - クエリ統計を取得
export async function GET() {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  const stats = getQueryStats();

  return NextResponse.json({
    success: true,
    data: {
      ...stats,
      slowQueryThreshold: '100ms',
      tips: [
        'スロークエリ（100ms以上）がある場合は、インデックス追加やクエリ最適化を検討してください',
        'byModelでモデル別の統計を確認できます',
        'DELETE /api/dev/query-stats で統計をリセットできます',
      ],
    },
  });
}

// DELETE /api/dev/query-stats - クエリ統計をリセット
export async function DELETE() {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  resetQueryStats();

  return NextResponse.json({
    success: true,
    message: 'Query stats have been reset',
  });
}
