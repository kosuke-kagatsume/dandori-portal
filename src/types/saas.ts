/**
 * SaaS管理システム - 型定義
 */

// SaaSカテゴリ
export type SaaSCategory =
  | 'communication'      // コミュニケーション
  | 'productivity'       // 生産性向上
  | 'development'        // 開発ツール
  | 'design'            // デザイン
  | 'hr'                // 人事・労務
  | 'finance'           // 財務・会計
  | 'marketing'         // マーケティング
  | 'sales'             // 営業
  | 'security'          // セキュリティ
  | 'storage'           // ストレージ
  | 'other';            // その他

// ライセンスタイプ
export type LicenseType =
  | 'user-based'        // ユーザーライセンス型（人数課金）
  | 'fixed'             // 固定契約型（定額）
  | 'usage-based';      // 従量課金型

// 課金サイクル
export type BillingCycle = 'monthly' | 'yearly';

// 通貨
export type Currency = 'JPY' | 'USD';

// ライセンスステータス
export type LicenseStatus = 'active' | 'inactive' | 'pending';

// セキュリティ評価
export type SecurityRating = 'A' | 'B' | 'C' | 'D';

// 支払い方法
export type PaymentMethod = 'credit_card' | 'invoice' | 'bank_transfer';

// SaaSサービスマスタ
export interface SaaSService {
  id: string;
  name: string;                    // サービス名（Slack, Notion, etc）
  category: SaaSCategory | string; // カテゴリ（拡張可能）
  vendor: string;                  // ベンダー名
  website: string;                 // 公式サイト
  logo?: string;                   // ロゴURL
  description?: string;            // 説明

  // 契約タイプ
  licenseType: LicenseType;

  // セキュリティ情報
  securityRating?: SecurityRating; // セキュリティ評価
  ssoEnabled?: boolean;            // SSO対応有無
  mfaEnabled?: boolean;            // MFA対応有無

  // 管理情報
  adminEmail?: string;             // 管理者メールアドレス
  supportUrl?: string;             // サポートURL
  contractStartDate?: string;      // 契約開始日 (ISO date string)
  contractEndDate?: string;        // 契約終了日（更新日） (ISO date string)
  autoRenew?: boolean;             // 自動更新
  autoRenewal?: boolean;           // 自動更新（別名）
  billingCycle?: BillingCycle | string; // 課金サイクル
  paymentMethod?: PaymentMethod;   // 支払い方法
  notes?: string;                  // メモ

  // ステータス
  isActive: boolean;               // アクティブ状態

  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}

// ライセンスプラン
export interface LicensePlan {
  id: string;
  serviceId: string;               // SaaSサービスID
  planName: string;                // プラン名（Business, Enterprise, etc）

  // 料金情報
  billingCycle?: BillingCycle | string; // 課金サイクル
  pricePerUser?: number;           // ユーザー単価（user-based）
  fixedPrice?: number;             // 固定価格（fixed）
  currency?: Currency;             // 通貨

  // プラン詳細
  maxUsers?: number;               // 最大ユーザー数
  features?: string[];             // 機能リスト

  // ステータス
  isActive: boolean;               // 現在使用中のプラン

  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}

// ライセンス割り当て
export interface LicenseAssignment {
  id: string;
  serviceId: string;               // SaaSサービスID
  serviceName?: string;            // サービス名（参照用）
  planId: string;                  // プランID
  planName?: string;               // プラン名（参照用）

  // ユーザーライセンス型の場合
  userId?: string;                 // ユーザーID
  userName?: string;               // ユーザー名（参照用）
  userEmail?: string;              // アカウントメールアドレス

  // 固定契約型の場合
  departmentId?: string;           // 部署ID（固定契約の場合）
  departmentName?: string;         // 部署名（参照用）

  // ステータス
  status: LicenseStatus | string;  // アクティブ、非アクティブ、付与待ち
  assignedDate?: string;           // 付与日 (ISO date string)
  assignedAt?: string;             // 付与日（別名） (ISO date string)
  revokedDate?: string;            // 削除日 (ISO date string)

  // 使用状況
  lastUsedAt?: string;             // 最終使用日 (ISO date string)
  usageCount?: number;             // 使用回数（月次）

  notes?: string;                  // メモ
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}

// 月次コスト記録
export interface MonthlyCost {
  id: string;
  serviceId: string;               // SaaSサービスID
  serviceName: string;             // サービス名（参照用）
  planId: string;                  // プランID
  planName: string;                // プラン名（参照用）
  period: string;                  // YYYY-MM

  // コスト内訳
  userLicenseCount: number;        // ユーザーライセンス数
  userLicenseCost: number;         // ユーザーライセンス費用
  fixedCost: number;               // 固定費用
  usageCost: number;               // 従量課金費用
  totalCost: number;               // 合計費用
  currency: Currency;

  // 詳細
  activeUsers: string[];           // アクティブユーザーIDリスト
  inactiveUsers: string[];         // 非アクティブユーザーIDリスト

  notes?: string;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}

// カテゴリの表示名マッピング
export const categoryLabels: Record<SaaSCategory, string> = {
  communication: 'コミュニケーション',
  productivity: '生産性向上',
  development: '開発ツール',
  design: 'デザイン',
  hr: '人事・労務',
  finance: '財務・会計',
  marketing: 'マーケティング',
  sales: '営業',
  security: 'セキュリティ',
  storage: 'ストレージ',
  other: 'その他',
};

// ライセンスタイプの表示名マッピング
export const licenseTypeLabels: Record<LicenseType, string> = {
  'user-based': 'ユーザーライセンス型',
  'fixed': '固定契約型',
  'usage-based': '従量課金型',
};

// セキュリティ評価の表示名マッピング
export const securityRatingLabels: Record<SecurityRating, string> = {
  A: 'A (優良)',
  B: 'B (良好)',
  C: 'C (注意)',
  D: 'D (要改善)',
};

// ライセンスステータスの表示名マッピング
export const licenseStatusLabels: Record<LicenseStatus, string> = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  pending: '付与待ち',
};
