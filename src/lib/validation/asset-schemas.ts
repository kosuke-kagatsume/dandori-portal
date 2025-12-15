/**
 * Asset Management Validation Schemas
 *
 * Zod schemas for runtime validation of asset management APIs.
 * - PC資産 (PC Assets)
 * - 汎用資産 (General Assets)
 * - 車両 (Vehicles)
 * - 業者 (Vendors)
 * - メンテナンス記録 (Maintenance Records)
 * - 修理記録 (Repair Records)
 */

import { z } from 'zod';

// ============================================================================
// SHARED VALIDATION PATTERNS
// ============================================================================

/**
 * 日付文字列（ISO 8601形式）
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, '日付の形式が正しくありません')
  .optional()
  .nullable();

/**
 * 正の数値
 */
export const positiveNumberSchema = z.number().positive('0より大きい値を入力してください');

/**
 * 非負の数値（0以上）
 */
export const nonNegativeNumberSchema = z.number().min(0, '0以上の値を入力してください');

/**
 * 所有形態
 */
export const ownershipTypeSchema = z.enum(['owned', 'leased'], {
  errorMap: () => ({ message: '所有形態は owned または leased を指定してください' }),
});

/**
 * ステータス
 */
export const statusSchema = z.enum(['active', 'inactive', 'disposed', 'maintenance'], {
  errorMap: () => ({ message: '無効なステータスです' }),
});

/**
 * メールアドレス（オプション）
 */
export const optionalEmailSchema = z
  .string()
  .email('有効なメールアドレスを入力してください')
  .optional()
  .nullable();

/**
 * 電話番号（オプション）
 */
export const optionalPhoneSchema = z
  .string()
  .regex(/^[\d\-+()]+$/, '電話番号の形式が正しくありません')
  .optional()
  .nullable();

// ============================================================================
// PC ASSET SCHEMAS
// ============================================================================

/**
 * PC資産作成スキーマ
 */
export const createPCAssetSchema = z.object({
  tenantId: z.string().optional(),
  assetNumber: z.string().min(1, '資産番号は必須です'),
  manufacturer: z.string().min(1, 'メーカーは必須です'),
  model: z.string().min(1, 'モデルは必須です'),
  serialNumber: z.string().optional().nullable(),
  cpu: z.string().optional().nullable(),
  memory: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  os: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  assignedUserName: z.string().optional().nullable(),
  assignedDate: dateStringSchema,
  ownershipType: ownershipTypeSchema.default('owned'),
  leaseCompany: z.string().optional().nullable(),
  leaseStartDate: dateStringSchema,
  leaseEndDate: dateStringSchema,
  leaseMonthlyCost: nonNegativeNumberSchema.optional().nullable(),
  leaseContact: z.string().optional().nullable(),
  leasePhone: optionalPhoneSchema,
  purchaseDate: dateStringSchema,
  purchaseCost: nonNegativeNumberSchema.optional().nullable(),
  warrantyExpiration: dateStringSchema,
  status: statusSchema.default('active'),
  notes: z.string().optional().nullable(),
});

export type CreatePCAssetInput = z.infer<typeof createPCAssetSchema>;

// ============================================================================
// GENERAL ASSET SCHEMAS
// ============================================================================

/**
 * 汎用資産カテゴリ
 */
export const generalAssetCategorySchema = z.string().min(1, 'カテゴリは必須です');

/**
 * 汎用資産作成スキーマ
 */
export const createGeneralAssetSchema = z.object({
  tenantId: z.string().optional(),
  assetNumber: z.string().min(1, '資産番号は必須です'),
  category: generalAssetCategorySchema,
  name: z.string().min(1, '名称は必須です'),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  assignedUserName: z.string().optional().nullable(),
  assignedDate: dateStringSchema,
  ownershipType: ownershipTypeSchema.default('owned'),
  purchaseDate: dateStringSchema,
  purchaseCost: nonNegativeNumberSchema.optional().nullable(),
  leaseCompany: z.string().optional().nullable(),
  leaseMonthlyCost: nonNegativeNumberSchema.optional().nullable(),
  leaseStartDate: dateStringSchema,
  leaseEndDate: dateStringSchema,
  warrantyExpiration: dateStringSchema,
  status: statusSchema.default('active'),
  notes: z.string().optional().nullable(),
});

