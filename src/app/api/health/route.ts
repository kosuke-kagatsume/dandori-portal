import { NextResponse } from 'next/server';
import {
  checkDatabaseConnection,
  getQueryStats,
  getConnectionPoolConfig,
} from '@/lib/prisma';

/**
 * GET /api/health - ヘルスチェックAPI
 * データベース接続状態、クエリ統計、接続プール設定を返す
 */
export async function GET() {
  const startTime = performance.now();

  // DB接続チェック
  const dbStatus = await checkDatabaseConnection();

  // クエリ統計（開発環境のみ詳細）
  const queryStats =
    process.env.NODE_ENV === 'development' ? getQueryStats() : null;

  // 接続プール設定
  const poolConfig = getConnectionPoolConfig();

  const totalTime = performance.now() - startTime;

  const health = {
    status: dbStatus.connected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${totalTime.toFixed(2)}ms`,
    database: {
      connected: dbStatus.connected,
      latency: dbStatus.latency
        ? `${dbStatus.latency.toFixed(2)}ms`
        : undefined,
      error: dbStatus.error,
      pool: {
        connectionLimit: poolConfig.connectionLimit,
        connectTimeout: `${poolConfig.connectTimeout}ms`,
        poolTimeout: `${poolConfig.poolTimeout}ms`,
      },
    },
    ...(queryStats && {
      queryStats: {
        totalQueries: queryStats.total,
        slowQueries: queryStats.slowQueries.length,
        averageDuration: `${queryStats.averageDuration.toFixed(2)}ms`,
      },
    }),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0',
  };

  return NextResponse.json(health, {
    status: dbStatus.connected ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
