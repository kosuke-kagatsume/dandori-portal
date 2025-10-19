# Data Table Component Testing Guide

## Overview

This guide covers comprehensive testing for data table components in the Dandori Portal. We have created **2 complete test suites** covering all major data table patterns.

## Test Files

### 1. DataTable Component (`data-table.test.tsx`)
**Location**: `/Users/dw100/dandori-portal/src/components/ui/common/data-table.test.tsx`

**Component**: Full-featured data table with TanStack Table
- Sorting (ascending/descending with indicators)
- Filtering/Search (real-time updates)
- Pagination (10/20/30/40/50 items per page)
- Row selection (individual + select all)
- Column visibility toggle
- Row actions (edit/delete buttons)

**Test Coverage**: 40+ test cases across 8 categories

### 2. OptimizedDataTable Component (`optimized-data-table.test.tsx`)
**Location**: `/Users/dw100/dandori-portal/src/components/ui/common/optimized-data-table.test.tsx`

**Component**: Performance-optimized table for large datasets
- Global search filtering
- Simplified pagination
- Memoization optimization
- Handles 500-1000+ rows efficiently

**Test Coverage**: 45+ test cases across 7 categories

---

## Test Categories

### 1. Table Rendering ✅
Tests that verify the basic rendering of table structure.

```typescript
// DataTable Examples
it('renders table with headers and rows')
it('displays column headers correctly')
it('shows all data rows')
it('handles empty state (no data)')
it('renders formatted currency values')
it('renders status badges with correct styling')
```

**Key Assertions**:
- Headers are displayed correctly
- Data rows match the input data
- Empty state shows "データがありません"
- Currency format: `￥80,000` (Japanese locale)
- Status badges have correct CSS classes

---

### 2. Sorting ✅
Tests for column sorting functionality.

```typescript
// DataTable Examples
it('column headers are clickable when sorting is enabled')
it('click toggles sort direction (asc/desc)')
it('data is sorted correctly by name')
it('data is sorted correctly by salary (numeric)')
it('sort indicator icon is present')
```

**How Sorting Works**:
1. Click column header → Sort ascending
2. Click again → Sort descending
3. Click third time → Remove sort

**Test Approach**:
```typescript
const nameHeader = screen.getByRole('button', { name: /名前/i });
await user.click(nameHeader);

const rows = screen.getAllByRole('row').slice(1); // Skip header
expect(within(rows[0]).getByText('Alice Johnson')).toBeInTheDocument();
```

---

### 3. Filtering/Search ✅
Tests for real-time search and filtering.

```typescript
// DataTable Examples
it('search input filters data')
it('results update in real-time')
it('shows no results message when filtered to empty')
it('search is case-insensitive')
it('clearing search shows all results')
```

**Test Approach**:
```typescript
const searchInput = screen.getByPlaceholderText('名前で検索...');
await user.type(searchInput, 'Alice');

// Only Alice should be visible
expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
```

**Global Search** (OptimizedDataTable):
- Searches across ALL columns
- Real-time updates as you type
- Case-insensitive matching

---

### 4. Pagination ✅
Tests for page navigation and page size controls.

```typescript
// DataTable Examples
it('shows correct page size (10 items)')
it('page navigation buttons work')
it('current page indicator shows correct page')
it('total count display is correct')
it('can change page size')
it('first and last page buttons work')
it('previous button disabled on first page')
it('next button disabled on last page')
```

**Navigation Buttons**:
- 最初のページに移動 (First page)
- 前のページに移動 (Previous page)
- 次のページに移動 (Next page)
- 最後のページに移動 (Last page)

**Page Size Options**: 10, 20, 30, 40, 50

**Test Approach**:
```typescript
const nextButton = screen.getByRole('button', { name: /次のページに移動/i });
await user.click(nextButton);

expect(screen.getByText('User 11')).toBeInTheDocument();
expect(screen.queryByText('User 1')).not.toBeInTheDocument();
```

---

