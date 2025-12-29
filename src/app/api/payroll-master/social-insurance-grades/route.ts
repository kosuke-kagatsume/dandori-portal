import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getTenantId,
  validateRequiredFields,
} from '@/lib/api/api-helpers';

/**
 * GET /api/payroll-master/social-insurance-grades - 社会保険等級表取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const fiscalYear = searchParams.get('fiscalYear');
    const insuranceType = searchParams.get('insuranceType');

    const where: {
      tenantId: string;
      fiscalYear?: number;
      insuranceType?: string;
      isActive?: boolean;
    } = { tenantId, isActive: true };

    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear, 10);
    if (insuranceType) where.insuranceType = insuranceType;

    const grades = await prisma.social_insurance_grades.findMany({
      where,
      orderBy: [{ fiscalYear: 'desc' }, { grade: 'asc' }],
    });

    return successResponse({ grades }, { count: grades.length });
  } catch (error) {
    return handleApiError(error, '社会保険等級表の取得');
  }
}

/**
 * POST /api/payroll-master/social-insurance-grades - 社会保険等級追加
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    const validation = validateRequiredFields(body, [
      'fiscalYear',
      'grade',
      'standardMonthlyAmount',
      'healthInsuranceEmployee',
      'healthInsuranceEmployer',
      'pensionInsuranceEmployee',
      'pensionInsuranceEmployer',
    ]);
    if (!validation.valid) {
      return errorResponse(validation.error!, 400);
    }

    // 同一年度・等級の重複チェック
    const existing = await prisma.social_insurance_grades.findFirst({
      where: {
        tenantId,
        fiscalYear: body.fiscalYear,
        grade: body.grade,
        insuranceType: body.insuranceType || 'general',
      },
    });
    if (existing) {
      return errorResponse('この年度・等級は既に登録されています', 409);
    }

    const gradeRecord = await prisma.social_insurance_grades.create({
      data: {
        id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        fiscalYear: body.fiscalYear,
        grade: body.grade,
        standardMonthlyAmount: body.standardMonthlyAmount,
        minMonthlyAmount: body.minMonthlyAmount ?? null,
        maxMonthlyAmount: body.maxMonthlyAmount ?? null,
        healthInsuranceEmployee: body.healthInsuranceEmployee,
        healthInsuranceEmployer: body.healthInsuranceEmployer,
        pensionInsuranceEmployee: body.pensionInsuranceEmployee,
        pensionInsuranceEmployer: body.pensionInsuranceEmployer,
        insuranceType: body.insuranceType || 'general',
        prefectureCode: body.prefectureCode || null,
        isActive: body.isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return successResponse({ grade: gradeRecord }, { count: 1 });
  } catch (error) {
    return handleApiError(error, '社会保険等級の追加');
  }
}

/**
 * PUT /api/payroll-master/social-insurance-grades - 社会保険等級表一括登録
 * 年度の等級表をまとめて登録・更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);

    if (!body.fiscalYear || !Array.isArray(body.grades)) {
      return errorResponse('fiscalYearとgradesが必要です', 400);
    }

    // 指定年度の既存データを削除
    await prisma.social_insurance_grades.deleteMany({
      where: {
        tenantId,
        fiscalYear: body.fiscalYear,
        insuranceType: body.insuranceType || 'general',
      },
    });

    // 新しいデータを一括作成
    const created: unknown[] = [];
    for (const g of body.grades) {
      const gradeRecord = await prisma.social_insurance_grades.create({
        data: {
          id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId,
          fiscalYear: body.fiscalYear,
          grade: g.grade,
          standardMonthlyAmount: g.standardMonthlyAmount,
          minMonthlyAmount: g.minMonthlyAmount ?? null,
          maxMonthlyAmount: g.maxMonthlyAmount ?? null,
          healthInsuranceEmployee: g.healthInsuranceEmployee,
          healthInsuranceEmployer: g.healthInsuranceEmployer,
          pensionInsuranceEmployee: g.pensionInsuranceEmployee,
          pensionInsuranceEmployer: g.pensionInsuranceEmployer,
          insuranceType: body.insuranceType || 'general',
          prefectureCode: body.prefectureCode || null,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      created.push(gradeRecord);
    }

    return successResponse({
      created: created.length,
      fiscalYear: body.fiscalYear,
    });
  } catch (error) {
    return handleApiError(error, '社会保険等級表の一括登録');
  }
}

/**
 * DELETE /api/payroll-master/social-insurance-grades - 社会保険等級削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const id = searchParams.get('id');
    const fiscalYear = searchParams.get('fiscalYear');

    // 年度指定の場合は一括削除
    if (fiscalYear && !id) {
      const result = await prisma.social_insurance_grades.deleteMany({
        where: {
          tenantId,
          fiscalYear: parseInt(fiscalYear, 10),
        },
      });
      return successResponse({ deleted: result.count });
    }

    if (!id) {
      return errorResponse('IDまたはfiscalYearが必要です', 400);
    }

    const existing = await prisma.social_insurance_grades.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return errorResponse('社会保険等級が見つかりません', 404);
    }

    await prisma.social_insurance_grades.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error, '社会保険等級の削除');
  }
}
