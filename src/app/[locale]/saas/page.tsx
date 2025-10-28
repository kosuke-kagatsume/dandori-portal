'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Search, TrendingUp, TrendingDown, AlertCircle, Users, Building, Database, Download } from 'lucide-react';
import { useSaaSStore } from '@/lib/store/saas-store';
import { useUserStore } from '@/lib/store/user-store';
import { categoryLabels, licenseTypeLabels, type SaaSCategory, type LicenseType, type SaaSService } from '@/types/saas';
import { ServiceFormDialog } from '@/features/saas/service-form-dialog';
import { mockSaaSServices, generatePlansForService, generateAssignments } from '@/lib/mock-data/saas-mock-data';
import { initializeUserMockData } from '@/lib/mock-data/user-mock-data';
import { exportSaaSServicesToCSV, exportLicenseAssignmentsToCSV } from '@/lib/csv/csv-export';
import { toast } from 'sonner';

export default function SaaSManagementPage() {
  const router = useRouter();
  const {
    services,
    getTotalServices,
    getTotalLicenses,
    getActiveLicenses,
    getTotalMonthlyCost,
    getUnusedLicensesCost,
    addService,
    addPlan,
    addAssignment,
    getServiceById,
    getPlansByServiceId,
    assignments,
  } = useSaaSStore();

  const { users, addUser } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SaaSCategory | 'all'>('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<LicenseType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<SaaSService | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのみマウント状態を管理
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 既存サービスにライセンス割り当てを追加
  const handleAddAssignments = () => {
    try {
      toast.info('ライセンス割り当てを生成中...');

      // ユーザーがいなければ初期化
      if (users.length === 0) {
        toast.info('ユーザーデータを初期化中...');
        initializeUserMockData(addUser);
      }

      // 全サービスを取得
      const allServices = services;

      if (allServices.length === 0) {
        toast.error('サービスが登録されていません');
        return;
      }

      // 各サービスのプランを取得または作成
      allServices.forEach((service) => {
        const existingPlans = getPlansByServiceId(service.id);

        // プランがなければ作成
        if (existingPlans.length === 0) {
          const plans = generatePlansForService(service.id, service.name, service.licenseType);
          plans.forEach((plan) => {
            addPlan(plan);
          });
        }
      });

      // 少し待ってからライセンス割り当てを追加
      setTimeout(() => {
        const plansWithIds = allServices.flatMap((service) => getPlansByServiceId(service.id));

        // ストアから最新のユーザーを取得
        const currentUsers = useUserStore.getState().users;


        if (plansWithIds.length === 0) {
          toast.error('プランの取得に失敗しました');
          return;
        }

        if (currentUsers.length === 0) {
          toast.error('ユーザーデータが見つかりません');
          return;
        }

        const assignments = generateAssignments(allServices, plansWithIds, currentUsers);


        assignments.forEach((assignment) => {
          addAssignment(assignment);
        });

        toast.success(`ライセンス割り当ての生成が完了しました！\n割り当て数: ${assignments.length}件`, {
          duration: 5000,
        });
      }, 800);
    } catch (error) {
      console.error('ライセンス割り当て生成エラー:', error);
      toast.error('ライセンス割り当ての生成に失敗しました');
    }
  };

  // モックデータ生成
  const handleGenerateMockData = () => {
    if (services.length > 0) {
      if (!confirm('既存のデータがあります。本当にモックデータを追加しますか？')) {
        return;
      }
    }

    try {
      toast.info('モックデータを生成中...');

      // 0. ユーザーがいなければ初期化
      if (users.length === 0) {
        toast.info('ユーザーデータを初期化中...');
        initializeUserMockData(addUser);
      }

      // 1. サービスを追加
      mockSaaSServices.forEach((service) => {
        addService(service);
      });

      // 2. 短い遅延の後、追加されたサービスを取得してプランを追加
      setTimeout(() => {
        const allServices = services;
        const addedServiceIds: string[] = [];

        // 追加されたサービスのIDを収集（名前で照合）
        mockSaaSServices.forEach((mockService) => {
          const found = allServices.find(s => s.name === mockService.name);
          if (found) {
            addedServiceIds.push(found.id);
          }
        });


        // 3. 各サービスにプランを追加
        addedServiceIds.forEach((serviceId) => {
          const service = getServiceById(serviceId);
          if (service) {
            const plans = generatePlansForService(serviceId, service.name, service.licenseType);
            plans.forEach((plan) => {
              addPlan(plan);
            });
          }
        });

        // 4. さらに遅延してライセンス割り当てを追加
        setTimeout(() => {
          const servicesWithIds = addedServiceIds.map(id => getServiceById(id)).filter(Boolean) as typeof services;
          const plansWithIds = servicesWithIds.flatMap((service) => getPlansByServiceId(service.id));

          // ストアから最新のユーザーを取得
          const currentUsers = useUserStore.getState().users;


          if (plansWithIds.length === 0) {
            toast.error('プランの取得に失敗しました。もう一度お試しください。');
            return;
          }

          if (currentUsers.length === 0) {
            toast.error('ユーザーデータが見つかりません');
            return;
          }

          const assignments = generateAssignments(servicesWithIds, plansWithIds, currentUsers);


          assignments.forEach((assignment) => {
            addAssignment(assignment);
          });

          toast.success(`モックデータの生成が完了しました！\nサービス: ${servicesWithIds.length}件\nプラン: ${plansWithIds.length}件\nライセンス割り当て: ${assignments.length}件`, {
            duration: 5000,
          });
        }, 1000);
      }, 500);
    } catch (error) {
      console.error('モックデータ生成エラー:', error);
      toast.error('モックデータの生成に失敗しました');
    }
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

  // SaaSサービスCSV出力ハンドラー
  const handleExportServicesCSV = () => {
    try {
      const result = exportSaaSServicesToCSV(filteredServices);
      if (result.success) {
        toast.success(`CSV出力完了: ${result.recordCount}件`);
      } else {
        toast.error(result.error || 'CSV出力に失敗しました');
      }
    } catch (error) {
      console.error('Failed to export services CSV:', error);
      toast.error('CSV出力に失敗しました');
    }
  };

  // ライセンス割り当てCSV出力ハンドラー
  const handleExportAssignmentsCSV = () => {
    try {
      const result = exportLicenseAssignmentsToCSV(assignments);
      if (result.success) {
        toast.success(`CSV出力完了: ${result.recordCount}件`);
      } else {
        toast.error(result.error || 'CSV出力に失敗しました');
      }
    } catch (error) {
      console.error('Failed to export assignments CSV:', error);
      toast.error('CSV出力に失敗しました');
    }
  };

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
        <div className="flex gap-2">
          {mounted && (
            <>
              {services.length === 0 ? (
                <Button variant="secondary" onClick={handleGenerateMockData}>
                  <Database className="mr-2 h-4 w-4" />
                  サンプルデータ生成
                </Button>
              ) : getTotalLicenses() === 0 ? (
                <Button variant="secondary" onClick={handleAddAssignments}>
                  <Database className="mr-2 h-4 w-4" />
                  ライセンス割り当て生成
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportServicesCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    サービスCSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportAssignmentsCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    割り当てCSV
                  </Button>
                </>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => router.push('/ja/saas/users')}>
            <Users className="mr-2 h-4 w-4" />
            ユーザー別利用
          </Button>
          <Button variant="outline" onClick={() => router.push('/ja/saas/departments')}>
            <Building className="mr-2 h-4 w-4" />
            部門別分析
          </Button>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            新規サービス登録
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      {mounted ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総サービス数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">読み込み中...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ライセンス数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">読み込み中...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">月額総コスト</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">読み込み中...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">削減可能額</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">読み込み中...</p>
            </CardContent>
          </Card>
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
              <div className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">サービスが登録されていません</p>
                <p className="text-sm text-muted-foreground mb-6">
                  サンプルデータを生成するか、手動で登録を開始してください
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleGenerateMockData} size="lg">
                    <Database className="mr-2 h-5 w-5" />
                    サンプルデータを生成
                  </Button>
                  <Button variant="outline" onClick={handleOpenCreateDialog} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    手動で登録
                  </Button>
                </div>
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
