// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { renderHook, act, waitFor } from '@testing-library/react'; // waitForは将来的に非同期テストで使用予定
import { useWorkflowStore } from './workflow-store';

// Mock dependencies
jest.mock('./workflow-demo-data', () => ({
  generateDemoWorkflowData: jest.fn(() => []),
}));

jest.mock('./store/notification-store', () => ({
  useNotificationStore: {
    getState: jest.fn(() => ({
      addNotification: jest.fn(),
    })),
  },
}));

jest.mock('./store/user-store', () => ({
  useUserStore: {
    getState: jest.fn(() => ({
      currentDemoUser: { id: '1', name: 'Test User' },
    })),
  },
}));

jest.mock('./realtime/broadcast', () => ({
  getBroadcast: jest.fn(() => ({
    on: jest.fn(),
    send: jest.fn(),
  })),
}));

describe('WorkflowStore - Approval Flow', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useWorkflowStore.setState({
        requests: [],
        initialized: false,
        delegateSettings: [],
      });
    });
  });

  describe('Approve Request', () => {
    it('should approve a request successfully', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      // Create a test request
      let requestId: string;
      await act(async () => {
        requestId = await result.current.createRequest({
          type: 'leave_request',
          title: 'Test Leave',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'Test User',
          department: 'Engineering',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });

        // Submit the request
        result.current.submitRequest(requestId);
      });

      // Get the request
      const request = result.current.requests[0];
      expect(request.status).toBe('pending');

      // Approve the request
      act(() => {
        result.current.approveRequest(request.id, 'step-1', 'Approved');
      });

      // Check approval
      const approvedRequest = result.current.requests[0];
      expect(approvedRequest.status).toBe('approved');
      expect(approvedRequest.approvalSteps[0].status).toBe('approved');
      expect(approvedRequest.approvalSteps[0].comments).toBe('Approved');
    });

    it('should move to next step in multi-step approval', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      // Create request with 2 approval steps
      let requestId: string;
      await act(async () => {
        requestId = await result.current.createRequest({
          type: 'expense_claim',
          title: 'Test Expense',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'Test User',
          department: 'Sales',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
            {
              id: 'step-2',
              order: 1,
              approverRole: 'hr_manager',
              approverId: 'hr-1',
              approverName: 'HR Manager',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });

        result.current.submitRequest(requestId);
      });

      const request = result.current.requests[0];

      // Approve first step
      act(() => {
        result.current.approveRequest(request.id, 'step-1', 'Step 1 approved');
      });

      const updatedRequest = result.current.requests[0];
      expect(updatedRequest.status).toBe('partially_approved');
      expect(updatedRequest.approvalSteps[0].status).toBe('approved');
      expect(updatedRequest.approvalSteps[1].status).toBe('pending');
      expect(updatedRequest.currentStep).toBe(1);
    });

    it('should complete approval when all steps approved', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      let requestId: string;
      await act(async () => {
        requestId = await result.current.createRequest({
          type: 'leave_request',
          title: 'Test Leave',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'Test User',
          department: 'Engineering',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
            {
              id: 'step-2',
              order: 1,
              approverRole: 'hr_manager',
              approverId: 'hr-1',
              approverName: 'HR',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });

        result.current.submitRequest(requestId);
      });

      const request = result.current.requests[0];

      // Approve all steps
      act(() => {
        result.current.approveRequest(request.id, 'step-1');
      });

      act(() => {
        result.current.approveRequest(request.id, 'step-2');
      });

      const finalRequest = result.current.requests[0];
      expect(finalRequest.status).toBe('approved');
      expect(finalRequest.completedAt).toBeDefined();
    });

    it('should add timeline entry on approval', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      let requestId: string;
      await act(async () => {
        requestId = await result.current.createRequest({
          type: 'leave_request',
          title: 'Test',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'User',
          department: 'Dept',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });

        result.current.submitRequest(requestId);
      });

      const request = result.current.requests[0];
      const initialTimelineLength = request.timeline.length;

      act(() => {
        result.current.approveRequest(request.id, 'step-1', 'Test approval');
      });

      const updatedRequest = result.current.requests[0];
      expect(updatedRequest.timeline.length).toBe(initialTimelineLength + 1);
      expect(updatedRequest.timeline[updatedRequest.timeline.length - 1].action).toContain('承認しました');
    });
  });

  describe('Reject Request', () => {
    it('should reject a request with reason', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      let requestId: string;
      await act(async () => {
        requestId = await result.current.createRequest({
          type: 'expense_claim',
          title: 'Test Expense',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'User',
          department: 'Sales',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });

        result.current.submitRequest(requestId);
      });

      const request = result.current.requests[0];

      act(() => {
        result.current.rejectRequest(request.id, 'step-1', 'Insufficient documentation');
      });

      const rejectedRequest = result.current.requests[0];
      expect(rejectedRequest.status).toBe('rejected');
      expect(rejectedRequest.approvalSteps[0].status).toBe('rejected');
      expect(rejectedRequest.approvalSteps[0].comments).toBe('Insufficient documentation');
      expect(rejectedRequest.completedAt).toBeDefined();
    });

    it('should add rejection to timeline', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      let requestId: string;
      await act(async () => {
        requestId = await result.current.createRequest({
          type: 'leave_request',
          title: 'Test',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'User',
          department: 'Dept',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });

        result.current.submitRequest(requestId);
      });

      const request = result.current.requests[0];

      act(() => {
        result.current.rejectRequest(request.id, 'step-1', 'Not approved');
      });

      const rejectedRequest = result.current.requests[0];
      const lastEvent = rejectedRequest.timeline[rejectedRequest.timeline.length - 1];
      expect(lastEvent.action).toContain('却下しました');
      expect(lastEvent.comments).toBe('Not approved');
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk approve multiple requests', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      // Create multiple requests
      const requestIds: string[] = [];
      await act(async () => {
        for (let i = 0; i < 3; i++) {
          const id = await result.current.createRequest({
            type: 'leave_request',
            title: `Test ${i}`,
            description: 'Test',
            requesterId: 'user-1',
            requesterName: 'User',
            department: 'Dept',
            status: 'draft',
            priority: 'normal',
            details: {},
            approvalSteps: [
              {
                id: `step-${i}`,
                order: 0,
                approverRole: 'direct_manager',
                approverId: '1',
                approverName: 'Manager',
                status: 'pending',
              },
            ],
            currentStep: 0,
            attachments: [],
            timeline: [],
          });
          requestIds.push(id);
          result.current.submitRequest(id);
        }
      });

      // Bulk approve
      act(() => {
        result.current.bulkApprove(requestIds, 'Bulk approved');
      });

      // Check all are approved
      requestIds.forEach((id) => {
        const request = result.current.requests.find((r) => r.id === id);
        expect(request?.status).toBe('approved');
      });
    });

    it('should bulk reject multiple requests', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      const requestIds: string[] = [];
      await act(async () => {
        for (let i = 0; i < 2; i++) {
          const id = await result.current.createRequest({
            type: 'expense_claim',
            title: `Expense ${i}`,
            description: 'Test',
            requesterId: 'user-1',
            requesterName: 'User',
            department: 'Sales',
            status: 'draft',
            priority: 'normal',
            details: {},
            approvalSteps: [
              {
                id: `step-${i}`,
                order: 0,
                approverRole: 'direct_manager',
                approverId: '1',
                approverName: 'Manager',
                status: 'pending',
              },
            ],
            currentStep: 0,
            attachments: [],
            timeline: [],
          });
          requestIds.push(id);
          result.current.submitRequest(id);
        }
      });

      act(() => {
        result.current.bulkReject(requestIds, 'Bulk rejected');
      });

      requestIds.forEach((id) => {
        const request = result.current.requests.find((r) => r.id === id);
        expect(request?.status).toBe('rejected');
      });
    });
  });

  describe('Get Pending Approvals', () => {
    it('should return pending approvals for user', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      await act(async () => {
        const id = await result.current.createRequest({
          type: 'leave_request',
          title: 'Test',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'User',
          department: 'Dept',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });
        result.current.submitRequest(id);
      });

      const pending = result.current.getPendingApprovals('manager-1');
      expect(pending).toHaveLength(1);
      expect(pending[0].title).toBe('Test');
    });

    it('should not return completed requests', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      await act(async () => {
        const id = await result.current.createRequest({
          type: 'leave_request',
          title: 'Test',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'User',
          department: 'Dept',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [
            {
              id: 'step-1',
              order: 0,
              approverRole: 'direct_manager',
              approverId: 'manager-1',
              approverName: 'Manager',
              status: 'pending',
            },
          ],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });
        result.current.submitRequest(id);
        result.current.approveRequest(id, 'step-1');
      });

      const pending = result.current.getPendingApprovals('manager-1');
      expect(pending).toHaveLength(0);
    });
  });

  describe('Get My Requests', () => {
    it('should return requests created by user', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      await act(async () => {
        await result.current.createRequest({
          type: 'leave_request',
          title: 'My Request',
          description: 'Test',
          requesterId: 'user-1',
          requesterName: 'User',
          department: 'Dept',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });
      });

      const myRequests = result.current.getMyRequests('user-1');
      expect(myRequests).toHaveLength(1);
      expect(myRequests[0].title).toBe('My Request');
    });

    it('should not return other users requests', async () => {
      const { result } = renderHook(() => useWorkflowStore());

      await act(async () => {
        await result.current.createRequest({
          type: 'expense_claim',
          title: 'Other Request',
          description: 'Test',
          requesterId: 'user-2',
          requesterName: 'Other User',
          department: 'Dept',
          status: 'draft',
          priority: 'normal',
          details: {},
          approvalSteps: [],
          currentStep: 0,
          attachments: [],
          timeline: [],
        });
      });

      const myRequests = result.current.getMyRequests('user-1');
      expect(myRequests).toHaveLength(0);
    });
  });
});
