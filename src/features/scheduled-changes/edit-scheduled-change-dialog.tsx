'use client';

import { useEffect, useState } from 'react';
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
import { UserCombobox } from './user-combobox';

interface EditScheduledChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: ScheduledChange | null;
}

interface MasterDepartment {
  id: string;
  name: string;
}

interface MasterPosition {
  id: string;
  name: string;
}

interface MasterEmploymentType {
  id: string;
  name: string;
}

interface MasterWorkRule {
  id: string;
  name: string;
}

export function EditScheduledChangeDialog({
  open,
  onOpenChange,
  change,
}: EditScheduledChangeDialogProps) {
  const { updateScheduledChange } = useScheduledChangesStore();
  const users = useUserStore((state) => state.users);

  // マスタデータ
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [positions, setPositions] = useState<MasterPosition[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<MasterEmploymentType[]>([]);
  const [workRules, setWorkRules] = useState<MasterWorkRule[]>([]);

  // マスタデータ取得
  useEffect(() => {
    if (!open) return;
    const fetchMasterData = async () => {
      try {
        const [deptRes, posRes, etRes, wrRes] = await Promise.all([
          fetch('/api/master-data/departments'),
          fetch('/api/master-data/positions'),
          fetch('/api/master-data/employment-types'),
          fetch('/api/attendance-master/work-rules?activeOnly=true'),
        ]);
        const [deptData, posData, etData, wrData] = await Promise.all([
          deptRes.json(),
          posRes.json(),
          etRes.json(),
          wrRes.json(),
        ]);
        if (deptData.success !== false) setDepartments(deptData.data || []);
        if (posData.success !== false) setPositions(posData.data || []);
        if (etData.success !== false) setEmploymentTypes(etData.data || []);
        if (wrData.success !== false) setWorkRules(wrData.data || []);
      } catch (e) {
        console.error('Failed to fetch master data:', e);
      }
    };
    fetchMasterData();
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
          newDepartment: details.newDepartment || '変更なし',
          newPosition: details.newPosition || '変更なし',
          newEmploymentType: details.newEmploymentType || '変更なし',
          newWorkRuleId: details.newWorkRuleId || '変更なし',
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
  const handleHireSubmit = hireForm.handleSubmit(async (data) => {
    if (!change) return;

    const success = await updateScheduledChange(change.id, {
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

    if (success) {
      toast.success('入社予約を更新しました');
      onOpenChange(false);
    } else {
      toast.error('入社予約の更新に失敗しました');
    }
  });

  // 異動予約の更新
  const handleTransferSubmit = transferForm.handleSubmit(async (data) => {
    if (!change) return;

    const user = users.find((u) => u.id === data.userId);
    if (!user) {
      toast.error('対象ユーザーが見つかりませんでした');
      return;
    }

    const currentWorkRule = workRules.find((r) => r.id === (user as Record<string, unknown>).workRuleId);

    const success = await updateScheduledChange(change.id, {
      userId: data.userId,
      userName: user.name,
      effectiveDate: data.effectiveDate,
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

    if (success) {
      toast.success('異動予約を更新しました');
      onOpenChange(false);
    } else {
      toast.error('異動予約の更新に失敗しました');
    }
  });

  // 退職予約の更新
  const handleRetirementSubmit = retirementForm.handleSubmit(async (data) => {
    if (!change) return;

    const user = users.find((u) => u.id === data.userId);
    if (!user) {
      toast.error('対象ユーザーが見つかりませんでした');
      return;
    }

    const success = await updateScheduledChange(change.id, {
      userId: data.userId,
      userName: user.name,
      effectiveDate: data.effectiveDate,
      details: {
        retirementReason: data.retirementReason,
        notes: data.notes || undefined,
      },
    });

    if (success) {
      toast.success('退職予約を更新しました');
      onOpenChange(false);
    } else {
      toast.error('退職予約の更新に失敗しました');
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
                  部署 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={hireForm.watch('department')}
                  onValueChange={(value) => hireForm.setValue('department', value)}
                >
                  <SelectTrigger id="edit-hire-department">
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
                <Label htmlFor="edit-hire-position">
                  役職 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={hireForm.watch('position')}
                  onValueChange={(value) => hireForm.setValue('position', value)}
                >
                  <SelectTrigger id="edit-hire-position">
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
                <Label htmlFor="edit-hire-role">
                  権限 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={hireForm.watch('role')}
                  onValueChange={(value) => hireForm.setValue('role', value as 'employee' | 'manager' | 'hr' | 'admin')}
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
                入社日 <span className="text-red-500">*</span>
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
                <Label htmlFor="edit-transfer-newDepartment">
                  新部署 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={transferForm.watch('newDepartment')}
                  onValueChange={(value) => transferForm.setValue('newDepartment', value)}
                >
                  <SelectTrigger id="edit-transfer-newDepartment">
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
                <Label htmlFor="edit-transfer-newPosition">
                  新役職 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={transferForm.watch('newPosition')}
                  onValueChange={(value) => transferForm.setValue('newPosition', value)}
                >
                  <SelectTrigger id="edit-transfer-newPosition">
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
                <Label htmlFor="edit-transfer-newEmploymentType">新雇用形態</Label>
                <Select
                  value={transferForm.watch('newEmploymentType')}
                  onValueChange={(value) => transferForm.setValue('newEmploymentType', value)}
                >
                  <SelectTrigger id="edit-transfer-newEmploymentType">
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
                <Label htmlFor="edit-transfer-newWorkRuleId">新就業ルール</Label>
                <Select
                  value={transferForm.watch('newWorkRuleId')}
                  onValueChange={(value) => transferForm.setValue('newWorkRuleId', value)}
                >
                  <SelectTrigger id="edit-transfer-newWorkRuleId">
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
                異動日 <span className="text-red-500">*</span>
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
              <Label htmlFor="edit-retirement-reason">
                退職理由 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={retirementForm.watch('retirementReason')}
                onValueChange={(value) => retirementForm.setValue('retirementReason', value as 'voluntary' | 'company' | 'contract_end' | 'retirement_age' | 'other')}
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
                退職日 <span className="text-red-500">*</span>
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
