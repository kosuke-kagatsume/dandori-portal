/**
 * 入社ワークフロー 型定義
 *
 * このファイルには入社手続きに関連するすべての型定義が含まれます。
 * 設計書: docs/ONBOARDING_WORKFLOW_DESIGN.md
 */

// ============================================================================
// ステータス・列挙型
// ============================================================================

/**
 * 入社申請全体のステータス
 */
export type OnboardingStatus =
  | 'not_invited' // 未招待（メール未送信）
  | 'invited' // 招待済み（メール送信済み、未着手）
  | 'not_submitted' // 未提出（入力中）
  | 'submitted' // 提出済み（人事確認待ち）
  | 'returned' // 差し戻し
  | 'approved' // 承認済み
  | 'registered'; // システム登録完了

/**
 * 個別フォームのステータス
 */
export type FormStatus =
  | 'draft' // 下書き
  | 'submitted' // 提出済み
  | 'returned' // 差し戻し
  | 'approved'; // 承認済み

/**
 * 性別
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * 申請区分
 */
export type ApplicationType = 'new' | 'change';

/**
 * 通勤ステータス
 */
export type CommuteStatus = 'commute' | 'full_remote';

/**
 * 通勤方法
 */
export type CommuteMethod = 'walk' | 'public_transit' | 'private_car';

/**
 * 距離区分
 */
export type DistanceCategory = '2km_or_more' | 'less_than_2km';

/**
 * 最寄り駅までの通勤方法
 */
export type StationAccessMethod = 'walk' | 'private_car';

// ============================================================================
// 住所
// ============================================================================

/**
 * 住所情報
 */
export interface Address {
  postalCode: string; // 郵便番号（例: 100-0001）
  prefecture: string; // 都道府県
  city: string; // 市区町村
  streetAddress: string; // 丁目・番地
  building?: string; // マンション・ビル等（任意）
}

/**
 * 住民票住所
 */
export interface ResidentAddress {
  sameAsCurrent: boolean; // 現住所と同じ
  postalCode?: string;
  prefecture?: string;
  city?: string;
  streetAddress?: string;
  building?: string;
}

// ============================================================================
// 緊急連絡先
// ============================================================================

/**
 * 緊急連絡先情報
 */
export interface EmergencyContact {
  name: string; // 氏名
  relationship: string; // 続柄
  phoneNumber: string; // 電話番号
  address: string; // 住所
}

// ============================================================================
// 社会保険・雇用保険
// ============================================================================

/**
 * 前職情報
 */
export interface PreviousEmployer {
  name: string; // 事業所名
  address: string; // 所在地
  retirementDate: string; // 退職年月日（ISO 8601形式）
}

/**
 * 社会保険・雇用保険情報
 */
export interface SocialInsurance {
  pensionNumber: string; // 基礎年金番号（10桁、ハイフンなし）
  employmentInsuranceNumber?: string; // 雇用保険被保険者番号（11桁、任意）
  hasPreviousEmployer: boolean; // 前職の有無
  previousEmployer?: PreviousEmployer; // 前職情報
  myNumberCardInsurance: boolean; // マイナ保険証利用予定
}

/**
 * その他提出書類
 */
export interface DocumentSubmission {
  currentYearIncome: boolean; // 入社年の給与・賞与収入の有無
  residentTax: 'withholding' | 'no_withholding' | 'exempt'; // 住民税
  healthCheckup: boolean; // 1年以内の健康診断結果の有無
}

// ============================================================================
// 家族情報
// ============================================================================

/**
 * 家族メンバー情報
 */
export interface FamilyMember {
  nameKanji: string; // 氏名（漢字）
  nameKana: string; // 氏名（カナ）
  relationship: string; // 続柄
  birthDate: string; // 生年月日（ISO 8601形式）
  liveTogether: boolean; // 同居の有無

  // 税控除関連
  isSameHouseholdSpouse: boolean; // 同一生計配偶者の判定
  incomeTaxDependent: boolean; // 所得税上の扶養の有無
  healthInsuranceDependent: boolean; // 健康保険上の扶養加入の有無

  // 住所・職業
  address?: string; // 住所（別居の場合のみ）
  cityNameKana?: string; // 市区町村名（カナ）
  occupation: string; // 職業
  annualIncome: number; // 年間の見込み収入額
}

// ============================================================================
// 通勤経路
// ============================================================================

/**
 * 通勤経路申請の確認事項
 */
export interface CommuteConfirmations {
  transportAllowanceCompliance: boolean; // 通勤手当は就業規則に従う
  remoteWorkDailyCalculation: boolean; // 在宅勤務時の日割り計算
  expenseDeadline: boolean; // 経費精算締切
  bicycleProhibition: boolean; // 自転車通勤禁止
}

/**
 * 公共交通機関の情報
 */
export interface PublicTransitInfo {
  oneWayFare: number; // 片道交通費（IC料金）
  monthlyPass: number; // 1ヶ月定期代
  nearestStation: string; // 自宅最寄り駅
  workStation: string; // 勤務先最寄り駅
  via1?: string; // 経由駅①
  via2?: string; // 経由駅②
  via3?: string; // 経由駅③
  homeToStationDistance: number; // 自宅から最寄り駅までの距離（km）
  stationToWorkMethod: StationAccessMethod; // 最寄り駅までの通勤方法
}

