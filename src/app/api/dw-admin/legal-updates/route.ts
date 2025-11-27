import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/dw-admin/legal-updates - 法令一覧取得（DW管理用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPublished = searchParams.get('isPublished');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (isPublished !== null && isPublished !== 'all') {
      where.isPublished = isPublished === 'true';
    }

    const [legalUpdates, total] = await Promise.all([
      prisma.legalUpdate.findMany({
        where,
        orderBy: [
          { effectiveDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { tenantStatuses: true }
          }
        }
      }),
      prisma.legalUpdate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: legalUpdates,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + legalUpdates.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching legal updates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch legal updates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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

    const legalUpdate = await prisma.legalUpdate.create({
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
