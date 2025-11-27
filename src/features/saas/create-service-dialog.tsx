'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// カテゴリラベル
const categoryLabels: Record<string, string> = {
  productivity: '生産性ツール',
  communication: 'コミュニケーション',
  project_management: 'プロジェクト管理',
  hr: '人事・採用',
  finance: '会計・財務',
  marketing: 'マーケティング',
  sales: '営業・CRM',
  development: '開発ツール',
  security: 'セキュリティ',
  other: 'その他',
};

// ライセンスタイプラベル
const licenseTypeLabels: Record<string, string> = {
  'user-based': 'ユーザー単位',
  'fixed': '固定料金',
  'per_seat': 'シート単位',
  'enterprise': 'エンタープライズ',
  'usage_based': '従量課金',
  'freemium': 'フリーミアム',
};

// 請求サイクルラベル
const billingCycleLabels: Record<string, string> = {
  'monthly': '月払い',
  'yearly': '年払い',
  'quarterly': '四半期払い',
  'one_time': '一括払い',
};

interface CreateServiceDialogProps {
  onServiceCreated: () => void;
}

export function CreateServiceDialog({ onServiceCreated }: CreateServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // フォーム状態
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [notes, setNotes] = useState('');

  // プラン情報
  const [planName, setPlanName] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [pricePerUser, setPricePerUser] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [maxUsers, setMaxUsers] = useState('');

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

  const resetForm = () => {
    setName('');
    setVendor('');
    setCategory('');
    setLicenseType('');
    setDescription('');
    setWebsite('');
    setContractStartDate('');
    setContractEndDate('');
    setAutoRenew(true);
    setSsoEnabled(false);
    setMfaEnabled(false);
    setNotes('');
    setPlanName('');
    setBillingCycle('monthly');
    setPricePerUser('');
    setFixedPrice('');
    setMaxUsers('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !category || !licenseType) {
      toast.error('サービス名、カテゴリ、ライセンスタイプは必須です');
      return;
    }

    setLoading(true);

    try {
      // サービスを作成
      const serviceResponse = await fetch('/api/saas/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          vendor: vendor || null,
          category,
          licenseType,
          description: description || null,
          website: website || null,
          contractStartDate: contractStartDate || null,
          contractEndDate: contractEndDate || null,
          autoRenewal: autoRenew,
          ssoEnabled,
          mfaRequired: mfaEnabled,
          notes: notes || null,
        }),
      });

      const serviceData = await serviceResponse.json();

      if (!serviceData.success) {
        throw new Error(serviceData.error || 'サービスの作成に失敗しました');
      }

      // プラン情報があれば作成
      if (planName && (pricePerUser || fixedPrice)) {
        const planResponse = await fetch('/api/saas/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: serviceData.data.id,
            planName,
            pricePerUser: pricePerUser ? parseFloat(pricePerUser) : null,
            fixedPrice: fixedPrice ? parseFloat(fixedPrice) : null,
            maxUsers: maxUsers ? parseInt(maxUsers) : null,
            billingCycle,
            currency: 'JPY',
          }),
        });

        const planData = await planResponse.json();
        if (!planData.success) {
          console.warn('プランの作成に失敗しました:', planData.error);
        }
      }

      toast.success(`サービス「${name}」を登録しました`);
      resetForm();
      setOpen(false);
      onServiceCreated();
    } catch (error) {
      console.error('Failed to create service:', error);
      toast.error(error instanceof Error ? error.message : 'サービスの登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          新規サービス登録
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規SaaSサービス登録</DialogTitle>
          <DialogDescription>
            新しいSaaSサービスの情報を入力してください
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">基本情報</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">サービス名 *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: Slack"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">ベンダー名</Label>
                  <Input
                    id="vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="例: Salesforce"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリ *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
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
                  <Select value={licenseType} onValueChange={setLicenseType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="タイプを選択" />
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

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="サービスの説明を入力"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Webサイト</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* プラン情報 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground">プラン情報（オプション）</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">プラン名</Label>
                  <Input
                    id="planName"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="例: Business"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="pricePerUser">ユーザー単価（円/{getPriceLabel()}）</Label>
                  <Input
                    id="pricePerUser"
                    type="number"
                    value={pricePerUser}
                    onChange={(e) => setPricePerUser(e.target.value)}
                    placeholder={billingCycle === 'yearly' ? '例: 16320' : '例: 1360'}
                  />
                </div>
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

            {/* 契約情報 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground">契約情報</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractStartDate">契約開始日</Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractEndDate">契約終了日</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoRenew" className="cursor-pointer">自動更新</Label>
                <Switch
                  id="autoRenew"
                  checked={autoRenew}
                  onCheckedChange={setAutoRenew}
                />
              </div>
            </div>

            {/* セキュリティ設定 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm text-muted-foreground">セキュリティ設定</h3>

              <div className="flex items-center justify-between">
                <Label htmlFor="ssoEnabled" className="cursor-pointer">SSO連携</Label>
                <Switch
                  id="ssoEnabled"
                  checked={ssoEnabled}
                  onCheckedChange={setSsoEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mfaEnabled" className="cursor-pointer">MFA有効</Label>
                <Switch
                  id="mfaEnabled"
                  checked={mfaEnabled}
                  onCheckedChange={setMfaEnabled}
                />
              </div>
            </div>

            {/* 備考 */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="その他のメモや注意事項"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登録中...
                </>
              ) : (
                '登録する'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
