'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, TrendingUp, Users, Award, Target, MessageSquare } from 'lucide-react';
import type {
  PerformanceEvaluation,
  EvaluationItem,
  PerformanceRating,
  EvaluationCategory,
  EvaluationPeriod,
} from '@/lib/payroll/performance-evaluation-types';

interface PerformanceEvaluationFormProps {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  fiscalYear: number;
  period: EvaluationPeriod;
  evaluatorId: string;
  evaluatorName: string;
  onSubmit: (evaluation: Partial<PerformanceEvaluation>) => void;
  isSubmitting?: boolean;
  initialData?: PerformanceEvaluation;
}

const categoryIcons: Record<EvaluationCategory, React.ReactNode> = {
  performance: <Target className="h-4 w-4" />,
  competency: <Star className="h-4 w-4" />,
  attitude: <TrendingUp className="h-4 w-4" />,
  leadership: <Award className="h-4 w-4" />,
  teamwork: <Users className="h-4 w-4" />,
};

const categoryLabels: Record<EvaluationCategory, string> = {
  performance: '業績評価',
  competency: '能力評価',
  attitude: '態度評価',
  leadership: 'リーダーシップ評価',
  teamwork: 'チームワーク評価',
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

// デフォルトの評価項目テンプレート
const defaultEvaluationItems: Record<EvaluationCategory, Array<{ name: string; description: string }>> = {
  performance: [
    { name: '目標達成度', description: '設定された目標の達成度' },
    { name: '業務品質', description: '業務の品質と精度' },
    { name: '生産性', description: '業務効率と生産性' },
  ],
  competency: [
    { name: '専門知識', description: '業務に必要な専門知識' },
    { name: '問題解決能力', description: '問題の発見と解決' },
    { name: '企画力', description: '新しい提案や企画' },
  ],
  attitude: [
    { name: '積極性', description: '主体的な行動' },
    { name: '規律性', description: 'ルールや期限の遵守' },
    { name: '責任感', description: '業務への責任感' },
  ],
  leadership: [
    { name: '指導力', description: '部下や後輩への指導' },
    { name: '意思決定', description: '適切な判断と意思決定' },
    { name: 'ビジョン', description: '方向性の提示' },
  ],
  teamwork: [
    { name: '協調性', description: 'チーム内での協力' },
    { name: 'コミュニケーション', description: '円滑な情報共有' },
    { name: 'サポート', description: '他メンバーへの支援' },
  ],
};

export function PerformanceEvaluationForm({
  employeeId,
  employeeName,
  department,
  position,
  fiscalYear,
  period,
  evaluatorId,
  evaluatorName,
  onSubmit,
  isSubmitting = false,
  initialData,
}: PerformanceEvaluationFormProps) {
  // 評価項目の初期化
  const initializeItems = (): EvaluationItem[] => {
    if (initialData?.items) {
      return initialData.items;
    }

    const items: EvaluationItem[] = [];
    let itemId = 1;

    Object.entries(defaultEvaluationItems).forEach(([category, templates]) => {
      templates.forEach((template) => {
        items.push({
          id: `item-${itemId++}`,
          category: category as EvaluationCategory,
          name: template.name,
          description: template.description,
          weight: category === 'performance' ? 0.4 : category === 'competency' ? 0.3 : 0.1,
          rating: 'B',
          score: 75,
          comments: '',
        });
      });
    });

    return items;
  };

  const [items, setItems] = useState<EvaluationItem[]>(initializeItems());
  const [strengths, setStrengths] = useState(initialData?.strengths || '');
  const [improvements, setImprovements] = useState(initialData?.improvements || '');
  const [goals, setGoals] = useState(initialData?.goals || '');
  const [evaluatorComments, setEvaluatorComments] = useState(initialData?.evaluatorComments || '');

  // 評価項目の更新
  const updateItem = (itemId: string, field: keyof EvaluationItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: value };

          // スコアが変更された場合、評価等級も自動更新
          if (field === 'score') {
            const score = Number(value);
            if (score >= 90) updated.rating = 'S';
            else if (score >= 80) updated.rating = 'A';
            else if (score >= 70) updated.rating = 'B';
            else if (score >= 60) updated.rating = 'C';
            else updated.rating = 'D';
          }

          // 評価等級が変更された場合、スコアも自動更新
          if (field === 'rating') {
            const scoreRanges: Record<PerformanceRating, number> = {
              S: 95,
              A: 85,
              B: 75,
              C: 65,
              D: 50,
            };
            updated.score = scoreRanges[value as PerformanceRating];
          }

          return updated;
        }
        return item;
      })
    );
  };

  // 総合評価の計算
  const calculateOverallScore = (): number => {
    const totalWeightedScore = items.reduce((sum, item) => {
      return sum + item.score * item.weight;
    }, 0);
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  };

  const overallScore = calculateOverallScore();
  const overallRating: PerformanceRating =
    overallScore >= 90 ? 'S' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : 'D';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const evaluation: Partial<PerformanceEvaluation> = {
      employeeId,
      employeeName,
      department,
      position,
      fiscalYear,
      period,
      evaluationDate: new Date().toISOString(),
      items,
      overallRating,
      overallScore,
      weightedScore: overallScore,
      evaluatorId,
      evaluatorName,
      strengths,
      improvements,
      goals,
      evaluatorComments,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    onSubmit(evaluation);
  };

  // カテゴリ別に項目をグループ化
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<EvaluationCategory, EvaluationItem[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {fiscalYear}年度 {period} 人事評価
          </h3>
          <p className="text-sm text-muted-foreground">
            従業員: {employeeName} ({department} - {position})
          </p>
          <p className="text-xs text-muted-foreground">
            評価者: {evaluatorName}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">総合評価</div>
          <Badge className={`text-lg px-3 py-1 ${ratingColors[overallRating]}`}>
            {ratingLabels[overallRating]}
          </Badge>
          <div className="text-2xl font-bold mt-1">{overallScore}点</div>
        </div>
      </div>

      <Separator />

      {/* 評価項目（カテゴリ別） */}
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {categoryIcons[category as EvaluationCategory]}
              {categoryLabels[category as EvaluationCategory]}
            </CardTitle>
            <CardDescription>
              重み: {(categoryItems[0].weight * 100).toFixed(0)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryItems.map((item) => (
              <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                  <Badge className={ratingColors[item.rating]}>{item.rating}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`score-${item.id}`}>スコア（0-100点）</Label>
                    <Input
                      id={`score-${item.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={item.score}
                      onChange={(e) => updateItem(item.id, 'score', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`rating-${item.id}`}>評価等級</Label>
                    <Select
                      value={item.rating}
                      onValueChange={(value) => updateItem(item.id, 'rating', value)}
                    >
                      <SelectTrigger id={`rating-${item.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ratingLabels).map(([rating, label]) => (
                          <SelectItem key={rating} value={rating}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`comments-${item.id}`}>コメント</Label>
                  <Textarea
                    id={`comments-${item.id}`}
                    value={item.comments || ''}
                    onChange={(e) => updateItem(item.id, 'comments', e.target.value)}
                    placeholder="この項目に関する具体的なコメント"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* 総合コメント */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            総合コメント
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="strengths">強み</Label>
            <Textarea
              id="strengths"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="評価対象者の強みや優れている点"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="improvements">改善点</Label>
            <Textarea
              id="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="今後改善すべき点や課題"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">次期目標</Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="次の評価期間における目標"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evaluatorComments">評価者総合コメント</Label>
            <Textarea
              id="evaluatorComments"
              value={evaluatorComments}
              onChange={(e) => setEvaluatorComments(e.target.value)}
              placeholder="評価者からの総合的なコメント"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* 提出ボタン */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          下書き保存
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '提出中...' : '評価を提出'}
        </Button>
      </div>
    </form>
  );
}
