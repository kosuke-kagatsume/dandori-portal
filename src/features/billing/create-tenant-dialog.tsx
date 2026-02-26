'use client';

import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Building2, Mail, Calendar, Users, CreditCard, Globe, AlertCircle, CheckCircle, Lock, Loader2, Wand2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
// useInvoiceStore - 将来使用予定
import { toast } from 'sonner';
import { calculateMonthlyPrice, calculateTax, calculateTotalWithTax } from '@/lib/billing/pricing-calculator';

interface CreateTenantDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTenantDialog({ open, onClose }: CreateTenantDialogProps) {
  const { addTenant, isSubdomainAvailable } = useAdminTenantStore();
  // initializeInvoices from useInvoiceStore() - 将来使用予定

  // フォーム状態
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    // Step 1: 会社情報
    companyName: '',
    subdomain: '',
    billingEmail: '',

    // Step 2: 契約プラン
    contractStartDate: new Date().toISOString().split('T')[0],
    trialDays: '0',
    initialUserCount: '10',

    // Step 3: 管理者情報
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    autoGeneratePassword: true,
    sendInviteEmail: true,
  });

  // 作成中のローディング状態
  const [isCreating, setIsCreating] = useState(false);

  // サブドメインのバリデーション状態
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');

  // デバウンス用のタイマー参照
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // サブドメインのバリデーション（API経由でデータベースをチェック）
  const validateSubdomain = useCallback((value: string) => {
    // 既存のタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value) {
      setSubdomainStatus('idle');
      return;
    }

    // 基本的なフォーマットチェック（APIでも行うが、UIの即時フィードバック用）
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(value) || value.length < 3 || value.length > 30) {
      setSubdomainStatus('invalid');
      return;
    }

    setSubdomainStatus('checking');

    // 500msのデバウンス後にAPIを呼び出す
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // APIでサブドメインの利用可能性をチェック（データベース確認）
        const response = await fetch(`/api/admin/tenants/check-subdomain?subdomain=${encodeURIComponent(value)}`);
        const data = await response.json();

        if (data.success && data.available) {
          setSubdomainStatus('available');
        } else if (data.reason === 'invalid_format') {
          setSubdomainStatus('invalid');
        } else {
          setSubdomainStatus('unavailable');
        }
      } catch (error) {
        console.error('サブドメインチェックエラー:', error);
        // エラー時はローカルストアにフォールバック
        if (isSubdomainAvailable(value)) {
          setSubdomainStatus('available');
        } else {
          setSubdomainStatus('unavailable');
        }
      }
    }, 500);
  }, [isSubdomainAvailable]);

  // 料金計算
  const userCount = parseInt(formData.initialUserCount) || 0;
  const pricing = calculateMonthlyPrice(userCount);
  const tax = calculateTax(pricing.totalPrice);
  const total = calculateTotalWithTax(pricing.totalPrice);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // パスワード自動生成
  const generatePassword = useCallback(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      adminPassword: password,
      adminPasswordConfirm: password,
    }));
  }, []);

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

  const handleCreate = async () => {
    // 最終バリデーション
    if (!formData.adminName || !formData.adminEmail) {
      toast.error('管理者名とメールアドレスを入力してください');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      toast.error('有効な管理者メールアドレスを入力してください');
      return;
    }
    if (!formData.adminPassword) {
      toast.error('パスワードを入力または自動生成してください');
      return;
    }
    if (formData.adminPassword.length < 8) {
      toast.error('パスワードは8文字以上必要です');
      return;
    }
    if (!formData.autoGeneratePassword && formData.adminPassword !== formData.adminPasswordConfirm) {
      toast.error('パスワードが一致しません');
      return;
    }

    setIsCreating(true);

    try {
      // トライアル期限計算
      const trialDays = parseInt(formData.trialDays);
      const trialEndDate = trialDays > 0
        ? new Date(new Date(formData.contractStartDate).getTime() + trialDays * 24 * 60 * 60 * 1000)
        : null;

      // 1. データベースにテナントを作成
      const tenantResponse = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          subdomain: formData.subdomain || null,
          timezone: 'Asia/Tokyo',
          billingEmail: formData.billingEmail,
          trialEndDate: trialEndDate?.toISOString(),
          contractStartDate: formData.contractStartDate,
          status: trialDays > 0 ? 'trial' : 'active',
        }),
      });

      const tenantData = await tenantResponse.json();

      if (!tenantResponse.ok) {
        throw new Error(tenantData.error || 'テナントの作成に失敗しました');
      }

      const tenantId = tenantData.data.id;

      // 2. 管理者ユーザーを作成
      const authResponse = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.adminEmail,
          password: formData.adminPassword,
          name: formData.adminName,
          role: 'admin',
          tenantId: tenantId,
          passwordResetRequired: formData.sendInviteEmail,
          sendInviteEmail: formData.sendInviteEmail,
          tenantName: formData.companyName,
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || '管理者アカウントの作成に失敗しました');
      }

      // メール送信結果を取得
      const emailWasSent = authData.emailSent === true;
      const emailError = authData.emailError;

      // 3. ローカルストア（UI用）にもテナントを追加
      addTenant({
        id: tenantId,
        name: formData.companyName,
        subdomain: formData.subdomain || null,
        plan: userCount <= 30 ? 'basic' : userCount <= 100 ? 'standard' : 'enterprise',
        userCount: parseInt(formData.initialUserCount),
        invoiceCount: 0,
        totalAmount: 0,
        unpaidAmount: 0,
        overdueCount: 0,
        activeUsers: parseInt(formData.initialUserCount),
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
          trialEndDate: trialEndDate?.toISOString() ?? null,
          contractStartDate: formData.contractStartDate,
          contractEndDate: null,
          billingEmail: formData.billingEmail,
          customPricing: false,
          status: trialDays > 0 ? 'trial' : 'active',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (formData.sendInviteEmail) {
        if (emailWasSent) {
          toast.success(`テナント「${formData.companyName}」を作成し、招待メールを送信しました`);
        } else {
          toast.warning(`テナント「${formData.companyName}」を作成しましたが、招待メールの送信に失敗しました`, {
            description: emailError || 'メール設定を確認してください',
          });
        }
      } else {
        toast.success(`テナント「${formData.companyName}」を作成しました`);
      }

      // フォームリセット
      setFormData({
        companyName: '',
        subdomain: '',
        billingEmail: '',
        contractStartDate: new Date().toISOString().split('T')[0],
        trialDays: '0',
        initialUserCount: '10',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: '',
        autoGeneratePassword: true,
        sendInviteEmail: true,
      });
      setSubdomainStatus('idle');
      setStep(1);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create tenant:', error);
      toast.error(error instanceof Error ? error.message : 'テナントの作成に失敗しました');
    } finally {
      setIsCreating(false);
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
                  {subdomainStatus === 'available' && (
                    <p className="text-xs text-green-500">
                      このサブドメインは使用可能です
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
                  管理者はすべての機能にアクセスでき、他のユーザーを招待できます。
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
                    disabled={isCreating}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  このアドレスでログインできます
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoGeneratePassword"
                  checked={formData.autoGeneratePassword}
                  onCheckedChange={(checked) => {
                    handleChange('autoGeneratePassword', checked === true);
                    if (checked) {
                      generatePassword();
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        adminPassword: '',
                        adminPasswordConfirm: '',
                      }));
                    }
                  }}
                  disabled={isCreating}
                />
                <Label htmlFor="autoGeneratePassword" className="text-sm font-normal cursor-pointer">
                  パスワードを自動生成する
                </Label>
              </div>

              {formData.autoGeneratePassword ? (
                <div>
                  <Label>生成されたパスワード</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={formData.adminPassword}
                        readOnly
                        className="pl-10 font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      disabled={isCreating}
                    >
                      <Wand2 className="h-4 w-4 mr-1" />
                      再生成
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    このパスワードは招待メールに記載されます
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="adminPassword">パスワード *</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPassword"
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) => handleChange('adminPassword', e.target.value)}
                        placeholder="8文字以上"
                        className="pl-10"
                        disabled={isCreating}
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="adminPasswordConfirm">パスワード（確認） *</Label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adminPasswordConfirm"
                        type="password"
                        value={formData.adminPasswordConfirm}
                        onChange={(e) => handleChange('adminPasswordConfirm', e.target.value)}
                        placeholder="パスワードを再入力"
                        className="pl-10"
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="sendInviteEmail"
                  checked={formData.sendInviteEmail}
                  onCheckedChange={(checked) => handleChange('sendInviteEmail', checked === true)}
                  disabled={isCreating}
                />
                <Label htmlFor="sendInviteEmail" className="text-sm font-normal cursor-pointer">
                  招待メールを送信する
                </Label>
              </div>
              {formData.sendInviteEmail && (
                <p className="text-xs text-muted-foreground ml-6">
                  ログインURL、初期パスワード、パスワード変更の案内を含むメールが送信されます。
                  初回ログイン時にパスワード変更が必要になります。
                </p>
              )}

              {/* 確認サマリー */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">作成内容の確認</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">会社名</span>
                    <span className="font-medium">{formData.companyName}</span>
                  </div>
                  {formData.subdomain && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">サブドメイン</span>
                      <span className="font-medium">{formData.subdomain}.dandori-portal.com</span>
                    </div>
                  )}
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
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                '作成'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
