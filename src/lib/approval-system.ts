// 承認システムのロジックとデータ管理

// 申請メタデータの型定義
export interface RequestMetadata {
  // 休暇申請
  leaveDays?: number;
  leaveType?: 'annual' | 'sick' | 'special' | 'unpaid';

  // 経費申請
  expenseAmount?: number;
  expenseCategory?: string;

  // 残業申請
  overtimeHours?: number;
  overtimeMonth?: string;

  // 勤怠修正
  correctionDaysAgo?: number;
  correctionReason?: string;
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverRole: 'manager' | 'hr' | 'admin';
  approverUserId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvedAt?: string;
  comment?: string;
  isRequired: boolean;
  addedByRule?: string; // 条件分岐ルールによって追加された場合、そのルール名
  deadline?: string; // 承認期限（ISO 8601形式）
  escalatedAt?: string; // エスカレーション実行日時
  escalatedTo?: string; // エスカレーション先の承認者ID
}

export interface ApprovalFlow {
  id: string;
  requestId: string;
  requestType: 'leave' | 'overtime' | 'expense' | 'attendance_correction';
  applicantId: string;
  applicantName: string;
  currentStep: number;
  overallStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled';
  steps: ApprovalStep[];
  submittedAt: string;
  completedAt?: string;
  urgency: 'low' | 'normal' | 'high';
  autoApprovalRules?: string[];
  returnReason?: string; // 差し戻し理由
  returnedBy?: string;   // 差し戻し実行者ID
  returnedAt?: string;   // 差し戻し日時
  requestMetadata?: RequestMetadata; // 申請の詳細メタデータ
  appliedRules?: string[]; // 適用された条件分岐ルール一覧
}

// 部署の型定義
interface Department {
  manager: { userId: string; name: string; role: string };
  members: string[];
  isHR?: boolean;
  isAdmin?: boolean;
}

// 組織構造とロール定義
export const organizationHierarchy: { departments: Record<string, Department> } = {
  departments: {
    '開発部': {
      manager: { userId: '1', name: '田中太郎', role: 'manager' },
      members: ['1', '2', '10'], // 田中太郎, 佐藤花子, 吉田真一
    },
    '営業部': {
      manager: { userId: '3', name: '鈴木一郎', role: 'manager' },
      members: ['3', '4'], // 鈴木一郎, 山田美咲
    },
    '総務部': {
      manager: { userId: '5', name: '伊藤健太', role: 'manager' },
      members: ['5', '6'], // 伊藤健太, 渡辺由美
    },
    '人事部': {
      manager: { userId: '8', name: '小林恵子', role: 'manager' },
      members: ['8'], // 小林恵子
      isHR: true,
    },
    '経理部': {
      manager: { userId: '7', name: '高橋直樹', role: 'admin' },
      members: ['7'], // 高橋直樹
      isAdmin: true,
    },
    'マーケティング部': {
      manager: { userId: '9', name: '加藤修', role: 'manager' },
      members: ['9'], // 加藤修
    },
  }
};

// ユーザーの部署とマネージャーを取得
export function getUserDepartmentInfo(userId: string) {
  for (const [deptName, dept] of Object.entries(organizationHierarchy.departments)) {
    if (dept.members.includes(userId)) {
      return {
        department: deptName,
        manager: dept.manager,
        isManager: dept.manager.userId === userId,
        isHR: dept.isHR || false,
        isAdmin: dept.isAdmin || false,
      };
    }
  }
  return null;
}

