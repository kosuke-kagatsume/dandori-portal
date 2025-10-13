import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PerformanceEvaluation,
  BonusEvaluation,
  EvaluationPeriod,
  PerformanceRating,
} from '@/lib/payroll/performance-evaluation-types';

interface PerformanceEvaluationStore {
  // State
  evaluations: PerformanceEvaluation[];
  bonusEvaluations: BonusEvaluation[];
  isLoading: boolean;

  // Actions - Performance Evaluations
  createEvaluation: (evaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'>) => PerformanceEvaluation;
  updateEvaluation: (id: string, updates: Partial<PerformanceEvaluation>) => void;
  deleteEvaluation: (id: string) => void;
  getEvaluation: (id: string) => PerformanceEvaluation | undefined;
  getEvaluationsByEmployee: (employeeId: string) => PerformanceEvaluation[];
  getEvaluationsByPeriod: (fiscalYear: number, period: EvaluationPeriod) => PerformanceEvaluation[];
  getEvaluationsByDepartment: (department: string) => PerformanceEvaluation[];
  getEvaluationsByStatus: (status: PerformanceEvaluation['status']) => PerformanceEvaluation[];
  submitEvaluation: (id: string) => void;
  approveEvaluation: (id: string) => void;
  finalizeEvaluation: (id: string) => void;

  // Actions - Bonus Evaluations
  createBonusEvaluation: (evaluation: Omit<BonusEvaluation, 'id' | 'createdAt'>) => BonusEvaluation;
  updateBonusEvaluation: (id: string, updates: Partial<BonusEvaluation>) => void;
  getBonusEvaluation: (id: string) => BonusEvaluation | undefined;
  getBonusEvaluationsByEmployee: (employeeId: string) => BonusEvaluation[];
  approveBonusEvaluation: (id: string) => void;

  // Statistics
  getEvaluationStats: (fiscalYear: number, period?: EvaluationPeriod) => {
    total: number;
    byRating: Record<PerformanceRating, number>;
    byStatus: Record<PerformanceEvaluation['status'], number>;
    averageScore: number;
  };

  // Utility
  initializeSampleData: () => void;
}

// サンプルデータ生成用のヘルパー
const generateSampleEvaluations = (): PerformanceEvaluation[] => {
  const employees = [
    { id: 'emp-001', name: '田中太郎', department: '営業部', position: '営業マネージャー' },
    { id: 'emp-002', name: '佐藤花子', department: '開発部', position: 'シニアエンジニア' },
    { id: 'emp-003', name: '鈴木一郎', department: '営業部', position: '営業担当' },
    { id: 'emp-004', name: '高橋美咲', department: '開発部', position: 'エンジニア' },
    { id: 'emp-005', name: '伊藤健太', department: '総務部', position: '総務課長' },
  ];

  const periods: EvaluationPeriod[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const ratings: PerformanceRating[] = ['S', 'A', 'B', 'C'];

  const evaluations: PerformanceEvaluation[] = [];

  employees.forEach((emp, empIndex) => {
    periods.forEach((period, periodIndex) => {
      const rating = ratings[empIndex % ratings.length];
      const score = rating === 'S' ? 92 : rating === 'A' ? 85 : rating === 'B' ? 75 : 65;

      const evaluation: PerformanceEvaluation = {
        id: `eval-${empIndex + 1}-${periodIndex + 1}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        position: emp.position,
        fiscalYear: 2024,
        period,
        evaluationDate: new Date(2024, periodIndex * 3 + 2, 15).toISOString(),
        items: [
          {
            id: 'item-1',
            category: 'performance',
            name: '目標達成度',
            description: '設定された目標の達成度',
            weight: 0.4,
            rating,
            score,
            comments: '計画通りに進捗しています。',
          },
          {
            id: 'item-2',
            category: 'competency',
            name: '専門知識',
            description: '業務に必要な専門知識',
            weight: 0.3,
            rating,
            score,
            comments: '十分な知識を保有しています。',
          },
          {
            id: 'item-3',
            category: 'attitude',
            name: '積極性',
            description: '主体的な行動',
            weight: 0.15,
            rating,
            score,
            comments: '積極的に業務に取り組んでいます。',
          },
          {
            id: 'item-4',
            category: 'leadership',
            name: '指導力',
            description: '部下や後輩への指導',
            weight: 0.1,
            rating,
            score: Math.max(score - 5, 60),
            comments: 'さらなる向上が期待されます。',
          },
          {
            id: 'item-5',
            category: 'teamwork',
            name: '協調性',
            description: 'チーム内での協力',
            weight: 0.05,
            rating,
            score: score + 5,
            comments: 'チームワークは良好です。',
          },
        ],
        overallRating: rating,
        overallScore: score,
        weightedScore: score,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '目標達成に向けて計画的に行動できる。専門知識が豊富。',
        improvements: 'リーダーシップをさらに発揮することが期待される。',
        goals: '次期はチームリーダーとしての役割を担う。',
        evaluatorComments: '全体として良好な成果を上げています。',
        status: periodIndex < 2 ? 'approved' : 'submitted',
        submittedAt: new Date(2024, periodIndex * 3 + 2, 16).toISOString(),
        approvedAt: periodIndex < 2 ? new Date(2024, periodIndex * 3 + 2, 18).toISOString() : undefined,
        createdAt: new Date(2024, periodIndex * 3 + 2, 10).toISOString(),
        updatedAt: new Date(2024, periodIndex * 3 + 2, 15).toISOString(),
      };

      evaluations.push(evaluation);
    });
  });

  return evaluations;
};

export const usePerformanceEvaluationStore = create<PerformanceEvaluationStore>()(
  persist(
    (set, get) => ({
      // Initial State
      evaluations: [],
      bonusEvaluations: [],
      isLoading: false,

      // Performance Evaluation Actions
      createEvaluation: (evaluation) => {
        const newEvaluation: PerformanceEvaluation = {
          ...evaluation,
          id: `eval-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          evaluations: [...state.evaluations, newEvaluation],
        }));

        return newEvaluation;
      },

      updateEvaluation: (id, updates) => {
        set((state) => ({
          evaluations: state.evaluations.map((eval) =>
            eval.id === id
              ? { ...eval, ...updates, updatedAt: new Date().toISOString() }
              : eval
          ),
        }));
      },

      deleteEvaluation: (id) => {
        set((state) => ({
          evaluations: state.evaluations.filter((eval) => eval.id !== id),
        }));
      },

      getEvaluation: (id) => {
        return get().evaluations.find((eval) => eval.id === id);
      },

      getEvaluationsByEmployee: (employeeId) => {
        return get().evaluations.filter((eval) => eval.employeeId === employeeId);
      },

      getEvaluationsByPeriod: (fiscalYear, period) => {
        return get().evaluations.filter(
          (eval) => eval.fiscalYear === fiscalYear && eval.period === period
        );
      },

      getEvaluationsByDepartment: (department) => {
        return get().evaluations.filter((eval) => eval.department === department);
      },

      getEvaluationsByStatus: (status) => {
        return get().evaluations.filter((eval) => eval.status === status);
      },

      submitEvaluation: (id) => {
        set((state) => ({
          evaluations: state.evaluations.map((eval) =>
            eval.id === id
              ? {
                  ...eval,
                  status: 'submitted',
                  submittedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : eval
          ),
        }));
      },

      approveEvaluation: (id) => {
        set((state) => ({
          evaluations: state.evaluations.map((eval) =>
            eval.id === id
              ? {
                  ...eval,
                  status: 'approved',
                  approvedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : eval
          ),
        }));
      },

      finalizeEvaluation: (id) => {
        set((state) => ({
          evaluations: state.evaluations.map((eval) =>
            eval.id === id
              ? {
                  ...eval,
                  status: 'finalized',
                  finalizedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : eval
          ),
        }));
      },

      // Bonus Evaluation Actions
      createBonusEvaluation: (evaluation) => {
        const newEvaluation: BonusEvaluation = {
          ...evaluation,
          id: `bonus-eval-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          bonusEvaluations: [...state.bonusEvaluations, newEvaluation],
        }));

        return newEvaluation;
      },

      updateBonusEvaluation: (id, updates) => {
        set((state) => ({
          bonusEvaluations: state.bonusEvaluations.map((eval) =>
            eval.id === id ? { ...eval, ...updates } : eval
          ),
        }));
      },

      getBonusEvaluation: (id) => {
        return get().bonusEvaluations.find((eval) => eval.id === id);
      },

      getBonusEvaluationsByEmployee: (employeeId) => {
        return get().bonusEvaluations.filter((eval) => eval.employeeId === employeeId);
      },

      approveBonusEvaluation: (id) => {
        set((state) => ({
          bonusEvaluations: state.bonusEvaluations.map((eval) =>
            eval.id === id
              ? {
                  ...eval,
                  status: 'approved',
                  approvedAt: new Date().toISOString(),
                }
              : eval
          ),
        }));
      },

      // Statistics
      getEvaluationStats: (fiscalYear, period) => {
        const evaluations = get().evaluations.filter((eval) => {
          const matchYear = eval.fiscalYear === fiscalYear;
          const matchPeriod = period ? eval.period === period : true;
          return matchYear && matchPeriod;
        });

        const byRating: Record<PerformanceRating, number> = {
          S: 0,
          A: 0,
          B: 0,
          C: 0,
          D: 0,
        };

        const byStatus: Record<PerformanceEvaluation['status'], number> = {
          draft: 0,
          submitted: 0,
          approved: 0,
          finalized: 0,
        };

        let totalScore = 0;

        evaluations.forEach((eval) => {
          byRating[eval.overallRating]++;
          byStatus[eval.status]++;
          totalScore += eval.overallScore;
        });

        return {
          total: evaluations.length,
          byRating,
          byStatus,
          averageScore: evaluations.length > 0 ? Math.round(totalScore / evaluations.length) : 0,
        };
      },

      // Utility
      initializeSampleData: () => {
        const sampleEvaluations = generateSampleEvaluations();
        set({ evaluations: sampleEvaluations });
      },
    }),
    {
      name: 'performance-evaluation-store',
    }
  )
);
