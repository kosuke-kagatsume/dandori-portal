/**
 * Onboarding Forms Validation Schemas
 *
 * Zod schemas for runtime validation of onboarding forms.
 * Based on requirements from 4 Google Forms:
 * - 入社案内フォーム (39 items)
 * - 家族情報フォーム (variable items)
 * - 給与等支払先口座フォーム (11 items)
 * - 通勤経路申請フォーム (27+ items)
 */

import { z } from 'zod';

// ============================================================================
// SHARED VALIDATION PATTERNS
// ============================================================================

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('有効なメールアドレスを入力してください');

/**
 * Phone number validation (10-11 digits, hyphens optional)
 */
export const phoneSchema = z
  .string()
  .regex(/^0\d{9,10}$/, '電話番号は10桁または11桁で入力してください（ハイフンなし）')
  .or(
    z.string().regex(/^0\d{1,4}-\d{1,4}-\d{4}$/, '電話番号の形式が正しくありません')
  );

/**
 * Postal code validation (XXX-XXXX format)
 */
export const postalCodeSchema = z
  .string()
  .regex(/^\d{3}-\d{4}$/, '郵便番号は「123-4567」の形式で入力してください');

/**
 * Date string validation (ISO 8601 format)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付は「YYYY-MM-DD」の形式で入力してください');

/**
 * Katakana validation (full-width katakana only)
 */
export const katakanaSchema = z
  .string()
  .regex(/^[ァ-ヶー\s]+$/, 'カタカナで入力してください');

/**
 * Hiragana validation (for city name reading)
 */
export const hiraganaSchema = z
  .string()
  .regex(/^[ぁ-ん\s]+$/, 'ひらがなで入力してください');

/**
 * Basic pension number (10 digits, no hyphens)
 */
export const pensionNumberSchema = z
  .string()
  .regex(/^\d{10}$/, '基礎年金番号は10桁の数字で入力してください（ハイフンなし）');

/**
 * Employment insurance number (11 digits, optional)
 */
export const employmentInsuranceSchema = z
  .string()
  .regex(/^\d{11}$/, '雇用保険被保険者番号は11桁の数字で入力してください（ハイフンなし）')
  .optional()
  .or(z.literal(''));

/**
 * My Number validation (12 digits)
 */
export const myNumberSchema = z
  .string()
  .regex(/^\d{12}$/, 'マイナンバーは12桁の数字で入力してください');

/**
 * Bank code validation (4 digits)
 */
export const bankCodeSchema = z
  .string()
  .regex(/^\d{4}$/, '銀行コードは4桁の数字で入力してください');

/**
 * Branch code validation (3 digits)
 */
export const branchCodeSchema = z
  .string()
  .regex(/^\d{3}$/, '支店コードは3桁の数字で入力してください');

/**
 * Account number validation (7 digits)
 */
export const accountNumberSchema = z
  .string()
  .regex(/^\d{7}$/, '口座番号は7桁の数字で入力してください');

// ============================================================================
// NESTED OBJECT SCHEMAS
// ============================================================================

/**
 * Address Schema (住所)
 */
export const addressSchema = z.object({
  postalCode: postalCodeSchema,
  prefecture: z.string().min(1, '都道府県を選択してください'),
  city: z.string().min(1, '市区町村を入力してください'),
  street: z.string().min(1, '番地を入力してください'),
  building: z.string().optional(),
});

/**
 * Resident Address Schema (住民票住所)
 */
export const residentAddressSchema = z.object({
  sameAsCurrent: z.boolean(),
  postalCode: postalCodeSchema.optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  building: z.string().optional(),
}).refine(
  (data) => {
    if (data.sameAsCurrent) return true;
    return !!(data.postalCode && data.prefecture && data.city && data.street);
  },
  {
    message: '現住所と異なる場合は、住民票住所を入力してください',
    path: ['postalCode'],
  }
);

/**
 * Emergency Contact Schema (緊急連絡先)
 */
export const emergencyContactSchema = z.object({
  name: z.string().min(1, '緊急連絡先の氏名を入力してください'),
  relationship: z.string().min(1, '続柄を入力してください'),
  phoneNumber: phoneSchema,
});

/**
 * Social Insurance Schema (社会保険)
 */
