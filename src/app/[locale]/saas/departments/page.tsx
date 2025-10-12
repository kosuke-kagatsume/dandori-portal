'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Building, Users, Download } from 'lucide-react';
import { useSaaSStore } from '@/lib/store/saas-store';
import { useUserStore } from '@/lib/store/user-store';
import { categoryLabels } from '@/types/saas';
import { toast } from 'sonner';

export default function SaaSDepartmentAnalysisPage() {
  const router = useRouter();
  const { getUserSaaSDetails, getUserTotalCost } = useSaaSStore();
  const { users } = useUserStore();

  // アクティブなユーザーのみ
  const activeUsers = users.filter((user) => user.status === 'active');

  // 部門別の集計データを作成
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, {
      department: string;
      userCount: number;
      totalCost: number;
      serviceCount: number;
      users: Array<{ id: string; name: string; cost: number }>;
      services: Set<string>;
    }>();

    activeUsers.forEach((user) => {
      const dept = user.department || '未分類';
      const userCost = getUserTotalCost(user.id);
      const saasDetails = getUserSaaSDetails(user.id);

      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          department: dept,
          userCount: 0,
          totalCost: 0,
          serviceCount: 0,
          users: [],
          services: new Set(),
        });
      }

      const deptInfo = deptMap.get(dept)!;
      deptInfo.userCount++;
      deptInfo.totalCost += userCost;
      deptInfo.users.push({ id: user.id, name: user.name, cost: userCost });

      saasDetails.forEach((detail) => {
        deptInfo.services.add(detail.service.name);
      });
    });

    // Setのサイズを取得してserviceCountに設定
    const result = Array.from(deptMap.values()).map((dept) => ({
      ...dept,
      serviceCount: dept.services.size,
      services: dept.services, // Setのまま保持
    }));

    // コスト順にソート
    return result.sort((a, b) => b.totalCost - a.totalCost);
  }, [activeUsers, getUserTotalCost, getUserSaaSDetails]);

  // 統計情報
  const totalDepartments = departmentData.length;
  const totalCost = departmentData.reduce((sum, dept) => sum + dept.totalCost, 0);
  const averageCostPerDept = totalDepartments > 0 ? Math.round(totalCost / totalDepartments) : 0;

  // CSV出力
  const handleExportCSV = () => {
    if (departmentData.length === 0) {
      toast.error('出力するデータがありません');
      return;
    }

    const headers = ['部門', 'ユーザー数', '月額コスト合計', '年額コスト合計', '利用サービス数', '平均コスト/人'];
    const rows = departmentData.map((dept) => [
      dept.department,
      dept.userCount,
      dept.totalCost,
      dept.totalCost * 12,
      dept.serviceCount,
      Math.round(dept.totalCost / dept.userCount),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `部門別SaaS利用状況_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV出力が完了しました');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/ja/saas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">部門別SaaS利用分析</h1>
          <p className="text-muted-foreground">部門ごとのSaaS利用状況とコストを分析</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={departmentData.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          CSV出力
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">部門数</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}部門</div>
            <p className="text-xs text-muted-foreground mt-1">
              アクティブな部門
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総コスト</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ¥{totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              全部門の月額合計
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均コスト/部門</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{averageCostPerDept.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              部門あたりの平均月額
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 部門一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>部門別利用状況</CardTitle>
          <CardDescription>
            コスト順に表示しています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departmentData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">データがありません</p>
              <p className="text-sm">部門情報が設定されたユーザーがいません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {departmentData.map((dept) => (
                <Card key={dept.department} className="border-l-4 border-l-blue-500/20">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* 部門ヘッダー */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-xl">{dept.department}</h3>
                            <Badge variant="outline">{dept.userCount}人</Badge>
                          </div>
                        </div>
                      </div>

                      {/* 統計グリッド */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">月額コスト合計</p>
                          <p className="text-2xl font-bold text-primary">
                            ¥{dept.totalCost.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">年額コスト合計</p>
                          <p className="text-2xl font-bold">
                            ¥{(dept.totalCost * 12).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">利用サービス数</p>
                          <p className="text-2xl font-bold">{dept.serviceCount}件</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">平均コスト/人</p>
                          <p className="text-2xl font-bold">
                            ¥{Math.round(dept.totalCost / dept.userCount).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* 部門内ユーザー */}
                      <div>
                        <p className="text-sm font-medium mb-2">所属ユーザー（コスト順）:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {dept.users
                            .sort((a, b) => b.cost - a.cost)
                            .map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded hover:bg-muted transition-colors cursor-pointer"
                                onClick={() => router.push(`/ja/users/${user.id}`)}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{user.name}</span>
                                </div>
                                <span className="text-sm font-bold text-primary">
                                  ¥{user.cost.toLocaleString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* 利用サービス */}
                      <div>
                        <p className="text-sm font-medium mb-2">利用中のサービス:</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(dept.services).map((serviceName) => (
                            <Badge key={serviceName} variant="secondary">
                              {serviceName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
