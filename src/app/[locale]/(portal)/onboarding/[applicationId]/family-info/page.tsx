'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFieldArray } from 'react-hook-form';
import Link from 'next/link';
import {
  SectionHeader,
  FormSection,
} from '@/features/onboarding/forms/FormFields';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useFamilyInfoForm, type FamilyInfoFormInput } from '@/features/onboarding/hooks/useFamilyInfoForm';

/**
 * Family Info Form Page
 *
 * 家族情報フォーム
 * Sections:
 * 1. 基本情報（自動入力）
 * 2. 配偶者情報
 * 3. 家族メンバー（動的追加、最大6名）
 */
export default function FamilyInfoFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const applicationId = params?.applicationId as string;

  const { register, handleSubmit, errors, watch, control, updateForm, submitForm } = useFamilyInfoForm();

  // 動的フィールド配列の管理
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  // 配偶者の有無を監視
  const hasSpouse = watch('hasSpouse');

  // 家族メンバーを追加
  const addFamilyMember = () => {
    if (fields.length >= 6) {
      alert('家族メンバーは最大6名までです');
      return;
    }

    append({
      nameKanji: '',
      nameKana: '',
      relationship: '',
      birthDate: '',
      liveTogether: true,
      isSameHouseholdSpouse: false,
      incomeTaxDependent: false,
      healthInsuranceDependent: false,
      occupation: '',
      annualIncome: 0,
    });
  };

  const onSubmit = async (data: FamilyInfoFormInput) => {
    try {
      updateForm(data as unknown as Parameters<typeof updateForm>[0]);
      await submitForm();
      (router.push as (path: string) => void)(`/${locale}/onboarding/${applicationId}`);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">家族情報</h1>
          <p className="mt-1 text-sm text-gray-600">
            配偶者・家族の情報を入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: 基本情報（自動入力） */}
          <FormSection>
            <SectionHeader title="基本情報" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue=""
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  従業員番号
                </label>
                <input
                  type="text"
                  name="employeeNumber"
                  defaultValue="-"
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓（漢字）
                </label>
                <input
                  type="text"
                  name="lastNameKanji"
                  defaultValue=""
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名（漢字）
                </label>
                <input
                  type="text"
                  name="firstNameKanji"
                  defaultValue=""
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </FormSection>

          {/* Section 2: 配偶者情報 */}
          <FormSection>
            <SectionHeader title="配偶者情報" />
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                {...register('hasSpouse')}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                配偶者がいる
              </label>
            </div>

            {hasSpouse && (
              <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">配偶者の詳細情報</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      氏名（漢字）
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('spouse.nameKanji')}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.spouse?.nameKanji && (
                      <p className="mt-1 text-xs text-red-600">{String(errors.spouse?.nameKanji?.message || '')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      氏名（カナ）
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('spouse.nameKana')}
                      placeholder="ヤマダ ハナコ"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.spouse?.nameKana && (
                      <p className="mt-1 text-xs text-red-600">{String(errors.spouse?.nameKana?.message || '')}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      生年月日
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('spouse.birthDate')}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.spouse?.birthDate && (
                      <p className="mt-1 text-xs text-red-600">{String(errors.spouse?.birthDate?.message || '')}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      職業
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('spouse.occupation')}
                      placeholder="会社員"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.spouse?.occupation && (
                      <p className="mt-1 text-xs text-red-600">{String(errors.spouse?.occupation?.message || '')}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      年間収入（見込み）
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('spouse.annualIncome', { valueAsNumber: true })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">円</p>
                    {errors.spouse?.annualIncome && (
                      <p className="mt-1 text-xs text-red-600">{String(errors.spouse?.annualIncome?.message || '')}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      {...register('spouse.liveTogether')}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">
                      同居している
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">税額控除・扶養</p>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      {...register('spouse.incomeTaxDependent')}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <label className="text-sm text-gray-700">
                        所得税上の扶養に入れる（年間所得48万円以下）
                      </label>
                      <p className="text-xs text-gray-500">年間所得が48万円以下の場合、所得税の配偶者控除が適用されます</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      {...register('spouse.healthInsuranceDependent')}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <label className="text-sm text-gray-700">
                        健康保険の扶養に入れる（年間所得130万円未満）
                      </label>
                      <p className="text-xs text-gray-500">年間所得が130万円未満の場合、健康保険の扶養に入れます</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </FormSection>

          {/* Section 3: 家族メンバー */}
          <FormSection>
            <div className="flex items-center justify-between">
              <SectionHeader title="その他の家族" />
              <button
                type="button"
                onClick={addFamilyMember}
                disabled={fields.length >= 6}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                家族を追加
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-500">
                  「家族を追加」ボタンをクリックして、家族メンバーを追加してください
                  <br />
                  （最大6名まで）
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">家族{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                        削除
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            氏名（漢字）
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            {...register(`familyMembers.${index}.nameKanji` as const)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {errors.familyMembers?.[index]?.nameKanji && (
                            <p className="mt-1 text-xs text-red-600">
                              {String(errors.familyMembers?.[index]?.nameKanji?.message || '')}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            氏名（カナ）
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            {...register(`familyMembers.${index}.nameKana` as const)}
                            placeholder="ヤマダ イチロウ"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {errors.familyMembers?.[index]?.nameKana && (
                            <p className="mt-1 text-xs text-red-600">
                              {String(errors.familyMembers?.[index]?.nameKana?.message || '')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            続柄
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            {...register(`familyMembers.${index}.relationship` as const)}
                            placeholder="長男、次女など"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {errors.familyMembers?.[index]?.relationship && (
                            <p className="mt-1 text-xs text-red-600">
                              {String(errors.familyMembers?.[index]?.relationship?.message || '')}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            生年月日
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="date"
                            {...register(`familyMembers.${index}.birthDate` as const)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {errors.familyMembers?.[index]?.birthDate && (
                            <p className="mt-1 text-xs text-red-600">
                              {String(errors.familyMembers?.[index]?.birthDate?.message || '')}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            職業
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            {...register(`familyMembers.${index}.occupation` as const)}
                            placeholder="学生、会社員など"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {errors.familyMembers?.[index]?.occupation && (
                            <p className="mt-1 text-xs text-red-600">
                              {String(errors.familyMembers?.[index]?.occupation?.message || '')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            年間収入（見込み）
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="number"
                            {...register(`familyMembers.${index}.annualIncome` as const, { valueAsNumber: true })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">円</p>
                          {errors.familyMembers?.[index]?.annualIncome && (
                            <p className="mt-1 text-xs text-red-600">
                              {String(errors.familyMembers?.[index]?.annualIncome?.message || '')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            {...register(`familyMembers.${index}.liveTogether` as const)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">
                            同居している
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">税額控除・扶養</p>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            {...register(`familyMembers.${index}.incomeTaxDependent` as const)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">
                            所得税上の扶養に入れる
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            {...register(`familyMembers.${index}.healthInsuranceDependent` as const)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">
                            健康保険の扶養に入れる
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => (router.push as (path: string) => void)(`/${locale}/onboarding`)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              保存して次へ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
