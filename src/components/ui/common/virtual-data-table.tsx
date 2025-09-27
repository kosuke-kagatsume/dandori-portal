'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { performanceMonitor } from '@/lib/performance';
import { performanceCache } from '@/lib/performance-cache';

interface VirtualDataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  rowHeight?: number;
  overscan?: number;
  enableVirtualization?: boolean;
  enableCaching?: boolean;
  pageSize?: number;
}

export function VirtualDataTable<TData>({
  columns,
  data,
  searchKey = 'id',
  searchPlaceholder = '検索...',
  rowHeight = 53,
  overscan = 5,
  enableVirtualization = true,
  enableCaching = true,
  pageSize = 50,
}: VirtualDataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef<number | null>(null);

  // キャッシュキーの生成
  const cacheKey = useMemo(() => {
    if (!enableCaching) return null;
    return `table_data_${globalFilter}_${JSON.stringify(sorting)}`;
  }, [globalFilter, sorting, enableCaching]);

  // フィルター処理をキャッシュ
  const filteredData = useMemo(() => {
    let result: TData[] = data;

    if (enableCaching && cacheKey) {
      const cached = performanceCache.get(cacheKey);
      if (cached) return cached as TData[];
    }

    if (globalFilter) {
      const searchValue = globalFilter.toLowerCase();
      result = data.filter((item: any) => {
        return Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchValue)
        );
      });
    }

    if (enableCaching && cacheKey) {
      performanceCache.set(cacheKey, result, 5);
    }

    return result;
  }, [data, globalFilter, cacheKey, enableCaching]);

  // テーブル設定
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: enableVirtualization ? filteredData.length : pageSize,
      },
    },
  });

  // 仮想化設定
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    enabled: enableVirtualization,
  });

  // スクロールパフォーマンス最適化
  const handleScroll = useCallback(() => {
    if (scrollingRef.current !== null) {
      cancelAnimationFrame(scrollingRef.current);
    }
    scrollingRef.current = requestAnimationFrame(() => {
      scrollingRef.current = null;
    });
  }, []);

  // 検索のデバウンス処理
  const [searchValue, setSearchValue] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const virtualRows = enableVirtualization ? rowVirtualizer.getVirtualItems() : null;
  const totalHeight = enableVirtualization ? rowVirtualizer.getTotalSize() : 'auto';
  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredData.length} / {data.length} 件
        </div>
      </div>

      {/* テーブル */}
      <div className="rounded-md border">
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: enableVirtualization ? '600px' : 'auto' }}
          onScroll={handleScroll}
        >
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none"
                    >
                      <div className="flex items-center">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getIsSorted() && (
                          <span className="ml-2">
                            {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {enableVirtualization ? (
                <>
                  <tr style={{ height: `${virtualRows?.[0]?.start ?? 0}px` }} />
                  {virtualRows?.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <TableRow
                        key={row.id}
                        data-index={virtualRow.index}
                        style={{
                          height: `${virtualRow.size}px`,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  <tr
                    style={{
                      height: `${
                        Number(totalHeight) -
                        (virtualRows?.[virtualRows.length - 1]?.end ?? 0)
                      }px`,
                    }}
                  />
                </>
              ) : (
                rows.slice(0, pageSize).map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ページネーション（仮想スクロール無効時のみ） */}
      {!enableVirtualization && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {table.getState().pagination.pageIndex * pageSize + 1} -{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              filteredData.length
            )}{' '}
            / {filteredData.length} 件
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}