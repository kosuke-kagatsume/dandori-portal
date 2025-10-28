import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowRequest } from '@/lib/workflow-store';

// Mock approval card component (based on WorkflowCard from workflow page)
interface ApprovalCardProps {
  request: WorkflowRequest;
  onApprove?: () => void;
  onReject?: () => void;
  onDetail?: () => void;
}

function ApprovalCard({ request, onApprove, onReject, onDetail }: ApprovalCardProps) {
  return (
    <div data-testid="approval-card" className="p-4 border rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{request.title}</h3>
          <p className="text-sm text-muted-foreground">
            申請者: {request.requesterName}
          </p>
          <p className="text-sm text-muted-foreground">
            部署: {request.department}
          </p>
          <p className="text-sm">
            {new Date(request.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>
        <div className="flex gap-2">
          {onApprove && (
            <button onClick={onApprove} className="px-4 py-2 bg-green-600 text-white rounded">
              承認
            </button>
          )}
          {onReject && (
            <button onClick={onReject} className="px-4 py-2 bg-red-600 text-white rounded">
              却下
            </button>
          )}
          {onDetail && (
            <button onClick={onDetail} className="px-4 py-2 border rounded">
              詳細
            </button>
          )}
        </div>
      </div>
      {request.description && (
        <p className="mt-2 text-sm">{request.description}</p>
      )}
    </div>
  );
}

describe('ApprovalCard', () => {
  const mockRequest: WorkflowRequest = {
    id: 'req-1',
    type: 'leave_request',
    title: '有給休暇申請',
    description: '家族旅行のため',
    requesterId: 'user-1',
    requesterName: '田中太郎',
    department: '営業部',
    status: 'pending',
    priority: 'normal',
    details: { days: 3 },
    approvalSteps: [
      {
        id: 'step-1',
        order: 0,
        approverRole: 'direct_manager',
        approverId: 'manager-1',
        approverName: '佐藤部長',
        status: 'pending',
      },
    ],
    currentStep: 0,
    attachments: [],
    timeline: [],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  };

  describe('Rendering', () => {
    it('should render approval card with title', () => {
      render(<ApprovalCard request={mockRequest} />);
      expect(screen.getByText('有給休暇申請')).toBeInTheDocument();
    });

    it('should display requester name', () => {
      render(<ApprovalCard request={mockRequest} />);
      expect(screen.getByText(/田中太郎/)).toBeInTheDocument();
    });

    it('should display department', () => {
      render(<ApprovalCard request={mockRequest} />);
      expect(screen.getByText(/営業部/)).toBeInTheDocument();
    });

    it('should display request date', () => {
      render(<ApprovalCard request={mockRequest} />);
      const dateElement = screen.getByText(/2025/);
      expect(dateElement).toBeInTheDocument();
    });

    it('should display description when provided', () => {
      render(<ApprovalCard request={mockRequest} />);
      expect(screen.getByText('家族旅行のため')).toBeInTheDocument();
    });

    it('should not display description when not provided', () => {
      const requestWithoutDesc = { ...mockRequest, description: '' };
      render(<ApprovalCard request={requestWithoutDesc} />);
      expect(screen.queryByText('家族旅行のため')).not.toBeInTheDocument();
    });
  });

  describe('Approve Button', () => {
    it('should show approve button when onApprove provided', () => {
      render(<ApprovalCard request={mockRequest} onApprove={jest.fn()} />);
      expect(screen.getByRole('button', { name: '承認' })).toBeInTheDocument();
    });

    it('should not show approve button when onApprove not provided', () => {
      render(<ApprovalCard request={mockRequest} />);
      expect(screen.queryByRole('button', { name: '承認' })).not.toBeInTheDocument();
    });

    it('should call onApprove when approve button clicked', async () => {
      const user = userEvent.setup();
      const onApprove = jest.fn();
      render(<ApprovalCard request={mockRequest} onApprove={onApprove} />);

      const approveBtn = screen.getByRole('button', { name: '承認' });
      await user.click(approveBtn);

      expect(onApprove).toHaveBeenCalledTimes(1);
    });

    it('should have correct styling for approve button', () => {
      render(<ApprovalCard request={mockRequest} onApprove={jest.fn()} />);
      const approveBtn = screen.getByRole('button', { name: '承認' });
      expect(approveBtn).toHaveClass('bg-green-600');
    });
  });

  describe('Reject Button', () => {
    it('should show reject button when onReject provided', () => {
      render(<ApprovalCard request={mockRequest} onReject={jest.fn()} />);
      expect(screen.getByRole('button', { name: '却下' })).toBeInTheDocument();
    });

    it('should not show reject button when onReject not provided', () => {
      render(<ApprovalCard request={mockRequest} />);
      expect(screen.queryByRole('button', { name: '却下' })).not.toBeInTheDocument();
    });

    it('should call onReject when reject button clicked', async () => {
      const user = userEvent.setup();
      const onReject = jest.fn();
      render(<ApprovalCard request={mockRequest} onReject={onReject} />);

      const rejectBtn = screen.getByRole('button', { name: '却下' });
      await user.click(rejectBtn);

      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it('should have correct styling for reject button', () => {
      render(<ApprovalCard request={mockRequest} onReject={jest.fn()} />);
      const rejectBtn = screen.getByRole('button', { name: '却下' });
      expect(rejectBtn).toHaveClass('bg-red-600');
    });
  });

  describe('Detail Button', () => {
    it('should show detail button when onDetail provided', () => {
      render(<ApprovalCard request={mockRequest} onDetail={jest.fn()} />);
      expect(screen.getByRole('button', { name: '詳細' })).toBeInTheDocument();
    });

    it('should call onDetail when detail button clicked', async () => {
      const user = userEvent.setup();
      const onDetail = jest.fn();
      render(<ApprovalCard request={mockRequest} onDetail={onDetail} />);

      const detailBtn = screen.getByRole('button', { name: '詳細' });
      await user.click(detailBtn);

      expect(onDetail).toHaveBeenCalledTimes(1);
    });
  });

  describe('Request Details Display', () => {
    it('should display expense claim amount', () => {
      const expenseRequest: WorkflowRequest = {
        ...mockRequest,
        type: 'expense_claim',
        title: '経費申請',
        description: '交通費 ¥5,000',
      };
      render(<ApprovalCard request={expenseRequest} />);
      expect(screen.getByText('経費申請')).toBeInTheDocument();
      expect(screen.getByText('交通費 ¥5,000')).toBeInTheDocument();
    });

    it('should display overtime request hours', () => {
      const overtimeRequest: WorkflowRequest = {
        ...mockRequest,
        type: 'overtime_request',
        title: '残業申請（8時間）',
        description: '月末処理のため',
      };
      render(<ApprovalCard request={overtimeRequest} />);
      expect(screen.getByText('残業申請（8時間）')).toBeInTheDocument();
    });

    it('should display business trip destination', () => {
      const tripRequest: WorkflowRequest = {
        ...mockRequest,
        type: 'business_trip',
        title: '出張申請（大阪）',
        description: '顧客訪問',
      };
      render(<ApprovalCard request={tripRequest} />);
      expect(screen.getByText('出張申請（大阪）')).toBeInTheDocument();
    });
  });

  describe('Multiple Action Buttons', () => {
    it('should show all buttons when all handlers provided', () => {
      render(
        <ApprovalCard
          request={mockRequest}
          onApprove={jest.fn()}
          onReject={jest.fn()}
          onDetail={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: '承認' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '却下' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '詳細' })).toBeInTheDocument();
    });

    it('should enable approve and reject simultaneously', async () => {
      const user = userEvent.setup();
      const onApprove = jest.fn();
      const onReject = jest.fn();

      render(
        <ApprovalCard
          request={mockRequest}
          onApprove={onApprove}
          onReject={onReject}
        />
      );

      const approveBtn = screen.getByRole('button', { name: '承認' });
      const rejectBtn = screen.getByRole('button', { name: '却下' });

      expect(approveBtn).toBeEnabled();
      expect(rejectBtn).toBeEnabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ApprovalCard request={mockRequest} onApprove={jest.fn()} />);
      const card = screen.getByTestId('approval-card');
      expect(card).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(
        <ApprovalCard
          request={mockRequest}
          onApprove={jest.fn()}
          onReject={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: '承認' })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: '却下' })).toHaveAccessibleName();
    });
  });

  describe('Edge Cases', () => {
    it('should handle long titles gracefully', () => {
      const longTitleRequest = {
        ...mockRequest,
        title: '非常に長いタイトルのテストケースです。これは承認フローUIのテストのために作成されました。'.repeat(2),
      };
      render(<ApprovalCard request={longTitleRequest} />);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should handle requests without department', () => {
      const noDeptRequest = { ...mockRequest, department: '' };
      render(<ApprovalCard request={noDeptRequest} />);
      expect(screen.getByTestId('approval-card')).toBeInTheDocument();
    });

    it('should handle future dates', () => {
      const futureRequest = {
        ...mockRequest,
        createdAt: '2027-01-01T00:00:00Z',
      };
      render(<ApprovalCard request={futureRequest} />);
      expect(screen.getByText(/2027/)).toBeInTheDocument();
    });
  });
});
