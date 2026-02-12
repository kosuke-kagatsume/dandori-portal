'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useScheduledChangesStore } from '@/lib/store/scheduled-changes-store';
import { useUserStore } from '@/lib/store/user-store';
import { toast } from 'sonner';
import { UserPlus, ArrowRightLeft, UserX, ShieldCheck } from 'lucide-react';

interface CreateScheduledChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormType = 'hire' | 'transfer' | 'retirement';

export function CreateScheduledChangeDialog({
  open,
  onOpenChange,
}: CreateScheduledChangeDialogProps) {
  const [activeTab, setActiveTab] = useState<FormType>('hire');
  const { scheduleChange } = useScheduledChangesStore();
  const currentUser = useUserStore((state) => state.currentUser);
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
      requiresApproval: false,
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
      requiresApproval: false,
    },
  });

  // 退職予約フォーム
  const retirementForm = useForm({
    defaultValues: {
      userId: '',
      retirementReason: 'voluntary' as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other',
      notes: '',
      effectiveDate: '',
      requiresApproval: false,
    },
  });

  // 入社予約の送信
  const handleHireSubmit = hireForm.handleSubmit(async (data) => {
    if (!currentUser) {
      toast.error('ユーザー情報が取得できませんでした');
      return;
    }

    const result = await scheduleChange({
      type: 'hire',
      effectiveDate: data.effectiveDate,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      requiresApproval: data.requiresApproval,
      details: {
        name: data.name,
        email: data.email,
        department: data.department,
        position: data.position,
        role: data.role,
        employeeNumber: data.employeeNumber || undefined,
      },
    });

    if (result) {
      const message = data.requiresApproval
        ? '入社予約を作成しました（承認待ち）'
        : '入社予約を作成しました';
      toast.success(message);
      hireForm.reset();
      onOpenChange(false);
    } else {
      toast.error('入社予約の作成に失敗しました');
    }
  });

  // 異動予約の送信
  const handleTransferSubmit = transferForm.handleSubmit(async (data) => {
    if (!currentUser) {
      toast.error('ユーザー情報が取得できませんでした');
      return;
    }

    const user = users.find((u) => u.id === data.userId);
    if (!user) {
      toast.error('対象ユーザーが見つかりませんでした');
      return;
    }

    const result = await scheduleChange({
      type: 'transfer',
      userId: data.userId,
      userName: user.name,
      effectiveDate: data.effectiveDate,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      requiresApproval: data.requiresApproval,
      details: {
        currentDepartment: user.department ?? '',
        newDepartment: data.newDepartment,
        currentPosition: user.position ?? '',
        newPosition: data.newPosition,
        reason: data.reason || undefined,
      },
    });

    if (result) {
      const message = data.requiresApproval
        ? '異動予約を作成しました（承認待ち）'
        : '異動予約を作成しました';
      toast.success(message);
      transferForm.reset();
      onOpenChange(false);
    } else {
      toast.error('異動予約の作成に失敗しました');
    }
  });

  // 退職予約の送信
  const handleRetirementSubmit = retirementForm.handleSubmit(async (data) => {
    if (!currentUser) {
      toast.error('ユーザー情報が取得できませんでした');
      return;
    }

    const user = users.find((u) => u.id === data.userId);
    if (!user) {
      toast.error('対象ユーザーが見つかりませんでした');
      return;
    }

    const result = await scheduleChange({
      type: 'retirement',
      userId: data.userId,
      userName: user.name,
      effectiveDate: data.effectiveDate,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      requiresApproval: data.requiresApproval,
      details: {
        retirementReason: data.retirementReason,
        notes: data.notes || undefined,
      },
    });

    if (result) {
      const message = data.requiresApproval
        ? '退職予約を作成しました（承認待ち）'
        : '退職予約を作成しました';
      toast.success(message);
      retirementForm.reset();
      onOpenChange(false);
    } else {
      toast.error('退職予約の作成に失敗しました');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規予約作成</DialogTitle>
          <DialogDescription>
            入社・異動・退職の予約を作成します
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FormType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hire">
              <UserPlus className="h-4 w-4 mr-2" />
              入社
            </TabsTrigger>
            <TabsTrigger value="transfer">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              異動
            </TabsTrigger>
            <TabsTrigger value="retirement">
              <UserX className="h-4 w-4 mr-2" />
              退職
            </TabsTrigger>
          </TabsList>

          {/* 入社予約フォーム */}
          <TabsContent value="hire" className="space-y-4">
            <form onSubmit={handleHireSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hire-name">
                    氏名 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hire-name"
                    {...hireForm.register('name', { required: true })}
                    placeholder="山田太郎"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire-email">
                    メールアドレス <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hire-email"
                    type="email"
                    {...hireForm.register('email', { required: true })}
                    placeholder="yamada@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hire-department">
                    部署 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hire-department"
                    {...hireForm.register('department', { required: true })}
                    placeholder="営業部"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire-position">
                    役職 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hire-position"
                    {...hireForm.register('position', { required: true })}
                    placeholder="営業担当"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hire-role">
                    権限 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => hireForm.setValue('role', value as 'employee' | 'manager' | 'hr' | 'admin')}
                    defaultValue="employee"
                  >
                    <SelectTrigger id="hire-role">
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
                  <Label htmlFor="hire-employeeNumber">社員番号</Label>
                  <Input
                    id="hire-employeeNumber"
                    {...hireForm.register('employeeNumber')}
                    placeholder="EMP-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire-effectiveDate">
                  有効日 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hire-effectiveDate"
                  type="date"
                  {...hireForm.register('effectiveDate', { required: true })}
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                <Checkbox
                  id="hire-requiresApproval"
                  checked={hireForm.watch('requiresApproval')}
                  onCheckedChange={(checked) => hireForm.setValue('requiresApproval', checked as boolean)}
                />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="hire-requiresApproval" className="text-sm font-normal cursor-pointer">
                    承認フローを必要とする（上司の承認が必要になります）
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="submit">予約を作成</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* 異動予約フォーム */}
          <TabsContent value="transfer" className="space-y-4">
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transfer-userId">
                  対象ユーザー <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => transferForm.setValue('userId', value)}
                >
                  <SelectTrigger id="transfer-userId">
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
                  <Label htmlFor="transfer-newDepartment">
                    新部署 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="transfer-newDepartment"
                    {...transferForm.register('newDepartment', { required: true })}
                    placeholder="営業部"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-newPosition">
                    新役職 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="transfer-newPosition"
                    {...transferForm.register('newPosition', { required: true })}
                    placeholder="マネージャー"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-reason">異動理由</Label>
                <Textarea
                  id="transfer-reason"
                  {...transferForm.register('reason')}
                  placeholder="組織改編に伴う異動"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-effectiveDate">
                  有効日 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transfer-effectiveDate"
                  type="date"
                  {...transferForm.register('effectiveDate', { required: true })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="submit">予約を作成</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* 退職予約フォーム */}
          <TabsContent value="retirement" className="space-y-4">
            <form onSubmit={handleRetirementSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retirement-userId">
                  対象ユーザー <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => retirementForm.setValue('userId', value)}
                >
                  <SelectTrigger id="retirement-userId">
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
                <Label htmlFor="retirement-reason">
                  退職理由 <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => retirementForm.setValue('retirementReason', value as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other')}
                  defaultValue="voluntary"
                >
                  <SelectTrigger id="retirement-reason">
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
                <Label htmlFor="retirement-notes">備考</Label>
                <Textarea
                  id="retirement-notes"
                  {...retirementForm.register('notes')}
                  placeholder="退職に関する補足情報"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retirement-effectiveDate">
                  有効日（退職日） <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="retirement-effectiveDate"
                  type="date"
                  {...retirementForm.register('effectiveDate', { required: true })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="submit">予約を作成</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
