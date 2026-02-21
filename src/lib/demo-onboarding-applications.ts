/**
 * Demo Onboarding Applications
 *
 * 5人の申請者のデモデータ（HR管理画面用）
 *
 * 注意: このファイルはデモモード（NEXT_PUBLIC_DEMO_MODE=true）でのみ使用されます。
 * 本番環境では無効化されます。
 */

/**
 * デモモードが有効かどうかを確認
 */
export const isDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

import type {
  OnboardingApplication,
  BasicInfoForm,
  FamilyInfoForm,
  BankAccountForm,
  CommuteRouteForm,
} from '@/types/onboarding';

// 型エイリアス（将来の型拡張用）
type BasicInfoFormAlias = BasicInfoForm;
type FamilyInfoFormAlias = FamilyInfoForm;
type BankAccountFormAlias = BankAccountForm;
type CommuteRouteFormAlias = CommuteRouteForm;

// 未使用警告を抑制
void (undefined as unknown as BasicInfoFormAlias);
void (undefined as unknown as FamilyInfoFormAlias);
void (undefined as unknown as BankAccountFormAlias);
void (undefined as unknown as CommuteRouteFormAlias);

// ============================================================================
// 1. 新入太郎 - 未提出（入力中）
// ============================================================================

export const application001: OnboardingApplication = {
  id: 'demo-onboarding-001',
  employeeId: '6',
  applicantEmail: 'shinnyu@dandori.local',
  applicantName: '新入太郎',
  hireDate: '2025-11-01',
  status: 'not_submitted',
  createdAt: '2025-10-15T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  invitedAt: '2025-10-15T09:00:00Z',
  basicInfoFormId: 'demo-basic-001',
  familyInfoFormId: 'demo-family-001',
  bankAccountFormId: 'demo-bank-001',
  commuteRouteFormId: 'demo-commute-001',
  deadline: '2025-10-31T23:59:59Z',
  accessToken: 'demo-access-token-001',
  department: '営業部',
  position: '営業',
  hrNotes: 'デモ用の入社申請データです',
};

// ============================================================================
// 2. 山田花子 - 提出済み
// ============================================================================

export const application002: OnboardingApplication = {
  id: 'demo-onboarding-002',
  employeeId: '7',
  applicantEmail: 'yamada.hanako@dandori.local',
  applicantName: '山田花子',
  hireDate: '2025-11-01',
  status: 'submitted',
  createdAt: '2025-10-10T00:00:00Z',
  updatedAt: '2025-10-16T00:00:00Z',
  invitedAt: '2025-10-10T09:00:00Z',
  basicInfoFormId: 'demo-basic-002',
  familyInfoFormId: 'demo-family-002',
  bankAccountFormId: 'demo-bank-002',
  commuteRouteFormId: 'demo-commute-002',
  deadline: '2025-10-31T23:59:59Z',
  accessToken: 'demo-access-token-002',
  department: 'エンジニアリング部',
  position: 'エンジニア',
  hrNotes: '',
};

export const basicInfoForm002: BasicInfoForm = {
  id: 'demo-basic-002',
  applicationId: 'demo-onboarding-002',
  status: 'submitted',
  email: 'yamada.hanako@dandori.local',
  hireDate: '2025-11-01',
  lastNameKanji: '山田',
  firstNameKanji: '花子',
  lastNameKana: 'ヤマダ',
  firstNameKana: 'ハナコ',
  birthDate: '1998-03-15',
  gender: 'female',
  phoneNumber: '09012345678',
  personalEmail: 'hanako.private@gmail.com',
  currentAddress: {
    postalCode: '150-0001',
    prefecture: '東京都',
    city: '渋谷区',
    streetAddress: '神南1-2-3',
    building: 'ハナコマンション202',
  },
  residentAddress: {
    sameAsCurrent: true,
  },
  emergencyContact: {
    name: '山田太郎',
    relationship: '父',
    phoneNumber: '09098765432',
    address: '東京都渋谷区神南1-2-3',
  },
  socialInsurance: {
    pensionNumber: '1234567890',
    employmentInsuranceNumber: '12345678901',
    hasPreviousEmployer: false,
    myNumberCardInsurance: true,
  },
  myNumberSubmitted: true,
  documents: {
    currentYearIncome: false,
    residentTax: 'exempt',
    healthCheckup: true,
  },
  submittedAt: '2025-10-16T00:00:00Z',
};

