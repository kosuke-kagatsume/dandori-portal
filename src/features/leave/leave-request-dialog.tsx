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
  const [selectedType, setSelectedType] = useState<string>('annual');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success('有給申請を提出しました');
      reset();
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
            <DialogTitle>有給申請</DialogTitle>
            <DialogDescription>
              新しい有給申請を作成します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (leaveDays > remainingDays && selectedLeaveType?.daysRequired)}
            >
              {isSubmitting ? '申請中...' : '申請する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}