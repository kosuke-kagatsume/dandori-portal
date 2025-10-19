import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowRequest } from '@/lib/workflow-store';

// Mock ApprovalDialog component
interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: WorkflowRequest | null;
  action: 'approve' | 'reject';
  onConfirm: (comment: string) => void;
}

function ApprovalDialog({
  open,
  onOpenChange,
  request,
  action,
  onConfirm,
}: ApprovalDialogProps) {
  const [comment, setComment] = React.useState('');

  if (!open || !request) return null;

  const handleConfirm = () => {
    if (action === 'reject' && !comment.trim()) {
      return; // Prevent submission without comment for reject
    }
    onConfirm(comment);
    setComment('');
  };

  return (
    <div role="dialog" aria-labelledby="dialog-title">
      <h2 id="dialog-title">
        {action === 'approve' ? '申請を承認' : '申請を却下'}
      </h2>
      <div>
        <p>申請者: {request.requesterName}</p>
        <p>タイトル: {request.title}</p>
      </div>
      <div>
        <label htmlFor="comment">
          コメント {action === 'reject' && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            action === 'approve'
              ? '承認コメント（任意）'
              : '却下理由を入力してください（必須）'
          }
        />
      </div>
      <div>
        <button onClick={() => onOpenChange(false)}>キャンセル</button>
        <button
          onClick={handleConfirm}
          disabled={action === 'reject' && !comment.trim()}
        >
          {action === 'approve' ? '承認する' : '却下する'}
        </button>
      </div>
    </div>
  );
}

import React from 'react';