### 5. Row Selection ✅
Tests for checkbox selection functionality.

```typescript
// DataTable Examples
it('checkbox in each row')
it('select all checkbox')
it('selected rows are highlighted')
it('selection count display')
it('select all works')
it('deselect all works')
```

**Selection Features**:
- Individual row checkboxes with `aria-label="Select row"`
- Select all checkbox with `aria-label="Select all"`
- Selected rows have `data-state="selected"`
- Selection count: "3 / 10 行を選択中"

**Test Approach**:
```typescript
const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select all/i });
await user.click(selectAllCheckbox);

expect(screen.getByText(/5 \/ 5 行を選択中/i)).toBeInTheDocument();
```

---

### 6. Column Visibility Toggle ✅
Tests for showing/hiding columns.

```typescript
// DataTable Examples
it('column visibility dropdown exists')
it('can toggle column visibility')
```

**How It Works**:
1. Click "列表示" button
2. Dropdown shows all columns
3. Uncheck to hide column

**Test Approach**:
```typescript
const visibilityButton = screen.getByRole('button', { name: /列表示/i });
await user.click(visibilityButton);

const emailCheckbox = screen.getByRole('menuitemcheckbox', { name: /email/i });
await user.click(emailCheckbox);

expect(screen.queryByText('メールアドレス')).not.toBeInTheDocument();
```

---

### 7. Row Actions ✅
Tests for action buttons in each row.

```typescript
// DataTable Examples
it('action buttons appear in each row')
it('edit button onClick fires correctly')
it('delete button onClick fires correctly')
```

**Common Actions**:
- 編集 (Edit) button
- 削除 (Delete) button

**Test Approach**:
```typescript
const editButton = screen.getByRole('button', { name: /編集/i });
await user.click(editButton);

expect(consoleSpy).toHaveBeenCalledWith('Edit', 'test-123');
```

---

### 8. Performance & Large Datasets ✅
Tests for handling large amounts of data (OptimizedDataTable).

```typescript
// OptimizedDataTable Examples
it('handles 500 rows efficiently')
it('handles 1000 rows efficiently')
it('search performance with large dataset')
it('pagination with large dataset maintains state')
```

**Performance Features**:
- Memoized table rows
- Memoized header groups
- Memoized search callbacks
- Only renders current page (not all 1000 rows)

**Test Approach**:
```typescript
const products = createMockProducts(1000);
render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

// Should only render first page
const rows = screen.getAllByRole('row').slice(1);
expect(rows.length).toBeLessThanOrEqual(50);
```

---

## Running Tests

### Run All Data Table Tests
```bash
npm test -- data-table.test.tsx --no-coverage
```

### Run Specific Test File
```bash
npm test -- src/components/ui/common/data-table.test.tsx
npm test -- src/components/ui/common/optimized-data-table.test.tsx
```

### Run Tests in Watch Mode
```bash
npm test -- --watch data-table.test.tsx
```

### Run Tests with Coverage
```bash
npm test -- data-table.test.tsx --coverage
```

---

## Mock Data Patterns

### User Data (DataTable)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  salary: number;
}

const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'Manager',
  status: 'active',
  salary: 80000,
  ...overrides,
});
```

### Product Data (OptimizedDataTable)
```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  supplier: string;
  sku: string;
}

