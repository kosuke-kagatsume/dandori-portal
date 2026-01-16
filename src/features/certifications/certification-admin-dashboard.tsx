'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  FileCheck,
  RefreshCw,
  ChevronRight,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCertificationDashboard } from '@/hooks/use-certification-notifications';
// useCertificationRenewals, useUserStore - 将来使用予定
import { format } from 'date-fns';
import { CertificationReviewDialog } from './certification-review-dialog';

export function CertificationAdminDashboard() {
  const { dashboard, loading, refetch } = useCertificationDashboard();
  // reviewRenewal, submitting from useCertificationRenewals() - 将来使用予定
  // currentUser from useUserStore() - 将来使用予定
  const [selectedRenewal, setSelectedRenewal] = useState<Record<string, unknown> | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const counts = dashboard?.counts || {
    expired: 0,
    within7Days: 0,
    within14Days: 0,
    within30Days: 0,
    pendingRenewals: 0,
    underReview: 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSendNotification = async (_certificationId: string, _userId: string) => {
    // TODO: 通知送信API呼び出し
    alert('通知送信機能は準備中です');
  };

  const handleOpenReview = (renewal: Record<string, unknown>) => {
    setSelectedRenewal(renewal);
    setReviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ステータスカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">期限切れ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.expired}</div>
            <p className="text-xs text-red-600/80">要対応</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">7日以内</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{counts.within7Days}</div>
            <p className="text-xs text-orange-600/80">緊急対応</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">30日以内</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{counts.within30Days}</div>
            <p className="text-xs text-yellow-600/80">要確認</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">更新申請</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {counts.pendingRenewals + counts.underReview}
            </div>
            <p className="text-xs text-blue-600/80">
              未処理: {counts.pendingRenewals} / 審査中: {counts.underReview}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="expiring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            期限接近
            {counts.within30Days > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts.within30Days}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            期限切れ
            {counts.expired > 0 && (
              <Badge variant="destructive" className="ml-1">
                {counts.expired}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="renewals" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            更新申請
            {(counts.pendingRenewals + counts.underReview) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts.pendingRenewals + counts.underReview}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 期限接近タブ */}
        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>期限接近資格一覧</CardTitle>
              <CardDescription>30日以内に有効期限を迎える資格</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>従業員</TableHead>
                      <TableHead>資格名</TableHead>
                      <TableHead>有効期限</TableHead>
                      <TableHead>残り日数</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboard?.expiringCertifications || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          期限接近の資格はありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboard?.expiringCertifications.map((cert: Record<string, unknown>) => (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cert.user?.name || '不明'}</p>
                              <p className="text-xs text-muted-foreground">
                                {cert.user?.department || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{cert.name}</p>
                              <p className="text-xs text-muted-foreground">{cert.organization}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {cert.expiryDate
                              ? format(new Date(cert.expiryDate), 'yyyy/MM/dd')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                cert.daysUntilExpiry <= 7
                                  ? 'destructive'
                                  : cert.daysUntilExpiry <= 14
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {cert.daysUntilExpiry}日
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendNotification(cert.id, cert.userId)}
                            >
                              <Mail className="mr-1 h-3 w-3" />
                              通知送信
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 期限切れタブ */}
        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>期限切れ資格一覧</CardTitle>
              <CardDescription>有効期限が過ぎている資格</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>従業員</TableHead>
                      <TableHead>資格名</TableHead>
                      <TableHead>有効期限</TableHead>
                      <TableHead>経過日数</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboard?.expiredCertifications || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          期限切れの資格はありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboard?.expiredCertifications.map((cert: Record<string, unknown>) => (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cert.user?.name || '不明'}</p>
                              <p className="text-xs text-muted-foreground">
                                {cert.user?.department || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{cert.name}</p>
                              <p className="text-xs text-muted-foreground">{cert.organization}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {cert.expiryDate
                              ? format(new Date(cert.expiryDate), 'yyyy/MM/dd')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{cert.daysSinceExpiry}日経過</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendNotification(cert.id, cert.userId)}
                            >
                              <Mail className="mr-1 h-3 w-3" />
                              催促通知
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 更新申請タブ */}
        <TabsContent value="renewals">
          <Card>
            <CardHeader>
              <CardTitle>更新申請一覧</CardTitle>
              <CardDescription>審査待ちの更新申請</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>従業員</TableHead>
                      <TableHead>資格名</TableHead>
                      <TableHead>申請日</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead className="text-right">アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboard?.pendingRenewals || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          審査待ちの申請はありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboard?.pendingRenewals.map((renewal: Record<string, unknown>) => (
                        <TableRow key={renewal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{renewal.user?.name || '不明'}</p>
                              <p className="text-xs text-muted-foreground">
                                {renewal.user?.department || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{renewal.certification.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {renewal.certification.organization}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(renewal.createdAt), 'yyyy/MM/dd')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                renewal.status === 'pending' ? 'secondary' : 'outline'
                              }
                            >
                              {renewal.status === 'pending' ? '未処理' : '審査中'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenReview(renewal)}
                            >
                              審査する
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 審査ダイアログ */}
      {selectedRenewal && (
        <CertificationReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          renewal={selectedRenewal}
          onSuccess={() => {
            setSelectedRenewal(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
