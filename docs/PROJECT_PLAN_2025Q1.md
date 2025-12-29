# ダンドリポータル 機能拡張プロジェクト計画書

## プロジェクト概要

**作成日**: 2025年12月29日
**目的**: ダンドリワーク社メンバーからのフィードバックを基にした機能改善・拡張
**スコープ**: バグ修正、UI/UX改善、設定画面リプレイス、勤怠マスタ、給与管理、年末調整

---

## 全体スケジュール

| Phase | 内容 | 期間目安 |
|-------|------|----------|
| Phase 0 | 現状調査・設計 | 1週間 |
| Phase 1 | バグ修正 | 1-2週間 |
| Phase 2 | 設定画面リプレイス | 2-3週間 |
| Phase 3 | UI/UX改善 | 2週間 |
| Phase 4 | 勤怠マスタ | 4-6週間 |
| Phase 5 | 給与管理（基本） | 4週間 |
| Phase 6 | 給与管理（計算・出力） | 3週間 |
| Phase 7 | 年末調整 | 4週間 |
| Phase 8 | その他機能 | 2週間 |

**総期間**: 約23-27週間（6-7ヶ月）

---

## Phase 0: 現状調査・設計

### 0.1 既存コード調査
- [ ] メンバー状況のステータス表示ロジック確認
- [ ] アナウンス既読機能の実装状況確認
- [ ] ユーザー管理のフィルタ・編集機能確認
- [ ] 現在の設定画面構造の把握

### 0.2 DB設計
- [ ] 新規テーブル設計（下記「データベース設計」参照）
- [ ] 既存テーブルとの関連定義
- [ ] マイグレーション計画作成

### 0.3 UI/UXワイヤーフレーム
- [ ] 設定画面（カード形式）のワイヤーフレーム
- [ ] 勤怠マスタ画面のワイヤーフレーム
- [ ] 給与管理画面のワイヤーフレーム

---

## Phase 1: バグ修正

### 1.1 メンバー状況
- [ ] **[BUG]** 勤怠打刻が反映されない
- [ ] **[BUG]** F5更新でステータスがランダムに変わる
- [ ] **[BUG]** フィルタが正しく動作しない
- [ ] **[BUG]** 未出勤者が「すべて」以外に表示されない

### 1.2 アナウンス
- [ ] **[BUG]** 「確認しました」クリックで既読にならない

### 1.3 ユーザー管理
- [ ] **[BUG]** フィルタが動作しない
- [ ] **[BUG]** プルダウンが選択できない
- [ ] **[BUG]** 編集・更新ボタンが反応しない

---

## Phase 2: 設定画面リプレイス

### 2.1 新設定画面UI構築
- [ ] カード形式のトップページ作成
- [ ] 各カテゴリの詳細ページ作成
- [ ] レスポンシブ対応

### 2.2 カテゴリ構成

```
設定
├── 会社情報
│   ├── 基本情報（会社名、住所等）
│   ├── 組織構成（部署、役職）
│   └── 拠点管理
│
├── 勤怠設定
│   ├── 勤務パターン
│   ├── 残業ルール・36協定
│   ├── 打刻設定（丸め等）
│   ├── 有給付与ルール
│   └── 休日カレンダー
│
├── 給与設定
│   ├── 給与体系
│   ├── 手当マスタ
│   ├── 控除項目
│   ├── 社会保険設定
│   └── 年末調整設定
│
├── 通知設定
│   ├── メール通知
│   ├── アプリ内通知
│   └── リマインダー
│
├── アナウンス設定
│   ├── 種別マスタ
│   └── 配信設定
│
├── ワークフロー設定
│   ├── 承認ルート
│   └── 申請種別
│
├── セキュリティ
│   ├── パスワードポリシー
│   ├── ログイン設定
│   └── 監査ログ設定
│
├── 表示設定
│   ├── ダッシュボード（クイックアクションON/OFF）
│   └── メニュー表示
│
└── 権限管理
    ├── 権限グループ
    └── 権限別機能設定
```

