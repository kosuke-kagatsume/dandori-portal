'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type SaaSPlanFromAPI } from '@/hooks/use-saas-api';

// 請求サイクルラベル
const billingCycleLabels: Record<string, string> = {
  'monthly': '月払い',
  'yearly': '年払い',
  'quarterly': '四半期払い',
  'one_time': '一括払い',
};

interface EditPlanDialogProps {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  plan: SaaSPlanFromAPI | null;
  onSuccess: () => void;
}

export function EditPlanDialog({ open, onClose, serviceId, plan, onSuccess }: EditPlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!plan;

  // フォーム状態
  const [planName, setPlanName] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [pricePerUser, setPricePerUser] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [maxUsers, setMaxUsers] = useState('');
  const [features, setFeatures] = useState('');
  const [isActive, setIsActive] = useState(true);

  // プラン情報をフォームにロード
  useEffect(() => {
    if (plan && open) {
      setPlanName(plan.planName || '');
      setBillingCycle(plan.billingCycle || 'monthly');
      setPricePerUser(plan.pricePerUser?.toString() || '');
      setFixedPrice(plan.fixedPrice?.toString() || '');
      setMaxUsers(plan.maxUsers?.toString() || '');
      setFeatures(plan.features?.join(', ') || '');
      setIsActive(plan.isActive ?? true);
    } else if (!plan && open) {
      // 新規作成モードでフォームをリセット
      setPlanName('');
      setBillingCycle('monthly');
      setPricePerUser('');
      setFixedPrice('');
      setMaxUsers('');
      setFeatures('');
      setIsActive(true);
    }
  }, [plan, open]);

  // 請求サイクルに応じたラベル
  const getPriceLabel = () => {
    switch (billingCycle) {
      case 'yearly':
        return '年';
      case 'quarterly':
        return '四半期';
      case 'one_time':
        return '一括';
      default:
        return '月';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planName) {
      toast.error('プラン名は必須です');
      return;
    }

    if (!pricePerUser && !fixedPrice) {
      toast.error('ユーザー単価または固定料金のいずれかを入力してください');
      return;
    }

    setLoading(true);

    try {
      const featuresArray = features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const payload = {
        serviceId,
        planName,
        billingCycle,
        pricePerUser: pricePerUser ? parseFloat(pricePerUser) : null,
        fixedPrice: fixedPrice ? parseFloat(fixedPrice) : null,
        maxUsers: maxUsers ? parseInt(maxUsers) : null,
        features: featuresArray,
        currency: 'JPY',
        isActive,
      };

      let response;
      if (isEditMode && plan) {
        response = await fetch(`/api/saas/plans/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/saas/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'プランの保存に失敗しました');
      }

      toast.success(isEditMode ? `プラン「${planName}」を更新しました` : `プラン「${planName}」を作成しました`);
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error(error instanceof Error ? error.message : 'プランの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'プラン編集' : '新規プラン作成'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'プラン情報を編集してください' : '新しいプランの情報を入力してください'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="planName">プラン名 *</Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="例: Business"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCycle">請求サイクル</Label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger>
                  <SelectValue placeholder="請求サイクルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(billingCycleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerUser">ユーザー単価（円/{getPriceLabel()}）</Label>
                <Input
                  id="pricePerUser"
                  type="number"
                  value={pricePerUser}
                  onChange={(e) => setPricePerUser(e.target.value)}
                  placeholder={billingCycle === 'yearly' ? '例: 16320' : '例: 1360'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fixedPrice">固定料金（円/{getPriceLabel()}）</Label>
                <Input
                  id="fixedPrice"
                  type="number"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  placeholder={billingCycle === 'yearly' ? '例: 600000' : '例: 50000'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUsers">最大ユーザー数</Label>
              <Input
                id="maxUsers"
                type="number"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                placeholder="例: 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">機能（カンマ区切り）</Label>
              <Input
                id="features"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="例: 無制限ストレージ, API連携, 24時間サポート"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="isActive" className="cursor-pointer">現在のプランとして設定</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? '更新中...' : '作成中...'}
                </>
              ) : (
                isEditMode ? '更新する' : '作成する'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
