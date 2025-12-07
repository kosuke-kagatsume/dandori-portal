import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

// GET /api/employee-profile - 従業員プロフィール取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // プロフィールを取得（関連データ含む）
    let profile = await prisma.employeeProfile.findUnique({
      where: { userId },
      include: {
        certifications: {
          orderBy: { issueDate: 'desc' },
        },
        skills: {
          orderBy: { level: 'desc' },
        },
        experiences: {
          orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
        },
        achievements: {
          orderBy: { date: 'desc' },
        },
      },
    });

    // プロフィールが存在しない場合は作成
    if (!profile) {
      profile = await prisma.employeeProfile.create({
        data: {
          tenantId,
          userId,
        },
        include: {
          certifications: true,
          skills: true,
          experiences: true,
          achievements: true,
        },
      });
    }

    // ユーザー基本情報も取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        avatar: true,
        hireDate: true,
        status: true,
      },
    });

    return successResponse({
      ...profile,
      user,
    }, {
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, '従業員プロフィールの取得');
  }
}

// PUT /api/employee-profile - 従業員プロフィール更新（管理者用）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tenantId, ...data } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // 既存のプロフィールを確認
    const existing = await prisma.employeeProfile.findUnique({
      where: { userId },
    });

    let profile;
    if (existing) {
      // 更新
      profile = await prisma.employeeProfile.update({
        where: { userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          certifications: true,
          skills: true,
          experiences: true,
          achievements: true,
        },
      });
    } else {
      // 作成
      profile = await prisma.employeeProfile.create({
        data: {
          tenantId: tenantId || 'tenant-demo-001',
          userId,
          ...data,
        },
        include: {
          certifications: true,
          skills: true,
          experiences: true,
          achievements: true,
        },
      });
    }

    return successResponse(profile);
  } catch (error) {
    return handleApiError(error, '従業員プロフィールの更新');
  }
}
