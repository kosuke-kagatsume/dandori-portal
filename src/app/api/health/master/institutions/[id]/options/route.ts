import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getTenantIdFromRequest,
  successResponse,
  handleApiError,
} from '@/lib/api/api-helpers';

// オプション検査一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const { id: institutionId } = await params;

    const options = await prisma.health_institution_options.findMany({
      where: { institutionId, tenantId },
      orderBy: { sortOrder: 'asc' },
    });

    return successResponse(options);
  } catch (error) {
    return handleApiError(error, 'オプション検査の取得');
  }
}

// オプション検査追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const { id: institutionId } = await params;
    const body = await request.json();
    const { name, code, price, description, isActive, sortOrder, companyPaid } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: '名前、料金は必須です' },
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

    const option = await prisma.health_institution_options.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        institutionId,
        name,
        code,
        price,
        description,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        companyPaid: companyPaid ?? false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: option }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'オプション検査の追加');
  }
}

// オプション検査更新
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const { id, name, code, price, description, isActive, sortOrder, companyPaid } = body;

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    // tenantId検証
    const existing = await prisma.health_institution_options.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'オプションが見つかりません' }, { status: 404 });
    }

    if (price !== undefined && (typeof price !== 'number' || !Number.isFinite(price) || price < 0)) {
      return NextResponse.json({ error: '料金は0以上の数値で指定してください' }, { status: 400 });
    }

    const option = await prisma.health_institution_options.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(price !== undefined && { price }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(companyPaid !== undefined && { companyPaid }),
        updatedAt: new Date(),
      },
    });

    return successResponse(option);
  } catch (error) {
    return handleApiError(error, 'オプション検査の更新');
  }
}

// オプション検査削除
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    // tenantId検証
    const existing = await prisma.health_institution_options.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'オプションが見つかりません' }, { status: 404 });
    }

    await prisma.health_institution_options.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'オプション検査の削除');
  }
}
