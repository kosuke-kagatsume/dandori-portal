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
import { Switch } from '@/components/ui/switch';
import { useSaaSStore } from '@/lib/store/saas-store';
import {
  categoryLabels,
  licenseTypeLabels,
  type SaaSCategory,
  type LicenseType,
  type SaaSService,
} from '@/types/saas';

const serviceSchema = z.object({
  name: z.string().min(1, 'サービス名は必須です'),
  vendor: z.string().min(1, 'ベンダー名は必須です'),
  website: z.string().url('正しいURLを入力してください'),
  logo: z.string().url('正しいURLを入力してください').optional().or(z.literal('')),
  description: z.string().optional(),
  category: z.enum([
    'communication',
    'productivity',
    'development',
    'design',
    'hr',
    'finance',
    'marketing',
    'sales',
    'security',
    'storage',
    'other',
  ] as const),
  licenseType: z.enum(['user-based', 'fixed', 'usage-based'] as const),
  ssoEnabled: z.boolean(),
  mfaEnabled: z.boolean(),
  adminEmail: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  supportUrl: z.string().url('正しいURLを入力してください').optional().or(z.literal('')),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  autoRenew: z.boolean(),
  isActive: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  service?: SaaSService;
}

export function ServiceFormDialog({ open, onClose, service }: ServiceFormDialogProps) {
  const { addService, updateService } = useSaaSStore();
  const isEditMode = !!service;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      vendor: '',
      website: '',
      logo: '',
      description: '',
      category: 'other',
      licenseType: 'user-based',
      ssoEnabled: false,
      mfaEnabled: false,
      adminEmail: '',
      supportUrl: '',
      contractStartDate: '',
      contractEndDate: '',
      autoRenew: false,
      isActive: true,
    },
  });

  // フォームの値を監視
  const category = watch('category');
  const licenseType = watch('licenseType');
  const ssoEnabled = watch('ssoEnabled');
  const mfaEnabled = watch('mfaEnabled');
  const autoRenew = watch('autoRenew');
  const isActive = watch('isActive');

  // 編集モードの場合、初期値を設定
  useEffect(() => {
    if (service && open) {
      reset({
        name: service.name,
        vendor: service.vendor,
        website: service.website,
        logo: service.logo || '',
        description: service.description || '',
        category: service.category,
        licenseType: service.licenseType,
        ssoEnabled: service.ssoEnabled,
        mfaEnabled: service.mfaEnabled,
        adminEmail: service.adminEmail || '',
        supportUrl: service.supportUrl || '',
        contractStartDate: service.contractStartDate || '',
        contractEndDate: service.contractEndDate || '',
        autoRenew: service.autoRenew,
        isActive: service.isActive,
      });
    }
  }, [service, open, reset]);

  // ダイアログを閉じる時にフォームをリセット
  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: ServiceFormData) => {
    if (isEditMode && service) {
      updateService(service.id, {
        ...data,
        logo: data.logo || undefined,
        description: data.description || undefined,
        adminEmail: data.adminEmail || undefined,
        supportUrl: data.supportUrl || undefined,
        contractStartDate: data.contractStartDate || undefined,
        contractEndDate: data.contractEndDate || undefined,
      });
    } else {
      addService({
        ...data,
        logo: data.logo || undefined,
        description: data.description || undefined,
        adminEmail: data.adminEmail || undefined,
        supportUrl: data.supportUrl || undefined,
        contractStartDate: data.contractStartDate || undefined,
        contractEndDate: data.contractEndDate || undefined,
      });
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'SaaSサービス編集' : '新規SaaSサービス登録'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'サービス情報を編集してください'
              : '新しいSaaSサービスの情報を入力してください'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">基本情報</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">サービス名 *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Slack"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">ベンダー名 *</Label>
                <Input
                  id="vendor"
                  {...register('vendor')}
                  placeholder="Slack Technologies"
                />
                {errors.vendor && (
                  <p className="text-sm text-destructive">{errors.vendor.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">公式サイト *</Label>
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://slack.com"
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">ロゴURL</Label>
              <Input
                id="logo"
                type="url"
                {...register('logo')}
                placeholder="https://example.com/logo.png"
              />
              {errors.logo && (
                <p className="text-sm text-destructive">{errors.logo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="サービスの説明を入力してください"
                rows={3}
              />
            </div>
          </div>

          {/* カテゴリとライセンス */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">カテゴリとライセンス</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ *</Label>
                <Select value={category} onValueChange={(value) => setValue('category', value as SaaSCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseType">ライセンスタイプ *</Label>
                <Select value={licenseType} onValueChange={(value) => setValue('licenseType', value as LicenseType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(licenseTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* セキュリティ設定 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">セキュリティ設定</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="ssoEnabled">SSO対応</Label>
              <Switch
                id="ssoEnabled"
                checked={ssoEnabled}
                onCheckedChange={(checked) => setValue('ssoEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="mfaEnabled">MFA対応</Label>
              <Switch
                id="mfaEnabled"
                checked={mfaEnabled}
                onCheckedChange={(checked) => setValue('mfaEnabled', checked)}
              />
            </div>
          </div>

          {/* 管理情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">管理情報</h3>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">管理者メールアドレス</Label>
              <Input
                id="adminEmail"
                type="email"
                {...register('adminEmail')}
                placeholder="admin@example.com"
              />
              {errors.adminEmail && (
                <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportUrl">サポートURL</Label>
              <Input
                id="supportUrl"
                type="url"
                {...register('supportUrl')}
                placeholder="https://support.example.com"
              />
              {errors.supportUrl && (
                <p className="text-sm text-destructive">{errors.supportUrl.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractStartDate">契約開始日</Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  {...register('contractStartDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractEndDate">契約終了日</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  {...register('contractEndDate')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoRenew">自動更新</Label>
              <Switch
                id="autoRenew"
                checked={autoRenew}
                onCheckedChange={(checked) => setValue('autoRenew', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">アクティブ</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit">
              {isEditMode ? '更新' : '登録'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
