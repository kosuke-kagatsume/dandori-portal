import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tenantId = 'tenant-1';

// 業者デモデータ
const demoVendors = [
  {
    tenantId,
    name: 'トヨタモビリティサービス',
    phone: '03-1234-5678',
    address: '東京都千代田区丸の内1-1-1',
    contactPerson: '田中太郎',
    email: 'tanaka@toyota-mobility.co.jp',
    rating: 5,
    notes: '定期メンテナンス契約あり',
  },
  {
    tenantId,
    name: 'オートバックス渋谷店',
    phone: '03-2345-6789',
    address: '東京都渋谷区渋谷2-2-2',
    contactPerson: '鈴木一郎',
    email: 'suzuki@autobacs.co.jp',
    rating: 4,
    notes: 'タイヤ・オイル交換専門',
  },
  {
    tenantId,
    name: 'ニッポンレンタカー',
    phone: '03-3456-7890',
    address: '東京都港区六本木3-3-3',
    contactPerson: '佐藤花子',
    email: 'sato@nipponrentacar.co.jp',
    rating: 4,
    notes: 'リース車両のメンテナンス',
  },
];

// 車両デモデータ（スキーマに合わせて修正）
const demoVehicles = [
  {
    tenantId,
    vehicleNumber: 'V-001',
    licensePlate: '品川 300 あ 1234',
    make: 'トヨタ',
    model: 'プリウス',
    year: 2023,
    color: 'ホワイト',
    assignedUserId: 'user-001',
    assignedUserName: '山田太郎',
    assignedDate: new Date('2023-04-01'),
    ownershipType: 'leased',
    leaseCompany: 'トヨタファイナンス',
    leaseStartDate: new Date('2023-04-01'),
    leaseEndDate: new Date('2026-03-31'),
    leaseMonthlyCost: 45000,
    inspectionDate: new Date('2025-04-15'),
    insuranceDate: new Date('2025-04-30'),
    status: 'active',
    notes: '営業1課用',
  },
  {
    tenantId,
    vehicleNumber: 'V-002',
    licensePlate: '品川 500 い 5678',
    make: 'ホンダ',
    model: 'フィット',
    year: 2022,
    color: 'シルバー',
    assignedUserId: 'user-002',
    assignedUserName: '鈴木花子',
    assignedDate: new Date('2022-06-01'),
    ownershipType: 'owned',
    purchaseDate: new Date('2022-06-01'),
    purchaseCost: 1800000,
    inspectionDate: new Date('2024-06-20'),
    insuranceDate: new Date('2025-06-30'),
    status: 'active',
    notes: '営業2課用',
  },
  {
    tenantId,
    vehicleNumber: 'V-003',
    licensePlate: '品川 300 う 9012',
    make: '日産',
    model: 'ノート e-POWER',
    year: 2024,
    color: 'ブルー',
    assignedUserId: 'user-003',
    assignedUserName: '佐藤次郎',
    assignedDate: new Date('2024-01-15'),
    ownershipType: 'leased',
    leaseCompany: '日産フィナンシャル',
    leaseStartDate: new Date('2024-01-15'),
    leaseEndDate: new Date('2027-01-14'),
    leaseMonthlyCost: 52000,
    inspectionDate: new Date('2027-01-10'),
    insuranceDate: new Date('2025-01-31'),
    status: 'active',
    notes: '経理部用',
  },
  {
    tenantId,
    vehicleNumber: 'V-004',
    licensePlate: '品川 500 え 3456',
    make: 'トヨタ',
    model: 'カローラ',
    year: 2021,
    color: 'ブラック',
    ownershipType: 'owned',
    purchaseDate: new Date('2021-03-01'),
    purchaseCost: 2200000,
    inspectionDate: new Date('2024-03-10'),
    insuranceDate: new Date('2025-03-31'),
    status: 'active',
    notes: '予備車両',
  },
];

