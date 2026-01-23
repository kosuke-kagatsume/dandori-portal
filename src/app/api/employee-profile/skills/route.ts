import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

// GET /api/employee-profile/skills - スキル一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (category && category !== 'all') where.category = category;

    const skills = await prisma.employee_skills.findMany({
      where,
      orderBy: [{ category: 'asc' }, { level: 'desc' }],
    });

    return successResponse(skills, {
      count: skills.length,
      cacheSeconds: 300,
    });
  } catch (error) {
    return handleApiError(error, 'スキル一覧の取得');
  }
}

// POST /api/employee-profile/skills - スキル追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      userId,
      name,
      category,
      level,
      selfAssessment,
      notes,
    } = body;

    if (!name || !category || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています',
          required: ['name', 'category', 'userId'],
        },
        { status: 400 }
      );
    }

    // プロフィールIDを取得（なければ作成）
    let profile = await prisma.employee_profiles.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.employee_profiles.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenantId || 'tenant-1',
          userId,
          updatedAt: new Date(),
        },
      });
    }

    const skill = await prisma.employee_skills.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenantId || profile.tenantId,
        profileId: profile.id,
        userId,
        name,
        category,
        level: level || 50,
        selfAssessment,
        notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, data: skill },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, 'スキルの追加');
  }
}

// PUT /api/employee-profile/skills - スキル更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const skill = await prisma.employee_skills.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return successResponse(skill);
  } catch (error) {
    return handleApiError(error, 'スキルの更新');
  }
}

// DELETE /api/employee-profile/skills - スキル削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    await prisma.employee_skills.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'スキルの削除');
  }
}