### 2.3 権限制御

| カテゴリ | 経営者 | システム管理者 | 人事 |
|----------|--------|---------------|------|
| 会社情報 | ○ | ○ | ○ |
| 勤怠設定 | ○ | ○ | ○ |
| 給与設定 | ○ | ○ | ○ |
| 通知設定 | ○ | ○ | ○ |
| アナウンス設定 | ○ | ○ | ○ |
| ワークフロー設定 | ○ | ○ | ○ |
| セキュリティ | × | ○ | × |
| 表示設定 | ○ | ○ | ○ |
| 権限管理 | × | ○ | ○ |

### 2.4 既存設定の移行
- [ ] 既存データのマッピング定義
- [ ] マイグレーションスクリプト作成
- [ ] 移行テスト

---

## Phase 3: UI/UX改善

### 3.1 ダッシュボード
- [ ] 統計項目にリンク追加（従業員数→ユーザー管理、承認依頼→ワークフロー等）
- [ ] 資産利用状況の各項目にリンク追加
- [ ] 入退社予定の各メンバーにリンク追加

### 3.2 メンバー状況
- [ ] 勤務場所選択に「出張」「研修」追加
- [ ] 統計に「未出勤」カテゴリ追加（勤務開始時刻過ぎて打刻なし）
- [ ] ステータスフィルターに「未出勤」追加
- [ ] 並び順選択機能追加（社員番号順/部署順/登録順）
- [ ] カード表示に社員番号追加
- [ ] リスト表示にページネーション追加

### 3.3 アナウンス
- [ ] 統計項目クリックでフィルタ
- [ ] 「確認しました」→「確認済み」表示変更
- [ ] 投稿者の部署名追加
- [ ] 「優先度」フィルター削除→「部署」フィルター追加（投稿者部署 + 対象部署）

### 3.4 ユーザー管理
- [ ] フィルター改善
- [ ] ページネーション追加
- [ ] 社員番号・役職の表示追加

### 3.5 権限別メニュー
- [ ] 経営者：「ユーザー管理」追加
- [ ] 一般権限：「メンバー状況」追加

---

## Phase 4: 勤怠マスタ

### 4.1 勤務パターン設定
- [ ] 固定時間制（所定労働時間、休憩時間）
- [ ] フレックスタイム制（コアタイム、フレキシブルタイム、清算期間）
- [ ] シフト制（複数パターン登録、日別割当）
- [ ] 裁量労働制（みなし労働時間）

### 4.2 残業ルール・36協定
- [ ] 残業種別（法定内/法定外/深夜/休日/所定休日）
- [ ] 月間上限時間
- [ ] 年間上限時間
- [ ] アラート設定

### 4.3 打刻丸め設定
- [ ] 出勤時丸め（切り上げ）
- [ ] 退勤時丸め（切り捨て）
- [ ] 丸め単位（1/5/10/15/30分）

### 4.4 有給付与ルール
- [ ] 法定通り付与
- [ ] 入社日基準付与
- [ ] 一斉付与
- [ ] 繰越設定（最大日数、期限）

### 4.5 休日カレンダー
- [ ] 会社の所定休日
- [ ] 国民の祝日連携
- [ ] 部署別カレンダー

### 4.6 業種別テンプレート
- [ ] IT・ソフトウェア（フレックス中心、リモート対応）
- [ ] 製造業（シフト制、交代勤務）
- [ ] 小売・サービス業（シフト制、土日祝営業）
- [ ] 建設業（現場直行直帰、日当対応）
- [ ] 医療・介護（夜勤、変則シフト）
- [ ] 一般オフィス（固定時間制、標準設定）

---

## Phase 5: 給与管理（基本）

### 5.1 給与項目設定
- [ ] 給与形態（月給/日給/時給）
- [ ] 基本給
- [ ] 締め日・支払日

