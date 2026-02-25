/**
 * 統合API ヘルスチェック
 *
 * GET /api/integration/health
 *
 * DRM Suite からの疎通確認用
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { HealthCheckResponse } from '@/lib/integrations/drm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const timestamp = new Date().toISOString();

  // DBヘルスチェック
  let databaseStatus: 'up' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = 'up';
  } catch {
    databaseStatus = 'down';
  }

  const response: HealthCheckResponse = {
    status: databaseStatus === 'up' ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    timestamp,
    services: {
      database: databaseStatus,
    },
  };

  const httpStatus = response.status === 'healthy' ? 200 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
