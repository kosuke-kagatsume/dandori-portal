'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OptimizedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
}

// メモ化されたテーブル行コンポーネント
const TableRowMemo = memo(({ row, columns }: { row: any; columns: any[] }) => (
  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
    {row.getVisibleCells().map((cell: any) => (
      <TableCell key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </TableCell>
    ))}
  </TableRow>
));

TableRowMemo.displayName = 'TableRowMemo';

// メモ化されたテーブルヘッダーコンポーネント
const TableHeaderMemo = memo(({ headerGroups }: { headerGroups: any[] }) => (
  <TableHeader>
    {headerGroups.map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header: any) => (
          <TableHead key={header.id}>
            {header.isPlaceholder
              ? null
              : flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
          </TableHead>
        ))}
      </TableRow>
    ))}
  </TableHeader>
));

TableHeaderMemo.displayName = 'TableHeaderMemo';

export const OptimizedDataTable = memo(<TData, TValue>({
  columns,
  data,
  searchKey = 'id',
  searchPlaceholder = '検索...',
  pageSize = 50,
}: OptimizedDataTableProps<TData, TValue>) => {
  const [globalFilter, setGlobalFilter] = useState('');

  // テーブル設定をメモ化
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // 検索ハンドラをメモ化
  const handleSearchChange = useCallback((value: string) => {
    setGlobalFilter(value);
  }, []);

  // 表示する行をメモ化
  const rows = useMemo(() => table.getRowModel().rows, [table]);

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="flex items-center py-4">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} 件中 {table.getState().pagination.pageIndex * pageSize + 1}-
          {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, table.getFilteredRowModel().rows.length)} 件を表示
        </div>
      </div>

      {/* テーブル */}
      <div className="rounded-md border">
        <Table>
          <TableHeaderMemo headerGroups={table.getHeaderGroups()} />
          <TableBody>
            {rows?.length ? (
              rows.map((row) => (
                <TableRowMemo key={row.id} row={row} columns={columns} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          ページ {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            次へ
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

OptimizedDataTable.displayName = 'OptimizedDataTable';