import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tenantId = 'tenant-demo-001';

// 50名のデモメンバー定義（demo-organization.tsと連携）
// 部門別に分類してSaaS割り当てを決定
const demoMembers = [
  // 経営陣（2名）
  { id: 'ceo-001', name: '鈴木太郎', email: 'suzuki.taro@dandori.com', department: '経営企画室', departmentId: 'company' },
  { id: 'cto-001', name: '田中花子', email: 'tanaka.hanako@dandori.com', department: '経営企画室', departmentId: 'company' },

  // 人事部（6名）
  { id: 'hr-001', name: '山田次郎', email: 'yamada.jiro@dandori.com', department: '人事部', departmentId: 'hr-division' },
  { id: 'hr-002', name: '佐藤美咲', email: 'sato.misaki@dandori.com', department: '人事部', departmentId: 'hr-division' },
  { id: 'hr-003', name: '高橋健一', email: 'takahashi.kenichi@dandori.com', department: '人事部', departmentId: 'hr-division' },
  { id: 'hr-004', name: '村上綾香', email: 'murakami.ayaka@dandori.com', department: '人事部', departmentId: 'hr-division' },
  { id: 'hr-005', name: '竹内隆史', email: 'takeuchi.takashi@dandori.com', department: '人事部', departmentId: 'hr-division' },
  { id: 'hr-006', name: '安藤理恵', email: 'ando.rie@dandori.com', department: '人事部', departmentId: 'hr-division' },

  // 開発部（部長）
  { id: 'dev-001', name: '伊藤大輔', email: 'ito.daisuke@dandori.com', department: '開発部', departmentId: 'tech-division' },

  // フロントエンドチーム（7名）
  { id: 'fe-001', name: '松本和也', email: 'matsumoto.kazuya@dandori.com', department: 'フロントエンドチーム', departmentId: 'frontend-team' },
  { id: 'dev-003', name: '中村あゆみ', email: 'nakamura.ayumi@dandori.com', department: 'フロントエンドチーム', departmentId: 'frontend-team' },
  { id: 'fe-002', name: '井上麻衣', email: 'inoue.mai@dandori.com', department: 'フロントエンドチーム', departmentId: 'frontend-team' },
  { id: 'dev-005', name: '加藤由美', email: 'kato.yumi@dandori.com', department: 'フロントエンドチーム', departmentId: 'frontend-team' },
  { id: 'fe-003', name: '谷口信夫', email: 'taniguchi.nobuo@dandori.com', department: 'フロントエンドチーム', departmentId: 'frontend-team' },
  { id: 'fe-004', name: '西村香織', email: 'nishimura.kaori@dandori.com', department: 'フロントエンドチーム', departmentId: 'frontend-team' },
  { id: 'fe-005', name: '上田拓也', email: 'ueda.takuya@dandori.com', department: 'フロントエンドチーム', departmentId: 'frontend-team' },

  // バックエンドチーム（6名）
  { id: 'be-001', name: '木村信夫', email: 'kimura.nobuo@dandori.com', department: 'バックエンドチーム', departmentId: 'backend-team' },
  { id: 'dev-004', name: '小林正樹', email: 'kobayashi.masaki@dandori.com', department: 'バックエンドチーム', departmentId: 'backend-team' },
  { id: 'be-002', name: '林香織', email: 'hayashi.kaori@dandori.com', department: 'バックエンドチーム', departmentId: 'backend-team' },
  { id: 'be-003', name: '金子美和', email: 'kaneko.miwa@dandori.com', department: 'バックエンドチーム', departmentId: 'backend-team' },
  { id: 'be-004', name: '三浦健太郎', email: 'miura.kentaro@dandori.com', department: 'バックエンドチーム', departmentId: 'backend-team' },
  { id: 'be-005', name: '内田千鶴', email: 'uchida.chizuru@dandori.com', department: 'バックエンドチーム', departmentId: 'backend-team' },

  // 開発共通（9名）
  { id: 'dev-002', name: '渡辺真一', email: 'watanabe.shinichi@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-006', name: '岡田聡', email: 'okada.satoshi@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-007', name: '松井由香', email: 'matsui.yuka@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-008', name: '野村健', email: 'nomura.ken@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-009', name: '池田真理', email: 'ikeda.mari@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-010', name: '久保田修', email: 'kubota.osamu@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-011', name: '今井俊介', email: 'imai.shunsuke@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-012', name: '杉本直子', email: 'sugimoto.naoko@dandori.com', department: '開発共通', departmentId: 'dev-general' },
  { id: 'dev-013', name: '横山勇', email: 'yokoyama.isamu@dandori.com', department: '開発共通', departmentId: 'dev-general' },

  // 営業部（11名）
  { id: 'sales-001', name: '森田浩司', email: 'morita.koji@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-002', name: '清水典子', email: 'shimizu.noriko@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-003', name: '藤田雅人', email: 'fujita.masato@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-004', name: '前田亮', email: 'maeda.ryo@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-005', name: '藤原美穂', email: 'fujiwara.miho@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-006', name: '石川浩二', email: 'ishikawa.koji@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-007', name: '坂本愛', email: 'sakamoto.ai@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-008', name: '近藤誠', email: 'kondo.makoto@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-009', name: '長野浩', email: 'nagano.hiroshi@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-010', name: '藤井瞳', email: 'fujii.hitomi@dandori.com', department: '営業部', departmentId: 'sales-dept' },
  { id: 'sales-011', name: '本田雅彦', email: 'honda.masahiko@dandori.com', department: '営業部', departmentId: 'sales-dept' },

  // マーケティング部（8名）
  { id: 'marketing-001', name: '原田智美', email: 'harada.tomomi@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
  { id: 'marketing-002', name: '長谷川修', email: 'hasegawa.osamu@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
  { id: 'marketing-003', name: '須藤麗', email: 'sudo.rei@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
  { id: 'marketing-004', name: '宮崎太一', email: 'miyazaki.taichi@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
  { id: 'marketing-005', name: '大野由紀', email: 'ono.yuki@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
  { id: 'marketing-006', name: '柴田浩司', email: 'shibata.koji@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
  { id: 'marketing-007', name: '河合あゆみ', email: 'kawai.ayumi@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
  { id: 'marketing-008', name: '片岡大輔', email: 'kataoka.daisuke@dandori.com', department: 'マーケティング部', departmentId: 'marketing-dept' },
];

// 開発部門のID（Slackを使う部門）
const devDepartments = ['tech-division', 'frontend-team', 'backend-team', 'dev-general'];

// 管理職・営業（Zoomを使う人）
const zoomUsers = [
  'ceo-001', 'cto-001', // 経営陣
  'hr-001', // 人事部長
  'dev-001', // 開発部長
  'fe-001', 'be-001', // チームリーダー
  'sales-001', 'sales-002', 'sales-003', 'sales-004', 'sales-005', // 営業（上位5名）
  'marketing-001', // マーケティング部長
];

// 経理・人事系（freee会計を使う人）
const freeeUsers = [
  'hr-001', 'hr-002', 'hr-003', // 人事（経理兼務）
  'ceo-001', 'cto-001', // 経営陣（閲覧用）
];

// SaaSサービス定義
const saasServices = [
  {
    name: 'Google Workspace',
    category: 'productivity',
    vendor: 'Google',
    description: 'ビジネス向けGmail、ドキュメント、カレンダーなど統合ツール',
    website: 'https://workspace.google.com/intl/ja/',
    licenseType: 'user-based',
    ssoEnabled: true,
    mfaEnabled: true,
    contractStartDate: new Date('2022-01-01'),
    autoRenew: true,
    adminEmail: 'it-admin@dandori.com',
    isActive: true,
    planName: 'Business Standard',
    billingCycle: 'yearly',
    pricePerUser: 16320, // 年額（月額1360円×12）
  },
  {
    name: 'Chatwork',
    category: 'communication',
    vendor: 'Chatwork株式会社',
    description: '日本発ビジネスチャットツール',
    website: 'https://go.chatwork.com/',
    licenseType: 'user-based',
    ssoEnabled: false,
    mfaEnabled: true,
    contractStartDate: new Date('2022-04-01'),
    autoRenew: true,
    adminEmail: 'it-admin@dandori.com',
    isActive: true,
    planName: 'ビジネスプラン',
    billingCycle: 'monthly',
    pricePerUser: 700,
  },
  {
    name: 'Slack',
    category: 'communication',
    vendor: 'Salesforce',
    description: 'チームコミュニケーションツール（開発部門向け）',
    website: 'https://slack.com/intl/ja-jp/',
    licenseType: 'user-based',
    ssoEnabled: true,
    mfaEnabled: false,
    contractStartDate: new Date('2022-06-01'),
    autoRenew: true,
    adminEmail: 'dev-admin@dandori.com',
    isActive: true,
    planName: 'Pro',
    billingCycle: 'monthly',
    pricePerUser: 925,
  },
  {
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
    adminEmail: 'zoom-admin@dandori.com',
    isActive: true,
    planName: 'Business',
    billingCycle: 'yearly',
    pricePerUser: 20100, // 年額
  },
  {
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
    adminEmail: 'keiri@dandori.com',
    isActive: true,
    planName: 'ビジネスプラン',
    billingCycle: 'yearly',
    fixedPrice: 313632, // 年額
  },
  {
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
    adminEmail: 'sf-admin@dandori.com',
    supportUrl: 'https://help.salesforce.com/',
    isActive: true,
    planName: 'Professional',
    billingCycle: 'yearly',
    pricePerUser: 108000, // 年額（月9000円×12）
  },
  {
    name: 'Microsoft 365',
    category: 'productivity',
    vendor: 'Microsoft',
    description: 'Office アプリ、OneDriveなど（一部部門向け）',
    website: 'https://www.microsoft.com/ja-jp/microsoft-365',
    licenseType: 'user-based',
    ssoEnabled: true,
    mfaEnabled: true,
    contractStartDate: new Date('2023-01-01'),
    autoRenew: true,
    adminEmail: 'it-admin@dandori.com',
    isActive: true,
    planName: 'Business Basic',
    billingCycle: 'yearly',
    pricePerUser: 9000, // 年額（月750円×12）
  },
];

// 割り当てルールを判定
function getAssignments(member: typeof demoMembers[0]) {
  const assignments: string[] = [];

  // 全員: Google Workspace + Chatwork
  assignments.push('Google Workspace');
  assignments.push('Chatwork');

  // 開発部門: Slack
  if (devDepartments.includes(member.departmentId)) {
    assignments.push('Slack');
  }

  // 管理職・営業: Zoom
  if (zoomUsers.includes(member.id)) {
    assignments.push('Zoom');
  }

  // 経理・人事: freee会計
  if (freeeUsers.includes(member.id)) {
    assignments.push('freee会計');
  }

  // 営業部: Salesforce
  if (member.departmentId === 'sales-dept') {
    assignments.push('Salesforce Sales Cloud');
  }

  // マーケティング・経営: Microsoft 365（追加ツールとして）
  if (['company', 'marketing-dept'].includes(member.departmentId)) {
    assignments.push('Microsoft 365');
  }

  return assignments;
}

async function main() {
  console.log('🚀 50名のデモメンバーへのSaaS割り当てを開始します...\n');

  // 1. SaaSサービスを作成または取得
  console.log('=== SaaSサービス作成 ===');
  const serviceMap = new Map<string, string>();
  const planMap = new Map<string, string>();

  for (const service of saasServices) {
    // サービス作成
    let existingService = await prisma.saaSService.findFirst({
      where: { tenantId, name: service.name },
    });

    if (!existingService) {
      existingService = await prisma.saaSService.create({
        data: {
          tenantId,
          name: service.name,
          category: service.category,
          vendor: service.vendor,
          description: service.description,
          website: service.website,
          licenseType: service.licenseType,
          ssoEnabled: service.ssoEnabled,
          mfaEnabled: service.mfaEnabled,
          contractStartDate: service.contractStartDate,
          contractEndDate: service.contractEndDate,
          autoRenew: service.autoRenew,
          adminEmail: service.adminEmail,
          supportUrl: service.supportUrl,
          securityRating: service.securityRating,
          isActive: service.isActive,
        },
      });
      console.log(`✅ サービス作成: ${service.name}`);
    } else {
      console.log(`⏭️  サービス既存: ${service.name}`);
    }
    serviceMap.set(service.name, existingService.id);

    // プラン作成
    let existingPlan = await prisma.saaSLicensePlan.findFirst({
      where: { tenantId, serviceId: existingService.id, planName: service.planName },
    });

    if (!existingPlan) {
      existingPlan = await prisma.saaSLicensePlan.create({
        data: {
          tenantId,
          serviceId: existingService.id,
          planName: service.planName,
          billingCycle: service.billingCycle,
          pricePerUser: service.pricePerUser || null,
          fixedPrice: service.fixedPrice || null,
          currency: 'JPY',
          isActive: true,
        },
      });
      console.log(`   └─ プラン作成: ${service.planName}`);
    } else {
      console.log(`   └─ プラン既存: ${service.planName}`);
    }
    planMap.set(service.name, existingPlan.id);
  }

  // 2. 既存の割り当てを削除（クリーンアップ）
  console.log('\n=== 既存割り当てクリーンアップ ===');
  const deleted = await prisma.saaSLicenseAssignment.deleteMany({
    where: { tenantId },
  });
  console.log(`🗑️  削除された割り当て: ${deleted.count}件`);

  // 3. 50名へのSaaS割り当て
  console.log('\n=== SaaS割り当て作成 ===');
  let totalAssignments = 0;
  const serviceCounts = new Map<string, number>();

  for (const member of demoMembers) {
    const assignedServices = getAssignments(member);

    for (const serviceName of assignedServices) {
      const serviceId = serviceMap.get(serviceName);
      const planId = planMap.get(serviceName);

      if (!serviceId || !planId) {
        console.log(`⚠️  サービスまたはプランが見つかりません: ${serviceName}`);
        continue;
      }

      await prisma.saaSLicenseAssignment.create({
        data: {
          tenantId,
          serviceId,
          planId,
          userId: member.id,
          userName: member.name,
          userEmail: member.email,
          departmentId: member.departmentId,
          departmentName: member.department,
          assignedDate: new Date('2024-04-01'),
          status: 'active',
        },
      });

      // カウント更新
      serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
      totalAssignments++;
    }
    console.log(`👤 ${member.name}（${member.department}）: ${assignedServices.join(', ')}`);
  }

  // 4. 統計サマリー
  console.log('\n=== 📊 割り当て統計 ===');
  console.log(`総メンバー数: ${demoMembers.length}名`);
  console.log(`総割り当て数: ${totalAssignments}件`);
  console.log('\nサービス別割り当て数:');
  for (const [serviceName, count] of serviceCounts.entries()) {
    console.log(`  - ${serviceName}: ${count}名`);
  }

  // 月額コスト計算
  let monthlyTotal = 0;
  for (const service of saasServices) {
    const count = serviceCounts.get(service.name) || 0;
    if (service.pricePerUser) {
      const monthlyCost = service.billingCycle === 'yearly'
        ? (service.pricePerUser / 12) * count
        : service.pricePerUser * count;
      monthlyTotal += monthlyCost;
      console.log(`  └─ ${service.name}: ¥${Math.round(monthlyCost).toLocaleString()}/月`);
    } else if (service.fixedPrice) {
      const monthlyCost = service.billingCycle === 'yearly'
        ? service.fixedPrice / 12
        : service.fixedPrice;
      monthlyTotal += monthlyCost;
      console.log(`  └─ ${service.name}: ¥${Math.round(monthlyCost).toLocaleString()}/月（固定）`);
    }
  }
  console.log(`\n💰 月額コスト合計: ¥${Math.round(monthlyTotal).toLocaleString()}`);
  console.log(`💰 年額コスト合計: ¥${Math.round(monthlyTotal * 12).toLocaleString()}`);

  console.log('\n✨ 完了: 50名へのSaaS割り当てが完了しました！');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
