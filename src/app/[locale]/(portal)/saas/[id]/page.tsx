'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useSaaSServicesAPI,
  useSaaSAssignmentsAPI,
  type SaaSServiceFromAPI,
  type SaaSPlanFromAPI,
  type SaaSAssignmentFromAPI,
} from '@/hooks/use-saas-api';
import { EditServiceDialog } from '@/features/saas/edit-service-dialog';
import { EditPlanDialog } from '@/features/saas/edit-plan-dialog';
import { EditAssignmentDialog } from '@/features/saas/edit-assignment-dialog';

// カテゴリラベル
const categoryLabels: Record<string, string> = {
  productivity: '生産性ツール',
  communication: 'コミュニケーション',
  project_management: 'プロジェクト管理',
  hr: '人事・採用',
  finance: '会計・財務',
  marketing: 'マーケティング',
  sales: '営業・CRM',
  development: '開発ツール',
  security: 'セキュリティ',
  storage: 'ストレージ',
  design: 'デザイン',
  other: 'その他',
};

// ライセンスタイプラベル
const licenseTypeLabels: Record<string, string> = {
  'user-based': 'ユーザー単位',
  'fixed': '固定料金',
  'per_seat': 'シート単位',
  'enterprise': 'エンタープライズ',
  'usage_based': '従量課金',
  'freemium': 'フリーミアム',
};

// ステータスラベル
const statusLabels: Record<string, string> = {
  active: '有効',
  inactive: '無効',
  pending: '保留中',
  revoked: '取り消し',
};

