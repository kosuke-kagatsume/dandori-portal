/**
 * 一般資産フォームのバリデーションスキーマ
 */

import { z } from 'zod';

/**
 * 資産カテゴリ
 */
export const AssetCategoryEnum = z.enum([
  'furniture',
  'office_equipment',
  'it_equipment',
  'tools',
  'measuring_instruments',
  'safety_equipment',
  'other',
]);

export type AssetCategory = z.infer<typeof AssetCategoryEnum>;

/**
 * 資産カテゴリの日本語ラベル
 */
export const AssetCategoryLabels: Record<AssetCategory, string> = {
  furniture: '什器・家具',
  office_equipment: '事務機器',
  it_equipment: 'IT機器',
  tools: '工具',
  measuring_instruments: '計測機器',
  safety_equipment: '安全機器',
  other: 'その他',
};

/**
 * 資産ステータス
 */
export const AssetStatusEnum = z.enum(['active', 'in_repair', 'disposed', 'lost']);

export type AssetStatus = z.infer<typeof AssetStatusEnum>;

/**
 * 資産ステータスの日本語ラベル
 */
export const AssetStatusLabels: Record<AssetStatus, string> = {
  active: '使用中',
  in_repair: '修理中',
  disposed: '廃棄済み',
  lost: '紛失',
};

/**
 * 一般資産フォームスキーマ
 */
export const generalAssetSchema = z.object({
  name: z
    .string()
    .min(1, '資産名を入力してください')
    .max(100, '資産名は100文字以内で入力してください'),
  category: AssetCategoryEnum.refine((val) => val !== undefined, {
    message: 'カテゴリを選択してください',
  }),
  assetCode: z
    .string()
    .min(1, '資産コードを入力してください')
    .max(50, '資産コードは50文字以内で入力してください')
    .regex(/^[A-Za-z0-9-_]+$/, '資産コードは英数字、ハイフン、アンダースコアのみ使用できます'),
  manufacturer: z.string().max(100, 'メーカー名は100文字以内で入力してください').optional(),
  modelNumber: z.string().max(100, '型番は100文字以内で入力してください').optional(),
  serialNumber: z.string().max(100, 'シリアル番号は100文字以内で入力してください').optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z
    .number()
    .min(0, '購入価格は0以上で入力してください')
    .max(999999999, '購入価格が上限を超えています')
    .optional()
    .or(z.string().transform((val) => (val ? Number(val) : undefined))),
  warrantyEndDate: z.string().optional(),
  status: AssetStatusEnum.default('active'),
  location: z.string().max(200, '設置場所は200文字以内で入力してください').optional(),
  assignedUserId: z.string().optional(),
  notes: z.string().max(1000, '備考は1000文字以内で入力してください').optional(),
});

export type GeneralAssetFormData = z.infer<typeof generalAssetSchema>;

/**
 * PC資産フォームスキーマ
 */
export const pcAssetSchema = generalAssetSchema.extend({
  osType: z.enum(['windows', 'macos', 'linux', 'other']).optional(),
  osVersion: z.string().max(50, 'OSバージョンは50文字以内で入力してください').optional(),
  cpu: z.string().max(100, 'CPUは100文字以内で入力してください').optional(),
  memory: z.string().max(50, 'メモリは50文字以内で入力してください').optional(),
  storage: z.string().max(100, 'ストレージは100文字以内で入力してください').optional(),
  macAddress: z
    .string()
    .optional()
    .refine((val) => !val || /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(val), {
      message: 'MACアドレスの形式が正しくありません（例: 00:1A:2B:3C:4D:5E）',
    }),
  ipAddress: z
    .string()
    .optional()
    .refine((val) => !val || /^(\d{1,3}\.){3}\d{1,3}$/.test(val), {
      message: 'IPアドレスの形式が正しくありません（例: 192.168.1.1）',
    }),
});

export type PcAssetFormData = z.infer<typeof pcAssetSchema>;
