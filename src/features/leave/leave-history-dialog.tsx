'use client';

import { useMemo } from 'react';
import { useLeaveTypeStore } from '@/lib/store/leave-type-store';
import { useLeaveManagementStore } from '@/lib/store/leave-management-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CalendarDays,
  History,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface LeaveHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function LeaveHistoryDialog({
  open,
  onOpenChange,
  userId,
}: LeaveHistoryDialogProps) {
  const { getUserPaidLeaveGrants, getActiveGrants } = useLeaveTypeStore();
  const { getUserRequests, getLeaveBalance } = useLeaveManagementStore();

  const currentYear = new Date().getFullYear();
  const balance = getLeaveBalance(userId, currentYear);

  // 有給休暇付与履歴
  const paidLeaveGrants = useMemo(() => {
    return getUserPaidLeaveGrants(userId);
  }, [getUserPaidLeaveGrants, userId]);

  // 有効な付与（失効していないもの）
  const activeGrants = useMemo(() => {
    return getActiveGrants(userId);
  }, [getActiveGrants, userId]);

  // 休暇使用履歴
  const leaveRequests = useMemo(() => {
    return getUserRequests(userId).filter(
      (r) => r.status === 'approved' && (r.type === 'paid' || r.type === 'half_day_am' || r.type === 'half_day_pm')
    );
  }, [getUserRequests, userId]);

  // 今後失効予定の日数を計算
  const expiringGrants = useMemo(() => {
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    return activeGrants.filter((grant) => {
      const expiryDate = parseISO(grant.expiryDate);
      return expiryDate <= threeMonthsLater && grant.remainingDays > 0;
    });
  }, [activeGrants]);

  // 総残日数
  const totalRemaining = useMemo(() => {
    return activeGrants.reduce((sum, grant) => sum + grant.remainingDays, 0);
  }, [activeGrants]);

  // サマリーカード用データ
  const summaryData = useMemo(() => {
    const totalGranted = paidLeaveGrants.reduce((sum, g) => sum + g.grantDays, 0);
    const totalUsed = paidLeaveGrants.reduce((sum, g) => sum + g.usedDays, 0);
    const expiringSoon = expiringGrants.reduce((sum, g) => sum + g.remainingDays, 0);

    return {
      totalGranted,
      totalUsed,
      totalRemaining,
      expiringSoon,
    };
  }, [paidLeaveGrants, expiringGrants, totalRemaining]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      paid: '全日',
      half_day_am: '午前休',
      half_day_pm: '午後休',
    };
    return labels[type] || type;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return '失効済み';
    if (days === 0) return '本日失効';
    if (days <= 30) return `あと${days}日`;
    if (days <= 90) return `あと${Math.floor(days / 30)}ヶ月`;
    return format(parseISO(expiryDate), 'yyyy/MM/dd');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            有給休暇履歴
          </DialogTitle>
          <DialogDescription>
            有給休暇の付与・使用・失効の履歴を確認できます
          </DialogDescription>
        </DialogHeader>

        {/* サマリーカード */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                累計付与
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {summaryData.totalGranted}
                <span className="text-sm font-normal text-muted-foreground ml-1">日</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4" />
                累計使用
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {summaryData.totalUsed}
                <span className="text-sm font-normal text-muted-foreground ml-1">日</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                残日数
              </div>
              <div className="text-2xl font-bold text-green-600">
                {summaryData.totalRemaining}
                <span className="text-sm font-normal text-muted-foreground ml-1">日</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4" />
                失効予定
              </div>
              <div className={`text-2xl font-bold ${summaryData.expiringSoon > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {summaryData.expiringSoon}
                <span className="text-sm font-normal text-muted-foreground ml-1">日</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 失効警告 */}
        {expiringGrants.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">
                    失効予定の有給休暇があります
                  </h4>
                  <div className="mt-2 space-y-1">
                    {expiringGrants.map((grant) => (
                      <div key={grant.id} className="text-sm text-red-700 dark:text-red-300">
                        {format(parseISO(grant.expiryDate), 'yyyy年M月d日', { locale: ja })}に
                        <span className="font-medium"> {grant.remainingDays}日 </span>
                        が失効します（{getDaysUntilExpiry(grant.expiryDate)}）
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="grants" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grants" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              付与履歴
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              使用履歴
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grants" className="mt-4">
            {paidLeaveGrants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>付与日</TableHead>
                    <TableHead>付与理由</TableHead>
                    <TableHead className="text-right">付与日数</TableHead>
                    <TableHead className="text-right">使用日数</TableHead>
                    <TableHead className="text-right">残日数</TableHead>
                    <TableHead>失効日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidLeaveGrants.map((grant) => {
                    const isExpired = parseISO(grant.expiryDate) < new Date();
                    const isExpiringSoon = expiringGrants.some((g) => g.id === grant.id);

                    return (
                      <TableRow key={grant.id} className={isExpired ? 'opacity-50' : ''}>
                        <TableCell>
                          {format(parseISO(grant.grantDate), 'yyyy/MM/dd')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {grant.grantReason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          +{grant.grantDays}日
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          -{grant.usedDays}日
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {grant.remainingDays}日
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={isExpired ? 'line-through' : ''}>
                              {format(parseISO(grant.expiryDate), 'yyyy/MM/dd')}
                            </span>
                            {isExpired && (
                              <Badge variant="secondary" className="text-xs">失効</Badge>
                            )}
                            {!isExpired && isExpiringSoon && (
                              <Badge variant="destructive" className="text-xs">
                                {getDaysUntilExpiry(grant.expiryDate)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>付与履歴がありません</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="usage" className="mt-4">
            {leaveRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申請日</TableHead>
                    <TableHead>休暇期間</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead className="text-right">日数</TableHead>
                    <TableHead>理由</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {format(parseISO(request.createdAt), 'yyyy/MM/dd')}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(request.startDate), 'MM/dd')}
                        {request.startDate !== request.endDate && (
                          <>〜{format(parseISO(request.endDate), 'MM/dd')}</>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(request.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        -{request.days}日
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-sm">
                        {request.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>使用履歴がありません</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 消化状況 */}
        {balance && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">今年度の消化状況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>使用日数</span>
                  <span>{balance.paidLeave.used} / {balance.paidLeave.total}日</span>
                </div>
                <Progress
                  value={(balance.paidLeave.used / balance.paidLeave.total) * 100}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>推奨: 5日以上（年5日取得義務）</span>
                  <span>
                    {balance.paidLeave.used >= 5 ? '✓ 達成' : `あと${5 - balance.paidLeave.used}日`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
