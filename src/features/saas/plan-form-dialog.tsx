'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useSaaSStore } from '@/lib/store/saas-store';
import { type LicensePlan, type BillingCycle, type Currency } from '@/types/saas';

const planSchema = z.object({
  planName: z.string().min(1, 'プラン名は必須です'),
  billingCycle: z.enum(['monthly', 'yearly'] as const),
  pricePerUser: z.string().optional(),
  fixedPrice: z.string().optional(),
  currency: z.enum(['JPY', 'USD'] as const),
  maxUsers: z.string().optional(),
  isActive: z.boolean(),
}).refine(
  (data) => data.pricePerUser || data.fixedPrice,
  {
    message: 'ユーザー単価または固定価格のいずれかは必須です',
    path: ['pricePerUser'],
  }
);

type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormDialogProps {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  plan?: LicensePlan;
}

export function PlanFormDialog({ open, onClose, serviceId, plan }: PlanFormDialogProps) {
  const { addPlan, updatePlan } = useSaaSStore();
  const isEditMode = !!plan;

  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planName: '',
      billingCycle: 'monthly',
      pricePerUser: '',
      fixedPrice: '',
      currency: 'JPY',
      maxUsers: '',
      isActive: false,
    },
  });

  // フォームの値を監視
  const billingCycle = watch('billingCycle');
  const currency = watch('currency');
  const isActive = watch('isActive');

  // 編集モードの場合、初期値を設定
  useEffect(() => {
    if (plan && open) {
      reset({
        planName: plan.planName,
        billingCycle: plan.billingCycle as 'monthly' | 'yearly',
        pricePerUser: plan.pricePerUser?.toString() || '',
        fixedPrice: plan.fixedPrice?.toString() || '',
        currency: plan.currency as 'JPY' | 'USD',
        maxUsers: plan.maxUsers?.toString() || '',
        isActive: plan.isActive,
      });
      setFeatures(plan.features || []);
    }
  }, [plan, open, reset]);

  // ダイアログを閉じる時にフォームをリセット
  const handleClose = () => {
    reset();
    setFeatures([]);
    setFeatureInput('');
    onClose();
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PlanFormData) => {
    const planData = {
      serviceId,
      planName: data.planName,
      billingCycle: data.billingCycle,
      pricePerUser: data.pricePerUser ? parseFloat(data.pricePerUser) : undefined,
      fixedPrice: data.fixedPrice ? parseFloat(data.fixedPrice) : undefined,
      currency: data.currency,
      maxUsers: data.maxUsers ? parseInt(data.maxUsers, 10) : undefined,
      features,
      isActive: data.isActive,
    };

    if (isEditMode && plan) {
      updatePlan(plan.id, planData);
    } else {
      addPlan(planData);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'ライセンスプラン編集' : '新規ライセンスプラン登録'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'プラン情報を編集してください'
              : '新しいライセンスプランの情報を入力してください'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">基本情報</h3>

            <div className="space-y-2">
              <Label htmlFor="planName">プラン名 *</Label>
              <Input
                id="planName"
                {...register('planName')}
                placeholder="Business Plan"
              />
              {errors.planName && (
                <p className="text-sm text-destructive">{errors.planName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCycle">課金サイクル *</Label>
                <Select
                  value={billingCycle}
                  onValueChange={(value) => setValue('billingCycle', value as BillingCycle)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">月額</SelectItem>
                    <SelectItem value="yearly">年額</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">通貨 *</Label>
                <Select
                  value={currency}
                  onValueChange={(value) => setValue('currency', value as Currency)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JPY">日本円 (¥)</SelectItem>
                    <SelectItem value="USD">米ドル ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 料金設定 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">料金設定</h3>
            <p className="text-sm text-muted-foreground">
              ユーザー単価または固定価格のいずれかを入力してください
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerUser">ユーザー単価</Label>
                <Input
                  id="pricePerUser"
                  type="number"
                  step="0.01"
                  {...register('pricePerUser')}
                  placeholder="1000"
                />
                {errors.pricePerUser && (
                  <p className="text-sm text-destructive">{errors.pricePerUser.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixedPrice">固定価格</Label>
                <Input
                  id="fixedPrice"
                  type="number"
                  step="0.01"
                  {...register('fixedPrice')}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsers">最大ユーザー数</Label>
              <Input
                id="maxUsers"
                type="number"
                {...register('maxUsers')}
                placeholder="100"
              />
            </div>
          </div>

          {/* 機能リスト */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">機能リスト</h3>

            <div className="flex gap-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="機能を入力してEnter"
              />
              <Button type="button" onClick={handleAddFeature}>
                追加
              </Button>
            </div>

            {features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ステータス */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">現在のプランとして設定</Label>
                <p className="text-sm text-muted-foreground">
                  有効にすると、このプランが現在使用中のプランになります
                </p>
              </div>
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
