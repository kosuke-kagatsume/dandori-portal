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
import { Textarea } from '@/components/ui/textarea';
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
import { type SaaSServiceFromAPI } from '@/hooks/use-saas-api';

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
  storage: 'ストレージ',
  design: 'デザイン',
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

interface EditServiceDialogProps {
  open: boolean;
  onClose: () => void;
  service: SaaSServiceFromAPI;
  onSuccess: () => void;
}

export function EditServiceDialog({ open, onClose, service, onSuccess }: EditServiceDialogProps) {
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

  // サービス情報をフォームにロード
  useEffect(() => {
    if (service && open) {
      setName(service.name || '');
      setVendor(service.vendor || '');
      setCategory(service.category || 'other');
      setLicenseType(service.licenseType || 'user-based');
      setDescription(service.description || '');
      setWebsite(service.website || '');
      setContractStartDate(service.contractStartDate ? service.contractStartDate.split('T')[0] : '');
      setContractEndDate(service.contractEndDate ? service.contractEndDate.split('T')[0] : '');
      setAutoRenew(service.autoRenew ?? true);
      setSsoEnabled(service.ssoEnabled ?? false);
      setMfaEnabled(service.mfaEnabled ?? false);
      setNotes(service.notes || '');
    }
  }, [service, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !category || !licenseType) {
      toast.error('サービス名、カテゴリ、ライセンスタイプは必須です');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/saas/services/${service.id}`, {
        method: 'PUT',
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
          autoRenew,
          ssoEnabled,
          mfaEnabled,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'サービスの更新に失敗しました');
      }

      toast.success(`サービス「${name}」を更新しました`);
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Failed to update service:', error);
      toast.error(error instanceof Error ? error.message : 'サービスの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SaaSサービス編集</DialogTitle>
          <DialogDescription>
            サービス情報を編集してください
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
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新する'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
