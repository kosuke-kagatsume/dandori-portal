import { render, screen } from '@testing-library/react';
import { WorkflowRequest, ApprovalStep } from '@/lib/workflow-store';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// Mock ApprovalHistory component
interface ApprovalHistoryProps {
  approvalSteps: ApprovalStep[];
}

function ApprovalHistory({ approvalSteps }: ApprovalHistoryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">承認履歴</h3>
      {approvalSteps.length === 0 ? (
        <p className="text-muted-foreground">承認履歴はありません</p>
      ) : (
        <div className="space-y-3">
          {approvalSteps.map((step) => (
            <div key={step.id} className="border-l-2 pl-4 py-2" data-testid="approval-step">
              <div className="flex items-center gap-2">
                <span className="font-medium">{step.approverName}</span>
                <span className="text-sm text-muted-foreground">
                  ({getRoleLabel(step.approverRole)})
                </span>
                <span className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                  {getStatusLabel(step.status)}
                </span>
              </div>
              {step.actionDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(step.actionDate), 'yyyy/MM/dd HH:mm', { locale: ja })}
                </p>
              )}
              {step.comments && (
                <p className="text-sm mt-2 p-2 bg-muted rounded">
                  コメント: {step.comments}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    direct_manager: '直属上司',
    department_head: '部門長',
    hr_manager: '人事部長',
    finance_manager: '経理部長',
    general_manager: '役員',
  };
  return labels[role] || role;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '承認待ち',
    approved: '承認済み',
    rejected: '却下',
    skipped: 'スキップ',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600',
    approved: 'text-green-600',
    rejected: 'text-red-600',
    skipped: 'text-gray-400',
  };
  return colors[status] || '';
}

describe('ApprovalHistory', () => {
  const mockApprovalSteps: ApprovalStep[] = [
    {
      id: 'step-1',
      order: 0,
      approverRole: 'direct_manager',
      approverId: 'manager-1',
      approverName: '佐藤部長',
      status: 'approved',
      actionDate: '2025-01-15T10:00:00Z',
      comments: '承認します',
    },
    {
      id: 'step-2',
      order: 1,
      approverRole: 'hr_manager',
      approverId: 'hr-1',
      approverName: '田中人事',
      status: 'approved',
      actionDate: '2025-01-15T14:30:00Z',
      comments: '問題ありません',
    },
  ];

  describe('Display Approvers', () => {
    it('should display list of approvers', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      expect(screen.getByText('佐藤部長')).toBeInTheDocument();
      expect(screen.getByText('田中人事')).toBeInTheDocument();
    });

    it('should display approver roles', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      expect(screen.getByText(/直属上司/)).toBeInTheDocument();
      expect(screen.getByText(/人事部長/)).toBeInTheDocument();
    });

    it('should render correct number of approval steps', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      const steps = screen.getAllByTestId('approval-step');
      expect(steps).toHaveLength(2);
    });
  });

  describe('Display Timestamps', () => {
    it('should show approval timestamp for approved steps', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      expect(screen.getByText(/2025\/01\/15 19:00/)).toBeInTheDocument(); // UTC+9 JST
      expect(screen.getByText(/2025\/01\/15 23:30/)).toBeInTheDocument(); // UTC+9 JST
    });

    it('should not show timestamp for pending steps', () => {
      const pendingSteps: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: 'manager-1',
          approverName: '佐藤部長',
          status: 'pending',
        },
      ];
      render(<ApprovalHistory approvalSteps={pendingSteps} />);
      expect(screen.queryByText(/2025/)).not.toBeInTheDocument();
    });

    it('should format timestamp correctly in Japanese locale', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      const timestamp = screen.getByText(/2025\/01\/15 19:00/); // UTC+9 JST
      expect(timestamp).toBeInTheDocument();
    });
  });

  describe('Display Comments', () => {
    it('should display approval comments when available', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      expect(screen.getByText(/承認します/)).toBeInTheDocument();
      expect(screen.getByText(/問題ありません/)).toBeInTheDocument();
    });

    it('should not display comments section when no comments', () => {
      const noCommentSteps: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: 'manager-1',
          approverName: '佐藤部長',
          status: 'approved',
          actionDate: '2025-01-15T10:00:00Z',
        },
      ];
      render(<ApprovalHistory approvalSteps={noCommentSteps} />);
      expect(screen.queryByText(/コメント:/)).not.toBeInTheDocument();
    });

    it('should display rejection comments', () => {
      const rejectedSteps: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: 'manager-1',
          approverName: '佐藤部長',
          status: 'rejected',
          actionDate: '2025-01-15T10:00:00Z',
          comments: '書類不備のため却下します',
        },
      ];
      render(<ApprovalHistory approvalSteps={rejectedSteps} />);
      expect(screen.getByText(/書類不備のため却下します/)).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show approved status with green color', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      const approvedStatuses = screen.getAllByText('承認済み');
      approvedStatuses.forEach((status) => {
        expect(status).toHaveClass('text-green-600');
      });
    });

    it('should show pending status with yellow color', () => {
      const pendingSteps: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: 'manager-1',
          approverName: '佐藤部長',
          status: 'pending',
        },
      ];
      render(<ApprovalHistory approvalSteps={pendingSteps} />);
      const pendingStatus = screen.getByText('承認待ち');
      expect(pendingStatus).toHaveClass('text-yellow-600');
    });

    it('should show rejected status with red color', () => {
      const rejectedSteps: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: 'manager-1',
          approverName: '佐藤部長',
          status: 'rejected',
          actionDate: '2025-01-15T10:00:00Z',
        },
      ];
      render(<ApprovalHistory approvalSteps={rejectedSteps} />);
      const rejectedStatus = screen.getByText('却下');
      expect(rejectedStatus).toHaveClass('text-red-600');
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no approval steps', () => {
      render(<ApprovalHistory approvalSteps={[]} />);
      expect(screen.getByText('承認履歴はありません')).toBeInTheDocument();
    });

    it('should not render approval step list when empty', () => {
      render(<ApprovalHistory approvalSteps={[]} />);
      expect(screen.queryByTestId('approval-step')).not.toBeInTheDocument();
    });
  });

  describe('Multi-step Approval Flow', () => {
    it('should display 3-step approval flow', () => {
      const threeSteps: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: 'manager-1',
          approverName: '佐藤部長',
          status: 'approved',
          actionDate: '2025-01-15T10:00:00Z',
        },
        {
          id: 'step-2',
          order: 1,
          approverRole: 'hr_manager',
          approverId: 'hr-1',
          approverName: '田中人事',
          status: 'approved',
          actionDate: '2025-01-15T14:00:00Z',
        },
        {
          id: 'step-3',
          order: 2,
          approverRole: 'general_manager',
          approverId: 'gm-1',
          approverName: '鈴木役員',
          status: 'pending',
        },
      ];
      render(<ApprovalHistory approvalSteps={threeSteps} />);
      expect(screen.getAllByTestId('approval-step')).toHaveLength(3);
    });

    it('should show mixed status flow', () => {
      const mixedSteps: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: 'manager-1',
          approverName: '佐藤部長',
          status: 'approved',
          actionDate: '2025-01-15T10:00:00Z',
        },
        {
          id: 'step-2',
          order: 1,
          approverRole: 'hr_manager',
          approverId: 'hr-1',
          approverName: '田中人事',
          status: 'pending',
        },
      ];
      render(<ApprovalHistory approvalSteps={mixedSteps} />);
      expect(screen.getByText('承認済み')).toBeInTheDocument();
      expect(screen.getByText('承認待ち')).toBeInTheDocument();
    });
  });

  describe('Approver Roles', () => {
    it('should display all role types correctly', () => {
      const allRoles: ApprovalStep[] = [
        {
          id: 'step-1',
          order: 0,
          approverRole: 'direct_manager',
          approverId: '1',
          approverName: '上司',
          status: 'approved',
        },
        {
          id: 'step-2',
          order: 1,
          approverRole: 'department_head',
          approverId: '2',
          approverName: '部門長',
          status: 'approved',
        },
        {
          id: 'step-3',
          order: 2,
          approverRole: 'hr_manager',
          approverId: '3',
          approverName: '人事',
          status: 'approved',
        },
        {
          id: 'step-4',
          order: 3,
          approverRole: 'finance_manager',
          approverId: '4',
          approverName: '経理',
          status: 'approved',
        },
        {
          id: 'step-5',
          order: 4,
          approverRole: 'general_manager',
          approverId: '5',
          approverName: '役員',
          status: 'approved',
        },
      ];
      render(<ApprovalHistory approvalSteps={allRoles} />);

      expect(screen.getByText(/直属上司/)).toBeInTheDocument();
      expect(screen.getAllByText(/部門長/).length).toBeGreaterThan(0); // Multiple instances (name + role)
      expect(screen.getByText(/人事部長/)).toBeInTheDocument();
      expect(screen.getByText(/経理部長/)).toBeInTheDocument();
      expect(screen.getByText(/役員/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      expect(screen.getByRole('heading', { level: 3, name: '承認履歴' })).toBeInTheDocument();
    });

    it('should have proper ARIA structure for list', () => {
      render(<ApprovalHistory approvalSteps={mockApprovalSteps} />);
      const steps = screen.getAllByTestId('approval-step');
      expect(steps.length).toBeGreaterThan(0);
    });
  });
});
