'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Building2, Mail, Calendar, Users, CreditCard, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { useAdminTenantStore, TenantWithStats } from '@/lib/store/admin-tenant-store';
import { toast } from 'sonner';
import { calculateMonthlyPrice, calculateTax, calculateTotalWithTax } from '@/lib/billing/pricing-calculator';

interface EditTenantDialogProps {
  open: boolean;
  onClose: () => void;
  tenant: TenantWithStats | null;
}

export function EditTenantDialog({ open, onClose, tenant }: EditTenantDialogProps) {
  const { updateTenant, isSubdomainAvailable } = useAdminTenantStore();

  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    billingEmail: '',
    contactEmail: '',
    phone: '',
    address: '',
    contractStartDate: '',
    contractEndDate: '',
    trialDays: '0',
    userCount: '10',
    plan: 'basic' as 'basic' | 'standard' | 'enterprise',
  });

  // サブドメインのバリデーション状態
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');

  // サブドメインのバリデーション
  const validateSubdomain = (value: string) => {
    if (!value) {
      setSubdomainStatus('idle');
      return;
    }
    // 英小文字、数字、ハイフンのみ許可（先頭と末尾のハイフンは不可）
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(value) || value.length < 3 || value.length > 30) {
      setSubdomainStatus('invalid');
      return;
    }
    setSubdomainStatus('checking');
    // 重複チェック（自分自身は除外）
    setTimeout(() => {
      if (isSubdomainAvailable(value, tenant?.id)) {
        setSubdomainStatus('available');
      } else {
        setSubdomainStatus('unavailable');
      }
    }, 300);
  };

  // テナントデータが変更されたらフォームを初期化
  useEffect(() => {
    if (tenant && open) {
      // トライアル期限から日数を計算
      let trialDays = '0';
      if (tenant.settings.trialEndDate && tenant.settings.contractStartDate) {
        const start = new Date(tenant.settings.contractStartDate);
        const end = new Date(tenant.settings.trialEndDate);
        const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        trialDays = diffDays > 0 ? diffDays.toString() : '0';
      }

      setFormData({
        companyName: tenant.name,
        subdomain: tenant.subdomain || '',
        billingEmail: tenant.billingEmail || '',
        contactEmail: tenant.contactEmail,
        phone: tenant.phone || '',
        address: tenant.address || '',
        contractStartDate: tenant.contractStartDate,
        contractEndDate: tenant.contractEndDate || '',
        trialDays,
        userCount: tenant.maxUsers.toString(),
        plan: tenant.plan,
      });
      // サブドメインの初期状態を設定
      if (tenant.subdomain) {
        setSubdomainStatus('available');
      } else {
        setSubdomainStatus('idle');
      }
    }
  }, [tenant, open]);

  // 料金計算
  const userCount = parseInt(formData.userCount) || 0;
  const pricing = calculateMonthlyPrice(userCount);
  const tax = calculateTax(pricing.totalPrice);
  const total = calculateTotalWithTax(pricing.totalPrice);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = () => {
    if (!tenant) return;

    // バリデーション
    if (!formData.companyName || !formData.billingEmail || !formData.contactEmail) {
      toast.error('会社名、請求先メール、連絡先メールを入力してください');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      toast.error('有効な請求先メールアドレスを入力してください');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      toast.error('有効な連絡先メールアドレスを入力してください');
      return;
    }
    // サブドメインのバリデーション
    if (formData.subdomain) {
      if (subdomainStatus === 'invalid') {
        toast.error('サブドメインは3〜30文字の英小文字・数字・ハイフンのみ使用可能です');
        return;
      }
      if (subdomainStatus === 'unavailable') {
        toast.error('このサブドメインは既に使用されています');
        return;
      }
      if (subdomainStatus === 'checking') {
        toast.error('サブドメインの確認中です。少々お待ちください');
        return;
      }
    }
    if (!formData.contractStartDate) {
      toast.error('契約開始日を選択してください');
      return;
    }
    if (userCount <= 0) {
      toast.error('ユーザー数は1以上を指定してください');
      return;
    }

    try {
      // トライアル期限計算
      const trialDays = parseInt(formData.trialDays);
      const trialEndDate = trialDays > 0
        ? new Date(new Date(formData.contractStartDate).getTime() + trialDays * 24 * 60 * 60 * 1000)
        : null;

      // プラン自動選択（ユーザー数に基づく）
      let plan: 'basic' | 'standard' | 'enterprise';
      if (userCount <= 30) {
        plan = 'basic';
      } else if (userCount <= 100) {
        plan = 'standard';
      } else {
        plan = 'enterprise';
      }

      // テナント更新
      updateTenant(tenant.id, {
        name: formData.companyName,
        subdomain: formData.subdomain || null,
        plan,
        activeUsers: parseInt(formData.userCount),
        totalUsers: parseInt(formData.userCount),
        maxUsers: parseInt(formData.userCount),
        monthlyRevenue: total,
        contactEmail: formData.contactEmail,
        billingEmail: formData.billingEmail,
        phone: formData.phone || null,
        address: formData.address || null,
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate || null,
        settings: {
          ...tenant.settings,
          trialEndDate,
          contractStartDate: new Date(formData.contractStartDate),
          contractEndDate: formData.contractEndDate ? new Date(formData.contractEndDate) : null,
          billingEmail: formData.billingEmail,
          status: trialDays > 0 ? 'trial' : 'active',
          updatedAt: new Date(),
        },
      });

      toast.success(`テナント「${formData.companyName}」を更新しました`);
      onClose();
    } catch (error) {
      console.error('Failed to update tenant:', error);
      toast.error('テナントの更新に失敗しました');
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            テナント編集
          </DialogTitle>
          <DialogDescription>
            テナント「{tenant.name}」の情報を編集します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 会社情報 */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">会社情報</h3>
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
                <Label htmlFor="subdomain">サブドメイン</Label>
                <div className="relative mt-2">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="subdomain"
                    value={formData.subdomain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      handleChange('subdomain', value);
                      validateSubdomain(value);
                    }}
                    placeholder="例: demo-corp"
                    className="pl-10 pr-10"
                  />
                  {subdomainStatus === 'checking' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {subdomainStatus === 'available' && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {(subdomainStatus === 'unavailable' || subdomainStatus === 'invalid') && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="mt-1 space-y-1">
                  {formData.subdomain && (
                    <p className="text-xs text-muted-foreground">
                      アクセスURL: https://{formData.subdomain}.dandori-portal.com
                    </p>
                  )}
                  {subdomainStatus === 'invalid' && (
                    <p className="text-xs text-red-500">
                      3〜30文字の英小文字・数字・ハイフンのみ使用可能です
                    </p>
                  )}
                  {subdomainStatus === 'unavailable' && (
                    <p className="text-xs text-red-500">
                      このサブドメインは既に使用されています
                    </p>
                  )}
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
              </div>

              <div>
                <Label htmlFor="contactEmail">連絡先メールアドレス *</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="contact@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="03-1234-5678"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="東京都渋谷区..."
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          {/* 契約プラン */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">契約プラン</h3>
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
                <Label htmlFor="contractEndDate">契約終了日</Label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={formData.contractEndDate}
                    onChange={(e) => handleChange('contractEndDate', e.target.value)}
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
                <Label htmlFor="userCount">ユーザー数 *</Label>
                <div className="relative mt-2">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userCount"
                    type="number"
                    min="1"
                    value={formData.userCount}
                    onChange={(e) => handleChange('userCount', e.target.value)}
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
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleUpdate}>更新</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
