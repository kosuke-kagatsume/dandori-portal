/**
 * SaaS管理システム用のモックデータ生成
 */

import type { SaaSService, LicensePlan, LicenseAssignment } from '@/types/saas';

/**
 * モックSaaSサービスデータ
 */
export const mockSaaSServices: Omit<SaaSService, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Slack',
    vendor: 'Slack Technologies',
    category: 'communication',
    licenseType: 'user-based',
    description: 'ビジネスコミュニケーションプラットフォーム',
    website: 'https://slack.com',
    logo: 'https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'credit_card',
    notes: 'チーム全体で利用',
  },
  {
    name: 'Zoom',
    vendor: 'Zoom Video Communications',
    category: 'communication',
    licenseType: 'user-based',
    description: 'ビデオ会議プラットフォーム',
    website: 'https://zoom.us',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'credit_card',
  },
  {
    name: 'GitHub Enterprise',
    vendor: 'GitHub, Inc.',
    category: 'development',
    licenseType: 'user-based',
    description: 'ソースコード管理・開発プラットフォーム',
    website: 'https://github.com',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'invoice',
  },
  {
    name: 'Notion',
    vendor: 'Notion Labs',
    category: 'productivity',
    licenseType: 'user-based',
    description: 'オールインワンワークスペース',
    website: 'https://notion.so',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'credit_card',
  },
  {
    name: 'Figma',
    vendor: 'Figma, Inc.',
    category: 'design',
    licenseType: 'user-based',
    description: 'コラボレーティブデザインツール',
    website: 'https://figma.com',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'credit_card',
  },
  {
    name: 'Adobe Creative Cloud',
    vendor: 'Adobe Inc.',
    category: 'design',
    licenseType: 'user-based',
    description: 'クリエイティブアプリケーションスイート',
    website: 'https://adobe.com',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'annual',
    autoRenewal: true,
    paymentMethod: 'invoice',
  },
  {
    name: 'Microsoft 365',
    vendor: 'Microsoft Corporation',
    category: 'productivity',
    licenseType: 'user-based',
    description: 'オフィスアプリケーションスイート',
    website: 'https://microsoft.com',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'invoice',
  },
  {
    name: 'Salesforce',
    vendor: 'Salesforce, Inc.',
    category: 'sales',
    licenseType: 'user-based',
    description: 'CRM・営業支援プラットフォーム',
    website: 'https://salesforce.com',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'invoice',
  },
  {
    name: 'Dropbox Business',
    vendor: 'Dropbox, Inc.',
    category: 'productivity',
    licenseType: 'fixed',
    description: 'クラウドストレージ・ファイル共有',
    website: 'https://dropbox.com',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'annual',
    autoRenewal: true,
    paymentMethod: 'credit_card',
  },
  {
    name: 'Asana',
    vendor: 'Asana, Inc.',
    category: 'project_management',
    licenseType: 'user-based',
    description: 'プロジェクト管理・タスク管理',
    website: 'https://asana.com',
    isActive: true,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    billingCycle: 'monthly',
    autoRenewal: true,
    paymentMethod: 'credit_card',
  },
];

/**
 * サービス名に応じたライセンスプランを生成
 */
export function generatePlansForService(serviceId: string, serviceName: string, licenseType: string): Omit<LicensePlan, 'id' | 'createdAt' | 'updatedAt'>[] {
  const plans: Omit<LicensePlan, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  switch (serviceName) {
    case 'Slack':
      plans.push({
        serviceId,
        planName: 'Business+',
        pricePerUser: 1600,
        billingCycle: 'monthly',
        maxUsers: 100,
        features: ['無制限メッセージ履歴', 'アプリ統合無制限', '24時間サポート'],
        isActive: true,
      });
      break;

    case 'Zoom':
      plans.push({
        serviceId,
        planName: 'Business',
        pricePerUser: 2700,
        billingCycle: 'monthly',
        maxUsers: 300,
        features: ['300人まで参加可能', '録画機能', 'クラウドストレージ'],
        isActive: true,
      });
      break;

    case 'GitHub Enterprise':
      plans.push({
        serviceId,
        planName: 'Enterprise Cloud',
        pricePerUser: 2400,
        billingCycle: 'monthly',
        features: ['無制限リポジトリ', 'Advanced Security', 'SAML SSO'],
        isActive: true,
      });
      break;

    case 'Notion':
      plans.push({
        serviceId,
        planName: 'Team',
        pricePerUser: 1500,
        billingCycle: 'monthly',
        features: ['無制限ブロック', 'バージョン履歴', 'ゲスト招待'],
        isActive: true,
      });
      break;

    case 'Figma':
      plans.push({
        serviceId,
        planName: 'Professional',
        pricePerUser: 1800,
        billingCycle: 'monthly',
        features: ['無制限プロジェクト', 'バージョン履歴', 'チームライブラリ'],
        isActive: true,
      });
      break;

    case 'Adobe Creative Cloud':
      plans.push({
        serviceId,
        planName: 'All Apps',
        pricePerUser: 8000,
        billingCycle: 'annual',
        features: ['全アプリケーション利用可', '100GB クラウドストレージ', 'Adobe Fonts'],
        isActive: true,
      });
      break;

    case 'Microsoft 365':
      plans.push({
        serviceId,
        planName: 'Business Standard',
        pricePerUser: 1560,
        billingCycle: 'monthly',
        features: ['Office アプリ', '1TB OneDrive', 'Teams'],
        isActive: true,
      });
      break;

    case 'Salesforce':
      plans.push({
        serviceId,
        planName: 'Enterprise',
        pricePerUser: 18000,
        billingCycle: 'monthly',
        features: ['カスタマイズ可能', 'ワークフロー自動化', 'API アクセス'],
        isActive: true,
      });
      break;

    case 'Dropbox Business':
      plans.push({
        serviceId,
        planName: 'Standard',
        fixedPrice: 150000,
        billingCycle: 'annual',
        maxUsers: 50,
        features: ['5TB ストレージ', 'バージョン履歴180日', 'チームフォルダ'],
        isActive: true,
      });
      break;

    case 'Asana':
      plans.push({
        serviceId,
        planName: 'Business',
        pricePerUser: 1350,
        billingCycle: 'monthly',
        features: ['カスタムフィールド', 'ポートフォリオ', 'ワークロード管理'],
        isActive: true,
      });
      break;

    default:
      plans.push({
        serviceId,
        planName: 'Standard',
        pricePerUser: licenseType === 'user-based' ? 2000 : undefined,
        fixedPrice: licenseType === 'fixed' ? 100000 : undefined,
        billingCycle: 'monthly',
        isActive: true,
      });
  }

  return plans;
}

