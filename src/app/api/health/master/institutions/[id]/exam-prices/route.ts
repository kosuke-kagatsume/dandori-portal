import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
} from '@/lib/api/api-helpers';

// 検査項目料金一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const { id: institutionId } = await params;

    const prices = await prisma.health_institution_exam_prices.findMany({
      where: { institutionId, tenantId },
      include: {
        health_checkup_types: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(prices);
  } catch (error) {
    return handleApiError(error, '検査項目料金の取得');
  }
}

// 検査項目料金追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: institutionId } = await params;
    const body = await request.json();
    const { checkupTypeId, price, isActive, notes } = body;

    if (!checkupTypeId || price === undefined) {
      return NextResponse.json(
        { error: '検査種別ID、料金は必須です' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: '料金は0以上の数値で指定してください' },
        { status: 400 }
      );
    }

    // 医療機関の所有権検証
    const institution = await prisma.health_medical_institutions.findFirst({
      where: { id: institutionId, tenantId },
    });
    if (!institution) {
      return NextResponse.json({ error: '医療機関が見つかりません' }, { status: 404 });
    }

    // 検査種別のテナント検証
    const checkupType = await prisma.health_checkup_types.findFirst({
      where: { id: checkupTypeId, tenantId },
    });
    if (!checkupType) {
      return NextResponse.json({ error: '検査種別が見つかりません' }, { status: 404 });
    }

    const examPrice = await prisma.health_institution_exam_prices.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        institutionId,
        checkupTypeId,
        price,
        isActive: isActive ?? true,
        notes,
        updatedAt: new Date(),
      },
      include: {
        health_checkup_types: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: examPrice }, { status: 201 });
  } catch (error) {
    return handleApiError(error, '検査項目料金の追加');
  }
}

// 検査項目料金更新
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const { id, price, isActive, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    // tenantId検証
    const existing = await prisma.health_institution_exam_prices.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: '料金情報が見つかりません' }, { status: 404 });
    }

    if (price !== undefined && (typeof price !== 'number' || !Number.isFinite(price) || price < 0)) {
      return NextResponse.json({ error: '料金は0以上の数値で指定してください' }, { status: 400 });
    }

    const examPrice = await prisma.health_institution_exam_prices.update({
      where: { id },
      data: {
        ...(price !== undefined && { price }),
        ...(isActive !== undefined && { isActive }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      },
      include: {
        health_checkup_types: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(examPrice);
  } catch (error) {
    return handleApiError(error, '検査項目料金の更新');
  }
}

// 検査項目料金削除
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    // tenantId検証
    const existing = await prisma.health_institution_exam_prices.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: '料金情報が見つかりません' }, { status: 404 });
    }

    await prisma.health_institution_exam_prices.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, '検査項目料金の削除');
  }
}
