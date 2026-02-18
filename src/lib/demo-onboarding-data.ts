/**
 * Demo Onboarding Data
 *
 * サンプルの入社申請データ（新入社員「新入太郎」さん用）
 */

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
// デモ用入社申請
// ============================================================================

/**
 * 新入太郎さんの入社申請
 */
export const demoOnboardingApplication: OnboardingApplication = {
  id: 'demo-onboarding-001',
  employeeId: '6', // 新入太郎のID（demo-users.tsと一致）
  applicantEmail: 'shinnyu@dandori.local',
  applicantName: '新入太郎',
  hireDate: '2025-11-01', // 入社日
  status: 'not_submitted', // 未提出状態

  createdAt: '2025-10-15T00:00:00Z',
  updatedAt: '2025-10-18T00:00:00Z',
  invitedAt: '2025-10-15T09:00:00Z', // 招待日時

  // 4フォームのID
  basicInfoFormId: 'demo-basic-001',
  familyInfoFormId: 'demo-family-001',
  bankAccountFormId: 'demo-bank-001',
  commuteRouteFormId: 'demo-commute-001',

  // 期限管理
  deadline: '2025-10-31T23:59:59Z', // 入社日の1週間前

  // アクセストークン（デモ用）
  accessToken: 'demo-access-token-shinnyu-taro-001-abcdefghijklmnop',

  // 組織情報
  department: '営業部',
  position: '営業',

  // メモ
  hrNotes: 'デモ用の入社申請データです',
};

// ============================================================================
// 基本情報フォーム（部分的に入力済み）
// ============================================================================

/**
 * 基本情報フォーム - 一部入力済みの状態
 */
export const demoBasicInfoForm: BasicInfoForm = {
  id: 'demo-basic-001',
  applicationId: 'demo-onboarding-001',
  status: 'draft',

  // 基本情報（一部入力済み）
  email: 'shinnyu@dandori.local',
  hireDate: '2025-11-01',

  // 氏名
  lastNameKanji: '新入',
  firstNameKanji: '太郎',
  lastNameKana: 'シンニュウ',
  firstNameKana: 'タロウ',

  // 個人情報
  birthDate: '1995-04-01',
  gender: 'male',
  phoneNumber: '09087654321',
  personalEmail: 'taro.shinnyu@gmail.com',

  // 貸与品受け取り（未入力）
  equipmentPickupTime: '',

  // 現住所（未入力）
  currentAddress: {
    postalCode: '',
    prefecture: '',
    city: '',
    streetAddress: '',
    building: '',
  },

  // 住民票住所（現住所と同じ）
  residentAddress: {
    sameAsCurrent: true,
    postalCode: '',
    prefecture: '',
    city: '',
    streetAddress: '',
    building: '',
  },

  // 緊急連絡先（未入力）
  emergencyContact: {
    name: '',
    relationship: '',
    phoneNumber: '',
    address: '',
  },

  // 社会保険（一部入力済み）
  socialInsurance: {
    pensionNumber: '1234567890',
    employmentInsuranceNumber: '',
    hasPreviousEmployer: false,
    myNumberCardInsurance: true,
  },

  // マイナンバー（未提出）
  myNumberSubmitted: false,

  // その他提出書類（一部入力済み）
  documents: {
    currentYearIncome: false,
    residentTax: 'exempt', // 新卒のため徴収なし
    healthCheckup: false,
  },

  // フォーム状態
  savedAt: '2025-10-18T00:00:00Z',
};

// ============================================================================
// 家族情報フォーム（未入力）
// ============================================================================

/**
 * 家族情報フォーム - 初期状態
 */
export const demoFamilyInfoForm: FamilyInfoForm = {
  id: 'demo-family-001',
  applicationId: 'demo-onboarding-001',
  status: 'draft',

  email: 'shinnyu@dandori.local',
  employeeNumber: '-',
  lastNameKanji: '新入',
  firstNameKanji: '太郎',

  hasSpouse: false, // 配偶者なし
  familyMembers: [], // 家族メンバーなし
};

// ============================================================================
// 給与振込口座フォーム（未入力）
// ============================================================================

/**
 * 給与振込口座フォーム - 初期状態
 */
export const demoBankAccountForm: BankAccountForm = {
  id: 'demo-bank-001',
  applicationId: 'demo-onboarding-001',
  status: 'draft',

  email: 'shinnyu@dandori.local',
  employeeNumber: '-',
  fullName: '新入 太郎',

  applicationType: 'new',
  consent: false,

  // 口座情報（未入力）
  bankName: '',
  bankCode: '',
  branchName: '',
  branchCode: '',
  accountNumber: '',
  accountHolderKana: '',
};

// ============================================================================
// 通勤経路申請フォーム（未入力）
// ============================================================================

/**
 * 通勤経路申請フォーム - 初期状態
 */
export const demoCommuteRouteForm: CommuteRouteForm = {
  id: 'demo-commute-001',
  applicationId: 'demo-onboarding-001',
  status: 'draft',

  // 確認事項（未確認）
  confirmations: {
    transportAllowanceCompliance: false,
    remoteWorkDailyCalculation: false,
    expenseDeadline: false,
    bicycleProhibition: false,
  },

  // 基本項目（未入力）
  applicationType: 'new',
  employeeNumber: '-',
  name: '新入太郎',
  address: '',

  commuteStatus: 'commute', // 通勤する想定
};

// ============================================================================
// デモデータを一括で取得する関数
// ============================================================================

/**
 * デモ用の入社申請データを全て取得
 */
export function getDemoOnboardingData() {
  return {
    application: demoOnboardingApplication,
    basicInfoForm: demoBasicInfoForm,
    familyInfoForm: demoFamilyInfoForm,
    bankAccountForm: demoBankAccountForm,
    commuteRouteForm: demoCommuteRouteForm,
  };
}

/**
 * デモデータをローカルストレージに保存
 */
export function saveDemoOnboardingDataToLocalStorage() {
  if (typeof window === 'undefined') return;

  const data = getDemoOnboardingData();

  // Application
  localStorage.setItem(
    `onboarding_application_${data.application.id}`,
    JSON.stringify(data.application)
  );

  // BasicInfoForm
  localStorage.setItem(
    `onboarding_basic_info_${data.basicInfoForm.id}`,
    JSON.stringify(data.basicInfoForm)
  );

  // FamilyInfoForm
  localStorage.setItem(
    `onboarding_family_info_${data.familyInfoForm.id}`,
    JSON.stringify(data.familyInfoForm)
  );

  // BankAccountForm
  localStorage.setItem(
    `onboarding_bank_account_${data.bankAccountForm.id}`,
    JSON.stringify(data.bankAccountForm)
  );

  // CommuteRouteForm
  localStorage.setItem(
    `onboarding_commute_route_${data.commuteRouteForm.id}`,
    JSON.stringify(data.commuteRouteForm)
  );

  console.log('[Demo] Onboarding data saved to localStorage');
}