// PC資産デモデータ（スキーマに合わせて修正）
const demoPCAssets = [
  {
    tenantId,
    assetNumber: 'PC-001',
    manufacturer: 'Apple',
    model: 'MacBook Pro 14インチ',
    serialNumber: 'C02YN123JGH5',
    cpu: 'Apple M3 Pro',
    memory: '18GB',
    storage: '512GB SSD',
    os: 'macOS Sonoma',
    assignedUserId: 'user-001',
    assignedUserName: '山田太郎',
    assignedDate: new Date('2024-01-15'),
    ownershipType: 'owned',
    purchaseDate: new Date('2024-01-10'),
    purchaseCost: 328800,
    warrantyExpiration: new Date('2027-01-10'),
    status: 'active',
    notes: '開発用',
  },
  {
    tenantId,
    assetNumber: 'PC-002',
    manufacturer: 'Dell',
    model: 'XPS 15',
    serialNumber: 'DELL123456789',
    cpu: 'Intel Core i7-13700H',
    memory: '32GB',
    storage: '1TB SSD',
    os: 'Windows 11 Pro',
    assignedUserId: 'user-002',
    assignedUserName: '鈴木花子',
    assignedDate: new Date('2023-06-01'),
    ownershipType: 'leased',
    leaseCompany: 'デル・テクノロジーズ',
    leaseStartDate: new Date('2023-06-01'),
    leaseEndDate: new Date('2026-05-31'),
    leaseMonthlyCost: 8000,
    warrantyExpiration: new Date('2026-05-31'),
    status: 'active',
    notes: '営業用',
  },
  {
    tenantId,
    assetNumber: 'PC-003',
    manufacturer: 'Lenovo',
    model: 'ThinkPad X1 Carbon',
    serialNumber: 'LEN987654321',
    cpu: 'Intel Core i5-1335U',
    memory: '16GB',
    storage: '256GB SSD',
    os: 'Windows 11 Pro',
    assignedUserId: 'user-003',
    assignedUserName: '佐藤次郎',
    assignedDate: new Date('2024-04-01'),
    ownershipType: 'owned',
    purchaseDate: new Date('2024-03-25'),
    purchaseCost: 198000,
    warrantyExpiration: new Date('2027-03-25'),
    status: 'active',
    notes: '経理用',
  },
  {
    tenantId,
    assetNumber: 'PC-004',
    manufacturer: 'HP',
    model: 'EliteBook 840',
    serialNumber: 'HP246813579',
    cpu: 'AMD Ryzen 7 7840U',
    memory: '16GB',
    storage: '512GB SSD',
    os: 'Windows 11 Pro',
    ownershipType: 'owned',
    purchaseDate: new Date('2023-09-01'),
    purchaseCost: 165000,
    warrantyExpiration: new Date('2026-09-01'),
    status: 'active',
    notes: '予備機',
  },
];

// SaaSサービスデモデータ（スキーマに合わせて修正）
const demoSaaSServices = [
  {
    tenantId,
    name: 'Microsoft 365 Business',
    category: 'productivity',
    vendor: 'Microsoft',
    description: 'Office アプリ、メール、クラウドストレージの統合スイート',
    website: 'https://www.microsoft.com/ja-jp/microsoft-365',
    licenseType: 'user-based',
    ssoEnabled: true,
    mfaEnabled: true,
    contractStartDate: new Date('2023-01-01'),
    autoRenew: true,
    adminEmail: 'admin@example.com',
    isActive: true,
  },
  {
    tenantId,
    name: 'Slack',
    category: 'communication',
    vendor: 'Salesforce',
    description: 'チームコミュニケーションツール',
    website: 'https://slack.com/intl/ja-jp/',
    licenseType: 'user-based',
    ssoEnabled: true,
    mfaEnabled: false,
    contractStartDate: new Date('2022-06-01'),
    autoRenew: true,
    adminEmail: 'slack-admin@example.com',
    isActive: true,
  },
  {
    tenantId,
    name: 'Zoom',
    category: 'communication',
    vendor: 'Zoom Video Communications',
    description: 'ビデオ会議・オンラインミーティング',
    website: 'https://zoom.us/',
    licenseType: 'user-based',
    ssoEnabled: true,
    mfaEnabled: true,
    contractStartDate: new Date('2023-04-01'),
    contractEndDate: new Date('2025-03-31'),
    autoRenew: true,
    adminEmail: 'zoom-admin@example.com',
    isActive: true,
  },
  {
    tenantId,
    name: 'freee会計',
    category: 'finance',
    vendor: 'freee株式会社',
    description: 'クラウド会計ソフト',
    website: 'https://www.freee.co.jp/',
    licenseType: 'fixed',
    ssoEnabled: false,
    mfaEnabled: true,
    contractStartDate: new Date('2021-01-01'),
    autoRenew: true,
    adminEmail: 'keiri@example.com',
    isActive: true,
  },
  {
    tenantId,
    name: 'Salesforce Sales Cloud',
    category: 'sales',
    vendor: 'Salesforce',
    description: 'CRM・営業管理システム',
    website: 'https://www.salesforce.com/jp/',
    licenseType: 'user-based',
    securityRating: 'A',
    ssoEnabled: true,
    mfaEnabled: true,
    contractStartDate: new Date('2022-04-01'),
    contractEndDate: new Date('2025-03-31'),
    autoRenew: false,
    adminEmail: 'sf-admin@example.com',
    supportUrl: 'https://help.salesforce.com/',
    isActive: true,
  },
];

