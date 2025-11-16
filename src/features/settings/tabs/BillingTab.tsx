'use client';

import { useState } from 'react';
import { useTenantStore } from '@/lib/store/tenant-store';
import { useUserStore } from '@/lib/store/user-store';
import {
  calculateMonthlyPrice,
  calculateTax,
  simulateUserAddition,
  simulateDailyProration,
} from '@/lib/billing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Calculator,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BillingTab() {
  const currentTenant = useTenantStore((state) => state.currentTenant);
  const users = useUserStore((state) => state.users);

  // 現在のアクティブユーザー数
  const activeUsers = users.filter((u) => u.status === 'active').length;

  // 月額料金を計算
  const monthlyPricing = calculateMonthlyPrice(activeUsers);
  const monthlySubtotal = monthlyPricing.totalPrice;
  const monthlyTax = calculateTax(monthlySubtotal);
  const monthlyTotal = monthlySubtotal + monthlyTax;

  // シミュレーション用の状態
  const [simulationUsers, setSimulationUsers] = useState(5);
  const [simulationResult, setSimulationResult] = useState<ReturnType<
    typeof simulateUserAddition
  > | null>(null);
  const [prorationResult, setProrationResult] = useState<ReturnType<
    typeof simulateDailyProration
  > | null>(null);

  const handleSimulation = () => {
    const result = simulateUserAddition(activeUsers, simulationUsers);
    setSimulationResult(result);

    // 日割り計算（今日追加した場合）
    const proration = simulateDailyProration(activeUsers, simulationUsers);
    setProrationResult(proration);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold">請求情報</h2>
        <p className="text-muted-foreground mt-1">
          現在の料金プランとご利用状況
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">アクティブユーザー</p>
              <p className="text-2xl font-bold">{activeUsers}名</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">月額料金（税抜）</p>
              <p className="text-2xl font-bold">¥{monthlySubtotal.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">月額料金（税込）</p>
              <p className="text-2xl font-bold">¥{monthlyTotal.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* タブ */}
      <Tabs defaultValue="current" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">現在の料金</TabsTrigger>
          <TabsTrigger value="simulation">料金シミュレーション</TabsTrigger>
          <TabsTrigger value="invoices">請求書履歴</TabsTrigger>
        </TabsList>

        {/* 現在の料金タブ */}
        <TabsContent value="current" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">料金内訳</h3>
            <div className="space-y-3">
              {monthlyPricing.breakdown.map((tier, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{tier.tierName}</p>
                    <p className="text-sm text-muted-foreground">
                      {tier.usersInTier}名 × ¥{tier.pricePerUser.toLocaleString()}/名
                    </p>
                  </div>
                  <p className="text-lg font-bold">¥{tier.subtotal.toLocaleString()}</p>
                </div>
              ))}

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">小計</span>
                  <span className="font-medium">¥{monthlySubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">消費税（10%）</span>
                  <span className="font-medium">¥{monthlyTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>合計</span>
                  <span>¥{monthlyTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">料金について</h4>
                <p className="text-sm text-muted-foreground">
                  月の途中でユーザーを追加・削除した場合は、日割り計算で課金されます。
                  詳細は「料金シミュレーション」タブでご確認いただけます。
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
                <h3 className="text-lg font-bold">ユーザー追加コストシミュレーション</h3>
                <p className="text-sm text-muted-foreground">
                  追加人数を入力して料金変動を確認
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="current-users">現在のユーザー数</Label>
                <Input
                  id="current-users"
                  type="number"
                  value={activeUsers}
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

            {simulationResult && prorationResult && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-bold mb-3">月額料金の変動</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">変更前</p>
                      <p className="text-2xl font-bold">
                        ¥{simulationResult.before.totalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeUsers}名（税抜）
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">変更後</p>
                      <p className="text-2xl font-bold">
                        ¥{simulationResult.after.totalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeUsers + simulationUsers}名（税抜）
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">差額（税込）</span>
                      <span className="text-xl font-bold text-green-600">
                        +¥{simulationResult.differenceWithTax.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    今日追加した場合の日割り料金
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {prorationResult.message}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-background rounded">
                      <span className="text-muted-foreground">月の日数</span>
                      <p className="font-bold">{prorationResult.daysInMonth}日</p>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <span className="text-muted-foreground">残り日数</span>
                      <p className="font-bold">{prorationResult.remainingDays}日</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-bold mb-2">料金内訳（変更後）</h4>
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
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-bold">請求書履歴</h3>
            </div>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Coming Soon...</p>
              <p className="text-sm text-muted-foreground mt-2">
                請求書の自動生成機能は近日公開予定です
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
