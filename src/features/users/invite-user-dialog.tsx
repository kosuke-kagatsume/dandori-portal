'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROLE_LABELS } from '@/lib/rbac';
import { useMasterDataStore } from '@/lib/store/master-data-store';
import type { UserRole } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Mail, Send, Loader2, CheckCircle, AlertCircle, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const inviteSchema = z.object({
  name: z.string().min(1, '氏名を入力してください'),
  nameKana: z.string().optional(),
  employeeNumber: z.string().optional(),
  email: z.string().email('有効なメールアドレスを入力してください'),
  role: z.string().min(1, '役職権限を選択してください'),
  department: z.string().min(1, '部署を選択してください'),
  position: z.string().min(1, '役職を選択してください'),
  employmentType: z.string().min(1, '雇用形態を選択してください'),
  hireDate: z.date({ required_error: '入社日を選択してください' }),
  phone: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
  tenantName?: string;
  onInviteSuccess?: (user: { id: string; email: string; name: string; department: string; position: string }) => void;
}

// 役職権限オプション (UserRole型を使用)
const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'employee', label: ROLE_LABELS.employee },
  { value: 'manager', label: ROLE_LABELS.manager },
  { value: 'executive', label: ROLE_LABELS.executive },
  { value: 'hr', label: ROLE_LABELS.hr },
  { value: 'admin', label: ROLE_LABELS.admin },
];

type InviteStatus = 'idle' | 'sending' | 'success' | 'error';

export function InviteUserDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  onInviteSuccess
}: InviteUserDialogProps) {
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // マスタデータから選択肢を取得
  const { getActiveDepartments, getActivePositions, getActiveEmploymentTypes, fetchAll, departments: allDepartments, setTenantId } = useMasterDataStore();

  // ダイアログが開かれたらマスタデータをフェッチ
  useEffect(() => {
    if (open) {
      if (tenantId) {
        setTenantId(tenantId);
      }
      // データが空の場合のみフェッチ
      if (allDepartments.length === 0) {
        fetchAll();
      }
    }
  }, [open, tenantId, setTenantId, fetchAll, allDepartments.length]);

  const departments = getActiveDepartments();
  const positions = getActivePositions();
  const employmentTypes = getActiveEmploymentTypes();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      nameKana: '',
      employeeNumber: '',
      email: '',
      role: 'employee',
      department: '',
      position: '',
      employmentType: '',
      hireDate: new Date(),
      phone: '',
    },
  });

  const hireDate = watch('hireDate');

  const handleFormSubmit = async (data: InviteFormData) => {
    setInviteStatus('sending');
    setErrorMessage('');

    try {
      // 日付をローカルタイムゾーンで YYYY-MM-DD 形式に変換（UTCへの変換を回避）
      const hireDateStr = format(data.hireDate, 'yyyy-MM-dd');

      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          nameKana: data.nameKana,
          employeeNumber: data.employeeNumber,
          role: data.role,
          department: data.department,
          position: data.position,
          employmentType: data.employmentType,
          hireDate: hireDateStr,
          phone: data.phone,
          tenantId,
          tenantName,
          redirectUrl: `${window.location.origin}/auth/callback`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '招待メールの送信に失敗しました');
      }

      setInviteStatus('success');
      toast.success(`${data.email}に招待メールを送信しました`);

      // 成功コールバック
      if (onInviteSuccess && result.user) {
        onInviteSuccess({
          ...result.user,
          department: data.department,
          position: data.position,
        });
      }

      // 2秒後にダイアログを閉じる
      setTimeout(() => {
        reset();
        setInviteStatus('idle');
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      setInviteStatus('error');
      const message = error instanceof Error ? error.message : '招待メールの送信に失敗しました';
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleClose = () => {
    if (inviteStatus !== 'sending') {
      reset();
      setInviteStatus('idle');
      setErrorMessage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        {inviteStatus === 'success' ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">招待メールを送信しました</h3>
            <p className="text-sm text-muted-foreground">
              ユーザーがメールのリンクをクリックすると、パスワードを設定してログインできます。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                メンバーを招待
              </DialogTitle>
              <DialogDescription>
                招待メールを送信してメンバーを追加します。
                入力した情報はユーザー登録に使用されます。
              </DialogDescription>
            </DialogHeader>

            {inviteStatus === 'error' && errorMessage && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              {/* 基本情報 */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  氏名 *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    placeholder="山田太郎"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                    disabled={inviteStatus === 'sending'}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nameKana" className="text-right">
                  フリガナ
                </Label>
                <div className="col-span-3">
                  <Input
                    id="nameKana"
                    placeholder="ヤマダタロウ"
                    {...register('nameKana')}
                    disabled={inviteStatus === 'sending'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employeeNumber" className="text-right">
                  社員番号
                </Label>
                <div className="col-span-3">
                  <Input
                    id="employeeNumber"
                    placeholder="EMP-001"
                    {...register('employeeNumber')}
                    disabled={inviteStatus === 'sending'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  メール *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                    disabled={inviteStatus === 'sending'}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  電話番号
                </Label>
                <div className="col-span-3">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="090-1234-5678"
                    {...register('phone')}
                    disabled={inviteStatus === 'sending'}
                  />
                </div>
              </div>

              {/* 組織情報 */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium text-muted-foreground mb-4">組織情報</p>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  部署 *
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) => setValue('department', value)}
                    disabled={inviteStatus === 'sending'}
                  >
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="部署を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.parentId ? `　${dept.name}` : dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">
                  役職 *
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) => setValue('position', value)}
                    disabled={inviteStatus === 'sending'}
                  >
                    <SelectTrigger className={errors.position ? 'border-red-500' : ''}>
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
                  {errors.position && (
                    <p className="text-sm text-red-500 mt-1">{errors.position.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  権限 *
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) => setValue('role', value)}
                    defaultValue="employee"
                    disabled={inviteStatus === 'sending'}
                  >
                    <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="権限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    システム上のアクセス権限を設定します
                  </p>
                  {errors.role && (
                    <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
                  )}
                </div>
              </div>

              {/* 雇用情報 */}
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium text-muted-foreground mb-4">雇用情報</p>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employmentType" className="text-right">
                  雇用形態 *
                </Label>
                <div className="col-span-3">
                  <Select
                    onValueChange={(value) => setValue('employmentType', value)}
                    disabled={inviteStatus === 'sending'}
                  >
                    <SelectTrigger className={errors.employmentType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="雇用形態を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.employmentType && (
                    <p className="text-sm text-red-500 mt-1">{errors.employmentType.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">入社日 *</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !hireDate && "text-muted-foreground",
                          errors.hireDate && "border-red-500"
                        )}
                        disabled={inviteStatus === 'sending'}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {hireDate ? (
                          format(hireDate, "PPP", { locale: ja })
                        ) : (
                          <span>入社日を選択</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={hireDate}
                        onSelect={(date) => setValue('hireDate', date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.hireDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.hireDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>招待の流れ:</strong>
                <br />
                1. 招待メールが送信されます
                <br />
                2. ユーザーがメールのリンクをクリック
                <br />
                3. パスワードを設定してログイン
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={inviteStatus === 'sending'}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={inviteStatus === 'sending'}>
                {inviteStatus === 'sending' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    招待メールを送信
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
