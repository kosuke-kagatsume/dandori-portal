/**
 * DataTable Component Tests
 *
 * Comprehensive test suite for the data table component covering:
 * - Table rendering with headers and rows
 * - Sorting functionality (column headers, direction toggles)
 * - Filtering/search with real-time updates
 * - Pagination (page size, navigation, indicators)
 * - Row selection (individual, select all, highlights)
 * - Column visibility toggle
 * - Empty state handling
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data interface
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  salary: number;
}

// Mock data generator
const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  role: 'Manager',
  status: 'active',
  salary: 80000,
  ...overrides,
});

const createMockUsers = (): User[] => [
  createMockUser({ id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Manager', status: 'active', salary: 80000 }),
  createMockUser({ id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Developer', status: 'active', salary: 70000 }),
  createMockUser({ id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Designer', status: 'inactive', salary: 65000 }),
  createMockUser({ id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Developer', status: 'active', salary: 75000 }),
  createMockUser({ id: '5', name: 'Eve Adams', email: 'eve@example.com', role: 'Manager', status: 'active', salary: 85000 }),
  createMockUser({ id: '6', name: 'Frank Miller', email: 'frank@example.com', role: 'Designer', status: 'inactive', salary: 60000 }),
  createMockUser({ id: '7', name: 'Grace Lee', email: 'grace@example.com', role: 'Developer', status: 'active', salary: 72000 }),
  createMockUser({ id: '8', name: 'Henry Wilson', email: 'henry@example.com', role: 'Manager', status: 'active', salary: 90000 }),
];

// Column definitions with sorting
const createColumns = (options?: {
  enableSorting?: boolean;
  enableSelection?: boolean;
  showActions?: boolean;
}): ColumnDef<User>[] => {
  const columns: ColumnDef<User>[] = [];

  // Selection column
  if (options?.enableSelection) {
    columns.push({
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
    });
  }

  // Data columns
  columns.push(
    {
      accessorKey: 'name',
      header: options?.enableSorting
        ? ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              名前
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        : '名前',
    },
    {
      accessorKey: 'email',
      header: 'メールアドレス',
    },
    {
      accessorKey: 'role',
      header: options?.enableSorting
        ? ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              役職
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        : '役職',
    },
    {
      accessorKey: 'status',
      header: 'ステータス',
      cell: ({ row }) => (
        <span className={row.getValue('status') === 'active' ? 'text-green-600' : 'text-gray-400'}>
          {row.getValue('status') === 'active' ? '有効' : '無効'}
        </span>
      ),
    },
    {
      accessorKey: 'salary',
      header: options?.enableSorting
        ? ({ column }) => (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              給与
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        : '給与',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('salary'));
        const formatted = new Intl.NumberFormat('ja-JP', {
          style: 'currency',
          currency: 'JPY',
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
      },
    }
  );

  // Actions column
  if (options?.showActions) {
    columns.push({
      id: 'actions',
      header: 'アクション',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => console.log('Edit', row.original.id)}>
            編集
          </Button>
          <Button variant="destructive" size="sm" onClick={() => console.log('Delete', row.original.id)}>
            削除
          </Button>
        </div>
      ),
    });
  }

  return columns;
};

describe('DataTable', () => {
  // ============================================================
  // 1. Table Rendering
  // ============================================================

  describe('Table Rendering', () => {
    it('renders table with headers and rows', () => {
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Check headers are rendered
      expect(screen.getByText('名前')).toBeInTheDocument();
      expect(screen.getByText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByText('役職')).toBeInTheDocument();
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('給与')).toBeInTheDocument();

      // Check data rows are rendered
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('displays column headers correctly', () => {
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');

      // Should have 5 column headers (name, email, role, status, salary)
      expect(headers).toHaveLength(5);
    });

    it('shows all data rows', () => {
      const users = createMockUsers().slice(0, 5); // First 5 users
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      const rows = screen.getAllByRole('row');
      // 1 header row + 5 data rows = 6 total
      expect(rows).toHaveLength(6);
    });

    it('handles empty state (no data)', () => {
      const columns = createColumns();

      render(<DataTable columns={columns} data={[]} />);

      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('renders formatted currency values', () => {
      const users = [createMockUser({ salary: 80000 })];
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Japanese currency format
      expect(screen.getByText('￥80,000')).toBeInTheDocument();
    });

    it('renders status badges with correct styling', () => {
      const users = [
        createMockUser({ id: '1', status: 'active' }),
        createMockUser({ id: '2', status: 'inactive' }),
      ];
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      expect(screen.getByText('有効')).toHaveClass('text-green-600');
      expect(screen.getByText('無効')).toHaveClass('text-gray-400');
    });
  });

  // ============================================================
  // 2. Sorting
  // ============================================================

  describe('Sorting', () => {
    it('column headers are clickable when sorting is enabled', async () => {
      const users = createMockUsers();
      const columns = createColumns({ enableSorting: true });

      render(<DataTable columns={columns} data={users} />);

      const nameHeader = screen.getByRole('button', { name: /名前/i });
      expect(nameHeader).toBeInTheDocument();
    });

    it('click toggles sort direction (asc/desc)', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns({ enableSorting: true });

      render(<DataTable columns={columns} data={users} />);

      const nameHeader = screen.getByRole('button', { name: /名前/i });

      // First click: ascending
      await user.click(nameHeader);

      const rows = screen.getAllByRole('row').slice(1); // Skip header
      const firstRowName = within(rows[0]).getByText(/Alice Johnson/i);
      expect(firstRowName).toBeInTheDocument();

      // Second click: descending
      await user.click(nameHeader);

      const rowsDesc = screen.getAllByRole('row').slice(1);
      const firstRowNameDesc = within(rowsDesc[0]).queryByText(/Henry Wilson/i);
      expect(firstRowNameDesc).toBeInTheDocument();
    });

    it('data is sorted correctly by name', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns({ enableSorting: true });

      render(<DataTable columns={columns} data={users} />);

      const nameHeader = screen.getByRole('button', { name: /名前/i });
      await user.click(nameHeader);

      const rows = screen.getAllByRole('row').slice(1);

      // First row should be Alice (alphabetically first)
      expect(within(rows[0]).getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('data is sorted correctly by salary (numeric)', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns({ enableSorting: true });

      render(<DataTable columns={columns} data={users} />);

      const salaryHeader = screen.getByRole('button', { name: /給与/i });
      await user.click(salaryHeader);

      const rows = screen.getAllByRole('row').slice(1);

      // First row should have lowest salary (60,000)
      expect(within(rows[0]).getByText('Frank Miller')).toBeInTheDocument();
    });

    it('sort indicator icon is present', () => {
      const users = createMockUsers();
      const columns = createColumns({ enableSorting: true });

      const { container } = render(<DataTable columns={columns} data={users} />);

      // ArrowUpDown icons should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 3. Filtering/Search
  // ============================================================

  describe('Filtering/Search', () => {
    it('search input filters data', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} searchKey="name" searchPlaceholder="名前で検索..." />);

      const searchInput = screen.getByPlaceholderText('名前で検索...');
      await user.type(searchInput, 'Alice');

      // Only Alice should be visible
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('results update in real-time', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText('Search...');

      // Type first letter
      await user.type(searchInput, 'B');
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();

      // Type more
      await user.type(searchInput, 'o');
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('shows no results message when filtered to empty', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'NonexistentName');

      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'alice');

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('clearing search shows all results', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'Alice');

      // Only Alice visible
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();

      // Clear search
      await user.clear(searchInput);

      // All results visible again
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 4. Pagination
  // ============================================================

  describe('Pagination', () => {
    it('shows correct page size (10 items)', async () => {
      const users = Array.from({ length: 25 }, (_, i) =>
        createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
      );
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Default page size is 10
      const rows = screen.getAllByRole('row').slice(1); // Skip header
      expect(rows.length).toBeLessThanOrEqual(10);
    });

    it('page navigation buttons work', async () => {
      const user = userEvent.setup();
      const users = Array.from({ length: 25 }, (_, i) =>
        createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
      );
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // First page should show User 1
      expect(screen.getByText('User 1')).toBeInTheDocument();

      // Click next page button
      const nextButton = screen.getByRole('button', { name: /次のページに移動/i });
      await user.click(nextButton);

      // Second page should show User 11 (with default page size of 10)
      expect(screen.getByText('User 11')).toBeInTheDocument();
      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
    });

    it('current page indicator shows correct page', async () => {
      const users = Array.from({ length: 25 }, (_, i) =>
        createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
      );
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Should show "Page 1 / 3" (25 users, 10 per page)
      expect(screen.getByText(/ページ 1 \/ 3/i)).toBeInTheDocument();
    });

    it('total count display is correct', async () => {
      const users = createMockUsers(); // 8 users
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Should show "0 / 8 行を選択中"
      expect(screen.getByText(/0 \/ 8 行を選択中/i)).toBeInTheDocument();
    });

    it('can change page size', async () => {
      const user = userEvent.setup();
      const users = Array.from({ length: 25 }, (_, i) =>
        createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
      );
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Initially should show page 1 / 3 (25 users, 10 per page)
      expect(screen.getByText(/ページ 1 \/ 3/i)).toBeInTheDocument();

      // Find and click the page size selector trigger
      const pageSizeTrigger = screen.getByRole('button', { name: /10/i });
      await user.click(pageSizeTrigger);

      // Wait for dropdown to open and select 20
      const option20 = await screen.findByText('20');
      await user.click(option20);

      // Page indicator should now show "Page 1 / 2"
      expect(await screen.findByText(/ページ 1 \/ 2/i)).toBeInTheDocument();
    });

    it('first and last page buttons work', async () => {
      const user = userEvent.setup();
      const users = Array.from({ length: 25 }, (_, i) =>
        createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
      );
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Go to last page
      const lastPageButton = screen.getByRole('button', { name: /最後のページに移動/i });
      await user.click(lastPageButton);

      expect(screen.getByText('User 21')).toBeInTheDocument();

      // Go back to first page
      const firstPageButton = screen.getByRole('button', { name: /最初のページに移動/i });
      await user.click(firstPageButton);

      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    it('previous button disabled on first page', () => {
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      const prevButton = screen.getByRole('button', { name: /前のページに移動/i });
      expect(prevButton).toBeDisabled();
    });

    it('next button disabled on last page', async () => {
      const user = userEvent.setup();
      const users = Array.from({ length: 15 }, (_, i) =>
        createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
      );
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Go to last page
      const lastPageButton = screen.getByRole('button', { name: /最後のページに移動/i });
      await user.click(lastPageButton);

      const nextButton = screen.getByRole('button', { name: /次のページに移動/i });
      expect(nextButton).toBeDisabled();
    });
  });

  // ============================================================
  // 5. Row Selection
  // ============================================================

  describe('Row Selection', () => {
    it('checkbox in each row', () => {
      const users = createMockUsers().slice(0, 3);
      const columns = createColumns({ enableSelection: true });

      render(<DataTable columns={columns} data={users} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /Select row/i });
      expect(checkboxes).toHaveLength(3);
    });

    it('select all checkbox', () => {
      const users = createMockUsers().slice(0, 3);
      const columns = createColumns({ enableSelection: true });

      render(<DataTable columns={columns} data={users} />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select all/i });
      expect(selectAllCheckbox).toBeInTheDocument();
    });

    it('selected rows are highlighted', async () => {
      const user = userEvent.setup();
      const users = createMockUsers().slice(0, 3);
      const columns = createColumns({ enableSelection: true });

      render(<DataTable columns={columns} data={users} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /Select row/i });
      await user.click(checkboxes[0]);

      const rows = screen.getAllByRole('row');
      // First data row (index 1, after header) should have data-state="selected"
      expect(rows[1]).toHaveAttribute('data-state', 'selected');
    });

    it('selection count display', async () => {
      const user = userEvent.setup();
      const users = createMockUsers().slice(0, 5);
      const columns = createColumns({ enableSelection: true });

      render(<DataTable columns={columns} data={users} />);

      // Initially 0 selected
      expect(screen.getByText(/0 \/ 5 行を選択中/i)).toBeInTheDocument();

      // Select first row
      const checkboxes = screen.getAllByRole('checkbox', { name: /Select row/i });
      await user.click(checkboxes[0]);

      // Now 1 selected
      expect(screen.getByText(/1 \/ 5 行を選択中/i)).toBeInTheDocument();
    });

    it('select all works', async () => {
      const user = userEvent.setup();
      const users = createMockUsers().slice(0, 5);
      const columns = createColumns({ enableSelection: true });

      render(<DataTable columns={columns} data={users} />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select all/i });
      await user.click(selectAllCheckbox);

      // All 5 rows should be selected
      expect(screen.getByText(/5 \/ 5 行を選択中/i)).toBeInTheDocument();
    });

    it('deselect all works', async () => {
      const user = userEvent.setup();
      const users = createMockUsers().slice(0, 5);
      const columns = createColumns({ enableSelection: true });

      render(<DataTable columns={columns} data={users} />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /Select all/i });

      // Select all
      await user.click(selectAllCheckbox);
      expect(screen.getByText(/5 \/ 5 行を選択中/i)).toBeInTheDocument();

      // Deselect all
      await user.click(selectAllCheckbox);
      expect(screen.getByText(/0 \/ 5 行を選択中/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // 6. Column Visibility Toggle
  // ============================================================

  describe('Column Visibility Toggle', () => {
    it('column visibility dropdown exists', () => {
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      const visibilityButton = screen.getByRole('button', { name: /列表示/i });
      expect(visibilityButton).toBeInTheDocument();
    });

    it('can toggle column visibility', async () => {
      const user = userEvent.setup();
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Email column should be visible
      expect(screen.getByText('メールアドレス')).toBeInTheDocument();

      // Open visibility dropdown
      const visibilityButton = screen.getByRole('button', { name: /列表示/i });
      await user.click(visibilityButton);

      // Toggle email column
      const emailCheckbox = screen.getByRole('menuitemcheckbox', { name: /email/i });
      await user.click(emailCheckbox);

      // Email column should be hidden
      expect(screen.queryByText('メールアドレス')).not.toBeInTheDocument();
    });
  });

  // ============================================================
  // 7. Row Actions
  // ============================================================

  describe('Row Actions', () => {
    it('action buttons appear in each row', () => {
      const users = createMockUsers().slice(0, 3);
      const columns = createColumns({ showActions: true });

      render(<DataTable columns={columns} data={users} />);

      const editButtons = screen.getAllByRole('button', { name: /編集/i });
      const deleteButtons = screen.getAllByRole('button', { name: /削除/i });

      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });

    it('edit button onClick fires correctly', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log');
      const users = [createMockUser({ id: 'test-123' })];
      const columns = createColumns({ showActions: true });

      render(<DataTable columns={columns} data={users} />);

      const editButton = screen.getByRole('button', { name: /編集/i });
      await user.click(editButton);

      expect(consoleSpy).toHaveBeenCalledWith('Edit', 'test-123');
    });

    it('delete button onClick fires correctly', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log');
      const users = [createMockUser({ id: 'test-456' })];
      const columns = createColumns({ showActions: true });

      render(<DataTable columns={columns} data={users} />);

      const deleteButton = screen.getByRole('button', { name: /削除/i });
      await user.click(deleteButton);

      expect(consoleSpy).toHaveBeenCalledWith('Delete', 'test-456');
    });
  });

  // ============================================================
  // 8. Edge Cases & Accessibility
  // ============================================================

  describe('Edge Cases & Accessibility', () => {
    it('handles single row', () => {
      const users = [createMockUser()];
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // 1 header + 1 data row
    });

    it('handles very large dataset', () => {
      const users = Array.from({ length: 1000 }, (_, i) =>
        createMockUser({ id: `${i + 1}`, name: `User ${i + 1}` })
      );
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      // Should only render first page (10 items)
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows.length).toBeLessThanOrEqual(10);
    });

    it('table has proper semantic structure', () => {
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    it('search input has placeholder', () => {
      const users = createMockUsers();
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} searchKey="name" searchPlaceholder="カスタムプレースホルダー" />);

      expect(screen.getByPlaceholderText('カスタムプレースホルダー')).toBeInTheDocument();
    });

    it('handles special characters in search', async () => {
      const user = userEvent.setup();
      const users = [createMockUser({ name: 'O\'Brien' })];
      const columns = createColumns();

      render(<DataTable columns={columns} data={users} searchKey="name" />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, "O'Brien");

      expect(screen.getByText('O\'Brien')).toBeInTheDocument();
    });

    it('maintains state when data updates', () => {
      const users = createMockUsers().slice(0, 3);
      const columns = createColumns();

      const { rerender } = render(<DataTable columns={columns} data={users} />);

      // Update data
      const newUsers = [...users, createMockUser({ id: '9', name: 'New User' })];
      rerender(<DataTable columns={columns} data={newUsers} />);

      expect(screen.getByText('New User')).toBeInTheDocument();
    });
  });
});