/**
 * マイカー通勤の情報
 */
export interface PrivateCarInfo {
  pledge: boolean; // 誓約事項
  driversLicense: string; // 運転免許証（ファイルパスまたはURL）
  carModel: string; // メーカー・車名（例: トヨタ・プリウス）
  licensePlate: string; // ナンバープレート（例: 滋賀 500 さ 12-34）
  compulsoryInsurance: string; // 自賠責保険証（ファイルパスまたはURL）
  autoInsurance: string; // 自動車保険証券（ファイルパスまたはURL）
}

// ============================================================================
// 4つのフォーム
// ============================================================================

/**
 * 入社案内フォーム（基本情報）
 * 39項目
 */
export interface BasicInfoForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  // 基本情報
  email: string;
  hireDate: string; // 入社日（ISO 8601形式）

  // 氏名
  lastNameKanji: string;
  firstNameKanji: string;
  lastNameKana: string;
  firstNameKana: string;

  // 個人情報
  birthDate: string; // 生年月日（ISO 8601形式）
  gender: Gender;
  phoneNumber: string;
  personalEmail: string;

  // 貸与品受け取り
  equipmentPickupTime?: string;

  // 現住所
  currentAddress: Address;

  // 住民票住所
  residentAddress: ResidentAddress;

  // 緊急連絡先
  emergencyContact: EmergencyContact;

  // 社会保険・雇用保険
  socialInsurance: SocialInsurance;

  // マイナンバー（暗号化）
  myNumber?: string;
  myNumberEncrypted?: {
    encrypted: string; // 暗号化されたデータ
    iv: string; // 初期化ベクトル
    tag: string; // 認証タグ
  };
  myNumberSubmitted: boolean;

  // その他提出書類
  documents: DocumentSubmission;

  // フォーム状態
  savedAt?: string; // 一時保存日時
  submittedAt?: string; // 提出日時
  reviewComment?: string; // 人事コメント
  returnedAt?: string; // 差し戻し日時
  approvedAt?: string; // 承認日時
  approvedBy?: string; // 承認者ID
}

/**
 * 家族情報フォーム
 * 配偶者+最大6名の家族
 */
export interface FamilyInfoForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  email: string;
  employeeNumber?: string; // 従業員番号（不明時は「-」）
  lastNameKanji: string;
  firstNameKanji: string;

  hasSpouse: boolean; // 配偶者の有無
  spouse?: FamilyMember; // 配偶者情報
  familyMembers: FamilyMember[]; // 家族①〜⑥（最大6名）

  // フォーム状態
  savedAt?: string;
  submittedAt?: string;
  reviewComment?: string;
  returnedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

/**
 * 給与等支払先口座フォーム
 * 11項目
 */
export interface BankAccountForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  email: string;
  employeeNumber?: string;
  fullName: string; // 氏名（苗字と名前の間に全角スペース）

  applicationType: ApplicationType; // 申請区分
  consent: boolean; // 口座振込同意

  // 口座情報
  bankName: string;
  bankCode: string; // 4桁数字
  branchName: string;
  branchCode: string; // 3桁数字
  accountNumber: string; // 7桁数字
  accountHolderKana: string; // 全角カナ、スペース区切り

  // フォーム状態
  savedAt?: string;
  submittedAt?: string;
  reviewComment?: string;
  returnedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

/**
 * 通勤経路申請フォーム
 * 27項目+（通勤方法により追加）
 */
export interface CommuteRouteForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  // 確認事項
  confirmations: CommuteConfirmations;

  // 基本項目
  applicationType: ApplicationType;
  employeeNumber?: string;
  name: string;
  address: string; // 都道府県から記載

  commuteStatus: CommuteStatus; // 通勤可/フルリモート

  // 通勤経路・方法
  route?: string;
  googleMapScreenshot?: string; // ファイルパスまたはURL
  distance?: number; // 通勤距離（km）
  distanceNote?: string;
  homeToOfficeDistance?: DistanceCategory;
  commuteMethod?: CommuteMethod;

  // 公共交通機関の場合
  publicTransit?: PublicTransitInfo;

  // マイカーの場合
  privateCar?: PrivateCarInfo;

  // フォーム状態
  savedAt?: string;
  submittedAt?: string;
  reviewComment?: string;
  returnedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

// ============================================================================
// 入社申請全体
// ============================================================================

/**
 * 入社申請全体
 */
export interface OnboardingApplication {
  id: string;
  employeeId?: string; // 従業員ID（採番前はnull）
  applicantEmail: string; // 申請者メールアドレス
  applicantName: string; // 申請者氏名（表示用）
  hireDate: string; // 入社日（ISO 8601形式）
  status: OnboardingStatus; // 全体ステータス

  // タイムスタンプ
  createdAt: string;
  updatedAt: string;
  invitedAt?: string; // 招待メール送信日時

  // 4フォームへの参照
  basicInfoFormId: string;
  familyInfoFormId: string;
  bankAccountFormId: string;
  commuteRouteFormId: string;

