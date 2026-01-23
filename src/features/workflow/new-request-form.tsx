'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, UseFormReturn, useFieldArray, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { WorkflowType, WorkflowRequest, ApproverRole } from '@/lib/workflow-store';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Tabs components - 将来使用予定
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
  Users,
  Clock,
  DollarSign,
  Briefcase,
  Home,
  Building2,
  Package,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
// ja from date-fns/locale - 将来使用予定
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/camera/image-upload';

interface NewRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestType: WorkflowType | null;
  onSubmit: (data: Partial<WorkflowRequest>) => void;
  currentUserId: string;
  currentUserName: string;
}

// 申請タイプ別のスキーマ定義（テスト用に緩めに設定）
const leaveRequestSchema = z.object({
  leaveType: z.enum(['paid_leave', 'sick_leave', 'special_leave', 'half_day', 'compensatory']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  reason: z.string().min(1, '理由を入力してください').optional(),
  handover: z.string().min(1, '引き継ぎ事項を入力してください').optional(),
  emergencyContact: z.string().optional(),
});

const expenseClaimSchema = z.object({
  expenseType: z.enum(['transportation', 'accommodation', 'entertainment', 'supplies', 'other']),
  amount: z.number().min(1, '金額を入力してください'),
  expenseDate: z.date(),
  purpose: z.string().min(10, '用途を10文字以上入力してください'),
  client: z.string().optional(),
  projectCode: z.string().optional(),
  hasReceipt: z.boolean(),
  receiptImages: z.array(z.string()).optional(),
});

const overtimeRequestSchema = z.object({
  overtimeDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  hours: z.number().min(0.5, '0.5時間以上を入力してください'),
  reason: z.string().min(10, '理由を10文字以上入力してください'),
  projectCode: z.string().optional(),
});

const businessTripSchema = z.object({
  destination: z.string().min(1, '出張先を入力してください'),
  startDate: z.date(),
  endDate: z.date(),
  purpose: z.string().min(10, '目的を10文字以上入力してください'),
  transportation: z.enum(['train', 'airplane', 'car', 'other']),
  accommodation: z.boolean(),
  estimatedCost: z.number().min(0),
  client: z.string().optional(),
});

const remoteWorkSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  workLocation: z.enum(['home', 'satellite_office', 'other']),
  locationDetail: z.string().optional(),
  reason: z.string().min(10, '理由を10文字以上入力してください'),
  equipment: z.array(z.string()).optional(),
  securityMeasures: z.string().min(10, 'セキュリティ対策を入力してください'),
});

// 各スキーマの型を推論
type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
type ExpenseClaimFormData = z.infer<typeof expenseClaimSchema>;
type OvertimeRequestFormData = z.infer<typeof overtimeRequestSchema>;
type BusinessTripFormData = z.infer<typeof businessTripSchema>;
type RemoteWorkFormData = z.infer<typeof remoteWorkSchema>;