### 5.2 手当マスタ
- [ ] 標準手当（役職、資格、住宅、家族、通勤）
- [ ] カスタム手当（会社が自由に追加可能）

### 5.3 控除マスタ
- [ ] 標準控除（社会保険、税金）
- [ ] カスタム控除

### 5.4 社会保険等級設定
- [ ] 標準報酬月額等級テーブル
- [ ] 都道府県別保険料率（協会けんぽ）
- [ ] DW管理者によるマスタ更新機能

### 5.5 従業員給与情報
- [ ] 従業員別給与詳細（新テーブル: employee_salary_info）
- [ ] 手当・控除の個別設定

---

## Phase 6: 給与管理（計算・出力）

### 6.1 給与計算自動化
- [ ] 勤怠データ連携
- [ ] 残業時間×単価の自動計算
- [ ] 社会保険料の自動計算（等級から算出）

### 6.2 給与明細生成
- [ ] PDF出力機能
- [ ] 明細フォーマット設定

### 6.3 従業員への配布
- [ ] ポータル上で閲覧
- [ ] ダウンロード機能

---

## Phase 7: 年末調整

### 7.1 従業員側（申告入力）
- [ ] 扶養控除等申告書
- [ ] 保険料控除申告書
- [ ] 住宅ローン控除申告書
- [ ] 配偶者控除等申告書

### 7.2 管理者側（計算・処理）
- [ ] 年税額計算
- [ ] 過不足税額計算

### 7.3 帳票出力
- [ ] 源泉徴収票生成（国税庁正式フォーマット + 簡易フォーマット選択可能）
- [ ] 給与支払報告書（PDF出力）

---

## Phase 8: その他機能

### 8.1 クイックアクションON/OFF
- [ ] 権限別の設定画面
- [ ] ダッシュボードへの反映

### 8.2 アナウンス種別マスタ
- [ ] 種別の追加・削除・編集
- [ ] 色・アイコン設定
- [ ] 表示順設定

### 8.3 権限別メニュー調整
- [ ] 権限とメニューの対応設定
- [ ] 動的メニュー生成

---

## データベース設計

### 設計方針
- 既存テーブルは**テナントレベルのデフォルト設定**として維持
- 複雑な設定は**新テーブル**に分離
- 従業員は work_pattern_id 等で紐付け（null の場合はデフォルト設定を使用）

### 新規テーブル一覧

#### 勤怠マスタ関連
```sql
-- 勤務パターン
work_patterns (
  id, tenantId, name, type, -- fixed/flex/shift/discretionary
  workStartTime, workEndTime, breakStartTime, breakEndTime,
  coreTimeStart, coreTimeEnd, flexTimeStart, flexTimeEnd,
  settlementPeriod, -- 清算期間（フレックス用）
  deemedWorkHours, -- みなし労働時間（裁量労働用）
  isDefault, isActive, createdAt, updatedAt
)

-- 残業ルール
overtime_rules (
  id, tenantId, name,
  legalOvertimeThreshold, -- 法定残業閾値（分）
  nightOvertimeStart, nightOvertimeEnd, -- 深夜残業時間帯
  monthlyLimit, yearlyLimit, -- 36協定上限
  alertThreshold, -- アラート閾値（%）
  isActive, createdAt, updatedAt
)

-- 有給付与ルール
paid_leave_rules (
  id, tenantId, name, type, -- legal/hire_date/bulk
  grantDate, -- 一斉付与日（bulk用）
  initialDays, -- 初回付与日数
  maxCarryoverDays, -- 最大繰越日数
  carryoverExpiry, -- 繰越期限（月）
  isDefault, isActive, createdAt, updatedAt
)

-- 休日カレンダー
holiday_calendars (
  id, tenantId, name,
  departmentId, -- null = 全社共通
  includeNationalHolidays,
  weeklyHolidays, -- ["saturday", "sunday"]
  isDefault, isActive, createdAt, updatedAt
)

-- 休日カレンダー日付
holiday_calendar_dates (
  id, calendarId, date, name, type, -- company/national/special
  createdAt
)

-- 打刻丸め設定
time_rounding_settings (
  id, tenantId,
  checkInRoundingType, -- up/down/nearest
  checkInRoundingUnit, -- 1/5/10/15/30
  checkOutRoundingType,
  checkOutRoundingUnit,
  isActive, createdAt, updatedAt
)

-- シフト定義
shifts (
  id, tenantId, name, color,
  startTime, endTime, breakMinutes,
  isActive, createdAt, updatedAt
)

-- シフト割当
shift_assignments (
  id, tenantId, userId, shiftId, date,
  createdAt, updatedAt
)
```

