/**
 * 人事評価ストアのテスト
 */

import { usePerformanceEvaluationStore } from './performance-evaluation-store';
import type {
  PerformanceEvaluation,
  BonusEvaluation,
  EvaluationPeriod,
  PerformanceRating,
} from '@/lib/payroll/performance-evaluation-types';

describe('PerformanceEvaluationStore', () => {
  beforeEach(() => {
    // 各テスト前にストアとlocalStorageをリセット
    localStorage.clear();
    usePerformanceEvaluationStore.setState({
      evaluations: [],
      bonusEvaluations: [],
      isLoading: false,
    });
  });

  describe('createEvaluation', () => {
    it('新しい評価を作成できる', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [
          {
            id: 'item-1',
            category: 'performance',
            name: '目標達成度',
            description: '設定された目標の達成度',
            weight: 0.4,
            rating: 'A',
            score: 85,
            comments: '計画通りに進捗しています。',
          },
        ],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '目標達成に向けて計画的に行動できる',
        improvements: 'リーダーシップをさらに発揮することが期待される',
        goals: '次期はチームリーダーとしての役割を担う',
        evaluatorComments: '全体として良好な成果を上げています',
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations).toHaveLength(1);
      expect(state.evaluations[0].employeeId).toBe('emp-001');
      expect(state.evaluations[0].overallRating).toBe('A');
      expect(state.evaluations[0]).toHaveProperty('id');
      expect(state.evaluations[0]).toHaveProperty('createdAt');
      expect(state.evaluations[0]).toHaveProperty('updatedAt');
      expect(created.id).toBeDefined();
    });

    it('複数の評価項目を持つ評価を作成できる', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-002',
        employeeName: '佐藤花子',
        department: '開発部',
        position: 'シニアエンジニア',
        fiscalYear: 2024,
        period: 'Q2',
        evaluationDate: '2024-07-15',
        items: [
          {
            id: 'item-1',
            category: 'performance',
            name: '目標達成度',
            description: '設定された目標の達成度',
            weight: 0.4,
            rating: 'S',
            score: 92,
            comments: '計画以上の成果を達成',
          },
          {
            id: 'item-2',
            category: 'competency',
            name: '専門知識',
            description: '業務に必要な専門知識',
            weight: 0.3,
            rating: 'A',
            score: 88,
            comments: '高度な専門知識を保有',
          },
          {
            id: 'item-3',
            category: 'attitude',
            name: '積極性',
            description: '主体的な行動',
            weight: 0.15,
            rating: 'A',
            score: 85,
            comments: '積極的に業務に取り組んでいる',
          },
        ],
        overallRating: 'S',
        overallScore: 90,
        weightedScore: 90,
        evaluatorId: 'mgr-002',
        evaluatorName: '鈴木部長',
        strengths: '技術力が高く、チーム全体に貢献している',
        improvements: 'プロジェクト管理スキルの向上',
        goals: 'テックリードとしてチームを牽引',
        evaluatorComments: '優れた成果を上げています',
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations[0].items).toHaveLength(3);
      expect(state.evaluations[0].overallRating).toBe('S');
    });
  });

  describe('updateEvaluation', () => {
    it('評価を更新できる', async () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [
          {
            id: 'item-1',
            category: 'performance',
            name: '目標達成度',
            description: '設定された目標の達成度',
            weight: 0.4,
            rating: 'A',
            score: 85,
            comments: '計画通りに進捗しています。',
          },
        ],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '目標達成に向けて計画的に行動できる',
        improvements: 'リーダーシップをさらに発揮することが期待される',
        goals: '次期はチームリーダーとしての役割を担う',
        evaluatorComments: '全体として良好な成果を上げています',
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);
      const originalUpdatedAt = created.updatedAt;

      // Wait 2ms to ensure updatedAt will be different
      await new Promise(resolve => setTimeout(resolve, 2));

      usePerformanceEvaluationStore.getState().updateEvaluation(created.id, {
        overallRating: 'S',
        overallScore: 92,
        evaluatorComments: '素晴らしい成果です',
      });

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations[0].overallRating).toBe('S');
      expect(state.evaluations[0].overallScore).toBe(92);
      expect(state.evaluations[0].evaluatorComments).toBe('素晴らしい成果です');
      expect(state.evaluations[0].updatedAt).not.toBe(originalUpdatedAt);
    });

    it('存在しない評価を更新しようとしても他の評価に影響しない', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      usePerformanceEvaluationStore.getState().updateEvaluation('non-existent-id', {
        overallRating: 'S',
      });

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations[0].overallRating).toBe('A');
    });
  });

  describe('deleteEvaluation', () => {
    it('評価を削除できる', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      const state1 = usePerformanceEvaluationStore.getState();
      expect(state1.evaluations).toHaveLength(1);

      usePerformanceEvaluationStore.getState().deleteEvaluation(created.id);

      const state2 = usePerformanceEvaluationStore.getState();
      expect(state2.evaluations).toHaveLength(0);
    });

    it('複数の評価から特定の評価だけを削除できる', () => {
      const eval1: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const eval2: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-002',
        employeeName: '佐藤花子',
        department: '開発部',
        position: 'シニアエンジニア',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'S',
        overallScore: 92,
        weightedScore: 92,
        evaluatorId: 'mgr-002',
        evaluatorName: '鈴木部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createEvaluation(eval1);
      usePerformanceEvaluationStore.getState().createEvaluation(eval2);

      const state1 = usePerformanceEvaluationStore.getState();
      expect(state1.evaluations).toHaveLength(2);

      // Find evaluation by employeeId instead of using array index
      const firstEval = state1.evaluations.find(e => e.employeeId === 'emp-001');
      expect(firstEval).toBeDefined();

      usePerformanceEvaluationStore.getState().deleteEvaluation(firstEval!.id);

      const state2 = usePerformanceEvaluationStore.getState();
      expect(state2.evaluations).toHaveLength(1);
      expect(state2.evaluations[0].employeeId).toBe('emp-002');
    });
  });

  describe('getEvaluation', () => {
    it('IDで評価を取得できる', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      const evaluation = usePerformanceEvaluationStore.getState().getEvaluation(created.id);
      expect(evaluation).toBeDefined();
      expect(evaluation?.employeeId).toBe('emp-001');
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const evaluation = usePerformanceEvaluationStore.getState().getEvaluation('non-existent-id');
      expect(evaluation).toBeUndefined();
    });
  });

  describe('getEvaluationsByEmployee', () => {
    it('従業員IDで評価を取得できる', () => {
      const eval1: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const eval2: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q2',
        evaluationDate: '2024-07-15',
        items: [],
        overallRating: 'S',
        overallScore: 92,
        weightedScore: 92,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createEvaluation(eval1);
      usePerformanceEvaluationStore.getState().createEvaluation(eval2);

      const evaluations = usePerformanceEvaluationStore
        .getState()
        .getEvaluationsByEmployee('emp-001');
      expect(evaluations).toHaveLength(2);
      expect(evaluations.every(e => e.employeeId === 'emp-001')).toBe(true);
    });
  });

  describe('getEvaluationsByPeriod', () => {
    it('年度と期間で評価を取得できる', () => {
      const eval1: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const eval2: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-002',
        employeeName: '佐藤花子',
        department: '開発部',
        position: 'シニアエンジニア',
        fiscalYear: 2024,
        period: 'Q2',
        evaluationDate: '2024-07-15',
        items: [],
        overallRating: 'S',
        overallScore: 92,
        weightedScore: 92,
        evaluatorId: 'mgr-002',
        evaluatorName: '鈴木部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createEvaluation(eval1);
      usePerformanceEvaluationStore.getState().createEvaluation(eval2);

      const evaluations = usePerformanceEvaluationStore
        .getState()
        .getEvaluationsByPeriod(2024, 'Q1');
      expect(evaluations).toHaveLength(1);
      expect(evaluations[0].period).toBe('Q1');
    });
  });

  describe('getEvaluationsByDepartment', () => {
    it('部門で評価を取得できる', () => {
      const eval1: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const eval2: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-002',
        employeeName: '佐藤花子',
        department: '開発部',
        position: 'シニアエンジニア',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'S',
        overallScore: 92,
        weightedScore: 92,
        evaluatorId: 'mgr-002',
        evaluatorName: '鈴木部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createEvaluation(eval1);
      usePerformanceEvaluationStore.getState().createEvaluation(eval2);

      const evaluations = usePerformanceEvaluationStore
        .getState()
        .getEvaluationsByDepartment('営業部');
      expect(evaluations).toHaveLength(1);
      expect(evaluations[0].department).toBe('営業部');
    });
  });

  describe('getEvaluationsByStatus', () => {
    it('ステータスで評価を取得できる', () => {
      const eval1: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const eval2: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-002',
        employeeName: '佐藤花子',
        department: '開発部',
        position: 'シニアエンジニア',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'S',
        overallScore: 92,
        weightedScore: 92,
        evaluatorId: 'mgr-002',
        evaluatorName: '鈴木部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'submitted',
      };

      usePerformanceEvaluationStore.getState().createEvaluation(eval1);
      usePerformanceEvaluationStore.getState().createEvaluation(eval2);

      const draftEvaluations = usePerformanceEvaluationStore
        .getState()
        .getEvaluationsByStatus('draft');
      expect(draftEvaluations).toHaveLength(1);
      expect(draftEvaluations[0].status).toBe('draft');
    });
  });

  describe('submitEvaluation', () => {
    it('評価を提出できる', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      usePerformanceEvaluationStore.getState().submitEvaluation(created.id);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations[0].status).toBe('submitted');
      expect(state.evaluations[0].submittedAt).toBeDefined();
    });
  });

  describe('approveEvaluation', () => {
    it('評価を承認できる', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'submitted',
      };

      const created = usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      usePerformanceEvaluationStore.getState().approveEvaluation(created.id);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations[0].status).toBe('approved');
      expect(state.evaluations[0].approvedAt).toBeDefined();
    });
  });

  describe('finalizeEvaluation', () => {
    it('評価を確定できる', () => {
      const newEvaluation: Omit<PerformanceEvaluation, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        position: '営業マネージャー',
        fiscalYear: 2024,
        period: 'Q1',
        evaluationDate: '2024-04-15',
        items: [],
        overallRating: 'A',
        overallScore: 85,
        weightedScore: 85,
        evaluatorId: 'mgr-001',
        evaluatorName: '山田部長',
        strengths: '',
        improvements: '',
        goals: '',
        evaluatorComments: '',
        status: 'approved',
      };

      const created = usePerformanceEvaluationStore.getState().createEvaluation(newEvaluation);

      usePerformanceEvaluationStore.getState().finalizeEvaluation(created.id);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations[0].status).toBe('finalized');
      expect(state.evaluations[0].finalizedAt).toBeDefined();
    });
  });

  describe('createBonusEvaluation', () => {
    it('賞与評価を作成できる', () => {
      const newBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer',
        performanceRating: 'S',
        performanceScore: 95,
        bonusMultiplier: 0.5,
        comments: '目標を大きく上回る成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createBonusEvaluation(newBonus);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.bonusEvaluations).toHaveLength(1);
      expect(state.bonusEvaluations[0].performanceRating).toBe('S');
      expect(state.bonusEvaluations[0].bonusMultiplier).toBe(0.5);
      expect(created.id).toBeDefined();
    });

    it('異なる賞与タイプの評価を作成できる', () => {
      const summerBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer',
        performanceRating: 'A',
        performanceScore: 85,
        bonusMultiplier: 0.3,
        comments: '良好な成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const winterBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'winter',
        performanceRating: 'S',
        performanceScore: 92,
        bonusMultiplier: 0.5,
        comments: '優れた成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createBonusEvaluation(summerBonus);
      usePerformanceEvaluationStore.getState().createBonusEvaluation(winterBonus);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.bonusEvaluations).toHaveLength(2);
    });
  });

  describe('updateBonusEvaluation', () => {
    it('賞与評価を更新できる', () => {
      const newBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer',
        performanceRating: 'A',
        performanceScore: 85,
        bonusMultiplier: 0.3,
        comments: '良好な成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createBonusEvaluation(newBonus);

      usePerformanceEvaluationStore.getState().updateBonusEvaluation(created.id, {
        performanceRating: 'S',
        performanceScore: 95,
        bonusMultiplier: 0.5,
        comments: '目標を大きく上回る成果',
      });

      const state = usePerformanceEvaluationStore.getState();
      expect(state.bonusEvaluations[0].performanceRating).toBe('S');
      expect(state.bonusEvaluations[0].performanceScore).toBe(95);
      expect(state.bonusEvaluations[0].bonusMultiplier).toBe(0.5);
    });
  });

  describe('getBonusEvaluation', () => {
    it('IDで賞与評価を取得できる', () => {
      const newBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer',
        performanceRating: 'S',
        performanceScore: 95,
        bonusMultiplier: 0.5,
        comments: '目標を大きく上回る成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createBonusEvaluation(newBonus);

      const bonus = usePerformanceEvaluationStore.getState().getBonusEvaluation(created.id);
      expect(bonus).toBeDefined();
      expect(bonus?.performanceRating).toBe('S');
    });
  });

  describe('getBonusEvaluationsByEmployee', () => {
    it('従業員IDで賞与評価を取得できる', () => {
      const summerBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer',
        performanceRating: 'A',
        performanceScore: 85,
        bonusMultiplier: 0.3,
        comments: '良好な成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const winterBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'winter',
        performanceRating: 'S',
        performanceScore: 92,
        bonusMultiplier: 0.5,
        comments: '優れた成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      usePerformanceEvaluationStore.getState().createBonusEvaluation(summerBonus);
      usePerformanceEvaluationStore.getState().createBonusEvaluation(winterBonus);

      const bonuses = usePerformanceEvaluationStore
        .getState()
        .getBonusEvaluationsByEmployee('emp-001');
      expect(bonuses).toHaveLength(2);
      expect(bonuses.every(b => b.employeeId === 'emp-001')).toBe(true);
    });
  });

  describe('approveBonusEvaluation', () => {
    it('賞与評価を承認できる', () => {
      const newBonus: Omit<BonusEvaluation, 'id' | 'createdAt'> = {
        employeeId: 'emp-001',
        employeeName: '田中太郎',
        department: '営業部',
        fiscalYear: 2024,
        bonusType: 'summer',
        performanceRating: 'S',
        performanceScore: 95,
        bonusMultiplier: 0.5,
        comments: '目標を大きく上回る成果',
        evaluatedBy: 'mgr-001',
        evaluatedByName: '山田部長',
        evaluatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const created = usePerformanceEvaluationStore.getState().createBonusEvaluation(newBonus);

      usePerformanceEvaluationStore.getState().approveBonusEvaluation(created.id);

      const state = usePerformanceEvaluationStore.getState();
      expect(state.bonusEvaluations[0].status).toBe('approved');
      expect(state.bonusEvaluations[0].approvedAt).toBeDefined();
    });
  });

  describe('getEvaluationStats', () => {
    beforeEach(() => {
      const evaluations = [
        {
          employeeId: 'emp-001',
          employeeName: '田中太郎',
          department: '営業部',
          position: '営業マネージャー',
          fiscalYear: 2024,
          period: 'Q1' as EvaluationPeriod,
          evaluationDate: '2024-04-15',
          items: [],
          overallRating: 'S' as PerformanceRating,
          overallScore: 95,
          weightedScore: 95,
          evaluatorId: 'mgr-001',
          evaluatorName: '山田部長',
          strengths: '',
          improvements: '',
          goals: '',
          evaluatorComments: '',
          status: 'approved' as const,
        },
        {
          employeeId: 'emp-002',
          employeeName: '佐藤花子',
          department: '開発部',
          position: 'シニアエンジニア',
          fiscalYear: 2024,
          period: 'Q1' as EvaluationPeriod,
          evaluationDate: '2024-04-15',
          items: [],
          overallRating: 'A' as PerformanceRating,
          overallScore: 85,
          weightedScore: 85,
          evaluatorId: 'mgr-002',
          evaluatorName: '鈴木部長',
          strengths: '',
          improvements: '',
          goals: '',
          evaluatorComments: '',
          status: 'approved' as const,
        },
        {
          employeeId: 'emp-003',
          employeeName: '鈴木一郎',
          department: '営業部',
          position: '営業担当',
          fiscalYear: 2024,
          period: 'Q1' as EvaluationPeriod,
          evaluationDate: '2024-04-15',
          items: [],
          overallRating: 'B' as PerformanceRating,
          overallScore: 75,
          weightedScore: 75,
          evaluatorId: 'mgr-001',
          evaluatorName: '山田部長',
          strengths: '',
          improvements: '',
          goals: '',
          evaluatorComments: '',
          status: 'submitted' as const,
        },
        {
          employeeId: 'emp-004',
          employeeName: '高橋美咲',
          department: '開発部',
          position: 'エンジニア',
          fiscalYear: 2024,
          period: 'Q1' as EvaluationPeriod,
          evaluationDate: '2024-04-15',
          items: [],
          overallRating: 'C' as PerformanceRating,
          overallScore: 65,
          weightedScore: 65,
          evaluatorId: 'mgr-002',
          evaluatorName: '鈴木部長',
          strengths: '',
          improvements: '',
          goals: '',
          evaluatorComments: '',
          status: 'draft' as const,
        },
      ];

      evaluations.forEach(e =>
        usePerformanceEvaluationStore.getState().createEvaluation(e)
      );
    });

    it('評価統計を取得できる', () => {
      const stats = usePerformanceEvaluationStore.getState().getEvaluationStats(2024);

      expect(stats.total).toBe(4);
      expect(stats.byRating.S).toBe(1);
      expect(stats.byRating.A).toBe(1);
      expect(stats.byRating.B).toBe(1);
      expect(stats.byRating.C).toBe(1);
      expect(stats.byStatus.approved).toBe(2);
      expect(stats.byStatus.submitted).toBe(1);
      expect(stats.byStatus.draft).toBe(1);
    });

    it('平均スコアが正しく計算される', () => {
      const stats = usePerformanceEvaluationStore.getState().getEvaluationStats(2024);

      // Average: (95 + 85 + 75 + 65) / 4 = 80
      expect(stats.averageScore).toBe(80);
    });

    it('期間を指定して統計を取得できる', () => {
      const stats = usePerformanceEvaluationStore.getState().getEvaluationStats(2024, 'Q1');

      expect(stats.total).toBe(4);
    });
  });

  describe('initializeSampleData', () => {
    it('サンプルデータを初期化できる', () => {
      usePerformanceEvaluationStore.getState().initializeSampleData();

      const state = usePerformanceEvaluationStore.getState();
      expect(state.evaluations.length).toBeGreaterThan(0);
    });
  });
});
