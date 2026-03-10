import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest, handleApiError, successResponse } from '@/lib/api/api-helpers';

// 単一医療機関詳細取得（料金・オプション含む）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const { id } = await params;

    const institution = await prisma.health_medical_institutions.findFirst({
      where: { id, tenantId },
      include: {
        health_institution_exam_prices: {
          include: {
            health_checkup_types: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        health_institution_options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!institution) {
      return NextResponse.json({ error: '医療機関が見つかりません' }, { status: 404 });
    }

    return successResponse(institution);
  } catch (error) {
    return handleApiError(error, '医療機関詳細の取得');
  }
}
