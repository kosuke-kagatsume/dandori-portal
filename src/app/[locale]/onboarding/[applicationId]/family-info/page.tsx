'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SectionHeader,
  FormSection,
} from '@/features/onboarding/forms/FormFields';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useOnboardingStore } from '@/lib/store/onboarding-store';

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

  const { familyInfoForm } = useOnboardingStore();
  const [hasSpouse, setHasSpouse] = useState(familyInfoForm?.hasSpouse || false);
  const [familyMembers, setFamilyMembers] = useState(familyInfoForm?.familyMembers || []);

  // 家族メンバーを追加
  const addFamilyMember = () => {
    if (familyMembers.length >= 6) {
      alert('家族メンバーは最大6名までです');
      return;
    }

    setFamilyMembers([
      ...familyMembers,
      {
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
      },
    ]);
  };

  // 家族メンバーを削除
  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: フォーム送信処理
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
          <h1 className="text-2xl font-bold text-gray-900">家族情報</h1>
          <p className="mt-1 text-sm text-gray-600">
            配偶者・家族の情報を入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  defaultValue={familyInfoForm?.email || ''}
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
                  defaultValue={familyInfoForm?.employeeNumber || '-'}
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
                  defaultValue={familyInfoForm?.lastNameKanji || ''}
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
                  defaultValue={familyInfoForm?.firstNameKanji || ''}
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
                name="hasSpouse"
                defaultChecked={hasSpouse}
                onChange={(e) => setHasSpouse(e.target.checked)}
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
                      name="spouse.nameKanji"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      氏名（カナ）
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="spouse.nameKana"
                      required
                      placeholder="ヤマダ ハナコ"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
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
                      name="spouse.birthDate"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      職業
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="spouse.occupation"
                      required
                      placeholder="会社員"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
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
                      name="spouse.annualIncome"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">円</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="spouse.liveTogether"
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
                      name="spouse.incomeTaxDependent"
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
                      name="spouse.healthInsuranceDependent"
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
                disabled={familyMembers.length >= 6}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4" />
                家族を追加
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-500">
                  「家族を追加」ボタンをクリックして、家族メンバーを追加してください
                  <br />
                  （最大6名まで）
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {familyMembers.map((member, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">家族{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeFamilyMember(index)}
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
                            name={`familyMembers.${index}.nameKanji`}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            氏名（カナ）
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            name={`familyMembers.${index}.nameKana`}
                            required
                            placeholder="ヤマダ イチロウ"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
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
                            name={`familyMembers.${index}.relationship`}
                            required
                            placeholder="長男、次女など"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            生年月日
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="date"
                            name={`familyMembers.${index}.birthDate`}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            職業
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            name={`familyMembers.${index}.occupation`}
                            required
                            placeholder="学生、会社員など"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
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
                            name={`familyMembers.${index}.annualIncome`}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">円</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            name={`familyMembers.${index}.liveTogether`}
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
                            name={`familyMembers.${index}.incomeTaxDependent`}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">
                            所得税上の扶養に入れる
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            name={`familyMembers.${index}.healthInsuranceDependent`}
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
              onClick={() => router.push(`/${locale}/onboarding`)}
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
