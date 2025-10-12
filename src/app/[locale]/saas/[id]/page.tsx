'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useSaaSStore } from '@/lib/store/saas-store';
import { categoryLabels, licenseTypeLabels, licenseStatusLabels, type LicensePlan, type LicenseAssignment } from '@/types/saas';
import { ServiceFormDialog } from '@/features/saas/service-form-dialog';
import { PlanFormDialog } from '@/features/saas/plan-form-dialog';
import { AssignmentFormDialog } from '@/features/saas/assignment-form-dialog';

export default function SaaSServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const { getServiceById, getPlansByServiceId, deletePlan, getAssignmentsByServiceId, deleteAssignment } = useSaaSStore();
  const service = getServiceById(serviceId);
  const plans = getPlansByServiceId(serviceId);
  const assignments = getAssignmentsByServiceId(serviceId);

  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LicensePlan | undefined>(undefined);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<LicenseAssignment | undefined>(undefined);

  if (!service) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">サービスが見つかりません</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/ja/saas')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  const handleOpenCreatePlanDialog = () => {
    setSelectedPlan(undefined);
    setIsPlanFormOpen(true);
  };

  const handleOpenEditPlanDialog = (plan: LicensePlan) => {
    setSelectedPlan(plan);
    setIsPlanFormOpen(true);
  };

  const handleClosePlanDialog = () => {
    setIsPlanFormOpen(false);
    setSelectedPlan(undefined);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('このプランを削除してもよろしいですか？')) {
      deletePlan(planId);
    }
  };

  const handleOpenCreateAssignmentDialog = () => {
    setSelectedAssignment(undefined);
    setIsAssignmentFormOpen(true);
  };

  const handleOpenEditAssignmentDialog = (assignment: LicenseAssignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentFormOpen(true);
  };

  const handleCloseAssignmentDialog = () => {
    setIsAssignmentFormOpen(false);
    setSelectedAssignment(undefined);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (window.confirm('このライセンス割り当てを解除してもよろしいですか？')) {
      deleteAssignment(assignmentId);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return currency === 'JPY' ? `¥${price.toLocaleString()}` : `$${price.toLocaleString()}`;
  };

  const formatBillingCycle = (cycle: string) => {
    return cycle === 'monthly' ? '月額' : '年額';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/ja/saas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
          <p className="text-muted-foreground">{service.vendor}</p>
        </div>
        <Button variant="outline" onClick={() => setIsServiceFormOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          サービス編集
        </Button>
      </div>

      {/* サービス詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>サービス情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">基本情報</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">カテゴリ:</span>
                  <Badge variant="outline">{categoryLabels[service.category]}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">ライセンスタイプ:</span>
                  <Badge variant="secondary">{licenseTypeLabels[service.licenseType]}</Badge>
                </div>
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
                {service.adminEmail && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">管理者:</span>
                    <span className="text-sm">{service.adminEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm">自動更新:</span>
                  <Badge variant={service.autoRenew ? 'default' : 'secondary'}>
                    {service.autoRenew ? '有効' : '無効'}
                  </Badge>
                </div>
                {service.contractEndDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">契約終了日: {service.contractEndDate}</span>
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
            <Button onClick={handleOpenCreatePlanDialog}>
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
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{plan.planName}</h3>
                        {plan.isActive && (
                          <Badge variant="default" className="bg-green-500">現在のプラン</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-6 mt-4">
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

                      {plan.features.length > 0 && (
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

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditPlanDialog(plan)}
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
              <CardDescription>ユーザーへのライセンス割り当て状況を管理します</CardDescription>
            </div>
            <Button onClick={handleOpenCreateAssignmentDialog}>
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
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{assignment.userName}</h3>
                        <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                          {licenseStatusLabels[assignment.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">プラン</p>
                          <p className="font-medium">{assignment.planName}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">割り当て日</p>
                          <p className="font-medium">{assignment.assignedDate}</p>
                        </div>

                        {assignment.lastUsedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">最終使用日</p>
                            <p className="font-medium">{assignment.lastUsedAt}</p>
                          </div>
                        )}
                      </div>

                      {assignment.userEmail && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground">アカウントメール: {assignment.userEmail}</p>
                        </div>
                      )}

                      {assignment.notes && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">メモ: {assignment.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditAssignmentDialog(assignment)}
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
      <ServiceFormDialog
        open={isServiceFormOpen}
        onClose={() => setIsServiceFormOpen(false)}
        service={service}
      />
      <PlanFormDialog
        open={isPlanFormOpen}
        onClose={handleClosePlanDialog}
        serviceId={serviceId}
        plan={selectedPlan}
      />
      <AssignmentFormDialog
        open={isAssignmentFormOpen}
        onClose={handleCloseAssignmentDialog}
        serviceId={serviceId}
        serviceName={service.name}
        assignment={selectedAssignment}
      />
    </div>
  );
}
