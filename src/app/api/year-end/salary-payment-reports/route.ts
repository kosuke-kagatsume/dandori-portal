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
 * GET /api/year-end/salary-payment-reports - 給与支払報告書一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const userId = searchParams.get('userId');
    const fiscalYear = searchParams.get('fiscalYear');
    const municipalityCode = searchParams.get('municipalityCode');
    const status = searchParams.get('status');

    const where: {
      tenantId: string;
      userId?: string;
      fiscalYear?: number;
      municipalityCode?: string;
      status?: string;
    } = { tenantId };

    if (userId) where.userId = userId;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (municipalityCode) where.municipalityCode = municipalityCode;
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.salary_payment_reports.findMany({
        where,
        orderBy: [{ fiscalYear: 'desc' }, { municipalityCode: 'asc' }, { userId: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.salary_payment_reports.count({ where }),
    ]);

    // ユーザー情報を結合
    const userIds = Array.from(new Set(reports.map((r) => r.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedReports = reports.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || null,
    }));

    return successResponse(
      { reports: enrichedReports },
      {
        count: enrichedReports.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    return handleApiError(error, '給与支払報告書一覧の取得');
  }
}

/**
 * POST /api/year-end/salary-payment-reports - 給与支払報告書一括生成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const { userIds, fiscalYear, municipalityMapping } = body;

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

    // 源泉徴収票データを取得
    const withholdingSlips = await prisma.withholding_slips.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        fiscalYear,
      },
    });
    const slipMap = new Map(withholdingSlips.map((s) => [s.userId, s]));

    // ユーザー情報を取得
    const users = await prisma.users.findMany({
      where: { id: { in: targetUserIds } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 市区町村マッピング（userIdごとの住所から市区町村を取得）
    const municipalityMap = new Map<string, { code: string; name: string }>();
    if (municipalityMapping) {
      for (const [userId, info] of Object.entries(municipalityMapping)) {
        municipalityMap.set(userId, info as { code: string; name: string });
      }
    }

    const results: { userId: string; success: boolean; report?: unknown; error?: string }[] = [];

    for (const userId of targetUserIds) {
      const slip = slipMap.get(userId);
      const user = userMap.get(userId);

      if (!slip) {
        results.push({ userId, success: false, error: '源泉徴収票がありません' });
        continue;
      }

      if (!user) {
        results.push({ userId, success: false, error: 'ユーザー情報がありません' });
        continue;
      }

      // 市区町村情報（マッピングがなければデフォルト）
      const municipality = municipalityMap.get(userId) || {
        code: '131016', // デフォルト: 東京都千代田区
        name: '東京都千代田区',
      };

      try {
        const existing = await prisma.salary_payment_reports.findFirst({
          where: {
            tenantId,
            userId,
            fiscalYear,
            submissionType: 'normal',
          },
        });

        let report;
        const reportData = {
          municipalityCode: municipality.code,
          municipalityName: municipality.name,
          employeeName: user.name,
          employeeAddress: user.address || '',
          employeeBirthDate: user.birthDate ? new Date(user.birthDate) : null,
          jan1Address: user.address || null,
          paymentAmount: slip.paymentAmount,
          withheldTax: slip.withheldTax,
          socialInsuranceAmount: slip.socialInsuranceAmount,
          submissionType: 'normal',
          isSpecialCollection: true,
          status: 'draft',
          updatedAt: new Date(),
        };

        if (existing) {
          report = await prisma.salary_payment_reports.update({
            where: { id: existing.id },
            data: reportData,
          });
        } else {
          report = await prisma.salary_payment_reports.create({
            data: {
              id: `spr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              tenantId,
              userId,
              fiscalYear,
              ...reportData,
            },
          });
        }

        results.push({ userId, success: true, report });
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
    return handleApiError(error, '給与支払報告書の生成');
  }
}

/**
 * PATCH /api/year-end/salary-payment-reports - 報告書ステータス更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // submit, accept

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.salary_payment_reports.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与支払報告書が見つかりません', 404);
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    switch (action) {
      case 'submit':
        updateData.status = 'submitted';
        updateData.submittedAt = new Date();
        updateData.submissionMethod = body.submissionMethod || 'eltax';
        break;
      case 'accept':
        updateData.status = 'accepted';
        updateData.receiptNumber = body.receiptNumber || null;
        break;
      default:
        updateData = { ...body, updatedAt: new Date() };
        if (body.employeeBirthDate) updateData.employeeBirthDate = new Date(body.employeeBirthDate);
    }

    const report = await prisma.salary_payment_reports.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ report });
  } catch (error) {
    return handleApiError(error, '給与支払報告書の更新');
  }
}

/**
 * DELETE /api/year-end/salary-payment-reports - 報告書削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.salary_payment_reports.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('給与支払報告書が見つかりません', 404);
    }

    // 提出済みは削除不可
    if (existing.status === 'submitted' || existing.status === 'accepted') {
      return errorResponse('提出済みの報告書は削除できません', 400);
    }

    await prisma.salary_payment_reports.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '給与支払報告書の削除');
  }
}
