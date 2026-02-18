import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/users - ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const status = searchParams.get('status');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };

    if (status && status !== 'all') {
      where.status = status;
    }

    // 総件数取得
    const total = await prisma.users.count({ where });

    // ユーザー一覧取得（select最適化）
    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        position: true,
        department: true,
        avatar: true,
        roles: true,
        hireDate: true,
        createdAt: true,
        updatedAt: true,
        org_units: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        tenants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return successResponse(users, {
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 300, // 5分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'ユーザー一覧の取得');
  }
}

// POST /api/users - ユーザー作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      email,
      name,
      phone,
      hireDate,
      unitId,
      tenantId,
      roles = ['employee'],
      status = 'active',
      position,
      department,
      avatar,
    } = body;

    // バリデーション
    if (!email || !name || !hireDate || !unitId || !tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['email', 'name', 'hireDate', 'unitId', 'tenantId'],
        },
        { status: 400 }
      );
    }

    // メールアドレス重複チェック
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists',
        },
        { status: 409 }
      );
    }

    // ユーザー作成
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        phone,
        hireDate: new Date(hireDate),
        unitId,
        tenantId,
        roles,
        status,
        position,
        department,
        avatar,
        updatedAt: new Date(),
      },
      include: {
        org_units: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        tenants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