export const socialInsuranceSchema = z.object({
  hasPensionBook: z.boolean(),
  pensionNumber: z.string().optional(),
  hasEmploymentInsurance: z.boolean(),
  employmentInsuranceNumber: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasPensionBook && !data.pensionNumber) {
      return false;
    }
    if (data.pensionNumber) {
      return /^\d{10}$/.test(data.pensionNumber);
    }
    return true;
  },
  {
    message: '年金手帳を持っている場合は、基礎年金番号を入力してください',
    path: ['pensionNumber'],
  }
).refine(
  (data) => {
    if (data.hasEmploymentInsurance && !data.employmentInsuranceNumber) {
      return false;
    }
    if (data.employmentInsuranceNumber) {
      return /^\d{11}$/.test(data.employmentInsuranceNumber);
    }
    return true;
  },
  {
    message: '雇用保険被保険者証を持っている場合は、被保険者番号を入力してください',
    path: ['employmentInsuranceNumber'],
  }
);

/**
 * Document Submission Schema (提出書類)
 */
export const documentSubmissionSchema = z.object({
  pensionBook: z.boolean(),
  employmentInsuranceCard: z.boolean(),
  withholding: z.boolean(),
  myNumberCard: z.boolean(),
  commuteCertificate: z.boolean(),
  other: z.string().optional(),
});

/**
 * Family Member Schema (家族情報)
 */
export const familyMemberSchema = z.object({
  nameKanji: z.string().min(1, '氏名（漢字）を入力してください'),
  nameKana: katakanaSchema,
  relationship: z.string().min(1, '続柄を入力してください'),
  birthDate: dateStringSchema,
  liveTogether: z.boolean(),

  // Tax deductions
  isSameHouseholdSpouse: z.boolean(),
  incomeTaxDependent: z.boolean(),
  healthInsuranceDependent: z.boolean(),

  // Address (if not living together)
  address: z.string().optional(),
  cityNameKana: hiraganaSchema.optional(),

  // Occupation and income
  occupation: z.string().min(1, '職業を入力してください'),
  annualIncome: z.number().min(0, '年収は0以上で入力してください'),
}).refine(
  (data) => {
    if (!data.liveTogether && !data.address) {
      return false;
    }
    return true;
  },
  {
    message: '同居していない場合は、住所を入力してください',
    path: ['address'],
  }
).refine(
  (data) => {
    // 同一生計配偶者の条件: 年収48万円以下
    if (data.isSameHouseholdSpouse && data.annualIncome > 480000) {
      return false;
    }
    return true;
  },
  {
    message: '同一生計配偶者の年収は48万円以下である必要があります',
    path: ['annualIncome'],
  }
).refine(
  (data) => {
    // 健康保険扶養の条件: 年収130万円未満
    if (data.healthInsuranceDependent && data.annualIncome >= 1300000) {
      return false;
    }
    return true;
  },
  {
    message: '健康保険扶養の年収は130万円未満である必要があります',
    path: ['annualIncome'],
  }
);

/**
 * Public Transit Info Schema (公共交通機関)
 */
export const publicTransitInfoSchema = z.object({
  route: z.string().min(1, '経路を入力してください'),
  monthlyPassCost: z.number().min(0, '定期代を入力してください'),
  passPeriod: z.enum(['1month', '3months', '6months']),
});

/**
 * Private Car Info Schema (自家用車通勤)
 */
export const privateCarInfoSchema = z.object({
  licensePlate: z.string().min(1, 'ナンバープレートを入力してください'),
  carModel: z.string().min(1, '車種を入力してください'),
  distance: z.number().min(0, '距離を入力してください'),
  parkingLocation: z.string().min(1, '駐車場所を入力してください'),
  hasInsurance: z.boolean(),
  insuranceCompany: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasInsurance && !data.insuranceCompany) {
      return false;
    }
    return true;
  },
  {
    message: '保険に加入している場合は、保険会社名を入力してください',
    path: ['insuranceCompany'],
  }
);

// ============================================================================
// MAIN FORM SCHEMAS
// ============================================================================

/**
 * Basic Info Form Schema (入社案内フォーム - 39 items)
 */
