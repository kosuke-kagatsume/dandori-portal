import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  handleApiError,
  getTenantId,
  getPaginationParams,
} from '@/lib/api/api-helpers';

// デモ用SaaSサービスデータ（plans, assignmentsを含む）
const demoSaaSServices = [
  {
    id: 'saas-001',
    tenantId: 'tenant-1',
    name: 'Microsoft 365 Business',
    category: 'productivity',
    vendor: 'Microsoft',
    website: 'https://www.microsoft.com/ja-jp/microsoft-365',
    logo: null,
    description: 'Word, Excel, PowerPoint, Teams, OneDrive等の統合オフィススイート',
    licenseType: 'per_user',
    securityRating: 5,
    ssoEnabled: true,
    mfaEnabled: true,
    adminEmail: 'admin@example.com',
    supportUrl: 'https://support.microsoft.com',
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    autoRenew: true,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    plans: [
      {
        id: 'plan-001',
        planName: 'Business Standard',
        billingCycle: 'yearly',
        pricePerUser: 1360,
        fixedPrice: null,
        currency: 'JPY',
        maxUsers: 50,
        features: ['Word', 'Excel', 'PowerPoint', 'Teams', 'OneDrive'],
        isActive: true,
      },
    ],
    assignments: [
      { id: 'assign-001', userId: 'user-001', userName: '田中太郎', userEmail: 'tanaka@example.com', status: 'active' },
      { id: 'assign-002', userId: 'user-002', userName: '山田花子', userEmail: 'yamada@example.com', status: 'active' },
      { id: 'assign-005', userId: 'user-003', userName: '佐藤次郎', userEmail: 'sato@example.com', status: 'active' },
      { id: 'assign-006', userId: 'user-004', userName: '鈴木一郎', userEmail: 'suzuki@example.com', status: 'active' },
      { id: 'assign-007', userId: 'user-005', userName: '高橋真理', userEmail: 'takahashi@example.com', status: 'active' },
    ],
  },
  {
    id: 'saas-002',
    tenantId: 'tenant-1',
    name: 'Slack',
    category: 'communication',
    vendor: 'Salesforce',
    website: 'https://slack.com',
    logo: null,
    description: 'ビジネスコミュニケーションプラットフォーム',
    licenseType: 'per_user',
    securityRating: 4,
    ssoEnabled: true,
    mfaEnabled: true,
    adminEmail: 'admin@example.com',
    supportUrl: 'https://slack.com/help',
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    autoRenew: true,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    plans: [
      {
        id: 'plan-002',
        planName: 'Pro',
        billingCycle: 'monthly',
        pricePerUser: 925,
        fixedPrice: null,
        currency: 'JPY',
        maxUsers: 100,
        features: ['無制限メッセージ履歴', 'グループ通話', 'ゲストアクセス'],
        isActive: true,
      },
    ],
    assignments: [
      { id: 'assign-003', userId: 'user-001', userName: '田中太郎', userEmail: 'tanaka@example.com', status: 'active' },
      { id: 'assign-008', userId: 'user-002', userName: '山田花子', userEmail: 'yamada@example.com', status: 'active' },
      { id: 'assign-009', userId: 'user-003', userName: '佐藤次郎', userEmail: 'sato@example.com', status: 'active' },
      { id: 'assign-010', userId: 'user-006', userName: '伊藤健', userEmail: 'ito@example.com', status: 'active' },
    ],
  },
  {
    id: 'saas-003',
    tenantId: 'tenant-1',
    name: 'Salesforce',
    category: 'sales',
    vendor: 'Salesforce',
    website: 'https://www.salesforce.com/jp/',
    logo: null,
    description: 'CRM/SFAプラットフォーム',
    licenseType: 'per_user',
    securityRating: 5,
    ssoEnabled: true,
    mfaEnabled: true,
    adminEmail: 'admin@example.com',
    supportUrl: 'https://help.salesforce.com',
    contractStartDate: new Date('2024-01-01'),
    contractEndDate: new Date('2024-12-31'),
    autoRenew: false,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    plans: [
      {
        id: 'plan-003',
        planName: 'Enterprise',
        billingCycle: 'yearly',
        pricePerUser: 18000,
        fixedPrice: null,
        currency: 'JPY',
        maxUsers: 30,
        features: ['カスタムオブジェクト', 'ワークフロー', 'API連携'],
        isActive: true,
      },
    ],
    assignments: [
      { id: 'assign-004', userId: 'user-003', userName: '佐藤次郎', userEmail: 'sato@example.com', status: 'active' },
      { id: 'assign-011', userId: 'user-007', userName: '渡辺美咲', userEmail: 'watanabe@example.com', status: 'active' },
      { id: 'assign-012', userId: 'user-008', userName: '中村大輔', userEmail: 'nakamura@example.com', status: 'active' },
    ],
  },
  {
    id: 'saas-004',
    tenantId: 'tenant-1',
    name: 'Zoom',
    category: 'communication',
    vendor: 'Zoom Video Communications',
    website: 'https://zoom.us',
    logo: null,
    description: 'ビデオ会議・ウェビナーサービス',
    licenseType: 'per_user',
    securityRating: 4,
    ssoEnabled: true,
    mfaEnabled: false,
    adminEmail: 'admin@example.com',
    supportUrl: 'https://support.zoom.us',
    contractStartDate: new Date('2024-03-01'),
    contractEndDate: new Date('2025-02-28'),
    autoRenew: true,
    isActive: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    plans: [
      {
        id: 'plan-004',
        planName: 'Business',
        billingCycle: 'yearly',
        pricePerUser: 2700,
        fixedPrice: null,
        currency: 'JPY',
        maxUsers: 50,
        features: ['最大300人会議', 'クラウド録画', '管理者ポータル'],
        isActive: true,
      },
    ],
    assignments: [
      { id: 'assign-013', userId: 'user-001', userName: '田中太郎', userEmail: 'tanaka@example.com', status: 'active' },
      { id: 'assign-014', userId: 'user-002', userName: '山田花子', userEmail: 'yamada@example.com', status: 'active' },
    ],
  },
];

