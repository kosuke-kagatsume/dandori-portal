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
 * 給与所得控除額を計算
 */
function calculateEmploymentIncomeDeduction(income: number): number {
  if (income <= 1625000) return 550000;
  if (income <= 1800000) return Math.floor(income * 0.4 - 100000);
  if (income <= 3600000) return Math.floor(income * 0.3 + 80000);
  if (income <= 6600000) return Math.floor(income * 0.2 + 440000);
  if (income <= 8500000) return Math.floor(income * 0.1 + 1100000);
  return 1950000;
}

/**
 * 基礎控除額を計算
 */
function calculateBasicDeduction(income: number): number {
  if (income <= 24000000) return 480000;
  if (income <= 24500000) return 320000;
  if (income <= 25000000) return 160000;
  return 0;
}

/**
 * 所得税額を計算
 */
function calculateIncomeTax(taxableIncome: number): number {
  const rates = [
    { max: 1950000, rate: 0.05, deduction: 0 },
    { max: 3300000, rate: 0.1, deduction: 97500 },
    { max: 6950000, rate: 0.2, deduction: 427500 },
    { max: 9000000, rate: 0.23, deduction: 636000 },
    { max: 18000000, rate: 0.33, deduction: 1536000 },
    { max: 40000000, rate: 0.4, deduction: 2796000 },
    { max: Infinity, rate: 0.45, deduction: 4796000 },
  ];

  const bracket = rates.find((r) => taxableIncome <= r.max);
  if (!bracket) return 0;

  return Math.floor(taxableIncome * bracket.rate - bracket.deduction);
}