// SaaSライセンスプランデモデータ
const demoPlans = [
  {
    tenantId,
    serviceName: 'Microsoft 365 Business',
    planName: 'Business Standard',
    billingCycle: 'monthly',
    pricePerUser: 1360,
    currency: 'JPY',
    isActive: true,
  },
  {
    tenantId,
    serviceName: 'Slack',
    planName: 'Pro',
    billingCycle: 'monthly',
    pricePerUser: 925,
    currency: 'JPY',
    isActive: true,
  },
  {
    tenantId,
    serviceName: 'Zoom',
    planName: 'Business',
    billingCycle: 'yearly',
    pricePerUser: 20100,
    currency: 'JPY',
    isActive: true,
  },
  {
    tenantId,
    serviceName: 'freee会計',
    planName: 'ビジネスプラン',
    billingCycle: 'monthly',
    fixedPrice: 26136,
    currency: 'JPY',
    isActive: true,
  },
  {
    tenantId,
    serviceName: 'Salesforce Sales Cloud',
    planName: 'Enterprise',
    billingCycle: 'yearly',
    pricePerUser: 18000,
    currency: 'JPY',
    isActive: true,
  },
];

// SaaSライセンス割り当てデモデータ
const demoAssignments = [
  {
    tenantId,
    userId: 'user-001',
    userName: '山田太郎',
    userEmail: 'yamada@example.com',
    assignedDate: new Date('2023-01-15'),
    status: 'active',
  },
  {
    tenantId,
    userId: 'user-002',
    userName: '鈴木花子',
    userEmail: 'suzuki@example.com',
    assignedDate: new Date('2023-02-01'),
    status: 'active',
  },
  {
    tenantId,
    userId: 'user-003',
    userName: '佐藤次郎',
    userEmail: 'sato@example.com',
    assignedDate: new Date('2023-01-15'),
    status: 'active',
  },
  {
    tenantId,
    userId: 'user-004',
    userName: '田中三郎',
    userEmail: 'tanaka@example.com',
    assignedDate: new Date('2023-03-01'),
    status: 'active',
  },
];

