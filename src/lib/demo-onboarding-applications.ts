/**
 * Demo Onboarding Applications
 *
 * 5人の申請者のデモデータ（HR管理画面用）
 */

import type {
  OnboardingApplication,
  BasicInfoForm,
  FamilyInfoForm,
  BankAccountForm,
  CommuteRouteForm,
} from '@/types/onboarding';

// ============================================================================
// 1. 新入太郎 - 下書き
// ============================================================================

export const application001: OnboardingApplication = {
  id: 'demo-onboarding-001',
  employeeId: '6',
  applicantEmail: 'shinnyu@dandori.local',
  applicantName: '新入太郎',
  hireDate: '2025-11-01',
  status: 'draft',
  createdAt: '2025-10-15T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
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
  status: 'submitted',
  applicantName: '山田花子',
  applicantNameKana: 'ヤマダ ハナコ',
  dateOfBirth: '1998-03-15',
  gender: 'female',
  email: 'yamada.hanako@dandori.local',
  phoneNumber: '090-1234-5678',
  postalCode: '150-0001',
  prefecture: '東京都',
  city: '渋谷区',
  addressLine1: '神南1-2-3',
  addressLine2: 'ハナコマンション202',
  emergencyContactName: '山田太郎',
  emergencyContactRelation: '父',
  emergencyContactPhone: '090-9876-5432',
  createdAt: '2025-10-10T00:00:00Z',
  updatedAt: '2025-10-16T00:00:00Z',
  submittedAt: '2025-10-16T00:00:00Z',
};

export const familyInfoForm002: FamilyInfoForm = {
  id: 'demo-family-002',
  status: 'submitted',
  maritalStatus: 'single',
  dependents: [],
  createdAt: '2025-10-10T00:00:00Z',
  updatedAt: '2025-10-16T00:00:00Z',
  submittedAt: '2025-10-16T00:00:00Z',
};

export const bankAccountForm002: BankAccountForm = {
  id: 'demo-bank-002',
  status: 'submitted',
  bankName: 'みずほ銀行',
  branchName: '渋谷支店',
  accountType: 'ordinary',
  accountNumber: '1234567',
  accountHolderName: 'ヤマダ ハナコ',
  createdAt: '2025-10-10T00:00:00Z',
  updatedAt: '2025-10-16T00:00:00Z',
  submittedAt: '2025-10-16T00:00:00Z',
};

export const commuteRouteForm002: CommuteRouteForm = {
  id: 'demo-commute-002',
  status: 'submitted',
  routes: [
    {
      departureStation: '渋谷',
      arrivalStation: '新宿',
      line: 'JR山手線',
      fare: 160,
    },
  ],
  totalCommuteFare: 160,
  createdAt: '2025-10-10T00:00:00Z',
  updatedAt: '2025-10-16T00:00:00Z',
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
  status: 'returned',
  applicantName: '鈴木次郎',
  applicantNameKana: 'スズキ ジロウ',
  dateOfBirth: '1995-07-20',
  gender: 'male',
  email: 'suzuki.jiro@dandori.local',
  phoneNumber: '080-2345-6789',
  postalCode: '160-0022',
  prefecture: '東京都',
  city: '新宿区',
  addressLine1: '新宿3-1-1',
  addressLine2: '',
  emergencyContactName: '鈴木花子',
  emergencyContactRelation: '母',
  emergencyContactPhone: '080-8765-4321',
  createdAt: '2025-10-05T00:00:00Z',
  updatedAt: '2025-10-17T00:00:00Z',
  submittedAt: '2025-10-15T00:00:00Z',
  returnedAt: '2025-10-17T00:00:00Z',
  reviewComment: '住所の番地表記が不明確です。「3-1-1」ではなく、正確な番地を記入してください。',
};

export const familyInfoForm003: FamilyInfoForm = {
  id: 'demo-family-003',
  status: 'submitted',
  maritalStatus: 'single',
  dependents: [],
  createdAt: '2025-10-05T00:00:00Z',
  updatedAt: '2025-10-15T00:00:00Z',
  submittedAt: '2025-10-15T00:00:00Z',
};

