'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useApprovalStore } from '@/lib/approval-store';
import { getUserDepartmentInfo, createApprovalFlow } from '@/lib/approval-system';
import { CheckCircle, Clock, User, ArrowRight, ArrowLeft } from 'lucide-react';

// 承認フロープレビューコンポーネント
const ApprovalFlowPreview = ({ formData, leaveDays, currentUserId, onBack }: {
  formData: LeaveRequestData;
  leaveDays: number;
  currentUserId: string;
  onBack: () => void;
}) => {
  const urgency = leaveDays >= 5 ? 'high' : 'normal';
  
  // 仮の承認フローを生成（プレビュー用）
  const previewFlow = createApprovalFlow(
    'preview-request',
    'leave',
    currentUserId,
    '田中太郎',
    urgency
  );

  return (
    <>
      {/* 申請内容サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">申請内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">休暇種別</Label>
              <p className="font-medium">
                {leaveTypes.find(t => t.value === formData.type)?.label}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">取得日数</Label>
              <p className="font-medium">{leaveDays}日</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">開始日</Label>
              <p className="font-medium">
                {format(formData.startDate, 'yyyy/MM/dd (E)', { locale: ja })}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">終了日</Label>
              <p className="font-medium">
                {format(formData.endDate, 'yyyy/MM/dd (E)', { locale: ja })}
              </p>
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">理由</Label>
            <p className="font-medium">{formData.reason}</p>
          </div>
        </CardContent>
      </Card>

      {/* 承認フロー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            承認フロー
          </CardTitle>
          <CardDescription>
            この申請は以下の順序で承認されます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {previewFlow.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {step.stepNumber}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{step.approverName}</span>
                    <Badge variant="outline" className="text-xs">
                      {step.approverRole === 'manager' ? '直属上司' : 
                       step.approverRole === 'hr' ? '人事部' : '管理者'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.approverRole === 'manager' ? '業務調整の観点で承認' :
                     step.approverRole === 'hr' ? '勤怠制度の観点で最終承認' :
                     '管理者として承認'}
                  </p>
                </div>
                
                {index < previewFlow.steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
          
          {leaveDays >= 5 && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-sm">長期休暇のため人事承認が必要です</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">
                5日以上の休暇は人事部での最終確認が必要となります
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const leaveRequestSchema = z.object({
  type: z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement']),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(1, 'Reason is required'),
  emergencyContact: z.string().optional(),
});

type LeaveRequestData = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeaveRequestData) => Promise<void>;
}

const leaveTypes = [
  { value: 'annual', label: '年次有給休暇', description: '通常の有給休暇', daysRequired: true, color: 'blue' },
  { value: 'sick', label: '病気休暇', description: '病気・怪我による休暇', daysRequired: false, color: 'red' },
  { value: 'personal', label: '私用休暇', description: '私的な用事による休暇', daysRequired: true, color: 'purple' },
  { value: 'maternity', label: '産前産後休暇', description: '出産に関する休暇', daysRequired: false, color: 'pink' },
  { value: 'paternity', label: '育児休暇', description: '育児のための休暇', daysRequired: false, color: 'green' },
  { value: 'bereavement', label: '忌引休暇', description: '親族の死亡による休暇', daysRequired: false, color: 'gray' },
];

export function LeaveRequestDialog({ open, onOpenChange, onSubmit }: LeaveRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovalFlow, setShowApprovalFlow] = useState(false);
  const { createFlow, submitRequest } = useApprovalStore();
  const currentUserId = '1'; // 現在のユーザー（田中太郎）
  const [selectedType, setSelectedType] = useState<string>('annual');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<LeaveRequestData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      type: 'annual',
      startDate: new Date(),
      endDate: new Date(),
      reason: '',
      emergencyContact: '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const leaveType = watch('type');

  // Calculate leave days
  const calculateDays = (start: Date, end: Date) => {
    if (!start || !end) return 0;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diffDays);
  };

  const leaveDays = calculateDays(startDate, endDate);
  const selectedLeaveType = leaveTypes.find(type => type.value === leaveType);

  // Mock remaining leave balance
  const remainingDays = 12;

  const handleFormSubmit = async (data: LeaveRequestData) => {
    if (!showApprovalFlow) {
      // 承認フロー確認画面を表示
      setShowApprovalFlow(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 休暇申請データの作成
      const requestId = `leave-${Date.now()}`;
      const days = calculateDays(data.startDate, data.endDate);
      
      // 緊急度の判定（5日以上は高緊急度）
      const urgency = days >= 5 ? 'high' : 'normal';
      
      // 承認フローの作成
      const flow = createFlow(
        requestId,
        'leave',
        currentUserId,
        '田中太郎',
        urgency
      );
      
      // 申請データと承認フローを連携
      const requestData = {
        ...data,
        id: requestId,
        days,
        approvalFlowId: flow.id,
      };
      
      await onSubmit(requestData);
      
      // 申請を提出状態に変更
      submitRequest(flow.id);
      
      toast.success('休暇申請を提出しました', {
        description: '承認者に通知が送信されました'
      });
      reset();
      setShowApprovalFlow(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('申請の提出に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {showApprovalFlow ? '申請内容確認・承認フロー' : '有給申請'}
            </DialogTitle>
            <DialogDescription>
              {showApprovalFlow 
                ? '申請内容と承認フローを確認してください'
                : '新しい有給申請を作成します'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {showApprovalFlow ? (
              /* 承認フロー確認画面 */
              <ApprovalFlowPreview 
                formData={getValues()}
                leaveDays={leaveDays}
                currentUserId={currentUserId}
                onBack={() => setShowApprovalFlow(false)}
              />
            ) : (
              /* 通常の申請フォーム */
              <div className="space-y-6">
            {/* Current Leave Balance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">現在の残日数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{remainingDays}日</div>
                    <p className="text-sm text-muted-foreground">年次有給休暇</p>
                  </div>
                  {leaveDays > remainingDays && (
                    <Badge variant="destructive">
                      残日数不足
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leave Type Selection */}
            <div className="space-y-2">
              <Label>休暇種別 *</Label>
              <Select
                value={leaveType}
                onValueChange={(value) => {
                  setValue('type', value as any);
                  setSelectedType(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="休暇種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-sm text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>開始日 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP", { locale: ja })
                      ) : (
                        <span>開始日を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setValue('startDate', date || new Date());
                        if (!endDate || (date && date > endDate)) {
                          setValue('endDate', date || new Date());
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>終了日 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, "PPP", { locale: ja })
                      ) : (
                        <span>終了日を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => setValue('endDate', date || new Date())}
                      disabled={(date) => startDate && date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Days Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">申請日数</span>
                  <div className="text-right">
                    <div className="text-lg font-bold">{leaveDays}日</div>
                    {selectedLeaveType?.daysRequired && (
                      <div className="text-sm text-muted-foreground">
                        残り: {Math.max(0, remainingDays - leaveDays)}日
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">申請理由 *</Label>
              <Textarea
                id="reason"
                placeholder="休暇の理由を入力してください"
                {...register('reason')}
                className={errors.reason ? 'border-red-500' : ''}
              />
              {errors.reason && (
                <p className="text-sm text-red-500">{errors.reason.message}</p>
              )}
            </div>

            {/* Emergency Contact (for certain leave types) */}
            {(leaveType === 'sick' || leaveType === 'maternity' || leaveType === 'paternity') && (
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">緊急連絡先</Label>
                <Input
                  id="emergencyContact"
                  placeholder="緊急時の連絡先（任意）"
                  {...register('emergencyContact')}
                />
              </div>
            )}

            {/* Warnings */}
            {leaveDays > remainingDays && selectedLeaveType?.daysRequired && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">警告</Badge>
                    <span className="text-sm">
                      申請日数が残日数を超えています。承認されない可能性があります。
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {leaveDays > 5 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                      注意
                    </Badge>
                    <span className="text-sm">
                      5日以上の連続休暇は事前に上司との相談が推奨されます。
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
            )}
          </div>

          <DialogFooter>
            {showApprovalFlow ? (
              <>
                <Button type="button" variant="outline" onClick={() => setShowApprovalFlow(false)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  戻る
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? '申請中...' : '申請を提出'}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={leaveDays > remainingDays && selectedLeaveType?.daysRequired}
                >
                  承認フロー確認
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}