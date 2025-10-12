'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, TrendingUp, Users, Download } from 'lucide-react';
import { useSaaSStore } from '@/lib/store/saas-store';
import { useUserStore } from '@/lib/store/user-store';
import { exportAllUsersSaaSToCSV, exportDetailedAllUsersSaaSToCSV } from '@/lib/utils/csv-export';
import { toast } from 'sonner';

export default function SaaSUserListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { getUserSaaSDetails, getUserTotalCost } = useSaaSStore();
  const { users } = useUserStore();

  // アクティブなユーザーのみ
  const activeUsers = users.filter((user) => user.status === 'active');

  // 検索フィルター
  const filteredUsers = useMemo(() => {
    return activeUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [activeUsers, searchQuery]);

  // ユーザー別コスト情報を取得
  const usersWithCost = useMemo(() => {
    return filteredUsers.map((user) => {
      const totalCost = getUserTotalCost(user.id);
      const saasDetails = getUserSaaSDetails(user.id);
      return {
        ...user,
        totalCost,
        serviceCount: saasDetails.length,
        saasDetails,
      };
    });
  }, [filteredUsers, getUserTotalCost, getUserSaaSDetails]);

  // コスト順にソート
  const sortedUsers = useMemo(() => {
    return [...usersWithCost].sort((a, b) => b.totalCost - a.totalCost);
  }, [usersWithCost]);

  // 統計情報
  const totalUsersWithSaaS = sortedUsers.filter((u) => u.serviceCount > 0).length;
  const averageCostPerUser = sortedUsers.length > 0
    ? Math.round(sortedUsers.reduce((sum, u) => sum + u.totalCost, 0) / sortedUsers.length)
    : 0;

  // CSV出力ハンドラー（サマリー版）
  const handleExportSummaryCSV = () => {
    if (sortedUsers.length === 0) {
      toast.error('出力するデータがありません');
      return;
    }

    exportAllUsersSaaSToCSV(sortedUsers);
    toast.success('サマリーCSVの出力が完了しました');
  };

  // CSV出力ハンドラー（詳細版）
  const handleExportDetailedCSV = () => {
    if (sortedUsers.length === 0) {
      toast.error('出力するデータがありません');
      return;
    }

    const allUsersDetails = sortedUsers.map((user) => ({
      userName: user.name,
      userEmail: user.email,
      userDepartment: user.department,
      saasDetails: user.saasDetails,
    }));

    exportDetailedAllUsersSaaSToCSV(allUsersDetails);
    toast.success('詳細CSVの出力が完了しました');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/ja/saas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">ユーザー別SaaS利用状況</h1>
          <p className="text-muted-foreground">個人ごとのSaaS利用とコストを管理</p>
        </div>
        <div className="flex gap-2">
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SaaS利用ユーザー</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsersWithSaaS}人</div>
            <p className="text-xs text-muted-foreground">
              全体: {activeUsers.length}人
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
            {sortedUsers[0] && sortedUsers[0].totalCost > 0 ? (
              <>
                <div className="text-2xl font-bold">¥{sortedUsers[0].totalCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {sortedUsers[0].name}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">データなし</div>
            )}
          </CardContent>
        </Card>
      </div>

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
              </div>
            ) : (
              sortedUsers.map((user) => (
                <Card key={user.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          {user.department && (
                            <Badge variant="outline">{user.department}</Badge>
                          )}
                          {user.role && (
                            <Badge variant="secondary">{user.role}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{user.email}</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">月額コスト</p>
                            <p className="text-xl font-bold text-primary">
                              ¥{user.totalCost.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">年額コスト</p>
                            <p className="text-xl font-bold">
                              ¥{(user.totalCost * 12).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">利用サービス数</p>
                            <p className="text-xl font-bold">{user.serviceCount}件</p>
                          </div>
                        </div>

                        {/* サービスリスト */}
                        {user.saasDetails.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">利用中のサービス:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {user.saasDetails.map((detail) => (
                                <div
                                  key={detail.assignment.id}
                                  className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={detail.assignment.status === 'active' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {detail.service.name}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {detail.plan.planName}
                                    </span>
                                  </div>
                                  <span className="text-sm font-medium">
                                    ¥{detail.monthlyCost.toLocaleString()}/月
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/ja/users/${user.id}`)}
                      >
                        詳細
                      </Button>
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