#### 給与マスタ関連
```sql
-- 給与体系
salary_structures (
  id, tenantId, name,
  payType, -- monthly/daily/hourly
  baseCalculation, -- 基本給計算方法
  isDefault, isActive, createdAt, updatedAt
)

-- 手当種別マスタ
allowance_types (
  id, tenantId, name, code,
  calculationType, -- fixed/calculated
  isTaxable, isSocialInsuranceTarget,
  sortOrder, isSystem, isActive, createdAt, updatedAt
)

-- 控除種別マスタ
deduction_types (
  id, tenantId, name, code,
  calculationType,
  sortOrder, isSystem, isActive, createdAt, updatedAt
)

-- 従業員給与情報
employee_salary_info (
  id, tenantId, userId,
  salaryStructureId, workPatternId, overtimeRuleId, paidLeaveRuleId,
  baseSalary, hourlyRate, dailyRate,
  socialInsuranceGrade, -- 標準報酬月額等級
  prefecture, -- 都道府県（保険料率用）
  createdAt, updatedAt
)

-- 従業員別手当
employee_allowances (
  id, tenantId, userId, allowanceTypeId,
  amount, effectiveFrom, effectiveTo,
  createdAt, updatedAt
)

-- 従業員別控除
employee_deductions (
  id, tenantId, userId, deductionTypeId,
  amount, effectiveFrom, effectiveTo,
  createdAt, updatedAt
)

-- 社会保険等級テーブル
social_insurance_grades (
  id, grade, monthlyRemunerationMin, monthlyRemunerationMax,
  standardMonthlyRemuneration,
  healthInsuranceRate, pensionInsuranceRate,
  effectiveFrom, effectiveTo,
  createdAt, updatedAt
)

-- 都道府県別保険料率
social_insurance_rates (
  id, prefectureCode, prefectureName,
  healthInsuranceRate, -- 健康保険料率
  longTermCareInsuranceRate, -- 介護保険料率
  effectiveFrom, effectiveTo,
  createdAt, updatedAt
)

-- 所得税税額表
income_tax_tables (
  id, dependentCount, -- 扶養人数
  salaryMin, salaryMax, taxAmount,
  effectiveFrom, effectiveTo,
  createdAt, updatedAt
)
```

