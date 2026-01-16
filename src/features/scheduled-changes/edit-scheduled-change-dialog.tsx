'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useScheduledChangesStore,
  type ScheduledChange,
  type HireDetails,
  type TransferDetails,
  type RetirementDetails,
} from '@/lib/store/scheduled-changes-store';
import { useUserStore } from '@/lib/store/user-store';
import { toast } from 'sonner';

interface EditScheduledChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: ScheduledChange | null;
}

export function EditScheduledChangeDialog({
  open,
  onOpenChange,
  change,
}: EditScheduledChangeDialogProps) {
  const { updateScheduledChange } = useScheduledChangesStore();
  const users = useUserStore((state) => state.users);

  // 入社予約フォーム
  const hireForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      department: '',
      position: '',
      role: 'employee' as 'employee' | 'manager' | 'hr' | 'admin',
      employeeNumber: '',
      effectiveDate: '',
    },
  });

  // 異動予約フォーム
  const transferForm = useForm({
    defaultValues: {
      userId: '',
      newDepartment: '',
      newPosition: '',
      reason: '',
      effectiveDate: '',
    },
  });

  // 退職予約フォーム
  const retirementForm = useForm({
    defaultValues: {
      userId: '',
      retirementReason: 'voluntary' as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other',
      notes: '',
      effectiveDate: '',
    },
  });

  // フォームに既存データを設定
  useEffect(() => {
    if (change && open) {
      if (change.type === 'hire') {
        const details = change.details as HireDetails;
        hireForm.reset({
          name: details.name,
          email: details.email,
          department: details.department,
          position: details.position,
          role: details.role,
          employeeNumber: details.employeeNumber || '',
          effectiveDate: change.effectiveDate,
        });
      } else if (change.type === 'transfer') {
        const details = change.details as TransferDetails;
        transferForm.reset({
          userId: change.userId || '',
          newDepartment: details.newDepartment,
          newPosition: details.newPosition,
          reason: details.reason || '',
          effectiveDate: change.effectiveDate,
        });
      } else if (change.type === 'retirement') {
        const details = change.details as RetirementDetails;
        retirementForm.reset({
          userId: change.userId || '',
          retirementReason: details.retirementReason,
          notes: details.notes || '',
          effectiveDate: change.effectiveDate,
        });
      }
    }
  }, [change, open, hireForm, transferForm, retirementForm]);

  // 入社予約の更新
  const handleHireSubmit = hireForm.handleSubmit((data) => {
    if (!change) return;

    updateScheduledChange(change.id, {
      effectiveDate: data.effectiveDate,
      details: {
        name: data.name,
        email: data.email,
        department: data.department,
        position: data.position,
        role: data.role,
        employeeNumber: data.employeeNumber || undefined,
      },
    });

    toast.success('入社予約を更新しました');
    onOpenChange(false);
  });

  // 異動予約の更新
  const handleTransferSubmit = transferForm.handleSubmit((data) => {
    if (!change) return;

    const user = users.find((u) => u.id === data.userId);
    if (!user) {
      toast.error('対象ユーザーが見つかりませんでした');
      return;
    }

    updateScheduledChange(change.id, {
      userId: data.userId,
      userName: user.name,
      effectiveDate: data.effectiveDate,
      details: {
        currentDepartment: user.department,
        newDepartment: data.newDepartment,
        currentPosition: user.position,
        newPosition: data.newPosition,
        reason: data.reason || undefined,
      },
    });

    toast.success('異動予約を更新しました');
    onOpenChange(false);
  });

  // 退職予約の更新
  const handleRetirementSubmit = retirementForm.handleSubmit((data) => {
    if (!change) return;

    const user = users.find((u) => u.id === data.userId);
    if (!user) {
      toast.error('対象ユーザーが見つかりませんでした');
      return;
    }

    updateScheduledChange(change.id, {
      userId: data.userId,
      userName: user.name,
      effectiveDate: data.effectiveDate,
      details: {
        retirementReason: data.retirementReason,
        notes: data.notes || undefined,
      },
    });

    toast.success('退職予約を更新しました');
    onOpenChange(false);
  });

  if (!change) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>予約編集</DialogTitle>
          <DialogDescription>
            予約内容を編集します
          </DialogDescription>
        </DialogHeader>

        {/* 入社予約フォーム */}
        {change.type === 'hire' && (
          <form onSubmit={handleHireSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hire-name">
                  氏名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-hire-name"
                  {...hireForm.register('name', { required: true })}
                  placeholder="山田太郎"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hire-email">
                  メールアドレス <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-hire-email"
                  type="email"
                  {...hireForm.register('email', { required: true })}
                  placeholder="yamada@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hire-department">
                  部門 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-hire-department"
                  {...hireForm.register('department', { required: true })}
                  placeholder="営業部"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hire-position">
                  役職 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-hire-position"
                  {...hireForm.register('position', { required: true })}
                  placeholder="営業担当"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hire-role">
                  権限 <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => hireForm.setValue('role', value as 'employee' | 'manager' | 'hr' | 'admin')}
                  defaultValue={hireForm.getValues('role')}
                >
                  <SelectTrigger id="edit-hire-role">
                    <SelectValue placeholder="権限を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">一般社員</SelectItem>
                    <SelectItem value="manager">マネージャー</SelectItem>
                    <SelectItem value="hr">人事担当</SelectItem>
                    <SelectItem value="admin">管理者</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hire-employeeNumber">社員番号</Label>
                <Input
                  id="edit-hire-employeeNumber"
                  {...hireForm.register('employeeNumber')}
                  placeholder="EMP-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-hire-effectiveDate">
                有効日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-hire-effectiveDate"
                type="date"
                {...hireForm.register('effectiveDate', { required: true })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit">更新</Button>
            </DialogFooter>
          </form>
        )}

        {/* 異動予約フォーム */}
        {change.type === 'transfer' && (
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-transfer-userId">
                対象ユーザー <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => transferForm.setValue('userId', value)}
                defaultValue={transferForm.getValues('userId')}
              >
                <SelectTrigger id="edit-transfer-userId">
                  <SelectValue placeholder="ユーザーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => user.status === 'active')
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.department} - {user.position})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-transfer-newDepartment">
                  新部門 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-transfer-newDepartment"
                  {...transferForm.register('newDepartment', { required: true })}
                  placeholder="営業部"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-transfer-newPosition">
                  新役職 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-transfer-newPosition"
                  {...transferForm.register('newPosition', { required: true })}
                  placeholder="マネージャー"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transfer-reason">異動理由</Label>
              <Textarea
                id="edit-transfer-reason"
                {...transferForm.register('reason')}
                placeholder="組織改編に伴う異動"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transfer-effectiveDate">
                有効日 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-transfer-effectiveDate"
                type="date"
                {...transferForm.register('effectiveDate', { required: true })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit">更新</Button>
            </DialogFooter>
          </form>
        )}

        {/* 退職予約フォーム */}
        {change.type === 'retirement' && (
          <form onSubmit={handleRetirementSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-retirement-userId">
                対象ユーザー <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => retirementForm.setValue('userId', value)}
                defaultValue={retirementForm.getValues('userId')}
              >
                <SelectTrigger id="edit-retirement-userId">
                  <SelectValue placeholder="ユーザーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => user.status === 'active')
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.department} - {user.position})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-retirement-reason">
                退職理由 <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => retirementForm.setValue('retirementReason', value as 'voluntary' | 'company' | 'contract_end' | 'retirement' | 'other')}
                defaultValue={retirementForm.getValues('retirementReason')}
              >
                <SelectTrigger id="edit-retirement-reason">
                  <SelectValue placeholder="退職理由を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voluntary">自己都合退職</SelectItem>
                  <SelectItem value="company">会社都合退職</SelectItem>
                  <SelectItem value="contract_end">契約期間満了</SelectItem>
                  <SelectItem value="retirement_age">定年退職</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-retirement-notes">備考</Label>
              <Textarea
                id="edit-retirement-notes"
                {...retirementForm.register('notes')}
                placeholder="退職に関する補足情報"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-retirement-effectiveDate">
                有効日（退職日） <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-retirement-effectiveDate"
                type="date"
                {...retirementForm.register('effectiveDate', { required: true })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit">更新</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
