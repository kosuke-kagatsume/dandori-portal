/**
 * PDF生成用の定数定義
 */

// 共通ラベルを再エクスポート（後方互換性維持）
export {
  ALLOWANCE_LABELS,
  DEDUCTION_LABELS,
  BONUS_TYPE_LABELS,
  WITHHOLDING_DEDUCTION_LABELS,
  getAllowanceLabel,
  getDeductionLabel,
  getBonusTypeLabel,
  getWithholdingDeductionLabel,
} from './labels';

// 会社情報
export const PDF_COMPANY = {
  NAME: '株式会社 Dandori Portal',
  POSTAL_CODE: '〒100-0001',
  ADDRESS: '東京都千代田区千代田1-1-1',
  FULL_ADDRESS: '〒100-0001 東京都千代田区千代田1-1-1',
  TEL: '03-1234-5678',
  DEPARTMENT: '人事部 給与担当',
} as const;

// レイアウト定数
export const PDF_LAYOUT = {
  // マージン
  MARGIN: {
    LEFT: 15,
    RIGHT: 15,
    TOP: 15,
    BOTTOM: 20,
  },

  // フォントサイズ
  FONT_SIZE: {
    TITLE: 16,
    MAIN_AMOUNT: 22,
    SECTION_TITLE: 10,
    BODY: 9,
    INFO: 8,
    SMALL: 7,
    SUBTITLE: 11,
  },

  // 色（RGB）
  COLOR: {
    TEXT: {
      BLACK: [0, 0, 0] as const,
      DARK_GRAY: [60, 60, 60] as const,
      GRAY: [80, 80, 80] as const,
      MID_GRAY: [100, 100, 100] as const,
      LIGHT_GRAY: [120, 120, 120] as const,
    },
    LINE: {
      DARK: [100, 100, 100] as const,
      MEDIUM: [180, 180, 180] as const,
      LIGHT: [220, 220, 220] as const,
    },
    BACKGROUND: {
      LIGHT_GRAY: [245, 245, 245] as const,
      BLUE_GRAY: [248, 250, 252] as const,
    },
  },

  // 線の太さ
  LINE_WIDTH: {
    THIN: 0.3,
    THICK: 0.8,
  },

  // カード設定
  CARD: {
    HEIGHT: 22,
    BORDER_RADIUS: 2,
  },

  // スペーシング
  SPACING: {
    XXS: 2,
    XS: 5,
    SM: 6,
    MD: 8,
    LG: 10,
    XL: 12,
    XXL: 18,
    XXXL: 20,
  },
} as const;

// PDF設定のテキスト
export const PDF_TEXT = {
  PAYROLL: {
    TITLE: '給与明細',
    NET_SALARY_LABEL: '振込額（手取り）',
    ALLOWANCE_SECTION: '支給（＋）',
    DEDUCTION_SECTION: '控除（−）',
    TOTAL: '合計',
    GROSS_TOTAL: '支給合計',
    DEDUCTION_TOTAL: '控除合計',
    NET_TOTAL: '差引',
    BASIC_SALARY: '基本給',
    FOOTER_CONTACT: 'お問い合わせ：人事部 給与担当',
    FOOTER_NOTE: '※本書面は大切に保管してください',
  },
  BONUS: {
    TITLE: '賞与明細書',
    NET_BONUS_LABEL: '差引支給額（振込額）',
    ALLOWANCE_SECTION: '支給（＋）',
    DEDUCTION_SECTION: '控除（−）',
    TOTAL: '合計',
    GROSS_TOTAL: '支給合計',
    DEDUCTION_TOTAL: '控除合計',
    NET_TOTAL: '差引',
    BASIC_BONUS: '基本賞与',
    PERFORMANCE_BONUS: '査定賞与',
    FOOTER_CONTACT: 'お問い合わせ：人事部 給与担当',
    FOOTER_NOTE: '※本書面は大切に保管してください',
  },
  WITHHOLDING: {
    TITLE: '源泉徴収票',
    TAX_AMOUNT_LABEL: '源泉徴収税額',
    INCOME_SECTION: '収入金額',
    DEDUCTION_SECTION: '所得控除',
    TAX_DETAIL_SECTION: '税額明細',
    PAYER_INFO_SECTION: '支払者情報',
    TOTAL: '合計',
    TAXABLE_INCOME: '課税所得',
    TOTAL_INCOME: '総収入',
    EMPLOYMENT_INCOME: '給与所得',
    INCOME_TAX: '所得税',
    SPECIAL_TAX: '復興特別所得税',
    FOOTER_CONTACT: 'お問い合わせ：人事部 給与担当',
    FOOTER_NOTE: '※本書面は大切に保管してください',
  },
  COMMON: {
    EMPLOYEE_ID: '社員番号',
    DEPARTMENT: '所属',
    PAYMENT_DATE: '支給日',
    PAYMENT_METHOD: '支払方法',
    PAYMENT_METHOD_VALUE: '銀行振込',
    ISSUE_DATE: '発行日',
    ADDRESS: '住所',
    RATING: '査定',
    COMPANY_NAME: '会社名',
    REPRESENTATIVE: '代表者',
  },
} as const;

// ヘルパー関数用の設定
export const PDF_HELPERS = {
  DATE_FORMAT: {
    SLASH: '/',
    JAPANESE: { YEAR: '年', MONTH: '月' },
  },
} as const;
