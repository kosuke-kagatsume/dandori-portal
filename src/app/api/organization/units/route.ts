import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/organization/units - 組織ユニット一覧取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: Record<string, unknown> = { tenantId };
    if (type) {
      where.type = type;
    }

    const units = await prisma.org_units.findMany({
      where,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return successResponse(units, {
      count: units.length,
    });
  } catch (error) {
    return handleApiError(error, '組織ユニット一覧の取得');
  }
}

// POST /api/organization/units - 組織ユニット作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const {
      name,
      type = 'division',
      parentId,
      level = 1,
      headUserId,
    } = body;

    // バリデーション
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['name'],
        },
        { status: 400 }
      );
    }

    // 組織ユニット作成
    const unit = await prisma.org_units.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name,
        type,
        parentId,
        level,
        headUserId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: unit,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '組織ユニットの作成');
  }
}
