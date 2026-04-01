'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WorkflowType, WorkflowRequest } from '@/lib/workflow-store';
import { useUserStore } from '@/lib/store/user-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  X,
  FileText,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ロジック層
import { getSchemaByType } from '@/lib/workflow/schemas';
import {
  buildApprovalFlow,
  getRequestTitle,
  getPriority,
  type ApprovalStep,
  type ApproversByRole,
} from '@/lib/workflow/approval-flow';

// フォームコンポーネント
import { LeaveRequestForm } from './forms/leave-request-form';
import { ExpenseClaimForm } from './forms/expense-claim-form';
import { OvertimeRequestForm } from './forms/overtime-request-form';
import { BusinessTripForm } from './forms/business-trip-form';
import { RemoteWorkForm } from './forms/remote-work-form';
import { PurchaseRequestForm } from './forms/purchase-request-form';
import { DocumentApprovalForm } from './forms/document-approval-form';
import { DefaultRequestForm } from './forms/default-request-form';
import { BankAccountChangeForm } from './forms/bank-account-change-form';
import { FamilyInfoChangeForm } from './forms/family-info-change-form';
import { CommuteRouteChangeForm } from './forms/commute-route-change-form';

interface NewRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestType: WorkflowType | null;
  onSubmit: (data: Partial<WorkflowRequest>) => void;
  currentUserId: string;
  currentUserName: string;
}

export function NewRequestForm({
  open,
  onOpenChange,
  requestType,
  onSubmit,
  currentUserId,
  currentUserName,
}: NewRequestFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [approvalFlow, setApprovalFlow] = useState<ApprovalStep[]>([]);

  // DBからユーザーを取得
  const { users, fetchUsers } = useUserStore();

  // ユーザーをロールでフィルタリング
  const approversByRole = useMemo<ApproversByRole>(() => {
    const managers = users.filter(u => u.roles?.includes('manager') && u.status === 'active');
    const hrs = users.filter(u => u.roles?.includes('hr') && u.status === 'active');
    const admins = users.filter(u => u.roles?.includes('admin') && u.status === 'active');
    const executives = users.filter(u => u.roles?.includes('executive') && u.status === 'active');

    return {
      direct_manager: managers[0] || hrs[0] || admins[0],
      department_head: managers[0] || executives[0] || admins[0],
      hr_manager: hrs[0] || admins[0],
      finance_manager: hrs[0] || admins[0],
      general_manager: executives[0] || admins[0],
      ceo: admins[0],
    };
  }, [users]);

  // ユーザーリストを取得
  useEffect(() => {
    if (open && users.length === 0) {
      fetchUsers().catch(console.error);
    }
  }, [open, users.length, fetchUsers]);

  // ダイアログが閉じられた時に状態をリセット
  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setAttachments([]);
      setApprovalFlow([]);
      form.reset();
    }
  }, [open]);

  const form = useForm({
    resolver: zodResolver(getSchemaByType(requestType)),
  });

  // 承認フローの自動設定
  const setupApprovalFlow = (type: WorkflowType, details: Record<string, unknown>) => {
    setApprovalFlow(buildApprovalFlow(type, details, approversByRole));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}は5MBを超えています`);
        return false;
      }
      return true;
    });
    setAttachments([...attachments, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      const userId = currentUserId || 'demo-user-id';

      const request: Partial<WorkflowRequest> = {
        type: requestType!,
        title: getRequestTitle(requestType!, data),
        description: (data.reason as string) || (data.purpose as string) || '',
        requesterId: userId,
        requesterName: currentUserName,
        department: '営業部',
        status: 'draft',
        priority: getPriority(requestType!, data),
        details: data,
        approvalSteps: approvalFlow.map((step, index) => ({
          id: `step-${index}`,
          order: index,
          approverRole: step.role,
          approverId: step.id,
          approverName: step.name,
          status: 'pending',
          isOptional: !step.required,
        })),
        currentStep: 0,
        attachments: attachments.map((file, index) => ({
          id: `att-${index}`,
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          uploadedAt: new Date().toISOString(),
        })),
        timeline: [],
      };

      setIsSubmitting(true);
      try {
        onSubmit(request);
        setTimeout(() => {
          toast.success('申請を作成しました', {
            description: '承認者に通知が送信されました'
          });
        }, 100);
        onOpenChange(false);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('申請の作成に失敗しました', {
        description: 'もう一度お試しください'
      });
      setIsSubmitting(false);
    }
  };

  const renderFormContent = () => {
    if (!requestType) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedForm = form as UseFormReturn<any>;
    switch (requestType) {
      case 'leave_request':
        return <LeaveRequestForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'expense_claim':
        return <ExpenseClaimForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'overtime_request':
        return <OvertimeRequestForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'business_trip':
        return <BusinessTripForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'remote_work':
        return <RemoteWorkForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'purchase_request':
        return <PurchaseRequestForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'document_approval':
        return <DocumentApprovalForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'bank_account_change':
        return <BankAccountChangeForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'family_info_change':
        return <FamilyInfoChangeForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      case 'commute_route_change':
        return <CommuteRouteChangeForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
      default:
        return <DefaultRequestForm form={typedForm} onFlowUpdate={setupApprovalFlow} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>新規申請作成</DialogTitle>
          <DialogDescription>
            必要な情報を入力して申請を作成してください
          </DialogDescription>
        </DialogHeader>

        {/* プログレスバー */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={cn("font-medium", step === 1 && "text-blue-600")}>
              1. 申請内容
            </span>
            <span className={cn("font-medium", step === 2 && "text-blue-600")}>
              2. 添付ファイル
            </span>
            <span className={cn("font-medium", step === 3 && "text-blue-600")}>
              3. 確認・提出
            </span>
          </div>
          <Progress value={step * 33.33} />
        </div>

        <ScrollArea className="h-[60vh] pr-4">
          {step === 1 && (
            <div className="space-y-4">
              {renderFormContent()}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>添付ファイル</CardTitle>
                  <CardDescription>
                    必要な書類や証明書を添付してください（最大5MB/ファイル）
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:underline">
                        ファイルを選択
                      </span>
                      またはドラッグ&ドロップ
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>申請内容の確認</CardTitle>
                  <CardDescription>
                    以下の内容で申請を作成します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">申請タイプ</Label>
                    <p className="font-medium">{requestType}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">承認フロー</Label>
                    <div className="space-y-2">
                      {approvalFlow.map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{step.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {step.role === 'direct_manager' && '直属上司'}
                              {step.role === 'department_head' && '部門長'}
                              {step.role === 'hr_manager' && '人事部長'}
                              {step.role === 'finance_manager' && '経理部長'}
                              {step.role === 'general_manager' && '役員'}
                            </p>
                          </div>
                          {step.required && (
                            <Badge variant="secondary">必須</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">
                          添付ファイル（{attachments.length}件）
                        </Label>
                        <div className="space-y-1">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              戻る
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => {
              const nextStep = step + 1;
              setStep(nextStep);

              // ステップ3に進む時に承認フローを設定
              if (nextStep === 3 && requestType) {
                const formData = form.getValues();
                setupApprovalFlow(requestType, formData);
              }
            }}>
              次へ
            </Button>
          ) : (
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={approvalFlow.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                '申請を作成'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
