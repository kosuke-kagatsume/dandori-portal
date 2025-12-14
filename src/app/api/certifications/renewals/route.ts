import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
} from '@/lib/api/api-helpers';

// GET /api/certifications/renewals - 更新申請一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const renewals = await prisma.certification_renewals.findMany({
      where,
      include: {
        certification: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ユーザー情報を一括取得
    const userIds = [...new Set(renewals.map(r => r.userId))];
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // ステータス別カウント
    const counts = {
      pending: renewals.filter((r) => r.status === 'pending').length,
      underReview: renewals.filter((r) => r.status === 'under_review').length,
      approved: renewals.filter((r) => r.status === 'approved').length,
      rejected: renewals.filter((r) => r.status === 'rejected').length,
    };

    return successResponse({
      renewals: renewals.map(r => ({
        ...r,
        user: userMap.get(r.userId) || null,
      })),
      counts,
    });
  } catch (error) {
    return handleApiError(error, '更新申請一覧の取得');
  }
}

// POST /api/certifications/renewals - 更新申請作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      certificationId,
      userId,
      newIssueDate,
      newExpiryDate,
      newCredentialId,
      newDocumentUrl,
      newDocumentName,
      notes,
    } = body;

    if (!certificationId || !userId || !newIssueDate) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています',
          required: ['certificationId', 'userId', 'newIssueDate'],
        },
        { status: 400 }
      );
    }

    // 既存の未処理申請がないか確認
    const existingRenewal = await prisma.certification_renewals.findFirst({
      where: {
        certificationId,
        status: { in: ['pending', 'under_review'] },
      },
    });

    if (existingRenewal) {
      return NextResponse.json(
        {
          success: false,
          error: 'この資格には処理中の更新申請があります',
        },
        { status: 400 }
      );
    }

    const renewal = await prisma.certification_renewals.create({
      data: {
        tenantId: tenantId || 'tenant-demo-001',
        certificationId,
        userId,
        newIssueDate: new Date(newIssueDate),
        newExpiryDate: newExpiryDate ? new Date(newExpiryDate) : null,
        newCredentialId,
        newDocumentUrl,
        newDocumentName,
        notes,
      },
    });

    return NextResponse.json(
      { success: true, data: renewal },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '更新申請の作成');
  }
}

// PATCH /api/certifications/renewals - 更新申請審査
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      action,
      reviewedBy,
      reviewedByName,
      reviewComment,
      documentVerified,
      dateVerified,
      organizationVerified,
    } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'id and action are required' },
        { status: 400 }
      );
    }

    // 申請を取得
    const renewal = await prisma.certification_renewals.findUnique({
      where: { id },
      include: { certification: true },
    });

    if (!renewal) {
      return NextResponse.json(
        { success: false, error: '申請が見つかりません' },
        { status: 404 }
      );
    }

    let updatedRenewal;

    if (action === 'start_review') {
      // 審査開始
      updatedRenewal = await prisma.certification_renewals.update({
        where: { id },
        data: {
          status: 'under_review',
          updatedAt: new Date(),
        },
      });
    } else if (action === 'approve') {
      // 承認処理（トランザクション）
      updatedRenewal = await prisma.$transaction(async (tx) => {
        // 1. 更新申請を承認
        const approved = await tx.certificationRenewal.update({
          where: { id },
          data: {
            status: 'approved',
            reviewedBy,
            reviewedByName,
            reviewedAt: new Date(),
            reviewComment,
            documentVerified: documentVerified ?? true,
            dateVerified: dateVerified ?? true,
            organizationVerified: organizationVerified ?? true,
            updatedAt: new Date(),
          },
        });

        // 2. 元の資格情報を更新
        await tx.certification.update({
          where: { id: renewal.certificationId },
          data: {
            issueDate: renewal.newIssueDate,
            expiryDate: renewal.newExpiryDate,
            credentialId: renewal.newCredentialId || renewal.certification.credentialId,
            documentUrl: renewal.newDocumentUrl || renewal.certification.documentUrl,
            documentName: renewal.newDocumentName || renewal.certification.documentName,
            status: 'active', // 更新されたのでactiveに
            updatedAt: new Date(),
          },
        });

        return approved;
      });
    } else if (action === 'reject') {
      // 却下
      updatedRenewal = await prisma.certification_renewals.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedBy,
          reviewedByName,
          reviewedAt: new Date(),
          reviewComment,
          updatedAt: new Date(),
        },
      });
    } else if (action === 'update_checklist') {
      // チェックリスト更新
      updatedRenewal = await prisma.certification_renewals.update({
        where: { id },
        data: {
          documentVerified: documentVerified ?? renewal.documentVerified,
          dateVerified: dateVerified ?? renewal.dateVerified,
          organizationVerified: organizationVerified ?? renewal.organizationVerified,
          updatedAt: new Date(),
        },
      });
    }

    return successResponse(updatedRenewal);
  } catch (error) {
    return handleApiError(error, '更新申請の審査');
  }
}
