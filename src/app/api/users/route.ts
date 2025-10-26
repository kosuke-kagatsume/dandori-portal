import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users - 全ユーザー取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        orgUnit: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
    const existingUser = await prisma.user.findUnique({
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
    const user = await prisma.user.create({
      data: {
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
      },
      include: {
        orgUnit: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        tenant: {
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
