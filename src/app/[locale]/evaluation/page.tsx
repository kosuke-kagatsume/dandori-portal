'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MountGate } from '@/components/common/MountGate';
import { usePerformanceEvaluationStore } from '@/lib/store/performance-evaluation-store';
import { PerformanceEvaluationForm } from '@/components/features/payroll/performance-evaluation-form';
import { PerformanceEvaluationResult } from '@/components/features/payroll/performance-evaluation-result';
import {
  Star,
  TrendingUp,
  Users,
  Award,
  Target,
  Filter,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  FileText,
  Search,
} from 'lucide-react';
import type {
  PerformanceEvaluation,
  EvaluationPeriod,
  PerformanceRating,
} from '@/lib/payroll/performance-evaluation-types';

const periodLabels: Record<EvaluationPeriod, string> = {
  Q1: '第1四半期',
  Q2: '第2四半期',
  Q3: '第3四半期',
  Q4: '第4四半期',
  H1: '上半期',
  H2: '下半期',
  ANNUAL: '年間',
};

const ratingLabels: Record<PerformanceRating, string> = {
  S: 'S（卓越）',
  A: 'A（優秀）',
  B: 'B（良好）',
  C: 'C（要改善）',
  D: 'D（不十分）',
};

const ratingColors: Record<PerformanceRating, string> = {
  S: 'bg-purple-100 text-purple-800 border-purple-300',
  A: 'bg-blue-100 text-blue-800 border-blue-300',
  B: 'bg-green-100 text-green-800 border-green-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels = {
  draft: '下書き',
  submitted: '申告済み',
  approved: '承認済み',
  finalized: '確定',
};

