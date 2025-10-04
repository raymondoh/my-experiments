"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ListResult, Product } from "@/lib/services/products";
import { formatPrice } from "@/lib/format";
import { DataTable, type PageChangeMeta } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableToolbar, type TableDensity } from "@/components/admin/TableToolbar";
import { createProductColumns } from "./products-columns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE = 24;

type ProductsClientProps = {
  initial: ListResult;
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export function ProductsClient({ initial }: ProductsClientProps) {
  const router = useRouter();
  const [rows, setRows] = React.useState<Product[]>(initial.items);
  const [nextCursor, setNextCursor] = React.useState<string | null>(initial.nextCursor ?? null);
  const [cursorStack, setCursorStack] = React.useState<(string | null)[]>([null]);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>(() => {
    const unique = new Set<string>();
    for (const item of initial.items) {
      if (item.category) {
        unique.add(item.category);
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });
  const [onSaleOnly, setOnSaleOnly] = React.useState(false);
  const [sort, setSort] = React.useState<"new" | "priceAsc" | "priceDesc" | "rating">("new");
  const [density, setDensity] = React.useState<TableDensity>("comfortable");
  const [isLoading, setIsLoading] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const initialLoadRef = React.useRef(true);

  const updateCategories = React.useCallback((items: Product[]) => {
    setCategoryOptions(prev => {
      const next = new Set(prev);
      for (const item of items) {
        if (item.category) {
          next.add(item.category);
        }
      }
      return Array.from(next).sort((a, b) => a.localeCompare(b));
    });
  }, []);

  const fetchPage = React.useCallback(
    async (
      cursor: string | null,
      meta: { direction?: PageChangeMeta["direction"] } = {},
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", PAGE_SIZE.toString());
        if (cursor) {
          params.set("cursor", cursor);
        }
        if (debouncedSearch) {
          params.set("q", debouncedSearch);
        }
        if (category && category !== "all") {
          params.set("category", category);
        }
        if (onSaleOnly) {
          params.set("onSale", "true");
        }
        if (sort) {
          params.set("sort", sort);
        }

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as ListResult;
        setRows(payload.items);
        setNextCursor(payload.nextCursor ?? null);
        updateCategories(payload.items);
        setCursorStack(prev => {
          if (meta.direction === "next") {
            return cursor != null ? [...prev, cursor] : prev;
          }
          if (meta.direction === "previous") {
            return prev.length > 1 ? prev.slice(0, -1) : prev;
          }
          if (meta.direction === "reset") {
            return [null];
          }
          return prev;
        });
      } catch (error) {
        console.error("Failed to load products", error);
        toast.error("Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedSearch, category, onSaleOnly, sort, updateCategories],
  );

  React.useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    void fetchPage(null, { direction: "reset" });
  }, [debouncedSearch, category, onSaleOnly, sort, fetchPage]);

  const handlePageChange = React.useCallback(
    (cursor: string | null, meta?: PageChangeMeta) => {
      if (meta?.direction === "next") {
        if (!cursor) {
          return;
        }
        void fetchPage(cursor, { direction: "next" });
        return;
      }

      if (meta?.direction === "previous") {
        if (cursorStack.length <= 1) {
          return;
        }
        void fetchPage(cursor, { direction: "previous" });
      }
    },
    [cursorStack.length, fetchPage],
  );

  const previousCursor = cursorStack.length > 1 ? cursorStack[cursorStack.length - 2] ?? null : undefined;

  const totalHint = React.useMemo(() => {
    if (rows.length === 0) {
      return "No products found";
    }
    if (nextCursor) {
      return `${rows.length} products loaded (more available)`;
    }
    return `Showing ${rows.length} products`;
  }, [rows.length, nextCursor]);

  const openEdit = React.useCallback((product: Product) => {
    setEditingProduct(product);
    setIsEditOpen(true);
  }, []);

  const openDelete = React.useCallback((product: Product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  }, []);

  const handleDeleteConfirmed = React.useCallback(async () => {
    if (!deletingProduct) {
      return;
    }
    try {
      const response = await fetch(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product ${deletingProduct.id}`);
      }

      toast.success("Product deleted");
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      const currentCursor = cursorStack[cursorStack.length - 1] ?? null;
      await fetchPage(currentCursor ?? null, {});
      router.refresh();
    } catch (error) {
      console.error("Failed to delete product", error);
      toast.error("Failed to delete product. Please try again.");
    }
  }, [cursorStack, deletingProduct, fetchPage, router]);

  const columns = React.useMemo(
    () =>
      createProductColumns({
        onView: product => router.push(`/admin/products/${product.id}`),
        onEdit: openEdit,
        onDelete: openDelete,
      }),
    [router, openEdit, openDelete],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        nextCursor={nextCursor ?? undefined}
        previousCursor={previousCursor}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        density={density}
        emptyState={<EmptyState title="No products" description="Try broadening your search or filters." />}
        totalHint={totalHint}
        toolbar={() => (
          <TableToolbar
            searchPlaceholder="Search products"
            searchValue={search}
            onSearchChange={setSearch}
            filterLabel="Category"
            filterValue={category}
            onFilterChange={setCategory}
            filterOptions={[
              { label: "All categories", value: "all" },
              ...categoryOptions.map(value => ({ label: value, value })),
            ]}
            density={density}
            onDensityChange={setDensity}
          >
            <div className="flex items-center gap-2">
              <Switch id="on-sale-toggle" checked={onSaleOnly} onCheckedChange={value => setOnSaleOnly(Boolean(value))} />
              <Label htmlFor="on-sale-toggle" className="text-sm text-muted-foreground">
                On sale only
              </Label>
            </div>
            <div className="w-40">
              <Select value={sort} onValueChange={value => setSort(value as typeof sort)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Newest</SelectItem>
                  <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                  <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TableToolbar>
        )}
      />

      <Sheet
        open={isEditOpen}
        onOpenChange={open => {
          setIsEditOpen(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
      >
        <SheetContent className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>Edit product</SheetTitle>
            <SheetDescription>
              TODO: Build product editor for <span className="font-semibold">{editingProduct?.name}</span>.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Add your edit form here. You can prefill it with the selected product.</p>
            <div className="rounded-md border p-4">
              <p className="font-medium text-foreground">Product summary</p>
              <p>Name: {editingProduct?.name ?? "Unknown"}</p>
              <p>Category: {editingProduct?.category ?? "—"}</p>
              <p>
                Price: {editingProduct ? formatPrice(editingProduct.price) : "—"}
              </p>
            </div>
          </div>
          <div className="mt-auto flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button disabled>Save changes</Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={open => {
          setIsDeleteOpen(open);
          if (!open) {
            setDeletingProduct(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingProduct?.name ?? "this product"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteOpen(false);
                setDeletingProduct(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