// 条件分岐ルールの評価
export function evaluateConditionalRules(
  requestType: ApprovalFlow['requestType'],
  metadata?: RequestMetadata
): { needsHR: boolean; needsAdmin: boolean; appliedRules: string[] } {
  let needsHR = false;
  let needsAdmin = false;
  const appliedRules: string[] = [];

  if (!metadata) {
    return { needsHR, needsAdmin, appliedRules };
  }

  switch (requestType) {
    case 'leave':
      // 5日以上の休暇申請は人事部承認が必要
      if (metadata.leaveDays && metadata.leaveDays >= 5) {
        needsHR = true;
        appliedRules.push('長期休暇（5日以上）のため人事部承認が必要');
      }
      break;

    case 'expense':
      // 10万円以上の経費は経理部承認が必要
      if (metadata.expenseAmount && metadata.expenseAmount >= 100000) {
        needsAdmin = true;
        appliedRules.push('高額経費（10万円以上）のため経理部承認が必要');
      }
      // 50万円以上は人事部も必要
      if (metadata.expenseAmount && metadata.expenseAmount >= 500000) {
        needsHR = true;
        appliedRules.push('超高額経費（50万円以上）のため人事部承認も必要');
      }
      break;

    case 'overtime':
      // 月40時間以上の残業は人事部承認が必要
      if (metadata.overtimeHours && metadata.overtimeHours >= 40) {
        needsHR = true;
        appliedRules.push('長時間残業（40時間以上）のため人事部承認が必要');
      }
      // 月60時間以上は経理部も必要
      if (metadata.overtimeHours && metadata.overtimeHours >= 60) {
        needsAdmin = true;
        appliedRules.push('超過残業（60時間以上）のため経理部承認も必要');
      }
      break;

    case 'attendance_correction':
      // 30日以上前の勤怠修正は人事部承認が必要
      if (metadata.correctionDaysAgo && metadata.correctionDaysAgo >= 30) {
        needsHR = true;
        appliedRules.push('過去の勤怠修正（30日以上前）のため人事部承認が必要');
      }
      break;
  }

  return { needsHR, needsAdmin, appliedRules };
}

// 緊急度に応じた承認期限を計算（時間単位）
function calculateDeadlineHours(urgency: ApprovalFlow['urgency']): number {
  switch (urgency) {
    case 'high':
      return 24; // 24時間
    case 'normal':
      return 48; // 48時間
    case 'low':
      return 72; // 72時間
    default:
      return 48;
  }
}

// 承認期限を生成（ISO 8601形式）
function generateDeadline(urgency: ApprovalFlow['urgency']): string {
  const hours = calculateDeadlineHours(urgency);
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline.toISOString();
}

// 承認フローを生成
export function createApprovalFlow(
  requestId: string,
  requestType: ApprovalFlow['requestType'],
  applicantId: string,
  applicantName: string,
  urgency: ApprovalFlow['urgency'] = 'normal',
  metadata?: RequestMetadata
): ApprovalFlow {
  const userInfo = getUserDepartmentInfo(applicantId);
  const steps: ApprovalStep[] = [];

  if (!userInfo) {
    throw new Error('User department information not found');
  }

  // 条件分岐ルールを評価
  const { needsHR, needsAdmin, appliedRules } = evaluateConditionalRules(requestType, metadata);

  let stepNumber = 1;

  // Step 1: 直属上司の承認（申請者が管理者でない場合）
  if (!userInfo.isManager) {
    steps.push({
      id: `${requestId}-step-${stepNumber}`,
      stepNumber: stepNumber++,
      approverRole: 'manager',
      approverUserId: userInfo.manager.userId,
      approverName: userInfo.manager.name,
      status: 'pending',
      isRequired: true,
      deadline: generateDeadline(urgency),
    });
  }

  // Step 2: 人事部の承認（条件分岐で必要な場合、または休暇申請、または緊急度が高い場合）
  const requiresHR = needsHR || requestType === 'leave' || urgency === 'high';
  if (requiresHR) {
    const hrDept = Object.entries(organizationHierarchy.departments)
      .find(([, dept]) => dept.isHR);

    if (hrDept) {
      const [, hrInfo] = hrDept;
      // 申請者が人事部でない場合のみ人事承認を追加
      if (userInfo.department !== '人事部') {
        const hrRule = appliedRules.find(r => r.includes('人事部'));
        steps.push({
          id: `${requestId}-step-${stepNumber}`,
          stepNumber: stepNumber++,
          approverRole: 'hr',
          approverUserId: hrInfo.manager.userId,
          approverName: hrInfo.manager.name,
          status: 'pending',
          isRequired: true,
          addedByRule: hrRule,
          deadline: generateDeadline(urgency),
        });
      }
    }
  }

  // Step 3: 経理部の承認（条件分岐で必要な場合）
  if (needsAdmin) {
    const adminDept = Object.entries(organizationHierarchy.departments)
      .find(([, dept]) => dept.isAdmin);

    if (adminDept) {
      const [, adminInfo] = adminDept;
      // 申請者が経理部でない場合のみ経理承認を追加
      if (userInfo.department !== '経理部') {
        const adminRule = appliedRules.find(r => r.includes('経理部'));
        steps.push({
          id: `${requestId}-step-${stepNumber}`,
          stepNumber: stepNumber++,
          approverRole: 'admin',
          approverUserId: adminInfo.manager.userId,
          approverName: adminInfo.manager.name,
          status: 'pending',
          isRequired: true,
          addedByRule: adminRule,
          deadline: generateDeadline(urgency),
        });
      }
    }
  }

  return {
    id: `approval-${requestId}`,
    requestId,
    requestType,
    applicantId,
    applicantName,
    currentStep: 1,
    overallStatus: 'draft',
    steps,
    submittedAt: new Date().toISOString(),
    urgency,
    requestMetadata: metadata,
    appliedRules: appliedRules.length > 0 ? appliedRules : undefined,
  };
}

