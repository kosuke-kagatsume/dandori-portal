/**
 * 人事評価システムの型定義
 */

/**
 * 評価期間
 */
export type EvaluationPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'H1' | 'H2' | 'ANNUAL';

/**
 * 評価項目のカテゴリー
 */
export type EvaluationCategory =
  | 'performance'      // 業績評価
  | 'competency'       // 能力評価
  | 'attitude'         // 態度評価
  | 'leadership'       // リーダーシップ評価
  | 'teamwork';        // チームワーク評価

/**
 * 評価等級
 */
export type PerformanceRating = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * 評価項目
 */
export interface EvaluationItem {
  id: string;
  category: EvaluationCategory;
  name: string;
  description: string;
  weight: number;       // 重み付け（0.0〜1.0）
  rating: PerformanceRating;
  score: number;        // 0〜100点
  comments?: string;
}

/**
 * 人事評価データ
 */
export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;

  // 評価期間
  fiscalYear: number;
  period: EvaluationPeriod;
  evaluationDate: string;

  // 評価項目
  items: EvaluationItem[];

  // 総合評価
  overallRating: PerformanceRating;
  overallScore: number;         // 0〜100点
  weightedScore: number;        // 重み付け後の得点

  // 評価者
  evaluatorId: string;
  evaluatorName: string;

  // コメント
  strengths?: string;           // 強み
  improvements?: string;        // 改善点
  goals?: string;               // 次期目標
  evaluatorComments?: string;   // 評価者コメント

  // ステータス
  status: 'draft' | 'submitted' | 'approved' | 'finalized';
  submittedAt?: string;
  approvedAt?: string;
  finalizedAt?: string;

  // メタデータ
  createdAt: string;
  updatedAt: string;
}

/**
 * 賞与評価（賞与計算用）
 */
export interface BonusEvaluation {
  id: string;
  employeeId: string;
  fiscalYear: number;
  bonusType: 'summer' | 'winter' | 'special';

  // 評価結果
  performanceRating: PerformanceRating;
  performanceScore: number;     // 0〜100点

  // 賞与係数（査定賞与の計算用）
  bonusMultiplier: number;      // S=0.5, A=0.3, B=0.15, C=0.05, D=0

  // 評価根拠
  basedOnEvaluationId?: string; // 元となった人事評価のID
  comments?: string;

  // ステータス
  status: 'draft' | 'approved';
  approvedAt?: string;
  createdAt: string;
}

/**
 * 評価設定
 */
export interface EvaluationSettings {
  // 評価等級の定義
  ratingDefinitions: {
    [key in PerformanceRating]: {
      label: string;
      description: string;
      scoreRange: { min: number; max: number };
      bonusMultiplier: number;
    };
  };

  // 評価項目テンプレート
  categoryTemplates: {
    [key in EvaluationCategory]: {
      label: string;
      defaultWeight: number;
      items: Array<{
        name: string;
        description: string;
      }>;
    };
  };
}

/**
 * デフォルトの評価設定
 */
export const DEFAULT_EVALUATION_SETTINGS: EvaluationSettings = {
  ratingDefinitions: {
    S: {
      label: 'S（卓越）',
      description: '期待を大幅に上回る卓越した成果',
      scoreRange: { min: 90, max: 100 },
      bonusMultiplier: 0.5,
    },
    A: {
      label: 'A（優秀）',
      description: '期待を上回る優秀な成果',
      scoreRange: { min: 80, max: 89 },
      bonusMultiplier: 0.3,
    },
    B: {
      label: 'B（良好）',
      description: '期待通りの良好な成果',
      scoreRange: { min: 70, max: 79 },
      bonusMultiplier: 0.15,
    },
    C: {
      label: 'C（要改善）',
      description: '期待を下回る成果、改善が必要',
      scoreRange: { min: 60, max: 69 },
      bonusMultiplier: 0.05,
    },
    D: {
      label: 'D（不十分）',
      description: '期待を大きく下回る不十分な成果',
      scoreRange: { min: 0, max: 59 },
      bonusMultiplier: 0.0,
    },
  },
  categoryTemplates: {
    performance: {
      label: '業績評価',
      defaultWeight: 0.4,
      items: [
        { name: '目標達成度', description: '設定された目標の達成度' },
        { name: '業務品質', description: '業務の品質と精度' },
        { name: '生産性', description: '業務効率と生産性' },
      ],
    },
    competency: {
      label: '能力評価',
      defaultWeight: 0.3,
      items: [
        { name: '専門知識', description: '業務に必要な専門知識' },
        { name: '問題解決能力', description: '問題の発見と解決' },
        { name: '企画力', description: '新しい提案や企画' },
      ],
    },
    attitude: {
      label: '態度評価',
      defaultWeight: 0.15,
      items: [
        { name: '積極性', description: '主体的な行動' },
        { name: '規律性', description: 'ルールや期限の遵守' },
        { name: '責任感', description: '業務への責任感' },
      ],
    },
    leadership: {
      label: 'リーダーシップ',
      defaultWeight: 0.1,
      items: [
        { name: '指導力', description: '部下や後輩への指導' },
        { name: '意思決定', description: '適切な判断と意思決定' },
        { name: 'ビジョン', description: '方向性の提示' },
      ],
    },
    teamwork: {
      label: 'チームワーク',
      defaultWeight: 0.05,
      items: [
        { name: '協調性', description: 'チーム内での協力' },
        { name: 'コミュニケーション', description: '円滑な情報共有' },
        { name: 'サポート', description: '他メンバーへの支援' },
      ],
    },
  },
};

/**
 * 評価等級から賞与係数を取得
 */
export function getBonusMultiplier(rating: PerformanceRating): number {
  return DEFAULT_EVALUATION_SETTINGS.ratingDefinitions[rating].bonusMultiplier;
}

/**
 * スコアから評価等級を算出
 */
export function getRatingFromScore(score: number): PerformanceRating {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}
