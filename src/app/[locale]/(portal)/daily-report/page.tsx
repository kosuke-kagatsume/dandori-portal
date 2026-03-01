'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, FileText, Pencil, Trash2, Send, Loader2, Check, X, Eye, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/store/user-store';
import { useDailyReportTemplateStore } from '@/lib/store/daily-report-template-store';
import {
  useDailyReportStore,
  type DailyReport,
  type ReportFieldValue,
  type TemplateForClockOut,
} from '@/lib/store/daily-report-store';
import { DailyReportFormDialog } from '@/features/daily-report/daily-report-form';
import { DailyReportAnalyticsTab } from '@/features/daily-report/analytics/daily-report-analytics-tab';

// === 定数 ===

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: '下書き', variant: 'secondary' },
  submitted: { label: '提出済', variant: 'default' },
  approved: { label: '承認済', variant: 'default' },
  rejected: { label: '差戻', variant: 'outline' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_LABELS[status] || { label: status, variant: 'outline' as const };
  const colorClass =
    status === 'submitted' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
    status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
    status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
    '';

  return (
    <Badge variant={config.variant} className={`text-xs ${colorClass}`}>
      {config.label}
    </Badge>
  );
}

// === メインページ ===

export default function DailyReportPage() {
  const currentUser = useUserStore((state) => state.currentUser);
  const tenantId = currentUser?.tenantId;
  const userId = currentUser?.id;
  const userName = currentUser?.name || '';
  const userRoles = currentUser?.roles || [];

  const {
    reports,
    pendingApprovals,
    isLoading,
    setTenantId,
    fetchReports,
    createReport,
    updateReport,
    submitReport,
    deleteReport,
    getTemplateForEmployee,
    fetchPendingApprovals,
    approveReport,
    rejectReport,
  } = useDailyReportStore();

  const templates = useDailyReportTemplateStore((state) => state.templates);

  // テンプレート情報
  const [template, setTemplate] = useState<TemplateForClockOut | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);

  // フォームダイアログ
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // 削除確認
  const [deleteTarget, setDeleteTarget] = useState<DailyReport | null>(null);

  // 日付フィルター
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );

  // タブ
  const [activeTab, setActiveTab] = useState('my-reports');

  // レビューダイアログ
  const [reviewReport, setReviewReport] = useState<DailyReport | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // 承認確認ダイアログ
  const [approveTarget, setApproveTarget] = useState<DailyReport | null>(null);

  // 差戻しダイアログ
  const [rejectTarget, setRejectTarget] = useState<DailyReport | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 承認権限の判定
  const isApprover =
    userRoles.includes('hr') ||
    userRoles.includes('admin') ||
    userRoles.includes('manager') ||
    userRoles.includes('executive');

  // 初期化
  useEffect(() => {
    if (tenantId && userId) {
      setTenantId(tenantId);

      // 月のレポートを取得
      const startDate = `${filterMonth}-01`;
      const endDate = `${filterMonth}-31`;
      fetchReports({ employeeId: userId, startDate, endDate });

      // テンプレート取得
      setTemplateLoading(true);
      getTemplateForEmployee(userId).then((t) => {
        setTemplate(t);
        setTemplateLoading(false);
      });

      // 承認待ちを取得（承認権限ありの場合）
      if (isApprover) {
        fetchPendingApprovals(userId);
      }
    }
  }, [tenantId, userId, filterMonth, setTenantId, fetchReports, getTemplateForEmployee, fetchPendingApprovals, isApprover]);

  // 新規作成
  const handleCreate = useCallback(() => {
    if (!template) {
      toast.error('日報テンプレートが設定されていません。管理者に連絡してください。');
      return;
    }
    setEditingReport(null);
    setNewDate(new Date().toISOString().split('T')[0]);
    setShowForm(true);
  }, [template]);

  // 編集
  const handleEdit = useCallback((report: DailyReport) => {
    setEditingReport(report);
    setShowForm(true);
  }, []);

  // 下書き保存
  const handleSaveDraft = async (values: ReportFieldValue[]) => {
    if (!userId || !template) return;

    if (editingReport) {
      await updateReport(editingReport.id, { values, status: 'draft' });
    } else {
      await createReport({
        employeeId: userId,
        date: newDate,
        templateId: template.id,
        status: 'draft',
        values,
      });
    }
  };

  // 提出
  const handleSubmit = async (values: ReportFieldValue[]) => {
    if (!userId || !template) return;

    if (editingReport) {
      await updateReport(editingReport.id, { values, status: 'submitted' });
      await submitReport(editingReport.id);
    } else {
      await createReport({
        employeeId: userId,
        date: newDate,
        templateId: template.id,
        status: 'submitted',
        values,
      });
    }
  };

  // 直接提出（下書きから）
  const handleDirectSubmit = async (report: DailyReport) => {
    try {
      await submitReport(report.id);
      toast.success('日報を提出しました');
    } catch {
      toast.error('提出に失敗しました');
    }
  };

  // 削除
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReport(deleteTarget.id);
      toast.success('日報を削除しました');
    } catch {
      toast.error('削除に失敗しました');
    }
    setDeleteTarget(null);
  };

  // レビュー表示
  const handleReview = useCallback((report: DailyReport) => {
    setReviewReport(report);
    setShowReviewForm(true);
  }, []);

  // 承認実行
  const handleApproveConfirm = async () => {
    if (!approveTarget || !userId) return;
    try {
      await approveReport(approveTarget.id, userId, userName);
      toast.success('承認しました');
    } catch {
      toast.error('承認に失敗しました');
    }
    setApproveTarget(null);
  };

  // 差戻し実行
  const handleRejectConfirm = async () => {
    if (!rejectTarget || !userId || !rejectionReason.trim()) {
      toast.error('差戻し理由を入力してください');
      return;
    }
    try {
      await rejectReport(rejectTarget.id, userId, userName, rejectionReason.trim());
      toast.success('差し戻しました');
    } catch {
      toast.error('差戻しに失敗しました');
    }
    setRejectTarget(null);
    setRejectionReason('');
  };

  // レビューダイアログ用のテンプレートフィールド取得
  const getTemplateFieldsForReport = (report: DailyReport) => {
    const tmpl = templates.find((t) => t.id === report.templateId);
    return tmpl?.fields || template?.fields || [];
  };

  // 今日の日報が存在するか
  const todayDate = new Date().toISOString().split('T')[0];
  const todayReport = reports.find((r) => r.date === todayDate);

  // 承認タブ・集計タブを表示するか
  const showApprovalTab = isApprover || pendingApprovals.length > 0;
  const showTabs = showApprovalTab || isApprover;

  // === 自分の日報コンテンツ ===
  const MyReportsContent = (
    <>
      {/* テンプレート未設定の案内 */}
      {!templateLoading && !template && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              日報テンプレートが設定されていません。
            </p>
            <p className="text-sm text-muted-foreground">
              管理者が「設定 &gt; 日報マスタ」からテンプレートを作成し、部署に割り当てる必要があります。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 今日の日報ショートカット */}
      {template && !todayReport && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              今日の日報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              今日 ({todayDate}) の日報はまだ作成されていません。
            </p>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              今日の日報を作成
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 日報一覧 */}
      {reports.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filterMonth.replace('-', '年')}月の日報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>提出日時</TableHead>
                  <TableHead className="w-[140px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={report.status} />
                        {report.status === 'rejected' && report.rejectionReason && (
                          <span className="text-xs text-red-600" title={report.rejectionReason}>
                            ({report.rejectionReason})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {report.submittedAt
                        ? new Date(report.submittedAt).toLocaleString('ja-JP')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {report.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(report)}
                              title="編集"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDirectSubmit(report)}
                              title="提出"
                            >
                              <Send className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(report)}
                              title="削除"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        {(report.status === 'submitted' || report.status === 'approved') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(report)}
                            title="閲覧"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {report.status === 'rejected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(report)}
                            title="再編集"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        !templateLoading && template && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {filterMonth.replace('-', '年')}月の日報はありません
              </p>
            </CardContent>
          </Card>
        )
      )}
    </>
  );

  // === 承認待ちコンテンツ ===
  const PendingApprovalsContent = (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {pendingApprovals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">承認待ち日報</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>提出者</TableHead>
                  <TableHead>テンプレート</TableHead>
                  <TableHead>提出日時</TableHead>
                  <TableHead className="w-[160px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.date}</TableCell>
                    <TableCell>{report.employeeName || report.employeeId}</TableCell>
                    <TableCell>{report.templateName || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {report.submittedAt
                        ? new Date(report.submittedAt).toLocaleString('ja-JP')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReview(report)}
                          title="内容確認"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setApproveTarget(report)}
                          title="承認"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRejectTarget(report)}
                          title="差戻し"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Check className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              承認待ちの日報はありません
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">日報</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {template ? `テンプレート: ${template.name}` : '日報テンプレート未設定'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'my-reports' && (
            <>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-[180px]"
              />
              <Button onClick={handleCreate} disabled={!template || templateLoading}>
                <Plus className="h-4 w-4 mr-2" />
                新規作成
              </Button>
            </>
          )}
        </div>
      </div>

      {/* タブまたは直接コンテンツ */}
      {showTabs ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-reports">自分の日報</TabsTrigger>
            {showApprovalTab && (
              <TabsTrigger value="approvals" className="gap-2">
                承認待ち
                {pendingApprovals.length > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0 min-w-[20px] h-5">
                    {pendingApprovals.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {isApprover && (
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                集計・分析
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-reports" className="space-y-6 mt-4">
            {MyReportsContent}
          </TabsContent>

          {showApprovalTab && (
            <TabsContent value="approvals" className="space-y-6 mt-4">
              {PendingApprovalsContent}
            </TabsContent>
          )}

          {isApprover && (
            <TabsContent value="analytics" className="space-y-6 mt-4">
              <DailyReportAnalyticsTab />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="space-y-6">
          {MyReportsContent}
        </div>
      )}

      {/* ローディング */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 日報フォームダイアログ（自分の日報用） */}
      {template && (
        <DailyReportFormDialog
          open={showForm}
          onOpenChange={setShowForm}
          templateName={editingReport ? `日報編集 - ${editingReport.date}` : `日報作成 - ${newDate}`}
          fields={template.fields}
          initialValues={editingReport?.values}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          readOnly={editingReport?.status === 'submitted' || editingReport?.status === 'approved'}
          description={editingReport ? undefined : `${newDate} の日報を記入してください`}
        />
      )}

      {/* レビューダイアログ（承認者用） */}
      {reviewReport && (
        <DailyReportFormDialog
          open={showReviewForm}
          onOpenChange={(open) => {
            setShowReviewForm(open);
            if (!open) setReviewReport(null);
          }}
          templateName={`日報レビュー - ${reviewReport.employeeName || reviewReport.employeeId} (${reviewReport.date})`}
          fields={getTemplateFieldsForReport(reviewReport)}
          initialValues={reviewReport.values}
          onSaveDraft={async () => {}}
          onSubmit={async () => {}}
          readOnly
          footerContent={
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                閉じる
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowReviewForm(false);
                  setRejectTarget(reviewReport);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                差戻し
              </Button>
              <Button
                onClick={() => {
                  setShowReviewForm(false);
                  setApproveTarget(reviewReport);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                承認
              </Button>
            </div>
          }
        />
      )}

      {/* 削除確認 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>日報を削除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.date} の下書きを削除しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 承認確認ダイアログ */}
      <AlertDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>日報を承認</AlertDialogTitle>
            <AlertDialogDescription>
              {approveTarget?.employeeName || approveTarget?.employeeId} さんの {approveTarget?.date} の日報を承認しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              承認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 差戻しダイアログ */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectionReason('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>日報を差戻し</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectTarget?.employeeName || rejectTarget?.employeeId} さんの {rejectTarget?.date} の日報を差戻します。理由を入力してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="差戻し理由を入力してください"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectionReason.trim()}
            >
              差戻し
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
