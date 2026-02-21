/**
 * 休暇申請フォームのバリデーションスキーマ
 */

import { z } from 'zod';

/**
 * 休暇種別
 */
export const LeaveTypeEnum = z.enum([
  'paid',
  'sick',
  'special',
  'compensatory',
  'half_day_am',
  'half_day_pm',
]);

export type LeaveType = z.infer<typeof LeaveTypeEnum>;

/**
 * 休暇種別の日本語ラベル
 */
export const LeaveTypeLabels: Record<LeaveType, string> = {
  paid: '有給休暇',
  sick: '病気休暇',
  special: '特別休暇',
  compensatory: '振替休暇',
  half_day_am: '午前半休',
  half_day_pm: '午後半休',
};

/**
 * 休暇申請フォームスキーマ
 */
export const leaveRequestSchema = z
  .object({
    startDate: z.string().min(1, '開始日を選択してください'),
    endDate: z.string().min(1, '終了日を選択してください'),
    leaveType: LeaveTypeEnum.refine((val) => val !== undefined, {
      message: '休暇種別を選択してください',
    }),
    reason: z.string().min(1, '理由を入力してください').max(500, '理由は500文字以内で入力してください'),
    contactPhone: z
      .string()
      .optional()
      .refine((val) => !val || /^[\d-]+$/.test(val), {
        message: '電話番号は数字とハイフンのみで入力してください',
      }),
    attachmentUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: '終了日は開始日以降を選択してください',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      // 半休の場合は開始日と終了日が同じである必要がある
      if (['half_day_am', 'half_day_pm'].includes(data.leaveType)) {
        return data.startDate === data.endDate;
      }
      return true;
    },
    {
      message: '半休の場合は開始日と終了日を同じ日に設定してください',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      // 開始日が過去でないことを確認
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.startDate) >= today;
    },
    {
      message: '開始日は今日以降を選択してください',
      path: ['startDate'],
    }
  );

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

/**
 * 休暇申請下書きスキーマ（バリデーション緩和）
 */
export const leaveRequestDraftSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  leaveType: LeaveTypeEnum.optional(),
  reason: z.string().max(500, '理由は500文字以内で入力してください').optional(),
  contactPhone: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export type LeaveRequestDraftData = z.infer<typeof leaveRequestDraftSchema>;