/**
 * GET /api/year-end/results - 年末調整結果一覧取得
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

    const [results, total] = await Promise.all([
      prisma.year_end_results.findMany({
        where,
        orderBy: [{ fiscalYear: 'desc' }, { userId: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.year_end_results.count({ where }),
    ]);

    // ユーザー情報を結合
    const userIds = Array.from(new Set(results.map((r) => r.userId)));
    const users = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedResults = results.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || null,
    }));

    return successResponse(
      { results: enrichedResults },
      {
        count: enrichedResults.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    );
  } catch (error) {
    return handleApiError(error, '年末調整結果一覧の取得');
  }
}

/**
 * POST /api/year-end/results - 年末調整計算実行
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);

    const { userIds, fiscalYear } = body;

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

    if (targetUserIds.length === 0) {
      return errorResponse('計算対象の従業員が見つかりません', 404);
    }

    // 承認済み申告書を取得
    const declarations = await prisma.year_end_declarations.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        fiscalYear,
        status: 'approved',
      },
    });
    const declarationMap = new Map(declarations.map((d) => [d.userId, d]));

    // 年間給与・賞与データを取得
    const paySlips = await prisma.pay_slips.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        payPeriod: { startsWith: String(fiscalYear) },
        status: { in: ['confirmed', 'paid'] },
      },
    });

    const bonusSlips = await prisma.bonus_slips.findMany({
      where: {
        tenantId,
        userId: { in: targetUserIds },
        payPeriod: { startsWith: String(fiscalYear) },
        status: { in: ['approved', 'paid'] },
      },
    });

    // ユーザーごとの給与集計
    const salaryByUser = new Map<string, { salary: number; bonus: number; tax: number; socialIns: number }>();
    for (const ps of paySlips) {
      const current = salaryByUser.get(ps.userId) || { salary: 0, bonus: 0, tax: 0, socialIns: 0 };
      current.salary += ps.grossPay;
      current.tax += ps.incomeTax;
      current.socialIns += ps.healthInsurance + ps.pensionInsurance + ps.employmentInsurance;
      salaryByUser.set(ps.userId, current);
    }
    for (const bs of bonusSlips) {
      const current = salaryByUser.get(bs.userId) || { salary: 0, bonus: 0, tax: 0, socialIns: 0 };
      current.bonus += bs.grossBonus;
      current.tax += bs.incomeTax;
      current.socialIns += bs.healthInsurance + bs.pensionInsurance + bs.employmentInsurance;
      salaryByUser.set(bs.userId, current);
    }

    const results: { userId: string; success: boolean; result?: unknown; error?: string }[] = [];

    for (const userId of targetUserIds) {
      const declaration = declarationMap.get(userId);
      const salaryData = salaryByUser.get(userId);

      if (!salaryData) {
        results.push({ userId, success: false, error: '給与データがありません' });
        continue;
      }

      // 年間収入
      const totalSalary = salaryData.salary;
      const totalBonus = salaryData.bonus;
      const totalIncome = totalSalary + totalBonus;

      // 給与所得控除
      const employmentIncomeDeduction = calculateEmploymentIncomeDeduction(totalIncome);
      const employmentIncome = Math.max(0, totalIncome - employmentIncomeDeduction);

      // 基礎控除
      const basicDeduction = calculateBasicDeduction(employmentIncome);

      // 社会保険料控除
      let socialInsuranceDeduction = salaryData.socialIns;
      if (declaration) {
        socialInsuranceDeduction += (declaration.nationalPension || 0) +
          (declaration.nationalHealthIns || 0) +
          (declaration.otherSocialIns || 0);
      }

      // 配偶者控除・配偶者特別控除
      let spouseDeduction = 0;
      let spouseSpecialDeduction = 0;
      if (declaration?.hasSpouse && declaration.spouseIncome !== null) {
        const spouseIncome = declaration.spouseIncome || 0;
        if (spouseIncome <= 480000) {
          spouseDeduction = 380000; // 配偶者控除
        } else if (spouseIncome <= 1330000) {
          spouseSpecialDeduction = Math.floor((1330000 - spouseIncome) / 50000) * 10000;
        }
      }

      // 扶養控除
      let dependentDeduction = 0;
      if (declaration) {
        dependentDeduction = (declaration.dependentCount - declaration.specificDependentCount - declaration.elderlyDependentCount) * 380000;
        dependentDeduction += (declaration.specificDependentCount || 0) * 630000;
        dependentDeduction += (declaration.elderlyDependentCount || 0) * 480000;
      }

      // 障害者控除
      let disabilityDeduction = 0;
      if (declaration?.isDisabled) {
        disabilityDeduction = declaration.disabilityType === 'special' ? 400000 :
          declaration.disabilityType === 'special_living' ? 750000 : 270000;
      }

      // 寡婦・ひとり親控除
      const widowDeduction = declaration?.isWidow ? 270000 : 0;
      const singleParentDeduction = declaration?.isSingleParent ? 350000 : 0;
      const workingStudentDeduction = declaration?.isWorkingStudent ? 270000 : 0;

      // 生命保険料控除
      let lifeInsuranceDeduction = 0;
      if (declaration) {
        const newLife = Math.min((declaration.lifeInsuranceNew || 0), 40000);
        const oldLife = Math.min((declaration.lifeInsuranceOld || 0), 50000);
        const medical = Math.min((declaration.medicalInsurance || 0), 40000);
        const newPension = Math.min((declaration.pensionInsuranceNew || 0), 40000);
        const oldPension = Math.min((declaration.pensionInsuranceOld || 0), 50000);
        lifeInsuranceDeduction = Math.min(newLife + oldLife + medical + newPension + oldPension, 120000);
      }

      // 地震保険料控除
      let earthquakeInsuranceDeduction = 0;
      if (declaration) {
        earthquakeInsuranceDeduction = Math.min((declaration.earthquakeInsurance || 0), 50000);
      }

      // 小規模企業共済等
      let smallBusinessDeduction = 0;
      if (declaration) {
        smallBusinessDeduction = (declaration.idecoAmount || 0) + (declaration.smallBusinessMutualAid || 0);
      }

      // 所得控除合計
      const totalDeductions = basicDeduction + spouseDeduction + spouseSpecialDeduction +
        dependentDeduction + disabilityDeduction + widowDeduction + singleParentDeduction +
        workingStudentDeduction + socialInsuranceDeduction + lifeInsuranceDeduction +
        earthquakeInsuranceDeduction + smallBusinessDeduction;

      // 課税所得
      const taxableIncome = Math.max(0, Math.floor((employmentIncome - totalDeductions) / 1000) * 1000);

      // 所得税額
      const calculatedTax = calculateIncomeTax(taxableIncome);
      const specialReconstructionTax = Math.floor(calculatedTax * 0.021);
      const totalTax = calculatedTax + specialReconstructionTax;

      // 住宅借入金等特別控除
      let mortgageDeduction = 0;
      if (declaration?.hasMortgage && declaration.mortgageBalance) {
        mortgageDeduction = Math.min(Math.floor(declaration.mortgageBalance * 0.01), 400000);
      }
      const finalTax = Math.max(0, totalTax - mortgageDeduction);

      // 年末調整額
      const withheldTaxTotal = salaryData.tax;
      const adjustmentAmount = withheldTaxTotal - finalTax;
      const isRefund = adjustmentAmount > 0;

      try {
        const existingResult = await prisma.year_end_results.findUnique({
          where: {
            tenantId_userId_fiscalYear: { tenantId, userId, fiscalYear },
          },
        });

        let result;
        const resultData = {
          totalSalary,
          totalBonus,
          totalIncome,
          employmentIncomeDeduction,
          employmentIncome,
          basicDeduction,
          spouseDeduction,
          spouseSpecialDeduction,
          dependentDeduction,
          disabilityDeduction,
          widowDeduction,
          singleParentDeduction,
          workingStudentDeduction,
          socialInsuranceDeduction,
          lifeInsuranceDeduction,
          earthquakeInsuranceDeduction,
          smallBusinessDeduction,
          totalDeductions,
          taxableIncome,
          calculatedTax,
          specialReconstructionTax,
          totalTax,
          mortgageDeduction,
          finalTax,
          withheldTaxTotal,
          adjustmentAmount,
          isRefund,
          status: 'calculated',
          calculatedAt: new Date(),
          updatedAt: new Date(),
        };

        if (existingResult) {
          result = await prisma.year_end_results.update({
            where: { id: existingResult.id },
            data: resultData,
          });
        } else {
          result = await prisma.year_end_results.create({
            data: {
              id: `yer-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              tenantId,
              userId,
              fiscalYear,
              ...resultData,
            },
          });
        }

        results.push({ userId, success: true, result });
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
    return handleApiError(error, '年末調整計算');
  }
}

/**
 * PATCH /api/year-end/results - 結果ステータス更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = await getTenantIdFromRequest(request);
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // confirm, pay

    if (!id) {
      return errorResponse('IDが必要です', 400);
    }

    const existing = await prisma.year_end_results.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('年末調整結果が見つかりません', 404);
    }

    let updateData: Record<string, unknown> = { updatedAt: new Date() };

    switch (action) {
      case 'confirm':
        updateData.status = 'confirmed';
        updateData.confirmedAt = new Date();
        updateData.confirmedBy = body.confirmedBy || null;
        break;
      case 'pay':
        updateData.status = 'paid';
        updateData.paidAt = new Date();
        break;
      default:
        updateData = { ...body, updatedAt: new Date() };
    }

    const result = await prisma.year_end_results.update({
      where: { id },
      data: updateData,
    });

    return successResponse({ result });
  } catch (error) {
    return handleApiError(error, '年末調整結果の更新');
  }
}
