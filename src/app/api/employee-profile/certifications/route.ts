import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// GET /api/employee-profile/certifications - 資格一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (status && status !== 'all') where.status = status;

    const total = await prisma.certification.count({ where });

    const certifications = await prisma.certification.findMany({
      where,
      orderBy: [{ status: 'asc' }, { expiryDate: 'asc' }],
      skip,
      take: limit,
    });

    // ステータスを更新（期限切れ判定）
    const today = new Date();
    const updatedCertifications = certifications.map(cert => {
      if (cert.expiryDate) {
        const daysUntilExpiry = Math.ceil(
          (cert.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry < 0) {
          return { ...cert, status: 'expired' };
        } else if (daysUntilExpiry < 90) {
          return { ...cert, status: 'expiring' };
        }
      }
      return cert;
    });

    return successResponse(updatedCertifications, {
      count: updatedCertifications.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 300,
    });
  } catch (error) {
    return handleApiError(error, '資格一覧の取得');
  }
}

// POST /api/employee-profile/certifications - 資格追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      profileId,
      userId,
      name,
      organization,
      issueDate,
      expiryDate,
      credentialId,
      documentUrl,
      documentName,
      documentSize,
      notes,
    } = body;

    // バリデーション
    if (!name || !organization || !issueDate || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: '必須項目が不足しています',
          required: ['name', 'organization', 'issueDate', 'userId'],
        },
        { status: 400 }
      );
    }

    // プロフィールIDを取得（なければ作成）
    let profile = await prisma.employeeProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.employeeProfile.create({
        data: {
          tenantId: tenantId || 'tenant-demo-001',
          userId,
        },
      });
    }

    // ステータス判定
    let status = 'active';
    if (expiryDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry < 90) {
        status = 'expiring';
      }
    }

    const certification = await prisma.certification.create({
      data: {
        tenantId: tenantId || profile.tenantId,
        profileId: profile.id,
        userId,
        name,
        organization,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId,
        status,
        documentUrl,
        documentName,
        documentSize,
        notes,
      },
    });

    return NextResponse.json(
      { success: true, data: certification },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, '資格の追加');
  }
}
