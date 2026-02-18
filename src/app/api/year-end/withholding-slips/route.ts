import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantIdFromRequest,
  getPaginationParams,
} from '@/lib/api/api-helpers';

/**
 * GET /api/year-end/withholding-slips - 源泉徴収票一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
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

    const [slips, total] = await Promise.all([
      prisma.withholding_slips.findMany({
        where,
        orderBy: [{ fiscalYear: 'desc' }, { userId: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.withholding_slips.count({ where }),
    ]);

    // ユーザー情報を結合
    const userIds = Array.from(new Set(slips.map((s) => s.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedSlips = slips.map((s) => ({
      ...s,
      user: userMap.get(s.userId) || null,
    }));

    return successResponse(
      { withholdingSlips: enrichedSlips },
      {
        count: enrichedSlips.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    return handleApiError(error, '源泉徴収票一覧の取得');
  }
}

/**
 * POST /api/year-end/withholding-slips - 源泉徴収票一括生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId = await getTenantIdFromRequest(request);

    const { userIds, fiscalYear, issueDate } = body;

    if (!fiscalYear) {
      return errorResponse('fiscalYearは必須です', 400);
    }

    // 対象従業員を取得
    let targetUserIds: string[] = userIds;
    if (!userIds || userIds.length === 0) {
      const users = await prisma.users.findMany({
        where: { tenantId, status: 'active' },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    }

    // 年末調整結果を取得
    const yearEndResults = await prisma.year_end_results.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        fiscalYear,
        status: { in: ['confirmed', 'paid'] },
      },
    });
    const resultMap = new Map(yearEndResults.map((r) => [r.userId, r]));

    // 申告書データを取得
    const declarations = await prisma.year_end_declarations.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        fiscalYear,
        status: 'approved',
      },
    });
    const declarationMap = new Map(declarations.map((d) => [d.userId, d]));

    // ユーザー情報を取得
    const users = await prisma.users.findMany({
      where: { id: { in: targetUserIds } },
      select: { id: true, name: true, email: true, department: true, position: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // テナント情報を取得（支払者情報用）
    const tenant = await prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    const results: { userId: string; success: boolean; slip?: unknown; error?: string }[] = [];
    const actualIssueDate = issueDate ? new Date(issueDate) : new Date();

    for (const userId of targetUserIds) {
      const yearEndResult = resultMap.get(userId);
      const declaration = declarationMap.get(userId);
      const user = userMap.get(userId);

      if (!yearEndResult) {
        results.push({ userId, success: false, error: '年末調整結果がありません' });
        continue;
      }

      if (!user) {
        results.push({ userId, success: false, error: 'ユーザー情報がありません' });
        continue;
      }

      try {
        // 既存の源泉徴収票をチェック
        const existing = await prisma.withholding_slips.findFirst({
          where: {
            tenantId,
            userId,
            fiscalYear,
            isReissue: false,
          },
        });

        let slip;
        // tenantsモデルにはaddressがないためnullを使用
        const slipData = {
          employeeName: user.name,
          payerName: tenant?.name || '',
          payerAddress: null, // 支払者住所は別途設定から取得
          paymentAmount: yearEndResult.totalIncome,
          employmentIncome: yearEndResult.employmentIncome,
          deductionTotal: yearEndResult.totalDeductions,
          withheldTax: yearEndResult.finalTax,
          hasSpouse: declaration?.hasSpouse ?? false,
          spouseName: declaration?.spouseName || null,
          spouseIncome: declaration?.spouseIncome ?? null,
          dependentCount: declaration?.dependentCount ?? 0,
          under16DependentCount: 0,
          socialInsuranceAmount: yearEndResult.socialInsuranceDeduction,
          lifeInsuranceDeduction: yearEndResult.lifeInsuranceDeduction,
          earthquakeInsuranceDeduction: yearEndResult.earthquakeInsuranceDeduction,
          mortgageDeduction: yearEndResult.mortgageDeduction,
          mortgageBalance: declaration?.mortgageBalance ?? null,
          issueDate: actualIssueDate,
          status: 'draft',
          updatedAt: new Date(),
        };

        if (existing) {
          slip = await prisma.withholding_slips.update({
            where: { id: existing.id },
            data: slipData,
          });
        } else {
          slip = await prisma.withholding_slips.create({
            data: {
              id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              tenantId,
              userId,
              fiscalYear,
              ...slipData,
            },
          });
        }

        results.push({ userId, success: true, slip });
      } catch (err) {
        results.push({ userId, success: false, error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return successResponse({
      results,
      summary: {
        total: targetUserIds.length,
        success: successCount,
        error: errorCount,
        fiscalYear,
      },
    });
  } catch (error) {
    return handleApiError(error, '源泉徴収票の生成');
  }
}

/**
 * PATCH /api/year-end/withholding-slips - 源泉徴収票ステータス更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // issue, deliver, reissue

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.withholding_slips.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('源泉徴収票が見つかりません', 404);
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    switch (action) {
      case 'issue':
        updateData.status = 'issued';
        updateData.issueNumber = `WS-${existing.fiscalYear}-${Date.now().toString(36).toUpperCase()}`;
        break;
      case 'deliver':
        updateData.status = 'delivered';
        updateData.deliveredAt = new Date();
        updateData.deliveryMethod = body.deliveryMethod || 'download';
        break;
      case 'reissue':
        // 再発行（新しいレコードを作成）
        const reissued = await prisma.withholding_slips.create({
          data: {
            id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            tenantId: existing.tenantId,
            userId: existing.userId,
            fiscalYear: existing.fiscalYear,
            employeeName: existing.employeeName,
            employeeAddress: existing.employeeAddress,
            payerName: existing.payerName,
            payerAddress: existing.payerAddress,
            payerCorporateNumber: existing.payerCorporateNumber,
            paymentAmount: existing.paymentAmount,
            employmentIncome: existing.employmentIncome,
            deductionTotal: existing.deductionTotal,
            withheldTax: existing.withheldTax,
            hasSpouse: existing.hasSpouse,
            spouseName: existing.spouseName,
            spouseIncome: existing.spouseIncome,
            dependentCount: existing.dependentCount,
            under16DependentCount: existing.under16DependentCount,
            socialInsuranceAmount: existing.socialInsuranceAmount,
            lifeInsuranceDeduction: existing.lifeInsuranceDeduction,
            earthquakeInsuranceDeduction: existing.earthquakeInsuranceDeduction,
            mortgageDeduction: existing.mortgageDeduction,
            mortgageBalance: existing.mortgageBalance,
            issueDate: new Date(),
            isReissue: true,
            reissueCount: existing.reissueCount + 1,
            status: 'issued',
            updatedAt: new Date(),
          },
        });
        return successResponse({ withholdingSlip: reissued });
      default:
        updateData = { ...body, updatedAt: new Date() };
        if (body.issueDate) updateData.issueDate = new Date(body.issueDate);
    }

    const slip = await prisma.withholding_slips.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ withholdingSlip: slip });
  } catch (error) {
    return handleApiError(error, '源泉徴収票の更新');
  }
}

/**
 * DELETE /api/year-end/withholding-slips - 源泉徴収票削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.withholding_slips.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('源泉徴収票が見つかりません', 404);
    }

    // 配布済みは削除不可
    if (existing.status === 'delivered') {
      return errorResponse('配布済みの源泉徴収票は削除できません', 400);
    }

    await prisma.withholding_slips.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '源泉徴収票の削除');
  }
}
