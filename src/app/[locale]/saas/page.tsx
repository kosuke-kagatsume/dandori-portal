'use client';

import { useState } from 'react';
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
import { Plus, Search, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useSaaSStore } from '@/lib/store/saas-store';
import { categoryLabels, licenseTypeLabels, type SaaSCategory, type LicenseType, type SaaSService } from '@/types/saas';
import { ServiceFormDialog } from '@/features/saas/service-form-dialog';

export default function SaaSManagementPage() {
  const router = useRouter();
  const {
    services,
    getTotalServices,
    getTotalLicenses,
    getActiveLicenses,
    getTotalMonthlyCost,
    getUnusedLicensesCost,
  } = useSaaSStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SaaSCategory | 'all'>('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<LicenseType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<SaaSService | undefined>(undefined);

  // ダイアログ操作
  const handleOpenCreateDialog = () => {
    setSelectedService(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (service: SaaSService) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleCloseDialog = () => {
    setIsFormOpen(false);
    setSelectedService(undefined);
  };

  // フィルタリング
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesLicenseType = licenseTypeFilter === 'all' || service.licenseType === licenseTypeFilter;

    return matchesSearch && matchesCategory && matchesLicenseType;
  });

  // 統計情報
  const totalServices = getTotalServices();
  const totalLicenses = getTotalLicenses();
  const activeLicenses = getActiveLicenses();
  const totalMonthlyCost = getTotalMonthlyCost();
  const unusedLicensesCost = getUnusedLicensesCost();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS管理</h1>
          <p className="text-muted-foreground">
            社内で利用しているSaaSサービスのライセンスとコストを一元管理
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新規サービス登録
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総サービス数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
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
            <div className="text-2xl font-bold">{totalLicenses}</div>
            <p className="text-xs text-muted-foreground">
              アクティブ: {activeLicenses}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月額総コスト</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalMonthlyCost.toLocaleString()}</div>
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
              ¥{unusedLicensesCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              未使用ライセンス
            </p>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>サービス一覧</CardTitle>
          <CardDescription>
            フィルターで絞り込んで検索できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="カテゴリ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={licenseTypeFilter} onValueChange={(value) => setLicenseTypeFilter(value as LicenseType | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="ライセンスタイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
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
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">サービスが登録されていません</p>
                <p className="text-sm">「新規サービス登録」ボタンから登録を開始してください</p>
              </div>
            ) : (
              filteredServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {service.logo ? (
                          <img src={service.logo} alt={service.name} className="w-8 h-8" />
                        ) : (
                          <span className="text-lg font-bold">{service.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{categoryLabels[service.category]}</Badge>
                          <Badge variant="secondary">{licenseTypeLabels[service.licenseType]}</Badge>
                          {!service.isActive && (
                            <Badge variant="destructive">無効</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/ja/saas/${service.id}`)}>
                        詳細
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/ja/saas/${service.id}`)}>
                        ライセンス管理
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* サービス登録・編集ダイアログ */}
      <ServiceFormDialog
        open={isFormOpen}
        onClose={handleCloseDialog}
        service={selectedService}
      />
    </div>
  );
}
