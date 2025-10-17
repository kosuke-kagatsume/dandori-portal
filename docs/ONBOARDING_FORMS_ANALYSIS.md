# 入社フォーム詳細分析

**作成日**: 2025-10-17
**ソース**: Googleフォーム PDF（4ファイル）

---

## 📋 目次

1. [フォーム概要](#フォーム概要)
2. [入社案内フォーム（39項目）](#入社案内フォーム)
3. [家族情報フォーム](#家族情報フォーム)
4. [給与等支払先口座フォーム（11項目）](#給与等支払先口座フォーム)
5. [通勤経路申請フォーム（27項目）](#通勤経路申請フォーム)
6. [バリデーションルール](#バリデーションルール)
7. [ビジネスロジック](#ビジネスロジック)

---

## 🎯 フォーム概要

### 合計項目数
- **入社案内**: 39項目
- **家族情報**: 可変（配偶者の有無により13〜最大93項目）
- **給与等支払先口座**: 11項目
- **通勤経路申請**: 27項目（基本）+ 通勤方法により追加項目

**総計: 約90〜160項目**

### 所要時間（推定）
- 入社案内: 15〜20分
- 家族情報: 10〜30分（家族構成により）
- 給与振込口座: 5分
- 通勤経路: 10〜15分（公共交通機関）/ 15〜20分（マイカー）

**合計: 40〜75分**

---

## 📝 入社案内フォーム

### 基本項目（39項目）

#### 1. メールアドレス・入社日
```typescript
{
  email: string;              // メールアドレス（必須）
  hireDate: string;           // 入社日（必須）
}
```

#### 2. 氏名（4項目）
```typescript
{
  lastNameKanji: string;      // 苗字（漢字）（必須、全角）
  firstNameKanji: string;     // 名前（漢字）（必須、全角）
  lastNameKana: string;       // 苗字（カナ）（必須、全角カナ）
  firstNameKana: string;      // 名前（カナ）（必須、全角カナ）
}
```

#### 3. 生年月日・性別・連絡先（4項目）
```typescript
{
  birthDate: string;          // 生年月日（必須）
  gender: '男性' | '女性';    // 性別（必須）
  phoneNumber: string;        // 電話番号（必須）
  personalEmail: string;      // メールアドレス（本人開封可能なもの）（必須）
}
```

#### 4. 貸与品受け取り（1項目）
```typescript
{
  equipmentPickupTime: string; // 貸与品受け取り時間希望（選択式）
  // 選択肢: 10:00〜10:30 / 10:30〜11:00 / ... / 17:00〜17:30
}
```

#### 5. 現住所（5項目）
```typescript
{
  currentAddress: {
    postalCode: string;       // 郵便番号（必須、ハイフンあり）
    prefecture: string;       // 都道府県（必須、選択式47都道府県）
    city: string;             // 市区町村（必須）
    streetAddress: string;    // 丁目・番地（必須）
    building?: string;        // マンション・ビル等（任意）
  }
}
```

#### 6. 住民票住所（6項目、条件分岐あり）
```typescript
{
  residentAddress: {
    sameAsCurrent: '現住所と同様' | '相違あり'; // （必須）

    // 「相違あり」の場合のみ以下を入力
    postalCode?: string;      // 郵便番号
    prefecture?: string;      // 都道府県
    city?: string;            // 市区町村
    streetAddress?: string;   // 丁目・番地
    building?: string;        // マンション・ビル等
  }
}
```

#### 7. 緊急連絡先（4項目）
```typescript
{
  emergencyContact: {
    name: string;             // 氏名（必須、全角）
    relationship: string;     // 続柄（必須）
    phoneNumber: string;      // 電話番号（必須）
    address: string;          // 住所（必須）
  }
}
```

#### 8. 社会保険・雇用保険（10項目）
```typescript
{
  socialInsurance: {
    // 基礎年金番号
    pensionNumber: string;    // 10桁、ハイフンなし（必須）

    // 雇用保険被保険者番号
    employmentInsuranceNumber?: string; // 11桁、ハイフンなし（任意、「ない場合は記入不要」）

    // 前職について
    hasPreviousEmployer: 'あり' | 'なし'; // （必須）

    // 「あり」の場合のみ
    previousEmployer?: {
      name: string;           // 前職事業所名
      address: string;        // 前職事業所所在地
      retirementDate: string; // 退職年月日
    };

    // マイナ保険証
    myNumberCardInsurance: 'はい' | 'いいえ'; // マイナ保険証利用予定（必須）
  }
}
```

#### 9. その他提出書類（3項目）
```typescript
{
  documents: {
    // 入社年（2025年）に給与・賞与収入がありますか？
    currentYearIncome: 'はい（源泉徴収票を提出）' | 'いいえ'; // （必須）

    // 住民税について
    residentTax: '給与天引きあり' | '給与天引きなし' | '非課税'; // （必須）

    // 健康診断結果
    healthCheckup: '1年以内の結果あり' | '1年以内の結果なし'; // （必須）
  }
}
```

### 重要な注記
- 「苗字と名前の間に全角スペースを入れてください」
- 「戸籍と同じ記載をしてください」
- 「基礎年金番号は10桁、ハイフンなし」
- 「雇用保険被保険者番号は11桁、ハイフンなし」

---

## 👨‍👩‍👧‍👦 家族情報フォーム

### 基本項目（3項目）
```typescript
{
  email: string;              // メールアドレス（必須）
  employeeNumber?: string;    // 従業員番号（不明な場合は「-」）
  lastNameKanji: string;      // 苗字（漢字）（必須、全角、戸籍と同じ）
  firstNameKanji: string;     // 名前（漢字）（必須、全角）
}
```

### 配偶者の有無（1項目）
```typescript
{
  hasSpouse: 'あり' | 'なし'; // （必須）
}
```

### 配偶者情報（12項目、hasSpouse='あり'の場合のみ）
```typescript
interface SpouseInfo {
  nameKanji: string;          // 氏名（漢字）（必須）
  nameKana: string;           // 氏名（カナ）（必須、全角カナ）
  relationship: string;       // 続柄（必須）
  birthDate: string;          // 生年月日（必須）
  liveTogether: 'あり' | 'なし'; // 同居の有無（必須）

  // 税控除関連
  isSameHouseholdSpouse: 'はい' | 'いいえ'; // 同一生計配偶者の判定（必須）
  // ※ 2025年の年間の合計所得金額が48万円以下

  incomeTaxDependent: 'はい' | 'いいえ'; // 所得税上の扶養の有無（必須）
  // ※ 配偶者控除・配偶者特別控除を受けたい場合「はい」
  // ※ 納税義務者の前年の合計所得金額が1,000万円以下である場合のみ

  healthInsuranceDependent: 'はい' | 'いいえ'; // 健康保険上の扶養加入の有無（必須）
  // ※ 合計所得金額が130万円を超える場合加入できません

  address: string;            // 住所（必須、都道府県から記載）
  cityNameKana: string;       // 市区町村名（カナ）（必須、全角カナ）
  occupation: string;         // 職業（必須）
  annualIncome: number;       // 年間の見込み収入額（必須）
}
```

### 家族①〜⑥（各12項目×最大6名 = 最大72項目）
- 上記と同じ構造
- 任意入力（0〜6名まで）

### 重要なビジネスロジック

#### 同一生計配偶者の判定
```typescript
// 2025年の年間の合計所得金額が48万円以下の場合「はい」
function isSameHouseholdSpouse(annualIncome: number): boolean {
  return annualIncome <= 480000;
}
```

#### 配偶者控除の条件
```typescript
// 以下の両方を満たす場合のみ適用可能
// 1. 配偶者の年間所得が48万円以下
// 2. 納税義務者の前年の合計所得金額が1,000万円以下
function canApplySpouseDeduction(
  spouseIncome: number,
  taxpayerIncome: number
): boolean {
  return spouseIncome <= 480000 && taxpayerIncome <= 10000000;
}
```

#### 健康保険扶養の条件
```typescript
// 年間見込み収入が130万円未満の場合のみ加入可能
function canJoinHealthInsurance(annualIncome: number): boolean {
  return annualIncome < 1300000;
}
```

---

## 💰 給与等支払先口座フォーム

### 全項目（11項目）

```typescript
interface BankAccountForm {
  email: string;              // メールアドレス（必須）
  employeeNumber?: string;    // 従業員番号（不明な場合は「-」）

  fullName: string;           // 氏名（必須）
  // ※ 戸籍と同じ記載、苗字と名前の間に全角スペースを入れてください

  applicationType: '新規申請' | '変更申請'; // 申請区分（必須）

  consent: boolean;           // 口座振込同意（必須、チェックボックス）
  // ※ 「給与等の銀行口座への振込に同意します」

  // 銀行情報
  bankName: string;           // 銀行名（必須）
  bankCode: string;           // 銀行コード（必須、4桁数字）
  branchName: string;         // 支店名（必須）
  branchCode: string;         // 支店コード（必須、3桁数字）
  accountNumber: string;      // 口座番号（必須、7桁数字）

  accountHolderKana: string;  // 口座名義（カナ）（必須）
  // ※ 全角カナ、苗字と名前の間に全角スペースを入れてください
}
```

### バリデーションルール

```typescript
const BankAccountFormValidation = {
  bankCode: {
    pattern: /^\d{4}$/,
    message: '銀行コードは4桁の数字を入力してください'
  },
  branchCode: {
    pattern: /^\d{3}$/,
    message: '支店コードは3桁の数字を入力してください'
  },
  accountNumber: {
    pattern: /^\d{7}$/,
    message: '口座番号は7桁の数字を入力してください'
  },
  accountHolderKana: {
    pattern: /^[ァ-ヶー\s]+$/,
    message: '全角カタカナで入力してください（スペースも全角）'
  },
  fullName: {
    pattern: /^[^\s]+\s[^\s]+$/,
    message: '苗字と名前の間に全角スペースを入れてください'
  }
};
```

---

## 🚗 通勤経路申請フォーム

### 確認事項（4項目、全て必須チェックボックス）
```typescript
{
  confirmations: {
    transportAllowanceCompliance: boolean;
    // 「通勤手当は就業規則に従い支払います」

    remoteWorkDailyCalculation: boolean;
    // 「在宅勤務等をする場合、出社日数にて日割計算となります」

    expenseDeadline: boolean;
    // 「経費精算システムで当月の通勤手当は翌月2営業日までに申請必須」

    bicycleProhibition: boolean;
    // 「自転車通勤は原則禁止です」
  }
}
```

### 基本項目（6項目）
```typescript
{
  applicationType: '新規申請' | '変更申請'; // （必須）
  employeeNumber?: string;    // 従業員番号（不明な場合は「-」）
  name: string;               // 名前（必須）
  address: string;            // 住所（必須、都道府県から記載）

  commuteStatus: '通勤可' | '通勤不可（フルリモート）'; // （必須）
}
```

### 通勤経路・方法（7項目、commuteStatus='通勤可'の場合のみ）
```typescript
{
  route: string;              // 通勤経路（必須）

  googleMapScreenshot: File;  // Googleマップスクリーンショット（必須）
  // ※ 片道通勤時間及び片道距離が表示されたもの

  distance: number;           // 通勤距離（必須、km、小数点第一位まで）
  distanceNote?: string;      // 補足（任意）

  homeToOfficeDistance: '2km以上' | '2km未満'; // （必須）

  commuteMethod: '徒歩' | '公共交通機関（電車・バス）' | 'マイカー'; // （必須）
}
```

### 公共交通機関の場合（10項目追加）
```typescript
{
  publicTransit: {
    oneWayFare: number;       // 片道交通費（IC料金）（必須）
    monthlyPass: number;      // 1ヶ月の定期代（必須）

    nearestStation: string;   // 自宅最寄り駅（必須）
    // ※ 路線名、駅名・バス停留所を記載

    workStation: string;      // 勤務先最寄り駅（必須）

    via1?: string;            // 経由駅①（任意）
    via2?: string;            // 経由駅②（任意）
    via3?: string;            // 経由駅③（任意）

    homeToStationDistance: number; // 自宅から最寄り駅までの距離（必須、km）

    stationToWorkMethod: '徒歩' | 'マイカー'; // 最寄り駅までの通勤方法（必須）
  }
}
```

### マイカーの場合（6項目 + ファイル3つ）
```typescript
{
  privateCar: {
    pledge: boolean;          // 誓約事項（必須、チェックボックス）
    // ※ 詳細な誓約文あり（保険加入、安全運転等）

    driversLicense: File;     // 運転免許証（必須、画像アップロード）

    carModel: string;         // メーカー・車名（必須）
    // ※ 例: トヨタ・プリウス

    licensePlate: string;     // ナンバープレート（必須）
    // ※ 例: 滋賀 500 さ 12-34

    compulsoryInsurance: File; // 自賠責保険証（必須、画像アップロード）
    autoInsurance: File;      // 自動車保険証券（必須、画像アップロード）
  }
}
```

### 重要なビジネスロジック（就業規則第132条）

#### 通勤手当の支給基準
```typescript
interface CommuteAllowance {
  method: 'electric_bus' | 'private_car';
  distance: '2km_or_more' | 'less_than_2km';
  allowance: number | 'none';
}

// 電車・バスの場合
function calculatePublicTransitAllowance(distance: string): string {
  if (distance === '2km_or_more') {
    return '1ヶ月分の定期代相当額を支給';
  } else {
    return '支給なし';
  }
}

// マイカーの場合
function calculatePrivateCarAllowance(distance: string): string {
  if (distance === '2km_or_more') {
    return '非課税限度額を支給（国税庁 No.2585）';
  } else {
    return '支給なし';
  }
}

// 片道2km未満でマイカー利用の場合の特別計算
function calculateDailyCommuteAllowance(
  monthlyAllowance: number,
  averageWorkingDays: number,
  actualWorkingDays: number
): number {
  return (monthlyAllowance / averageWorkingDays) * actualWorkingDays;
}
```

#### 非課税限度額（国税庁基準）
```typescript
// 距離に応じた非課税限度額（月額）
const TAX_EXEMPT_LIMITS: Record<string, number> = {
  '2km未満': 0,
  '2km以上10km未満': 4200,
  '10km以上15km未満': 7100,
  '15km以上25km未満': 12900,
  '25km以上35km未満': 18700,
  '35km以上45km未満': 24400,
  '45km以上55km未満': 28000,
  '55km以上': 31600,
};

function getTaxExemptLimit(distance: number): number {
  if (distance < 2) return TAX_EXEMPT_LIMITS['2km未満'];
  if (distance < 10) return TAX_EXEMPT_LIMITS['2km以上10km未満'];
  if (distance < 15) return TAX_EXEMPT_LIMITS['10km以上15km未満'];
  if (distance < 25) return TAX_EXEMPT_LIMITS['15km以上25km未満'];
  if (distance < 35) return TAX_EXEMPT_LIMITS['25km以上35km未満'];
  if (distance < 45) return TAX_EXEMPT_LIMITS['35km以上45km未満'];
  if (distance < 55) return TAX_EXEMPT_LIMITS['45km以上55km未満'];
  return TAX_EXEMPT_LIMITS['55km以上'];
}
```

---

## ✅ バリデーションルール

### 共通ルール

```typescript
const VALIDATION_RULES = {
  // メールアドレス
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '有効なメールアドレスを入力してください'
  },

  // 全角漢字
  kanjiName: {
    pattern: /^[ぁ-んァ-ヶー一-龠々〆〤]+$/,
    message: '全角漢字で入力してください'
  },

  // 全角カタカナ
  kanaName: {
    pattern: /^[ァ-ヶー]+$/,
    message: '全角カタカナで入力してください'
  },

  // 電話番号（ハイフンなし）
  phoneNumber: {
    pattern: /^0\d{9,10}$/,
    message: '10桁または11桁の数字を入力してください（ハイフンなし）'
  },

  // 郵便番号（ハイフンあり）
  postalCode: {
    pattern: /^\d{3}-\d{4}$/,
    message: '郵便番号は「000-0000」の形式で入力してください'
  },

  // 基礎年金番号（10桁、ハイフンなし）
  pensionNumber: {
    pattern: /^\d{10}$/,
    message: '基礎年金番号は10桁の数字を入力してください（ハイフンなし）'
  },

  // 雇用保険被保険者番号（11桁、ハイフンなし）
  employmentInsuranceNumber: {
    pattern: /^\d{11}$/,
    message: '雇用保険被保険者番号は11桁の数字を入力してください（ハイフンなし）'
  },

  // 銀行コード（4桁）
  bankCode: {
    pattern: /^\d{4}$/,
    message: '銀行コードは4桁の数字を入力してください'
  },

  // 支店コード（3桁）
  branchCode: {
    pattern: /^\d{3}$/,
    message: '支店コードは3桁の数字を入力してください'
  },

  // 口座番号（7桁）
  accountNumber: {
    pattern: /^\d{7}$/,
    message: '口座番号は7桁の数字を入力してください'
  },
};
```

### フィールド間バリデーション

```typescript
// 配偶者情報の整合性チェック
function validateSpouseInfo(spouse: SpouseInfo): string[] {
  const errors: string[] = [];

  // 所得と扶養の整合性
  if (spouse.incomeTaxDependent === 'はい' && spouse.annualIncome > 480000) {
    errors.push('所得税上の扶養に該当する場合、年間収入は48万円以下である必要があります');
  }

  // 健康保険扶養の整合性
  if (spouse.healthInsuranceDependent === 'はい' && spouse.annualIncome >= 1300000) {
    errors.push('健康保険扶養に加入する場合、年間収入は130万円未満である必要があります');
  }

  return errors;
}

// 通勤手当の整合性チェック
function validateCommuteAllowance(form: CommuteRouteForm): string[] {
  const errors: string[] = [];

  if (form.commuteMethod === 'public_transit' && form.publicTransit) {
    // 定期代が片道運賃の妥当性をチェック
    const expectedMonthlyPass = form.publicTransit.oneWayFare * 2 * 20; // 概算
    if (form.publicTransit.monthlyPass > expectedMonthlyPass * 1.5) {
      errors.push('定期代が片道運賃から計算される金額と大きく異なります。ご確認ください。');
    }
  }

  return errors;
}
```

---

## 🔧 ビジネスロジック

### 1. 扶養控除の自動判定

```typescript
function determineDependentStatus(familyMember: FamilyMember) {
  const { annualIncome, birthDate } = familyMember;
  const age = calculateAge(birthDate);

  return {
    // 一般の扶養親族（16歳以上70歳未満）
    isGeneralDependent: age >= 16 && age < 70 && annualIncome <= 480000,

    // 特定扶養親族（19歳以上23歳未満）
    isSpecialDependent: age >= 19 && age < 23 && annualIncome <= 480000,

    // 老人扶養親族（70歳以上）
    isElderlyDependent: age >= 70 && annualIncome <= 480000,

    // 同居老親等（70歳以上で同居）
    isCohabitingElderlyDependent:
      age >= 70 && annualIncome <= 480000 && familyMember.liveTogether,
  };
}
```

### 2. 通勤手当の自動計算

```typescript
function calculateCommuteAllowance(form: CommuteRouteForm): number {
  if (form.commuteStatus === 'full_remote') {
    return 0;
  }

  if (form.homeToOfficeDistance === 'less_than_2km') {
    return 0;
  }

  if (form.commuteMethod === 'public_transit' && form.publicTransit) {
    return form.publicTransit.monthlyPass;
  }

  if (form.commuteMethod === 'private_car' && form.distance) {
    return getTaxExemptLimit(form.distance);
  }

  return 0;
}
```

### 3. 必須書類チェック

```typescript
function checkRequiredDocuments(application: OnboardingApplication): {
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // マイカー通勤の場合、3つの書類が必須
  const commuteForm = application.commuteRouteForm;
  if (commuteForm?.commuteMethod === 'private_car' && commuteForm.privateCar) {
    if (!commuteForm.privateCar.driversLicense) {
      missing.push('運転免許証');
    }
    if (!commuteForm.privateCar.compulsoryInsurance) {
      missing.push('自賠責保険証');
    }
    if (!commuteForm.privateCar.autoInsurance) {
      missing.push('自動車保険証券');
    }
  }

  // 前職ありの場合、源泉徴収票が必要
  const basicForm = application.basicInfoForm;
  if (basicForm?.documents.currentYearIncome === 'はい（源泉徴収票を提出）') {
    warnings.push('源泉徴収票の提出をお忘れなく');
  }

  return { missing, warnings };
}
```

---

## 📊 データ入力の推奨順序

### 推奨フロー
```
1. 入社案内（基本情報）
   ↓
2. 給与振込口座（簡単・早く終わる）
   ↓
3. 通勤経路（Googleマップ準備が必要）
   ↓
4. 家族情報（複雑・時間がかかる可能性）
```

### 理由
- **口座情報を早めに**: シンプルで完了しやすく、モチベーション維持
- **通勤経路を先に**: Googleマップのスクショ準備が必要
- **家族情報を最後に**: 家族構成により項目数が大きく変動、時間がかかる可能性

---

## 🎯 UX改善のポイント

### 1. プログレスバーの工夫
```typescript
// 項目数が可変なため、重み付けを導入
const FORM_WEIGHTS = {
  basicInfo: 30,      // 39項目だが必須
  bankAccount: 15,    // 11項目、シンプル
  commuteRoute: 25,   // 27項目、条件分岐あり
  familyInfo: 30,     // 可変、複雑
};

function calculateProgress(application: OnboardingApplication): number {
  let totalWeight = 0;
  let completedWeight = 0;

  Object.entries(FORM_WEIGHTS).forEach(([form, weight]) => {
    totalWeight += weight;
    if (application[`${form}FormStatus`] === 'approved') {
      completedWeight += weight;
    }
  });

  return Math.round((completedWeight / totalWeight) * 100);
}
```

### 2. 自動入力の最大活用
- 郵便番号 → 住所自動入力
- 銀行コード → 銀行名サジェスト
- 生年月日 → 年齢自動計算・扶養判定
- 収入額 → 税控除資格の自動チェック

### 3. リアルタイムヘルプ
```typescript
// 入力中にヘルプを表示
const HELP_MESSAGES = {
  pensionNumber: '年金手帳または基礎年金番号通知書に記載されている10桁の番号です',
  employmentInsuranceNumber: '前職の離職票または雇用保険被保険者証に記載されています',
  bankCode: '銀行名を入力すると自動で検索します',
  annualIncome: '配偶者の年間収入が48万円以下の場合、配偶者控除が適用されます',
};
```

### 4. エラー防止
- 数値のみのフィールドは自動で半角変換
- カナのみのフィールドは自動でカナ変換
- スペースの全角/半角を自動修正
- 提出前の最終チェックリスト表示

---

**このドキュメントは、4つのPDFフォームの詳細分析に基づいています**
