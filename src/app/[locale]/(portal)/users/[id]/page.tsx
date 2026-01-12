'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Phone, Calendar, Building, Shield, CreditCard, Download, Clock, TrendingUp, Edit, Loader2 } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { useSaaSStore } from '@/lib/store/saas-store';
import { useAttendanceHistoryStore } from '@/lib/store/attendance-history-store';
import { usePayrollStore } from '@/lib/store/payroll-store';
import { UserFormDialog } from '@/features/users/user-form-dialog';
import { categoryLabels } from '@/types/saas';
import { exportUserSaaSToCSV } from '@/lib/utils/csv-export';
import { toast } from 'sonner';
import type { User } from '@/types';

export default function UserDetailPage({ params }: { params: { id: string; locale: string } }) {
  const router = useRouter();
  const { users, setUsers } = useUserStore();
  const { getUserSaaSDetails, getUserTotalCost } = useSaaSStore();
  const { records: attendanceRecords } = useAttendanceHistoryStore();
  const { calculations: payrollCalculations } = usePayrollStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 現在のユーザーからtenantIdを取得
  const currentUser = useUserStore(state => state.currentUser);
  const tenantId = currentUser?.tenantId || '';

  // 経営者は閲覧のみ（編集不可）
  const isExecutive = currentUser?.role === 'executive';

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

  // 給与データを取得（直近12ヶ月）
  const userPayrollCalculations = useMemo(() => {
    if (!user) return [];

    return payrollCalculations
      .filter((calc) => calc.employeeId === user.id)
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, 12);
  }, [user, payrollCalculations]);

  // 給与統計を計算
  const payrollStats = useMemo(() => {
    const totalSalaries = userPayrollCalculations.reduce((sum, calc) => sum + calc.netSalary, 0);
    const avgSalary = userPayrollCalculations.length > 0 ? totalSalaries / userPayrollCalculations.length : 0;
    const latestSalary = userPayrollCalculations[0]?.netSalary || 0;

    return {
      avgMonthlySalary: Math.floor(avgSalary),
      totalAnnualSalary: Math.floor(totalSalaries),
      latestSalary: Math.floor(latestSalary),
      recordCount: userPayrollCalculations.length,
    };
  }, [userPayrollCalculations]);

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

  // ユーザー編集ハンドラー
  const handleEditUser = async (data: {
    name: string;
    email: string;
    phone?: string;
    department: string;
    position: string;
    hireDate: Date;
    status: 'active' | 'inactive' | 'suspended' | 'retired';
    roles: string[];
  }) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          position: data.position,
          hireDate: data.hireDate.toISOString().split('T')[0],
          status: data.status,
          roles: data.roles,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user');
      }

      // ストアを更新
      setUsers(users.map((u) => (u.id === user.id ? result.data : u)));
      toast.success('ユーザー情報を更新しました');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('ユーザー情報の更新に失敗しました');
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
        {/* 経営者は編集不可 */}
        {!isExecutive && (
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
        )}
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

        {/* 勤怠タブ */}
        <TabsContent value="attendance" className="space-y-4">
          {/* 統計カード */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">出勤日数</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.totalDays}日</div>
                <p className="text-xs text-muted-foreground mt-1">
                  直近6ヶ月
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総労働時間</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.totalWorkHours}時間</div>
                <p className="text-xs text-muted-foreground mt-1">
                  1日平均: {attendanceStats.avgWorkHoursPerDay}時間
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">残業時間</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {attendanceStats.totalOvertimeHours}時間
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  直近6ヶ月累計
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 勤怠履歴 */}
          <Card>
            <CardHeader>
              <CardTitle>勤怠履歴</CardTitle>
              <CardDescription>直近6ヶ月の出退勤記録</CardDescription>
            </CardHeader>
            <CardContent>
              {userAttendanceRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium">勤怠記録がありません</p>
                  <p className="text-sm">勤怠データが記録されていません</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>出勤時刻</TableHead>
                      <TableHead>退勤時刻</TableHead>
                      <TableHead>勤務時間</TableHead>
                      <TableHead>残業</TableHead>
                      <TableHead>勤務場所</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAttendanceRecords.map((record) => {
                      const statusLabels = {
                        present: '出勤',
                        absent: '欠勤',
                        holiday: '休日',
                        leave: '休暇',
                        late: '遅刻',
                        early: '早退',
                      };

                      const statusColors = {
                        present: 'default',
                        absent: 'destructive',
                        holiday: 'secondary',
                        leave: 'outline',
                        late: 'secondary',
                        early: 'secondary',
                      } as const;

                      const locationLabels = {
                        office: 'オフィス',
                        home: '在宅',
                        client: '客先',
                        other: 'その他',
                      };

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {new Date(record.date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            {record.checkIn
                              ? new Date(record.checkIn).toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record.checkOut
                              ? new Date(record.checkOut).toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record.workMinutes > 0
                              ? `${Math.floor(record.workMinutes / 60)}:${String(
                                  record.workMinutes % 60
                                ).padStart(2, '0')}`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record.overtimeMinutes > 0 ? (
                              <span className="text-orange-600 font-medium">
                                {Math.floor(record.overtimeMinutes / 60)}:
                                {String(record.overtimeMinutes % 60).padStart(2, '0')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{locationLabels[record.workLocation]}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[record.status]}>
                              {statusLabels[record.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 給与タブ */}
        <TabsContent value="payroll" className="space-y-4">
          {/* 統計カード */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均月額</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  ¥{payrollStats.avgMonthlySalary.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {payrollStats.recordCount}ヶ月の平均
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">年間総額</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{payrollStats.totalAnnualSalary.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  直近{payrollStats.recordCount}ヶ月の累計
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最新月</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{payrollStats.latestSalary.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {userPayrollCalculations[0]?.period || '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 給与明細一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>給与明細一覧</CardTitle>
              <CardDescription>直近12ヶ月の給与計算結果</CardDescription>
            </CardHeader>
            <CardContent>
              {userPayrollCalculations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg font-medium">給与データがありません</p>
                  <p className="text-sm">給与計算が実行されていません</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>期間</TableHead>
                      <TableHead>支給額</TableHead>
                      <TableHead>控除額</TableHead>
                      <TableHead>差引支給額</TableHead>
                      <TableHead>労働時間</TableHead>
                      <TableHead>残業時間</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userPayrollCalculations.map((calc) => {
                      const statusLabels = {
                        draft: '下書き',
                        approved: '承認済',
                        paid: '支払済',
                      };

                      const statusColors = {
                        draft: 'outline',
                        approved: 'secondary',
                        paid: 'default',
                      } as const;

                      return (
                        <TableRow key={calc.id}>
                          <TableCell className="font-medium">{calc.period}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            ¥{calc.grossSalary.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-red-600">
                            ¥{calc.totalDeductions.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-lg font-bold text-primary">
                            ¥{calc.netSalary.toLocaleString()}
                          </TableCell>
                          <TableCell>{calc.totalWorkHours.toFixed(1)}h</TableCell>
                          <TableCell>
                            {calc.overtimeHours > 0 ? (
                              <span className="text-orange-600 font-medium">
                                {calc.overtimeHours.toFixed(1)}h
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[calc.status]}>
                              {statusLabels[calc.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
