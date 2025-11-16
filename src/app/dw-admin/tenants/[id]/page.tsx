'use client';

/**
 * テナント詳細画面（DW社管理者用）
 *
 * - テナント情報
 * - 料金シミュレーション
 * - ユーザー数推移
 * - 請求書履歴
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminTenantStore } from '@/lib/store/admin-tenant-store';
import { simulateUserAddition } from '@/lib/billing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Users,
  DollarSign,
  Calculator,
  TrendingUp,
  Mail,
  Calendar,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const { getTenantById } = useAdminTenantStore();
  const tenant = getTenantById(tenantId);

  const [simulationUsers, setSimulationUsers] = useState(10);
  const [simulationResult, setSimulationResult] = useState<ReturnType<
    typeof simulateUserAddition
  > | null>(null);

  if (!tenant) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">テナントが見つかりませんでした</p>
          <Button className="mt-4" onClick={() => router.back()}>
            戻る
          </Button>
        </Card>
      </div>
    );
  }

  const handleSimulation = () => {
    const result = simulateUserAddition(tenant.activeUsers, simulationUsers);
    setSimulationResult(result);
  };

  return (
    <div className="space-y-6 p-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dw-admin/tenants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
            {tenant.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <div className="flex gap-2 mt-1">
              <Badge
                variant={
                  tenant.settings.status === 'active'
                    ? 'default'
                    : tenant.settings.status === 'trial'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {tenant.settings.status === 'active'
                  ? '有効'
                  : tenant.settings.status === 'trial'
                  ? '試用中'
                  : tenant.settings.status === 'suspended'
                  ? '停止中'
                  : '解約済み'}
              </Badge>
              {tenant.settings.customPricing && (
                <Badge variant="outline">カスタム料金</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">アクティブユーザー</p>
              <p className="text-2xl font-bold">{tenant.activeUsers}名</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">総ユーザー数</p>
              <p className="text-2xl font-bold">{tenant.totalUsers}名</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">月次収益</p>
              <p className="text-2xl font-bold">¥{tenant.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">未払い請求書</p>
              <p className="text-2xl font-bold">{tenant.unpaidInvoices}件</p>
            </div>
          </div>
        </Card>
      </div>

      {/* タブ */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">基本情報</TabsTrigger>
          <TabsTrigger value="simulation">料金シミュレーション</TabsTrigger>
          <TabsTrigger value="invoices">請求書履歴</TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">テナント情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm text-muted-foreground">テナント ID</Label>
                <p className="mt-1 font-mono text-sm">{tenant.id}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  請求先メール
                </Label>
                <p className="mt-1">{tenant.settings.billingEmail || '-'}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  契約開始日
                </Label>
                <p className="mt-1">
                  {tenant.settings.contractStartDate
                    ? new Date(tenant.settings.contractStartDate).toLocaleDateString('ja-JP')
                    : '-'}
                </p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  契約終了日
                </Label>
                <p className="mt-1">
                  {tenant.settings.contractEndDate
                    ? new Date(tenant.settings.contractEndDate).toLocaleDateString('ja-JP')
                    : '-'}
                </p>
              </div>

              {tenant.settings.trialEndDate && (
                <div>
                  <Label className="text-sm text-muted-foreground">トライアル終了日</Label>
                  <p className="mt-1">
                    {new Date(tenant.settings.trialEndDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm text-muted-foreground">作成日</Label>
                <p className="mt-1">
                  {new Date(tenant.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 料金シミュレーションタブ */}
        <TabsContent value="simulation" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">料金シミュレーション</h3>
                <p className="text-sm text-muted-foreground">
                  ユーザー追加時の料金変動を確認
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="current-users">現在のユーザー数</Label>
                <Input
                  id="current-users"
                  type="number"
                  value={tenant.activeUsers}
                  disabled
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="additional-users">追加するユーザー数</Label>
                <Input
                  id="additional-users"
                  type="number"
                  min="1"
                  value={simulationUsers}
                  onChange={(e) => setSimulationUsers(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>

              <Button onClick={handleSimulation} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                シミュレーション実行
              </Button>
            </div>

            {simulationResult && (
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
                <h4 className="font-bold">シミュレーション結果</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">変更前</p>
                    <p className="text-2xl font-bold">
                      ¥{simulationResult.before.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tenant.activeUsers}名（税抜）
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">変更後</p>
                    <p className="text-2xl font-bold">
                      ¥{simulationResult.after.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tenant.activeUsers + simulationUsers}名（税抜）
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">差額（税抜）</span>
                    <span className="text-xl font-bold text-green-600">
                      +¥{simulationResult.difference.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">差額（税込）</span>
                    <span className="text-xl font-bold text-green-600">
                      +¥{simulationResult.differenceWithTax.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">料金内訳（変更後）</p>
                  <div className="space-y-2">
                    {simulationResult.after.breakdown.map((tier, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{tier.tierName}</span>
                        <span>
                          {tier.usersInTier}名 × ¥{tier.pricePerUser.toLocaleString()} = ¥
                          {tier.subtotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 請求書履歴タブ */}
        <TabsContent value="invoices">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">請求書履歴</h3>
            <p className="text-muted-foreground">Coming Soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