const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: '1',
  name: 'Product A',
  category: 'Electronics',
  price: 29999,
  stock: 100,
  supplier: 'Supplier X',
  sku: 'SKU-001',
  ...overrides,
});
```

---

## Column Definition Patterns

### Basic Column
```typescript
{
  accessorKey: 'name',
  header: '名前',
}
```

### Sortable Column
```typescript
{
  accessorKey: 'name',
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      名前
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
}
```

### Formatted Cell (Currency)
```typescript
{
  accessorKey: 'salary',
  header: '給与',
  cell: ({ row }) => {
    const amount = parseFloat(row.getValue('salary'));
    const formatted = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
    return <div className="font-medium">{formatted}</div>;
  },
}
```

### Selection Column
```typescript
{
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
}
```

### Actions Column
```typescript
{
  id: 'actions',
  header: 'アクション',
  cell: ({ row }) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleEdit(row.original.id)}>
        編集
      </Button>
      <Button variant="destructive" size="sm" onClick={() => handleDelete(row.original.id)}>
        削除
      </Button>
    </div>
  ),
}
```

---

## Common Testing Patterns

### 1. Clicking Elements
```typescript
const user = userEvent.setup();
const button = screen.getByRole('button', { name: /次へ/i });
await user.click(button);
```

### 2. Typing in Input
```typescript
const user = userEvent.setup();
const searchInput = screen.getByPlaceholderText('Search...');
await user.type(searchInput, 'Alice');
```

### 3. Checking Table Rows
```typescript
const rows = screen.getAllByRole('row');
expect(rows).toHaveLength(6); // 1 header + 5 data rows
```

### 4. Checking Row Content
```typescript
const rows = screen.getAllByRole('row').slice(1); // Skip header
expect(within(rows[0]).getByText('Alice Johnson')).toBeInTheDocument();
```

### 5. Checking Selected State
```typescript
const rows = screen.getAllByRole('row');
expect(rows[1]).toHaveAttribute('data-state', 'selected');
```

### 6. Checking Disabled State
```typescript
const nextButton = screen.getByRole('button', { name: /次へ/i });
expect(nextButton).toBeDisabled();
```

---

## Accessibility Testing

### Semantic Structure
```typescript
it('table has proper semantic structure', () => {
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
});
```

### ARIA Labels
```typescript
it('pagination buttons have accessible labels', () => {
  expect(screen.getByRole('button', { name: /前へ/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /次へ/i })).toBeInTheDocument();
});
```

### Checkbox Labels
```typescript
const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select all/i });
const rowCheckboxes = screen.getAllByRole('checkbox', { name: /Select row/i });
```

---

## Edge Cases Covered

### Empty Data
```typescript
it('handles empty state (no data)', () => {
  render(<DataTable columns={columns} data={[]} />);
  expect(screen.getByText('データがありません')).toBeInTheDocument();
});
```

### Single Row
```typescript
it('handles single row', () => {
  const users = [createMockUser()];
  render(<DataTable columns={columns} data={users} />);

  const rows = screen.getAllByRole('row');
  expect(rows).toHaveLength(2); // 1 header + 1 data row
});
```

### Large Dataset
```typescript
it('handles very large dataset', () => {
  const users = Array.from({ length: 1000 }, (_, i) =>
    createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
  );
  render(<DataTable columns={columns} data={users} />);

  // Should only render first page
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows.length).toBeLessThanOrEqual(10);
});
```

### Special Characters
```typescript
it('handles special characters in search', async () => {
  const users = [createMockUser({ name: "O'Brien" })];
  render(<DataTable columns={columns} data={users} searchKey="name" />);

  const searchInput = screen.getByPlaceholderText('Search...');
  await user.type(searchInput, "O'Brien");

  expect(screen.getByText("O'Brien")).toBeInTheDocument();
});
```

### Japanese Text
```typescript
it('handles Japanese text in search', async () => {
  const products = [createMockProduct({ category: '電子機器' })];
  render(<OptimizedDataTable columns={columns} data={products} />);

  const searchInput = screen.getByPlaceholderText('検索...');
  await user.type(searchInput, '電子');

  expect(screen.getByText('電子機器')).toBeInTheDocument();
});
```

---

## Test Statistics

### DataTable Component
- **Total Tests**: 40
- **Test Categories**: 8
- **Lines of Code**: 700+
- **Coverage**:
  - Table Rendering: 6 tests
  - Sorting: 5 tests
  - Filtering/Search: 5 tests
  - Pagination: 8 tests
  - Row Selection: 6 tests
  - Column Visibility: 2 tests
  - Row Actions: 3 tests
  - Edge Cases & Accessibility: 5 tests

### OptimizedDataTable Component
- **Total Tests**: 45
- **Test Categories**: 7
- **Lines of Code**: 650+
- **Coverage**:
  - Table Rendering: 7 tests
  - Global Search/Filtering: 9 tests
  - Pagination: 7 tests
  - Performance & Large Datasets: 4 tests
  - Memoization: 3 tests
  - Edge Cases: 7 tests
  - Accessibility: 4 tests

---

## Best Practices

### 1. Use userEvent over fireEvent
```typescript
// ✅ Good
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');

