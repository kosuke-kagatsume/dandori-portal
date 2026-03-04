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
  EnvelopeIcon,
  PlusIcon,
  XMarkIcon,
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

  // 新規登録ダイアログ
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newApplicant, setNewApplicant] = useState({
    name: '',
    email: '',
    hireDate: '',
    department: '',
    position: '',
  });

  // 招待メール送信確認
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  // applicationの状態管理
  const [localApplications, setLocalApplications] = useState<OnboardingApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  // フィルター・検索処理
  const filteredApplications = useMemo(() => {
    let filtered = localApplications;

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
  }, [localApplications, statusFilter, searchQuery]);

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

  // APIからデータをロード
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoadingApps(true);
        const res = await fetch('/api/onboarding/applications');
        const result = await res.json();
        if (result.success && result.data) {
          // API response を OnboardingApplication 型にマッピング
          const apps: OnboardingApplication[] = result.data.map((app: Record<string, unknown>) => ({
            id: app.id as string,
            applicantEmail: app.applicantEmail as string,
            applicantName: app.applicantName as string,
            hireDate: app.hireDate as string,
            status: app.status as string,
            createdAt: app.createdAt as string,
            updatedAt: app.updatedAt as string,
            invitedAt: app.invitedAt as string | undefined,
            submittedAt: app.submittedAt as string | undefined,
            reviewedAt: app.reviewedAt as string | undefined,
            approvedAt: app.approvedAt as string | undefined,
            approvedBy: app.approvedBy as string | undefined,
            employeeNumber: app.employeeNumber as string | undefined,
            department: app.department as string | undefined,
            position: app.position as string | undefined,
            deadline: app.deadline as string || app.hireDate as string,
            accessToken: app.accessToken as string || '',
            hrNotes: app.hrNotes as string | undefined,
            basicInfoFormId: '',
            familyInfoFormId: '',
            bankAccountFormId: '',
            commuteRouteFormId: '',
          }));
          setLocalApplications(apps);
        }
      } catch (error) {
        console.error('Failed to fetch onboarding applications:', error);
      } finally {
        setIsLoadingApps(false);
      }
    };
    fetchApplications();
  }, []);

  // 新規登録処理
  const handleCreateApplication = async () => {
    if (!newApplicant.name || !newApplicant.email || !newApplicant.hireDate) {
      alert('氏名、メールアドレス、入社日は必須です');
      return;
    }

    try {
      const res = await fetch('/api/onboarding/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: newApplicant.name,
          applicantEmail: newApplicant.email,
          hireDate: newApplicant.hireDate,
          department: newApplicant.department || null,
          position: newApplicant.position || null,
          deadline: new Date(new Date(newApplicant.hireDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const app = result.data;
        const newApp: OnboardingApplication = {
          id: app.id,
          applicantEmail: app.applicantEmail,
          applicantName: app.applicantName,
          hireDate: app.hireDate,
          status: app.status || 'invited',
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          invitedAt: app.invitedAt,
          deadline: app.deadline || app.hireDate,
          accessToken: app.accessToken || '',
          department: app.department,
          position: app.position,
          basicInfoFormId: '',
          familyInfoFormId: '',
          bankAccountFormId: '',
          commuteRouteFormId: '',
        };
        setLocalApplications([newApp, ...localApplications]);
      }
      setNewApplicant({ name: '', email: '', hireDate: '', department: '', position: '' });
      setShowNewDialog(false);
    } catch (error) {
      console.error('Failed to create application:', error);
      alert('登録に失敗しました');
    }
  };

  // 招待メール送信処理
  const handleSendInvite = async (applicationId: string) => {
    const application = localApplications.find(app => app.id === applicationId);
    if (!application) {
      alert('申請が見つかりません');
      return;
    }

    setSendingInvite(applicationId);

    try {
      const response = await fetch('/api/onboarding/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: application.id,
          applicantEmail: application.applicantEmail,
          applicantName: application.applicantName,
          companyName: 'Dandori株式会社', // TODO: テナント情報から取得
          hireDate: application.hireDate,
          department: application.department || '未設定',
          position: application.position || '未設定',
          deadline: application.deadline,
          accessToken: application.accessToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLocalApplications(prev =>
          prev.map(app =>
            app.id === applicationId
              ? { ...app, status: 'invited' as OnboardingStatus, invitedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : app
          )
        );
        alert(`招待メールを ${application.applicantEmail} に送信しました`);
      } else {
        alert(`メール送信に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('招待メール送信エラー:', error);
      alert('メール送信中にエラーが発生しました');
    } finally {
      setSendingInvite(null);
    }
  };


  // 統計データ
  const statistics = useMemo(() => {
    const total = localApplications.length;
    const notInvited = localApplications.filter((app) => app.status === 'not_invited').length;
    const invited = localApplications.filter((app) => app.status === 'invited').length;
    const notSubmitted = localApplications.filter((app) => app.status === 'not_submitted').length;
    const submitted = localApplications.filter((app) => app.status === 'submitted').length;
    const returned = localApplications.filter((app) => app.status === 'returned').length;
    const approved = localApplications.filter((app) => app.status === 'approved').length;
    const registered = localApplications.filter((app) => app.status === 'registered').length;

    // 期限超過
    const now = new Date();
    const overdue = localApplications.filter((app) => {
      if (app.status === 'approved' || app.status === 'registered') return false;
      return new Date(app.deadline) < now;
    }).length;

    return { total, notInvited, invited, notSubmitted, submitted, returned, approved, registered, overdue };
  }, [localApplications]);

  // ステータスバッジ
  const getStatusBadge = (status: OnboardingStatus) => {
    const badges: Record<string, { label: string; class: string }> = {
      not_invited: { label: '未招待', class: 'bg-slate-100 text-slate-800' },
      invited: { label: '招待済み', class: 'bg-cyan-100 text-cyan-800' },
      not_submitted: { label: '未提出', class: 'bg-gray-100 text-gray-800' },
      submitted: { label: '提出済み', class: 'bg-blue-100 text-blue-800' },
      returned: { label: '差し戻し', class: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', class: 'bg-green-100 text-green-800' },
      registered: { label: '登録完了', class: 'bg-purple-100 text-purple-800' },
    };

    const badge = badges[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">入社手続き管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              入社予定者の手続き状況を管理します
            </p>
          </div>
          <button
            onClick={() => setShowNewDialog(true)}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <PlusIcon className="h-5 w-5" />
            新規登録
          </button>
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
                <option value="not_invited">未招待</option>
                <option value="invited">招待済み</option>
                <option value="not_submitted">未提出</option>
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
                {isLoadingApps ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                        <p className="text-sm text-gray-500">読み込み中...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedApplications.length === 0 ? (
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
                        <div className="flex items-center gap-2">
                          {application.status === 'not_invited' && (
                            <button
                              onClick={() => handleSendInvite(application.id)}
                              disabled={sendingInvite === application.id}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 disabled:opacity-50"
                            >
                              <EnvelopeIcon className="h-4 w-4" />
                              {sendingInvite === application.id ? '送信中...' : '招待送信'}
                            </button>
                          )}
                          <Link
                            href={`/${locale}/onboarding-admin/${application.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            詳細を見る
                          </Link>
                        </div>
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
      {/* 新規登録ダイアログ */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">新規入社予定者を登録</h2>
              <button
                onClick={() => setShowNewDialog(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newApplicant.name}
                  onChange={(e) => setNewApplicant({ ...newApplicant, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: 山田太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newApplicant.email}
                  onChange={(e) => setNewApplicant({ ...newApplicant, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: yamada@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  入社日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newApplicant.hireDate}
                  onChange={(e) => setNewApplicant({ ...newApplicant, hireDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  部署
                </label>
                <input
                  type="text"
                  value={newApplicant.department}
                  onChange={(e) => setNewApplicant({ ...newApplicant, department: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: 営業部"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  役職
                </label>
                <input
                  type="text"
                  value={newApplicant.position}
                  onChange={(e) => setNewApplicant({ ...newApplicant, position: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例: 営業"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNewDialog(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateApplication}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                登録（未招待状態）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
