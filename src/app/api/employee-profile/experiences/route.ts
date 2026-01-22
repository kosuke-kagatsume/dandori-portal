import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

// GET /api/employee-profile/experiences - 経歴一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;

    const experiences = await prisma.work_experiences.findMany({
      where,
      orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
    });

    return successResponse(experiences, {
      count: experiences.length,
      cacheSeconds: 300,
    });
  } catch (error) {
    return handleApiError(error, '経歴一覧の取得');
  }
}

// POST /api/employee-profile/experiences - 経歴追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      userId,
      position,
      company,
      startDate,
      endDate,
      isCurrent,
      description,
      achievements,
      skills,
    } = body;

    if (!position || !company || !startDate || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています',
          required: ['position', 'company', 'startDate', 'userId'],
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
          tenantId: tenantId || 'tenant-1',
          userId,
        },
      });
    }

    const experience = await prisma.work_experiences.create({
      data: {
        tenantId: tenantId || profile.tenantId,
        profileId: profile.id,
        userId,
        position,
        company,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isCurrent: isCurrent || !endDate,
        description,
        achievements: achievements || [],
        skills: skills || [],
      },
    });

    return NextResponse.json(
      { success: true, data: experience },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '経歴の追加');
  }
}

// PUT /api/employee-profile/experiences - 経歴更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, startDate, endDate, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const experience = await prisma.work_experiences.update({
      where: { id },
      data: {
        ...data,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        updatedAt: new Date(),
      },
    });

    return successResponse(experience);
  } catch (error) {
    return handleApiError(error, '経歴の更新');
  }
}

// DELETE /api/employee-profile/experiences - 経歴削除
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

    await prisma.work_experiences.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '経歴の削除');
  }
}
