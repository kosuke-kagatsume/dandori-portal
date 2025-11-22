'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Calendar, Users, CreditCard } from 'lucide-react';
import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
import { useInvoiceStore } from '@/lib/store/invoice-store';
import { toast } from 'sonner';
import { calculateMonthlyPrice, calculateTax, calculateTotalWithTax } from '@/lib/billing/pricing-calculator';

interface CreateTenantDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTenantDialog({ open, onClose }: CreateTenantDialogProps) {
  const { addTenant } = useAdminTenantStore();
  const { initializeInvoices } = useInvoiceStore();

  // フォーム状態
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    // Step 1: 会社情報
    companyName: '',
    billingEmail: '',

    // Step 2: 契約プラン
    contractStartDate: new Date().toISOString().split('T')[0],
    trialDays: '0',
    initialUserCount: '10',

    // Step 3: 管理者情報
    adminName: '',
    adminEmail: '',
  });

  // 料金計算
  const userCount = parseInt(formData.initialUserCount) || 0;
  const pricing = calculateMonthlyPrice(userCount);
  const tax = calculateTax(pricing.totalPrice);
  const total = calculateTotalWithTax(pricing.totalPrice);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // バリデーション
    if (step === 1) {
      if (!formData.companyName || !formData.billingEmail) {
        toast.error('会社名と請求先メールアドレスを入力してください');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
        toast.error('有効なメールアドレスを入力してください');
        return;
      }
    }

    if (step === 2) {
      if (!formData.contractStartDate) {
        toast.error('契約開始日を選択してください');
        return;
      }
      if (userCount <= 0) {
        toast.error('初期ユーザー数は1以上を指定してください');
        return;
      }
    }

    setStep((prev) => (prev + 1) as 1 | 2 | 3);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const handleCreate = () => {
    // 最終バリデーション
    if (!formData.adminName || !formData.adminEmail) {
      toast.error('管理者情報を入力してください');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      toast.error('有効な管理者メールアドレスを入力してください');
      return;
    }

    try {
      // トライアル期限計算
      const trialDays = parseInt(formData.trialDays);
      const trialEndDate = trialDays > 0
        ? new Date(new Date(formData.contractStartDate).getTime() + trialDays * 24 * 60 * 60 * 1000)
        : null;

      // テナント作成
      addTenant({
        name: formData.companyName,
        logo: null,
        plan: userCount <= 30 ? 'basic' : userCount <= 100 ? 'standard' : 'enterprise',
        activeUsers: parseInt(formData.initialUserCount),
        totalUsers: parseInt(formData.initialUserCount),
        maxUsers: parseInt(formData.initialUserCount),
        monthlyRevenue: total,
        unpaidInvoices: 0,
        contactEmail: formData.adminEmail,
        billingEmail: formData.billingEmail,
        phone: null,
        address: null,
        contractStartDate: formData.contractStartDate,
        contractEndDate: null,
        settings: {
          id: `settings-${Date.now()}`,
          tenantId: `tenant-${Date.now()}`,
          trialEndDate,
          contractStartDate: new Date(formData.contractStartDate),
          contractEndDate: null,
          billingEmail: formData.billingEmail,
          customPricing: false,
          status: trialDays > 0 ? 'trial' : 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success(`テナント「${formData.companyName}」を作成しました`);

      // フォームリセット
      setFormData({
        companyName: '',
        billingEmail: '',
        contractStartDate: new Date().toISOString().split('T')[0],
        trialDays: '0',
        initialUserCount: '10',
        adminName: '',
        adminEmail: '',
      });
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Failed to create tenant:', error);
      toast.error('テナントの作成に失敗しました');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            新規テナント作成
          </DialogTitle>
          <DialogDescription>
            ステップ {step}/3: {step === 1 ? '会社情報' : step === 2 ? '契約プラン' : '管理者設定'}
          </DialogDescription>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
                <p className={`text-xs mt-1 ${s === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {s === 1 ? '会社情報' : s === 2 ? '契約プラン' : '管理者設定'}
                </p>
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: 会社情報 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">会社名 *</Label>
                <div className="relative mt-2">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="例: デモ株式会社"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="billingEmail">請求先メールアドレス *</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="billingEmail"
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) => handleChange('billingEmail', e.target.value)}
                    placeholder="billing@example.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  請求書がこのアドレスに送信されます
                </p>
              </div>
            </div>
          )}

          {/* Step 2: 契約プラン */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="contractStartDate">契約開始日 *</Label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={formData.contractStartDate}
                    onChange={(e) => handleChange('contractStartDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="trialDays">試用期間</Label>
                <Select value={formData.trialDays} onValueChange={(value) => handleChange('trialDays', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">なし</SelectItem>
                    <SelectItem value="7">7日間</SelectItem>
                    <SelectItem value="14">14日間</SelectItem>
                    <SelectItem value="30">30日間</SelectItem>
                  </SelectContent>
                </Select>
                {parseInt(formData.trialDays) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    試用期間中は請求が発生しません
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="initialUserCount">初期ユーザー数 *</Label>
                <div className="relative mt-2">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="initialUserCount"
                    type="number"
                    min="1"
                    value={formData.initialUserCount}
                    onChange={(e) => handleChange('initialUserCount', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 料金シミュレーション */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  料金シミュレーション
                </h4>
                <div className="space-y-2">
                  {pricing.breakdown.map((tier, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {tier.tierName}: {tier.usersInTier}人 × ¥{tier.pricePerUser.toLocaleString()}
                      </span>
                      <span className="font-medium">¥{tier.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">小計（税抜）</span>
                    <span className="font-medium">¥{pricing.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">消費税（10%）</span>
                    <span className="font-medium">¥{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>月額料金（税込）</span>
                    <span className="text-primary">¥{total.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: 管理者情報 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  このテナントの初期管理者アカウントを作成します。
                  管理者は全ての機能にアクセスでき、他のユーザーを招待できます。
                </p>
              </div>

              <div>
                <Label htmlFor="adminName">管理者名 *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  placeholder="例: 山田 太郎"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="adminEmail">管理者メールアドレス *</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    placeholder="admin@example.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  招待メールがこのアドレスに送信されます
                </p>
              </div>

              {/* 確認サマリー */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">作成内容の確認</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">会社名</span>
                    <span className="font-medium">{formData.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">請求先</span>
                    <span className="font-medium">{formData.billingEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">契約開始日</span>
                    <span className="font-medium">{new Date(formData.contractStartDate).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">試用期間</span>
                    <span className="font-medium">
                      {formData.trialDays === '0' ? 'なし' : `${formData.trialDays}日間`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">初期ユーザー数</span>
                    <span className="font-medium">{formData.initialUserCount}人</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">月額料金（税込）</span>
                    <span className="font-bold text-primary">¥{total.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              戻る
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext}>次へ</Button>
          ) : (
            <Button onClick={handleCreate}>作成</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
