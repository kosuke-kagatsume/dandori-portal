'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  BanknotesIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import type {
  OnboardingApplication,
  OnboardingStatus,
  FormStatus,
  FormType,
  ApprovalHistory,
} from '@/types/onboarding';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useUserStore } from '@/lib/store/user-store';
import { toast } from 'sonner';

/**
 * HR用個別申請詳細・承認画面
 *
 * 個別の入社申請を確認・承認・差し戻しする画面
 * Features:
 * - 申請者情報表示
 * - 4フォームの詳細確認
 * - フォーム別の承認・差し戻し
 * - 承認履歴表示
 * - HR用メモ機能
 */
export default function OnboardingAdminDetailPage() {
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _router = useRouter(); // 将来的にページ遷移で使用予定
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _locale = params?.locale as string; // 将来的にi18nで使用予定
  const applicationId = params?.applicationId as string;

  // Zustand stores
  const {
    approveForm,
    returnForm,
    approveAllForms,
    basicInfoForm,
    familyInfoForm,
    bankAccountForm,
    commuteRouteForm,
    initializeApplication,
    initializeBasicInfoForm,
    initializeFamilyInfoForm,
    initializeBankAccountForm,
    initializeCommuteRouteForm,
  } = useOnboardingStore();
  const { currentUser } = useUserStore();

  // State
  const [selectedTab, setSelectedTab] = useState<FormType>('basic_info');
  const [selectedFormType, setSelectedFormType] = useState<FormType>('basic_info');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComment, setReturnComment] = useState('');
  const [hrNotes, setHrNotes] = useState('');

  // HR管理画面用：applicationIdに応じたデータを読み込み
  useEffect(() => {
    console.log('[HR Admin] Loading application data for:', applicationId);
    import('@/lib/demo-onboarding-applications').then(
      ({ getApplicationData }) => {
        const data = getApplicationData(applicationId);

        if (data) {
          // demo-onboarding-001（新入太郎）の場合はonboarding-storeから取得
          // それ以外の場合は、このデータを直接storeに設定
          if (applicationId !== 'demo-onboarding-001' && data.basicInfoForm) {
            console.log('[HR Admin] Initializing data for:', data.application.applicantName);
            initializeApplication(data.application);
            initializeBasicInfoForm(data.basicInfoForm);
            initializeFamilyInfoForm(data.familyInfoForm!);
            initializeBankAccountForm(data.bankAccountForm!);
            initializeCommuteRouteForm(data.commuteRouteForm!);
          } else if (applicationId === 'demo-onboarding-001') {
            // 新入太郎のデータは既にonboarding-storeにあるはず
            const existingData = localStorage.getItem('onboarding-storage');
            if (!existingData) {
              console.log('[HR Admin] Initializing data for 新入太郎 from demo-onboarding-data');
              import('@/lib/demo-onboarding-data').then(({ getDemoOnboardingData }) => {
                const onboardingData = getDemoOnboardingData();
                initializeApplication(onboardingData.application);
                initializeBasicInfoForm(onboardingData.basicInfoForm);
                initializeFamilyInfoForm(onboardingData.familyInfoForm);
                initializeBankAccountForm(onboardingData.bankAccountForm);
                initializeCommuteRouteForm(onboardingData.commuteRouteForm);
              });
            }
          }
        }
      }
    );
  }, [applicationId, initializeApplication, initializeBasicInfoForm, initializeFamilyInfoForm, initializeBankAccountForm, initializeCommuteRouteForm]); // applicationIdが変わるたびに実行

  // Demo data - 実際にはAPIから取得
  const application: OnboardingApplication | null = useMemo(() => {
    // applicationIdに応じたデモデータを返す
    const applications: Record<string, OnboardingApplication> = {
      'demo-onboarding-001': {
        id: 'demo-onboarding-001',
        employeeId: '6',
        applicantEmail: 'shinnyu@dandori.local',
        applicantName: '新入太郎',
        hireDate: '2025-11-01',
        status: 'draft',
        createdAt: '2025-10-15T00:00:00Z',
        updatedAt: '2025-10-18T00:00:00Z',
        basicInfoFormId: 'demo-basic-001',
        familyInfoFormId: 'demo-family-001',
        bankAccountFormId: 'demo-bank-001',
        commuteRouteFormId: 'demo-commute-001',
        deadline: '2025-10-31T23:59:59Z',
        accessToken: 'demo-access-token-001',
        department: '営業部',
        position: '営業',
        hrNotes: 'デモ用の入社申請データです',
      },
      'demo-onboarding-002': {
        id: 'demo-onboarding-002',
        employeeId: '7',
        applicantEmail: 'yamada.hanako@dandori.local',
        applicantName: '山田花子',
        hireDate: '2025-11-01',
        status: 'submitted',
        createdAt: '2025-10-10T00:00:00Z',
        updatedAt: '2025-10-16T00:00:00Z',
        basicInfoFormId: 'demo-basic-002',
        familyInfoFormId: 'demo-family-002',
        bankAccountFormId: 'demo-bank-002',
        commuteRouteFormId: 'demo-commute-002',
        deadline: '2025-10-31T23:59:59Z',
        accessToken: 'demo-access-token-002',
        department: 'エンジニアリング部',
        position: 'エンジニア',
        hrNotes: '',
      },
      'demo-onboarding-003': {
        id: 'demo-onboarding-003',
        employeeId: '8',
        applicantEmail: 'suzuki.jiro@dandori.local',
        applicantName: '鈴木次郎',
        hireDate: '2025-11-15',
        status: 'returned',
        createdAt: '2025-10-05T00:00:00Z',
        updatedAt: '2025-10-17T00:00:00Z',
        basicInfoFormId: 'demo-basic-003',
        familyInfoFormId: 'demo-family-003',
        bankAccountFormId: 'demo-bank-003',
        commuteRouteFormId: 'demo-commute-003',
        deadline: '2025-11-07T23:59:59Z',
        accessToken: 'demo-access-token-003',
        department: '総務部',
        position: '総務',
        hrNotes: '住所の表記に誤りがあるため、差し戻しました。',
      },
      'demo-onboarding-004': {
        id: 'demo-onboarding-004',
        employeeId: '9',
        applicantEmail: 'tanaka.yuki@dandori.local',
        applicantName: '田中雪',
        hireDate: '2025-12-01',
        status: 'approved',
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-18T00:00:00Z',
        basicInfoFormId: 'demo-basic-004',
        familyInfoFormId: 'demo-family-004',
        bankAccountFormId: 'demo-bank-004',
        commuteRouteFormId: 'demo-commute-004',
        deadline: '2025-11-23T23:59:59Z',
        accessToken: 'demo-access-token-004',
        department: '人事部',
        position: '人事',
        hrNotes: '全フォーム承認完了。入社準備を進めてください。',
      },
      'demo-onboarding-005': {
        id: 'demo-onboarding-005',
        employeeId: '10',
        applicantEmail: 'sato.akira@dandori.local',
        applicantName: '佐藤明',
        hireDate: '2025-12-01',
        status: 'draft',
        createdAt: '2025-10-12T00:00:00Z',
        updatedAt: '2025-10-18T00:00:00Z',
        basicInfoFormId: 'demo-basic-005',
        familyInfoFormId: 'demo-family-005',
        bankAccountFormId: 'demo-bank-005',
        commuteRouteFormId: 'demo-commute-005',
        deadline: '2025-11-23T23:59:59Z',
        accessToken: 'demo-access-token-005',
        department: '経理部',
        position: '経理',
        hrNotes: '',
      },
    };

    const app = applications[applicationId] || null;
    console.log('[HR Admin Detail] applicationId:', applicationId, 'application:', app);
    return app;
  }, [applicationId]);

  // フォームステータス（onboarding-storeから取得）
  const formStatuses = useMemo(() => ({
    basic_info: (basicInfoForm?.status || 'draft') as FormStatus,
    family_info: (familyInfoForm?.status || 'draft') as FormStatus,
    bank_account: (bankAccountForm?.status || 'draft') as FormStatus,
    commute_route: (commuteRouteForm?.status || 'draft') as FormStatus,
  }), [basicInfoForm, familyInfoForm, bankAccountForm, commuteRouteForm]);

  // 承認履歴（デモデータ）
  const approvalHistory: ApprovalHistory[] = useMemo(() => [
    {
      id: 'history-001',
      applicationId: applicationId,
      formType: 'basic_info',
      action: 'submit',
      performedBy: '6',
      performedByName: '新入太郎',
      performedAt: '2025-10-15T10:00:00Z',
      comment: '基本情報を提出しました',
    },
  ], [applicationId]);

  if (!application) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">申請が見つかりませんでした</p>
          <Link
            href={`/${_locale}/onboarding-admin`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  // ステータスバッジ
  const getStatusBadge = (status: FormStatus | OnboardingStatus) => {
    const badges = {
      draft: { label: '下書き', class: 'bg-gray-100 text-gray-800' },
      submitted: { label: '提出済み', class: 'bg-blue-100 text-blue-800' },
      returned: { label: '差し戻し', class: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', class: 'bg-green-100 text-green-800' },
      registered: { label: '登録完了', class: 'bg-purple-100 text-purple-800' },
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.class}`}
      >
        {badge.label}
      </span>
    );
  };

  // フォーム情報
  const forms = [
    {
      type: 'basic_info' as FormType,
      name: '基本情報',
      icon: DocumentTextIcon,
      status: formStatuses.basic_info,
    },
    {
      type: 'family_info' as FormType,
      name: '家族情報',
      icon: UserIcon,
      status: formStatuses.family_info,
    },
    {
      type: 'bank_account' as FormType,
      name: '給与振込口座',
      icon: BanknotesIcon,
      status: formStatuses.bank_account,
    },
    {
      type: 'commute_route' as FormType,
      name: '通勤経路',
      icon: MapPinIcon,
      status: formStatuses.commute_route,
    },
  ];

  // 承認処理
  const handleApprove = (formType: FormType) => {
    if (!currentUser) {
      toast.error('ユーザー情報が取得できませんでした');
      return;
    }

    try {
      // onboarding-storeのメソッドを呼び出し
      approveForm(formType, currentUser.id);
      toast.success(`${formType}を承認しました`);
      setShowApproveModal(false);
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('承認処理に失敗しました');
    }
  };

  // 差し戻し処理
  const handleReturn = (formType: FormType) => {
    if (!returnComment.trim()) {
      toast.error('差し戻し理由を入力してください');
      return;
    }

    if (!currentUser) {
      toast.error('ユーザー情報が取得できませんでした');
      return;
    }

    try {
      // onboarding-storeのメソッドを呼び出し
      returnForm(formType, returnComment, currentUser.id);
      toast.success(`${formType}を差し戻しました`);
      setShowReturnModal(false);
      setReturnComment('');
    } catch (error) {
      console.error('Return error:', error);
      toast.error('差し戻し処理に失敗しました');
    }
  };

  // 全承認処理
  const handleApproveAll = () => {
    if (!currentUser) {
      toast.error('ユーザー情報が取得できませんでした');
      return;
    }

    try {
      // onboarding-storeのメソッドを呼び出し
      approveAllForms(currentUser.id);
      toast.success('全フォームを承認しました');
    } catch (error) {
      console.error('Approve all error:', error);
      toast.error('一括承認処理に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/${_locale}/onboarding-admin`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            一覧に戻る
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {application.applicantName}の入社申請
              </h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <span>{application.applicantEmail}</span>
                <span>|</span>
                <span>
                  入社日: {new Date(application.hireDate).toLocaleDateString('ja-JP')}
                </span>
                <span>|</span>
                <span>{application.department} - {application.position}</span>
              </div>
            </div>
            <div>{getStatusBadge(application.status)}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Form Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Forms Tabs */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {forms.map((form) => (
                    <button
                      key={form.type}
                      onClick={() => setSelectedTab(form.type)}
                      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                        selectedTab === form.type
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <form.icon className="h-5 w-5" />
                      <span>{form.name}</span>
                      {getStatusBadge(form.status)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {selectedTab === 'basic_info' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">
                        基本情報フォームの内容がここに表示されます。
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        氏名、生年月日、住所、緊急連絡先などの情報を確認できます。
                      </p>
                    </div>

                    {/* Approval Status or Action Buttons */}
                    {formStatuses.basic_info === 'approved' ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="font-medium">承認済み</span>
                        </div>
                        {basicInfoForm?.approvedAt && (
                          <p className="mt-2 text-sm text-green-700">
                            承認日時: {new Date(basicInfoForm.approvedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                        {basicInfoForm?.approvedBy && (
                          <p className="mt-1 text-sm text-green-700">
                            承認者: {basicInfoForm.approvedBy}
                          </p>
                        )}
                      </div>
                    ) : formStatuses.basic_info === 'returned' ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <XCircleIcon className="h-5 w-5" />
                            <span className="font-medium">差し戻し済み</span>
                          </div>
                          {basicInfoForm?.returnedAt && (
                            <p className="mt-2 text-sm text-yellow-700">
                              差し戻し日時: {new Date(basicInfoForm.returnedAt).toLocaleString('ja-JP')}
                            </p>
                          )}
                          {basicInfoForm?.reviewComment && (
                            <p className="mt-2 text-sm text-yellow-700">
                              理由: {basicInfoForm.reviewComment}
                            </p>
                          )}
                        </div>
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedFormType('basic_info');
                              setShowApproveModal(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            承認する
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedFormType('basic_info');
                            setShowApproveModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          承認する
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFormType('basic_info');
                            setShowReturnModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <XCircleIcon className="h-5 w-5" />
                          差し戻す
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'family_info' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">家族情報</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">
                        家族情報フォームの内容がここに表示されます。
                      </p>
                    </div>

                    {/* Approval Status or Action Buttons */}
                    {formStatuses.family_info === 'approved' ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="font-medium">承認済み</span>
                        </div>
                        {familyInfoForm?.approvedAt && (
                          <p className="mt-2 text-sm text-green-700">
                            承認日時: {new Date(familyInfoForm.approvedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                        {familyInfoForm?.approvedBy && (
                          <p className="mt-1 text-sm text-green-700">
                            承認者: {familyInfoForm.approvedBy}
                          </p>
                        )}
                      </div>
                    ) : formStatuses.family_info === 'returned' ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <XCircleIcon className="h-5 w-5" />
                            <span className="font-medium">差し戻し済み</span>
                          </div>
                          {familyInfoForm?.returnedAt && (
                            <p className="mt-2 text-sm text-yellow-700">
                              差し戻し日時: {new Date(familyInfoForm.returnedAt).toLocaleString('ja-JP')}
                            </p>
                          )}
                          {familyInfoForm?.reviewComment && (
                            <p className="mt-2 text-sm text-yellow-700">
                              理由: {familyInfoForm.reviewComment}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedFormType('family_info');
                              setShowApproveModal(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            承認する
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedFormType('family_info');
                            setShowApproveModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          承認する
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFormType('family_info');
                            setShowReturnModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <XCircleIcon className="h-5 w-5" />
                          差し戻す
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'bank_account' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">給与振込口座</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">
                        給与振込口座フォームの内容がここに表示されます。
                      </p>
                    </div>

                    {/* Approval Status or Action Buttons */}
                    {formStatuses.bank_account === 'approved' ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="font-medium">承認済み</span>
                        </div>
                        {bankAccountForm?.approvedAt && (
                          <p className="mt-2 text-sm text-green-700">
                            承認日時: {new Date(bankAccountForm.approvedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                        {bankAccountForm?.approvedBy && (
                          <p className="mt-1 text-sm text-green-700">
                            承認者: {bankAccountForm.approvedBy}
                          </p>
                        )}
                      </div>
                    ) : formStatuses.bank_account === 'returned' ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <XCircleIcon className="h-5 w-5" />
                            <span className="font-medium">差し戻し済み</span>
                          </div>
                          {bankAccountForm?.returnedAt && (
                            <p className="mt-2 text-sm text-yellow-700">
                              差し戻し日時: {new Date(bankAccountForm.returnedAt).toLocaleString('ja-JP')}
                            </p>
                          )}
                          {bankAccountForm?.reviewComment && (
                            <p className="mt-2 text-sm text-yellow-700">
                              理由: {bankAccountForm.reviewComment}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedFormType('bank_account');
                              setShowApproveModal(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            承認する
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedFormType('bank_account');
                            setShowApproveModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          承認する
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFormType('bank_account');
                            setShowReturnModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <XCircleIcon className="h-5 w-5" />
                          差し戻す
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'commute_route' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">通勤経路</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">
                        通勤経路フォームの内容がここに表示されます。
                      </p>
                    </div>

                    {/* Approval Status or Action Buttons */}
                    {formStatuses.commute_route === 'approved' ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="font-medium">承認済み</span>
                        </div>
                        {commuteRouteForm?.approvedAt && (
                          <p className="mt-2 text-sm text-green-700">
                            承認日時: {new Date(commuteRouteForm.approvedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                        {commuteRouteForm?.approvedBy && (
                          <p className="mt-1 text-sm text-green-700">
                            承認者: {commuteRouteForm.approvedBy}
                          </p>
                        )}
                      </div>
                    ) : formStatuses.commute_route === 'returned' ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <XCircleIcon className="h-5 w-5" />
                            <span className="font-medium">差し戻し済み</span>
                          </div>
                          {commuteRouteForm?.returnedAt && (
                            <p className="mt-2 text-sm text-yellow-700">
                              差し戻し日時: {new Date(commuteRouteForm.returnedAt).toLocaleString('ja-JP')}
                            </p>
                          )}
                          {commuteRouteForm?.reviewComment && (
                            <p className="mt-2 text-sm text-yellow-700">
                              理由: {commuteRouteForm.reviewComment}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedFormType('commute_route');
                              setShowApproveModal(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                            承認する
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedFormType('commute_route');
                            setShowApproveModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                          承認する
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFormType('commute_route');
                            setShowReturnModal(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <XCircleIcon className="h-5 w-5" />
                          差し戻す
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Approval History */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">承認履歴</h3>
              <div className="space-y-4">
                {approvalHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">承認履歴はまだありません</p>
                ) : (
                  approvalHistory.map((history) => (
                    <div
                      key={history.id}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex-shrink-0">
                        {history.action === 'approve' ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : history.action === 'return' ? (
                          <XCircleIcon className="h-6 w-6 text-yellow-600" />
                        ) : (
                          <ClockIcon className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {history.performedByName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(history.performedAt).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {history.comment}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                クイックアクション
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleApproveAll}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  全フォームを承認
                </button>
                <button
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  催促メールを送信
                </button>
              </div>
            </div>

            {/* Form Progress */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                フォーム進捗
              </h3>
              <div className="space-y-3">
                {forms.map((form) => (
                  <div key={form.type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{form.name}</span>
                    {getStatusBadge(form.status)}
                  </div>
                ))}
              </div>
            </div>

            {/* HR Notes */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                HR用メモ
              </h3>
              <textarea
                value={hrNotes || application.hrNotes || ''}
                onChange={(e) => setHrNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="申請に関するメモを入力..."
              />
              <button className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                メモを保存
              </button>
            </div>

            {/* Application Info */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-medium text-gray-900">申請情報</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">作成日時:</span>
                  <p className="mt-1 text-gray-900">
                    {new Date(application.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">更新日時:</span>
                  <p className="mt-1 text-gray-900">
                    {new Date(application.updatedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">提出期限:</span>
                  <p className="mt-1 text-gray-900">
                    {new Date(application.deadline).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              フォームを承認しますか？
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              {forms.find((f) => f.type === selectedFormType)?.name}を承認します。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedFormType)}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                承認する
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              フォームを差し戻しますか？
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {forms.find((f) => f.type === selectedFormType)?.name}を差し戻します。理由を入力してください（必須）
            </p>
            <textarea
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              rows={4}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="例: 住所情報に不備があります。正しい住所を入力してください。"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleReturn(selectedFormType)}
                className="flex-1 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
              >
                差し戻す
              </button>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnComment('');
                }}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
