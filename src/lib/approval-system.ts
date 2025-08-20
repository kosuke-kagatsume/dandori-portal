// 承認システムのロジックとデータ管理

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
}

export interface ApprovalFlow {
  id: string;
  requestId: string;
  requestType: 'leave' | 'overtime' | 'expense' | 'attendance_correction';
  applicantId: string;
  applicantName: string;
  currentStep: number;
  overallStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  steps: ApprovalStep[];
  submittedAt: string;
  completedAt?: string;
  urgency: 'low' | 'normal' | 'high';
  autoApprovalRules?: string[];
}

// 組織構造とロール定義
export const organizationHierarchy = {
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

// 承認フローを生成
export function createApprovalFlow(
  requestId: string,
  requestType: ApprovalFlow['requestType'],
  applicantId: string,
  applicantName: string,
  urgency: ApprovalFlow['urgency'] = 'normal'
): ApprovalFlow {
  const userInfo = getUserDepartmentInfo(applicantId);
  const steps: ApprovalStep[] = [];
  
  if (!userInfo) {
    throw new Error('User department information not found');
  }

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
    });
  }

  // Step 2: 人事部の承認（休暇申請の場合、または5日以上の長期休暇）
  if (requestType === 'leave' || urgency === 'high') {
    const hrDept = Object.entries(organizationHierarchy.departments)
      .find(([, dept]) => dept.isHR);
    
    if (hrDept) {
      const [, hrInfo] = hrDept;
      // 申請者が人事部でない場合のみ人事承認を追加
      if (userInfo.department !== '人事部') {
        steps.push({
          id: `${requestId}-step-${stepNumber}`,
          stepNumber: stepNumber++,
          approverRole: 'hr',
          approverUserId: hrInfo.manager.userId,
          approverName: hrInfo.manager.name,
          status: 'pending',
          isRequired: true,
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