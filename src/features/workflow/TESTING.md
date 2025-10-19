# Approval Flow UI Component Tests

## Overview

Comprehensive test suite for approval flow UI components in the Dandori Portal workflow system. These tests cover common approval flow patterns using React Testing Library and Jest.

## Test Files Created

### 1. **bulk-approval-bar.test.tsx** (10KB, 283 lines)
Tests for the bulk approval functionality.

**Coverage:**
- ✅ Visibility based on selection
- ✅ Display correct count of selected items
- ✅ Bulk approve dialog flow
- ✅ Bulk reject with required reason
- ✅ Optional comment for approval
- ✅ Clear selection functionality
- ✅ Handle 5-10 items simultaneously
- ✅ Validation (no whitespace-only reasons)

**Key Test Cases (12):**
```typescript
- should not render when no items are selected
- should render when items are selected
- should open approval dialog when approve button clicked
- should require rejection reason
- should call bulkApprove and onClear when approved
- should handle bulk approval of 5 items
- should handle bulk rejection of 10 items
```

### 2. **approval-status-badge.test.tsx** (6.7KB, 231 lines)
Tests for approval status badge rendering and styling.

**Coverage:**
- ✅ All 10 status types (pending, approved, rejected, etc.)
- ✅ Correct color coding (yellow, green, red)
- ✅ Icon display for each status
- ✅ Variant styling (default, destructive, outline, secondary)

**Status Types Tested:**
- `pending` → Yellow/Orange (Clock icon)
- `approved` → Green (CheckCircle icon)
- `rejected` → Red (XCircle icon)
- `draft` → Outline (FileText icon)
- `returned` → Secondary (RotateCcw icon)
- `partially_approved` → Default (Clock icon)
- `in_review` → Default (Clock icon)
- `cancelled` → Secondary (AlertCircle icon)
- `completed` → Default (CheckCircle icon)
- `escalated` → Secondary (AlertCircle icon)

**Key Test Cases (25):**
```typescript
- should render pending status with correct text
- should use success color for approved
- should use destructive variant for rejected
- should render all status types without errors
```

### 3. **approval-card.test.tsx** (11KB, 361 lines)
Tests for individual approval request cards.

**Coverage:**
- ✅ Display requester, date, department
- ✅ Approve/Reject button visibility and actions
- ✅ Detail button functionality
- ✅ Different request types (expense, overtime, trip)
- ✅ Button styling and states
- ✅ Accessibility attributes
- ✅ Edge cases (long titles, missing data)

**Key Test Cases (28):**
```typescript
- should render approval card with title
- should display requester name
- should call onApprove when approve button clicked
- should have correct styling for approve button
- should enable approve and reject simultaneously
- should handle long titles gracefully
```

### 4. **approval-history.test.tsx** (12KB, 430 lines)
Tests for approval history timeline display.

**Coverage:**
- ✅ List of approvers with roles
- ✅ Approval timestamps (Japanese locale)
- ✅ Comments display
- ✅ Status colors (green/yellow/red)
- ✅ Empty state handling
- ✅ Multi-step approval flows
- ✅ All approver role types

**Key Test Cases (22):**
```typescript
- should display list of approvers
- should show approval timestamp for approved steps
- should display approval comments when available
- should show approved status with green color
- should display 3-step approval flow
- should show mixed status flow
```

### 5. **approval-dialog.test.tsx** (15KB, 543 lines)
Tests for approval/rejection confirmation dialogs.

**Coverage:**
- ✅ Approve dialog with optional comment
- ✅ Reject dialog with required reason
- ✅ Dialog open/close state
- ✅ Form validation
- ✅ Different request types
- ✅ Accessibility (ARIA, roles)
- ✅ Keyboard navigation
- ✅ Long comment handling

**Key Test Cases (29):**
```typescript
- should open approval dialog
- should allow optional comment for approval
- should require rejection reason
- should enable submit button when reason provided
- should not submit with whitespace-only reason
- should have proper dialog role
- should handle keyboard navigation
```

### 6. **workflow-store.test.ts** (16KB, 563 lines)
Tests for workflow store approval logic.

**Coverage:**
- ✅ Single-step approval flow
- ✅ Multi-step approval progression
- ✅ Rejection with reason
- ✅ Bulk approve/reject operations
- ✅ Get pending approvals
- ✅ Get user's requests
- ✅ Timeline entry creation
- ✅ Status transitions

**Key Test Cases (12):**
```typescript
- should approve a request successfully
- should move to next step in multi-step approval
- should complete approval when all steps approved
- should reject a request with reason
- should bulk approve multiple requests
- should return pending approvals for user
```

## Running the Tests

### Run All Approval Flow Tests
```bash
npm test -- src/features/workflow/
npm test -- src/lib/workflow-store.test.ts
```