export const familyInfoForm002: FamilyInfoForm = {
  id: 'demo-family-002',
  applicationId: 'demo-onboarding-002',
  status: 'submitted',
  email: 'yamada.hanako@dandori.local',
  employeeNumber: '-',
  lastNameKanji: '山田',
  firstNameKanji: '花子',
  hasSpouse: false,
  familyMembers: [],
  submittedAt: '2025-10-16T00:00:00Z',
};

export const bankAccountForm002: BankAccountForm = {
  id: 'demo-bank-002',
  applicationId: 'demo-onboarding-002',
  status: 'submitted',
  email: 'yamada.hanako@dandori.local',
  employeeNumber: '-',
  fullName: '山田 花子',
  applicationType: 'new',
  consent: true,
  bankName: 'みずほ銀行',
  bankCode: '0001',
  branchName: '渋谷支店',
  branchCode: '210',
  accountNumber: '1234567',
  accountHolderKana: 'ヤマダ ハナコ',
  submittedAt: '2025-10-16T00:00:00Z',
};

export const commuteRouteForm002: CommuteRouteForm = {
  id: 'demo-commute-002',
  applicationId: 'demo-onboarding-002',
  status: 'submitted',
  confirmations: {
    transportAllowanceCompliance: true,
    remoteWorkDailyCalculation: true,
    expenseDeadline: true,
    bicycleProhibition: true,
  },
  applicationType: 'new',
  employeeNumber: '-',
  name: '山田花子',
  address: '東京都渋谷区神南1-2-3 ハナコマンション202',
  commuteStatus: 'commute',
  route: '渋谷駅 → JR山手線 → 新宿駅',
  publicTransit: {
    oneWayFare: 160,
    monthlyPass: 4440,
    nearestStation: '渋谷',
    workStation: '新宿',
    homeToStationDistance: 0.5,
    stationToWorkMethod: 'walk',
  },
  submittedAt: '2025-10-16T00:00:00Z',
};

// ============================================================================
// 3. 鈴木次郎 - 差し戻し
// ============================================================================

export const application003: OnboardingApplication = {
  id: 'demo-onboarding-003',
  employeeId: '8',
  applicantEmail: 'suzuki.jiro@dandori.local',
  applicantName: '鈴木次郎',
  hireDate: '2025-11-15',
  status: 'returned',
  createdAt: '2025-10-05T00:00:00Z',
  updatedAt: '2025-10-17T00:00:00Z',
  invitedAt: '2025-10-05T09:00:00Z',
  basicInfoFormId: 'demo-basic-003',
  familyInfoFormId: 'demo-family-003',
  bankAccountFormId: 'demo-bank-003',
  commuteRouteFormId: 'demo-commute-003',
  deadline: '2025-11-07T23:59:59Z',
  accessToken: 'demo-access-token-003',
  department: '総務部',
  position: '総務',
  hrNotes: '住所の表記に誤りがあるため、差し戻しました。',
};

export const basicInfoForm003: BasicInfoForm = {
  id: 'demo-basic-003',
  applicationId: 'demo-onboarding-003',
  status: 'returned',
  email: 'suzuki.jiro@dandori.local',
  hireDate: '2025-11-15',
  lastNameKanji: '鈴木',
  firstNameKanji: '次郎',
  lastNameKana: 'スズキ',
  firstNameKana: 'ジロウ',
  birthDate: '1995-07-20',
  gender: 'male',
  phoneNumber: '08023456789',
  personalEmail: 'jiro.private@gmail.com',
  currentAddress: {
    postalCode: '160-0022',
    prefecture: '東京都',
    city: '新宿区',
    streetAddress: '新宿3-1-1',
  },
  residentAddress: {
    sameAsCurrent: true,
  },
  emergencyContact: {
    name: '鈴木花子',
    relationship: '母',
    phoneNumber: '08087654321',
    address: '東京都新宿区新宿3-1-1',
  },
  socialInsurance: {
    pensionNumber: '2345678901',
    hasPreviousEmployer: true,
    previousEmployer: {
      name: '前職株式会社',
      address: '東京都渋谷区',
      retirementDate: '2025-10-31',
    },
    myNumberCardInsurance: true,
  },
  myNumberSubmitted: true,
  documents: {
    currentYearIncome: true,
    residentTax: 'withholding',
    healthCheckup: true,
  },
  submittedAt: '2025-10-15T00:00:00Z',
  returnedAt: '2025-10-17T00:00:00Z',
  reviewComment: '住所の番地表記が不明確です。「3-1-1」ではなく、正確な番地を記入してください。',
};

