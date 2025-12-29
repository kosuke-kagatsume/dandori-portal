import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

/**
 * GET /api/year-end/declarations - 年末調整申告書一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');

    const where: {
      tenantId: string;
      userId?: string;
      fiscalYear?: number;
      status?: string;
    } = { tenantId };

    if (userId) where.userId = userId;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (status) where.status = status;

    const [declarations, total] = await Promise.all([
      prisma.year_end_declarations.findMany({
        where,
        orderBy: [{ fiscalYear: 'desc' }, { userId: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.year_end_declarations.count({ where }),
    ]);

    // ユーザー情報を結合
    const userIds = Array.from(new Set(declarations.map((d) => d.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedDeclarations = declarations.map((d) => ({
      ...d,
      user: userMap.get(d.userId) || null,
    }));

    return successResponse(
      { declarations: enrichedDeclarations },
      {
        count: enrichedDeclarations.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    return handleApiError(error, '年末調整申告書一覧の取得');
  }
}

/**
 * POST /api/year-end/declarations - 年末調整申告書作成/更新
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    if (!body.userId || !body.fiscalYear) {
      return errorResponse('userIdとfiscalYearは必須です', 400);
    }

    // 既存チェック
    const existing = await prisma.year_end_declarations.findUnique({
      where: {
        tenantId_userId_fiscalYear: {
          tenantId,
          userId: body.userId,
          fiscalYear: body.fiscalYear,
        },
      },
    });

    let declaration;
    if (existing) {
      // 更新（draft/rejectedのみ）
      if (existing.status !== 'draft' && existing.status !== 'rejected') {
        return errorResponse('提出済みの申告書は更新できません', 400);
      }
      declaration = await prisma.year_end_declarations.update({
        where: { id: existing.id },
        data: {
          ...body,
          tenantId,
          userId: body.userId,
          fiscalYear: body.fiscalYear,
          spouseBirthDate: body.spouseBirthDate ? new Date(body.spouseBirthDate) : null,
          updatedAt: new Date(),
        },
      });
    } else {
      // 新規作成
      declaration = await prisma.year_end_declarations.create({
        data: {
          id: `yed-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tenantId,
          userId: body.userId,
          fiscalYear: body.fiscalYear,
          maritalStatus: body.maritalStatus || null,
          isDisabled: body.isDisabled ?? false,
          disabilityType: body.disabilityType || null,
          isWorkingStudent: body.isWorkingStudent ?? false,
          isSingleParent: body.isSingleParent ?? false,
          isWidow: body.isWidow ?? false,
          hasSpouse: body.hasSpouse ?? false,
          spouseName: body.spouseName || null,
          spouseBirthDate: body.spouseBirthDate ? new Date(body.spouseBirthDate) : null,
          spouseIncome: body.spouseIncome ?? null,
          spouseIsDisabled: body.spouseIsDisabled ?? false,
          spouseDisabilityType: body.spouseDisabilityType || null,
          spouseLivingTogether: body.spouseLivingTogether ?? true,
          dependentsJson: body.dependentsJson || null,
          dependentCount: body.dependentCount ?? 0,
          specificDependentCount: body.specificDependentCount ?? 0,
          elderlyDependentCount: body.elderlyDependentCount ?? 0,
          lifeInsuranceNew: body.lifeInsuranceNew ?? 0,
          lifeInsuranceOld: body.lifeInsuranceOld ?? 0,
          medicalInsurance: body.medicalInsurance ?? 0,
          pensionInsuranceNew: body.pensionInsuranceNew ?? 0,
          pensionInsuranceOld: body.pensionInsuranceOld ?? 0,
          earthquakeInsurance: body.earthquakeInsurance ?? 0,
          longTermDamageIns: body.longTermDamageIns ?? 0,
          nationalPension: body.nationalPension ?? 0,
          nationalHealthIns: body.nationalHealthIns ?? 0,
          otherSocialIns: body.otherSocialIns ?? 0,
          idecoAmount: body.idecoAmount ?? 0,
          smallBusinessMutualAid: body.smallBusinessMutualAid ?? 0,
          hasMortgage: body.hasMortgage ?? false,
          mortgageBalance: body.mortgageBalance ?? null,
          mortgageType: body.mortgageType || null,
          mortgageStartYear: body.mortgageStartYear ?? null,
          documentsJson: body.documentsJson || null,
          status: 'draft',
          notes: body.notes || null,
          updatedAt: new Date(),
        },
      });
    }

    return successResponse({ declaration }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '年末調整申告書の作成/更新');
  }
}

/**
 * PATCH /api/year-end/declarations - 申告書ステータス更新（提出/承認/却下）
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // submit, approve, reject

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.year_end_declarations.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('申告書が見つかりません', 404);
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    switch (action) {
      case 'submit':
        if (existing.status !== 'draft' && existing.status !== 'rejected') {
          return errorResponse('提出できる状態ではありません', 400);
        }
        updateData.status = 'submitted';
        updateData.submittedAt = new Date();
        break;
      case 'approve':
        if (existing.status !== 'submitted') {
          return errorResponse('承認できる状態ではありません', 400);
        }
        updateData.status = 'approved';
        updateData.approvedAt = new Date();
        updateData.approvedBy = body.approvedBy || null;
        break;
      case 'reject':
        if (existing.status !== 'submitted') {
          return errorResponse('却下できる状態ではありません', 400);
        }
        updateData.status = 'rejected';
        updateData.rejectionReason = body.rejectionReason || null;
        break;
      default:
        // 通常の更新
        updateData = { ...body, updatedAt: new Date() };
        if (body.spouseBirthDate) updateData.spouseBirthDate = new Date(body.spouseBirthDate);
    }

    const declaration = await prisma.year_end_declarations.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ declaration });
  } catch (error) {
    return handleApiError(error, '年末調整申告書のステータス更新');
  }
}

/**
 * DELETE /api/year-end/declarations - 申告書削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.year_end_declarations.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('申告書が見つかりません', 404);
    }

    // 承認済みは削除不可
    if (existing.status === 'approved') {
      return errorResponse('承認済みの申告書は削除できません', 400);
    }

    await prisma.year_end_declarations.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '年末調整申告書の削除');
  }
}
