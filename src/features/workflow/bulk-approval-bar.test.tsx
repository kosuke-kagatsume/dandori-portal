import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkApprovalBar } from './bulk-approval-bar';
import { useWorkflowStore } from '@/lib/workflow-store';

// Mock dependencies
jest.mock('@/lib/workflow-store');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockBulkApprove = jest.fn();
const mockBulkReject = jest.fn();

describe('BulkApprovalBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWorkflowStore as unknown as jest.Mock).mockReturnValue({
      bulkApprove: mockBulkApprove,
      bulkReject: mockBulkReject,
    });
  });

  describe('Visibility', () => {
    it('should not render when no items are selected', () => {
      const { container } = render(
        <BulkApprovalBar selectedIds={[]} onClear={jest.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when items are selected', () => {
      render(
        <BulkApprovalBar
          selectedIds={['req-1', 'req-2']}
          onClear={jest.fn()}
        />
      );
      expect(screen.getByText('2件選択中')).toBeInTheDocument();
    });

    it('should display correct count of selected items', () => {
      render(
        <BulkApprovalBar
          selectedIds={['req-1', 'req-2', 'req-3']}
          onClear={jest.fn()}
        />
      );
      expect(screen.getByText('3件選択中')).toBeInTheDocument();
    });
  });

  describe('Bulk Approve', () => {
    it('should open approval dialog when approve button clicked', async () => {
      const user = userEvent.setup();
      render(
        <BulkApprovalBar
          selectedIds={['req-1']}
          onClear={jest.fn()}
        />
      );

      const approveBtn = screen.getByRole('button', { name: /一括承認/i });
      await user.click(approveBtn);

      expect(screen.getByText('一括承認の確認')).toBeInTheDocument();
      expect(screen.getByText('1件の申請を承認します')).toBeInTheDocument();
    });

    it('should allow optional comment for approval', async () => {
      const user = userEvent.setup();
      render(
        <BulkApprovalBar
          selectedIds={['req-1']}
          onClear={jest.fn()}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /一括承認/i }));

      // Enter comment
      const commentInput = screen.getByPlaceholderText('承認コメントを入力...');
      await user.type(commentInput, '承認します');

      expect(commentInput).toHaveValue('承認します');
    });

    it('should call bulkApprove and onClear when approved', async () => {
      const user = userEvent.setup();
      const onClear = jest.fn();
      const selectedIds = ['req-1', 'req-2'];

      render(
        <BulkApprovalBar
          selectedIds={selectedIds}
          onClear={onClear}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /一括承認/i }));

      // Click approve
      const approveButton = screen.getByRole('button', { name: '承認する' });
      await user.click(approveButton);

      await waitFor(() => {
        expect(mockBulkApprove).toHaveBeenCalledWith(selectedIds, '');
        expect(onClear).toHaveBeenCalled();
      });
    });

    it('should pass comment when approving with comment', async () => {
      const user = userEvent.setup();
      render(
        <BulkApprovalBar
          selectedIds={['req-1']}
          onClear={jest.fn()}
        />
      );

      // Open dialog and add comment
      await user.click(screen.getByRole('button', { name: /一括承認/i }));
      const commentInput = screen.getByPlaceholderText('承認コメントを入力...');
      await user.type(commentInput, 'テストコメント');

      // Approve
      await user.click(screen.getByRole('button', { name: '承認する' }));

      await waitFor(() => {
        expect(mockBulkApprove).toHaveBeenCalledWith(['req-1'], 'テストコメント');
      });
    });

    it('should close dialog when cancelled', async () => {
      const user = userEvent.setup();
      render(
        <BulkApprovalBar
          selectedIds={['req-1']}
          onClear={jest.fn()}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /一括承認/i }));
      expect(screen.getByText('一括承認の確認')).toBeInTheDocument();

      // Cancel
      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      await waitFor(() => {
        expect(screen.queryByText('一括承認の確認')).not.toBeInTheDocument();
      });
    });
  });

  describe('Bulk Reject', () => {
    it('should open reject dialog when reject button clicked', async () => {
      const user = userEvent.setup();
      render(
        <BulkApprovalBar
          selectedIds={['req-1', 'req-2']}
          onClear={jest.fn()}
        />
      );

      const rejectBtn = screen.getByRole('button', { name: /一括却下/i });
      await user.click(rejectBtn);

      expect(screen.getByText('一括却下の確認')).toBeInTheDocument();
      expect(screen.getByText('2件の申請を却下します')).toBeInTheDocument();
    });

    it('should require rejection reason', async () => {
      const user = userEvent.setup();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { toast } = require('sonner');

      render(
        <BulkApprovalBar
          selectedIds={['req-1']}
          onClear={jest.fn()}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /一括却下/i }));

      // Try to reject without reason
      const rejectButton = screen.getByRole('button', { name: '却下する' });
      await user.click(rejectButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('却下理由を入力してください');
      });
      expect(mockBulkReject).not.toHaveBeenCalled();
    });

    it('should call bulkReject with reason when provided', async () => {
      const user = userEvent.setup();
      const onClear = jest.fn();
      const selectedIds = ['req-1', 'req-2'];

      render(
        <BulkApprovalBar
          selectedIds={selectedIds}
          onClear={onClear}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /一括却下/i }));

      // Enter reason
      const reasonInput = screen.getByPlaceholderText('却下理由を入力してください...');
      await user.type(reasonInput, '書類不備のため却下');

      // Reject
      const rejectButton = screen.getByRole('button', { name: '却下する' });
      await user.click(rejectButton);

      await waitFor(() => {
        expect(mockBulkReject).toHaveBeenCalledWith(selectedIds, '書類不備のため却下');
        expect(onClear).toHaveBeenCalled();
      });
    });

    it('should not reject with whitespace-only reason', async () => {
      const user = userEvent.setup();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { toast } = require('sonner');

      render(
        <BulkApprovalBar
          selectedIds={['req-1']}
          onClear={jest.fn()}
        />
      );

      // Open dialog
      await user.click(screen.getByRole('button', { name: /一括却下/i }));

      // Enter whitespace only
      const reasonInput = screen.getByPlaceholderText('却下理由を入力してください...');
      await user.type(reasonInput, '   ');

      // Try to reject
      await user.click(screen.getByRole('button', { name: '却下する' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('却下理由を入力してください');
      });
    });
  });

  describe('Clear Selection', () => {
    it('should call onClear when clear button clicked', async () => {
      const user = userEvent.setup();
      const onClear = jest.fn();

      render(
        <BulkApprovalBar
          selectedIds={['req-1', 'req-2']}
          onClear={onClear}
        />
      );

      const clearBtn = screen.getByRole('button', { name: '選択解除' });
      await user.click(clearBtn);

      expect(onClear).toHaveBeenCalled();
    });
  });

  describe('Button States', () => {
    it('should have all action buttons enabled', () => {
      render(
        <BulkApprovalBar
          selectedIds={['req-1']}
          onClear={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /一括承認/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /一括却下/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: '選択解除' })).toBeEnabled();
    });
  });

  describe('Multiple Items', () => {
    it('should handle bulk approval of 5 items', async () => {
      const user = userEvent.setup();
      const selectedIds = ['req-1', 'req-2', 'req-3', 'req-4', 'req-5'];

      render(
        <BulkApprovalBar
          selectedIds={selectedIds}
          onClear={jest.fn()}
        />
      );

      expect(screen.getByText('5件選択中')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /一括承認/i }));
      expect(screen.getByText('5件の申請を承認します')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '承認する' }));

      await waitFor(() => {
        expect(mockBulkApprove).toHaveBeenCalledWith(selectedIds, '');
      });
    });

    it('should handle bulk rejection of 10 items', async () => {
      const user = userEvent.setup();
      const selectedIds = Array.from({ length: 10 }, (_, i) => `req-${i + 1}`);

      render(
        <BulkApprovalBar
          selectedIds={selectedIds}
          onClear={jest.fn()}
        />
      );

      expect(screen.getByText('10件選択中')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /一括却下/i }));
      expect(screen.getByText('10件の申請を却下します')).toBeInTheDocument();

      const reasonInput = screen.getByPlaceholderText('却下理由を入力してください...');
      await user.type(reasonInput, '一括処理テスト');

      await user.click(screen.getByRole('button', { name: '却下する' }));

      await waitFor(() => {
        expect(mockBulkReject).toHaveBeenCalledWith(selectedIds, '一括処理テスト');
      });
    });
  });
});
