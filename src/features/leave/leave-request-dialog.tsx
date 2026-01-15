'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, Paperclip, Clock, Calendar, Sun, History } from 'lucide-react';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useApprovalStore } from '@/lib/approval-store';
import { createApprovalFlow } from '@/lib/approval-system';
import { useLeaveTypeStore } from '@/lib/store/leave-type-store';
import { useLeaveManagementStore } from '@/lib/store/leave-management-store';
import { useUserStore } from '@/lib/store/user-store';
import { User, ArrowRight, ArrowLeft } from 'lucide-react';
import { LeaveHistoryDialog } from './leave-history-dialog';

// 取得単位の型
type LeaveUnit = 'full_day' | 'half_day_am' | 'half_day_pm' | 'hourly';

// 承認フロープレビューコンポーネント
const ApprovalFlowPreview = ({ formData, leaveDays, leaveUnit, currentUserId, leaveTypeName }: {
  formData: LeaveRequestData;
  leaveDays: number;
  leaveUnit: LeaveUnit;
  currentUserId: string;
  leaveTypeName: string;
}) => {
  const urgency = leaveDays >= 5 ? 'high' : 'normal';

  const previewFlow = createApprovalFlow(
    'preview-request',
    'leave',
    currentUserId,
    '田中太郎',
    urgency
  );

  const getUnitLabel = (unit: LeaveUnit) => {
    const labels: Record<LeaveUnit, string> = {
      full_day: '全休',
      half_day_am: '午前半休',
      half_day_pm: '午後半休',
      hourly: '時間休',
    };
    return labels[unit];
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">申請内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">休暇種別</Label>
              <p className="font-medium">{leaveTypeName}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">取得単位</Label>
              <p className="font-medium">{getUnitLabel(leaveUnit)}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">取得日数</Label>
              <p className="font-medium">
                {leaveUnit === 'hourly' ? `${formData.hours || 1}時間` : `${leaveDays}日`}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">開始日</Label>
              <p className="font-medium">
                {format(formData.startDate, 'yyyy/MM/dd (E)', { locale: ja })}
              </p>
            </div>
          </div>
          {leaveUnit === 'full_day' && formData.startDate.getTime() !== formData.endDate.getTime() && (
            <div>
              <Label className="text-sm text-muted-foreground">終了日</Label>
              <p className="font-medium">
                {format(formData.endDate, 'yyyy/MM/dd (E)', { locale: ja })}
              </p>
            </div>
          )}
          <div>
            <Label className="text-sm text-muted-foreground">理由</Label>
            <p className="font-medium">{formData.reason}</p>
          </div>
        </CardContent>
      </Card>

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
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

const leaveRequestSchema = z.object({
  type: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(1, '申請理由を入力してください'),
  emergencyContact: z.string().optional(),
  hours: z.number().optional(),
});

type LeaveRequestData = z.infer<typeof leaveRequestSchema>;

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeaveRequestSubmitData) => Promise<void>;
  initialData?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  };
  isEditMode?: boolean;
}

interface LeaveRequestSubmitData {
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  approvalFlowId: string;
  attachments: UploadedFile[];
}