// GET /api/saas/services - SaaSサービス一覧取得
export async function GET(request: NextRequest) {
  try {
    // デモモードの場合はデモデータを返す
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      return successResponse(demoSaaSServices, {
        count: demoSaaSServices.length,
        pagination: { page: 1, limit: 20, total: demoSaaSServices.length, totalPages: 1 },
        cacheSeconds: 60,
      });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = getTenantId(searchParams);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const includeDetails = searchParams.get('include') === 'details';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const where: Record<string, unknown> = { tenantId };
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    // 総件数取得（ページネーション用）
    const total = await prisma.saas_services.count({ where });

    // 一覧用：必要最小限のフィールドのみ取得
    const services = await prisma.saas_services.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        name: true,
        category: true,
        vendor: true,
        website: true,
        logo: true,
        description: true,
        licenseType: true,
        securityRating: true,
        ssoEnabled: true,
        mfaEnabled: true,
        adminEmail: true,
        supportUrl: true,
        contractStartDate: true,
        contractEndDate: true,
        autoRenew: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // 詳細リクエスト時のみ関連データを含める
        ...(includeDetails && {
          plans: {
            select: {
              id: true,
              planName: true,
              billingCycle: true,
              pricePerUser: true,
              fixedPrice: true,
              currency: true,
              maxUsers: true,
              features: true,
              isActive: true,
            },
          },
          assignments: {
            where: { status: 'active' },
            select: {
              id: true,
              userId: true,
              userName: true,
              userEmail: true,
              assignedDate: true,
              status: true,
            },
          },
          monthlyCosts: {
            orderBy: { period: 'desc' as const },
            take: 12,
            select: {
              id: true,
              period: true,
              totalCost: true,
              userLicenseCount: true,
              currency: true,
            },
          },
        }),
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });

    return successResponse(services, {
      count: services.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      cacheSeconds: 60, // 1分キャッシュ
    });
  } catch (error) {
    return handleApiError(error, 'SaaSサービス一覧の取得');
  }
}

// POST /api/saas/services - SaaSサービス登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = 'tenant-1',
      name,
      category,
      vendor,
      website,
      logo,
      description,
      licenseType,
      securityRating,
      ssoEnabled = false,
      mfaEnabled = false,
      adminEmail,
      supportUrl,
      contractStartDate,
      contractEndDate,
      autoRenew = false,
      isActive = true,
    } = body;

    if (!name || !category || !licenseType) {
      return handleApiError(
        new Error('サービス名、カテゴリ、ライセンスタイプは必須です'),
        'SaaSサービス登録'
      );
    }

    const service = await prisma.saas_services.create({
      data: {
        tenantId,
        name,
        category,
        vendor,
        website,
        logo,
        description,
        licenseType,
        securityRating,
        ssoEnabled,
        mfaEnabled,
        adminEmail,
        supportUrl,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        autoRenew,
        isActive,
      },
    });

    return successResponse(service);
  } catch (error) {
    return handleApiError(error, 'SaaSサービス登録');
  }
}
