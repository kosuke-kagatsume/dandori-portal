'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SectionHeader,
  FormSection,
} from '@/features/onboarding/forms/FormFields';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useCommuteRouteForm } from '@/features/onboarding/hooks/useCommuteRouteForm';

/**
 * Commute Route Form Page
 *
 * 通勤経路申請フォーム
 * Sections:
 * 1. 確認事項（4項目）
 * 2. 基本情報
 * 3. 通勤状況
 * 4. 通勤経路（公共交通機関または自家用車）
 */
export default function CommuteRouteFormPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const applicationId = params?.applicationId as string;

  const { register, handleSubmit, errors, watch, updateForm, submitForm } = useCommuteRouteForm();

  // Watch dynamic field values for conditional rendering
  const commuteStatus = watch('commuteStatus') as 'commute' | 'remote' | 'no-office';
  const transportMethod = watch('transportMethod') as 'public' | 'private' | '';

  const onSubmit = async (data: any) => {
    try {
      updateForm(data);
      await submitForm();
      router.push(`/${locale}/onboarding/${applicationId}`);
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
          <h1 className="text-2xl font-bold text-gray-900">通勤経路申請</h1>
          <p className="mt-1 text-sm text-gray-600">
            通勤経路と交通費について入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: 確認事項 */}
          <FormSection>
            <SectionHeader title="確認事項" />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">
                以下の項目を必ずお読みいただき、チェックしてください
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    {...register('confirmations.transportAllowanceCompliance')}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    交通費は、社会通念上最も経済的かつ合理的と認められる経路および方法により算出された金額を支給します
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    {...register('confirmations.remoteWorkDailyCalculation')}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    在宅勤務制度を利用する場合、交通費は日割り計算となります
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    {...register('confirmations.expenseDeadline')}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    交通費の精算は毎月末日までに申請してください
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    {...register('confirmations.bicycleProhibition')}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    自転車通勤は原則禁止です（特別な事情がある場合は人事部に相談してください）
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Section 2: 基本情報 */}
          <FormSection>
            <SectionHeader title="基本情報" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  氏名
                </label>
                <input
                  type="text"
                  {...register('name')}
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
                <p className="mt-1 text-xs text-red-600">{errors.applicationType.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自宅住所
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="東京都渋谷区..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">現住所と同じ住所を入力してください</p>
              {errors.address && (
                <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
              )}
            </div>
          </FormSection>

          {/* Section 3: 通勤状況 */}
          <FormSection>
            <SectionHeader title="通勤状況" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                通勤状況
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register('commuteStatus')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="commute">通勤する</option>
                <option value="remote">在宅勤務のみ</option>
                <option value="no-office">出社不要</option>
              </select>
              {errors.commuteStatus && (
                <p className="mt-1 text-xs text-red-600">{errors.commuteStatus.message}</p>
              )}
            </div>

            {commuteStatus === 'remote' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  在宅勤務のみの場合、交通費の支給はありません。
                  <br />
                  出社が必要な場合は都度申請してください。
                </p>
              </div>
            )}

            {commuteStatus === 'no-office' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  出社不要の場合、交通費の支給はありません。
                </p>
              </div>
            )}
          </FormSection>

          {/* Section 4: 通勤経路（通勤する場合のみ） */}
          {commuteStatus === 'commute' && (
            <>
              <FormSection>
                <SectionHeader title="通勤方法" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    通勤方法
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    {...register('transportMethod')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="public">公共交通機関</option>
                    <option value="private">自家用車</option>
                  </select>
                  {errors.transportMethod && (
                    <p className="mt-1 text-xs text-red-600">{errors.transportMethod.message}</p>
                  )}
                </div>
              </FormSection>

              {/* 公共交通機関の場合 */}
              {transportMethod === 'public' && (
                <FormSection>
                  <SectionHeader title="公共交通機関の経路詳細" />

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>入力例：</strong>
                      <br />
                      自宅 → 新宿駅（JR山手線）→ 渋谷駅（東急東横線）→ 中目黒駅
                      → 徒歩5分 → オフィス
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      出発地
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('publicTransit.departure')}
                      placeholder="例: 自宅最寄り駅"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.publicTransit?.departure && (
                      <p className="mt-1 text-xs text-red-600">{errors.publicTransit.departure.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      到着地
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('publicTransit.arrival')}
                      placeholder="例: オフィス最寄り駅"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.publicTransit?.arrival && (
                      <p className="mt-1 text-xs text-red-600">{errors.publicTransit.arrival.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      経路詳細
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      {...register('publicTransit.routeDetails')}
                      rows={4}
                      placeholder="使用する路線と駅を順番に記入してください&#10;例: 自宅 → 新宿駅（JR山手線）→ 渋谷駅 → 徒歩 → オフィス"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.publicTransit?.routeDetails && (
                      <p className="mt-1 text-xs text-red-600">{errors.publicTransit.routeDetails.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        片道運賃
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('publicTransit.oneWayFare', { valueAsNumber: true })}
                        placeholder="500"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">円</p>
                      {errors.publicTransit?.oneWayFare && (
                        <p className="mt-1 text-xs text-red-600">{errors.publicTransit.oneWayFare.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        所要時間
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('publicTransit.travelTime', { valueAsNumber: true })}
                        placeholder="45"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">分</p>
                      {errors.publicTransit?.travelTime && (
                        <p className="mt-1 text-xs text-red-600">{errors.publicTransit.travelTime.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      定期券種類
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      {...register('publicTransit.passType')}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="1month">1ヶ月定期</option>
                      <option value="3months">3ヶ月定期</option>
                      <option value="6months">6ヶ月定期</option>
                    </select>
                    {errors.publicTransit?.passType && (
                      <p className="mt-1 text-xs text-red-600">{errors.publicTransit.passType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      定期券代金
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('publicTransit.passFare', { valueAsNumber: true })}
                      placeholder="15000"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">選択した定期券種類の金額を入力</p>
                    {errors.publicTransit?.passFare && (
                      <p className="mt-1 text-xs text-red-600">{errors.publicTransit.passFare.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      経路図（任意）
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Google Maps等のスクリーンショットをアップロードできます
                    </p>
                    <input
                      type="file"
                      {...register('publicTransit.routeMap')}
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </FormSection>
              )}

              {/* 自家用車の場合 */}
              {transportMethod === 'private' && (
                <FormSection>
                  <SectionHeader title="自家用車の詳細" />

                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>ご注意：</strong>
                      <br />
                      自家用車通勤には会社の承認が必要です。
                      <br />
                      駐車場代は自己負担となります。ガソリン代のみ支給対象です。
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      出発地
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('privateCar.departure')}
                      placeholder="例: 自宅"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.privateCar?.departure && (
                      <p className="mt-1 text-xs text-red-600">{errors.privateCar.departure.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      到着地
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('privateCar.arrival')}
                      placeholder="例: オフィス駐車場"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.privateCar?.arrival && (
                      <p className="mt-1 text-xs text-red-600">{errors.privateCar.arrival.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        片道距離
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('privateCar.distance', { valueAsNumber: true })}
                        placeholder="15"
                        step="0.1"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">km（小数点1桁まで）</p>
                      {errors.privateCar?.distance && (
                        <p className="mt-1 text-xs text-red-600">{errors.privateCar.distance.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        所要時間
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('privateCar.travelTime', { valueAsNumber: true })}
                        placeholder="30"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">分</p>
                      {errors.privateCar?.travelTime && (
                        <p className="mt-1 text-xs text-red-600">{errors.privateCar.travelTime.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      車種
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('privateCar.carModel')}
                      placeholder="例: トヨタ プリウス"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.privateCar?.carModel && (
                      <p className="mt-1 text-xs text-red-600">{errors.privateCar.carModel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ナンバープレート
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('privateCar.licensePlate')}
                      placeholder="例: 品川 500 あ 12-34"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.privateCar?.licensePlate && (
                      <p className="mt-1 text-xs text-red-600">{errors.privateCar.licensePlate.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        燃料タイプ
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        {...register('privateCar.fuelType')}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="gasoline">ガソリン</option>
                        <option value="diesel">ディーゼル</option>
                        <option value="hybrid">ハイブリッド</option>
                        <option value="electric">電気</option>
                      </select>
                      {errors.privateCar?.fuelType && (
                        <p className="mt-1 text-xs text-red-600">{errors.privateCar.fuelType.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        燃費
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('privateCar.fuelEfficiency', { valueAsNumber: true })}
                        placeholder="20"
                        step="0.1"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">km/L（電気の場合はkm/kWh）</p>
                      {errors.privateCar?.fuelEfficiency && (
                        <p className="mt-1 text-xs text-red-600">{errors.privateCar.fuelEfficiency.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      {...register('privateCar.needParking')}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <label className="text-sm text-gray-700">
                        駐車場を会社で手配してほしい
                      </label>
                      <p className="text-xs text-gray-500">会社が駐車場を手配する場合、駐車場代は自己負担となります</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      経路図（任意）
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Google Maps等のスクリーンショットをアップロードできます
                    </p>
                    <input
                      type="file"
                      {...register('privateCar.routeMap')}
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      必要書類
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>運転免許証のコピー</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>自動車保険証券のコピー</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>車検証のコピー</span>
                      </li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      ※ 上記書類は人事部に直接提出してください
                    </p>
                  </div>
                </FormSection>
              )}
            </>
          )}

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