// 承認処理
export function processApproval(
  flow: ApprovalFlow,
  approverUserId: string,
  action: 'approve' | 'reject',
  comment?: string
): ApprovalFlow {
  const currentStep = flow.steps.find(step => 
    step.stepNumber === flow.currentStep && 
    step.approverUserId === approverUserId
  );

  if (!currentStep) {
    throw new Error('Invalid approval step or approver');
  }

  // 現在のステップを更新
  const updatedSteps = flow.steps.map(step => {
    if (step.id === currentStep.id) {
      return {
        ...step,
        status: action === 'approve' ? 'approved' as const : 'rejected' as const,
        approvedAt: new Date().toISOString(),
        comment,
      };
    }
    return step;
  });

  let newOverallStatus: ApprovalFlow['overallStatus'] = flow.overallStatus;
  let newCurrentStep = flow.currentStep;

  if (action === 'reject') {
    // 却下の場合、全体のステータスを却下に
    newOverallStatus = 'rejected';
  } else {
    // 承認の場合、次のステップへ
    const nextStep = updatedSteps.find(step => step.stepNumber > flow.currentStep);
    if (nextStep) {
      newCurrentStep = nextStep.stepNumber;
      newOverallStatus = 'pending';
    } else {
      // 全ステップ完了
      newOverallStatus = 'approved';
    }
  }

  return {
    ...flow,
    steps: updatedSteps,
    currentStep: newCurrentStep,
    overallStatus: newOverallStatus,
    completedAt: newOverallStatus === 'approved' || newOverallStatus === 'rejected' 
      ? new Date().toISOString() 
      : undefined,
  };
}

// 差し戻し処理
export function returnToSender(
  flow: ApprovalFlow,
  approverUserId: string,
  reason: string
): ApprovalFlow {
  const currentStep = flow.steps.find(step =>
    step.stepNumber === flow.currentStep &&
    step.approverUserId === approverUserId
  );

  if (!currentStep) {
    throw new Error('Invalid approval step or approver');
  }

  // すべてのステップを pending に戻す
  const resetSteps = flow.steps.map(step => ({
    ...step,
    status: 'pending' as const,
    approvedAt: undefined,
    comment: undefined,
  }));

  return {
    ...flow,
    steps: resetSteps,
    currentStep: 1, // 最初のステップに戻す
    overallStatus: 'returned',
    returnReason: reason,
    returnedBy: approverUserId,
    returnedAt: new Date().toISOString(),
    completedAt: undefined,
  };
}

// 承認待ちのリクエストを取得
export function getPendingApprovalsForUser(userId: string, flows: ApprovalFlow[]): ApprovalFlow[] {
  return flows.filter(flow => {
    const currentStep = flow.steps.find(step => 
      step.stepNumber === flow.currentStep &&
      step.approverUserId === userId &&
      step.status === 'pending'
    );
    return currentStep && flow.overallStatus === 'pending';
  });
}