export const familyInfoForm003: FamilyInfoForm = {
  id: 'demo-family-003',
  applicationId: 'demo-onboarding-003',
  status: 'submitted',
  email: 'suzuki.jiro@dandori.local',
  employeeNumber: '-',
  lastNameKanji: '鈴木',
  firstNameKanji: '次郎',
  hasSpouse: false,
  familyMembers: [],
  submittedAt: '2025-10-15T00:00:00Z',
};

export const bankAccountForm003: BankAccountForm = {
  id: 'demo-bank-003',
  applicationId: 'demo-onboarding-003',
  status: 'submitted',
  email: 'suzuki.jiro@dandori.local',
  employeeNumber: '-',
  fullName: '鈴木 次郎',
  applicationType: 'new',
  consent: true,
  bankName: '三菱UFJ銀行',
  bankCode: '0005',
  branchName: '新宿支店',
  branchCode: '050',
  accountNumber: '2345678',
  accountHolderKana: 'スズキ ジロウ',
  submittedAt: '2025-10-15T00:00:00Z',
};

export const commuteRouteForm003: CommuteRouteForm = {
  id: 'demo-commute-003',
  applicationId: 'demo-onboarding-003',
  status: 'submitted',
  confirmations: {
    transportAllowanceCompliance: true,
    remoteWorkDailyCalculation: true,
    expenseDeadline: true,
    bicycleProhibition: true,
  },
  applicationType: 'new',
  employeeNumber: '-',
  name: '鈴木次郎',
  address: '東京都新宿区新宿3-1-1',
  commuteStatus: 'commute',
  route: '新宿駅 → JR中央線快速 → 東京駅',
  publicTransit: {
    oneWayFare: 200,
    monthlyPass: 5600,
    nearestStation: '新宿',
    workStation: '東京',
    homeToStationDistance: 0.3,
    stationToWorkMethod: 'walk',
  },
  submittedAt: '2025-10-15T00:00:00Z',
};

// ============================================================================
// 4. 田中雪 - 承認済み
// ============================================================================

export const application004: OnboardingApplication = {
  id: 'demo-onboarding-004',
  employeeId: '9',
  applicantEmail: 'tanaka.yuki@dandori.local',
  applicantName: '田中雪',
  hireDate: '2025-12-01',
  status: 'approved',
  createdAt: '2025-10-01T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  invitedAt: '2025-10-01T09:00:00Z',
  basicInfoFormId: 'demo-basic-004',
  familyInfoFormId: 'demo-family-004',
  bankAccountFormId: 'demo-bank-004',
  commuteRouteFormId: 'demo-commute-004',
  deadline: '2025-11-23T23:59:59Z',
  accessToken: 'demo-access-token-004',
  department: '人事部',
  position: '人事',
  hrNotes: '全フォーム承認完了。入社準備を進めてください。',
};

export const basicInfoForm004: BasicInfoForm = {
  id: 'demo-basic-004',
  applicationId: 'demo-onboarding-004',
  status: 'approved',
  email: 'tanaka.yuki@dandori.local',
  hireDate: '2025-12-01',
  lastNameKanji: '田中',
  firstNameKanji: '雪',
  lastNameKana: 'タナカ',
  firstNameKana: 'ユキ',
  birthDate: '1997-12-10',
  gender: 'other',
  phoneNumber: '07034567890',
  personalEmail: 'yuki.private@gmail.com',
  currentAddress: {
    postalCode: '100-0005',
    prefecture: '東京都',
    city: '千代田区',
    streetAddress: '丸の内1-1-1',
    building: 'ユキタワー1505',
  },
  residentAddress: {
    sameAsCurrent: true,
  },
  emergencyContact: {
    name: '田中一郎',
    relationship: '兄',
    phoneNumber: '07076543210',
    address: '東京都千代田区丸の内1-1-1',
  },
  socialInsurance: {
    pensionNumber: '3456789012',
    hasPreviousEmployer: false,
    myNumberCardInsurance: true,
  },
  myNumberSubmitted: true,
  documents: {
    currentYearIncome: false,
    residentTax: 'exempt',
    healthCheckup: true,
  },
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:30:00Z',
  approvedBy: '1', // 山田太郎（HR担当）
};

