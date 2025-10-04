"use client";

import * as React from "react";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as ReactTableInstance,
} from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { EmptyState } from "./EmptyState";
import { TablePagination } from "./TablePagination";
import { TableSkeleton } from "./TableSkeleton";

type Density = "comfortable" | "compact";

export interface PageChangeMeta {
  direction: "next" | "previous";
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalHint?: string;
  onPageChange?: (cursor: string | null, meta?: PageChangeMeta) => void;
  nextCursor?: string | null;
  previousCursor?: string | null;
  isLoading?: boolean;
  toolbar?: (table: ReactTableInstance<TData>) => React.ReactNode;
  density?: Density;
  emptyState?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalHint,
  onPageChange,
  nextCursor,
  previousCursor,
  isLoading = false,
  toolbar,
  density = "comfortable",
  emptyState,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const densityClass = React.useMemo(() => {
    return density === "compact" ? "[&_td]:py-2 [&_th]:py-2" : "[&_td]:py-3 [&_th]:py-3";
  }, [density]);

  const hasPrevious = previousCursor !== undefined;
  const hasNext = nextCursor !== undefined && nextCursor !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {toolbar ? <div className="flex-1">{toolbar(table)}</div> : null}
        <div className="flex items-center gap-2 md:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllLeafColumns()
                .filter(column => column.getCanHide())
                .map(column => {
                  const header = column.columnDef.header;
                  const label =
                    column.columnDef.meta?.label ??
                    (typeof header === "string" ? header : column.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value => column.toggleVisibility(Boolean(value))}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        {isLoading ? (
          <TableSkeleton columns={columns.length} />
        ) : table.getRowModel().rows.length === 0 ? (
          emptyState ?? <EmptyState title="No results" description="Try adjusting your filters or search." />
        ) : (
          <Table className={cn("min-w-full", densityClass)}>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <TablePagination
        totalHint={totalHint}
        hasPrevious={hasPrevious && Boolean(onPageChange)}
        hasNext={hasNext && Boolean(onPageChange)}
        onPrevious={() =>
          previousCursor !== undefined ? onPageChange?.(previousCursor, { direction: "previous" }) : undefined
        }
        onNext={() => onPageChange?.(nextCursor ?? null, { direction: "next" })}
        isLoading={isLoading}
      />
    </div>
  );
}