export default function SaaSServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const { getServiceById, deleteService } = useSaaSServicesAPI();
  const { deleteAssignment } = useSaaSAssignmentsAPI();

  const [service, setService] = useState<SaaSServiceFromAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ダイアログの状態
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SaaSPlanFromAPI | null>(null);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<SaaSAssignmentFromAPI | null>(null);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);

  // サービス詳細を取得
  const fetchService = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getServiceById(serviceId);
    if (result.success && result.data) {
      setService(result.data);
    } else {
      setError(result.error || 'サービスの取得に失敗しました');
    }
    setLoading(false);
  }, [serviceId, getServiceById]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  // サービス削除
  const handleDeleteService = async () => {
    if (!window.confirm('このサービスを削除してもよろしいですか？関連するプランと割り当ても削除されます。')) {
      return;
    }
    const result = await deleteService(serviceId);
    if (result.success) {
      toast.success('サービスを削除しました');
      router.push('/ja/saas');
    } else {
      toast.error(result.error || 'サービスの削除に失敗しました');
    }
  };

  // プラン削除
  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('このプランを削除してもよろしいですか？')) {
      return;
    }
    try {
      const response = await fetch(`/api/saas/plans/${planId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        toast.success('プランを削除しました');
        fetchService();
      } else {
        toast.error(data.error || 'プランの削除に失敗しました');
      }
    } catch {
      toast.error('プランの削除に失敗しました');
    }
  };

  // 割り当て削除
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('このライセンス割り当てを解除してもよろしいですか？')) {
      return;
    }
    const result = await deleteAssignment(assignmentId);
    if (result.success) {
      toast.success('ライセンス割り当てを解除しました');
      fetchService();
    } else {
      toast.error(result.error || 'ライセンス割り当ての解除に失敗しました');
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error || !service) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">{error || 'サービスが見つかりません'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/ja/saas')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  const plans = service.plans || [];
  const assignments = service.assignments || [];

  const formatPrice = (price: number, currency: string) => {
    return currency === 'JPY' ? `¥${price.toLocaleString()}` : `$${price.toLocaleString()}`;
  };

  const formatBillingCycle = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return '月額';
      case 'yearly': return '年額';
      case 'quarterly': return '四半期';
      default: return cycle;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.push('/ja/saas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{service.name}</h1>
            <p className="text-muted-foreground text-sm sm:text-base truncate">{service.vendor || '（ベンダー未設定）'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Button variant="outline" size="sm" onClick={fetchService}>
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditServiceOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteService}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      {/* サービス詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>サービス情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">基本情報</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">カテゴリ:</span>
                  <Badge variant="outline">{categoryLabels[service.category] || service.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">ライセンスタイプ:</span>
                  <Badge variant="secondary">{licenseTypeLabels[service.licenseType] || service.licenseType}</Badge>
                </div>
                {service.website && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">公式サイト:</span>
                    <a
                      href={service.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {service.website}
                    </a>
                  </div>
                )}
                {service.description && (
                  <div>
                    <span className="text-sm">説明:</span>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">セキュリティ・管理</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">SSO対応:</span>
                  {service.ssoEnabled ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      対応
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" />
                      非対応
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">MFA対応:</span>
                  {service.mfaEnabled ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      対応
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" />
                      非対応
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">自動更新:</span>
                  <Badge variant={service.autoRenew ? 'default' : 'secondary'}>
                    {service.autoRenew ? '有効' : '無効'}
                  </Badge>
                </div>
                {service.contractEndDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">契約終了日: {new Date(service.contractEndDate).toLocaleDateString('ja-JP')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ライセンスプラン一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ライセンスプラン</CardTitle>
              <CardDescription>このサービスのライセンスプランを管理します</CardDescription>
            </div>
            <Button onClick={() => setIsCreatePlanOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              プラン追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">プランが登録されていません</p>
              <p className="text-sm">「プラン追加」ボタンからプランを登録してください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg">{plan.planName}</h3>
                        {plan.isActive && (
                          <Badge variant="default" className="bg-green-500">現在のプラン</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">料金</p>
                            <p className="font-medium">
                              {plan.pricePerUser
                                ? `${formatPrice(plan.pricePerUser, plan.currency)} / ユーザー`
                                : plan.fixedPrice
                                ? formatPrice(plan.fixedPrice, plan.currency)
                                : '未設定'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">課金サイクル</p>
                            <p className="font-medium">{formatBillingCycle(plan.billingCycle)}</p>
                          </div>
                        </div>

                        {plan.maxUsers && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">最大ユーザー数</p>
                              <p className="font-medium">{plan.maxUsers}人</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">機能:</p>
                          <div className="flex flex-wrap gap-2">
                            {plan.features.map((feature, index) => (
                              <Badge key={index} variant="outline">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 sm:ml-4 mt-4 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setIsEditPlanOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ライセンス割り当て一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ライセンス割り当て</CardTitle>
              <CardDescription>ユーザーへのライセンス割り当て状況を管理します（{assignments.length}件）</CardDescription>
            </div>
            <Button onClick={() => setIsCreateAssignmentOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              ライセンス割り当て
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">ライセンスが割り当てられていません</p>
              <p className="text-sm">「ライセンス割り当て」ボタンからユーザーに割り当ててください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg">{assignment.userName || '不明'}</h3>
                        <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                          {statusLabels[assignment.status] || assignment.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">プラン</p>
                          <p className="font-medium">{assignment.plan?.planName || '未設定'}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">割り当て日</p>
                          <p className="font-medium">{new Date(assignment.assignedDate).toLocaleDateString('ja-JP')}</p>
                        </div>

                        {assignment.departmentName && (
                          <div>
                            <p className="text-sm text-muted-foreground">部門</p>
                            <p className="font-medium">{assignment.departmentName}</p>
                          </div>
                        )}
                      </div>

                      {assignment.userEmail && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">メール: {assignment.userEmail}</p>
                        </div>
                      )}

                      {assignment.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">メモ: {assignment.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 sm:ml-4 mt-4 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsEditAssignmentOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ダイアログ */}
      <EditServiceDialog
        open={isEditServiceOpen}
        onClose={() => setIsEditServiceOpen(false)}
        service={service}
        onSuccess={fetchService}
      />
      <EditPlanDialog
        open={isEditPlanOpen}
        onClose={() => {
          setIsEditPlanOpen(false);
          setSelectedPlan(null);
        }}
        serviceId={serviceId}
        plan={selectedPlan}
        onSuccess={fetchService}
      />
      <EditPlanDialog
        open={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        serviceId={serviceId}
        plan={null}
        onSuccess={fetchService}
      />
      <EditAssignmentDialog
        open={isEditAssignmentOpen}
        onClose={() => {
          setIsEditAssignmentOpen(false);
          setSelectedAssignment(null);
        }}
        serviceId={serviceId}
        serviceName={service.name}
        plans={plans}
        assignment={selectedAssignment}
        onSuccess={fetchService}
      />
      <EditAssignmentDialog
        open={isCreateAssignmentOpen}
        onClose={() => setIsCreateAssignmentOpen(false)}
        serviceId={serviceId}
        serviceName={service.name}
        plans={plans}
        assignment={null}
        onSuccess={fetchService}
      />
    </div>
  );
}
