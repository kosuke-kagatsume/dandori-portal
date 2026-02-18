'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  // ArrowPathIcon, // リロードボタンで使用予定
} from '@heroicons/react/24/outline';
import type {
  OnboardingApplication,
  OnboardingStatus,
} from '@/types/onboarding';

/**
 * HR用入社申請管理画面
 *
 * 全新入社員の入社申請を一覧表示・管理する画面
 * Features:
 * - 全申請の一覧表示
 * - ステータス別フィルター
 * - 検索機能（氏名・メール）
 * - 統計カード表示
 * - 個別申請詳細へのリンク
 */
export default function OnboardingAdminPage() {
  const params = useParams();
  const locale = params?.locale as string;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Demo data - 複数の申請データ
  const applications: OnboardingApplication[] = useMemo(() => [
    {
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
    {
      id: 'demo-onboarding-002',
      employeeId: '7',
      applicantEmail: 'yamada.hanako@dandori.local',
      applicantName: '山田花子',
      hireDate: '2025-11-01',
      status: 'submitted',
      createdAt: '2025-10-10T00:00:00Z',
      updatedAt: '2025-10-17T00:00:00Z',
      submittedAt: '2025-10-17T14:30:00Z',
      basicInfoFormId: 'demo-basic-002',
      familyInfoFormId: 'demo-family-002',
      bankAccountFormId: 'demo-bank-002',
      commuteRouteFormId: 'demo-commute-002',
      deadline: '2025-10-31T23:59:59Z',
      accessToken: 'demo-access-token-002',
      department: 'エンジニアリング部',
      position: 'エンジニア',
    },
    {
      id: 'demo-onboarding-003',
      employeeId: '8',
      applicantEmail: 'suzuki.jiro@dandori.local',
      applicantName: '鈴木次郎',
      hireDate: '2025-11-15',
      status: 'returned',
      createdAt: '2025-10-12T00:00:00Z',
      updatedAt: '2025-10-16T00:00:00Z',
      submittedAt: '2025-10-16T10:00:00Z',
      basicInfoFormId: 'demo-basic-003',
      familyInfoFormId: 'demo-family-003',
      bankAccountFormId: 'demo-bank-003',
      commuteRouteFormId: 'demo-commute-003',
      deadline: '2025-11-07T23:59:59Z',
      accessToken: 'demo-access-token-003',
      department: '総務部',
      position: '総務',
      hrNotes: '住所情報に不備があり差し戻し',
    },
    {
      id: 'demo-onboarding-004',
      employeeId: '9',
      applicantEmail: 'tanaka.yuki@dandori.local',
      applicantName: '田中雪',
      hireDate: '2025-12-01',
      status: 'approved',
      createdAt: '2025-10-01T00:00:00Z',
      updatedAt: '2025-10-14T00:00:00Z',
      submittedAt: '2025-10-13T16:45:00Z',
      reviewedAt: '2025-10-14T09:30:00Z',
      approvedAt: '2025-10-14T09:30:00Z',
      approvedBy: '1',
      basicInfoFormId: 'demo-basic-004',
      familyInfoFormId: 'demo-family-004',
      bankAccountFormId: 'demo-bank-004',
      commuteRouteFormId: 'demo-commute-004',
      deadline: '2025-11-23T23:59:59Z',
      accessToken: 'demo-access-token-004',
      department: '人事部',
      position: '人事',
    },
    {
      id: 'demo-onboarding-005',
      employeeId: '10',
      applicantEmail: 'sato.akira@dandori.local',
      applicantName: '佐藤明',
      hireDate: '2025-12-01',
      status: 'draft',
      createdAt: '2025-10-18T00:00:00Z',
      updatedAt: '2025-10-18T00:00:00Z',
      basicInfoFormId: 'demo-basic-005',
      familyInfoFormId: 'demo-family-005',
      bankAccountFormId: 'demo-bank-005',
      commuteRouteFormId: 'demo-commute-005',
      deadline: '2025-11-23T23:59:59Z',
      accessToken: 'demo-access-token-005',
      department: '経理部',
      position: '経理',
    },
  ], []);

  // フィルター・検索処理
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // 検索クエリ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(query) ||
          app.applicantEmail.toLowerCase().includes(query) ||
          app.department?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [applications, statusFilter, searchQuery]);

  // ページネーション計算
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredApplications.slice(start, end);
  }, [filteredApplications, currentPage, itemsPerPage]);

  // フィルター変更時にページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);


  // 統計データ
  const statistics = useMemo(() => {
    const total = applications.length;
    const draft = applications.filter((app) => app.status === 'draft').length;
    const submitted = applications.filter((app) => app.status === 'submitted').length;
    const returned = applications.filter((app) => app.status === 'returned').length;
    const approved = applications.filter((app) => app.status === 'approved').length;
    const registered = applications.filter((app) => app.status === 'registered').length;

    // 期限超過
    const now = new Date();
    const overdue = applications.filter((app) => {
      if (app.status === 'approved' || app.status === 'registered') return false;
      return new Date(app.deadline) < now;
    }).length;

    return { total, draft, submitted, returned, approved, registered, overdue };
  }, [applications]);

  // ステータスバッジ
  const getStatusBadge = (status: OnboardingStatus) => {
    const badges = {
      draft: { label: '下書き', class: 'bg-gray-100 text-gray-800' },
      submitted: { label: '提出済み', class: 'bg-blue-100 text-blue-800' },
      returned: { label: '差し戻し', class: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', class: 'bg-green-100 text-green-800' },
      registered: { label: '登録完了', class: 'bg-purple-100 text-purple-800' },
    };

    const badge = badges[status];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.class}`}
      >
        {badge.label}
      </span>
    );
  };

  // 期限までの日数を計算
  const getDaysUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 期限表示
  const getDeadlineDisplay = (app: OnboardingApplication) => {
    if (app.status === 'approved' || app.status === 'registered') {
      return <span className="text-sm text-gray-500">完了</span>;
    }

    const daysLeft = getDaysUntilDeadline(app.deadline);
    if (daysLeft < 0) {
      return (
        <span className="flex items-center gap-1 text-sm text-red-600">
          <ExclamationTriangleIcon className="h-4 w-4" />
          期限超過 ({Math.abs(daysLeft)}日)
        </span>
      );
    } else if (daysLeft === 0) {
      return <span className="text-sm text-orange-600">今日まで</span>;
    } else if (daysLeft <= 3) {
      return <span className="text-sm text-orange-600">残り{daysLeft}日</span>;
    } else {
      return <span className="text-sm text-gray-600">残り{daysLeft}日</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">入社手続き管理</h1>
          <p className="mt-2 text-sm text-gray-600">
            入社予定者の手続き状況を管理します
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総申請数</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.total}
                </p>
              </div>
              <UserPlusIcon className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">提出済み</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {statistics.submitted}
                </p>
              </div>
              <ClockIcon className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">承認済み</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {statistics.approved}
                </p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-400" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">期限超過</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {statistics.overdue}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="氏名・メールアドレス・部署で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OnboardingStatus | 'all')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="draft">下書き</option>
                <option value="submitted">提出済み</option>
                <option value="returned">差し戻し</option>
                <option value="approved">承認済み</option>
                <option value="registered">登録完了</option>
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <span>{filteredApplications.length}件の申請を表示中</span>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                フィルターをクリア
              </button>
            )}
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    申請者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    部署・役職
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    入社日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    期限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <UserPlusIcon className="h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-500">
                          申請が見つかりませんでした
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {application.applicantName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.applicantEmail}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900">
                            {application.department || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.position || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {new Date(application.hireDate).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getDeadlineDisplay(application)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Link
                          href={`/${locale}/onboarding-admin/${application.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細を見る
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{filteredApplications.length}</span> 件中{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredApplications.length)}
                    </span>{' '}
                    件を表示
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">前へ</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">次へ</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
