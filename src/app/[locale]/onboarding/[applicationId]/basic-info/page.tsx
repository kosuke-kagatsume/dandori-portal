'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBasicInfoForm } from '@/features/onboarding/hooks/useBasicInfoForm';
import {
  InputField,
  SelectField,
  CheckboxField,
  SectionHeader,
  FormSection,
} from '@/features/onboarding/forms/FormFields';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
].map((pref) => ({ value: pref, label: pref }));

/**
 * Basic Info Form Page
 *
 * 入社案内フォーム (39 items)
 * Sections:
 * 1. 基本情報
 * 2. 住所情報
 * 3. 緊急連絡先
 * 4. 社会保険
 * 5. マイナンバー
 * 6. 提出書類
 */
export default function BasicInfoFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const applicationId = params?.applicationId as string;

  const { register, handleSubmit, errors, formState, watch } =
    useBasicInfoForm();

  const hasPensionBook = watch('socialInsurance.hasPensionBook');
  const hasEmploymentInsurance = watch(
    'socialInsurance.hasEmploymentInsurance'
  );
  const sameAsCurrent = watch('residentAddress.sameAsCurrent');

  const onSubmit = async () => {
    await handleSubmit();
    router.push(`/${locale}/onboarding`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${locale}/onboarding`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            ダッシュボードに戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">入社案内</h1>
          <p className="mt-1 text-sm text-gray-600">
            基本情報を入力してください（39項目）
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Section 1: 基本情報 */}
          <FormSection>
            <SectionHeader title="基本情報" />
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="メールアドレス"
                name="email"
                type="email"
                required
                register={register}
                errors={errors}
              />
              <InputField
                label="入社日"
                name="hireDate"
                type="date"
                required
                register={register}
                errors={errors}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="姓（漢字）"
                name="lastNameKanji"
                required
                register={register}
                errors={errors}
              />
              <InputField
                label="名（漢字）"
                name="firstNameKanji"
                required
                register={register}
                errors={errors}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="姓（カナ）"
                name="lastNameKana"
                required
                placeholder="タナカ"
                register={register}
                errors={errors}
              />
              <InputField
                label="名（カナ）"
                name="firstNameKana"
                required
                placeholder="タロウ"
                register={register}
                errors={errors}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="生年月日"
                name="birthDate"
                type="date"
                required
                register={register}
                errors={errors}
              />
              <SelectField
                label="性別"
                name="gender"
                required
                options={[
                  { value: 'male', label: '男性' },
                  { value: 'female', label: '女性' },
                  { value: 'other', label: 'その他' },
                ]}
                register={register}
                errors={errors}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="電話番号"
                name="phoneNumber"
                type="tel"
                required
                placeholder="09012345678"
                helpText="ハイフンなしで入力"
                register={register}
                errors={errors}
              />
              <InputField
                label="個人メールアドレス"
                name="personalEmail"
                type="email"
                required
                register={register}
                errors={errors}
              />
            </div>
            <InputField
              label="機器受け取り希望時間（任意）"
              name="equipmentPickupTime"
              placeholder="例: 14:00"
              register={register}
              errors={errors}
            />
          </FormSection>

          {/* Section 2: 現住所 */}
          <FormSection>
            <SectionHeader title="現住所" />
            <InputField
              label="郵便番号"
              name="currentAddress.postalCode"
              required
              placeholder="123-4567"
              helpText="ハイフン付きで入力"
              register={register}
              errors={errors}
            />
            <SelectField
              label="都道府県"
              name="currentAddress.prefecture"
              required
              options={PREFECTURES}
              register={register}
              errors={errors}
            />
            <InputField
              label="市区町村"
              name="currentAddress.city"
              required
              register={register}
              errors={errors}
            />
            <InputField
              label="番地"
              name="currentAddress.street"
              required
              register={register}
              errors={errors}
            />
            <InputField
              label="建物名・部屋番号（任意）"
              name="currentAddress.building"
              register={register}
              errors={errors}
            />
          </FormSection>

          {/* Section 3: 住民票住所 */}
          <FormSection>
            <SectionHeader title="住民票住所" />
            <CheckboxField
              label="現住所と同じ"
              name="residentAddress.sameAsCurrent"
              register={register}
              errors={errors}
            />
            {!sameAsCurrent && (
              <>
                <InputField
                  label="郵便番号"
                  name="residentAddress.postalCode"
                  placeholder="123-4567"
                  register={register}
                  errors={errors}
                />
                <SelectField
                  label="都道府県"
                  name="residentAddress.prefecture"
                  options={PREFECTURES}
                  register={register}
                  errors={errors}
                />
                <InputField
                  label="市区町村"
                  name="residentAddress.city"
                  register={register}
                  errors={errors}
                />
                <InputField
                  label="番地"
                  name="residentAddress.street"
                  register={register}
                  errors={errors}
                />
                <InputField
                  label="建物名・部屋番号（任意）"
                  name="residentAddress.building"
                  register={register}
                  errors={errors}
                />
              </>
            )}
          </FormSection>

          {/* Section 4: 緊急連絡先 */}
          <FormSection>
            <SectionHeader title="緊急連絡先" />
            <InputField
              label="氏名"
              name="emergencyContact.name"
              required
              register={register}
              errors={errors}
            />
            <InputField
              label="続柄"
              name="emergencyContact.relationship"
              required
              placeholder="例: 父、母、配偶者"
              register={register}
              errors={errors}
            />
            <InputField
              label="電話番号"
              name="emergencyContact.phoneNumber"
              type="tel"
              required
              placeholder="09012345678"
              register={register}
              errors={errors}
            />
          </FormSection>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/onboarding`)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={formState.isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {formState.isSubmitting ? '送信中...' : '保存して次へ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
