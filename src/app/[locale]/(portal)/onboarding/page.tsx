'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { getDemoOnboardingData } from '@/lib/demo-onboarding-data';
import { ProgressIndicator } from '@/features/onboarding/components/ProgressIndicator';
import { FormCard } from '@/features/onboarding/components/FormCard';
import { NextActionCard } from '@/features/onboarding/components/NextActionCard';
// import { DocumentTextIcon } from '@heroicons/react/24/outline'; // アイコン表示で使用予定

/**
 * Onboarding Dashboard Page
 *
 * Main dashboard for new employees to:
 * - View overall progress
 * - Access all 4 forms
 * - See next recommended action
 * - Track deadline
 */
export default function OnboardingDashboard() {
  const params = useParams();
  const locale = params?.locale as string;

  const {
    application,
    getProgress,
    startAutoSave,
    stopAutoSave,
    lastSavedAt,
    initializeApplication,
    initializeBasicInfoForm,
    initializeFamilyInfoForm,
    initializeBankAccountForm,
    initializeCommuteRouteForm,
  } = useOnboardingStore();

  const [progress, setProgress] = useState(getProgress());

  // Initialize demo data if no application exists
  useEffect(() => {
    if (!application) {
      console.log('[Onboarding] No application found, initializing demo data');
      const demoData = getDemoOnboardingData();
      initializeApplication(demoData.application);
      initializeBasicInfoForm(demoData.basicInfoForm);
      initializeFamilyInfoForm(demoData.familyInfoForm);
      initializeBankAccountForm(demoData.bankAccountForm);
      initializeCommuteRouteForm(demoData.commuteRouteForm);
    }
  }, [
    application,
    initializeApplication,
    initializeBasicInfoForm,
    initializeFamilyInfoForm,
    initializeBankAccountForm,
    initializeCommuteRouteForm,
  ]);

  // Initialize auto-save on mount
  useEffect(() => {
    startAutoSave();

    return () => {
      stopAutoSave();
    };
  }, [startAutoSave, stopAutoSave]);

  // Update progress when store changes
  useEffect(() => {
    setProgress(getProgress());
  }, [getProgress, application]);

  // If no application, show loading (it will be initialized by useEffect)
  if (!application) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            読み込み中...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            入社手続きデータを初期化しています
          </p>
        </div>
      </div>
    );
  }

  // Format auto-save timestamp
  const formatLastSaved = () => {
    if (!lastSavedAt) return '';
    const date = new Date(lastSavedAt);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            入社手続きダッシュボード
          </h1>
          <p className="mt-2 text-gray-600">
            ようこそ、{application.applicantName}さん
          </p>
          {lastSavedAt && (
            <p className="mt-1 text-sm text-gray-500">
              最終保存: {formatLastSaved()}
            </p>
          )}
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <ProgressIndicator progress={progress} />
        </div>

        {/* Next Action */}
        {progress.nextAction && (
          <div className="mb-8">
            <NextActionCard
              nextAction={progress.nextAction}
              deadline={application.deadline}
            />
          </div>
        )}

        {/* Forms Grid */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            提出フォーム一覧
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {progress.forms.map((form) => (
              <FormCard
                key={form.formType}
                form={form}
                applicationId={application.id}
                locale={locale}
              />
            ))}
          </div>
        </div>

        {/* Required Documents Notice */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            必要書類について
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>入社手続きには以下の書類が必要になる場合があります：</p>
            <ul className="ml-6 list-disc space-y-1">
              <li>年金手帳（基礎年金番号が分かるもの）</li>
              <li>雇用保険被保険者証（お持ちの方のみ）</li>
              <li>給与所得者の扶養控除等（異動）申告書（前職がある方）</li>
              <li>マイナンバーカードまたは通知カード</li>
              <li>通勤経路の地図・スクリーンショット</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              ※書類が手元にない場合は、後で提出することも可能です
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