export type CreateGeneralAssetInput = z.infer<typeof createGeneralAssetSchema>;

// ============================================================================
// VEHICLE SCHEMAS
// ============================================================================

/**
 * 車両作成スキーマ
 */
export const createVehicleSchema = z.object({
  tenantId: z.string().optional(),
  vehicleNumber: z.string().min(1, '車両番号は必須です'),
  licensePlate: z.string().min(1, 'ナンバープレートは必須です'),
  make: z.string().min(1, 'メーカーは必須です'),
  model: z.string().min(1, '車種は必須です'),
  year: z.number().int().min(1900).max(2100, '年式は1900〜2100の範囲で入力してください'),
  color: z.string().optional().nullable(),
  assignedUserId: z.string().optional().nullable(),
  assignedUserName: z.string().optional().nullable(),
  assignedDate: dateStringSchema,
  ownershipType: ownershipTypeSchema.default('owned'),
  leaseCompany: z.string().optional().nullable(),
  leaseStartDate: dateStringSchema,
  leaseEndDate: dateStringSchema,
  leaseMonthlyCost: nonNegativeNumberSchema.optional().nullable(),
  purchaseDate: dateStringSchema,
  purchaseCost: nonNegativeNumberSchema.optional().nullable(),
  inspectionDate: dateStringSchema,
  insuranceDate: dateStringSchema,
  maintenanceDate: dateStringSchema,
  tireChangeDate: dateStringSchema,
  currentTireType: z.string().optional().nullable(),
  status: statusSchema.default('active'),
  notes: z.string().optional().nullable(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

// ============================================================================
// VENDOR SCHEMAS
// ============================================================================

/**
 * 業者作成スキーマ
 */
export const createVendorSchema = z.object({
  tenantId: z.string().optional(),
  name: z.string().min(1, '業者名は必須です'),
  contactPerson: z.string().optional().nullable(),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  address: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

// ============================================================================
// MAINTENANCE RECORD SCHEMAS
// ============================================================================

/**
 * メンテナンス種別
 */
export const maintenanceTypeSchema = z.string().min(1, 'メンテナンス種別は必須です');

/**
 * メンテナンス記録作成スキーマ
 */
export const createMaintenanceRecordSchema = z.object({
  tenantId: z.string().optional(),
  vehicleId: z.string().min(1, '車両IDは必須です'),
  type: maintenanceTypeSchema,
  date: z.string().min(1, '日付は必須です'),
  mileage: z.union([z.string(), z.number()]).optional().nullable(),
  cost: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  }),
  vendorId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  nextDueDate: dateStringSchema,
  nextDueMileage: z.union([z.string(), z.number()]).optional().nullable(),
  tireType: z.string().optional().nullable(),
  performedBy: z.string().optional().nullable(),
  performedByName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordSchema>;

// ============================================================================
// REPAIR RECORD SCHEMAS
// ============================================================================

/**
 * 修理種別
 */
export const repairTypeSchema = z.string().min(1, '修理種別は必須です');

/**
 * 修理ステータス
 */
export const repairStatusSchema = z.string().default('completed');

/**
 * 修理記録作成スキーマ
 */
export const createRepairRecordSchema = z.object({
  tenantId: z.string().optional(),
  pcAssetId: z.string().optional().nullable(),
  generalAssetId: z.string().optional().nullable(),
  repairType: repairTypeSchema,
  date: z.string().min(1, '日付は必須です'),
  cost: nonNegativeNumberSchema,
  vendorId: z.string().optional().nullable(),
  vendorName: z.string().optional().nullable(),
  symptom: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: repairStatusSchema.default('completed'),
  completedDate: dateStringSchema,
  performedBy: z.string().optional().nullable(),
  performedByName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => data.pcAssetId || data.generalAssetId,
  { message: 'PC資産または汎用資産のいずれかを指定してください' }
);

export type CreateRepairRecordInput = z.infer<typeof createRepairRecordSchema>;

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Zodスキーマでバリデーションを実行し、エラーメッセージを整形して返す
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
}
