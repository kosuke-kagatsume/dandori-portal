# StatsCard Testing Guide

## Quick Reference

This guide provides a quick reference for writing tests for the StatsCard component and similar dashboard components.

## Test Structure

The test suite is organized into 6 main categories:

```
StatsCard
├── Rendering (4 tests)
├── Data Display (10 tests)
├── Loading State (4 tests)
├── Click Interactions (8 tests)
├── Accessibility (2 tests)
└── Edge Cases (5 tests)
```

## Test Patterns

### 1. Basic Rendering Test

```typescript
it('renders with title, value, and icon', () => {
  render(
    <StatsCard
      title="Total Users"
      value={150}
      icon={Users}
      gradient="from-blue-50 to-blue-100"
      data-testid="stats-card"
    />
  );

  expect(screen.getByText('Total Users')).toBeInTheDocument();
  expect(screen.getByText('150')).toBeInTheDocument();
  expect(screen.getByTestId('stats-card')).toBeInTheDocument();
});
```

**Key Points**:
- Always provide `data-testid` for easy querying
- Test that key content is visible
- Use `screen.getByText()` for text content

### 2. CSS Class Testing

```typescript
it('applies correct CSS classes and gradient', () => {
  const { container } = render(
    <StatsCard
      title="Leave Balance"
      value={12}
      icon={Calendar}
      gradient="from-purple-50 to-purple-100"
      className="custom-class"
      data-testid="leave-card"
    />
  );

  const card = screen.getByTestId('leave-card');
  expect(card).toHaveClass('from-purple-50');
  expect(card).toHaveClass('to-purple-100');
  expect(card).toHaveClass('custom-class');
  expect(card).toHaveClass('shadow-lg');
});
```

**Key Points**:
- Use `toHaveClass()` to verify CSS classes
- Test both props-based and default classes
- Destructure `container` if needed for DOM queries

### 3. Number Formatting Test

```typescript
it('formats numbers correctly with Japanese locale (1,234)', () => {
  render(
    <StatsCard
      title="Total Employees"
      value={1234}
      icon={Users}
      gradient="from-orange-50 to-orange-100"
      data-testid="employee-card"
    />
  );

  expect(screen.getByTestId('employee-card-value')).toHaveTextContent('1,234');
});
```

**Key Points**:
- Use nested `data-testid` for specific elements
- Test the formatted output, not the input
- Verify locale-specific formatting

### 4. Loading State Test

```typescript
it('shows skeleton or loading indicator when loading', () => {
  const { container } = render(
    <StatsCard
      title="Loading Card"
      value={0}
      icon={Users}
      gradient="from-gray-50 to-gray-100"
      loading={true}
      data-testid="loading-card"
    />
  );

  const skeletons = container.querySelectorAll('.animate-pulse');
  expect(skeletons.length).toBeGreaterThan(0);
});

it('hides data while loading', () => {
  render(
    <StatsCard
      title="Hidden Data"
      value={1234}
      trend="+10%"
      icon={Users}
      gradient="from-blue-50 to-blue-100"
      loading={true}
      data-testid="hidden-card"
    />
  );

  expect(screen.queryByText('Hidden Data')).not.toBeInTheDocument();
  expect(screen.queryByText('1,234')).not.toBeInTheDocument();
});
```

**Key Points**:
- Use `queryByText()` for elements that should NOT exist
- Check for loading indicators (e.g., `.animate-pulse`)
- Verify data is hidden during loading

### 5. Click Interaction Test

