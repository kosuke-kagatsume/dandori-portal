import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/payroll-settings - 給与設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const settings = await prisma.payroll_settings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // 設定が存在しない場合はデフォルト値を返す
      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          paymentDay: 25,
          paymentDayType: 'current',
          closingDay: 31,
          defaultPayType: 'monthly',
          standardWorkHours: 8,
          standardWorkDays: 20,
          enableHealthInsurance: true,
          enablePensionInsurance: true,
          enableEmploymentInsurance: true,
          enableIncomeTax: true,
          enableResidentTax: true,
        },
        isNew: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
        paymentDay: settings.paymentDay,
        paymentDayType: settings.paymentDayType,
        closingDay: settings.closingDay,
        defaultPayType: settings.defaultPayType,
        standardWorkHours: settings.standardWorkHours,
        standardWorkDays: settings.standardWorkDays,
        enableHealthInsurance: settings.enableHealthInsurance,
        enablePensionInsurance: settings.enablePensionInsurance,
        enableEmploymentInsurance: settings.enableEmploymentInsurance,
        enableIncomeTax: settings.enableIncomeTax,
        enableResidentTax: settings.enableResidentTax,
      },
    });
  } catch (error) {
    console.error('Error fetching payroll settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payroll settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/payroll-settings - 給与設定更新（upsert）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      paymentDay,
      paymentDayType,
      closingDay,
      defaultPayType,
      standardWorkHours,
      standardWorkDays,
      enableHealthInsurance,
      enablePensionInsurance,
      enableEmploymentInsurance,
      enableIncomeTax,
      enableResidentTax,
    } = body;

    // upsert（存在すれば更新、なければ作成）
    const settings = await prisma.payroll_settings.upsert({
      where: { tenantId },
      update: {
        paymentDay,
        paymentDayType,
        closingDay,
        defaultPayType,
        standardWorkHours,
        standardWorkDays,
        enableHealthInsurance,
        enablePensionInsurance,
        enableEmploymentInsurance,
        enableIncomeTax,
        enableResidentTax,
      },
      create: {
        id: `ps-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        paymentDay: paymentDay ?? 25,
        paymentDayType: paymentDayType ?? 'current',
        closingDay: closingDay ?? 31,
        defaultPayType: defaultPayType ?? 'monthly',
        standardWorkHours: standardWorkHours ?? 8,
        standardWorkDays: standardWorkDays ?? 20,
        enableHealthInsurance: enableHealthInsurance ?? true,
        enablePensionInsurance: enablePensionInsurance ?? true,
        enableEmploymentInsurance: enableEmploymentInsurance ?? true,
        enableIncomeTax: enableIncomeTax ?? true,
        enableResidentTax: enableResidentTax ?? true,
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
    console.error('Error updating payroll settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update payroll settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