### Run Specific Test File
```bash
npm test -- bulk-approval-bar.test.tsx
npm test -- approval-status-badge.test.tsx
npm test -- approval-card.test.tsx
npm test -- approval-history.test.tsx
npm test -- approval-dialog.test.tsx
npm test -- workflow-store.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage src/features/workflow/
```

### Watch Mode
```bash
npm test -- --watch src/features/workflow/
```

## Test Statistics

| File | Lines | Test Cases | Coverage Areas |
|------|-------|------------|----------------|
| bulk-approval-bar.test.tsx | 283 | 12 | Bulk operations, validation |
| approval-status-badge.test.tsx | 231 | 25 | Status display, colors, icons |
| approval-card.test.tsx | 361 | 28 | Card rendering, actions |
| approval-history.test.tsx | 430 | 22 | Timeline, comments, roles |
| approval-dialog.test.tsx | 543 | 29 | Dialogs, forms, validation |
| workflow-store.test.ts | 563 | 12 | Store logic, state management |
| **Total** | **2,411** | **128** | **Full approval flow** |

## Key Testing Patterns

### 1. User Event Pattern
```typescript
import userEvent from '@testing-library/user-event';

it('should approve when button clicked', async () => {
  const user = userEvent.setup();
  const onApprove = jest.fn();
  render(<ApprovalCard onApprove={onApprove} />);

  await user.click(screen.getByRole('button', { name: /承認/i }));

  expect(onApprove).toHaveBeenCalled();
});
```

### 2. Form Validation Pattern
```typescript
it('should require rejection reason', async () => {
  const user = userEvent.setup();
  render(<RejectDialog />);

  const submitBtn = screen.getByRole('button', { name: '却下する' });
  expect(submitBtn).toBeDisabled();

  const input = screen.getByPlaceholderText(/却下理由/);
  await user.type(input, '書類不備');

  expect(submitBtn).toBeEnabled();
});
```

### 3. Status Badge Pattern
```typescript
it('should display correct color for status', () => {
  render(getStatusBadge('approved'));

  const badge = screen.getByText('承認済み');
  expect(badge).toHaveClass('text-green-600');
});
```

### 4. Store Testing Pattern
```typescript
it('should approve request in store', () => {
  const { result } = renderHook(() => useWorkflowStore());

  act(() => {
    result.current.approveRequest(requestId, stepId, 'Approved');
  });

  expect(result.current.requests[0].status).toBe('approved');
});
```

## Component Dependencies

All tests use the following dependencies:
- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interactions
- `jest` - Test runner
- `@testing-library/jest-dom` - DOM matchers

## Mocked Dependencies

Tests mock the following modules:
- `sonner` - Toast notifications
- `@/lib/workflow-store` - Workflow state
- `@/lib/store/notification-store` - Notifications
- `@/lib/store/user-store` - Current user
- `@/lib/realtime/broadcast` - Realtime updates

## Coverage Goals

- ✅ **Component Rendering**: All UI components render correctly
- ✅ **User Interactions**: Button clicks, form inputs work
- ✅ **Form Validation**: Required fields, error states
- ✅ **Status Display**: All status types and colors
- ✅ **Accessibility**: ARIA attributes, keyboard nav
- ✅ **Edge Cases**: Empty states, long text, errors
- ✅ **Store Logic**: State transitions, bulk operations

## Common Test Scenarios Covered

### Approval Request Card
1. Display requester info (name, date, department)
2. Show status badge (pending/approved/rejected)
3. Display request details (amount, type, reason)
4. Show approve/reject buttons for pending items

### Approve Button
1. onClick handler fires correctly
2. Shows confirmation dialog
3. Disables while processing
4. Passes comment to handler

### Reject Button
1. onClick handler fires
2. Shows comment input dialog
3. Validates rejection reason
4. Submits with reason

### Status Badge
1. Correct color for pending (yellow/orange)
2. Correct color for approved (green)
3. Correct color for rejected (red)
4. Correct text display

### Approval History
1. Displays list of approvers
2. Shows approval timestamps
3. Displays comments if any
4. Handles empty state

## Future Enhancements

Potential areas for additional test coverage:
- [ ] Delegate approval functionality
- [ ] Escalation flow testing
- [ ] Attachment handling
- [ ] Real-time update synchronization
- [ ] Performance testing (large lists)
- [ ] Integration tests with actual API
- [ ] E2E tests with Playwright
- [ ] Visual regression testing

## Maintenance

When updating approval flow components:
1. Update corresponding test file
2. Add new test cases for new features
3. Update this README with changes
4. Run full test suite before committing
5. Verify coverage remains above 80%

## Questions or Issues?

For questions about these tests, contact the development team or refer to:
- React Testing Library docs: https://testing-library.com/react
- Jest documentation: https://jestjs.io/
- Project testing guidelines: `/docs/testing-guidelines.md`
