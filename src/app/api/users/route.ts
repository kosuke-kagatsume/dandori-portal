import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getPaginationParams,
} from '@/lib/api/api-helpers';
import { resolvePositionAndDepartment, resolveIdsFromNames, ValidationError } from '@/lib/api/user-helpers';
import { withAuth } from '@/lib/auth/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/users - ユーザー一覧取得（admin/hr限定 + 自テナント絞り込み）
export async function GET(request: NextRequest) {
  const { auth, errorResponse } = await withAuth(request, ['admin', 'hr']);
  if (errorResponse) return errorResponse;
  if (!auth.user?.tenantId) {
    return NextResponse.json({ success: false, error: 'テナント情報がありません' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = auth.user.tenantId;
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
        nameKana: true,
        employeeNumber: true,
        phone: true,
        status: true,
        position: true,
        department: true,
        positionId: true,
        departmentId: true,
        avatar: true,
        roles: true,
        hireDate: true,
        employmentType: true,
        birthDate: true,
        gender: true,
        postalCode: true,
        address: true,
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

// POST /api/users - ユーザー作成（admin/hr限定 + tenantId は JWT 値を強制使用）
export async function POST(request: NextRequest) {
  const { auth, errorResponse } = await withAuth(request, ['admin', 'hr']);
  if (errorResponse) return errorResponse;
  if (!auth.user?.tenantId) {
    return NextResponse.json({ success: false, error: 'テナント情報がありません' }, { status: 400 });
  }

  try {
    const body = await request.json();
    // body.tenantId は信用しない。JWT のテナントを強制使用（テナント越境作成防止）
    const tenantId = auth.user.tenantId;

    const {
      email,
      name,
      phone,
      hireDate,
      unitId,
      roles = ['employee'],
      status = 'active',
      position,
      department,
      positionId,
      departmentId,
      avatar,
    } = body;

    // バリデーション
    if (!email || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['email', 'name'],
        },
        { status: 400 }
      );
    }

    // positionId / departmentId バリデーション + 名前解決
    let resolvedNames: { position?: string; department?: string } = {};
    let resolvedPositionId = positionId;
    let resolvedDepartmentId = departmentId;
    try {
      resolvedNames = await resolvePositionAndDepartment(tenantId, positionId, departmentId);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }

    // IDが未指定だが文字列名がある場合、名前からIDを逆引き（CSVインポート等）
    if (!positionId && position || !departmentId && department) {
      const resolvedIds = await resolveIdsFromNames(tenantId, department, position);
      if (resolvedIds.departmentId) resolvedDepartmentId = resolvedIds.departmentId;
      if (resolvedIds.positionId) resolvedPositionId = resolvedIds.positionId;
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

    // hierarchyモード時: departmentIdから対応するorg_unitを探してunitIdを自動設定
    let resolvedUnitId = unitId;
    if (!unitId && resolvedDepartmentId) {
      const settings = await prisma.tenant_settings.findUnique({
        where: { tenantId },
        select: { organizationMode: true },
      });
      if (settings?.organizationMode === 'hierarchy') {
        // departmentの名前でorg_unitを検索
        const dept = await prisma.departments.findUnique({
          where: { id: resolvedDepartmentId },
          select: { name: true },
        });
        if (dept) {
          const matchingUnit = await prisma.org_units.findFirst({
            where: { tenantId, name: dept.name, isActive: true },
            select: { id: true },
          });
          if (matchingUnit) {
            resolvedUnitId = matchingUnit.id;
          }
        }
      }
    }

    // ユーザー作成
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        phone,
        hireDate: hireDate ? new Date(`${hireDate.split('T')[0]}T12:00:00Z`) : undefined,
        unitId: resolvedUnitId || undefined,
        tenantId,
        roles,
        status,
        position: resolvedNames.position || position,
        department: resolvedNames.department || department,
        positionId: resolvedPositionId || undefined,
        departmentId: resolvedDepartmentId || undefined,
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