// 自動承認ルールをチェック
export function checkAutoApprovalRules(
  requestType: ApprovalFlow['requestType'],
  applicantId: string,
  requestData: any
): boolean {
  // 例: 1日以下の有給は自動承認
  if (requestType === 'leave' && requestData.days <= 1 && requestData.leaveType === 'annual') {
    return true;
  }
  
  // 例: 土日の勤怠修正は自動承認
  if (requestType === 'attendance_correction' && requestData.isWeekend) {
    return true;
  }
  
  return false;
}

// 承認フローの進捗率を計算
export function calculateProgress(flow: ApprovalFlow): number {
  const totalSteps = flow.steps.length;
  const completedSteps = flow.steps.filter(step =>
    step.status === 'approved' || step.status === 'rejected'
  ).length;

  return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
}

// 期限超過の承認ステップを検出
export function checkForOverdueApprovals(flows: ApprovalFlow[]): Array<{
  flow: ApprovalFlow;
  step: ApprovalStep;
  hoursOverdue: number;
}> {
  const now = new Date();
  const overdueApprovals: Array<{
    flow: ApprovalFlow;
    step: ApprovalStep;
    hoursOverdue: number;
  }> = [];

  for (const flow of flows) {
    // 承認待ちの申請のみチェック
    if (flow.overallStatus !== 'pending') continue;

    const currentStep = flow.steps.find(
      step => step.stepNumber === flow.currentStep && step.status === 'pending'
    );

    if (currentStep && currentStep.deadline) {
      const deadline = new Date(currentStep.deadline);
      if (now > deadline) {
        const hoursOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60));
        overdueApprovals.push({
          flow,
          step: currentStep,
          hoursOverdue,
        });
      }
    }
  }

  return overdueApprovals;
}

// 上位承認者を見つける
function findEscalationTarget(currentApproverRole: ApprovalStep['approverRole']): {
  role: ApprovalStep['approverRole'];
  userId: string;
  name: string;
} | null {
  // エスカレーション先の優先順位: manager → hr → admin
  const escalationHierarchy: Array<ApprovalStep['approverRole']> = ['manager', 'hr', 'admin'];
  const currentIndex = escalationHierarchy.indexOf(currentApproverRole);

  // 既に最上位の場合、またはロールが見つからない場合
  if (currentIndex === -1 || currentIndex >= escalationHierarchy.length - 1) {
    // Adminにエスカレーション
    const adminDept = Object.entries(organizationHierarchy.departments).find(
      ([, dept]) => dept.isAdmin
    );
    if (adminDept) {
      const [, adminInfo] = adminDept;
      return {
        role: 'admin',
        userId: adminInfo.manager.userId,
        name: adminInfo.manager.name,
      };
    }
    return null;
  }

  // 次の階層にエスカレーション
  const nextRole = escalationHierarchy[currentIndex + 1];

  if (nextRole === 'hr') {
    const hrDept = Object.entries(organizationHierarchy.departments).find(
      ([, dept]) => dept.isHR
    );
    if (hrDept) {
      const [, hrInfo] = hrDept;
      return {
        role: 'hr',
        userId: hrInfo.manager.userId,
        name: hrInfo.manager.name,
      };
    }
  } else if (nextRole === 'admin') {
    const adminDept = Object.entries(organizationHierarchy.departments).find(
      ([, dept]) => dept.isAdmin
    );
    if (adminDept) {
      const [, adminInfo] = adminDept;
      return {
        role: 'admin',
        userId: adminInfo.manager.userId,
        name: adminInfo.manager.name,
      };
    }
  }

  return null;
}

// エスカレーション処理
export function escalateApproval(
  flow: ApprovalFlow,
  overdueStep: ApprovalStep
): ApprovalFlow {
  const escalationTarget = findEscalationTarget(overdueStep.approverRole);

  if (!escalationTarget) {
    throw new Error('No escalation target found');
  }

  // ステップを更新してエスカレーション情報を記録
  const updatedSteps = flow.steps.map(step => {
    if (step.id === overdueStep.id) {
      return {
        ...step,
        escalatedAt: new Date().toISOString(),
        escalatedTo: escalationTarget.userId,
        // 新しい期限を設定（緊急扱いで24時間）
        deadline: generateDeadline('high'),
      };
    }
    return step;
  });

  return {
    ...flow,
    steps: updatedSteps,
  };
}