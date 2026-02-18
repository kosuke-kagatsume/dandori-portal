import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/audit-logs - 監査ログ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const severity = searchParams.get('severity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const searchQuery = searchParams.get('searchQuery');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (action && action !== 'all') {
      where.action = action;
    }

    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (searchQuery) {
      where.OR = [
        { userName: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { targetType: { contains: searchQuery, mode: 'insensitive' } },
        { targetName: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // 総件数取得
    const total = await prisma.audit_logs.count({ where });

    // 監査ログ一覧取得
    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(logs, {
      count: logs.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, '監査ログ一覧の取得');
  }
}

// POST /api/audit-logs - 監査ログ作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const {
      userId,
      userName,
      userRole,
      action,
      category,
      targetType,
      targetId,
      targetName,
      description,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      metadata,
      severity = 'info',
    } = body;

    // バリデーション
    if (!action || !category || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['action', 'category', 'description'],
        },
        { status: 400 }
      );
    }

    // 監査ログ作成
    const log = await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        userId,
        userName,
        userRole,
        action,
        category,
        targetType,
        targetId,
        targetName,
        description,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
        metadata,
        severity,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: log,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '監査ログの作成');
  }
}