// フォームコンポーネントのprops型
interface FormComponentProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  onFlowUpdate: (type: WorkflowType, details: Record<string, unknown>) => void;
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [approvalFlow, setApprovalFlow] = useState<Array<{
    role: ApproverRole;
    name: string;
    id: string;
    required: boolean;
  }>>([]);

  // DBからユーザーを取得
  const { users, fetchUsers } = useUserStore();

  // ユーザーをロールでフィルタリング
  const approversByRole = useMemo(() => {
    // ロールに基づいて承認者を選択
    const managers = users.filter(u => u.roles?.includes('manager') && u.status === 'active');
    const hrs = users.filter(u => u.roles?.includes('hr') && u.status === 'active');
    const admins = users.filter(u => u.roles?.includes('admin') && u.status === 'active');
    const executives = users.filter(u => u.roles?.includes('executive') && u.status === 'active');

    return {
      direct_manager: managers[0] || hrs[0] || admins[0],
      department_head: managers[0] || executives[0] || admins[0],
      hr_manager: hrs[0] || admins[0],
      finance_manager: hrs[0] || admins[0], // 経理がない場合は人事またはadminが代行
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

  // フォーム初期化
  const getSchema = () => {
    switch (requestType) {
      case 'leave_request':
        return leaveRequestSchema;
      case 'expense_claim':
        return expenseClaimSchema;
      case 'overtime_request':
        return overtimeRequestSchema;
      case 'business_trip':
        return businessTripSchema;
      case 'remote_work':
        return remoteWorkSchema;
      default:
        return z.object({});
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
  });

  // 承認者を取得するヘルパー関数
  const getApproverInfo = (role: ApproverRole): { id: string; name: string } => {
    const approver = approversByRole[role];
    if (approver) {
      return { id: approver.id, name: approver.name };
    }
    // フォールバック: DBにユーザーがいない場合
    const roleNames: Record<ApproverRole, string> = {
      direct_manager: '直属上司',
      department_head: '部門長',
      hr_manager: '人事部長',
      finance_manager: '経理部長',
      general_manager: '役員',
      ceo: '社長',
    };
    return { id: 'unknown', name: roleNames[role] || '承認者' };
  };

  // 承認フローの自動設定
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setupApprovalFlow = (type: WorkflowType, details: Record<string, any>) => {
    const flow: Array<{ role: ApproverRole; name: string; id: string; required: boolean }> = [];

    // 直属上司は必須
    const directManager = getApproverInfo('direct_manager');
    flow.push({ role: 'direct_manager', name: directManager.name, id: directManager.id, required: true });

    // 申請タイプと条件に応じて承認者を追加
    switch (type) {
      case 'leave_request':
        if (details.days > 3) {
          const deptHead = getApproverInfo('department_head');
          flow.push({ role: 'department_head', name: deptHead.name, id: deptHead.id, required: true });
        }
        if (details.days > 5) {
          const hrManager = getApproverInfo('hr_manager');
          flow.push({ role: 'hr_manager', name: hrManager.name, id: hrManager.id, required: true });
        }
        break;

      case 'expense_claim':
        if (details.amount > 50000) {
          const deptHead = getApproverInfo('department_head');
          flow.push({ role: 'department_head', name: deptHead.name, id: deptHead.id, required: true });
        }
        if (details.amount > 100000) {
          const financeManager = getApproverInfo('finance_manager');
          flow.push({ role: 'finance_manager', name: financeManager.name, id: financeManager.id, required: true });
        }
        if (details.amount > 500000) {
          const generalManager = getApproverInfo('general_manager');
          flow.push({ role: 'general_manager', name: generalManager.name, id: generalManager.id, required: true });
        }
        break;

      case 'overtime_request':
        if (details.hours > 20) {
          const deptHead = getApproverInfo('department_head');
          const hrManager = getApproverInfo('hr_manager');
          flow.push({ role: 'department_head', name: deptHead.name, id: deptHead.id, required: true });
          flow.push({ role: 'hr_manager', name: hrManager.name, id: hrManager.id, required: true });
        }
        break;

      case 'business_trip':
        const deptHead = getApproverInfo('department_head');
        flow.push({ role: 'department_head', name: deptHead.name, id: deptHead.id, required: true });
        if (details.estimatedCost > 200000 || details.transportation === 'airplane') {
          const generalManager = getApproverInfo('general_manager');
          flow.push({ role: 'general_manager', name: generalManager.name, id: generalManager.id, required: true });
        }
        break;

      case 'remote_work':
        if (differenceInDays(details.endDate as Date, details.startDate as Date) > 30) {
          const deptHead2 = getApproverInfo('department_head');
          const hrManager2 = getApproverInfo('hr_manager');
          flow.push({ role: 'department_head', name: deptHead2.name, id: deptHead2.id, required: true });
          flow.push({ role: 'hr_manager', name: hrManager2.name, id: hrManager2.id, required: true });
        }
        break;

      // 各種変更申請のデフォルト: 人事部承認
      case 'bank_account_change':
      case 'family_info_change':
      case 'commute_route_change':
        const hrForChange = getApproverInfo('hr_manager');
        flow.push({ role: 'hr_manager', name: hrForChange.name, id: hrForChange.id, required: true });
        break;
    }

    setApprovalFlow(flow);
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

  // 承認者ロール→ユーザーIDのマッピング（DBから取得した値を使用）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getApproverIdByRole = (role: ApproverRole): string => {
    const approver = approversByRole[role];
    return approver?.id || 'unknown';
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      // 仮のユーザーID（本番では認証から取得）
      const userId = currentUserId || 'demo-user-id';

      // ローカルのWorkflowStoreに直接追加
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
          approverId: step.id, // 直接approvalFlowから取得したIDを使用
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

      onSubmit(request);

      // 申請作成完了後に通知を表示
      setTimeout(() => {
        toast.success('申請を作成しました', {
          description: '承認者に通知が送信されました'
        });
      }, 100);

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('申請の作成に失敗しました', {
        description: 'もう一度お試しください'
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRequestTitle = (type: WorkflowType, data: Record<string, any>): string => {
    switch (type) {
      case 'leave_request':
        return `${data.leaveType === 'paid_leave' ? '有給' : ''}休暇申請（${format(data.startDate, 'MM/dd')}〜${format(data.endDate, 'MM/dd')}）`;
      case 'expense_claim':
        return `経費精算（${data.amount.toLocaleString()}円）`;
      case 'overtime_request':
        return `残業申請（${format(data.overtimeDate, 'MM/dd')} ${data.hours}時間）`;
      case 'business_trip':
        return `出張申請（${data.destination}）`;
      case 'remote_work':
        return `リモートワーク申請（${format(data.startDate, 'MM/dd')}〜${format(data.endDate, 'MM/dd')}）`;
      case 'bank_account_change':
        return `給与振込口座変更申請（${data.bankName || ''}）`;
      case 'family_info_change':
        return `家族情報変更申請`;
      case 'commute_route_change':
        return `通勤経路変更申請`;
      default:
        return '新規申請';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPriority = (type: WorkflowType, data: Record<string, any>): 'low' | 'normal' | 'high' | 'urgent' => {
    switch (type) {
      case 'leave_request':
        const daysUntilLeave = differenceInDays(data.startDate, new Date());
        if (daysUntilLeave < 3) return 'urgent';
        if (daysUntilLeave < 7) return 'high';
        return 'normal';
      case 'expense_claim':
        if (data.amount > 100000) return 'high';
        return 'normal';
      case 'overtime_request':
        if (data.hours > 20) return 'high';
        return 'normal';
      default:
        return 'normal';
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
              disabled={approvalFlow.length === 0}
            >
              申請を作成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 休暇申請フォーム
function LeaveRequestForm({ form, onFlowUpdate }: FormComponentProps<LeaveRequestFormData>) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(tomorrow);
  
  // 初期値を設定
  React.useEffect(() => {
    form.setValue('leaveType', 'paid_leave');
    form.setValue('startDate', today);
    form.setValue('endDate', tomorrow);
    form.setValue('reason', 'テスト用の休暇申請です');
    form.setValue('handover', '業務は同僚に引き継ぎ済みです');
    onFlowUpdate('leave_request', { days: 2 });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          休暇申請
        </CardTitle>
        <CardDescription>
          休暇の申請を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">休暇種別</Label>
          <RadioGroup defaultValue="paid_leave" onValueChange={(value) => form.setValue('leaveType', value as 'paid_leave' | 'sick_leave' | 'special_leave' | 'compensatory' | 'half_day')} className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="paid_leave" id="paid_leave" />
              <Label htmlFor="paid_leave" className="cursor-pointer">有給休暇</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="sick_leave" id="sick_leave" />
              <Label htmlFor="sick_leave" className="cursor-pointer">病気休暇</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="special_leave" id="special_leave" />
              <Label htmlFor="special_leave" className="cursor-pointer">特別休暇</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="half_day" id="half_day" />
              <Label htmlFor="half_day" className="cursor-pointer">半休</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RadioGroupItem value="compensatory" id="compensatory" />
              <Label htmlFor="compensatory" className="cursor-pointer">代休</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-3 block">休暇期間</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm">開始日</Label>
              <Input
                id="startDate"
                type="date"
                className="w-full"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setStartDate(date);
                  form.setValue('startDate', date);
                  if (endDate) {
                    const days = differenceInDays(endDate, date) + 1;
                    onFlowUpdate('leave_request', { days });
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm">終了日</Label>
              <Input
                id="endDate"
                type="date"
                className="w-full"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setEndDate(date);
                  form.setValue('endDate', date);
                  if (startDate && date) {
                    const days = differenceInDays(date, startDate) + 1;
                    onFlowUpdate('leave_request', { days });
                  }
                }}
                min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        {startDate && endDate && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              申請日数: {differenceInDays(endDate, startDate) + 1}日間
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">理由 <span className="text-red-500">*</span></Label>
            <Textarea
              id="reason"
              placeholder="休暇を取得する理由を具体的に入力してください（最低10文字）"
              {...form.register('reason')}
              rows={3}
              className="resize-none"
              defaultValue="テスト用の休暇申請です"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="handover" className="text-sm font-medium">引き継ぎ事項 <span className="text-red-500">*</span></Label>
            <Textarea
              id="handover"
              placeholder="不在中の業務引き継ぎや対応者について記載してください（最低10文字）"
              {...form.register('handover')}
              rows={3}
              className="resize-none"
              defaultValue="業務は同僚に引き継ぎ済みです"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact" className="text-sm font-medium">緊急連絡先 <span className="text-gray-500">（任意）</span></Label>
            <Input
              id="emergencyContact"
              placeholder="例：080-1234-5678"
              {...form.register('emergencyContact')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 経費申請フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpenseClaimForm({ form, onFlowUpdate }: FormComponentProps<ExpenseClaimFormData>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expenseDate, setExpenseDate] = useState<Date>();
  const [amount, setAmount] = useState<number>(0);
  const [receiptImages, setReceiptImages] = useState<string[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          経費申請
        </CardTitle>
        <CardDescription>
          業務に関連する経費の申請を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>経費種別</Label>
          <Select onValueChange={(value) => form.setValue('expenseType', value as 'transportation' | 'accommodation' | 'entertainment' | 'supplies' | 'other')}>
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transportation">交通費</SelectItem>
              <SelectItem value="accommodation">宿泊費</SelectItem>
              <SelectItem value="entertainment">接待費</SelectItem>
              <SelectItem value="supplies">消耗品費</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-3 block">経費詳細</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm">金額 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="amount"
                  type="number"
                  className="pl-8"
                  placeholder="例：5000"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setAmount(value);
                    form.setValue('amount', value);
                    onFlowUpdate('expense_claim', { amount: value });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDate" className="text-sm">支出日 <span className="text-red-500">*</span></Label>
              <Input
                id="expenseDate"
                type="date"
                className="w-full"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setExpenseDate(date);
                  form.setValue('expenseDate', date);
                }}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">用途・目的</Label>
          <Textarea
            id="purpose"
            placeholder="経費の用途や目的を詳しく入力してください"
            {...form.register('purpose')}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">取引先（任意）</Label>
            <Input
              id="client"
              placeholder="〇〇株式会社"
              {...form.register('client')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectCode">プロジェクトコード（任意）</Label>
            <Input
              id="projectCode"
              placeholder="PRJ-2024-001"
              {...form.register('projectCode')}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hasReceipt"
            className="rounded"
            {...form.register('hasReceipt')}
          />
          <Label htmlFor="hasReceipt">領収書あり</Label>
        </div>

        {/* 領収書画像アップロード */}
        <div className="border-t pt-4">
          <ImageUpload
            value={receiptImages}
            onChange={(images) => {
              setReceiptImages(images);
              form.setValue('receiptImages', images);
            }}
            maxImages={5}
            maxSizeKB={2048}
            label="領収書・レシート画像"
            description="カメラで撮影するか、ファイルを選択してください（最大5枚、各2MB以下）"
          />
        </div>

        {amount > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              申請金額: ¥{amount.toLocaleString()}
            </p>
            {amount > 100000 && (
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                ※ 10万円を超える申請は部門長の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 残業申請フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OvertimeRequestForm({ form, onFlowUpdate }: FormComponentProps<OvertimeRequestFormData>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [overtimeDate, setOvertimeDate] = useState<Date>();
  const [hours, setHours] = useState<number>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          残業申請
        </CardTitle>
        <CardDescription>
          時間外勤務の申請を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <Label className="text-sm font-medium mb-3 block">残業詳細</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="overtimeDate" className="text-sm">残業日 <span className="text-red-500">*</span></Label>
              <Input
                id="overtimeDate"
                type="date"
                className="w-full"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setOvertimeDate(date);
                  form.setValue('overtimeDate', date);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours" className="text-sm">残業時間 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  placeholder="例：2.5"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setHours(value);
                    form.setValue('hours', value);
                    onFlowUpdate('overtime_request', { hours: value });
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  時間
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">開始時刻</Label>
            <Input
              id="startTime"
              type="time"
              {...form.register('startTime')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">終了時刻</Label>
            <Input
              id="endTime"
              type="time"
              {...form.register('endTime')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">残業理由</Label>
          <Textarea
            id="reason"
            placeholder="残業が必要な理由を入力してください"
            {...form.register('reason')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectCode">プロジェクトコード（任意）</Label>
          <Input
            id="projectCode"
            placeholder="PRJ-2024-001"
            {...form.register('projectCode')}
          />
        </div>

        {hours > 0 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
              残業時間: {hours}時間
            </p>
            {hours > 20 && (
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                ※ 月20時間を超える残業は部門長と人事部の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 出張申請フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BusinessTripForm({ form, onFlowUpdate }: FormComponentProps<BusinessTripFormData>) {
  const [startDate, setStartDate] = useState<Date>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [endDate, setEndDate] = useState<Date>();
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-purple-600" />
          出張申請
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="destination">出張先</Label>
          <Input
            id="destination"
            placeholder="例：大阪支社、〇〇株式会社本社"
            {...form.register('destination')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessStartDate">開始日</Label>
            <Input
              id="businessStartDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setStartDate(date);
                form.setValue('startDate', date);
              }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessEndDate">終了日</Label>
            <Input
              id="businessEndDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setEndDate(date);
                form.setValue('endDate', date);
              }}
              min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">出張目的</Label>
          <Textarea
            id="purpose"
            placeholder="出張の目的を詳しく入力してください"
            {...form.register('purpose')}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>交通手段</Label>
            <Select onValueChange={(value) => {
              form.setValue('transportation', value as 'train' | 'airplane' | 'car' | 'other');
              onFlowUpdate('business_trip', { transportation: value, estimatedCost });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="train">電車</SelectItem>
                <SelectItem value="airplane">飛行機</SelectItem>
                <SelectItem value="car">自動車</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedCost">概算費用</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <Input
                id="estimatedCost"
                type="number"
                className="pl-8"
                placeholder="0"
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setEstimatedCost(value);
                  form.setValue('estimatedCost', value);
                  onFlowUpdate('business_trip', { estimatedCost: value });
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">訪問先企業（任意）</Label>
          <Input
            id="client"
            placeholder="〇〇株式会社"
            {...form.register('client')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="accommodation"
            className="rounded"
            {...form.register('accommodation')}
          />
          <Label htmlFor="accommodation">宿泊あり</Label>
        </div>

        {estimatedCost > 0 && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              概算費用: ¥{estimatedCost.toLocaleString()}
            </p>
            {estimatedCost > 200000 && (
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                ※ 20万円を超える出張は役員の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 購買申請フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PurchaseRequestForm({ form, onFlowUpdate }: FormComponentProps) {
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-pink-600" />
          購買申請
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="itemName">購入品名</Label>
          <Input
            id="itemName"
            placeholder="例：ノートPC、事務用品"
            {...form.register('itemName')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">数量</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="1"
              {...form.register('quantity')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedCost">概算金額</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <Input
                id="estimatedCost"
                type="number"
                className="pl-8"
                placeholder="0"
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setEstimatedCost(value);
                  form.setValue('estimatedCost', value);
                  onFlowUpdate('purchase_request', { estimatedCost: value });
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">購入目的</Label>
          <Textarea
            id="purpose"
            placeholder="購入の目的や必要性を入力してください"
            {...form.register('purpose')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">購入先（任意）</Label>
          <Input
            id="vendor"
            placeholder="〇〇株式会社"
            {...form.register('vendor')}
          />
        </div>

        {estimatedCost > 0 && (
          <div className="p-3 bg-pink-50 dark:bg-pink-950/50 rounded-lg">
            <p className="text-sm font-medium text-pink-900 dark:text-pink-100">
              概算金額: ¥{estimatedCost.toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 書類承認フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DocumentApprovalForm({ form, onFlowUpdate }: FormComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          書類承認
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentTitle">書類タイトル</Label>
          <Input
            id="documentTitle"
            placeholder="例：契約書、提案書"
            {...form.register('documentTitle')}
          />
        </div>

        <div className="space-y-2">
          <Label>書類種別</Label>
          <Select onValueChange={(value) => form.setValue('documentType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">契約書</SelectItem>
              <SelectItem value="proposal">提案書</SelectItem>
              <SelectItem value="report">報告書</SelectItem>
              <SelectItem value="policy">規定・ポリシー</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            placeholder="書類の内容や承認が必要な理由を入力してください"
            {...form.register('description')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">承認期限（任意）</Label>
          <Input
            id="deadline"
            type="date"
            {...form.register('deadline')}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// デフォルトフォーム
function DefaultRequestForm({ form }: { form: UseFormReturn; onFlowUpdate?: (type: WorkflowType, details: Record<string, unknown>) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>申請内容</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            placeholder="申請のタイトルを入力"
            {...form.register('title')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">詳細</Label>
          <Textarea
            id="description"
            placeholder="申請の詳細を入力してください"
            {...form.register('description')}
            rows={5}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// リモートワーク申請フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RemoteWorkForm({ form, onFlowUpdate }: FormComponentProps<RemoteWorkFormData>) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5 text-indigo-600" />
          リモートワーク申請
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="remoteStartDate">開始日</Label>
            <Input
              id="remoteStartDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setStartDate(date);
                form.setValue('startDate', date);
                if (date && endDate) {
                  onFlowUpdate('remote_work', { startDate: date, endDate });
                }
              }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remoteEndDate">終了日</Label>
            <Input
              id="remoteEndDate"
              type="date"
              className="w-full"
              onChange={(e) => {
                const date = new Date(e.target.value);
                setEndDate(date);
                form.setValue('endDate', date);
                if (startDate && date) {
                  onFlowUpdate('remote_work', { startDate, endDate: date });
                }
              }}
              min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>勤務場所</Label>
          <RadioGroup defaultValue="home" onValueChange={(value) => form.setValue('workLocation', value as 'home' | 'satellite_office' | 'other')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="home" id="home" />
              <Label htmlFor="home">自宅</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="satellite_office" id="satellite_office" />
              <Label htmlFor="satellite_office">サテライトオフィス</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">その他</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationDetail">勤務場所詳細（その他の場合）</Label>
          <Input
            id="locationDetail"
            placeholder="具体的な場所を入力"
            {...form.register('locationDetail')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">理由</Label>
          <Textarea
            id="reason"
            placeholder="リモートワークが必要な理由を入力してください"
            {...form.register('reason')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityMeasures">セキュリティ対策</Label>
          <Textarea
            id="securityMeasures"
            placeholder="在宅勤務時のセキュリティ対策について記載してください"
            {...form.register('securityMeasures')}
            rows={3}
          />
        </div>

        {startDate && endDate && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              申請期間: {differenceInDays(endDate, startDate) + 1}日間
            </p>
            {differenceInDays(endDate, startDate) > 30 && (
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                ※ 30日を超えるリモートワークは部門長と人事部の承認が必要です
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 給与振込口座変更フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BankAccountChangeForm({ form, onFlowUpdate }: FormComponentProps) {
  const [consent, setConsent] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          給与振込口座変更
        </CardTitle>
        <CardDescription>
          給与振込先の口座情報を変更します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 注意書きブルーボックス */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
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

        {/* 銀行情報 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankName">
              銀行名
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="bankName"
              placeholder="例：三菱UFJ銀行"
              {...form.register('bankName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankCode">
              銀行コード
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="bankCode"
              placeholder="0005"
              maxLength={4}
              {...form.register('bankCode')}
            />
            <p className="text-xs text-muted-foreground">4桁の数字</p>
          </div>
        </div>

        {/* 支店情報 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="branchName">
              支店名
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="branchName"
              placeholder="例：新宿支店"
              {...form.register('branchName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchCode">
              支店コード
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="branchCode"
              placeholder="123"
              maxLength={3}
              {...form.register('branchCode')}
            />
            <p className="text-xs text-muted-foreground">3桁の数字</p>
          </div>
        </div>

        {/* 口座情報 */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              口座番号
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="accountNumber"
              placeholder="1234567"
              maxLength={7}
              {...form.register('accountNumber')}
            />
            <p className="text-xs text-muted-foreground">7桁の数字</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountHolderKana">
              口座名義（全角カナ）
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="accountHolderKana"
              placeholder="ヤマダ タロウ"
              {...form.register('accountHolderKana')}
            />
            <p className="text-xs text-muted-foreground">名字と名前の間に全角スペース</p>
          </div>
        </div>

        {/* 変更理由 */}
        <div className="space-y-2">
          <Label htmlFor="changeReason">
            変更理由
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea
            id="changeReason"
            placeholder="口座変更の理由を入力してください"
            {...form.register('changeReason')}
            rows={3}
          />
        </div>

        {/* 同意事項 */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            口座振込に関する同意事項
          </h4>
          <ul className="space-y-2 text-sm text-gray-700 mb-3">
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
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="consent"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <Label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
              上記の同意事項を確認し、同意します
              <span className="text-red-500 ml-1">*</span>
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 家族情報変更フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FamilyInfoChangeForm({ form, onFlowUpdate }: FormComponentProps) {
  const [hasSpouse, setHasSpouse] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'familyMembers',
  });

  const addFamilyMember = () => {
    if (fields.length >= 6) {
      toast.error('家族メンバーは最大6名までです');
      return;
    }

    append({
      nameKanji: '',
      nameKana: '',
      relationship: '',
      birthDate: '',
      occupation: '',
      annualIncome: 0,
      liveTogether: true,
      incomeTaxDependent: false,
      healthInsuranceDependent: false,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          家族情報変更
        </CardTitle>
        <CardDescription>
          家族構成や扶養家族の情報を変更します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 配偶者情報セクション */}
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="hasSpouse"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={hasSpouse}
              onChange={(e) => setHasSpouse(e.target.checked)}
            />
            <Label htmlFor="hasSpouse" className="cursor-pointer">
              配偶者がいる
            </Label>
          </div>

          {hasSpouse && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
              <p className="text-sm font-medium text-gray-700">配偶者の詳細情報</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="spouseNameKanji">
                    氏名（漢字）
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseNameKanji"
                    {...form.register('spouse.nameKanji')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spouseNameKana">
                    氏名（カナ）
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseNameKana"
                    placeholder="ヤマダ ハナコ"
                    {...form.register('spouse.nameKana')}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="spouseBirthDate">
                    生年月日
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseBirthDate"
                    type="date"
                    {...form.register('spouse.birthDate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spouseOccupation">
                    職業
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseOccupation"
                    placeholder="会社員"
                    {...form.register('spouse.occupation')}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="spouseAnnualIncome">
                    年間収入（見込み）
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="spouseAnnualIncome"
                    type="number"
                    {...form.register('spouse.annualIncome', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">円</p>
                </div>
                <div className="flex items-start gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="spouseLiveTogether"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...form.register('spouse.liveTogether')}
                  />
                  <Label htmlFor="spouseLiveTogether" className="cursor-pointer">
                    同居している
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">税額控除・扶養</p>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="spouseIncomeTaxDependent"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...form.register('spouse.incomeTaxDependent')}
                  />
                  <div>
                    <Label htmlFor="spouseIncomeTaxDependent" className="cursor-pointer">
                      所得税上の扶養に入れる（年間所得48万円以下）
                    </Label>
                    <p className="text-xs text-muted-foreground">年間所得が48万円以下の場合、所得税の配偶者控除が適用されます</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="spouseHealthInsuranceDependent"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...form.register('spouse.healthInsuranceDependent')}
                  />
                  <div>
                    <Label htmlFor="spouseHealthInsuranceDependent" className="cursor-pointer">
                      健康保険の扶養に入れる（年間所得130万円未満）
                    </Label>
                    <p className="text-xs text-muted-foreground">年間所得が130万円未満の場合、健康保険の扶養に入れます</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* その他の家族メンバー */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">その他の家族</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFamilyMember}
              disabled={fields.length >= 6}
            >
              <Users className="h-4 w-4 mr-2" />
              家族を追加
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                「家族を追加」ボタンをクリックして、家族メンバーを追加してください
                <br />
                （最大6名まで）
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">家族{index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.nameKanji`}>
                        氏名（漢字）
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.nameKanji`}
                        {...form.register(`familyMembers.${index}.nameKanji` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.nameKana`}>
                        氏名（カナ）
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.nameKana`}
                        placeholder="ヤマダ イチロウ"
                        {...form.register(`familyMembers.${index}.nameKana` as const)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.relationship`}>
                        続柄
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.relationship`}
                        placeholder="長男、次女など"
                        {...form.register(`familyMembers.${index}.relationship` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.birthDate`}>
                        生年月日
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.birthDate`}
                        type="date"
                        {...form.register(`familyMembers.${index}.birthDate` as const)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.occupation`}>
                        職業
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.occupation`}
                        placeholder="学生、会社員など"
                        {...form.register(`familyMembers.${index}.occupation` as const)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`familyMembers.${index}.annualIncome`}>
                        年間収入（見込み）
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id={`familyMembers.${index}.annualIncome`}
                        type="number"
                        {...form.register(`familyMembers.${index}.annualIncome` as const, { valueAsNumber: true })}
                      />
                      <p className="text-xs text-muted-foreground">円</p>
                    </div>
                    <div className="flex items-start gap-2 pt-6">
                      <input
                        type="checkbox"
                        id={`familyMembers.${index}.liveTogether`}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...form.register(`familyMembers.${index}.liveTogether` as const)}
                      />
                      <Label htmlFor={`familyMembers.${index}.liveTogether`} className="cursor-pointer">
                        同居している
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">税額控除・扶養</p>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`familyMembers.${index}.incomeTaxDependent`}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...form.register(`familyMembers.${index}.incomeTaxDependent` as const)}
                      />
                      <Label htmlFor={`familyMembers.${index}.incomeTaxDependent`} className="cursor-pointer">
                        所得税上の扶養に入れる
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`familyMembers.${index}.healthInsuranceDependent`}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...form.register(`familyMembers.${index}.healthInsuranceDependent` as const)}
                      />
                      <Label htmlFor={`familyMembers.${index}.healthInsuranceDependent`} className="cursor-pointer">
                        健康保険の扶養に入れる
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 変更理由 */}
        <div className="space-y-2">
          <Label htmlFor="changeReason">
            変更理由
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea
            id="changeReason"
            placeholder="変更の理由を詳しく入力してください"
            {...form.register('changeReason')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// 通勤経路変更フォーム
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CommuteRouteChangeForm({ form, onFlowUpdate }: FormComponentProps) {
  const [transportMethod, setTransportMethod] = useState<'public' | 'private' | ''>('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-orange-600" />
          通勤経路変更
        </CardTitle>
        <CardDescription>
          通勤経路や通勤手段を変更します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 確認事項 */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            以下の項目を必ずお読みいただき、チェックしてください
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation1"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.transportAllowanceCompliance')}
              />
              <Label htmlFor="confirmation1" className="text-sm cursor-pointer">
                交通費は、社会通念上最も経済的かつ合理的と認められる経路および方法により算出された金額を支給します
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation2"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.remoteWorkDailyCalculation')}
              />
              <Label htmlFor="confirmation2" className="text-sm cursor-pointer">
                在宅勤務制度を利用する場合、交通費は日割り計算となります
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation3"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.expenseDeadline')}
              />
              <Label htmlFor="confirmation3" className="text-sm cursor-pointer">
                交通費の精算は毎月末日までに申請してください
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation4"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.bicycleProhibition')}
              />
              <Label htmlFor="confirmation4" className="text-sm cursor-pointer">
                自転車通勤は原則禁止です（特別な事情がある場合は人事部に相談してください）
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
          </div>
        </div>

        {/* 通勤方法 */}
        <div className="space-y-2">
          <Label htmlFor="transportMethod">
            通勤方法
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select onValueChange={(value) => {
            setTransportMethod(value as 'public' | 'private');
            form.setValue('transportMethod', value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">公共交通機関</SelectItem>
              <SelectItem value="private">自家用車</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 公共交通機関の場合 */}
        {transportMethod === 'public' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                <strong>入力例：</strong>
                <br />
                自宅 → 新宿駅（JR山手線）→ 渋谷駅（東急東横線）→ 中目黒駅
                → 徒歩5分 → オフィス
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publicDeparture">
                  出発地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="publicDeparture"
                  placeholder="例：自宅最寄り駅"
                  {...form.register('publicTransit.departure')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicArrival">
                  到着地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="publicArrival"
                  placeholder="例：オフィス最寄り駅"
                  {...form.register('publicTransit.arrival')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicRouteDetails">
                経路詳細
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="publicRouteDetails"
                placeholder="使用する路線と駅を順番に記入してください&#10;例：自宅 → 新宿駅（JR山手線）→ 渋谷駅 → 徒歩 → オフィス"
                {...form.register('publicTransit.routeDetails')}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publicOneWayFare">
                  片道運賃
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="publicOneWayFare"
                    type="number"
                    className="pl-8"
                    placeholder="500"
                    {...form.register('publicTransit.oneWayFare', { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">円</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicTravelTime">
                  所要時間
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="publicTravelTime"
                  type="number"
                  placeholder="45"
                  {...form.register('publicTransit.travelTime', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">分</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicPassType">
                定期券種類
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select onValueChange={(value) => form.setValue('publicTransit.passType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1ヶ月定期</SelectItem>
                  <SelectItem value="3months">3ヶ月定期</SelectItem>
                  <SelectItem value="6months">6ヶ月定期</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicPassFare">
                定期券代金
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="publicPassFare"
                  type="number"
                  className="pl-8"
                  placeholder="15000"
                  {...form.register('publicTransit.passFare', { valueAsNumber: true })}
                />
              </div>
              <p className="text-xs text-muted-foreground">選択した定期券種類の金額を入力</p>
            </div>
          </div>
        )}

        {/* 自家用車の場合 */}
        {transportMethod === 'private' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                <strong>ご注意：</strong>
                <br />
                自家用車通勤には会社の承認が必要です。
                <br />
                駐車場代は自己負担となります。ガソリン代のみ支給対象です。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="privateDeparture">
                  出発地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateDeparture"
                  placeholder="例：自宅"
                  {...form.register('privateCar.departure')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateArrival">
                  到着地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateArrival"
                  placeholder="例：オフィス駐車場"
                  {...form.register('privateCar.arrival')}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="privateDistance">
                  片道距離
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateDistance"
                  type="number"
                  step="0.1"
                  placeholder="15"
                  {...form.register('privateCar.distance', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">km（小数点1桁まで）</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateTravelTime">
                  所要時間
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateTravelTime"
                  type="number"
                  placeholder="30"
                  {...form.register('privateCar.travelTime', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">分</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateCarModel">
                車種
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="privateCarModel"
                placeholder="例：トヨタ プリウス"
                {...form.register('privateCar.carModel')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateLicensePlate">
                ナンバープレート
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="privateLicensePlate"
                placeholder="例：品川 500 あ 12-34"
                {...form.register('privateCar.licensePlate')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="privateFuelType">
                  燃料タイプ
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select onValueChange={(value) => form.setValue('privateCar.fuelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">ガソリン</SelectItem>
                    <SelectItem value="diesel">ディーゼル</SelectItem>
                    <SelectItem value="hybrid">ハイブリッド</SelectItem>
                    <SelectItem value="electric">電気</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateFuelEfficiency">
                  燃費
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateFuelEfficiency"
                  type="number"
                  step="0.1"
                  placeholder="20"
                  {...form.register('privateCar.fuelEfficiency', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">km/L（電気の場合はkm/kWh）</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="privateNeedParking"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('privateCar.needParking')}
              />
              <div>
                <Label htmlFor="privateNeedParking" className="cursor-pointer">
                  駐車場を会社で手配してほしい
                </Label>
                <p className="text-xs text-muted-foreground">会社が駐車場を手配する場合、駐車場代は自己負担となります</p>
              </div>
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
              <p className="text-xs text-muted-foreground mt-2">
                ※ 上記書類は人事部に直接提出してください
              </p>
            </div>
          </div>
        )}

        {/* 変更理由 */}
        <div className="space-y-2">
          <Label htmlFor="changeReason">
            変更理由
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea
            id="changeReason"
            placeholder="通勤経路変更の理由を入力してください"
            {...form.register('changeReason')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