async function main() {
  console.log('資産管理・SaaS管理デモデータの投入を開始します...');

  // 業者データ投入
  console.log('\n=== 業者データ ===');
  for (const data of demoVendors) {
    const existing = await prisma.vendors.findFirst({
      where: { tenantId, name: data.name },
    });
    if (existing) {
      console.log(`スキップ: ${data.name}（既に存在）`);
      continue;
    }
    await prisma.vendors.create({ data: { id: crypto.randomUUID(), ...data, updatedAt: new Date() } });
    console.log(`作成: ${data.name}`);
  }

  // 車両データ投入
  console.log('\n=== 車両データ ===');
  for (const data of demoVehicles) {
    const existing = await prisma.vehicles.findFirst({
      where: { tenantId, vehicleNumber: data.vehicleNumber },
    });
    if (existing) {
      console.log(`スキップ: ${data.vehicleNumber}（既に存在）`);
      continue;
    }
    await prisma.vehicles.create({ data: { id: crypto.randomUUID(), ...data, updatedAt: new Date() } });
    console.log(`作成: ${data.vehicleNumber} - ${data.make} ${data.model}`);
  }

  // PC資産データ投入
  console.log('\n=== PC資産データ ===');
  for (const data of demoPCAssets) {
    const existing = await prisma.pc_assets.findFirst({
      where: { tenantId, assetNumber: data.assetNumber },
    });
    if (existing) {
      console.log(`スキップ: ${data.assetNumber}（既に存在）`);
      continue;
    }
    await prisma.pc_assets.create({ data: { id: crypto.randomUUID(), ...data, updatedAt: new Date() } });
    console.log(`作成: ${data.assetNumber} - ${data.manufacturer} ${data.model}`);
  }

  // SaaSサービスデータ投入
  console.log('\n=== SaaSサービスデータ ===');
  const serviceIds: Record<string, string> = {};
  for (const data of demoSaaSServices) {
    const existing = await prisma.saas_services.findFirst({
      where: { tenantId, name: data.name },
    });
    if (existing) {
      serviceIds[data.name] = existing.id;
      console.log(`スキップ: ${data.name}（既に存在）`);
      continue;
    }
    const created = await prisma.saas_services.create({ data: { id: crypto.randomUUID(), ...data, updatedAt: new Date() } });
    serviceIds[data.name] = created.id;
    console.log(`作成: ${data.name}`);
  }

  // SaaSライセンスプランデータ投入
  console.log('\n=== ライセンスプランデータ ===');
  const planIds: Record<string, string> = {};
  for (const planData of demoPlans) {
    const serviceId = serviceIds[planData.serviceName];
    if (!serviceId) {
      console.log(`スキップ: ${planData.planName}（サービスが見つからない）`);
      continue;
    }

    const existing = await prisma.saas_license_plans.findFirst({
      where: { tenantId, serviceId, planName: planData.planName },
    });
    if (existing) {
      planIds[planData.serviceName] = existing.id;
      console.log(`スキップ: ${planData.serviceName} - ${planData.planName}（既に存在）`);
      continue;
    }

    const { serviceName, ...rest } = planData;
    const created = await prisma.saas_license_plans.create({
      data: { id: crypto.randomUUID(), ...rest, serviceId, updatedAt: new Date() },
    });
    planIds[serviceName] = created.id;
    console.log(`作成: ${serviceName} - ${planData.planName}`);
  }

  // SaaSライセンス割り当てデータ投入（Microsoft 365とSlackに割り当て）
  console.log('\n=== ライセンス割り当てデータ ===');
  const m365Id = serviceIds['Microsoft 365 Business'];
  const slackId = serviceIds['Slack'];
  const m365PlanId = planIds['Microsoft 365 Business'];
  const slackPlanId = planIds['Slack'];

  if (m365Id && slackId && m365PlanId && slackPlanId) {
    for (const assignment of demoAssignments) {
      // Microsoft 365
      const existingM365 = await prisma.saas_license_assignments.findFirst({
        where: { tenantId, serviceId: m365Id, userId: assignment.userId },
      });
      if (!existingM365) {
        await prisma.saas_license_assignments.create({
          data: { id: crypto.randomUUID(), ...assignment, serviceId: m365Id, planId: m365PlanId, updatedAt: new Date() },
        });
        console.log(`作成: M365 → ${assignment.userName}`);
      }

      // Slack
      const existingSlack = await prisma.saas_license_assignments.findFirst({
        where: { tenantId, serviceId: slackId, userId: assignment.userId },
      });
      if (!existingSlack) {
        await prisma.saas_license_assignments.create({
          data: { id: crypto.randomUUID(), ...assignment, serviceId: slackId, planId: slackPlanId, updatedAt: new Date() },
        });
        console.log(`作成: Slack → ${assignment.userName}`);
      }
    }
  }

  console.log('\n完了: 資産管理・SaaS管理デモデータを追加しました');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
