'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, TrendingUp, Users, Download, Building, Loader2, RefreshCw } from 'lucide-react';
import { useSaaSAssignmentsAPI, type SaaSAssignmentFromAPI } from '@/hooks/use-saas-api';
import { toast } from 'sonner';

// ユーザー別集計データの型
interface UserSaaSData {
  userId: string;
  userName: string;
  userEmail: string;
  departmentName: string | null;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  serviceCount: number;
  assignments: SaaSAssignmentFromAPI[];
}

export default function SaaSUserListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const { assignments, loading, fetchAssignments } = useSaaSAssignmentsAPI();

  useEffect(() => {
    setMounted(true);
  }, []);

  // アサインメントからユーザー別にグループ化
  const usersWithSaaS = useMemo(() => {
    const userMap = new Map<string, UserSaaSData>();

    assignments.forEach((assignment) => {
      const userId = assignment.userId || 'unknown';
      const existing = userMap.get(userId);

      // 月額コスト計算
      const monthlyCost = assignment.plan?.pricePerUser || assignment.plan?.fixedPrice || 0;

      if (existing) {
        existing.totalMonthlyCost += monthlyCost;
        existing.totalAnnualCost = existing.totalMonthlyCost * 12;
        existing.serviceCount += 1;
        existing.assignments.push(assignment);
      } else {
        userMap.set(userId, {
          userId,
          userName: assignment.userName || '不明',
          userEmail: assignment.userEmail || '',
          departmentName: assignment.departmentName,
          totalMonthlyCost: monthlyCost,
          totalAnnualCost: monthlyCost * 12,
          serviceCount: 1,
          assignments: [assignment],
        });
      }
    });

    return Array.from(userMap.values());
  }, [assignments]);

  // 検索フィルター
  const filteredUsers = useMemo(() => {
    return usersWithSaaS.filter((user) => {
      const matchesSearch =
        user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.departmentName && user.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [usersWithSaaS, searchQuery]);

  // コスト順にソート
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => b.totalMonthlyCost - a.totalMonthlyCost);
  }, [filteredUsers]);

  // 統計情報
  const totalUsersWithSaaS = usersWithSaaS.length;
  const totalMonthlyCost = usersWithSaaS.reduce((sum, u) => sum + u.totalMonthlyCost, 0);
  const averageCostPerUser = totalUsersWithSaaS > 0
    ? Math.round(totalMonthlyCost / totalUsersWithSaaS)
    : 0;

  // データ更新
  const handleRefresh = () => {
    fetchAssignments();
    toast.success('データを更新しました');
  };

  // CSV出力（サマリー）
  const handleExportSummaryCSV = () => {
    if (sortedUsers.length === 0) {
      toast.error('出力するデータがありません');
      return;
    }

    const headers = ['ユーザー名', 'メールアドレス', '部門', '月額コスト', '年額コスト', '利用サービス数'];
    const rows = sortedUsers.map(u => [
      u.userName,
      u.userEmail,
      u.departmentName || '',
      u.totalMonthlyCost.toString(),
      u.totalAnnualCost.toString(),
      u.serviceCount.toString(),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saas_users_summary_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('サマリーCSVの出力が完了しました');
  };

  // CSV出力（詳細）
  const handleExportDetailedCSV = () => {
    if (sortedUsers.length === 0) {
      toast.error('出力するデータがありません');
      return;
    }

    const headers = ['ユーザー名', 'メールアドレス', '部門', 'サービス名', 'プラン名', '月額コスト'];
    const rows: string[][] = [];

    sortedUsers.forEach(user => {
      user.assignments.forEach(a => {
        const cost = a.plan?.pricePerUser || a.plan?.fixedPrice || 0;
        rows.push([
          user.userName,
          user.userEmail,
          user.departmentName || '',
          a.service?.name || '',
          a.plan?.planName || '',
          cost.toString(),
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saas_users_detailed_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('詳細CSVの出力が完了しました');
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
          <h1 className="text-3xl font-bold tracking-tight">ユーザー別SaaS利用状況</h1>
          <p className="text-muted-foreground">個人ごとのSaaS利用とコストを管理（DB接続）</p>
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
            onClick={() => router.push('/ja/saas/departments')}
          >
            <Building className="mr-2 h-4 w-4" />
            部門別分析
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummaryCSV}
            disabled={sortedUsers.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            サマリー出力
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDetailedCSV}
            disabled={sortedUsers.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            詳細出力
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      {mounted && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SaaS利用ユーザー</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsersWithSaaS}人</div>
              <p className="text-xs text-muted-foreground">
                DBから取得
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均コスト/人</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{averageCostPerUser.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                月額平均
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最高コストユーザー</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedUsers[0] && sortedUsers[0].totalMonthlyCost > 0 ? (
                <>
                  <div className="text-2xl font-bold">¥{sortedUsers[0].totalMonthlyCost.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {sortedUsers[0].userName}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">データなし</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 検索 */}
      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
          <CardDescription>コスト順に表示しています</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ユーザー名、メールアドレス、部門で検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* ユーザーリスト */}
          <div className="space-y-4">
            {sortedUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">該当するユーザーがいません</p>
                <p className="text-sm">DBにアサインメントデータがありません</p>
              </div>
            ) : (
              sortedUsers.map((user) => (
                <Card key={user.userId} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{user.userName}</h3>
                          {user.departmentName && (
                            <Badge variant="outline">{user.departmentName}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{user.userEmail}</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">月額コスト</p>
                            <p className="text-xl font-bold text-primary">
                              ¥{user.totalMonthlyCost.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">年額コスト</p>
                            <p className="text-xl font-bold">
                              ¥{user.totalAnnualCost.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">利用サービス数</p>
                            <p className="text-xl font-bold">{user.serviceCount}件</p>
                          </div>
                        </div>

                        {/* サービスリスト */}
                        {user.assignments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">利用中のサービス:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {user.assignments.map((assignment) => {
                                const cost = assignment.plan?.pricePerUser || assignment.plan?.fixedPrice || 0;
                                return (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={assignment.status === 'active' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {assignment.service?.name || '不明'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {assignment.plan?.planName || ''}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      ¥{cost.toLocaleString()}/月
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