export const familyInfoForm004: FamilyInfoForm = {
  id: 'demo-family-004',
  applicationId: 'demo-onboarding-004',
  status: 'approved',
  email: 'tanaka.yuki@dandori.local',
  employeeNumber: '-',
  lastNameKanji: '田中',
  firstNameKanji: '雪',
  hasSpouse: true,
  spouse: {
    nameKanji: '田中花子',
    nameKana: 'タナカ ハナコ',
    relationship: '配偶者',
    birthDate: '1998-05-20',
    liveTogether: true,
    isSameHouseholdSpouse: true,
    incomeTaxDependent: true,
    healthInsuranceDependent: true,
    occupation: '専業主婦',
    annualIncome: 0,
  },
  familyMembers: [],
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:31:00Z',
  approvedBy: '1',
};

export const bankAccountForm004: BankAccountForm = {
  id: 'demo-bank-004',
  applicationId: 'demo-onboarding-004',
  status: 'approved',
  email: 'tanaka.yuki@dandori.local',
  employeeNumber: '-',
  fullName: '田中 雪',
  applicationType: 'new',
  consent: true,
  bankName: '三井住友銀行',
  bankCode: '0009',
  branchName: '東京営業部',
  branchCode: '200',
  accountNumber: '3456789',
  accountHolderKana: 'タナカ ユキ',
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:32:00Z',
  approvedBy: '1',
};

export const commuteRouteForm004: CommuteRouteForm = {
  id: 'demo-commute-004',
  applicationId: 'demo-onboarding-004',
  status: 'approved',
  confirmations: {
    transportAllowanceCompliance: true,
    remoteWorkDailyCalculation: true,
    expenseDeadline: true,
    bicycleProhibition: true,
  },
  applicationType: 'new',
  employeeNumber: '-',
  name: '田中雪',
  address: '東京都千代田区丸の内1-1-1 ユキタワー1505',
  commuteStatus: 'commute',
  route: '東京駅 → JR山手線 → 品川駅',
  publicTransit: {
    oneWayFare: 170,
    monthlyPass: 4760,
    nearestStation: '東京',
    workStation: '品川',
    homeToStationDistance: 0.2,
    stationToWorkMethod: 'walk',
  },
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:33:00Z',
  approvedBy: '1',
};

// ============================================================================
// 5. 佐藤明 - 招待済み（未着手）
// ============================================================================

export const application005: OnboardingApplication = {
  id: 'demo-onboarding-005',
  employeeId: '10',
  applicantEmail: 'sato.akira@dandori.local',
  applicantName: '佐藤明',
  hireDate: '2025-12-01',
  status: 'invited',
  createdAt: '2025-10-12T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  invitedAt: '2025-10-18T09:00:00Z',
  basicInfoFormId: 'demo-basic-005',
  familyInfoFormId: 'demo-family-005',
  bankAccountFormId: 'demo-bank-005',
  commuteRouteFormId: 'demo-commute-005',
  deadline: '2025-11-23T23:59:59Z',
  accessToken: 'demo-access-token-005',
  department: '経理部',
  position: '経理',
  hrNotes: '',
};

