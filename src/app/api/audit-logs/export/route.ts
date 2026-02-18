import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/audit-logs/export - 監査ログエクスポート（CSV）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const action = searchParams.get('action');

    const where: Record<string, unknown> = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    // 監査ログ取得（最大10000件）
    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    if (format === 'csv') {
      // CSV形式でエクスポート
      const headers = [
        '日時',
        'ユーザーID',
        'ユーザー名',
        '役割',
        'アクション',
        'カテゴリ',
        '対象種別',
        '対象ID',
        '対象名',
        '説明',
        '重要度',
        'IPアドレス',
      ];

      const csvRows = [
        headers.join(','),
        ...logs.map((log) => {
          const values = [
            log.createdAt.toISOString(),
            log.userId || '',
            log.userName || '',
            log.userRole || '',
            log.action,
            log.category,
            log.targetType || '',
            log.targetId || '',
            log.targetName || '',
            `"${(log.description || '').replace(/"/g, '""')}"`,
            log.severity,
            log.ipAddress || '',
          ];
          return values.join(',');
        }),
      ];

      const csvContent = csvRows.join('\n');
      const now = new Date().toISOString().slice(0, 10);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-logs-${now}.csv"`,
        },
      });
    } else if (format === 'json') {
      // JSON形式でエクスポート
      const now = new Date().toISOString().slice(0, 10);

      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-logs-${now}.json"`,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unsupported format. Use csv or json.',
      },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, '監査ログのエクスポート');
  }
}