export const basicInfoFormSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  status: z.enum(['draft', 'submitted', 'returned', 'approved']),

  // Basic info
  email: emailSchema,
  hireDate: dateStringSchema,
  lastNameKanji: z.string().min(1, '姓（漢字）を入力してください'),
  firstNameKanji: z.string().min(1, '名（漢字）を入力してください'),
  lastNameKana: katakanaSchema,
  firstNameKana: katakanaSchema,

  birthDate: dateStringSchema,
  gender: z.enum(['male', 'female', 'other']),
  phoneNumber: phoneSchema,
  personalEmail: emailSchema,
  equipmentPickupTime: z.string().optional(),

  // Addresses
  currentAddress: addressSchema,
  residentAddress: residentAddressSchema,

  // Emergency contact
  emergencyContact: emergencyContactSchema,

  // Social insurance
  socialInsurance: socialInsuranceSchema,

  // My Number (optional at form submission, required for final approval)
  myNumber: z.string().optional(),
  myNumberEncrypted: z.object({
    encrypted: z.string(),
    iv: z.string(),
    tag: z.string(),
  }).optional(),
  myNumberSubmitted: z.boolean(),

  // Documents
  documents: documentSubmissionSchema,

  // Form state
  savedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  reviewComment: z.string().optional(),
  returnedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),
});

/**
 * Family Info Form Schema (家族情報フォーム)
 */
export const familyInfoFormSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  status: z.enum(['draft', 'submitted', 'returned', 'approved']),

  email: emailSchema,
  employeeNumber: z.string().optional(),
  lastNameKanji: z.string().min(1, '姓を入力してください'),
  firstNameKanji: z.string().min(1, '名を入力してください'),

  hasSpouse: z.boolean(),
  spouse: familyMemberSchema.optional(),
  familyMembers: z.array(familyMemberSchema).max(6, '家族は最大6人まで登録できます'),

  // Form state
  savedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  reviewComment: z.string().optional(),
  returnedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasSpouse && !data.spouse) {
      return false;
    }
    return true;
  },
  {
    message: '配偶者がいる場合は、配偶者情報を入力してください',
    path: ['spouse'],
  }
);

/**
 * Bank Account Form Schema (給与等支払先口座フォーム - 11 items)
 */
export const bankAccountFormSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  status: z.enum(['draft', 'submitted', 'returned', 'approved']),

  email: emailSchema,
  employeeNumber: z.string().optional(),
  fullName: z.string().min(1, '氏名を入力してください'),
  applicationType: z.enum(['new', 'change']),
  consent: z.boolean().refine((val) => val === true, {
    message: '同意にチェックを入れてください',
  }),

  bankName: z.string().min(1, '銀行名を入力してください'),
  bankCode: bankCodeSchema,
  branchName: z.string().min(1, '支店名を入力してください'),
  branchCode: branchCodeSchema,
  accountNumber: accountNumberSchema,
  accountHolderKana: katakanaSchema,

  // Form state
  savedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  reviewComment: z.string().optional(),
  returnedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),
});

/**
 * Commute Route Form Schema (通勤経路申請フォーム - 27+ items)
 */
export const commuteRouteFormSchema = z.object({
  id: z.string(),
  applicationId: z.string(),
  status: z.enum(['draft', 'submitted', 'returned', 'approved']),

  // Confirmations (4 checkboxes)
  confirmations: z.object({
    economicalRoute: z.boolean(),
    routeChange: z.boolean(),
    reimbursementUnderstanding: z.boolean(),
    feeCalculation: z.boolean(),
  }).refine(
    (data) => {
      return data.economicalRoute && data.routeChange && data.reimbursementUnderstanding && data.feeCalculation;
    },
    {
      message: 'すべての確認事項にチェックを入れてください',
    }
  ),

  applicationType: z.enum(['new', 'change']),
  employeeNumber: z.string().optional(),
  name: z.string().min(1, '氏名を入力してください'),
  address: z.string().min(1, '住所を入力してください'),

  commuteStatus: z.enum(['commute', 'remote']),
  route: z.string().optional(),
  googleMapScreenshot: z.string().optional(), // File URL
  distance: z.number().optional(),
  distanceNote: z.string().optional(),
  homeToOfficeDistance: z.enum([
    'less_than_2km',
    '2km_to_10km',
    '10km_to_15km',
    '15km_to_25km',
    '25km_to_35km',
    '35km_to_45km',
    '45km_to_55km',
    '55km_or_more',
  ]).optional(),
  commuteMethod: z.enum(['public_transit', 'private_car', 'bicycle', 'walk', 'other']).optional(),

  publicTransit: publicTransitInfoSchema.optional(),
  privateCar: privateCarInfoSchema.optional(),

  // Form state
  savedAt: z.string().optional(),
  submittedAt: z.string().optional(),
  reviewComment: z.string().optional(),
  returnedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),
}).refine(
  (data) => {
    // If commute status is 'commute', route is required
    if (data.commuteStatus === 'commute' && !data.route) {
      return false;
    }
    return true;
  },
  {
    message: '通勤する場合は、経路を入力してください',
    path: ['route'],
  }
).refine(
  (data) => {
    // If commute method is public transit, publicTransit is required
    if (data.commuteMethod === 'public_transit' && !data.publicTransit) {
      return false;
    }
    return true;
  },
  {
    message: '公共交通機関を利用する場合は、定期代等の情報を入力してください',
    path: ['publicTransit'],
  }
).refine(
  (data) => {
    // If commute method is private car, privateCar is required
    if (data.commuteMethod === 'private_car' && !data.privateCar) {
      return false;
    }
    return true;
  },
  {
    message: '自家用車を利用する場合は、車両情報を入力してください',
    path: ['privateCar'],
  }
).refine(
  (data) => {
    // If distance is less than 2km, commute allowance should be 0
    if (data.homeToOfficeDistance === 'less_than_2km' && data.commuteMethod === 'private_car') {
      // This is allowed, but user should be aware no allowance
      return true;
    }
    return true;
  },
  {
    message: '自宅から会社までの距離が2km未満の場合、通勤手当は支給されません',
    path: ['homeToOfficeDistance'],
  }
);

