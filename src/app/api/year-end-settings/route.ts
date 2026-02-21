import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantIdFromRequest } from '@/lib/api/api-helpers';

// GET /api/year-end-settings - 年末調整設定取得
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);

    const settings = await prisma.year_end_adjustment_settings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // 設定が存在しない場合はデフォルト値を返す
      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          adjustmentStartMonth: 11,
          adjustmentEndMonth: 12,
          enableBasicDeduction: true,
          enableSpouseDeduction: true,
          enableDependentDeduction: true,
          enableInsuranceDeduction: true,
          enableSocialInsuranceDeduction: true,
          withholdingSlipFormat: 'standard',
          includeQRCode: false,
        },
        isNew: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
        adjustmentStartMonth: settings.adjustmentStartMonth,
        adjustmentEndMonth: settings.adjustmentEndMonth,
        enableBasicDeduction: settings.enableBasicDeduction,
        enableSpouseDeduction: settings.enableSpouseDeduction,
        enableDependentDeduction: settings.enableDependentDeduction,
        enableInsuranceDeduction: settings.enableInsuranceDeduction,
        enableSocialInsuranceDeduction: settings.enableSocialInsuranceDeduction,
        withholdingSlipFormat: settings.withholdingSlipFormat,
        includeQRCode: settings.includeQRCode,
      },
    });
  } catch (error) {
    console.error('Error fetching year-end settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch year-end settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/year-end-settings - 年末調整設定更新（upsert）
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantIdFromRequest(request);
    const body = await request.json();
    const {
      adjustmentStartMonth,
      adjustmentEndMonth,
      enableBasicDeduction,
      enableSpouseDeduction,
      enableDependentDeduction,
      enableInsuranceDeduction,
      enableSocialInsuranceDeduction,
      withholdingSlipFormat,
      includeQRCode,
    } = body;

    // upsert（存在すれば更新、なければ作成）
    const settings = await prisma.year_end_adjustment_settings.upsert({
      where: { tenantId },
      update: {
        adjustmentStartMonth,
        adjustmentEndMonth,
        enableBasicDeduction,
        enableSpouseDeduction,
        enableDependentDeduction,
        enableInsuranceDeduction,
        enableSocialInsuranceDeduction,
        withholdingSlipFormat,
        includeQRCode,
      },
      create: {
        id: `yes-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        adjustmentStartMonth: adjustmentStartMonth ?? 11,
        adjustmentEndMonth: adjustmentEndMonth ?? 12,
        enableBasicDeduction: enableBasicDeduction ?? true,
        enableSpouseDeduction: enableSpouseDeduction ?? true,
        enableDependentDeduction: enableDependentDeduction ?? true,
        enableInsuranceDeduction: enableInsuranceDeduction ?? true,
        enableSocialInsuranceDeduction: enableSocialInsuranceDeduction ?? true,
        withholdingSlipFormat: withholdingSlipFormat ?? 'standard',
        includeQRCode: includeQRCode ?? false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
      },
    });
  } catch (error) {
    console.error('Error updating year-end settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update year-end settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
