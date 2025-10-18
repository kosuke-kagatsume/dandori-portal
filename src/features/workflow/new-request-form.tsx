'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { WorkflowType, WorkflowRequest, ApproverRole } from '@/lib/workflow-store';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  ChevronRight,
  CheckCircle,
  User,
  Users,
  Clock,
  DollarSign,
  Briefcase,
  Home,
  Building2,
  Laptop,
  Plane,
  Coffee,
  Package,
  Calendar,
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
    required: boolean;
  }>>([]);

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

  // 承認フローの自動設定
  const setupApprovalFlow = (type: WorkflowType, details: any) => {
    const flow: Array<{ role: ApproverRole; name: string; required: boolean }> = [];
    
    // 直属上司は必須
    flow.push({ role: 'direct_manager', name: '田中太郎', required: true });
    
    // 申請タイプと条件に応じて承認者を追加
    switch (type) {
      case 'leave_request':
        if (details.days > 3) {
          flow.push({ role: 'department_head', name: '山田部長', required: true });
        }
        if (details.days > 5) {
          flow.push({ role: 'hr_manager', name: '人事部長', required: true });
        }
        break;
        
      case 'expense_claim':
        if (details.amount > 50000) {
          flow.push({ role: 'department_head', name: '山田部長', required: true });
        }
        if (details.amount > 100000) {
          flow.push({ role: 'finance_manager', name: '経理部長', required: true });
        }
        if (details.amount > 500000) {
          flow.push({ role: 'general_manager', name: '役員', required: true });
        }
        break;
        
      case 'overtime_request':
        if (details.hours > 20) {
          flow.push({ role: 'department_head', name: '山田部長', required: true });
          flow.push({ role: 'hr_manager', name: '人事部長', required: true });
        }
        break;
        
      case 'business_trip':
        flow.push({ role: 'department_head', name: '山田部長', required: true });
        if (details.estimatedCost > 200000 || details.transportation === 'airplane') {
          flow.push({ role: 'general_manager', name: '役員', required: true });
        }
        break;
        
      case 'remote_work':
        if (differenceInDays(details.endDate, details.startDate) > 30) {
          flow.push({ role: 'department_head', name: '山田部長', required: true });
          flow.push({ role: 'hr_manager', name: '人事部長', required: true });
        }
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

  // 承認者ロール→ユーザーIDのマッピング（デモ用）
  const getApproverIdByRole = (role: ApproverRole): string => {
    const roleToUserIdMap: Record<ApproverRole, string> = {
      direct_manager: '2',      // 佐藤部長（manager）
      department_head: '2',     // 佐藤部長（manager）
      hr_manager: '3',          // 山田人事（hr）
      finance_manager: '3',     // 山田人事（hr）- デモ用に人事が兼任
      general_manager: '4',     // システム管理者（admin）
    };
    return roleToUserIdMap[role] || '2'; // デフォルトはmanager
  };

  const handleSubmit = async (data: any) => {
    try {
      // 仮のユーザーID（本番では認証から取得）
      const userId = currentUserId || 'demo-user-id';

      // ローカルのWorkflowStoreに直接追加
      const request: Partial<WorkflowRequest> = {
        type: requestType!,
        title: getRequestTitle(requestType!, data),
        description: data.reason || data.purpose || '',
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
          approverId: getApproverIdByRole(step.role),
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

  const getRequestTitle = (type: WorkflowType, data: any): string => {
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
      default:
        return '新規申請';
    }
  };

  const getPriority = (type: WorkflowType, data: any): 'low' | 'normal' | 'high' | 'urgent' => {
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

    switch (requestType) {
      case 'leave_request':
        return <LeaveRequestForm form={form} onFlowUpdate={setupApprovalFlow} />;
      case 'expense_claim':
        return <ExpenseClaimForm form={form} onFlowUpdate={setupApprovalFlow} />;
      case 'overtime_request':
        return <OvertimeRequestForm form={form} onFlowUpdate={setupApprovalFlow} />;
      case 'business_trip':
        return <BusinessTripForm form={form} onFlowUpdate={setupApprovalFlow} />;
      case 'remote_work':
        return <RemoteWorkForm form={form} onFlowUpdate={setupApprovalFlow} />;
      case 'purchase_request':
        return <PurchaseRequestForm form={form} onFlowUpdate={setupApprovalFlow} />;
      case 'document_approval':
        return <DocumentApprovalForm form={form} onFlowUpdate={setupApprovalFlow} />;
      default:
        return <DefaultRequestForm form={form} onFlowUpdate={setupApprovalFlow} />;
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
function LeaveRequestForm({ form, onFlowUpdate }: any) {
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
          <RadioGroup defaultValue="paid_leave" onValueChange={(value) => form.setValue('leaveType', value)} className="grid grid-cols-3 gap-4">
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
function ExpenseClaimForm({ form, onFlowUpdate }: any) {
  const [expenseDate, setExpenseDate] = useState<Date>();
  const [amount, setAmount] = useState<number>(0);

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
          <Select onValueChange={(value) => form.setValue('expenseType', value)}>
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
function OvertimeRequestForm({ form, onFlowUpdate }: any) {
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
function BusinessTripForm({ form, onFlowUpdate }: any) {
  const [startDate, setStartDate] = useState<Date>();
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
              form.setValue('transportation', value);
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
function PurchaseRequestForm({ form, onFlowUpdate }: any) {
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
function DocumentApprovalForm({ form, onFlowUpdate }: any) {
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
function DefaultRequestForm({ form }: any) {
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
function RemoteWorkForm({ form, onFlowUpdate }: any) {
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
          <RadioGroup defaultValue="home" onValueChange={(value) => form.setValue('workLocation', value)}>
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