/**
 * Onboarding Application Schema (統合申請)
 */
export const onboardingApplicationSchema = z.object({
  id: z.string(),
  employeeId: z.string().optional(),
  applicantEmail: emailSchema,
  applicantName: z.string().min(1, '氏名を入力してください'),
  hireDate: dateStringSchema,
  status: z.enum(['draft', 'submitted', 'returned', 'approved', 'registered']),

  createdAt: z.string(),
  updatedAt: z.string(),

  // References to 4 forms
  basicInfoFormId: z.string(),
  familyInfoFormId: z.string(),
  bankAccountFormId: z.string(),
  commuteRouteFormId: z.string(),

  // Progress tracking
  submittedAt: z.string().optional(),
  reviewedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),

  // Deadline management
  deadline: dateStringSchema,
  reminderSentAt: z.string().optional(),

  // Access control
  accessToken: z.string().min(48, 'アクセストークンは48文字以上である必要があります'),

  // Additional info
  department: z.string().optional(),
  position: z.string().optional(),
  hrNotes: z.string().optional(),
});

// ============================================================================
// FORM INPUT SCHEMAS (for React Hook Form)
// ============================================================================

/**
 * Basic Info Form Input Schema (for form validation during editing)
 */
export const basicInfoFormInputSchema = basicInfoFormSchema.partial({
  id: true,
  applicationId: true,
  status: true,
  savedAt: true,
  submittedAt: true,
  reviewComment: true,
  returnedAt: true,
  approvedAt: true,
  approvedBy: true,
  myNumberEncrypted: true,
});

/**
 * Family Info Form Input Schema
 * TODO: Define familyInfoFormSchema first
 */
// export const familyInfoFormInputSchema = familyInfoFormSchema.partial({
//   id: true,
//   applicationId: true,
//   status: true,
//   savedAt: true,
//   submittedAt: true,
//   reviewComment: true,
//   returnedAt: true,
//   approvedAt: true,
//   approvedBy: true,
// });

/**
 * Bank Account Form Input Schema
 * TODO: Define bankAccountFormSchema first
 */
// export const bankAccountFormInputSchema = bankAccountFormSchema.partial({
//   id: true,
//   applicationId: true,
//   status: true,
//   savedAt: true,
//   submittedAt: true,
//   reviewComment: true,
//   returnedAt: true,
//   approvedAt: true,
//   approvedBy: true,
// });

/**
 * Commute Route Form Input Schema
 * TODO: Define commuteRouteFormSchema first
 */
// export const commuteRouteFormInputSchema = commuteRouteFormSchema.partial({
//   id: true,
//   applicationId: true,
//   status: true,
//   savedAt: true,
//   submittedAt: true,
//   reviewComment: true,
//   returnedAt: true,
//   approvedAt: true,
//   approvedBy: true,
// });

// ============================================================================
// TYPE EXPORTS (for use with React Hook Form)
// ============================================================================

export type BasicInfoFormInput = z.infer<typeof basicInfoFormInputSchema>;
// TODO: Define these types after creating the schemas
// export type FamilyInfoFormInput = z.infer<typeof familyInfoFormInputSchema>;
// export type BankAccountFormInput = z.infer<typeof bankAccountFormInputSchema>;
// export type CommuteRouteFormInput = z.infer<typeof commuteRouteFormInputSchema>;
export type OnboardingApplicationInput = z.infer<typeof onboardingApplicationSchema>;
