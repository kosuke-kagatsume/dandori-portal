/**
 * 給与月次サマリー API
 *
 * GET /api/integration/payroll/monthly-summary - DRM向け月次給与集計データ
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateIntegrationRequest,
  IntegrationErrorCodes,
  type IntegrationApiResponse,
} from '@/lib/integrations/drm';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MonthlySummaryData {
  payPeriod: string;
  totalGrossPay: number;
  insurance: {
    healthEmployer: number;
    pensionEmployer: number;
    employmentEmployer: number;
  };
  tax: {
    incomeTax: number;
    residentTax: number;
  };
  employeeCount: number;
  bonus: {
    totalGrossBonus: number;
    insurance: {
      healthEmployer: number;
      pensionEmployer: number;
      employmentEmployer: number;
    };
    tax: {
      incomeTax: number;
    };
    count: number;
  } | null;
}

/**
 * GET - DRM が Portal の月次給与サマリーを取得
 *
 * クエリパラメータ:
 * - tenantId (必須)
 * - yearMonth (必須, YYYY-MM形式)
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // 認証
    const authResult = await authenticateIntegrationRequest('');
    if (!authResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          errorCode: authResult.error,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 401 }
      );
    }

    // クエリパラメータ
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const yearMonth = searchParams.get('yearMonth');

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'tenantId is required',
          errorCode: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return NextResponse.json(
        {
          success: false,
          error: 'yearMonth is required (YYYY-MM format)',
          errorCode: IntegrationErrorCodes.INVALID_PAYLOAD,
          requestId,
          timestamp,
        } satisfies IntegrationApiResponse,
        { status: 400 }
      );
    }

    // 給与明細の集計（confirmed/paid のみ）
    const payrollAgg = await prisma.pay_slips.aggregate({
      where: {
        tenantId,
        payPeriod: yearMonth,
        status: { in: ['confirmed', 'paid'] },
      },
      _sum: {
        grossPay: true,
        healthInsuranceEmployer: true,
        pensionInsuranceEmployer: true,
        employmentInsuranceEmployer: true,
        incomeTax: true,
        residentTax: true,
      },
      _count: {
        userId: true,
      },
    });

    // 賞与の集計（同月、approved/paid のみ）
    const bonusAgg = await prisma.bonus_slips.aggregate({
      where: {
        tenantId,
        payPeriod: yearMonth,
        status: { in: ['approved', 'paid'] },
      },
      _sum: {
        grossBonus: true,
        healthInsuranceEmployer: true,
        pensionInsuranceEmployer: true,
        employmentInsuranceEmployer: true,
        incomeTax: true,
      },
      _count: {
        userId: true,
      },
    });

    const hasBonus = (bonusAgg._count.userId ?? 0) > 0;

    const data: MonthlySummaryData = {
      payPeriod: yearMonth,
      totalGrossPay: payrollAgg._sum.grossPay ?? 0,
      insurance: {
        healthEmployer: payrollAgg._sum.healthInsuranceEmployer ?? 0,
        pensionEmployer: payrollAgg._sum.pensionInsuranceEmployer ?? 0,
        employmentEmployer: payrollAgg._sum.employmentInsuranceEmployer ?? 0,
      },
      tax: {
        incomeTax: payrollAgg._sum.incomeTax ?? 0,
        residentTax: payrollAgg._sum.residentTax ?? 0,
      },
      employeeCount: payrollAgg._count.userId ?? 0,
      bonus: hasBonus
        ? {
            totalGrossBonus: bonusAgg._sum.grossBonus ?? 0,
            insurance: {
              healthEmployer: bonusAgg._sum.healthInsuranceEmployer ?? 0,
              pensionEmployer: bonusAgg._sum.pensionInsuranceEmployer ?? 0,
              employmentEmployer: bonusAgg._sum.employmentInsuranceEmployer ?? 0,
            },
            tax: {
              incomeTax: bonusAgg._sum.incomeTax ?? 0,
            },
            count: bonusAgg._count.userId ?? 0,
          }
        : null,
    };

    return NextResponse.json(
      {
        success: true,
        data,
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse<MonthlySummaryData>,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Integration] Payroll monthly summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        errorCode: IntegrationErrorCodes.INTERNAL_ERROR,
        requestId,
        timestamp,
      } satisfies IntegrationApiResponse,
      { status: 500 }
    );
  }
}
