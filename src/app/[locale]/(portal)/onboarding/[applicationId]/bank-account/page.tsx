'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SectionHeader,
  FormSection,
} from '@/features/onboarding/forms/FormFields';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useBankAccountForm, type BankAccountFormInput } from '@/features/onboarding/hooks/useBankAccountForm';

/**
 * Bank Account Form Page
 *
 * 給与等支払先口座フォーム（11項目）
 * Sections:
 * 1. 基本情報（自動入力）
 * 2. 申請区分
 * 3. 口座情報
 * 4. 同意事項
 */
export default function BankAccountFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const applicationId = params?.applicationId as string;

  const { register, handleSubmit, errors, updateForm, submitForm } = useBankAccountForm();

  const onSubmit = async (data: BankAccountFormInput) => {
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
          <h1 className="text-2xl font-bold text-gray-900">
            給与等支払先口座
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            給与振込先の口座情報を入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: 基本情報（自動入力） - disabled fields remain unchanged */}
          <FormSection>
            <SectionHeader title="基本情報" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  {...register('email')}
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
                  {...register('employeeNumber')}
                  disabled
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名（フルネーム）
              </label>
              <input
                type="text"
                {...register('fullName')}
                disabled
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">姓と名の間に全角スペースを入れてください</p>
            </div>
          </FormSection>

          {/* Section 2: 申請区分 */}
          <FormSection>
            <SectionHeader title="申請区分" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申請区分
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register('applicationType')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="new">新規登録</option>
                <option value="change">変更</option>
              </select>
              {errors.applicationType && (
                <p className="mt-1 text-xs text-red-600">{String(errors.applicationType.message || '')}</p>
              )}
            </div>
          </FormSection>

          {/* Section 3: 口座情報 */}
          <FormSection>
            <SectionHeader title="口座情報" />

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>ご注意：</strong>
                <br />
                ・普通預金口座のみ登録可能です（当座預金は登録できません）
                <br />
                ・銀行コード・支店コードは4桁・3桁の数字です
                <br />
                ・口座名義は必ず全角カナで入力してください
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  銀行名
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  {...register('bankName')}
                  placeholder="例: 三菱UFJ銀行"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.bankName && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.bankName.message || '')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  銀行コード
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  {...register('bankCode')}
                  placeholder="0005"
                  maxLength={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">4桁の数字</p>
                {errors.bankCode && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.bankCode.message || '')}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  支店名
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  {...register('branchName')}
                  placeholder="例: 新宿支店"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.branchName && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.branchName.message || '')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  支店コード
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  {...register('branchCode')}
                  placeholder="123"
                  maxLength={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">3桁の数字</p>
                {errors.branchCode && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.branchCode.message || '')}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  口座番号
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  {...register('accountNumber')}
                  placeholder="1234567"
                  maxLength={7}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">7桁の数字</p>
                {errors.accountNumber && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.accountNumber.message || '')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  口座名義（全角カナ）
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  {...register('accountHolderKana')}
                  placeholder="ヤマダ タロウ"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">名字と名前の間に全角スペース</p>
                {errors.accountHolderKana && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.accountHolderKana.message || '')}</p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Section 4: 同意事項 */}
          <FormSection>
            <SectionHeader title="同意事項" />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">
                口座振込に関する同意事項
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    給与等の支払いは、指定された口座への振込により行われます
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    口座情報に誤りがあった場合、振込が遅延する場合があります
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    口座情報を変更する場合は、事前に人事部に連絡してください
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    振込手数料は会社が負担します
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                {...register('consent')}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                上記の同意事項を確認し、同意します
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            {errors.consent && (
              <p className="mt-1 text-xs text-red-600">{String(errors.consent.message || '')}</p>
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
