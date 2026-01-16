'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useSaaSStore } from '@/lib/store/saas-store';
import { useUserStore } from '@/lib/store/user-store';
import { type LicenseAssignment } from '@/types/saas';

const assignmentSchema = z.object({
  userId: z.string().min(1, 'ユーザーは必須です'),
  planId: z.string().min(1, 'プランは必須です'),
  userEmail: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  assignment?: LicenseAssignment;
}

export function AssignmentFormDialog({
  open,
  onClose,
  serviceId,
  serviceName,
  assignment,
}: AssignmentFormDialogProps) {
  const { addAssignment, updateAssignment, getPlansByServiceId } = useSaaSStore();
  const { users } = useUserStore();
  const isEditMode = !!assignment;

  const plans = getPlansByServiceId(serviceId);
  const activeUsers = users.filter((u) => u.status === 'active');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      userId: '',
      planId: '',
      userEmail: '',
      notes: '',
    },
  });

  const userId = watch('userId');
  const planId = watch('planId');

  // 編集モードの場合、初期値を設定
  useEffect(() => {
    if (assignment && open) {
      reset({
        userId: assignment.userId || '',
        planId: assignment.planId,
        userEmail: assignment.userEmail || '',
        notes: assignment.notes || '',
      });
    }
  }, [assignment, open, reset]);

  // ユーザー選択時にメールアドレスを自動入力
  useEffect(() => {
    if (userId) {
      const selectedUser = users.find((u) => u.id === userId);
      if (selectedUser) {
        setValue('userEmail', selectedUser.email);
      }
    }
  }, [userId, users, setValue]);

  // ダイアログを閉じる時にフォームをリセット
  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: AssignmentFormData) => {
    const selectedUser = users.find((u) => u.id === data.userId);
    const selectedPlan = plans.find((p) => p.id === data.planId);

    if (!selectedUser || !selectedPlan) {
      return;
    }

    const assignmentData = {
      serviceId,
      serviceName,
      planId: data.planId,
      planName: selectedPlan.planName,
      userId: data.userId,
      userName: selectedUser.name,
      userEmail: data.userEmail || selectedUser.email,
      status: 'active' as const,
      assignedDate: new Date().toISOString().split('T')[0],
      notes: data.notes,
    };

    if (isEditMode && assignment) {
      updateAssignment(assignment.id, assignmentData);
    } else {
      addAssignment(assignmentData);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'ライセンス割り当て編集' : 'ライセンス割り当て'}
          </DialogTitle>
          <DialogDescription>
            {serviceName}のライセンスをユーザーに割り当てます
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ユーザー選択 */}
          <div className="space-y-2">
            <Label htmlFor="userId">ユーザー *</Label>
            <Select value={userId} onValueChange={(value) => setValue('userId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="ユーザーを選択" />
              </SelectTrigger>
              <SelectContent>
                {activeUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-sm text-destructive">{errors.userId.message}</p>
            )}
          </div>

          {/* プラン選択 */}
          <div className="space-y-2">
            <Label htmlFor="planId">プラン *</Label>
            <Select value={planId} onValueChange={(value) => setValue('planId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="プランを選択" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.planName}
                    {plan.pricePerUser && ` - ¥${plan.pricePerUser.toLocaleString()}/月`}
                    {plan.isActive && ' (現在のプラン)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planId && (
              <p className="text-sm text-destructive">{errors.planId.message}</p>
            )}
          </div>

          {/* アカウントメールアドレス */}
          <div className="space-y-2">
            <Label htmlFor="userEmail">アカウントメールアドレス</Label>
            <Input
              id="userEmail"
              type="email"
              {...register('userEmail')}
              placeholder="user@example.com"
            />
            <p className="text-xs text-muted-foreground">
              SaaSサービスで使用するメールアドレス（システムのメールアドレスと異なる場合のみ入力）
            </p>
            {errors.userEmail && (
              <p className="text-sm text-destructive">{errors.userEmail.message}</p>
            )}
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="notes">メモ</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="メモを入力してください"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit">
              {isEditMode ? '更新' : '割り当て'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
