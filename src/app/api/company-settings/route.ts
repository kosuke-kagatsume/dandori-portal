import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/company-settings - 会社設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'tenant-demo-001';

    const settings = await prisma.company_settings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // 設定が存在しない場合はデフォルト値を返す
      return NextResponse.json({
        success: true,
        data: {
          tenantId,
          name: '',
          nameKana: '',
          postalCode: '',
          address: '',
          phone: '',
          fax: '',
          email: '',
          corporateNumber: '',
          representativeName: '',
          representativeTitle: '',
          taxOffice: '',
          taxOfficeCode: '',
          fiscalYearEnd: '03',
          foundedDate: null,
        },
        isNew: true,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
        name: settings.name,
        nameKana: settings.nameKana || '',
        postalCode: settings.postalCode || '',
        address: settings.address || '',
        phone: settings.phone || '',
        fax: settings.fax || '',
        email: settings.email || '',
        corporateNumber: settings.corporateNumber || '',
        representativeName: settings.representativeName || '',
        representativeTitle: settings.representativeTitle || '',
        taxOffice: settings.taxOffice || '',
        taxOfficeCode: settings.taxOfficeCode || '',
        fiscalYearEnd: settings.fiscalYearEnd || '03',
        foundedDate: settings.foundedDate?.toISOString().split('T')[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch company settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/company-settings - 会社設定更新（upsert）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-demo-001',
      name,
      nameKana,
      postalCode,
      address,
      phone,
      fax,
      email,
      corporateNumber,
      representativeName,
      representativeTitle,
      taxOffice,
      taxOfficeCode,
      fiscalYearEnd,
      foundedDate,
    } = body;

    // バリデーション
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company name is required',
        },
        { status: 400 }
      );
    }

    // upsert（存在すれば更新、なければ作成）
    const settings = await prisma.company_settings.upsert({
      where: { tenantId },
      update: {
        name,
        nameKana,
        postalCode,
        address,
        phone,
        fax,
        email,
        corporateNumber,
        representativeName,
        representativeTitle,
        taxOffice,
        taxOfficeCode,
        fiscalYearEnd,
        foundedDate: foundedDate ? new Date(foundedDate) : null,
      },
      create: {
        tenantId,
        name,
        nameKana,
        postalCode,
        address,
        phone,
        fax,
        email,
        corporateNumber,
        representativeName,
        representativeTitle,
        taxOffice,
        taxOfficeCode,
        fiscalYearEnd,
        foundedDate: foundedDate ? new Date(foundedDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: settings.id,
        tenantId: settings.tenantId,
        name: settings.name,
      },
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update company settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
