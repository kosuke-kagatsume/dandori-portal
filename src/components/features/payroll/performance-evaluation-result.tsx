'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  TrendingUp,
  Users,
  Award,
  Target,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import type {
  PerformanceEvaluation,
  EvaluationCategory,
  PerformanceRating,
} from '@/lib/payroll/performance-evaluation-types';

interface PerformanceEvaluationResultProps {
  evaluation: PerformanceEvaluation;
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

const statusLabels = {
  draft: '下書き',
  submitted: '申告済み',
  approved: '承認済み',
  finalized: '確定',
};

export function PerformanceEvaluationResult({ evaluation }: PerformanceEvaluationResultProps) {
  // カテゴリ別に項目をグループ化
  const itemsByCategory = evaluation.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<EvaluationCategory, typeof evaluation.items>);

  // カテゴリ別の平均スコア計算
  const categoryScores = Object.entries(itemsByCategory).map(([category, items]) => {
    const avgScore = items.reduce((sum, item) => sum + item.score, 0) / items.length;
    return {
      category: category as EvaluationCategory,
      score: Math.round(avgScore),
      items,
    };
  });

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">
            {evaluation.fiscalYear}年度 {evaluation.period} 人事評価結果
          </h3>
          <p className="text-muted-foreground">
            {evaluation.employeeName} ({evaluation.employeeId}) - {evaluation.department}
          </p>
          <p className="text-sm text-muted-foreground">{evaluation.position}</p>
        </div>
        <div className="text-right space-y-2">
          <Badge
            variant={evaluation.status === 'approved' || evaluation.status === 'finalized' ? 'default' : 'secondary'}
            className="text-sm"
          >
            {statusLabels[evaluation.status]}
          </Badge>
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(evaluation.evaluationDate).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>

      <Separator />

      {/* 総合評価カード */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            総合評価
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={`text-2xl px-6 py-2 ${ratingColors[evaluation.overallRating]}`}>
                {ratingLabels[evaluation.overallRating]}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">総合評価等級</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{evaluation.overallScore}</div>
              <p className="text-sm text-muted-foreground">総合スコア</p>
            </div>
          </div>

          <div className="mt-4">
            <Progress value={evaluation.overallScore} className="h-3" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">評価者:</span>{' '}
              <span className="font-medium">{evaluation.evaluatorName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">重み付けスコア:</span>{' '}
              <span className="font-medium">{evaluation.weightedScore}点</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別評価サマリー */}
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別評価</CardTitle>
          <CardDescription>各評価カテゴリの平均スコア</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryScores.map(({ category, score, items }) => {
            const weight = items[0].weight;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {categoryIcons[category]}
                    <span className="font-medium">{categoryLabels[category]}</span>
                    <Badge variant="outline" className="text-xs">
                      重み {(weight * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-lg font-bold">{score}点</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 詳細評価項目 */}
      {Object.entries(itemsByCategory).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {categoryIcons[category as EvaluationCategory]}
              {categoryLabels[category as EvaluationCategory]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={ratingColors[item.rating]}>{item.rating}</Badge>
                    <span className="text-lg font-bold">{item.score}点</span>
                  </div>
                </div>

                {item.comments && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm text-muted-foreground">コメント:</p>
                    <p className="text-sm mt-1">{item.comments}</p>
                  </div>
                )}
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
          {evaluation.strengths && (
            <div>
              <div className="font-medium text-sm text-green-700 mb-2">✓ 強み</div>
              <p className="text-sm bg-green-50 p-3 rounded-md">{evaluation.strengths}</p>
            </div>
          )}

          {evaluation.improvements && (
            <div>
              <div className="font-medium text-sm text-yellow-700 mb-2">△ 改善点</div>
              <p className="text-sm bg-yellow-50 p-3 rounded-md">{evaluation.improvements}</p>
            </div>
          )}

          {evaluation.goals && (
            <div>
              <div className="font-medium text-sm text-blue-700 mb-2">→ 次期目標</div>
              <p className="text-sm bg-blue-50 p-3 rounded-md">{evaluation.goals}</p>
            </div>
          )}

          {evaluation.evaluatorComments && (
            <div>
              <div className="font-medium text-sm text-purple-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                評価者総合コメント
              </div>
              <p className="text-sm bg-purple-50 p-3 rounded-md">{evaluation.evaluatorComments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* タイムスタンプ */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">作成日時:</span>
              <br />
              {new Date(evaluation.createdAt).toLocaleString('ja-JP')}
            </div>
            {evaluation.submittedAt && (
              <div>
                <span className="font-medium">提出日時:</span>
                <br />
                {new Date(evaluation.submittedAt).toLocaleString('ja-JP')}
              </div>
            )}
            {evaluation.approvedAt && (
              <div>
                <span className="font-medium">承認日時:</span>
                <br />
                {new Date(evaluation.approvedAt).toLocaleString('ja-JP')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