/**
 * ユーザーと部門に基づいてライセンス割り当てを生成
 */
export function generateAssignments(
  services: SaaSService[],
  plans: LicensePlan[],
  users: Array<{ id: string; name: string; email: string; department?: string }>
): Omit<LicenseAssignment, 'id' | 'createdAt' | 'updatedAt'>[] {
  const assignments: Omit<LicenseAssignment, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  // 部門ごとのサービス割り当てルール
  const departmentServices: Record<string, string[]> = {
    '営業部': ['Slack', 'Zoom', 'Salesforce', 'Microsoft 365', 'Notion'],
    '開発部': ['Slack', 'Zoom', 'GitHub Enterprise', 'Notion', 'Microsoft 365'],
    'デザイン部': ['Slack', 'Zoom', 'Figma', 'Adobe Creative Cloud', 'Notion'],
    'マーケティング部': ['Slack', 'Zoom', 'Microsoft 365', 'Notion', 'Asana'],
    '人事部': ['Slack', 'Zoom', 'Microsoft 365', 'Notion'],
    '経理部': ['Slack', 'Zoom', 'Microsoft 365'],
    '総務部': ['Slack', 'Zoom', 'Microsoft 365', 'Notion'],
    '未分類': ['Slack', 'Zoom', 'Microsoft 365'],
  };

  // 全社共通サービス
  const commonServices = ['Slack', 'Zoom', 'Microsoft 365'];

  users.forEach((user) => {
    const dept = user.department || '未分類';
    const deptServices = departmentServices[dept] || commonServices;

    deptServices.forEach((serviceName) => {
      const service = services.find((s) => s.name === serviceName);
      if (!service) return;

      const plan = plans.find((p) => p.serviceId === service.id && p.isActive);
      if (!plan) return;

      // 80%の確率でアクティブ、20%で未使用（lastUsedAtなし）
      const isActive = Math.random() > 0.2;
      const assignedDate = new Date('2024-01-15');
      const lastUsedDate = isActive
        ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        : null;

      assignments.push({
        serviceId: service.id,
        planId: plan.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        status: 'active',
        assignedAt: assignedDate.toISOString(),
        lastUsedAt: lastUsedDate?.toISOString(),
      });
    });
  });

  return assignments;
}

/**
 * 全モックデータを生成してストアに投入
 */
export function initializeSaaSMockData(
  addService: (service: Omit<SaaSService, 'id' | 'createdAt' | 'updatedAt'>) => void,
  addPlan: (plan: Omit<LicensePlan, 'id' | 'createdAt' | 'updatedAt'>) => void,
  addAssignment: (assignment: Omit<LicenseAssignment, 'id' | 'createdAt' | 'updatedAt'>) => void,
  getServiceById: (id: string) => SaaSService | undefined,
  getPlansByServiceId: (serviceId: string) => LicensePlan[],
  users: Array<{ id: string; name: string; email: string; department?: string }>
) {
  // 1. サービスを追加
  mockSaaSServices.forEach((service) => {
    addService(service);
  });

  // ストアから追加されたサービスを取得（IDが付与されている）
  const servicesWithIds: SaaSService[] = [];
  mockSaaSServices.forEach((mockService) => {
    // 名前でサービスを探す（簡易的な方法）
    // 実際にはストアから全サービスを取得する必要がある
    const services = mockSaaSServices.map((_, index) => {
      // ここでは仮のIDを使用
      return {
        ...mockService,
        id: `service-mock-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as SaaSService;
    });
    servicesWithIds.push(...services);
  });

  // 2. 各サービスにプランを追加
  servicesWithIds.forEach((service) => {
    const plans = generatePlansForService(service.id, service.name, service.licenseType);
    plans.forEach((plan) => {
      addPlan(plan);
    });
  });

  // 3. ライセンス割り当てを追加
  const plansWithIds = servicesWithIds.flatMap((service) => {
    return getPlansByServiceId(service.id);
  });

  const assignments = generateAssignments(servicesWithIds, plansWithIds, users);
  assignments.forEach((assignment) => {
    addAssignment(assignment);
  });
}
