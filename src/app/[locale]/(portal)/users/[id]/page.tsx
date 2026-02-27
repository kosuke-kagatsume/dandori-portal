'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mail, Phone, Calendar, Building, Shield, CreditCard, Download, Edit, Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { useSaaSStore } from '@/lib/store/saas-store';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';
import { UserFormDialog } from '@/features/users/user-form-dialog';
import { UserAttendanceTab } from '@/features/users/user-attendance-tab';
import { UserQualificationTab } from '@/features/users/user-qualification-tab';
import { UserPayrollTab } from '@/features/users/user-payroll-tab';
import { categoryLabels } from '@/types/saas';
import { exportUserSaaSToCSV } from '@/lib/utils/csv-export';
import { toast } from 'sonner';
import type { User } from '@/types';

export default function UserDetailPage({ params }: { params: { id: string; locale: string } }) {
  const router = useRouter();
  const { users, setUsers } = useUserStore();
  const { getUserSaaSDetails, getUserTotalCost } = useSaaSStore();
  const { records: attendanceRecords } = useAttendanceHistoryStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 現在のユーザーからtenantIdを取得
  const currentUser = useUserStore(state => state.currentUser);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tenantId = currentUser?.tenantId || ''; // API呼び出しで使用予定

  // 人事(hr)のみ編集可能
  const isHR = currentUser?.roles?.includes('hr');
  const isReadOnly = !isHR;

  // API経由でユーザーデータを取得
  useEffect(() => {
    const fetchUser = async () => {
      if (!params.id) {
        setLoading(false);
        return;
      }

      try {
        // ユーザー詳細を取得
        const response = await fetch(`/api/users/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          const apiUser: User = data.data;
          if (apiUser) {
            // ストア内のユーザーを更新（存在しない場合は追加）
            const existingUserIndex = users.findIndex(u => u.id === apiUser.id);
            if (existingUserIndex === -1) {
              setUsers([...users, apiUser]);
            }
          }
        }
      } catch (error) {
        console.error('ユーザーデータの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    // ストアにユーザーがない場合のみAPIから取得
    const existingUser = users.find(u => u.id === params.id);
    if (!existingUser) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [params.id, users, setUsers]);

  // 勤怠・給与データはストアから取得（現在はストアにデータがあれば使用、なければ空表示）
  // 将来的にはAPIから取得するように変更可能

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

  // 勤怠データを取得（直近6ヶ月）
  const userAttendanceRecords = useMemo(() => {
    if (!user) return [];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return attendanceRecords
      .filter((record) => {
        if (record.userId !== user.id) return false;
        const recordDate = new Date(record.date);
        return recordDate >= sixMonthsAgo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user, attendanceRecords]);

  // 勤怠統計を計算
  const attendanceStats = useMemo(() => {
    const totalDays = userAttendanceRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'early').length;
    const totalWorkMinutes = userAttendanceRecords.reduce((sum, r) => sum + r.workMinutes, 0);
    const totalOvertimeMinutes = userAttendanceRecords.reduce((sum, r) => sum + r.overtimeMinutes, 0);

    return {
      totalDays,
      totalWorkHours: Math.floor(totalWorkMinutes / 60),
      totalOvertimeHours: Math.floor(totalOvertimeMinutes / 60),
      avgWorkHoursPerDay: totalDays > 0 ? (totalWorkMinutes / 60 / totalDays).toFixed(1) : '0.0',
    };
  }, [userAttendanceRecords]);

  // ローディング中
  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    active: '在籍中',
    inactive: '入社予定',
    suspended: '休職中',
    retired: '退職済み',
  };

  const statusColors = {
    active: 'default',
    inactive: 'secondary',
    suspended: 'destructive',
    retired: 'outline',
  } as const;

  // ユーザー編集ハンドラー
  const handleEditUser = async (data: {
    name: string;
    nameKana?: string;
    employeeNumber?: string;
    email: string;
    phone?: string;
    department: string;
    position: string;
    employmentType?: string;
    hireDate: Date;
    birthDate?: Date | null;
    gender?: string;
    postalCode?: string;
    address?: string;
    status: 'active' | 'inactive' | 'suspended' | 'retired';
    roles: string[];
  }) => {
    if (!user) return;

    try {
      // 日付をローカルタイムゾーンで YYYY-MM-DD 形式に変換（UTCへの変換を回避）
      const hireDateStr = `${data.hireDate.getFullYear()}-${String(data.hireDate.getMonth() + 1).padStart(2, '0')}-${String(data.hireDate.getDate()).padStart(2, '0')}`;
      const birthDateStr = data.birthDate
        ? `${data.birthDate.getFullYear()}-${String(data.birthDate.getMonth() + 1).padStart(2, '0')}-${String(data.birthDate.getDate()).padStart(2, '0')}`
        : undefined;

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          nameKana: data.nameKana,
          employeeNumber: data.employeeNumber,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          employmentType: data.employmentType,
          hireDate: hireDateStr,
          birthDate: birthDateStr,
          gender: data.gender || undefined,
          postalCode: data.postalCode || undefined,
          address: data.address || undefined,
          status: data.status,
          roles: data.roles,
        }),
      });

      // HTTPステータスコードをチェック
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || `HTTP ${response.status}: Failed to update user`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      // ストアを更新
      setUsers(users.map((u) => (u.id === user.id ? result.data : u)));
      toast.success('ユーザー情報を更新しました');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'ユーザー情報の更新に失敗しました');
      throw error;
    }
  };

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
                  {user.status === 'retired' && user.retiredDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-destructive">退職日: {new Date(user.retiredDate).toLocaleDateString('ja-JP')}</span>
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
      {(() => {
        // 権限ベースのタブ表示制御
        const userRoles = currentUser?.roles || [];
        const isHRRole = userRoles.includes('hr');
        const isExecutive = userRoles.includes('executive');
        const visibleTabs = [
          { value: 'basic', label: '基本情報' },
          { value: 'saas', label: 'SaaS利用' },
          // 勤怠: 人事のみ
          ...(isHRRole ? [{ value: 'attendance', label: '勤怠' }] : []),
          // 資格情報: 経営者・人事のみ
          ...(isExecutive || isHRRole ? [{ value: 'qualification', label: '資格情報' }] : []),
          // 給与: 人事のみ
          ...(isHRRole ? [{ value: 'payroll', label: '給与' }] : []),
        ];
        const gridColsMap: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5' };
        const gridCols = gridColsMap[visibleTabs.length] || `grid-cols-${visibleTabs.length}`;

        return (
      <Tabs defaultValue="basic" className="space-y-4 w-full">
        <TabsList className={`grid w-full ${gridCols}`}>
          {visibleTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* 基本情報タブ */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>基本情報</CardTitle>
                  <CardDescription>ユーザーの詳細情報</CardDescription>
                </div>
                {!isReadOnly && (
                  <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </Button>
                )}
              </div>
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
                {user.employeeNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">社員番号</p>
                    <p className="text-sm mt-1">{user.employeeNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">氏名</p>
                  <p className="text-sm mt-1">{user.name}</p>
                </div>
                {user.nameKana && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">フリガナ</p>
                    <p className="text-sm mt-1">{user.nameKana}</p>
                  </div>
                )}
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
                    <p className="text-sm font-medium text-muted-foreground">部署</p>
                    <p className="text-sm mt-1">{user.department}</p>
                  </div>
                )}
                {user.position && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">役職</p>
                    <p className="text-sm mt-1">{user.position}</p>
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
                {user.employmentType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">雇用形態</p>
                    <p className="text-sm mt-1">
                      {{ regular: '正社員', contract: '契約社員', part_time: 'パートタイム', temporary: '派遣社員', intern: 'インターン', executive: '役員' }[user.employmentType] || user.employmentType}
                    </p>
                  </div>
                )}
                {user.birthDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">生年月日</p>
                    <p className="text-sm mt-1">
                      {new Date(user.birthDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
                {user.gender && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">性別</p>
                    <p className="text-sm mt-1">
                      {{ male: '男性', female: '女性', other: 'その他', prefer_not_to_say: '回答しない' }[user.gender] || user.gender}
                    </p>
                  </div>
                )}
                {(user.postalCode || user.address) && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">住所</p>
                    <p className="text-sm mt-1">
                      {user.postalCode && `〒${user.postalCode} `}{user.address}
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
                  個人利用分
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
                                {categoryLabels[detail.service.category as keyof typeof categoryLabels] || detail.service.category}
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
                                  {new Date(detail.assignment.assignedAt as string).toLocaleDateString('ja-JP')}
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

        {/* 勤怠タブ */}
        <TabsContent value="attendance" className="space-y-4">
          <UserAttendanceTab
            user={user}
            attendanceRecords={userAttendanceRecords}
            attendanceStats={attendanceStats}
            transferHistory={[]}
            workRule={undefined}  // TODO: 就業ルールマスタから取得
            isReadOnly={isReadOnly}
            onEdit={() => setEditDialogOpen(true)}
          />
        </TabsContent>

        {/* 資格情報タブ */}
        <TabsContent value="qualification" className="space-y-4">
          <UserQualificationTab
            user={user}
            isReadOnly={isReadOnly}
            isHR={!!isHR}
          />
        </TabsContent>

        {/* 給与タブ（HRのみ） */}
        {isHRRole && <TabsContent value="payroll" className="space-y-4">
          <UserPayrollTab
            user={user}
            isReadOnly={isReadOnly}
            isHR={!!isHR}
            onEdit={() => setEditDialogOpen(true)}
          />
        </TabsContent>}
      </Tabs>
        );
      })()}

      {/* 編集ダイアログ */}
      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
        onSubmit={handleEditUser}
      />
    </div>
  );
}