export const bankAccountForm003: BankAccountForm = {
  id: 'demo-bank-003',
  status: 'submitted',
  bankName: '三菱UFJ銀行',
  branchName: '新宿支店',
  accountType: 'ordinary',
  accountNumber: '2345678',
  accountHolderName: 'スズキ ジロウ',
  createdAt: '2025-10-05T00:00:00Z',
  updatedAt: '2025-10-15T00:00:00Z',
  submittedAt: '2025-10-15T00:00:00Z',
};

export const commuteRouteForm003: CommuteRouteForm = {
  id: 'demo-commute-003',
  status: 'submitted',
  routes: [
    {
      departureStation: '新宿',
      arrivalStation: '東京',
      line: 'JR中央線快速',
      fare: 200,
    },
  ],
  totalCommuteFare: 200,
  createdAt: '2025-10-05T00:00:00Z',
  updatedAt: '2025-10-15T00:00:00Z',
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
  status: 'approved',
  applicantName: '田中雪',
  applicantNameKana: 'タナカ ユキ',
  dateOfBirth: '1997-12-10',
  gender: 'other',
  email: 'tanaka.yuki@dandori.local',
  phoneNumber: '070-3456-7890',
  postalCode: '100-0005',
  prefecture: '東京都',
  city: '千代田区',
  addressLine1: '丸の内1-1-1',
  addressLine2: 'ユキタワー1505',
  emergencyContactName: '田中一郎',
  emergencyContactRelation: '兄',
  emergencyContactPhone: '070-7654-3210',
  createdAt: '2025-10-01T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:30:00Z',
  approvedBy: '1', // 山田太郎（HR担当）
};

export const familyInfoForm004: FamilyInfoForm = {
  id: 'demo-family-004',
  status: 'approved',
  maritalStatus: 'married',
  spouseName: '田中花子',
  spouseDateOfBirth: '1998-05-20',
  dependents: [],
  createdAt: '2025-10-01T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:31:00Z',
  approvedBy: '1',
};

export const bankAccountForm004: BankAccountForm = {
  id: 'demo-bank-004',
  status: 'approved',
  bankName: '三井住友銀行',
  branchName: '東京営業部',
  accountType: 'ordinary',
  accountNumber: '3456789',
  accountHolderName: 'タナカ ユキ',
  createdAt: '2025-10-01T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:32:00Z',
  approvedBy: '1',
};

export const commuteRouteForm004: CommuteRouteForm = {
  id: 'demo-commute-004',
  status: 'approved',
  routes: [
    {
      departureStation: '東京',
      arrivalStation: '品川',
      line: 'JR山手線',
      fare: 170,
    },
  ],
  totalCommuteFare: 170,
  createdAt: '2025-10-01T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  submittedAt: '2025-10-12T00:00:00Z',
  approvedAt: '2025-10-18T10:33:00Z',
  approvedBy: '1',
};

// ============================================================================
// 5. 佐藤明 - 下書き
// ============================================================================

export const application005: OnboardingApplication = {
  id: 'demo-onboarding-005',
  employeeId: '10',
  applicantEmail: 'sato.akira@dandori.local',
  applicantName: '佐藤明',
  hireDate: '2025-12-01',
  status: 'draft',
  createdAt: '2025-10-12T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
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
  status: 'draft',
  applicantName: '佐藤明',
  applicantNameKana: 'サトウ アキラ',
  dateOfBirth: '1996-09-25',
  gender: 'male',
  email: 'sato.akira@dandori.local',
  phoneNumber: '080-4567-8901',
  postalCode: '',
  prefecture: '',
  city: '',
  addressLine1: '',
  addressLine2: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  createdAt: '2025-10-12T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
};

export const familyInfoForm005: FamilyInfoForm = {
  id: 'demo-family-005',
  status: 'draft',
  maritalStatus: 'single',
  dependents: [],
  createdAt: '2025-10-12T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
};

export const bankAccountForm005: BankAccountForm = {
  id: 'demo-bank-005',
  status: 'draft',
  bankName: '',
  branchName: '',
  accountType: 'ordinary',
  accountNumber: '',
  accountHolderName: '',
  createdAt: '2025-10-12T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
};

export const commuteRouteForm005: CommuteRouteForm = {
  id: 'demo-commute-005',
  status: 'draft',
  routes: [],
  totalCommuteFare: 0,
  createdAt: '2025-10-12T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
};

// ============================================================================
// データ取得関数
// ============================================================================

export function getApplicationData(applicationId: string) {
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