#### 給与データ関連
```sql
-- 給与計算期間
payroll_periods (
  id, tenantId, year, month,
  startDate, endDate, paymentDate,
  status, -- draft/calculating/confirmed/paid
  createdAt, updatedAt
)

-- 給与計算結果
payroll_records (
  id, tenantId, periodId, userId,
  baseSalary, totalAllowances, totalDeductions,
  grossPay, netPay,
  workDays, workHours, overtimeHours,
  status, createdAt, updatedAt
)

-- 給与明細項目
payroll_details (
  id, payrollRecordId, itemType, -- allowance/deduction
  itemId, itemName, amount,
  createdAt
)

-- 給与明細PDF
payslips (
  id, tenantId, payrollRecordId, userId,
  pdfUrl, generatedAt, downloadedAt,
  createdAt
)

-- 年末調整データ
year_end_adjustments (
  id, tenantId, userId, fiscalYear,
  status, -- draft/submitted/processing/completed
  totalIncome, totalDeduction, taxableIncome,
  calculatedTax, withheldTax, adjustmentAmount,
  completedAt, createdAt, updatedAt
)

-- 扶養家族情報
dependent_info (
  id, tenantId, userId, fiscalYear,
  relationship, name, birthDate,
  income, isDisabled, isLivingTogether,
  createdAt, updatedAt
)

-- 保険料控除申告
insurance_deductions (
  id, tenantId, userId, fiscalYear,
  insuranceType, -- life/medical/pension/earthquake
  companyName, policyNumber,
  annualPremium, deductionAmount,
  createdAt, updatedAt
)

-- 住宅ローン控除
housing_loan_deductions (
  id, tenantId, userId, fiscalYear,
  acquisitionDate, residenceStartDate,
  yearEndBalance, deductionAmount,
  certificateNumber,
  createdAt, updatedAt
)

-- 源泉徴収票
withholding_slips (
  id, tenantId, userId, fiscalYear,
  totalIncome, totalDeduction, taxAmount,
  format, -- standard/simplified
  pdfUrl, generatedAt,
  createdAt
)
```

#### その他
```sql
-- 業種テンプレート
industry_templates (
  id, name, description, industryType,
  workPatternConfig, overtimeRuleConfig,
  paidLeaveRuleConfig, holidayConfig,
  allowanceConfig, payrollConfig,
  isActive, createdAt, updatedAt
)

-- アナウンス種別マスタ
announcement_types (
  id, tenantId, name, color, icon,
  sortOrder, isActive, createdAt, updatedAt
)

-- ダッシュボード設定
dashboard_settings (
  id, tenantId, role, -- 権限別設定
  quickActionConfig, -- JSON: どのボタンを表示するか
  widgetConfig, -- JSON: ウィジェット設定
  createdAt, updatedAt
)
```

---

## 仕様決定事項まとめ

### Round 1-5 で決定した仕様

| 項目 | 決定内容 |
|------|----------|
| 出張・研修 | 勤務場所選択に追加 |
| 未出勤 | 勤務開始時刻過ぎて打刻なし→別カウント |
| カード表示順 | 名前→社員番号→部署→役職→勤務地→稼働→最終活動 |
| クイックアクションON/OFF | 権限別に設定 |
| 一般権限のメンバー状況 | 見れる設計、メニュー追加 |
| 部署フィルター | 投稿者部署 + 対象部署の2つ |
| 種別マスタ | 追加削除編集 + 色アイコン + 表示順 |
| 勤務パターン | 固定・フレックス・シフト・裁量労働すべて対応 |
| 残業ルール | 36協定管理まで含める |
| 打刻丸め | 必要、設定可能に |
| 有給付与 | 複数方式対応（法定/入社日基準/一斉付与） |
| 休日カレンダー | 部署別カレンダー必要 |
| 給与自動化 | レベル4（給与明細生成まで） |
| 社会保険 | 等級テーブルで自動計算 |
| 設定画面UI | カード形式 + 詳細ページ遷移 |
| 初期データ | 業種別テンプレート提供（6種類） |
| データ移行 | 既存データを新構造に移行 |
| 年末調整 | フル機能（扶養控除、保険料控除等） |
| 源泉徴収票 | 国税庁正式 + 簡易フォーマット選択可能 |
| 給与支払報告書 | PDF出力 |
| 法改正対応 | DW管理者がマスタ更新→全テナントに反映 |
| 給与明細配布 | ポータル閲覧 + ダウンロード |

---

## 注意事項

1. **バグ修正を最優先**: 新機能より先にバグを全て修正する
2. **既存データ維持**: マイグレーション時は既存データを保持
3. **段階的リリース**: Phase ごとにテスト・リリースを繰り返す
4. **セキュリティ**: 給与情報は別テーブルで権限管理を厳格に

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-29 | 初版作成 |