export default function EvaluationPage() {
  const { toast } = useToast();

  // Store
  const {
    evaluations,
    createEvaluation,
    updateEvaluation,
    submitEvaluation,
    approveEvaluation,
    getEvaluationsByDepartment,
    getEvaluationsByPeriod,
    getEvaluationsByStatus,
    getEvaluationStats,
    initializeSampleData,
  } = usePerformanceEvaluationStore();

  // State
  const [activeTab, setActiveTab] = useState('list');
  const [selectedEvaluation, setSelectedEvaluation] = useState<PerformanceEvaluation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedPeriod, setSelectedPeriod] = useState<EvaluationPeriod | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<PerformanceEvaluation['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 初期データロード
  useEffect(() => {
    if (evaluations.length === 0) {
      initializeSampleData();
    }
  }, [evaluations.length, initializeSampleData]);

  // フィルタリングされた評価データ
  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchYear = evaluation.fiscalYear === selectedYear;
    const matchPeriod = selectedPeriod === 'all' || evaluation.period === selectedPeriod;
    const matchDepartment = selectedDepartment === 'all' || evaluation.department === selectedDepartment;
    const matchStatus = selectedStatus === 'all' || evaluation.status === selectedStatus;
    const matchSearch =
      searchQuery === '' ||
      evaluation.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchYear && matchPeriod && matchDepartment && matchStatus && matchSearch;
  });

  // 統計データ
  const stats = getEvaluationStats(selectedYear, selectedPeriod === 'all' ? undefined : selectedPeriod);

  // 部署リスト
  const departments = Array.from(new Set(evaluations.map((e) => e.department)));

  // 新規評価作成
  const handleCreateEvaluation = (evaluation: Partial<PerformanceEvaluation>) => {
    setIsSubmitting(true);
    try {
      const newEval = createEvaluation(evaluation as any);
      toast({
        title: '評価を作成しました',
        description: `${evaluation.employeeName}さんの評価を作成しました。`,
      });
      setIsCreating(false);
      setActiveTab('list');
    } catch (error) {
      toast({
        title: 'エラー',
        description: '評価の作成中にエラーが発生しました。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 評価の更新
  const handleUpdateEvaluation = (evaluation: Partial<PerformanceEvaluation>) => {
    if (!selectedEvaluation) return;

    setIsSubmitting(true);
    try {
      updateEvaluation(selectedEvaluation.id, evaluation);
      toast({
        title: '評価を更新しました',
        description: `${evaluation.employeeName}さんの評価を更新しました。`,
      });
      setSelectedEvaluation(null);
      setActiveTab('list');
    } catch (error) {
      toast({
        title: 'エラー',
        description: '評価の更新中にエラーが発生しました。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 評価の承認
  const handleApprove = (id: string) => {
    approveEvaluation(id);
    toast({
      title: '評価を承認しました',
      description: '評価が承認されました。',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">人事評価管理</h1>
          <p className="text-muted-foreground">従業員の人事評価を管理します</p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(true);
            setActiveTab('create');
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          新規評価
        </Button>
      </div>

      {/* 統計カード */}
      <MountGate>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総評価数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {selectedYear}年度 {selectedPeriod !== 'all' && periodLabels[selectedPeriod]}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均スコア</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}点</div>
              <p className="text-xs text-muted-foreground">全体の平均評価スコア</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認済み</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.approved}</div>
              <p className="text-xs text-muted-foreground">承認済みの評価数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">申告待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.draft + stats.byStatus.submitted}</div>
              <p className="text-xs text-muted-foreground">申告・承認待ちの評価</p>
            </CardContent>
          </Card>
        </div>
      </MountGate>

      {/* 評価分布 */}
      <MountGate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">評価分布</CardTitle>
            <CardDescription>評価等級ごとの人数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(ratingLabels).map(([rating, label]) => (
                <div key={rating} className="text-center">
                  <Badge className={`w-full ${ratingColors[rating as PerformanceRating]}`}>
                    {label}
                  </Badge>
                  <div className="text-2xl font-bold mt-2">
                    {stats.byRating[rating as PerformanceRating]}
                  </div>
                  <p className="text-xs text-muted-foreground">人</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </MountGate>

      {/* タブコンテンツ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">評価一覧</TabsTrigger>
          <TabsTrigger value="create">新規評価</TabsTrigger>
          <TabsTrigger value="result" disabled={!selectedEvaluation}>
            評価結果
          </TabsTrigger>
        </TabsList>

        {/* 評価一覧タブ */}
        <TabsContent value="list" className="space-y-4">
          {/* フィルター */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                フィルター
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">年度</label>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023">2023年度</SelectItem>
                      <SelectItem value="2024">2024年度</SelectItem>
                      <SelectItem value="2025">2025年度</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">期間</label>
                  <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {Object.entries(periodLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">部署</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ステータス</label>
                  <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">検索</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="従業員名・ID"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 評価一覧テーブル */}
          <Card>
            <CardHeader>
              <CardTitle>評価一覧</CardTitle>
              <CardDescription>{filteredEvaluations.length}件の評価</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{evaluation.employeeName}</span>
                        <Badge variant="outline" className="text-xs">
                          {evaluation.employeeId}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {evaluation.department}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{evaluation.fiscalYear}年度 {periodLabels[evaluation.period]}</span>
                        <span>評価者: {evaluation.evaluatorName}</span>
                        <span>
                          {new Date(evaluation.evaluationDate).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={ratingColors[evaluation.overallRating]}>
                          {ratingLabels[evaluation.overallRating]}
                        </Badge>
                        <div className="text-sm font-bold mt-1">{evaluation.overallScore}点</div>
                      </div>

                      <Badge variant={evaluation.status === 'approved' ? 'default' : 'secondary'}>
                        {statusLabels[evaluation.status]}
                      </Badge>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvaluation(evaluation);
                            setActiveTab('result');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {evaluation.status !== 'finalized' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEvaluation(evaluation);
                              setActiveTab('create');
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {evaluation.status === 'submitted' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(evaluation.id)}
                          >
                            承認
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEvaluations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    評価データがありません
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 新規評価タブ */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedEvaluation ? '評価の編集' : '新規評価の作成'}
              </CardTitle>
              <CardDescription>
                従業員の人事評価を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceEvaluationForm
                employeeId={selectedEvaluation?.employeeId || 'emp-001'}
                employeeName={selectedEvaluation?.employeeName || '田中太郎'}
                department={selectedEvaluation?.department || '営業部'}
                position={selectedEvaluation?.position || '営業マネージャー'}
                fiscalYear={selectedYear}
                period="Q1"
                evaluatorId="mgr-001"
                evaluatorName="山田部長"
                onSubmit={selectedEvaluation ? handleUpdateEvaluation : handleCreateEvaluation}
                isSubmitting={isSubmitting}
                initialData={selectedEvaluation || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 評価結果タブ */}
        <TabsContent value="result" className="space-y-4">
          {selectedEvaluation && (
            <Card>
              <CardHeader>
                <CardTitle>評価結果</CardTitle>
                <CardDescription>
                  {selectedEvaluation.employeeName}さんの評価結果
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceEvaluationResult evaluation={selectedEvaluation} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
