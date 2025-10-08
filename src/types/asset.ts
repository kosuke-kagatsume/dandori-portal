/**
 * 資産管理システム - 型定義
 */

// 資産の種類
export type AssetType =
  | 'vehicle'      // 車両
  | 'pc'           // PC
  | 'mobile'       // 携帯電話
  | 'tablet'       // タブレット
  | 'equipment'    // 工具・機材
  | 'other';       // その他

// 所有形態
export type OwnershipType = 'owned' | 'leased' | 'rental';

// 資産ステータス
export type AssetStatus = 'active' | 'maintenance' | 'retired';

// タイヤの種類
export type TireType = 'summer' | 'winter';

// メンテナンス種別
export type MaintenanceType =
  | 'oil_change'      // オイル交換
  | 'tire_change'     // タイヤ交換
  | 'inspection'      // 点検
  | 'shaken'          // 車検
  | 'repair'          // 修理
  | 'other';          // その他

// リース情報
export interface LeaseInfo {
  company: string;            // リース会社
  monthlyCost: number;        // 月額費用
  contractStart: string;      // 契約開始日 (ISO date string)
  contractEnd: string;        // 契約終了日 (ISO date string)
  contactPerson?: string;     // 担当者名
  phone?: string;             // 電話番号
}

// 割当情報
export interface AssignmentInfo {
  userId: string;
  userName: string;
  assignedDate: string;       // ISO date string
}

// 月次走行距離
export interface MonthlyMileage {
  id: string;
  month: string;              // YYYY-MM
  distance: number;           // km
  recordedBy: string;         // 記録者（従業員ID）
  recordedByName: string;     // 記録者名
  recordedAt: string;         // ISO date string
}

// メンテナンス履歴
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  date: string;               // ISO date string
  cost: number;
  vendorId: string;           // 業者ID
  vendorName: string;         // 業者名（参照用）
  description: string;
  tireType?: TireType;        // タイヤ交換時のみ
  performedBy: string;        // 作業者ID
  performedByName: string;    // 作業者名
  notes?: string;
  createdAt: string;          // ISO date string
  updatedAt: string;          // ISO date string
}

// 業者マスタ
export interface Vendor {
  id: string;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  email?: string;
  rating?: number;            // 評価（1-5）
  notes?: string;
  workCount?: number;         // 作業実績件数（計算用）
  createdAt: string;          // ISO date string
  updatedAt: string;          // ISO date string
}

// 車両マスタ
export interface Vehicle {
  id: string;
  vehicleNumber: string;      // 車両番号（社内管理番号）
  licensePlate: string;       // ナンバープレート
  make: string;               // メーカー（トヨタ、日産...）
  model: string;              // 車種（プリウス、ノート...）
  year: number;               // 年式
  color?: string;             // 色

  // 割当情報
  assignedTo: AssignmentInfo | null;

  // 所有・リース情報
  ownershipType: OwnershipType;
  purchaseDate?: string;      // 購入日 (ISO date string)
  purchaseCost?: number;      // 購入価格
  leaseInfo?: LeaseInfo;      // リース情報（leased時のみ）

  // 期限管理
  inspectionDate: string;     // 次回車検日 (ISO date string)
  maintenanceDate: string;    // 次回点検日 (ISO date string)
  insuranceDate: string;      // 保険更新日 (ISO date string)

  // タイヤ情報
  currentTireType: TireType;  // 現在装着タイヤ

  // ステータス
  status: AssetStatus;

  // 走行距離管理
  mileageTracking: boolean;   // 走行距離管理ON/OFF
  currentMileage?: number;    // 現在の総走行距離
  monthlyMileages: MonthlyMileage[];

  // メンテナンス履歴
  maintenanceRecords: MaintenanceRecord[];

  // その他
  notes?: string;
  createdAt: string;          // ISO date string
  updatedAt: string;          // ISO date string
}

// PC固有データ
export interface PCAsset {
  id: string;
  assetNumber: string;        // 資産番号
  manufacturer: string;       // メーカー
  model: string;              // 型番
  serialNumber: string;       // シリアル番号
  cpu: string;
  memory: string;             // メモリ（例: 16GB）
  storage: string;            // ストレージ（例: 512GB SSD）
  os: string;                 // OS

  // 割当情報
  assignedTo: AssignmentInfo | null;

  // 所有・リース情報
  ownershipType: OwnershipType;
  purchaseDate?: string;      // 購入日
  purchaseCost?: number;      // 購入価格
  leaseInfo?: LeaseInfo;

  // 期限管理
  warrantyExpiration: string; // 保証期限 (ISO date string)

  // ライセンス情報
  licenses: SoftwareLicense[];

  // ステータス
  status: AssetStatus;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ソフトウェアライセンス
export interface SoftwareLicense {
  id: string;
  softwareName: string;
  licenseKey: string;
  expirationDate?: string;    // 期限 (ISO date string)
  monthlyCost?: number;       // 月額費用（サブスクの場合）
}

// 携帯電話固有データ
export interface MobileAsset {
  id: string;
  assetNumber: string;        // 資産番号
  phoneNumber: string;        // 電話番号
  carrier: string;            // キャリア
  manufacturer: string;       // メーカー
  model: string;              // 機種
  imei: string;               // IMEI

  // 割当情報
  assignedTo: AssignmentInfo | null;

  // 契約情報
  contractStartDate: string;  // 契約開始日
  contractEndDate: string;    // 契約終了日
  monthlyPlan: string;        // 料金プラン
  monthlyCost: number;        // 月額費用
  dataLimit: string;          // データ上限

  // ステータス
  status: AssetStatus;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 警告レベル
export type WarningLevel = 'critical' | 'warning' | 'info';

// 期限警告情報
export interface DeadlineWarning {
  id: string;
  assetType: AssetType;
  assetId: string;
  assetName: string;
  deadlineType: 'inspection' | 'maintenance' | 'insurance' | 'contract' | 'warranty';
  deadlineDate: string;       // ISO date string
  daysRemaining: number;      // 残日数
  level: WarningLevel;        // critical: 30日以内, warning: 60日以内, info: それ以上
}

// 費用サマリー
export interface CostSummary {
  month: string;              // YYYY-MM
  vehicleLeaseCost: number;   // 車両リース費用
  vehicleMaintenanceCost: number; // 車両メンテナンス費用
  pcLeaseCost: number;        // PCリース費用
  mobileCost: number;         // 携帯通信費
  otherCost: number;          // その他費用
  total: number;              // 合計
}
