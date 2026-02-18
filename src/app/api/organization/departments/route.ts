import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
} from '@/lib/api/api-helpers';

// GET /api/organization/departments - 部門一覧取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const departments = await prisma.departments.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return successResponse(departments, {
      count: departments.length,
    });
  } catch (error) {
    return handleApiError(error, '部門一覧の取得');
  }
}

// POST /api/organization/departments - 部門作成
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();

    const {
      name,
      parentId,
      sortOrder = 0,
      isActive = true,
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

    // 部門作成
    const department = await prisma.departments.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        name,
        parentId,
        sortOrder,
        isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: department,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '部門の作成');
  }
}
