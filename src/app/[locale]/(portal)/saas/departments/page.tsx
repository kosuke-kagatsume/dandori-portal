'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Building, Users, Download, Loader2, RefreshCw } from 'lucide-react';
import { useSaaSAssignmentsAPI, type SaaSAssignmentFromAPI } from '@/hooks/use-saas-api';
import { toast } from 'sonner';

// 部門別集計データの型
interface DepartmentSaaSData {
  departmentId: string | null;
  departmentName: string;
  userCount: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  serviceCount: number;
  users: Array<{ id: string; name: string; email: string; cost: number }>;
  services: Set<string>;
  assignments: SaaSAssignmentFromAPI[];
}

export default function SaaSDepartmentAnalysisPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { assignments, loading, fetchAssignments } = useSaaSAssignmentsAPI();

  useEffect(() => {
    setMounted(true);
  }, []);

  // アサインメントから部門別にグループ化
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, DepartmentSaaSData>();

    assignments.forEach((assignment) => {
      const deptId = assignment.departmentId || 'unknown';
      const deptName = assignment.departmentName || '未分類';
      const existing = deptMap.get(deptId);

      // 月額コスト計算
      const monthlyCost = assignment.plan?.pricePerUser || assignment.plan?.fixedPrice || 0;

      if (existing) {
        existing.totalMonthlyCost += monthlyCost;
        existing.totalAnnualCost = existing.totalMonthlyCost * 12;
        existing.assignments.push(assignment);

        // サービス名を追加
        if (assignment.service?.name) {
          existing.services.add(assignment.service.name);
        }

        // ユーザー情報を追加（重複チェック）
        const userId = assignment.userId || 'unknown';
        const existingUser = existing.users.find(u => u.id === userId);
        if (existingUser) {
          existingUser.cost += monthlyCost;
        } else {
          existing.users.push({
            id: userId,
            name: assignment.userName || '不明',
            email: assignment.userEmail || '',
            cost: monthlyCost,
          });
          existing.userCount = existing.users.length;
        }
      } else {
        const services = new Set<string>();
        if (assignment.service?.name) {
          services.add(assignment.service.name);
        }

        deptMap.set(deptId, {
          departmentId: assignment.departmentId,
          departmentName: deptName,
          userCount: 1,
          totalMonthlyCost: monthlyCost,
          totalAnnualCost: monthlyCost * 12,
          serviceCount: services.size,
          users: [{
            id: assignment.userId || 'unknown',
            name: assignment.userName || '不明',
            email: assignment.userEmail || '',
            cost: monthlyCost,
          }],
          services,
          assignments: [assignment],
        });
      }
    });

    // サービス数を更新
    const result = Array.from(deptMap.values()).map((dept) => ({
      ...dept,
      serviceCount: dept.services.size,
    }));

    // コスト順にソート
    return result.sort((a, b) => b.totalMonthlyCost - a.totalMonthlyCost);
  }, [assignments]);

  // 統計情報
  const totalDepartments = departmentData.length;
  const totalCost = departmentData.reduce((sum, dept) => sum + dept.totalMonthlyCost, 0);
  const averageCostPerDept = totalDepartments > 0 ? Math.round(totalCost / totalDepartments) : 0;

  // データ更新
  const handleRefresh = () => {
    fetchAssignments();
    toast.success('データを更新しました');
  };

  // CSV出力
  const handleExportCSV = () => {
    if (departmentData.length === 0) {
      toast.error('出力するデータがありません');
      return;
    }

    const headers = ['部門', 'ユーザー数', '月額コスト合計', '年額コスト合計', '利用サービス数', '平均コスト/人'];
    const rows = departmentData.map((dept) => [
      dept.departmentName,
      dept.userCount.toString(),
      dept.totalMonthlyCost.toString(),
      dept.totalAnnualCost.toString(),
      dept.serviceCount.toString(),
      Math.round(dept.totalMonthlyCost / dept.userCount).toString(),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saas_departments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV出力が完了しました');
  };

  // ローディング表示
  if (loading && assignments.length === 0) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/ja/saas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">部門別SaaS利用分析</h1>
          <p className="text-muted-foreground">部門ごとのSaaS利用状況とコストを分析（DB接続）</p>
        </div>
        <div className="flex gap-2">
          {mounted && (
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              更新
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/ja/saas/users')}
          >
            <Users className="mr-2 h-4 w-4" />
            ユーザー別利用
          </Button>
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
      </div>

      {/* サマリーカード */}
      {mounted && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">部門数</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDepartments}部門</div>
              <p className="text-xs text-muted-foreground mt-1">
                DBから取得
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
      )}

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
              <p className="text-sm">DBにアサインメントデータがありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {departmentData.map((dept) => (
                <Card key={dept.departmentId || 'unknown'} className="border-l-4 border-l-blue-500/20">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* 部門ヘッダー */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-xl">{dept.departmentName}</h3>
                            <Badge variant="outline">{dept.userCount}人</Badge>
                          </div>
                        </div>
                      </div>

                      {/* 統計グリッド */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">月額コスト合計</p>
                          <p className="text-2xl font-bold text-primary">
                            ¥{dept.totalMonthlyCost.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">年額コスト合計</p>
                          <p className="text-2xl font-bold">
                            ¥{dept.totalAnnualCost.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">利用サービス数</p>
                          <p className="text-2xl font-bold">{dept.serviceCount}件</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">平均コスト/人</p>
                          <p className="text-2xl font-bold">
                            ¥{Math.round(dept.totalMonthlyCost / dept.userCount).toLocaleString()}
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
