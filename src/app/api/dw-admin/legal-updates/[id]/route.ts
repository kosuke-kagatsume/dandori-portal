import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// DW管理API用の独立したPrismaクライアント
const prisma = new PrismaClient();

// GET /api/dw-admin/legal-updates/[id] - 法令詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const legalUpdate = await prisma.legalUpdate.findUnique({
      where: { id: params.id },
      include: {
        tenantStatuses: {
          orderBy: { updatedAt: 'desc' },
        },
        _count: {
          select: { tenantStatuses: true }
        }
      },
    });

    if (!legalUpdate) {
      return NextResponse.json(
        { success: false, error: '法令が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: legalUpdate,
    });
  } catch (error) {
    console.error('Error fetching legal update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch legal update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/dw-admin/legal-updates/[id] - 法令更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    } = body;

    // 既存レコード確認
    const existing = await prisma.legalUpdate.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '法令が見つかりません' },
        { status: 404 }
      );
    }

    // 公開フラグが変更された場合、公開日時を更新
    let publishedAt = existing.publishedAt;
    if (isPublished && !existing.isPublished) {
      publishedAt = new Date();
    } else if (!isPublished && existing.isPublished) {
      publishedAt = null;
    }

    const legalUpdate = await prisma.legalUpdate.update({
      where: { id: params.id },
      data: {
        title,
        description,
        category,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        relatedLaws,
        affectedAreas,
        priority,
        isPublished,
        publishedAt,
        referenceUrl,
        attachments,
      },
    });

    return NextResponse.json({
      success: true,
      data: legalUpdate,
    });
  } catch (error) {
    console.error('Error updating legal update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update legal update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/dw-admin/legal-updates/[id] - 法令削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 既存レコード確認
    const existing = await prisma.legalUpdate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { tenantStatuses: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '法令が見つかりません' },
        { status: 404 }
      );
    }

    // 公開済みで対応状況があるものは削除不可（警告）
    if (existing.isPublished && existing._count.tenantStatuses > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '公開済みで対応状況が登録されている法令は削除できません',
          tenantStatusCount: existing._count.tenantStatuses,
        },
        { status: 400 }
      );
    }

    await prisma.legalUpdate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: '法令を削除しました',
    });
  } catch (error) {
    console.error('Error deleting legal update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete legal update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
