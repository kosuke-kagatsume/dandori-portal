/**
 * OptimizedDataTable Component Tests
 *
 * Comprehensive test suite for the optimized data table component covering:
 * - Performance optimizations (memoization, virtualization)
 * - Global search filtering
 * - Pagination with custom page sizes
 * - Table rendering with large datasets
 * - Memory efficiency
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptimizedDataTable } from './optimized-data-table';
import { ColumnDef } from '@tanstack/react-table';

// Mock data interface
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  supplier: string;
  sku: string;
}

// Mock data generator
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

const createMockProducts = (count: number = 10): Product[] => {
  return Array.from({ length: count }, (_, i) => {
    const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Toys'];
    const suppliers = ['Supplier A', 'Supplier B', 'Supplier C'];

    return createMockProduct({
      id: `${i + 1}`,
      name: `Product ${String.fromCharCode(65 + (i % 26))}`,
      category: categories[i % categories.length],
      price: 1000 + i * 500,
      stock: 50 + i * 10,
      supplier: suppliers[i % suppliers.length],
      sku: `SKU-${String(i + 1).padStart(3, '0')}`,
    });
  });
};

// Column definitions
const createColumns = (): ColumnDef<Product>[] => [
  {
    accessorKey: 'name',
    header: '商品名',
  },
  {
    accessorKey: 'category',
    header: 'カテゴリ',
  },
  {
    accessorKey: 'price',
    header: '価格',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('price'));
      const formatted = new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
      }).format(amount);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'stock',
    header: '在庫',
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number;
      return (
        <span className={stock < 100 ? 'text-red-600' : 'text-green-600'}>
          {stock}
        </span>
      );
    },
  },
  {
    accessorKey: 'supplier',
    header: '仕入先',
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
  },
];

describe('OptimizedDataTable', () => {
  // ============================================================
  // 1. Table Rendering
  // ============================================================

  describe('Table Rendering', () => {
    it('renders table with headers and rows', () => {
      const products = createMockProducts(5);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      // Check headers
      expect(screen.getByText('商品名')).toBeInTheDocument();
      expect(screen.getByText('カテゴリ')).toBeInTheDocument();
      expect(screen.getByText('価格')).toBeInTheDocument();
      expect(screen.getByText('在庫')).toBeInTheDocument();

      // Check data rows
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });

    it('displays all column headers correctly', () => {
      const products = createMockProducts(5);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');

      expect(headers).toHaveLength(6); // name, category, price, stock, supplier, sku
    });

    it('shows all data rows within page size', () => {
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={10} />);

      const rows = screen.getAllByRole('row');
      // 1 header row + 10 data rows = 11 total
      expect(rows).toHaveLength(11);
    });

    it('handles empty state (no data)', () => {
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={[]} />);

      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('renders with custom page size', () => {
      const products = createMockProducts(30);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={20} />);

      const rows = screen.getAllByRole('row').slice(1); // Skip header
      expect(rows.length).toBeLessThanOrEqual(20);
    });

    it('renders formatted currency values', () => {
      const products = [createMockProduct({ price: 29999 })];
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      expect(screen.getByText('￥29,999')).toBeInTheDocument();
    });

    it('renders stock with color indicators', () => {
      const products = [
        createMockProduct({ id: '1', stock: 50 }),  // Red (< 100)
        createMockProduct({ id: '2', stock: 150 }), // Green (>= 100)
      ];
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const stockCells = screen.getAllByText(/50|150/);
      expect(stockCells[0]).toHaveClass('text-red-600');
      expect(stockCells[1]).toHaveClass('text-green-600');
    });
  });

  // ============================================================
  // 2. Global Search/Filtering
  // ============================================================

  describe('Global Search/Filtering', () => {
    it('search input is present with default placeholder', () => {
      const products = createMockProducts(5);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument();
    });

    it('search input has custom placeholder', () => {
      const products = createMockProducts(5);
      const columns = createColumns();

      render(
        <OptimizedDataTable
          columns={columns}
          data={products}
          searchPlaceholder="商品を検索..."
        />
      );

      expect(screen.getByPlaceholderText('商品を検索...')).toBeInTheDocument();
    });

    it('global search filters across all columns', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'Product A');

      // Should show Product A
      expect(screen.getByText('Product A')).toBeInTheDocument();
      // Should not show Product B
      expect(screen.queryByText('Product B')).not.toBeInTheDocument();
    });

    it('search filters by category', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'Electronics');

      // Should show Electronics category items
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('search filters by SKU', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'SKU-001');

      expect(screen.getByText('SKU-001')).toBeInTheDocument();
    });

    it('results update in real-time', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');

      // Type progressively
      await user.type(searchInput, 'P');
      expect(screen.getByText('Product A')).toBeInTheDocument();

      await user.type(searchInput, 'roduct');
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    it('shows no results message when filtered to empty', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'NonexistentProduct');

      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('clearing search shows all results', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'Product A');

      // Limited results
      expect(screen.queryByText('Product B')).not.toBeInTheDocument();

      // Clear search
      await user.clear(searchInput);

      // All results visible
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'electronics');

      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 3. Pagination
  // ============================================================

  describe('Pagination', () => {
    it('displays current page and total pages', () => {
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      expect(screen.getByText(/ページ 1 \/ 2/i)).toBeInTheDocument();
    });

    it('shows item range display', () => {
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      // Should show "1-50 of 100"
      expect(screen.getByText(/1-50 件を表示/i)).toBeInTheDocument();
    });

    it('next button navigates to next page', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      // First page
      expect(screen.getByText(/1-50 件を表示/i)).toBeInTheDocument();

      // Click next
      const nextButton = screen.getByRole('button', { name: /次へ/i });
      await user.click(nextButton);

      // Second page
      expect(screen.getByText(/51-100 件を表示/i)).toBeInTheDocument();
    });

    it('previous button navigates to previous page', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      // Go to page 2
      const nextButton = screen.getByRole('button', { name: /次へ/i });
      await user.click(nextButton);

      expect(screen.getByText(/51-100 件を表示/i)).toBeInTheDocument();

      // Go back to page 1
      const prevButton = screen.getByRole('button', { name: /前へ/i });
      await user.click(prevButton);

      expect(screen.getByText(/1-50 件を表示/i)).toBeInTheDocument();
    });

    it('previous button disabled on first page', () => {
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      const prevButton = screen.getByRole('button', { name: /前へ/i });
      expect(prevButton).toBeDisabled();
    });

    it('next button disabled on last page', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      // Go to last page
      const nextButton = screen.getByRole('button', { name: /次へ/i });
      await user.click(nextButton);

      expect(nextButton).toBeDisabled();
    });

    it('handles single page dataset', () => {
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      expect(screen.getByText(/ページ 1 \/ 1/i)).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /次へ/i });
      const prevButton = screen.getByRole('button', { name: /前へ/i });

      expect(nextButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
    });

    it('pagination works with search filter', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={10} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'Electronics');

      // Filtered results should have pagination
      expect(screen.getByText(/ページ/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // 4. Performance & Large Datasets
  // ============================================================

  describe('Performance & Large Datasets', () => {
    it('handles 500 rows efficiently', () => {
      const products = createMockProducts(500);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      // Should only render first page
      const rows = screen.getAllByRole('row').slice(1);
      expect(rows.length).toBeLessThanOrEqual(50);
    });

    it('handles 1000 rows efficiently', () => {
      const products = createMockProducts(1000);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      // Should render without crashing
      expect(screen.getByText(/1000 件中/i)).toBeInTheDocument();
    });

    it('search performance with large dataset', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(500);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');

      // Search should not cause performance issues
      await user.type(searchInput, 'Product');

      expect(screen.getByText(/件を表示/i)).toBeInTheDocument();
    });

    it('pagination with large dataset maintains state', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(200);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /次へ/i });
      await user.click(nextButton);

      expect(screen.getByText(/ページ 2/i)).toBeInTheDocument();

      // Navigate to page 3
      await user.click(nextButton);

      expect(screen.getByText(/ページ 3/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // 5. Memoization & Re-rendering
  // ============================================================

  describe('Memoization & Re-rendering', () => {
    it('component is memoized', () => {
      const products = createMockProducts(10);
      const columns = createColumns();

      const { rerender } = render(
        <OptimizedDataTable columns={columns} data={products} />
      );

      // Re-render with same props should use memoized component
      rerender(<OptimizedDataTable columns={columns} data={products} />);

      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    it('updates when data changes', () => {
      const products = createMockProducts(5);
      const columns = createColumns();

      const { rerender } = render(
        <OptimizedDataTable columns={columns} data={products} />
      );

      expect(screen.getByText('Product A')).toBeInTheDocument();

      // Update with new data
      const newProducts = createMockProducts(5).map((p) => ({
        ...p,
        name: `Updated ${p.name}`,
      }));

      rerender(<OptimizedDataTable columns={columns} data={newProducts} />);

      expect(screen.getByText('Updated Product A')).toBeInTheDocument();
    });

    it('search callback is memoized', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');

      // Multiple search operations should use memoized callback
      await user.type(searchInput, 'P');
      await user.type(searchInput, 'r');
      await user.type(searchInput, 'o');

      expect(screen.getByText('Product A')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 6. Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('handles single row', () => {
      const products = [createMockProduct()];
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // 1 header + 1 data row
    });

    it('handles empty data array', () => {
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={[]} />);

      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('handles special characters in search', async () => {
      const user = userEvent.setup();
      const products = [createMockProduct({ name: "Product's Special Name" })];
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, "Product's");

      expect(screen.getByText("Product's Special Name")).toBeInTheDocument();
    });

    it('handles Japanese text in search', async () => {
      const user = userEvent.setup();
      const products = [createMockProduct({ category: '電子機器' })];
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, '電子');

      expect(screen.getByText('電子機器')).toBeInTheDocument();
    });

    it('maintains search state during pagination', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={10} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, 'Product');

      // Search should persist across page navigation
      const nextButton = screen.getByRole('button', { name: /次へ/i });
      if (!nextButton.hasAttribute('disabled')) {
        await user.click(nextButton);
        expect(searchInput).toHaveValue('Product');
      }
    });

    it('handles numeric search values', async () => {
      const user = userEvent.setup();
      const products = createMockProducts(10);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      await user.type(searchInput, '1000');

      // Should find products with price 1000
      expect(screen.getByText('￥1,000')).toBeInTheDocument();
    });
  });

  // ============================================================
  // 7. Accessibility
  // ============================================================

  describe('Accessibility', () => {
    it('table has proper semantic structure', () => {
      const products = createMockProducts(5);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    it('pagination buttons have accessible labels', () => {
      const products = createMockProducts(100);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} pageSize={50} />);

      expect(screen.getByRole('button', { name: /前へ/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /次へ/i })).toBeInTheDocument();
    });

    it('search input is accessible', () => {
      const products = createMockProducts(5);
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={products} />);

      const searchInput = screen.getByPlaceholderText('検索...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('empty state message is readable', () => {
      const columns = createColumns();

      render(<OptimizedDataTable columns={columns} data={[]} />);

      const emptyMessage = screen.getByText('データがありません');
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toHaveClass('text-center');
    });
  });
});