  // 進捗管理
  submittedAt?: string; // 全フォーム提出日時
  reviewedAt?: string; // 人事確認完了日時
  approvedAt?: string; // 承認日時
  approvedBy?: string; // 承認者ID

  // 期限管理
  deadline: string; // 提出期限（ISO 8601形式）
  reminderSentAt?: string; // リマインダー送信日時

  // アクセストークン
  accessToken: string; // 48文字のランダム文字列

  // 組織情報
  department?: string; // 所属部門
  position?: string; // 役職

  // メモ
  hrNotes?: string; // 人事メモ
}

// ============================================================================
// 承認履歴
// ============================================================================

/**
 * 承認アクション
 */
export type ApprovalAction = 'submit' | 'return' | 'approve' | 'edit';

/**
 * フォーム種別
 */
export type FormType = 'basic_info' | 'family_info' | 'bank_account' | 'commute_route';

/**
 * 承認履歴
 */
export interface ApprovalHistory {
  id: string;
  applicationId: string;
  formType: FormType;
  action: ApprovalAction;
  performedBy: string; // 実行者ID
  performedByName: string; // 実行者名（表示用）
  performedAt: string; // 実行日時（ISO 8601形式）
  comment?: string; // コメント
  changes?: Record<string, unknown>; // 変更内容（編集時）
}

// ============================================================================
// ユーティリティ型
// ============================================================================

/**
 * フォーム進捗情報
 */
export interface FormProgress {
  formType: FormType;
  formName: string; // 表示名
  status: FormStatus;
  estimatedTime: string; // 所要時間（例: "約5分"）
  requiredDocuments: string[]; // 必要書類
  submittedAt?: string;
  approvedAt?: string;
}

/**
 * 入社申請の進捗サマリー
 */
export interface OnboardingProgress {
  applicationId: string;
  completedForms: number; // 完了したフォーム数
  totalForms: number; // 総フォーム数
  progressPercentage: number; // 進捗率（0-100）
  forms: FormProgress[]; // 各フォームの進捗
  nextAction?: string; // 次のアクション
  daysUntilDeadline: number; // 期限までの日数
}

/**
 * 暗号化されたデータ
 */
export interface EncryptedData {
  encrypted: string; // Base64エンコードされた暗号化データ
  iv: string; // Base64エンコードされた初期化ベクトル
  tag: string; // Base64エンコードされた認証タグ
}

/**
 * マイナンバーアクセスログ
 */
export interface MyNumberAuditLog {
  id: string;
  employeeId: string; // 対象従業員
  accessedBy: string; // アクセス者
  accessType: 'view' | 'edit' | 'export'; // アクセス種別
  accessedAt: string; // アクセス日時
  ipAddress: string; // IPアドレス
  userAgent: string; // ブラウザ情報
  purpose?: string; // アクセス目的（任意入力）
}

// ============================================================================
// リクエスト・レスポンス型（API用）
// ============================================================================

/**
 * 入社申請作成リクエスト
 */
export interface CreateOnboardingApplicationRequest {
  applicantName: string;
  applicantEmail: string;
  hireDate: string;
  deadline: string;
  department?: string;
  position?: string;
}

/**
 * フォーム提出リクエスト
 */
export interface SubmitFormRequest {
  applicationId: string;
  formType: FormType;
  formData: BasicInfoForm | FamilyInfoForm | BankAccountForm | CommuteRouteForm;
}

/**
 * 承認リクエスト
 */
export interface ApproveFormRequest {
  applicationId: string;
  formType: FormType;
  approvedBy: string;
  comment?: string;
}

/**
 * 差し戻しリクエスト
 */
export interface ReturnFormRequest {
  applicationId: string;
  formType: FormType;
  returnedBy: string;
  comment: string; // 差し戻し理由は必須
}

/**
 * 催促メール送信リクエスト
 */
export interface SendReminderRequest {
  applicationId: string;
  sendEmail: boolean;
  sendChatwork: boolean;
  customMessage?: string;
}

// ============================================================================
// フィルター・検索
// ============================================================================

/**
 * 入社申請フィルター
 */
export interface OnboardingApplicationFilter {
  status?: OnboardingStatus | OnboardingStatus[];
  department?: string;
  hireDate?: {
    from?: string;
    to?: string;
  };
  deadline?: {
    from?: string;
    to?: string;
  };
  searchQuery?: string; // 名前・メールで検索
}

/**
 * ソート順
 */
export type SortOrder = 'asc' | 'desc';

/**
 * ソート設定
 */
export interface SortConfig {
  field: keyof OnboardingApplication;
  order: SortOrder;
}

// ============================================================================
// 統計情報
// ============================================================================

/**
 * 入社申請統計
 */
export interface OnboardingStatistics {
  total: number; // 総数
  notInvited: number; // 未招待
  invited: number; // 招待済み
  notSubmitted: number; // 未提出
  submitted: number; // 提出済み
  returned: number; // 差し戻し
  approved: number; // 承認済み
  registered: number; // 登録完了
  overdue: number; // 期限超過
}