```typescript
it('onClick handler fires when clicked', async () => {
  const handleClick = jest.fn();
  const user = userEvent.setup();

  render(
    <StatsCard
      title="Clickable Card"
      value={100}
      icon={Users}
      gradient="from-blue-50 to-blue-100"
      onClick={handleClick}
      data-testid="clickable-card"
    />
  );

  const card = screen.getByTestId('clickable-card');
  await user.click(card);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**Key Points**:
- Use `userEvent` for realistic user interactions
- Create mock functions with `jest.fn()`
- Always `await` user interactions
- Verify callback was called with `toHaveBeenCalledTimes()`

### 6. Keyboard Navigation Test

```typescript
it('supports keyboard navigation (Enter key)', async () => {
  const handleClick = jest.fn();
  const user = userEvent.setup();

  render(
    <StatsCard
      title="Keyboard Card"
      value={100}
      icon={Users}
      gradient="from-blue-50 to-blue-100"
      onClick={handleClick}
      data-testid="keyboard-card"
    />
  );

  const card = screen.getByTestId('keyboard-card');
  card.focus();
  await user.keyboard('{Enter}');

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**Key Points**:
- Test both `Enter` and `Space` keys
- Focus the element before simulating keyboard input
- Use `user.keyboard()` for keyboard events

### 7. Accessibility Test

```typescript
it('hides decorative icons from screen readers', () => {
  const { container } = render(
    <StatsCard
      title="Accessible Card"
      value={100}
      icon={Users}
      gradient="from-blue-50 to-blue-100"
    />
  );

  const icons = container.querySelectorAll('svg[aria-hidden="true"]');
  expect(icons.length).toBeGreaterThan(0);
});

it('sets role=button when clickable', () => {
  render(
    <StatsCard
      title="Button Role Card"
      value={100}
      icon={Users}
      gradient="from-blue-50 to-blue-100"
      onClick={() => {}}
      data-testid="button-role-card"
    />
  );

  const card = screen.getByTestId('button-role-card');
  expect(card).toHaveAttribute('role', 'button');
});
```

**Key Points**:
- Check for proper ARIA attributes
- Verify roles are set correctly
- Test keyboard focus and navigation

### 8. Edge Case Test

```typescript
it('handles zero values correctly', () => {
  render(
    <StatsCard
      title="Pending Tasks"
      value={0}
      icon={AlertCircle}
      gradient="from-gray-50 to-gray-100"
      data-testid="tasks-card"
    />
  );

  expect(screen.getByTestId('tasks-card-value')).toHaveTextContent('0');
});

it('handles Japanese text values', () => {
  render(
    <StatsCard
      title="日本語タイトル"
      value="出勤中"
      icon={Users}
      gradient="from-orange-50 to-orange-100"
      data-testid="japanese-card"
    />
  );

  expect(screen.getByText('日本語タイトル')).toBeInTheDocument();
  expect(screen.getByText('出勤中')).toBeInTheDocument();
});
```

**Key Points**:
- Test boundary values (zero, negative, very large)
- Test non-English characters
- Test empty strings
- Test decimal numbers

## Common Testing Utilities

### Setup

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

### Queries

```typescript
// Get by text (throws if not found)
screen.getByText('Total Users')

// Query by text (returns null if not found)
screen.queryByText('Hidden Data')

// Get by test ID
screen.getByTestId('stats-card')

// Get by role
screen.getByRole('button')

// Get all by class
container.querySelectorAll('.animate-pulse')
```

### Assertions

```typescript
// Element exists
expect(element).toBeInTheDocument()

// Element has text
expect(element).toHaveTextContent('1,234')

// Element has class
expect(element).toHaveClass('shadow-lg')

// Element has attribute
expect(element).toHaveAttribute('role', 'button')

// Function was called
expect(mockFn).toHaveBeenCalledTimes(1)
```

### User Interactions

```typescript
const user = userEvent.setup();

// Click
await user.click(element);

// Keyboard
await user.keyboard('{Enter}');
await user.keyboard(' '); // Space key

// Focus
element.focus();
```

## Best Practices

### 1. Use data-testid for Reliable Queries

✅ **Good**:
```typescript
<StatsCard data-testid="user-card" ... />
screen.getByTestId('user-card')
```

❌ **Bad**:
```typescript
container.querySelector('.card-class')
```

### 2. Test User Behavior, Not Implementation

✅ **Good**:
```typescript
await user.click(card);
expect(handleClick).toHaveBeenCalled();
```

❌ **Bad**:
```typescript
fireEvent.click(card); // Use userEvent instead
```

### 3. Use Semantic Queries

✅ **Good**:
```typescript
screen.getByText('Total Users')
screen.getByRole('button')
```

❌ **Bad**:
```typescript
container.querySelector('.text-3xl')
```

### 4. Test Accessibility

✅ **Good**:
```typescript
expect(icon).toHaveAttribute('aria-hidden', 'true');
expect(card).toHaveAttribute('role', 'button');
```

### 5. Clean Up After Tests

Tests are automatically cleaned up by React Testing Library, but for long-running tests:

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- stats-card.test.tsx
```

### Run with Coverage
```bash
npm test -- stats-card.test.tsx --coverage
```

### Watch Mode
```bash
npm test -- stats-card.test.tsx --watch
```

### Verbose Output
```bash
npm test -- stats-card.test.tsx --verbose
```

## Coverage Goals

Aim for:
- **Statements**: 100%
- **Branches**: 95%+
- **Functions**: 100%
- **Lines**: 100%

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [User Event API](https://testing-library.com/docs/user-event/intro)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Summary

Good tests should:
- ✅ Test user-visible behavior
- ✅ Be maintainable and readable
- ✅ Use semantic queries
- ✅ Cover edge cases
- ✅ Test accessibility
- ✅ Have clear assertions
- ✅ Use realistic user interactions

Avoid:
- ❌ Testing implementation details
- ❌ Brittle selectors (CSS classes)
- ❌ Incomplete accessibility testing
- ❌ Missing edge cases
- ❌ Unclear test names
