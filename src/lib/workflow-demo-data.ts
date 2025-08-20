import { WorkflowRequest, WorkflowType, WorkflowStatus, ApproverRole } from './workflow-store';

// デモ用の従業員データ
const employees = [
  { id: '1', name: '田中太郎', department: '営業部', role: 'manager' },
  { id: '2', name: '山田花子', department: '営業部', role: 'staff' },
  { id: '3', name: '佐藤次郎', department: '開発部', role: 'manager' },
  { id: '4', name: '鈴木一郎', department: '開発部', role: 'staff' },
  { id: '5', name: '高橋美咲', department: '人事部', role: 'manager' },
  { id: '6', name: '渡辺健太', department: '経理部', role: 'manager' },
  { id: '7', name: '伊藤真理', department: '総務部', role: 'staff' },
  { id: '8', name: '中村優子', department: '営業部', role: 'staff' },
  { id: '9', name: '小林大輔', department: '開発部', role: 'staff' },
  { id: '10', name: '加藤恵子', department: '人事部', role: 'staff' },
];

// 現在の日時を基準に過去の日付を生成
const now = new Date();
const getDateBefore = (days: number, hours = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

// デモ用のワークフローリクエストを生成
export const generateDemoWorkflowData = (): Partial<WorkflowRequest>[] => {
  return [
    // 1. 承認待ちの休暇申請（2日前に申請）
    {
      type: 'leave_request',
      title: '年末年始休暇申請',
      description: '12月28日から1月4日まで年末年始休暇を取得したく申請いたします。',
      requesterId: '2',
      requesterName: '山田花子',
      department: '営業部',
      status: 'pending',
      priority: 'normal',
      details: {
        leaveType: 'paid_leave',
        startDate: '2024-12-28',
        endDate: '2025-01-04',
        days: 5,
        reason: '実家への帰省',
        handover: '○○案件は田中さんに引き継ぎ済み',
      },
      approvalSteps: [
        {
          id: 'step-1-1',
          order: 1,
          approverRole: 'direct_manager',
          approverId: '1',
          approverName: '田中太郎',
          status: 'pending',
          escalationDeadline: getDateBefore(-2), // 2日後が期限
        },
        {
          id: 'step-1-2',
          order: 2,
          approverRole: 'hr_manager',
          approverId: '5',
          approverName: '高橋美咲',
          status: 'pending',
        },
      ],
      currentStep: 0,
      attachments: [],
      timeline: [
        {
          id: 'tl-1-1',
          action: '休暇申請を作成しました',
          userId: '2',
          userName: '山田花子',
          timestamp: getDateBefore(2),
        },
        {
          id: 'tl-1-2',
          action: '申請を提出しました',
          userId: '2',
          userName: '山田花子',
          timestamp: getDateBefore(2, 1),
        },
      ],
      createdAt: getDateBefore(2),
      updatedAt: getDateBefore(2),
      submittedAt: getDateBefore(2, 1),
      escalation: {
        enabled: true,
        daysUntilEscalation: 3,
        escalationPath: ['direct_manager', 'department_head', 'general_manager'],
      },
    },

    // 2. 一部承認済みの経費申請（5日前に申請）
    {
      type: 'expense_claim',
      title: '出張旅費精算（大阪出張）',
      description: '11月の大阪出張の交通費と宿泊費の精算申請です。',
      requesterId: '4',
      requesterName: '鈴木一郎',
      department: '開発部',
      status: 'partially_approved',
      priority: 'normal',
      details: {
        totalAmount: 85000,
        items: [
          { name: '新幹線（東京-大阪往復）', amount: 28000 },
          { name: 'ホテル宿泊費（2泊）', amount: 24000 },
          { name: '現地交通費', amount: 3000 },
          { name: '会議費（顧客との夕食）', amount: 30000 },
        ],
        paymentMethod: 'bank_transfer',
        projectCode: 'PRJ-2024-045',
      },
      approvalSteps: [
        {
          id: 'step-2-1',
          order: 1,
          approverRole: 'direct_manager',
          approverId: '3',
          approverName: '佐藤次郎',
          status: 'approved',
          actionDate: getDateBefore(3),
          comments: '内容確認済み。問題ありません。',
        },
        {
          id: 'step-2-2',
          order: 2,
          approverRole: 'finance_manager',
          approverId: '6',
          approverName: '渡辺健太',
          status: 'pending',
        },
      ],
      currentStep: 1,
      attachments: [
        {
          id: 'att-1',
          name: '領収書_新幹線.pdf',
          url: '#',
          size: 245678,
          uploadedAt: getDateBefore(5),
        },
        {
          id: 'att-2',
          name: '領収書_ホテル.pdf',
          url: '#',
          size: 189234,
          uploadedAt: getDateBefore(5),
        },
      ],
      timeline: [
        {
          id: 'tl-2-1',
          action: '経費申請を作成しました',
          userId: '4',
          userName: '鈴木一郎',
          timestamp: getDateBefore(5),
        },
        {
          id: 'tl-2-2',
          action: '申請を提出しました',
          userId: '4',
          userName: '鈴木一郎',
          timestamp: getDateBefore(5, 1),
        },
        {
          id: 'tl-2-3',
          action: '佐藤次郎が承認しました',
          userId: '3',
          userName: '佐藤次郎',
          timestamp: getDateBefore(3),
          comments: '内容確認済み。問題ありません。',
        },
      ],
      createdAt: getDateBefore(5),
      updatedAt: getDateBefore(3),
      submittedAt: getDateBefore(5, 1),
      escalation: {
        enabled: true,
        daysUntilEscalation: 3,
        escalationPath: ['direct_manager', 'finance_manager', 'general_manager'],
      },
    },

    // 3. 承認済みの残業申請（7日前に申請、3日前に承認完了）
    {
      type: 'overtime_request',
      title: '11月度残業申請（プロジェクトリリース対応）',
      description: 'プロジェクトリリースに向けた追加開発のため、11月の残業を申請します。',
      requesterId: '9',
      requesterName: '小林大輔',
      department: '開発部',
      status: 'approved',
      priority: 'high',
      details: {
        month: '2024-11',
        estimatedHours: 40,
        reason: '新機能リリース前の最終調整',
        project: 'Dandori Portal v2.0',
        breakdown: [
          { date: '2024-11-15', hours: 3, task: 'バグ修正' },
          { date: '2024-11-16', hours: 5, task: 'パフォーマンステスト' },
          { date: '2024-11-20', hours: 4, task: '本番環境デプロイ' },
        ],
      },
      approvalSteps: [
        {
          id: 'step-3-1',
          order: 1,
          approverRole: 'direct_manager',
          approverId: '3',
          approverName: '佐藤次郎',
          status: 'approved',
          actionDate: getDateBefore(5),
          comments: 'プロジェクト優先度を考慮し承認します。',
        },
        {
          id: 'step-3-2',
          order: 2,
          approverRole: 'department_head',
          approverId: '3',
          approverName: '佐藤次郎',
          status: 'approved',
          actionDate: getDateBefore(3),
          comments: '承認します。体調管理に気をつけてください。',
        },
      ],
      currentStep: 2,
      attachments: [],
      timeline: [
        {
          id: 'tl-3-1',
          action: '残業申請を作成しました',
          userId: '9',
          userName: '小林大輔',
          timestamp: getDateBefore(7),
        },
        {
          id: 'tl-3-2',
          action: '申請を提出しました',
          userId: '9',
          userName: '小林大輔',
          timestamp: getDateBefore(7, 1),
        },
        {
          id: 'tl-3-3',
          action: '佐藤次郎が承認しました',
          userId: '3',
          userName: '佐藤次郎',
          timestamp: getDateBefore(5),
        },
        {
          id: 'tl-3-4',
          action: '最終承認が完了しました',
          userId: '3',
          userName: '佐藤次郎',
          timestamp: getDateBefore(3),
        },
      ],
      createdAt: getDateBefore(7),
      updatedAt: getDateBefore(3),
      submittedAt: getDateBefore(7, 1),
      completedAt: getDateBefore(3),
      escalation: {
        enabled: false,
        daysUntilEscalation: 3,
        escalationPath: ['direct_manager', 'department_head'],
      },
    },

    // 4. 却下された購買申請（10日前に申請、8日前に却下）
    {
      type: 'purchase_request',
      title: '開発用MacBook Pro購入申請',
      description: '開発効率向上のため、新型MacBook Proの購入を申請します。',
      requesterId: '4',
      requesterName: '鈴木一郎',
      department: '開発部',
      status: 'rejected',
      priority: 'normal',
      details: {
        itemName: 'MacBook Pro 16インチ M3 Max',
        quantity: 1,
        unitPrice: 580000,
        totalAmount: 580000,
        vendor: 'Apple Store',
        purpose: '機械学習モデルの開発環境として必要',
        currentEquipment: 'MacBook Pro 2019（5年使用）',
      },
      approvalSteps: [
        {
          id: 'step-4-1',
          order: 1,
          approverRole: 'direct_manager',
          approverId: '3',
          approverName: '佐藤次郎',
          status: 'rejected',
          actionDate: getDateBefore(8),
          comments: '予算の都合上、来期での再申請をお願いします。',
        },
      ],
      currentStep: 0,
      attachments: [
        {
          id: 'att-3',
          name: '見積書_Apple.pdf',
          url: '#',
          size: 156789,
          uploadedAt: getDateBefore(10),
        },
      ],
      timeline: [
        {
          id: 'tl-4-1',
          action: '購買申請を作成しました',
          userId: '4',
          userName: '鈴木一郎',
          timestamp: getDateBefore(10),
        },
        {
          id: 'tl-4-2',
          action: '申請を提出しました',
          userId: '4',
          userName: '鈴木一郎',
          timestamp: getDateBefore(10, 1),
        },
        {
          id: 'tl-4-3',
          action: '佐藤次郎が却下しました',
          userId: '3',
          userName: '佐藤次郎',
          timestamp: getDateBefore(8),
          comments: '予算の都合上、来期での再申請をお願いします。',
        },
      ],
      createdAt: getDateBefore(10),
      updatedAt: getDateBefore(8),
      submittedAt: getDateBefore(10, 1),
      completedAt: getDateBefore(8),
      escalation: {
        enabled: false,
        daysUntilEscalation: 5,
        escalationPath: ['direct_manager', 'finance_manager'],
      },
    },

    // 5. エスカレーション中の出張申請（6日前に申請、期限切れ）
    {
      type: 'business_trip',
      title: '海外出張申請（シンガポール展示会）',
      description: '12月のシンガポール展示会への参加申請です。',
      requesterId: '8',
      requesterName: '中村優子',
      department: '営業部',
      status: 'escalated',
      priority: 'urgent',
      details: {
        destination: 'シンガポール',
        purpose: 'Tech Asia 2024展示会参加',
        startDate: '2024-12-15',
        endDate: '2024-12-18',
        estimatedCost: 350000,
        attendees: ['中村優子', '田中太郎'],
        accommodation: 'Marina Bay Sands',
        flights: 'JAL（成田-チャンギ）',
      },
      approvalSteps: [
        {
          id: 'step-5-1',
          order: 1,
          approverRole: 'direct_manager',
          approverId: '1',
          approverName: '田中太郎',
          status: 'pending',
          escalationDeadline: getDateBefore(3), // 期限切れ
        },
        {
          id: 'step-5-2',
          order: 2,
          approverRole: 'general_manager',
          approverId: '11',
          approverName: '執行役員',
          status: 'pending',
        },
      ],
      currentStep: 0,
      attachments: [
        {
          id: 'att-4',
          name: '展示会案内.pdf',
          url: '#',
          size: 2456789,
          uploadedAt: getDateBefore(6),
        },
        {
          id: 'att-5',
          name: '旅程表.xlsx',
          url: '#',
          size: 45678,
          uploadedAt: getDateBefore(6),
        },
      ],
      timeline: [
        {
          id: 'tl-5-1',
          action: '出張申請を作成しました',
          userId: '8',
          userName: '中村優子',
          timestamp: getDateBefore(6),
        },
        {
          id: 'tl-5-2',
          action: '申請を提出しました',
          userId: '8',
          userName: '中村優子',
          timestamp: getDateBefore(6, 1),
        },
        {
          id: 'tl-5-3',
          action: '承認期限を過ぎたため、執行役員にエスカレーションされました',
          userId: 'system',
          userName: 'システム',
          timestamp: getDateBefore(2),
        },
      ],
      createdAt: getDateBefore(6),
      updatedAt: getDateBefore(2),
      submittedAt: getDateBefore(6, 1),
      escalation: {
        enabled: true,
        daysUntilEscalation: 3,
        escalationPath: ['direct_manager', 'general_manager', 'ceo'],
        lastEscalatedAt: getDateBefore(2),
      },
    },

    // 6. 代理承認設定されたリモートワーク申請（1日前に申請）
    {
      type: 'remote_work',
      title: '在宅勤務申請（育児対応）',
      description: '子供の体調不良により、明日から3日間の在宅勤務を申請します。',
      requesterId: '10',
      requesterName: '加藤恵子',
      department: '人事部',
      status: 'pending',
      priority: 'high',
      details: {
        startDate: '2024-11-28',
        endDate: '2024-11-30',
        reason: '子供の看病',
        workLocation: '自宅',
        availableHours: '9:00-18:00（休憩1時間）',
        equipment: '会社貸与PC使用',
        tasks: [
          '採用面接（オンライン）',
          '人事評価資料作成',
          '給与計算チェック',
        ],
      },
      approvalSteps: [
        {
          id: 'step-6-1',
          order: 1,
          approverRole: 'direct_manager',
          approverId: '5',
          approverName: '高橋美咲',
          status: 'pending',
          delegatedTo: {
            id: '6',
            name: '渡辺健太',
            reason: '高橋は本日出張のため',
          },
        },
      ],
      currentStep: 0,
      attachments: [],
      timeline: [
        {
          id: 'tl-6-1',
          action: 'リモートワーク申請を作成しました',
          userId: '10',
          userName: '加藤恵子',
          timestamp: getDateBefore(1),
        },
        {
          id: 'tl-6-2',
          action: '申請を提出しました',
          userId: '10',
          userName: '加藤恵子',
          timestamp: getDateBefore(1, 1),
        },
        {
          id: 'tl-6-3',
          action: '高橋美咲が渡辺健太に承認を委任しました',
          userId: '5',
          userName: '高橋美咲',
          timestamp: getDateBefore(0, 6),
          comments: '高橋は本日出張のため',
        },
      ],
      createdAt: getDateBefore(1),
      updatedAt: getDateBefore(0, 6),
      submittedAt: getDateBefore(1, 1),
      escalation: {
        enabled: true,
        daysUntilEscalation: 2,
        escalationPath: ['direct_manager', 'hr_manager'],
      },
    },

    // 7. 下書き状態の休暇申請
    {
      type: 'leave_request',
      title: '夏季休暇申請',
      description: '8月のお盆期間に夏季休暇を取得予定',
      requesterId: '7',
      requesterName: '伊藤真理',
      department: '総務部',
      status: 'draft',
      priority: 'normal',
      details: {
        leaveType: 'summer_vacation',
        startDate: '2025-08-13',
        endDate: '2025-08-16',
        days: 4,
        reason: '帰省',
      },
      approvalSteps: [
        {
          id: 'step-7-1',
          order: 1,
          approverRole: 'direct_manager',
          approverId: '5',
          approverName: '高橋美咲',
          status: 'pending',
        },
      ],
      currentStep: 0,
      attachments: [],
      timeline: [
        {
          id: 'tl-7-1',
          action: '申請書を作成しました',
          userId: '7',
          userName: '伊藤真理',
          timestamp: getDateBefore(0, 2),
        },
      ],
      createdAt: getDateBefore(0, 2),
      updatedAt: getDateBefore(0, 2),
      escalation: {
        enabled: false,
        daysUntilEscalation: 3,
        escalationPath: ['direct_manager'],
      },
    },

    // 8. 緊急の経費申請（本日申請）
    {
      type: 'expense_claim',
      title: '緊急：サーバー障害対応の交通費',
      description: '深夜のサーバー障害対応のためのタクシー代精算',
      requesterId: '3',
      requesterName: '佐藤次郎',
      department: '開発部',
      status: 'pending',
      priority: 'urgent',
      details: {
        totalAmount: 15000,
        items: [
          { name: 'タクシー代（自宅→オフィス）', amount: 8500 },
          { name: 'タクシー代（オフィス→自宅）', amount: 6500 },
        ],
        incidentDate: '2024-11-26',
        reason: 'プロダクション環境の緊急障害対応',
      },
      approvalSteps: [
        {
          id: 'step-8-1',
          order: 1,
          approverRole: 'finance_manager',
          approverId: '6',
          approverName: '渡辺健太',
          status: 'pending',
        },
      ],
      currentStep: 0,
      attachments: [
        {
          id: 'att-6',
          name: 'タクシー領収書.jpg',
          url: '#',
          size: 1234567,
          uploadedAt: getDateBefore(0, 3),
        },
      ],
      timeline: [
        {
          id: 'tl-8-1',
          action: '緊急経費申請を作成しました',
          userId: '3',
          userName: '佐藤次郎',
          timestamp: getDateBefore(0, 4),
        },
        {
          id: 'tl-8-2',
          action: '申請を提出しました',
          userId: '3',
          userName: '佐藤次郎',
          timestamp: getDateBefore(0, 3),
        },
      ],
      createdAt: getDateBefore(0, 4),
      updatedAt: getDateBefore(0, 3),
      submittedAt: getDateBefore(0, 3),
      escalation: {
        enabled: true,
        daysUntilEscalation: 1, // 緊急なので1日でエスカレーション
        escalationPath: ['finance_manager', 'general_manager'],
      },
    },
  ];
};

// サンプルの承認コメント
export const sampleApprovalComments = [
  '内容を確認しました。問題ありません。',
  '承認します。',
  '業務への影響を考慮し、承認いたします。',
  '予算内であることを確認し、承認します。',
  '適切な申請内容と判断し、承認します。',
];

// サンプルの却下理由
export const sampleRejectionReasons = [
  '予算超過のため、却下させていただきます。',
  '時期を再検討していただく必要があります。',
  '代替案をご検討ください。',
  '追加資料の提出をお願いします。',
  '他の優先事項があるため、今回は見送らせていただきます。',
];