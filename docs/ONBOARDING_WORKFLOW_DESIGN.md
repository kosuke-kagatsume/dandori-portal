# 入社ワークフロー システム設計書

**作成日**: 2025-10-17
**ステータス**: 設計フェーズ
**優先順位**: フェーズ3（帳票出力、マイナンバー管理の後）

---

## 📋 目次

1. [概要](#概要)
2. [現状の課題](#現状の課題)
3. [システム要件](#システム要件)
4. [データモデル](#データモデル)
5. [画面設計](#画面設計)
6. [承認フロー](#承認フロー)
7. [技術仕様](#技術仕様)
8. [実装計画](#実装計画)

---

## 📊 概要

### 目的
Googleフォームで収集している入社時の個人情報をDandori Portal内で完結させ、以下を実現：
- **新入社員**: スムーズで分かりやすい入力体験
- **人事部**: 進捗の一目把握と効率的な確認作業

### スコープ
以下4つのフォームをシステム化：
1. **入社案内**（基本情報・39項目）
2. **家族情報**（扶養確認・配偶者+最大6名）
3. **給与等支払先口座**（銀行口座・11項目）
4. **通勤経路申請**（通勤手段・経路・27項目）

---

## 🔍 現状の課題

### Googleフォームの問題点
- ❌ 進捗が把握しづらい（誰がどこまで完了しているか不明）
- ❌ 催促が手動（メール・Slackで個別連絡）
- ❌ データが分散（Googleスプレッドシート→手動でシステム入力）
- ❌ 入力ミスが多い（銀行コード、口座番号など）
- ❌ 差し戻しフローがない（修正依頼が煩雑）
- ❌ モバイル対応が不十分

### ユーザーからの要望（確認中）
- ⏳ 入力にかかる時間・負担感
- ⏳ よくある困りごと
- ⏳ スマホでの入力ニーズ
- ⏳ 一度に全部入力 vs 分割入力の希望
- ⏳ 進捗管理の具体的な方法
- ⏳ よくある入力ミス

---

## 📝 システム要件

### 機能要件

#### 1. 新入社員向け機能
- ✅ **4フォーム統合入力**
  - 1つのダッシュボードから各フォームにアクセス
  - 進捗状況の可視化（未入力・入力中・確認中・承認済み）
  - 保存・一時保存機能（途中で中断・再開可能）

- ✅ **スマホ対応**
  - レスポンシブデザイン
  - タッチ操作最適化
  - 大きいタップエリア

- ✅ **入力支援**
  - 郵便番号から住所自動入力
  - 銀行コード・支店コードのサジェスト
  - リアルタイムバリデーション
  - エラーメッセージの多言語対応

- ✅ **通知機能**
  - 差し戻し時の通知（メール・Slack）
  - 承認完了通知
  - 期限リマインダー

#### 2. 人事部向け機能
- ✅ **進捗ダッシュボード**
  - 全新入社員の進捗一覧
  - フィルター機能（未提出・確認待ち・承認済み）
  - 検索機能（氏名・入社日・部門）
  - 期限管理（提出期限の設定・アラート）

- ✅ **確認・承認機能**
  - フォーム内容の確認画面
  - 差し戻し機能（コメント付き）
  - 一括承認（複数フォーム同時承認）
  - 承認履歴の記録

- ✅ **データ管理**
  - 承認後の直接編集（履歴記録）
  - CSV/PDFエクスポート
  - マスタデータへの自動連携

#### 3. セキュリティ要件
- ✅ **アクセス制御**
  - 本人のみ自分のフォーム編集可能
  - 人事部のみ全フォーム閲覧・承認可能
  - 社労士は閲覧のみ（マイナンバー含む）

- ✅ **データ保護**
  - マイナンバー・口座番号の暗号化
  - アクセスログの記録
  - データ保持期間の管理（5年間）

---

## 🗂️ データモデル

### 1. OnboardingApplication（入社申請）

```typescript
interface OnboardingApplication {
  id: string;
  employeeId: string;           // 従業員ID（採番前はnull）
  applicantEmail: string;        // 申請者メールアドレス
  hireDate: string;              // 入社日
  status: OnboardingStatus;      // 全体ステータス
  createdAt: string;
  updatedAt: string;

  // 4フォームへの参照
  basicInfoFormId: string;       // 入社案内フォーム
  familyInfoFormId: string;      // 家族情報フォーム
  bankAccountFormId: string;     // 口座情報フォーム
  commuteRouteFormId: string;    // 通勤経路フォーム

  // 進捗管理
  submittedAt?: string;          // 全フォーム提出日時
  reviewedAt?: string;           // 人事確認完了日時
  approvedAt?: string;           // 承認日時
  approvedBy?: string;           // 承認者ID

  // 期限管理
  deadline?: string;             // 提出期限
  reminderSentAt?: string;       // リマインダー送信日時
}

type OnboardingStatus =
  | 'draft'           // 下書き（入力中）
  | 'submitted'       // 提出済み（人事確認待ち）
  | 'returned'        // 差し戻し
  | 'approved'        // 承認済み
  | 'registered';     // システム登録完了
```

### 2. BasicInfoForm（入社案内フォーム）

```typescript
interface BasicInfoForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  // 基本情報（39項目）
  email: string;                          // メールアドレス
  hireDate: string;                       // 入社日

  // 氏名
  lastNameKanji: string;                  // 苗字（漢字）
  firstNameKanji: string;                 // 名前（漢字）
  lastNameKana: string;                   // 苗字（カナ）
  firstNameKana: string;                  // 名前（カナ）

  // 個人情報
  birthDate: string;                      // 生年月日
  gender: 'male' | 'female' | 'other';   // 性別
  phoneNumber: string;                    // 電話番号
  personalEmail: string;                  // 個人メールアドレス

  // 貸与品受け取り
  equipmentPickupTime?: string;           // 貸与品受け取り希望時間

  // 住所
  currentAddress: {
    postalCode: string;                   // 郵便番号
    prefecture: string;                   // 都道府県
    city: string;                         // 市区町村
    streetAddress: string;                // 丁目・番地
    building?: string;                    // マンション/ビル等
  };

  // 住民票住所
  residentAddress: {
    sameAsCurrent: boolean;               // 現住所と同じ
    postalCode?: string;
    prefecture?: string;
    city?: string;
    streetAddress?: string;
    building?: string;
  };

  // 緊急連絡先
  emergencyContact: {
    name: string;                         // 氏名
    relationship: string;                 // 続柄
    phoneNumber: string;                  // 電話番号
    address: string;                      // 住所
  };

  // 社会保険・雇用保険
  socialInsurance: {
    pensionNumber: string;                // 基礎年金番号（10桁）
    employmentInsuranceNumber?: string;   // 雇用保険被保険者番号（11桁）
    previousEmployer?: {
      name: string;                       // 前職事業所名
      address: string;                    // 前職事業所所在地
      retirementDate: string;             // 退職年月日
    };
    myNumberCardInsurance: boolean;       // マイナ保険証利用予定
  };

  // その他提出書類
  documents: {
    currentYearIncome: boolean;           // 入社年の給与・賞与収入
    residentTax: boolean;                 // 住民税
    healthCheckup: boolean;               // 健康診断結果
  };

  // フォーム状態
  savedAt?: string;                       // 一時保存日時
  submittedAt?: string;                   // 提出日時
  reviewComment?: string;                 // 人事コメント
  returnedAt?: string;                    // 差し戻し日時
  approvedAt?: string;                    // 承認日時
}
```

### 3. FamilyInfoForm（家族情報フォーム）

```typescript
interface FamilyInfoForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  email: string;
  employeeNumber?: string;                // 従業員番号（不明時は「-」）
  lastNameKanji: string;                  // 苗字（漢字）
  firstNameKanji: string;                 // 名前（漢字）

  hasSpouse: boolean;                     // 配偶者の有無
  spouse?: FamilyMember;                  // 配偶者情報
  familyMembers: FamilyMember[];          // 家族①〜⑥（最大6名）

  savedAt?: string;
  submittedAt?: string;
  reviewComment?: string;
  returnedAt?: string;
  approvedAt?: string;
}

interface FamilyMember {
  nameKanji: string;                      // 氏名（漢字）
  nameKana: string;                       // 氏名（カナ）
  relationship: string;                   // 続柄
  birthDate: string;                      // 生年月日
  liveTogether: boolean;                  // 同居の有無

  // 税控除関連
  isSameHouseholdSpouse: boolean;         // 同一生計配偶者の判定
  incomeTaxDependent: boolean;            // 所得税上の扶養の有無
  healthInsuranceDependent: boolean;      // 健康保険上の扶養加入の有無

  // 住所・職業
  address: string;                        // 住所
  cityNameKana: string;                   // 市区町村名（カナ）
  occupation: string;                     // 職業
  annualIncome: number;                   // 年間の見込み収入額
}
```

### 4. BankAccountForm（給与等支払先口座フォーム）

```typescript
interface BankAccountForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  email: string;                          // メールアドレス
  employeeNumber?: string;                // 従業員番号（不明時は「-」）
  fullName: string;                       // 氏名（苗字と名前の間に全角スペース）

  applicationType: 'new' | 'change';      // 申請区分
  consent: boolean;                       // 口座振込同意

  // 口座情報
  bankName: string;                       // 銀行名
  bankCode: string;                       // 銀行コード（4桁）
  branchName: string;                     // 支店名
  branchCode: string;                     // 支店コード（3桁）
  accountNumber: string;                  // 口座番号（7桁）
  accountHolderKana: string;              // 口座名義（全角カナ、スペース区切り）

  savedAt?: string;
  submittedAt?: string;
  reviewComment?: string;
  returnedAt?: string;
  approvedAt?: string;
}
```

### 5. CommuteRouteForm（通勤経路申請フォーム）

```typescript
interface CommuteRouteForm {
  id: string;
  applicationId: string;
  status: FormStatus;

  // 確認事項（4つのチェックボックス）
  confirmations: {
    transportAllowanceCompliance: boolean;    // 就業規則準拠
    remoteWorkDailyCalculation: boolean;      // 在宅勤務時の日割り
    expenseDeadline: boolean;                 // 経費精算締切
    bicycleProhibition: boolean;              // 自転車通勤禁止
  };

  applicationType: 'new' | 'change';          // 申請区分
  employeeNumber?: string;                    // 従業員番号
  name: string;                               // 名前
  address: string;                            // 住所

  commuteStatus: 'commute' | 'full_remote';   // 通勤可/フルリモート

  // 通勤経路・方法
  route?: string;                             // 通勤経路
  googleMapScreenshot?: File;                 // Googleマップスクリーンショット
  distance?: number;                          // 通勤距離（km）
  distanceNote?: string;                      // 補足
  homeToOfficeDistance?: '2km_or_more' | 'less_than_2km';

  commuteMethod?: 'walk' | 'public_transit' | 'private_car';

  // 公共交通機関の場合
  publicTransit?: {
    oneWayFare: number;                       // 片道交通費（IC料金）
    monthlyPass: number;                      // 1ヶ月定期代
    nearestStation: string;                   // 自宅最寄り駅
    workStation: string;                      // 勤務先最寄り駅
    via1?: string;                            // 経由駅①
    via2?: string;                            // 経由駅②
    via3?: string;                            // 経由駅③
    homeToStationDistance: number;            // 自宅から最寄り駅までの距離
    stationToWorkMethod: 'walk' | 'private_car'; // 最寄り駅までの通勤方法
  };

  // マイカーの場合
  privateCar?: {
    pledge: boolean;                          // 誓約事項
    driversLicense: File;                     // 運転免許証
    carModel: string;                         // メーカー・車名
    licensePlate: string;                     // ナンバープレート
    compulsoryInsurance: File;                // 自賠責保険証
    autoInsurance: File;                      // 自動車保険証券
  };

  savedAt?: string;
  submittedAt?: string;
  reviewComment?: string;
  returnedAt?: string;
  approvedAt?: string;
}

type FormStatus =
  | 'draft'           // 下書き
  | 'submitted'       // 提出済み
  | 'returned'        // 差し戻し
  | 'approved';       // 承認済み
```

### 6. ApprovalHistory（承認履歴）

```typescript
interface ApprovalHistory {
  id: string;
  applicationId: string;
  formType: 'basic_info' | 'family_info' | 'bank_account' | 'commute_route';
  action: 'submit' | 'return' | 'approve' | 'edit';
  performedBy: string;                      // 実行者ID
  performedAt: string;                      // 実行日時
  comment?: string;                         // コメント
  changes?: Record<string, any>;            // 変更内容（編集時）
}
```

---

## 🎨 画面設計

### 1. 新入社員向け画面

#### 1-1. オンボーディングダッシュボード
```
┌─────────────────────────────────────────┐
│ 入社手続き進捗                            │
│                                         │
│ ━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 入力中   確認待ち   承認済み              │
│                                         │
│ 提出期限: 2025-10-25 (あと7日)           │
├─────────────────────────────────────────┤
│                                         │
│ ✅ 入社案内              【承認済み】     │
│    提出日: 2025-10-15                    │
│                                         │
│ ⏳ 家族情報              【確認待ち】     │
│    提出日: 2025-10-16                    │
│                                         │
│ ⚠️ 給与振込口座          【差し戻し】     │
│    「銀行コードを確認してください」       │
│    [修正する]                           │
│                                         │
│ 📝 通勤経路              【未提出】       │
│    [入力する]                           │
│                                         │
└─────────────────────────────────────────┘
```

#### 1-2. フォーム入力画面
- **ステップ表示**: 現在の入力位置を可視化
- **自動保存**: 30秒ごとに自動保存
- **バリデーション**: リアルタイムエラー表示
- **サジェスト**: 銀行名・支店名の候補表示

### 2. 人事部向け画面

#### 2-1. 進捗管理ダッシュボード
```
┌─────────────────────────────────────────────────────────┐
│ 入社手続き進捗管理                                         │
├─────────────────────────────────────────────────────────┤
│ 📊 統計                                                  │
│  ┌──────┬──────┬──────┬──────┐                         │
│  │ 全体 │未提出│確認待│承認済│                         │
│  │  15  │  3   │  5   │  7   │                         │
│  └──────┴──────┴──────┴──────┘                         │
├─────────────────────────────────────────────────────────┤
│ 🔍 検索: [          ]  📅 入社日: [2025-10-01 〜 10-31] │
│ 📌 ステータス: [すべて ▼]  🏢 部門: [すべて ▼]         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 👤 山田太郎        入社日: 2025-10-20  期限: あと5日    │
│    ✅ 入社案内    ✅ 家族情報    ⚠️ 口座    📝 通勤    │
│    [詳細] [催促メール送信]                              │
│                                                         │
│ 👤 佐藤花子        入社日: 2025-10-25  期限: あと10日   │
│    ✅ 入社案内    ⏳ 家族情報    📝 口座    📝 通勤    │
│    [詳細] [催促メール送信]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 2-2. フォーム確認・承認画面
- **差分表示**: 修正箇所のハイライト
- **コメント機能**: 差し戻し理由の記入
- **一括承認**: 複数フォーム同時承認
- **履歴表示**: 提出・差し戻し・承認の履歴

---

## 🔄 承認フロー

### フロー図

```
┌──────────────┐
│ 新入社員     │
│ フォーム入力 │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 自動保存     │
│ (30秒ごと)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 提出         │
│ (4フォーム)  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ 人事部           │
│ 内容確認         │
└──┬───────┬───────┘
   │       │
   │ 不備  │ OK
   │       │
   ▼       ▼
┌──────┐ ┌──────────┐
│差し戻し│ │ 承認     │
└──┬───┘ └────┬─────┘
   │            │
   │            ▼
   │      ┌──────────────┐
   │      │ マスタ登録   │
   │      │ ・従業員     │
   │      │ ・家族       │
   │      │ ・口座       │
   │      │ ・通勤経路   │
   │      └──────┬───────┘
   │            │
   │            ▼
   │      ┌──────────────┐
   │      │ 完了通知     │
   │      │ (本人・人事) │
   │      └──────────────┘
   │
   ▼
┌──────────────┐
│ 修正通知     │
│ (本人)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 再入力・提出 │
└──────────────┘
```

### 状態遷移

```typescript
// OnboardingApplicationの状態遷移
draft → submitted → [returned → submitted]* → approved → registered

// FormStatusの状態遷移
draft → submitted → [returned → submitted]* → approved
```

### 承認ルール

1. **個別承認**: 各フォームを個別に承認可能
2. **一括承認**: 4フォームすべて問題なければ一括承認可能
3. **差し戻し**: 1つでも不備があれば該当フォームのみ差し戻し
4. **再提出**: 差し戻されたフォームのみ修正・再提出
5. **承認後編集**: 人事部は承認後も直接編集可能（履歴記録）

---

## 🔧 技術仕様

### 1. フロントエンド

#### コンポーネント構成
```
src/
├── app/[locale]/
│   └── onboarding/
│       ├── page.tsx                    # ダッシュボード
│       ├── [applicationId]/
│       │   ├── page.tsx               # 申請詳細
│       │   ├── basic-info/page.tsx    # 入社案内フォーム
│       │   ├── family-info/page.tsx   # 家族情報フォーム
│       │   ├── bank-account/page.tsx  # 口座情報フォーム
│       │   └── commute-route/page.tsx # 通勤経路フォーム
│       └── admin/
│           ├── page.tsx               # 人事管理画面
│           └── [applicationId]/page.tsx # 承認画面
│
├── features/onboarding/
│   ├── components/
│   │   ├── progress-tracker.tsx       # 進捗表示
│   │   ├── form-auto-save.tsx         # 自動保存
│   │   ├── address-autocomplete.tsx   # 住所自動入力
│   │   ├── bank-code-suggest.tsx      # 銀行コードサジェスト
│   │   ├── approval-dialog.tsx        # 承認ダイアログ
│   │   └── return-dialog.tsx          # 差し戻しダイアログ
│   │
│   ├── forms/
│   │   ├── basic-info-form.tsx
│   │   ├── family-info-form.tsx
│   │   ├── bank-account-form.tsx
│   │   └── commute-route-form.tsx
│   │
│   └── hooks/
│       ├── useOnboardingApplication.ts
│       ├── useFormAutoSave.ts
│       └── useApprovalFlow.ts
│
└── lib/
    └── store/
        └── onboarding-store.ts        # Zustand Store
```

#### バリデーション

```typescript
// Zodスキーマ例
const BasicInfoFormSchema = z.object({
  email: z.string().email(),
  hireDate: z.string(),
  lastNameKanji: z.string().min(1).regex(/^[ぁ-んァ-ヶー一-龠々〆〤]+$/),
  firstNameKanji: z.string().min(1).regex(/^[ぁ-んァ-ヶー一-龠々〆〤]+$/),
  lastNameKana: z.string().min(1).regex(/^[ァ-ヶー]+$/),
  firstNameKana: z.string().min(1).regex(/^[ァ-ヶー]+$/),
  phoneNumber: z.string().regex(/^0\d{9,10}$/),
  // ... 他のフィールド
});

const BankAccountFormSchema = z.object({
  bankCode: z.string().regex(/^\d{4}$/),
  branchCode: z.string().regex(/^\d{3}$/),
  accountNumber: z.string().regex(/^\d{7}$/),
  accountHolderKana: z.string().regex(/^[ァ-ヶー\s]+$/),
  // ... 他のフィールド
});
```

### 2. バックエンド（Zustand Store）

```typescript
// src/lib/store/onboarding-store.ts
interface OnboardingStore {
  // State
  applications: OnboardingApplication[];
  currentApplication: OnboardingApplication | null;

  // Actions - 新入社員用
  createApplication: (data: Partial<OnboardingApplication>) => Promise<string>;
  saveForm: (formType: FormType, data: any) => Promise<void>;
  submitForm: (formType: FormType) => Promise<void>;
  submitAllForms: () => Promise<void>;

  // Actions - 人事部用
  getApplications: (filter?: ApplicationFilter) => OnboardingApplication[];
  approveForm: (applicationId: string, formType: FormType) => Promise<void>;
  returnForm: (applicationId: string, formType: FormType, comment: string) => Promise<void>;
  approveAll: (applicationId: string) => Promise<void>;
  editApprovedForm: (applicationId: string, formType: FormType, data: any) => Promise<void>;

  // Utility
  getProgress: (applicationId: string) => number;
  sendReminder: (applicationId: string) => Promise<void>;
  exportToMaster: (applicationId: string) => Promise<void>;
}
```

### 3. データ永続化

```typescript
// LocalStorageキー
const STORAGE_KEYS = {
  APPLICATIONS: 'onboarding_applications',
  BASIC_INFO_FORMS: 'onboarding_basic_info_forms',
  FAMILY_INFO_FORMS: 'onboarding_family_info_forms',
  BANK_ACCOUNT_FORMS: 'onboarding_bank_account_forms',
  COMMUTE_ROUTE_FORMS: 'onboarding_commute_route_forms',
  APPROVAL_HISTORY: 'onboarding_approval_history',
};

// Zustand persist設定
persist(
  (set, get) => ({
    // ... store implementation
  }),
  {
    name: STORAGE_KEYS.APPLICATIONS,
    partialize: (state) => ({
      applications: state.applications,
      // 必要なstateのみ永続化
    }),
  }
);
```

### 4. 通知機能

```typescript
// 通知トリガー
interface NotificationTrigger {
  // 新入社員向け
  onFormReturned: (applicationId: string, formType: FormType, comment: string) => void;
  onFormApproved: (applicationId: string, formType: FormType) => void;
  onAllApproved: (applicationId: string) => void;
  onDeadlineApproaching: (applicationId: string, daysLeft: number) => void;

  // 人事部向け
  onFormSubmitted: (applicationId: string, formType: FormType) => void;
  onAllFormsSubmitted: (applicationId: string) => void;
}

// メール・Slack連携（将来実装）
interface NotificationService {
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  sendSlack: (channel: string, message: string) => Promise<void>;
}
```

---

## 📅 実装計画

### Phase 1: データモデル・Store実装（2週間）
- ✅ TypeScript型定義
- ✅ Zodバリデーションスキーマ
- ✅ Zustand Store実装
- ✅ LocalStorage永続化

### Phase 2: 新入社員向けUI実装（3週間）
- ✅ オンボーディングダッシュボード
- ✅ 4フォーム実装
  - 入社案内フォーム
  - 家族情報フォーム
  - 口座情報フォーム
  - 通勤経路フォーム
- ✅ 自動保存機能
- ✅ バリデーション・エラー表示
- ✅ 住所自動入力・銀行コードサジェスト

### Phase 3: 人事部向けUI実装（2週間）
- ✅ 進捗管理ダッシュボード
- ✅ フィルター・検索機能
- ✅ 承認・差し戻し機能
- ✅ 履歴表示
- ✅ CSV/PDFエクスポート

### Phase 4: 通知・マスタ連携（1週間）
- ✅ 通知機能（アプリ内通知）
- ✅ メール通知（将来: SendGrid連携）
- ✅ Slack通知（将来: Slack API連携）
- ✅ マスタデータ自動登録

### Phase 5: テスト・改善（1週間）
- ✅ E2Eテスト
- ✅ バリデーション検証
- ✅ パフォーマンス最適化
- ✅ アクセシビリティ改善

**総期間: 9週間（約2ヶ月）**

---

## 🔍 未確認事項（ユーザーフィードバック待ち）

### UX要件
- ⏳ 新入社員の入力にかかる平均時間
- ⏳ よくある困りごと・つまずきポイント
- ⏳ スマホでの入力実態
- ⏳ 一括入力 vs 分割入力の希望
- ⏳ よくある入力ミスのパターン

### 人事部要件
- ⏳ 現在の進捗把握方法の詳細
- ⏳ 同時管理する新入社員数
- ⏳ 提出期限の設定ルール
- ⏳ 催促のタイミング・方法
- ⏳ 理想の進捗可視化方法

### 追加機能検討
- ⏳ 書類アップロード機能の要否（運転免許証、保険証等）
- ⏳ 電子署名の要否
- ⏳ 多言語対応の優先度（英語・中国語等）
- ⏳ API連携（MFクラウド等）の要否

---

## 📚 参考情報

### 関連ドキュメント
- `/docs/PAYROLL_REQUIREMENTS_v2.md` - 全体要件定義
- `/Users/dw100/Downloads/入社案内.pdf` - 入社案内フォーム（39項目）
- `/Users/dw100/Downloads/家族情報（扶養の確認）.pdf` - 家族情報フォーム
- `/Users/dw100/Downloads/給与等支払先口座.pdf` - 口座情報フォーム（11項目）
- `/Users/dw100/Downloads/通勤経路申請.pdf` - 通勤経路フォーム（27項目）

### 技術スタック
- **フロントエンド**: Next.js 14, React 18, TypeScript
- **状態管理**: Zustand (persist)
- **バリデーション**: Zod
- **UI**: Radix UI, Tailwind CSS
- **フォーム**: React Hook Form
- **通知**: 既存通知システム（src/lib/store/notification-store.ts）

---

**次のステップ**: ユーザーからのUX要件フィードバックを受けて、詳細設計・実装を開始