export const basicInfoForm005: BasicInfoForm = {
  id: 'demo-basic-005',
  applicationId: 'demo-onboarding-005',
  status: 'draft',
  email: 'sato.akira@dandori.local',
  hireDate: '2025-12-01',
  lastNameKanji: '佐藤',
  firstNameKanji: '明',
  lastNameKana: 'サトウ',
  firstNameKana: 'アキラ',
  birthDate: '1996-09-25',
  gender: 'male',
  phoneNumber: '08045678901',
  personalEmail: 'akira.private@gmail.com',
  currentAddress: {
    postalCode: '',
    prefecture: '',
    city: '',
    streetAddress: '',
  },
  residentAddress: {
    sameAsCurrent: true,
  },
  emergencyContact: {
    name: '',
    relationship: '',
    phoneNumber: '',
    address: '',
  },
  socialInsurance: {
    pensionNumber: '',
    hasPreviousEmployer: false,
    myNumberCardInsurance: false,
  },
  myNumberSubmitted: false,
  documents: {
    currentYearIncome: false,
    residentTax: 'exempt',
    healthCheckup: false,
  },
};

export const familyInfoForm005: FamilyInfoForm = {
  id: 'demo-family-005',
  applicationId: 'demo-onboarding-005',
  status: 'draft',
  email: 'sato.akira@dandori.local',
  employeeNumber: '-',
  lastNameKanji: '佐藤',
  firstNameKanji: '明',
  hasSpouse: false,
  familyMembers: [],
};

export const bankAccountForm005: BankAccountForm = {
  id: 'demo-bank-005',
  applicationId: 'demo-onboarding-005',
  status: 'draft',
  email: 'sato.akira@dandori.local',
  employeeNumber: '-',
  fullName: '佐藤 明',
  applicationType: 'new',
  consent: false,
  bankName: '',
  bankCode: '',
  branchName: '',
  branchCode: '',
  accountNumber: '',
  accountHolderKana: '',
};

export const commuteRouteForm005: CommuteRouteForm = {
  id: 'demo-commute-005',
  applicationId: 'demo-onboarding-005',
  status: 'draft',
  confirmations: {
    transportAllowanceCompliance: false,
    remoteWorkDailyCalculation: false,
    expenseDeadline: false,
    bicycleProhibition: false,
  },
  applicationType: 'new',
  employeeNumber: '-',
  name: '佐藤明',
  address: '',
  commuteStatus: 'commute',
};

// ============================================================================
// 全申請一覧
// ============================================================================

const _allApplications: OnboardingApplication[] = [
  application001,
  application002,
  application003,
  application004,
  application005,
];

/**
 * 全申請一覧を取得
 * 注意: デモモードでない場合は空配列を返します
 */
export const getAllDemoApplications = (): OnboardingApplication[] => {
  if (!isDemoMode()) {
    return [];
  }
  return _allApplications;
};

// 後方互換性のためにエクスポート（非推奨）
// @deprecated getAllDemoApplications() を使用してください
export const allApplications = _allApplications;

// ============================================================================
// データ取得関数
// ============================================================================

/**
 * 指定されたIDの申請データを取得
 * 注意: デモモードでない場合は常にnullを返します
 */
export function getApplicationData(applicationId: string) {
  // 本番環境ではデモデータを返さない
  if (!isDemoMode()) {
    return null;
  }

  switch (applicationId) {
    case 'demo-onboarding-001':
      return {
        application: application001,
        basicInfoForm: null, // 新入太郎のデータはonboarding-storeから取得
        familyInfoForm: null,
        bankAccountForm: null,
        commuteRouteForm: null,
      };
    case 'demo-onboarding-002':
      return {
        application: application002,
        basicInfoForm: basicInfoForm002,
        familyInfoForm: familyInfoForm002,
        bankAccountForm: bankAccountForm002,
        commuteRouteForm: commuteRouteForm002,
      };
    case 'demo-onboarding-003':
      return {
        application: application003,
        basicInfoForm: basicInfoForm003,
        familyInfoForm: familyInfoForm003,
        bankAccountForm: bankAccountForm003,
        commuteRouteForm: commuteRouteForm003,
      };
    case 'demo-onboarding-004':
      return {
        application: application004,
        basicInfoForm: basicInfoForm004,
        familyInfoForm: familyInfoForm004,
        bankAccountForm: bankAccountForm004,
        commuteRouteForm: commuteRouteForm004,
      };
    case 'demo-onboarding-005':
      return {
        application: application005,
        basicInfoForm: basicInfoForm005,
        familyInfoForm: familyInfoForm005,
        bankAccountForm: bankAccountForm005,
        commuteRouteForm: commuteRouteForm005,
      };
    default:
      return null;
  }
}