// ❌ Bad
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'text' } });
```

### 2. Use Accessible Queries
```typescript
// ✅ Good
screen.getByRole('button', { name: /次へ/i })
screen.getByPlaceholderText('検索...')
screen.getByText('データがありません')

// ❌ Bad
container.querySelector('.btn-next')
container.querySelector('input')
```

### 3. Use within() for Row Content
```typescript
// ✅ Good
const rows = screen.getAllByRole('row');
expect(within(rows[0]).getByText('Alice')).toBeInTheDocument();

// ❌ Bad
expect(screen.getByText('Alice')).toBeInTheDocument(); // Could be anywhere
```

### 4. Test User Interactions
```typescript
// ✅ Good - Test actual user flow
await user.type(searchInput, 'Alice');
expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

// ❌ Bad - Test implementation details
expect(table.getFilteredRowModel().rows).toHaveLength(1);
```

### 5. Use Regex for Flexible Matching
```typescript
// ✅ Good
expect(screen.getByText(/ページ 1 \/ 3/i)).toBeInTheDocument();

// ❌ Bad
expect(screen.getByText('ページ 1 / 3')).toBeInTheDocument();
```

---

## Troubleshooting

### Issue: "Unable to find an element"
**Solution**: Use `screen.debug()` to see what's rendered
```typescript
render(<DataTable columns={columns} data={users} />);
screen.debug(); // Prints entire DOM
```

### Issue: "Test timeout"
**Solution**: Ensure userEvent.setup() is called
```typescript
const user = userEvent.setup();
await user.click(button); // Must await!
```

### Issue: "Currency symbol mismatch"
**Solution**: Use `￥` instead of `¥`
```typescript
// ✅ Correct
expect(screen.getByText('￥80,000')).toBeInTheDocument();

// ❌ Wrong
expect(screen.getByText('¥80,000')).toBeInTheDocument();
```

### Issue: "Row selection not working"
**Solution**: Ensure selection column is defined
```typescript
const columns = createColumns({ enableSelection: true });
```

---

## Future Enhancements

### Potential Additional Tests
1. **Keyboard Navigation**
   - Tab through table rows
   - Arrow key navigation
   - Enter/Space to select

2. **Drag & Drop**
   - Reorder columns
   - Reorder rows

3. **Context Menu**
   - Right-click row actions

4. **Export Functions**
   - Export to CSV
   - Export to PDF

5. **Inline Editing**
   - Click cell to edit
   - Save/cancel changes

6. **Filtering UI**
   - Column-specific filters
   - Date range pickers
   - Multi-select dropdowns

---

## Resources

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [TanStack Table](https://tanstack.com/table/v8/docs/guide/introduction)
- [Jest](https://jestjs.io/docs/getting-started)
- [user-event](https://testing-library.com/docs/user-event/intro)

---

## Conclusion

These comprehensive test suites cover **all major data table patterns** used in modern web applications:

✅ **Table Rendering** - Headers, rows, empty states
✅ **Sorting** - Ascending/descending with indicators
✅ **Filtering** - Real-time search across columns
✅ **Pagination** - Page size, navigation, indicators
✅ **Selection** - Individual rows and select all
✅ **Actions** - Edit/delete buttons with handlers
✅ **Performance** - Handles 1000+ rows efficiently
✅ **Accessibility** - ARIA labels, semantic HTML

With **85+ test cases** and **1350+ lines of test code**, these suites ensure robust, reliable data table components for the Dandori Portal.
