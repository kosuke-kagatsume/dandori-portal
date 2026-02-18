'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROLE_LABELS } from '@/lib/rbac';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  hireDate: z.date(),
  status: z.enum(['active', 'inactive', 'suspended', 'retired']),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  onSubmit: (data: UserFormData) => Promise<void>;
}

const departments = [
  '営業部',
  '開発部',
  '人事部',
  '総務部',
  '経理部',
  'マーケティング部',
];

const positions = [
  'エンジニア',
  'マネージャー',
  'アナリスト',
  'アシスタント',
  'ディレクター',
  'スペシャリスト',
];

// 役職オプション (UserRole型を使用)
const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'employee', label: ROLE_LABELS.employee },
  { value: 'manager', label: ROLE_LABELS.manager },
  { value: 'hr', label: ROLE_LABELS.hr },
  { value: 'admin', label: ROLE_LABELS.admin },
];

export function UserFormDialog({ open, onOpenChange, user, onSubmit }: UserFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      position: user?.position || '',
      hireDate: user?.hireDate ? new Date(user.hireDate) : new Date(),
      status: user?.status || 'active',
      roles: user?.roles || ['employee'],
    },
  });

  const hireDate = watch('hireDate');
  const watchDepartment = watch('department');
  const watchPosition = watch('position');
  const watchStatus = watch('status');
  const watchRoles = watch('roles');

  // ユーザーが変わったらフォームをリセット（入社日が今日に上書きされるバグ修正）
  useEffect(() => {
    if (open) {
      reset({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || '',
        position: user?.position || '',
        hireDate: user?.hireDate ? new Date(user.hireDate) : new Date(),
        status: user?.status || 'active',
        roles: user?.roles || ['employee'],
      });
    }
  }, [user, open, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success(user ? 'User updated successfully' : 'User created successfully');
      reset();
      onOpenChange(false);
    } catch {
      toast.error(user ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {user ? `${user.name} - 編集` : 'ユーザー作成'}
            </DialogTitle>
            <DialogDescription>
              {user ? 'ユーザー情報を編集します' : '新しいユーザーを作成します'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                氏名 *
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
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
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
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
              <Input
                id="phone"
                {...register('phone')}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                部署 *
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => setValue('department', value)}
                  value={watchDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="部署を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
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
                  value={watchPosition}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="役職を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
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
              <Label className="text-right">入社日 *</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !hireDate && "text-muted-foreground"
                      )}
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                ステータス
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'suspended' | 'retired')}
                  value={watchStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">在籍中</SelectItem>
                    <SelectItem value="inactive">入社予定</SelectItem>
                    <SelectItem value="suspended">休職中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                役職権限 *
              </Label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) => setValue('roles', [value])}
                  value={watchRoles?.[0] || 'employee'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="役職権限を選択" />
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
                  ユーザーの役職と権限レベルを設定します
                </p>
                {errors.roles && (
                  <p className="text-sm text-red-500 mt-1">{errors.roles.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : (user ? '更新' : '作成')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}