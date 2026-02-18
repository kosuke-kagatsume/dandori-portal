import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/employee-profile/change-requests - 変更申請一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const requestType = searchParams.get('requestType');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (status && status !== 'all') where.status = status;
    if (requestType && requestType !== 'all') where.requestType = requestType;

    const total = await prisma.employee_change_requests.count({ where });

    const changeRequests = await prisma.employee_change_requests.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // ユーザー情報を取得
    const userIds = Array.from(new Set(changeRequests.map(r => r.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedRequests = changeRequests.map(req => ({
      ...req,
      user: userMap.get(req.userId),
    }));

    return successResponse(enrichedRequests, {
      count: enrichedRequests.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60,
    });
  } catch (error) {
    return handleApiError(error, '変更申請一覧の取得');
  }
}

// POST /api/employee-profile/change-requests - 変更申請作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      userId,
      requestType,
      fieldName,
      currentValue,
      newValue,
      reason,
      attachments,
    } = body;

    // バリデーション
    if (!userId || !requestType || !newValue) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています',
          required: ['userId', 'requestType', 'newValue'],
        },
        { status: 400 }
      );
    }

    const changeRequest = await prisma.employee_change_requests.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenantId || 'tenant-1',
        userId,
        requestType,
        fieldName,
        currentValue,
        newValue,
        reason,
        attachments,
        status: 'pending',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, data: changeRequest },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '変更申請の作成');
  }
}

// PATCH /api/employee-profile/change-requests - 変更申請の承認/却下
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      reviewedBy,
      reviewedByName,
      reviewComment,
    } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id and status are required' },
        { status: 400 }
      );
    }

    // 変更申請を取得
    const changeRequest = await prisma.employee_change_requests.findUnique({
      where: { id },
    });

    if (!changeRequest) {
      return NextResponse.json(
        { success: false, error: '変更申請が見つかりません' },
        { status: 404 }
      );
    }

    // 承認の場合は実際のデータを更新
    if (status === 'approved') {
      // プロフィールを取得
      const profile = await prisma.employee_profiles.findUnique({
        where: { userId: changeRequest.userId },
      });

      if (profile && changeRequest.requestType === 'basic_info' && changeRequest.fieldName) {
        // 基本情報の更新
        const updateData: Record<string, unknown> = {};
        updateData[changeRequest.fieldName] = changeRequest.newValue;

        await prisma.employee_profiles.update({
          where: { id: profile.id },
          data: updateData,
        });
      } else if (changeRequest.requestType === 'certification') {
        // 資格の追加（newValueにJSON形式で資格情報が入っている想定）
        try {
          const certData = JSON.parse(changeRequest.newValue);
          if (profile) {
            await prisma.certifications.create({
              data: {
                id: crypto.randomUUID(),
                tenantId: changeRequest.tenantId,
                profileId: profile.id,
                userId: changeRequest.userId,
                name: certData.name,
                organization: certData.organization,
                issueDate: new Date(certData.issueDate),
                expiryDate: certData.expiryDate ? new Date(certData.expiryDate) : null,
                status: 'active',
                updatedAt: new Date(),
              },
            });
          }
        } catch {
          // JSON解析エラーは無視
        }
      }
    }

    // ステータス更新
    const updatedRequest = await prisma.employee_change_requests.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedByName,
        reviewedAt: new Date(),
        reviewComment,
      },
    });

    return successResponse(updatedRequest);
  } catch (error) {
    return handleApiError(error, '変更申請の更新');
  }
}