export function LeaveRequestDialog({ open, onOpenChange, onSubmit, initialData, isEditMode = false }: LeaveRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovalFlow, setShowApprovalFlow] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { createFlow, submitRequest } = useApprovalStore();
  const { getActiveLeaveTypes, getLeaveTypeById } = useLeaveTypeStore();
  const { getLeaveBalance } = useLeaveManagementStore();
  const { currentUser, currentDemoUser, isDemoMode } = useUserStore();

  const currentUserId = isDemoMode ? (currentDemoUser?.id || '1') : (currentUser?.id || '1');
  const currentYear = new Date().getFullYear();

  const [leaveUnit, setLeaveUnit] = useState<LeaveUnit>('full_day');
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>('paid');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  // 有効な休暇種別を取得
  const activeLeaveTypes = useMemo(() => getActiveLeaveTypes(), [getActiveLeaveTypes]);

  // 選択中の休暇種別
  const selectedLeaveType = useMemo(() => {
    return getLeaveTypeById(selectedLeaveTypeId) || activeLeaveTypes[0];
  }, [getLeaveTypeById, selectedLeaveTypeId, activeLeaveTypes]);

  // 休暇残高
  const balance = useMemo(() => getLeaveBalance(currentUserId, currentYear), [getLeaveBalance, currentUserId, currentYear]);

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
      type: initialData?.type || 'paid',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(),
      reason: initialData?.reason || '',
      emergencyContact: '',
      hours: 1,
    },
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && open) {
      reset({
        type: initialData.type || 'paid',
        startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
        endDate: initialData.endDate ? new Date(initialData.endDate) : new Date(),
        reason: initialData.reason || '',
        emergencyContact: '',
        hours: 1,
      });
      setSelectedLeaveTypeId(initialData.type || 'paid');
      // Determine leave unit from type
      if (initialData.type === 'half_day_am') {
        setLeaveUnit('half_day_am');
      } else if (initialData.type === 'half_day_pm') {
        setLeaveUnit('half_day_pm');
      } else {
        setLeaveUnit('full_day');
      }
    }
  }, [initialData, open, reset]);

  // Reset leave unit when leave type changes
  useEffect(() => {
    if (selectedLeaveType) {
      if (!selectedLeaveType.allowFullDay && selectedLeaveType.allowHalfDay) {
        setLeaveUnit('half_day_am');
      } else if (!selectedLeaveType.allowFullDay && !selectedLeaveType.allowHalfDay && selectedLeaveType.allowHourly) {
        setLeaveUnit('hourly');
      } else {
        setLeaveUnit('full_day');
      }
    }
  }, [selectedLeaveType]);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const hours = watch('hours');

  // Calculate leave days based on unit
  const calculateDays = (start: Date, end: Date, unit: LeaveUnit) => {
    if (!start || !end) return 0;

    switch (unit) {
      case 'full_day':
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(0, diffDays);
      case 'half_day_am':
      case 'half_day_pm':
        return 0.5;
      case 'hourly':
        return (hours || 1) / 8; // 8時間 = 1日として計算
      default:
        return 0;
    }
  };

  const leaveDays = calculateDays(startDate, endDate, leaveUnit);

  // 残日数（休暇種別によって異なる）
  const remainingDays = useMemo(() => {
    if (!balance) return 0;
    if (selectedLeaveTypeId === 'paid' || selectedLeaveTypeId === 'compensatory') {
      return balance.paidLeave.remaining;
    }
    if (selectedLeaveTypeId === 'sick') {
      return balance.sickLeave.remaining;
    }
    if (selectedLeaveTypeId === 'special') {
      return balance.specialLeave.remaining;
    }
    return 20; // デフォルト
  }, [balance, selectedLeaveTypeId]);

  // 取得単位のオプションを生成
  const availableUnits = useMemo(() => {
    if (!selectedLeaveType) return [];
    const units: { value: LeaveUnit; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

    if (selectedLeaveType.allowFullDay) {
      units.push({ value: 'full_day', label: '全休', icon: Calendar });
    }
    if (selectedLeaveType.allowHalfDay) {
      units.push({ value: 'half_day_am', label: '午前半休', icon: Sun });
      units.push({ value: 'half_day_pm', label: '午後半休', icon: Sun });
    }
    if (selectedLeaveType.allowHourly) {
      units.push({ value: 'hourly', label: '時間休', icon: Clock });
    }

    return units;
  }, [selectedLeaveType]);

  const handleFormSubmit = async (data: LeaveRequestData) => {
    // バリデーション: 終了日 >= 開始日
    if (data.endDate < data.startDate) {
      toast.error('終了日は開始日以降を指定してください');
      return;
    }

    if (!showApprovalFlow) {
      setShowApprovalFlow(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const requestId = `leave-${Date.now()}`;
      const days = calculateDays(data.startDate, data.endDate, leaveUnit);
      const urgency = days >= 5 ? 'high' : 'normal';

      const flow = createFlow(
        requestId,
        'leave',
        currentUserId,
        isDemoMode ? (currentDemoUser?.name || '田中太郎') : (currentUser?.name || '田中太郎'),
        urgency
      );

      // Map leave unit to type for storage
      let finalType = selectedLeaveTypeId;
      if (leaveUnit === 'half_day_am') {
        finalType = 'half_day_am';
      } else if (leaveUnit === 'half_day_pm') {
        finalType = 'half_day_pm';
      }

      const requestData = {
        type: finalType,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        days: leaveUnit === 'hourly' ? (data.hours || 1) / 8 : days,
        reason: data.reason,
        approvalFlowId: flow.id,
        attachments,
      };

      await onSubmit(requestData);

      submitRequest(flow.id);

      toast.success('休暇申請を提出しました', {
        description: '承認者に通知が送信されました'
      });
      reset();
      setShowApprovalFlow(false);
      setLeaveUnit('full_day');
      onOpenChange(false);
    } catch {
      toast.error('申請の提出に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {showApprovalFlow ? '申請内容確認・承認フロー' : isEditMode ? '休暇申請を編集' : '休暇申請を新規作成します'}
              </DialogTitle>
              <DialogDescription>
                {showApprovalFlow
                  ? '申請内容と承認フローを確認してください'
                  : '休暇等の申請と管理を行います'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {showApprovalFlow ? (
                <ApprovalFlowPreview
                  formData={getValues()}
                  leaveDays={leaveDays}
                  leaveUnit={leaveUnit}
                  currentUserId={currentUserId}
                  leaveTypeName={selectedLeaveType?.name || ''}
                  onBack={() => setShowApprovalFlow(false)}
                />
              ) : (
                <div className="space-y-6">
                  {/* Current Leave Balance */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">現在の残日数</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHistoryDialog(true)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          履歴
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{remainingDays}日</div>
                          <p className="text-sm text-muted-foreground">{selectedLeaveType?.name || '有給休暇'}</p>
                        </div>
                        {leaveDays > remainingDays && selectedLeaveType?.isPaid && (
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
                      value={selectedLeaveTypeId}
                      onValueChange={(value) => {
                        setSelectedLeaveTypeId(value);
                        setValue('type', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="休暇種別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLeaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{type.name}</span>
                              {type.isPaid && (
                                <Badge variant="secondary" className="text-xs">有給</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedLeaveType?.description && (
                      <p className="text-xs text-muted-foreground">{selectedLeaveType.description}</p>
                    )}
                  </div>

                  {/* Leave Unit Selection */}
                  {availableUnits.length > 1 && (
                    <div className="space-y-2">
                      <Label>取得単位 *</Label>
                      <RadioGroup
                        value={leaveUnit}
                        onValueChange={(value) => setLeaveUnit(value as LeaveUnit)}
                        className="grid grid-cols-2 gap-2"
                      >
                        {availableUnits.map((unit) => {
                          const Icon = unit.icon;
                          return (
                            <div key={unit.value}>
                              <RadioGroupItem
                                value={unit.value}
                                id={unit.value}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={unit.value}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                                  "hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {unit.label}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Time Input for Hourly Leave */}
                  {leaveUnit === 'hourly' && (
                    <div className="space-y-2">
                      <Label htmlFor="hours">取得時間 *</Label>
                      <Select
                        value={String(hours || 1)}
                        onValueChange={(value) => setValue('hours', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="時間を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map((h) => (
                            <SelectItem key={h} value={String(h)}>{h}時間</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Date Selection */}
                  <div className={cn("grid gap-4", leaveUnit === 'full_day' ? "grid-cols-2" : "grid-cols-1")}>
                    <div className="space-y-2">
                      <Label>{leaveUnit === 'full_day' ? '開始日 *' : '取得日 *'}</Label>
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
                              <span>日付を選択</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setValue('startDate', date || new Date());
                              if (leaveUnit !== 'full_day' || !endDate || (date && date > endDate)) {
                                setValue('endDate', date || new Date());
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {leaveUnit === 'full_day' && (
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
                            <CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={(date) => setValue('endDate', date || new Date())}
                              disabled={(date) => startDate && date < startDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {/* Days Summary */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">申請日数</span>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {leaveUnit === 'hourly'
                              ? `${hours || 1}時間`
                              : leaveUnit.startsWith('half_day')
                                ? '0.5日'
                                : `${leaveDays}日`
                            }
                          </div>
                          {selectedLeaveType?.isPaid && (
                            <div className="text-sm text-muted-foreground">
                              残り: {Math.max(0, remainingDays - leaveDays).toFixed(1)}日
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

                  {/* File Attachments (if required) */}
                  {selectedLeaveType?.requireAttachment && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        添付ファイル
                        <Badge variant="destructive" className="text-xs">必須</Badge>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        証明書類をアップロードしてください
                      </p>
                      <FileUpload
                        value={attachments}
                        onChange={setAttachments}
                        maxFiles={3}
                        maxSize={10}
                        accept="image/*,.pdf"
                        bucket="leave-attachments"
                      />
                    </div>
                  )}

                  {/* Warnings */}
                  {leaveDays > remainingDays && selectedLeaveType?.isPaid && (
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

                  {leaveDays > 5 && leaveUnit === 'full_day' && (
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
                    {isSubmitting ? '申請中...' : '申請'}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      (leaveDays > remainingDays && selectedLeaveType?.isPaid) ||
                      (selectedLeaveType?.requireAttachment && attachments.length === 0)
                    }
                  >
                    申請を確認
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave History Dialog */}
      <LeaveHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        userId={currentUserId}
      />
    </>
  );
}