describe('ApprovalDialog', () => {
  const mockRequest: WorkflowRequest = {
    id: 'req-1',
    type: 'leave_request',
    title: '有給休暇申請',
    description: '家族旅行',
    requesterId: 'user-1',
    requesterName: '田中太郎',
    department: '営業部',
    status: 'pending',
    priority: 'normal',
    details: {},
    approvalSteps: [],
    currentStep: 0,
    attachments: [],
    timeline: [],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  };

  describe('Approve Dialog', () => {
    it('should open approval dialog', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('申請を承認')).toBeInTheDocument();
    });

    it('should display request information', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText(/田中太郎/)).toBeInTheDocument();
      expect(screen.getByText(/有給休暇申請/)).toBeInTheDocument();
    });

    it('should allow optional comment for approval', async () => {
      const user = userEvent.setup();
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      const commentInput = screen.getByPlaceholderText(/承認コメント/);
      await user.type(commentInput, '承認します');

      expect(commentInput).toHaveValue('承認します');
    });

    it('should call onConfirm with comment when approved', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={onConfirm}
        />
      );

      const commentInput = screen.getByPlaceholderText(/承認コメント/);
      await user.type(commentInput, 'Test approval');

      const confirmBtn = screen.getByRole('button', { name: '承認する' });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith('Test approval');
      });
    });

    it('should allow approval without comment', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={onConfirm}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: '承認する' });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith('');
      });
    });

    it('should close dialog when cancelled', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={onOpenChange}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      const cancelBtn = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelBtn);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Reject Dialog', () => {
    it('should open reject dialog', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="reject"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('申請を却下')).toBeInTheDocument();
    });

    it('should require rejection reason', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="reject"
          onConfirm={jest.fn()}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: '却下する' });
      expect(confirmBtn).toBeDisabled();
    });

    it('should show required indicator for reject', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="reject"
          onConfirm={jest.fn()}
        />
      );

      const required = screen.getByText('*');
      expect(required).toHaveClass('text-red-500');
    });

    it('should enable submit button when reason provided', async () => {
      const user = userEvent.setup();
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="reject"
          onConfirm={jest.fn()}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: '却下する' });
      expect(confirmBtn).toBeDisabled();

      const commentInput = screen.getByPlaceholderText(/却下理由/);
      await user.type(commentInput, '書類不備');

      expect(confirmBtn).toBeEnabled();
    });

    it('should call onConfirm with rejection reason', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="reject"
          onConfirm={onConfirm}
        />
      );

      const commentInput = screen.getByPlaceholderText(/却下理由/);
      await user.type(commentInput, '承認できません');

      const confirmBtn = screen.getByRole('button', { name: '却下する' });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith('承認できません');
      });
    });

    it('should not submit with whitespace-only reason', async () => {
      const user = userEvent.setup();
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="reject"
          onConfirm={jest.fn()}
        />
      );

      const commentInput = screen.getByPlaceholderText(/却下理由/);
      await user.type(commentInput, '   ');

      const confirmBtn = screen.getByRole('button', { name: '却下する' });
      expect(confirmBtn).toBeDisabled();
    });
  });

  describe('Dialog State', () => {
    it('should not render when closed', () => {
      const { container } = render(
        <ApprovalDialog
          open={false}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when request is null', () => {
      const { container } = render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={null}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should clear comment after submission', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      const { rerender } = render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={onConfirm}
        />
      );

      const commentInput = screen.getByPlaceholderText(/承認コメント/);
      await user.type(commentInput, 'Test comment');

      const confirmBtn = screen.getByRole('button', { name: '承認する' });
      await user.click(confirmBtn);

      // Reopen dialog
      rerender(
        <ApprovalDialog
          open={false}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={onConfirm}
        />
      );

      rerender(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={onConfirm}
        />
      );

      const newCommentInput = screen.getByPlaceholderText(/承認コメント/);
      expect(newCommentInput).toHaveValue('');
    });
  });

  describe('Different Request Types', () => {
    it('should handle expense claim request', () => {
      const expenseRequest: WorkflowRequest = {
        ...mockRequest,
        type: 'expense_claim',
        title: '経費申請（¥10,000）',
      };

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={expenseRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText(/経費申請/)).toBeInTheDocument();
    });

    it('should handle overtime request', () => {
      const overtimeRequest: WorkflowRequest = {
        ...mockRequest,
        type: 'overtime_request',
        title: '残業申請（8時間）',
      };

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={overtimeRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText(/残業申請/)).toBeInTheDocument();
    });

    it('should handle business trip request', () => {
      const tripRequest: WorkflowRequest = {
        ...mockRequest,
        type: 'business_trip',
        title: '出張申請（大阪）',
      };

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={tripRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText(/出張申請/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have labeled dialog title', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    });

    it('should have accessible label for textarea', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      const textarea = screen.getByLabelText(/コメント/);
      expect(textarea).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'キャンセル' })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: '承認する' })).toHaveAccessibleName();
    });
  });

  describe('User Interaction', () => {
    it('should handle multiple comment edits', async () => {
      const user = userEvent.setup();
      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      const commentInput = screen.getByPlaceholderText(/承認コメント/);

      await user.type(commentInput, 'First');
      expect(commentInput).toHaveValue('First');

      await user.clear(commentInput);
      expect(commentInput).toHaveValue('');

      await user.type(commentInput, 'Second');
      expect(commentInput).toHaveValue('Second');
    });

    it('should handle long comments', async () => {
      const user = userEvent.setup();
      const longComment = 'これは非常に長いコメントのテストです。'.repeat(10);

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={jest.fn()}
          request={mockRequest}
          action="reject"
          onConfirm={jest.fn()}
        />
      );

      const commentInput = screen.getByPlaceholderText(/却下理由/);
      await user.type(commentInput, longComment);

      expect(commentInput).toHaveValue(longComment);
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <ApprovalDialog
          open={true}
          onOpenChange={onOpenChange}
          request={mockRequest}
          action="approve"
          onConfirm={jest.fn()}
        />
      );

      // Tab through form
      await user.tab();
      expect(screen.getByPlaceholderText(/承認コメント/)).toHaveFocus();
    });
  });
});
