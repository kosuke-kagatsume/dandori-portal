'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, AlertCircle, Users, Building, Database, Download, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { useSaaSServicesAPI, type SaaSServiceFromAPI } from '@/hooks/use-saas-api';
import { CreateServiceDialog } from '@/features/saas/create-service-dialog';
import { toast } from 'sonner';

// カテゴリラベル
const categoryLabels: Record<string, string> = {
  productivity: '生産性ツール',
  communication: 'コミュニケーション',
  project_management: 'プロジェクト管理',
  hr: '人事・採用',
  finance: '会計・財務',
  marketing: 'マーケティング',
  sales: '営業・CRM',
  development: '開発ツール',
  security: 'セキュリティ',
  other: 'その他',
};

// ライセンスタイプラベル
const licenseTypeLabels: Record<string, string> = {
  per_user: 'ユーザー単位',
  per_seat: 'シート単位',
  enterprise: 'エンタープライズ',
  flat_rate: '定額制',
  usage_based: '従量課金',
  freemium: 'フリーミアム',
};

type SaaSCategory = keyof typeof categoryLabels;
type LicenseType = keyof typeof licenseTypeLabels;

export default function SaaSManagementPage() {
  const router = useRouter();

  // APIからデータ取得（最適化: 2 API → 1 API）
  const {
    services,
    loading: servicesLoading,
    fetchServices,
    deleteService,
    getTotalServices,
    getTotalLicenses,
    getActiveLicenses,
    getTotalMonthlyCost,
    getUnusedLicensesCost,
  } = useSaaSServicesAPI();

  // servicesからassignmentsを抽出（CSV出力用）
  const assignments = useMemo(() => {
    return services.flatMap(service =>
      (service.assignments || []).map(a => ({
        ...a,
        service: { id: service.id, name: service.name, category: service.category },
        plan: service.plans?.find(p => p.id === a.planId) || null,
      }))
    );
  }, [services]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SaaSCategory | 'all'>('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<LicenseType | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  const isLoading = servicesLoading;

  // クライアントサイドでのみマウント状態を管理
  useEffect(() => {
    setMounted(true);
  }, []);

  // フィルタリング
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.vendor && service.vendor.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
      const matchesLicenseType = licenseTypeFilter === 'all' || service.licenseType === licenseTypeFilter;

      return matchesSearch && matchesCategory && matchesLicenseType;
    });
  }, [services, searchQuery, categoryFilter, licenseTypeFilter]);

  // 統計情報（メモ化）
  const stats = useMemo(() => ({
    totalServices: getTotalServices(),
    totalLicenses: getTotalLicenses(),
    activeLicenses: getActiveLicenses(),
    totalMonthlyCost: getTotalMonthlyCost(),
    unusedLicensesCost: getUnusedLicensesCost(),
  }), [getTotalServices, getTotalLicenses, getActiveLicenses, getTotalMonthlyCost, getUnusedLicensesCost]);

  // データ更新ハンドラー（最適化済み: 1 APIのみ）
  const handleRefreshData = () => {
    fetchServices();
    toast.success('データを更新しました');
  };

  // 削除ハンドラー
  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`サービス「${name}」を削除してもよろしいですか？`)) {
      const result = await deleteService(id);
      if (result.success) {
        toast.success('サービスを削除しました');
      } else {
        toast.error(result.error || '削除に失敗しました');
      }
    }
  };

  // サービスのコスト計算ヘルパー
  const getServiceMonthlyCost = (s: SaaSServiceFromAPI) => {
    const plan = s.plans?.[0];
    if (!plan) return 0;
    if (plan.pricePerUser) {
      return plan.pricePerUser * (s.assignments?.length || 0);
    }
    return plan.fixedPrice || 0;
  };

  // SaaSサービスCSV出力ハンドラー
  const handleExportServicesCSV = () => {
    try {
      const headers = ['サービス名', 'ベンダー', 'カテゴリ', 'ライセンスタイプ', 'ユーザー数', 'プラン名', '月額コスト', '契約終了日', 'ステータス'];
      const rows = filteredServices.map(s => {
        const plan = s.plans?.[0];
        return [
          s.name,
          s.vendor || '',
          categoryLabels[s.category] || s.category,
          licenseTypeLabels[s.licenseType] || s.licenseType,
          (s.assignments?.length || 0).toString(),
          plan?.planName || '',
          getServiceMonthlyCost(s).toString(),
          s.contractEndDate || '',
          s.isActive ? '有効' : '無効',
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `saas_services_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success(`CSV出力完了: ${filteredServices.length}件`);
    } catch (error) {
      console.error('Failed to export services CSV:', error);
      toast.error('CSV出力に失敗しました');
    }
  };

  // ライセンス割り当てCSV出力ハンドラー
  const handleExportAssignmentsCSV = () => {
    try {
      const headers = ['サービス名', 'プラン名', 'ユーザー名', 'メールアドレス', '部署', '月額コスト', '割当日', 'ステータス'];
      const rows = assignments.map(a => {
        const cost = a.plan?.pricePerUser || a.plan?.fixedPrice || 0;
        return [
          a.service?.name || '',
          a.plan?.planName || '',
          a.userName || '',
          a.userEmail || '',
          a.departmentName || '',
          cost.toString(),
          a.assignedDate || '',
          a.status === 'active' ? '有効' : '無効',
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `saas_assignments_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success(`CSV出力完了: ${assignments.length}件`);
    } catch (error) {
      console.error('Failed to export assignments CSV:', error);
      toast.error('CSV出力に失敗しました');
    }
  };

  // ローディング表示
  if (isLoading && services.length === 0) {
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS管理</h1>
          <p className="text-muted-foreground">
            社内で利用しているSaaSサービスのライセンスとコストを一元管理（DB接続）
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {mounted && (
            <>
              <Button variant="outline" onClick={handleRefreshData} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                更新
              </Button>
              {services.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportServicesCSV} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    サービスCSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportAssignmentsCSV} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    割り当てCSV
                  </Button>
                </>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => router.push('/ja/saas/users')} className="w-full sm:w-auto">
            <Users className="mr-2 h-4 w-4" />
            ユーザー別利用
          </Button>
          <Button variant="outline" onClick={() => router.push('/ja/saas/departments')} className="w-full sm:w-auto">
            <Building className="mr-2 h-4 w-4" />
            部署別分析
          </Button>
          <CreateServiceDialog onServiceCreated={handleRefreshData} />
        </div>
      </div>

      {/* サマリーカード */}
      {mounted ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総サービス数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                契約中のサービス
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ライセンス数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLicenses}</div>
              <p className="text-xs text-muted-foreground">
                アクティブ: {stats.activeLicenses}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">月額総コスト</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{stats.totalMonthlyCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                今月の支払い予定額
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">削減可能額</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                ¥{stats.unusedLicensesCost.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                未使用ライセンス
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">読み込み中...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">読み込み中...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>サービス一覧</CardTitle>
          <CardDescription>
            フィルターで絞り込んで検索できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="サービス名またはベンダー名で検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as SaaSCategory | 'all')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="カテゴリ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={licenseTypeFilter} onValueChange={(value) => setLicenseTypeFilter(value as LicenseType | 'all')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="ライセンスタイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {Object.entries(licenseTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* サービスリスト */}
          <div className="space-y-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">サービスが登録されていません</p>
                <p className="text-sm text-muted-foreground mb-6">
                  DBにサービスデータがありません
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold">{service.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.vendor || '不明'}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">{categoryLabels[service.category] || service.category}</Badge>
                          <Badge variant="secondary">{licenseTypeLabels[service.licenseType] || service.licenseType}</Badge>
                          {!service.isActive && (
                            <Badge variant="destructive">無効</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      <div className="text-sm text-right">
                        <div className="font-medium">
                          ライセンス: {service.assignments?.length || 0}名
                        </div>
                        <div className="text-muted-foreground">
                          月額: ¥{getServiceMonthlyCost(service).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/ja/saas/${service.id}`)}>
                          詳細
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.id, service.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
