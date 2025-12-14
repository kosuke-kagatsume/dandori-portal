import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/legal-updates/[id]/status - テナントの対応状況を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      status,
      notes,
      completedBy,
    } = body;

    // 法令の存在確認
    const legalUpdate = await prisma.legal_updates.findUnique({
      where: { id: params.id },
    });

    if (!legalUpdate) {
      return NextResponse.json(
        { success: false, error: '法令が見つかりません' },
        { status: 404 }
      );
    }

    // ステータスのバリデーション
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '無効なステータスです' },
        { status: 400 }
      );
    }

    // 完了日時の設定
    let completedAt = undefined;
    if (status === 'completed') {
      completedAt = new Date();
    } else if (status === 'pending' || status === 'in_progress') {
      completedAt = null;
    }

    // upsert（存在すれば更新、なければ作成）
    const tenantStatus = await prisma.tenant_legal_statuses.upsert({
      where: {
        tenantId_legalUpdateId: {
          tenantId,
          legalUpdateId: params.id,
        },
      },
      update: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        completedAt,
        completedBy: status === 'completed' ? completedBy : (status === 'pending' ? null : undefined),
      },
      create: {
        tenantId,
        legalUpdateId: params.id,
        status: status || 'pending',
        notes,
        completedAt,
        completedBy: status === 'completed' ? completedBy : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: tenantStatus.id,
        status: tenantStatus.status,
        notes: tenantStatus.notes,
        completedAt: tenantStatus.completedAt,
        completedBy: tenantStatus.completedBy,
      },
    });
  } catch (error) {
    console.error('Error updating tenant legal status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update tenant legal status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/legal-updates/[id]/status - テナントの対応状況を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const tenantStatus = await prisma.tenant_legal_statuses.findUnique({
      where: {
        tenantId_legalUpdateId: {
          tenantId,
          legalUpdateId: params.id,
        },
      },
      include: {
        legalUpdate: {
          select: {
            id: true,
            title: true,
            category: true,
            effectiveDate: true,
          },
        },
      },
    });

    if (!tenantStatus) {
      // ステータスが未登録の場合はデフォルト値を返す
      return NextResponse.json({
        success: true,
        data: {
          status: 'pending',
          notes: null,
          completedAt: null,
          completedBy: null,
        },
        isNew: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tenantStatus.id,
        status: tenantStatus.status,
        notes: tenantStatus.notes,
        completedAt: tenantStatus.completedAt,
        completedBy: tenantStatus.completedBy,
        legalUpdate: tenantStatus.legalUpdate,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant legal status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tenant legal status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
