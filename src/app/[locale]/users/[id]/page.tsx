'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mail, Phone, Calendar, Building, Shield, CreditCard, Download } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { useSaaSStore } from '@/lib/store/saas-store';
import { categoryLabels } from '@/types/saas';
import { exportUserSaaSToCSV } from '@/lib/utils/csv-export';
import { toast } from 'sonner';

export default function UserDetailPage({ params }: { params: { id: string; locale: string } }) {
  const router = useRouter();
  const { users } = useUserStore();
  const { getUserSaaSDetails, getUserTotalCost } = useSaaSStore();

  // ユーザー情報を取得
  const user = useMemo(() => {
    return users.find((u) => u.id === params.id);
  }, [users, params.id]);

  // SaaS利用情報を取得
  const saasDetails = useMemo(() => {
    if (!user) return [];
    return getUserSaaSDetails(user.id);
  }, [user, getUserSaaSDetails]);

  const totalCost = useMemo(() => {
    if (!user) return 0;
    return getUserTotalCost(user.id);
  }, [user, getUserTotalCost]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/ja/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">ユーザーが見つかりません</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">指定されたユーザーが見つかりませんでした。</p>
            <Button onClick={() => router.push('/ja/users')} className="mt-4">
              ユーザー一覧に戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabels = {
    active: '有効',
    inactive: '無効',
    suspended: '停止',
    retired: '退職',
  };

  const statusColors = {
    active: 'default',
    inactive: 'secondary',
    suspended: 'destructive',
    retired: 'outline',
  } as const;

  // CSV出力ハンドラー
  const handleExportCSV = () => {
    if (saasDetails.length === 0) {
      toast.error('出力するデータがありません');
      return;
    }

    exportUserSaaSToCSV(
      user.name,
      user.email,
      user.department || '',
      saasDetails
    );

    toast.success('CSV出力が完了しました');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/ja/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">ユーザー詳細</h1>
          <p className="text-muted-foreground">ユーザー情報とSaaS利用状況</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/ja/users')}>
          編集
        </Button>
      </div>

      {/* プロフィールカード */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <Badge variant={statusColors[user.status]}>
                    {statusLabels[user.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{user.department}</span>
                    </div>
                  )}
                  {user.hireDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>入社日: {new Date(user.hireDate).toLocaleDateString('ja-JP')}</span>
                    </div>
                  )}
                </div>
              </div>
              {user.roles && user.roles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タブコンテンツ */}
      <Tabs defaultValue="basic" className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="saas">SaaS利用</TabsTrigger>
          <TabsTrigger value="attendance">勤怠</TabsTrigger>
          <TabsTrigger value="payroll">給与</TabsTrigger>
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>ユーザーの詳細情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ユーザーID</p>
                  <p className="text-sm mt-1">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ステータス</p>
                  <p className="text-sm mt-1">
                    <Badge variant={statusColors[user.status]}>
                      {statusLabels[user.status]}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">氏名</p>
                  <p className="text-sm mt-1">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">メールアドレス</p>
                  <p className="text-sm mt-1">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">電話番号</p>
                    <p className="text-sm mt-1">{user.phone}</p>
                  </div>
                )}
                {user.department && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">部門</p>
                    <p className="text-sm mt-1">{user.department}</p>
                  </div>
                )}
                {user.role && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">役職</p>
                    <p className="text-sm mt-1">{user.role}</p>
                  </div>
                )}
                {user.hireDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">入社日</p>
                    <p className="text-sm mt-1">
                      {new Date(user.hireDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
                {user.status === 'retired' && user.retiredDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">退職日</p>
                    <p className="text-sm mt-1">
                      {new Date(user.retiredDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SaaS利用タブ */}
        <TabsContent value="saas" className="space-y-4">
          {/* コストサマリー */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">月額コスト</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ¥{totalCost.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  個人負担分の月額
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">年額コスト</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{(totalCost * 12).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  年間コスト予測
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">利用サービス数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {saasDetails.length}件
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  アクティブなサービス
                </p>
              </CardContent>
            </Card>
          </div>

          {/* サービス一覧 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>利用中のSaaSサービス</CardTitle>
                  <CardDescription>
                    個人が利用しているSaaSサービスとコスト内訳
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={saasDetails.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV出力
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {saasDetails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium">利用中のSaaSサービスはありません</p>
                  <p className="text-sm">サービスの割り当てを行ってください</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {saasDetails.map((detail) => (
                    <Card key={detail.assignment.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg">{detail.service.name}</h4>
                              <Badge
                                variant={detail.assignment.status === 'active' ? 'default' : 'secondary'}
                              >
                                {detail.assignment.status === 'active' ? 'アクティブ' : '非アクティブ'}
                              </Badge>
                              <Badge variant="outline">
                                {categoryLabels[detail.service.category]}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                              <div>
                                <p className="font-medium">プラン</p>
                                <p>{detail.plan.planName}</p>
                              </div>
                              <div>
                                <p className="font-medium">割り当て日</p>
                                <p>
                                  {new Date(detail.assignment.assignedAt).toLocaleDateString('ja-JP')}
                                </p>
                              </div>
                              {detail.assignment.lastUsedAt && (
                                <div>
                                  <p className="font-medium">最終利用日</p>
                                  <p>
                                    {new Date(detail.assignment.lastUsedAt).toLocaleDateString('ja-JP')}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="font-medium">月額コスト</p>
                                <p className="text-lg font-bold text-primary">
                                  ¥{detail.monthlyCost.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/ja/saas/${detail.service.id}`)}
                          >
                            詳細
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 勤怠タブ（未実装） */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>勤怠情報</CardTitle>
              <CardDescription>出勤・退勤の記録と統計</CardDescription>
            </CardHeader>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">勤怠情報は準備中です</p>
                <p className="text-sm">今後のアップデートで実装予定</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 給与タブ（未実装） */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>給与情報</CardTitle>
              <CardDescription>給与明細と支払い履歴</CardDescription>
            </CardHeader>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">給与情報は準備中です</p>
                <p className="text-sm">今後のアップデートで実装予定</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
