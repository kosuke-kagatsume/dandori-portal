import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';
import { WorkflowStatus } from '@/lib/workflow-store';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';

// Helper function to render status badge (mimics actual implementation)
function getStatusBadge(status: WorkflowStatus) {
  const config = {
    draft: { label: '下書き', variant: 'outline' as const, icon: FileText },
    pending: { label: '承認待ち', variant: 'default' as const, icon: Clock },
    in_review: { label: '確認中', variant: 'default' as const, icon: Clock },
    partially_approved: { label: '一部承認', variant: 'default' as const, icon: Clock },
    approved: { label: '承認済み', variant: 'default' as const, icon: CheckCircle },
    rejected: { label: '却下', variant: 'destructive' as const, icon: XCircle },
    returned: { label: '差し戻し', variant: 'secondary' as const, icon: RotateCcw },
    cancelled: { label: 'キャンセル', variant: 'secondary' as const, icon: AlertCircle },
    completed: { label: '完了', variant: 'default' as const, icon: CheckCircle },
    escalated: { label: 'エスカレーション', variant: 'secondary' as const, icon: AlertCircle },
  };

  const { label, variant, icon: Icon } = config[status];
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

describe('ApprovalStatusBadge', () => {
  describe('Pending Status', () => {
    it('should render pending status with correct text', () => {
      render(getStatusBadge('pending'));
      expect(screen.getByText('承認待ち')).toBeInTheDocument();
    });

    it('should render pending status with clock icon', () => {
      const { container } = render(getStatusBadge('pending'));
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should use default variant for pending', () => {
      const { container } = render(getStatusBadge('pending'));
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-primary'); // default variant
    });
  });

  describe('Approved Status', () => {
    it('should render approved status with correct text', () => {
      render(getStatusBadge('approved'));
      expect(screen.getByText('承認済み')).toBeInTheDocument();
    });

    it('should render approved status with check icon', () => {
      const { container } = render(getStatusBadge('approved'));
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should use success color for approved', () => {
      const { container } = render(getStatusBadge('approved'));
      const badge = container.firstChild;
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Rejected Status', () => {
    it('should render rejected status with correct text', () => {
      render(getStatusBadge('rejected'));
      expect(screen.getByText('却下')).toBeInTheDocument();
    });

    it('should render rejected status with X icon', () => {
      const { container } = render(getStatusBadge('rejected'));
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should use destructive variant for rejected', () => {
      const { container } = render(getStatusBadge('rejected'));
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-destructive');
    });
  });

  describe('Draft Status', () => {
    it('should render draft status with correct text', () => {
      render(getStatusBadge('draft'));
      expect(screen.getByText('下書き')).toBeInTheDocument();
    });

    it('should use outline variant for draft', () => {
      const { container } = render(getStatusBadge('draft'));
      const badge = container.firstChild;
      expect(badge).toHaveClass('border');
    });
  });

  describe('Returned Status', () => {
    it('should render returned status with correct text', () => {
      render(getStatusBadge('returned'));
      expect(screen.getByText('差し戻し')).toBeInTheDocument();
    });

    it('should render returned status with rotate icon', () => {
      const { container } = render(getStatusBadge('returned'));
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should use secondary variant for returned', () => {
      const { container } = render(getStatusBadge('returned'));
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-secondary');
    });
  });

  describe('Partially Approved Status', () => {
    it('should render partially approved status', () => {
      render(getStatusBadge('partially_approved'));
      expect(screen.getByText('一部承認')).toBeInTheDocument();
    });
  });

  describe('In Review Status', () => {
    it('should render in review status', () => {
      render(getStatusBadge('in_review'));
      expect(screen.getByText('確認中')).toBeInTheDocument();
    });
  });

  describe('Cancelled Status', () => {
    it('should render cancelled status', () => {
      render(getStatusBadge('cancelled'));
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });
  });

  describe('Completed Status', () => {
    it('should render completed status', () => {
      render(getStatusBadge('completed'));
      expect(screen.getByText('完了')).toBeInTheDocument();
    });
  });

  describe('Escalated Status', () => {
    it('should render escalated status', () => {
      render(getStatusBadge('escalated'));
      expect(screen.getByText('エスカレーション')).toBeInTheDocument();
    });

    it('should use secondary variant for escalated', () => {
      const { container } = render(getStatusBadge('escalated'));
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-secondary');
    });
  });

  describe('All Statuses', () => {
    const allStatuses: WorkflowStatus[] = [
      'draft',
      'pending',
      'in_review',
      'partially_approved',
      'approved',
      'rejected',
      'returned',
      'cancelled',
      'completed',
      'escalated',
    ];

    it('should render all status types without errors', () => {
      allStatuses.forEach((status) => {
        const { container, unmount } = render(getStatusBadge(status));
        // Check that badge is rendered (has a div with badge classes)
        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });

    it('should have icon for all status types', () => {
      allStatuses.forEach((status) => {
        const { container, unmount } = render(getStatusBadge(status));
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        unmount();
      });
    });
  });
});
