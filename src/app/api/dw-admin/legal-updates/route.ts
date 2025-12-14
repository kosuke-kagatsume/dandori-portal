import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  successResponse,
  handleApiError,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// DW管理API用の独立したPrismaクライアント
const prisma = new PrismaClient();

// GET /api/dw-admin/legal-updates - 法令一覧取得（DW管理用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPublished = searchParams.get('isPublished');
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (isPublished !== null && isPublished !== 'all') {
      where.isPublished = isPublished === 'true';
    }

    const [legalUpdates, total] = await Promise.all([
      prisma.legal_updates.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          effectiveDate: true,
          relatedLaws: true,
          affectedAreas: true,
          priority: true,
          isPublished: true,
          publishedAt: true,
          referenceUrl: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          _count: {
            select: { tenantStatuses: true }
          }
        },
        orderBy: [
          { effectiveDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.legal_updates.count({ where }),
    ]);

    return successResponse(legalUpdates, {
      count: legalUpdates.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 300, // 5分キャッシュ（管理用）
    });
  } catch (error) {
    return handleApiError(error, '法令一覧の取得（DW管理）');
  }
}

// POST /api/dw-admin/legal-updates - 法令新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      effectiveDate,
      relatedLaws,
      affectedAreas,
      priority,
      isPublished,
      referenceUrl,
      attachments,
      createdBy,
    } = body;

    // バリデーション
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'タイトルは必須です' },
        { status: 400 }
      );
    }
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'カテゴリは必須です' },
        { status: 400 }
      );
    }
    if (!effectiveDate) {
      return NextResponse.json(
        { success: false, error: '施行日は必須です' },
        { status: 400 }
      );
    }

    const legalUpdate = await prisma.legal_updates.create({
      data: {
        title,
        description,
        category,
        effectiveDate: new Date(effectiveDate),
        relatedLaws,
        affectedAreas: affectedAreas || [],
        priority: priority || 'medium',
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        referenceUrl,
        attachments,
        createdBy,
      },
    });

    return NextResponse.json({
      success: true,
      data: legalUpdate,
    });
  } catch (error) {
    console.error('Error creating legal update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create legal update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
