'use client';

import { useState, useEffect } from 'react';
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
import { UserCombobox } from './user-combobox';
import { fetchAllMasterData } from '@/lib/api/master-data';
import type { MasterDepartment, MasterPosition, MasterEmploymentType, MasterWorkRule } from '@/types/master-data';

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

  // マスタデータ
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [positions, setPositions] = useState<MasterPosition[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<MasterEmploymentType[]>([]);
  const [workRules, setWorkRules] = useState<MasterWorkRule[]>([]);

  // マスタデータ取得
  useEffect(() => {
    if (!open) return;
    fetchAllMasterData()
      .then(({ departments, positions, employmentTypes, workRules }) => {
        setDepartments(departments);
        setPositions(positions);
        setEmploymentTypes(employmentTypes);
        setWorkRules(workRules);
      })
      .catch((e) => console.error('Failed to fetch master data:', e));
  }, [open]);

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
      newDepartment: '変更なし',
      newPosition: '変更なし',
      newEmploymentType: '変更なし',
      newWorkRuleId: '変更なし',
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

    // 現在の就業ルール名を取得
    const currentWorkRule = workRules.find((r) => r.id === (user as Record<string, unknown>).workRuleId);

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
        newEmploymentType: data.newEmploymentType,
        newWorkRuleId: data.newWorkRuleId,
        currentEmploymentType: (user as Record<string, unknown>).employmentType as string ?? '',
        currentWorkRuleName: currentWorkRule?.name ?? '',
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

  // ユーザーリストをCombobox用に変換
  const activeUsers = users
    .filter((user) => user.status === 'active')
    .map((user) => ({
      id: user.id,
      name: user.name,
      department: user.department ?? null,
      position: user.position ?? null,
    }));

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
                  <Select
                    onValueChange={(value) => hireForm.setValue('department', value)}
                  >
                    <SelectTrigger id="hire-department">
                      <SelectValue placeholder="部署を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire-position">
                    役職 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => hireForm.setValue('position', value)}
                  >
                    <SelectTrigger id="hire-position">
                      <SelectValue placeholder="役職を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.name}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  入社日 <span className="text-red-500">*</span>
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
                <Label>
                  対象ユーザー <span className="text-red-500">*</span>
                </Label>
                <UserCombobox
                  users={activeUsers}
                  value={transferForm.watch('userId')}
                  onValueChange={(value) => transferForm.setValue('userId', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-newDepartment">
                    新部署 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={transferForm.watch('newDepartment')}
                    onValueChange={(value) => transferForm.setValue('newDepartment', value)}
                  >
                    <SelectTrigger id="transfer-newDepartment">
                      <SelectValue placeholder="新部署を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="変更なし">変更なし</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-newPosition">
                    新役職 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={transferForm.watch('newPosition')}
                    onValueChange={(value) => transferForm.setValue('newPosition', value)}
                  >
                    <SelectTrigger id="transfer-newPosition">
                      <SelectValue placeholder="新役職を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="変更なし">変更なし</SelectItem>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.name}>
                          {pos.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-newEmploymentType">新雇用形態</Label>
                  <Select
                    value={transferForm.watch('newEmploymentType')}
                    onValueChange={(value) => transferForm.setValue('newEmploymentType', value)}
                  >
                    <SelectTrigger id="transfer-newEmploymentType">
                      <SelectValue placeholder="雇用形態を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="変更なし">変更なし</SelectItem>
                      {employmentTypes.map((et) => (
                        <SelectItem key={et.id} value={et.name}>
                          {et.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer-newWorkRuleId">新就業ルール</Label>
                  <Select
                    value={transferForm.watch('newWorkRuleId')}
                    onValueChange={(value) => transferForm.setValue('newWorkRuleId', value)}
                  >
                    <SelectTrigger id="transfer-newWorkRuleId">
                      <SelectValue placeholder="就業ルールを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="変更なし">変更なし</SelectItem>
                      {workRules.map((rule) => (
                        <SelectItem key={rule.id} value={rule.id}>
                          {rule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  異動日 <span className="text-red-500">*</span>
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
                <Label>
                  対象ユーザー <span className="text-red-500">*</span>
                </Label>
                <UserCombobox
                  users={activeUsers}
                  value={retirementForm.watch('userId')}
                  onValueChange={(value) => retirementForm.setValue('userId', value)}
                />
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
                  退職日 <span className="text-red-500">*</span>
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
